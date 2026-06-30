import CouponModel from "../models/coupon.model.js";
import {
  getSellerGroceryShop,
  getSellerRestaurant,
} from "../utils/goMarketSellerCatalog.js";

const SELLER_ROLES = ["GROCERY_SELLER", "RESTAURANT_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER", "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER", "BOOKS_STATIONERY_SELLER", "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"];

const isCouponLive = (coupon) => {
  const now = new Date();
  if (!coupon.isActive) return false;
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return false;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return false;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return false;
  return true;
};

const computeDiscount = (coupon, orderAmount) => {
  if (orderAmount < Number(coupon.minOrderAmount || 0)) {
    return { valid: false, discountAmount: 0, message: `Minimum order ₹${coupon.minOrderAmount} required` };
  }

  let discountAmount = 0;
  if (coupon.type === "percentage") {
    discountAmount = Math.round((orderAmount * Number(coupon.value || 0)) / 100);
  } else {
    discountAmount = Number(coupon.value || 0);
  }

  if (coupon.maxDiscountAmount !== null && discountAmount > coupon.maxDiscountAmount) {
    discountAmount = Number(coupon.maxDiscountAmount);
  }

  discountAmount = Math.min(discountAmount, orderAmount);

  return {
    valid: true,
    discountAmount,
    message: `${coupon.code} applied successfully`,
  };
};

const publicCouponQuery = (request) => {
  const audience = String(request.query?.audience || "").toLowerCase();
  const query = { isActive: true };
  const scopes = [{ audience: "global" }];

  if (audience === "grocery") scopes.push({ audience: "grocery" });
  if (audience === "restaurant") scopes.push({ audience: "restaurant" });
  if (request.query?.shopId) scopes.push({ shopId: request.query.shopId });
  if (request.query?.restaurantId) scopes.push({ restaurantId: request.query.restaurantId });
  if (request.query?.productId) scopes.push({ productIds: request.query.productId });
  if (request.query?.restaurantItemId) scopes.push({ restaurantItemIds: request.query.restaurantItemId });

  query.$or = scopes;
  return query;
};

const sellerScope = async (request) => {
  // Map all shop seller roles (non-restaurant)
  const SHOP_SELLER_ROLES = [
    "GROCERY_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER",
    "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER", "BOOKS_STATIONERY_SELLER",
    "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"
  ];
  
  const ROLE_TO_AUDIENCE = {
    GROCERY_SELLER: "grocery",
    RESTAURANT_SELLER: "restaurant",
    FASHION_SELLER: "fashion",
    ELECTRONICS_SELLER: "electronics",
    MEDICAL_SELLER: "medical",
    BEAUTY_SELLER: "beauty",
    HOME_KITCHEN_SELLER: "home_kitchen",
    GIFTS_TOYS_SELLER: "gifts_toys",
    BOOKS_STATIONERY_SELLER: "books_stationery",
    JEWELLERY_SELLER: "jewellery",
    HARDWARE_SELLER: "hardware",
    AUTOMOBILE_SELLER: "automobile",
  };
  
  const userRole = request.currentUser?.role;
  
  // Handle restaurant seller
  if (userRole === "RESTAURANT_SELLER") {
    const restaurant = await getSellerRestaurant(request.userId, request.currentUser?.email);
    if (!restaurant) throw Object.assign(new Error("Seller restaurant not found"), { statusCode: 404 });
    return { audience: "restaurant", restaurantId: restaurant._id, shopId: null, createdBy: request.userId };
  }
  
  // Handle all shop-based sellers (grocery, fashion, electronics, etc.)
  if (SHOP_SELLER_ROLES.includes(userRole)) {
    const shop = await getSellerGroceryShop(request.userId, request.currentUser?.email);
    if (!shop) throw Object.assign(new Error("Seller shop not found"), { statusCode: 404 });
    const audience = ROLE_TO_AUDIENCE[userRole] || "grocery";
    return { audience, shopId: shop._id, restaurantId: null, createdBy: request.userId };
  }
  
  return null;
};

const normalizeCouponPayload = (body = {}) => ({
  ...body,
  code: String(body.code || "").trim().toUpperCase(),
  value: Number(body.value || 0),
  minOrderAmount: Number(body.minOrderAmount || 0),
  maxDiscountAmount: body.maxDiscountAmount === "" || body.maxDiscountAmount === undefined ? null : body.maxDiscountAmount,
  usageLimit: body.usageLimit === "" || body.usageLimit === undefined ? null : body.usageLimit,
});


export const getActiveCouponsController = async (request, response) => {
  try {
    const coupons = await CouponModel.find(publicCouponQuery(request)).sort({ createdAt: -1 }).lean();
    const data = coupons.filter(isCouponLive).map((coupon) => ({
      _id: coupon._id,
      code: coupon.code,
      discount: coupon.value,
      discountType: coupon.type === "percentage" ? "percentage" : "fixed",
      minOrder: coupon.minOrderAmount || 0,
      maxDiscount: coupon.maxDiscountAmount,
      label: coupon.title || coupon.description,
      title: coupon.title,
      description: coupon.description,
      expiryDate: coupon.expiresAt,
      isActive: coupon.isActive,
      audience: coupon.audience,
      shopId: coupon.shopId,
      restaurantId: coupon.restaurantId,
      productIds: coupon.productIds,
      restaurantItemIds: coupon.restaurantItemIds,
    }));

    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const validateCouponController = async (request, response) => {
  try {
    const { code = "", orderAmount = 0, orderTotal = 0, shopId, restaurantId, productId, restaurantItemId } = request.body || {};
    const normalizedCode = String(code).trim().toUpperCase();
    const totalAmount = Number(orderTotal || orderAmount || 0);

    if (!normalizedCode) {
      return response.status(400).json({ success: false, error: true, message: "Coupon code is required" });
    }

    const coupon = await CouponModel.findOne({ code: normalizedCode }).lean();
    if (!coupon || !isCouponLive(coupon)) {
      return response.status(404).json({ success: false, error: true, message: "Invalid or expired coupon" });
    }

    // Check coupon scope - improved logic for all shop types
    const matchesScope =
      // Global coupon - valid everywhere
      coupon.audience === "global" ||
      
      // Shop-scoped coupons (grocery, fashion, electronics, etc.)
      // Valid if: coupon has shopId AND it matches the cart's shopId
      (shopId && coupon.shopId && String(coupon.shopId) === String(shopId)) ||
      
      // Restaurant-scoped coupons
      // Valid if: coupon has restaurantId AND it matches the cart's restaurantId
      (restaurantId && coupon.restaurantId && String(coupon.restaurantId) === String(restaurantId)) ||
      
      // Generic audience without specific shop (legacy support)
      (coupon.audience === "grocery" && (shopId || productId) && !coupon.shopId && !(coupon.productIds || []).length) ||
      (coupon.audience === "restaurant" && (restaurantId || restaurantItemId) && !coupon.restaurantId && !(coupon.restaurantItemIds || []).length) ||
      
      // Product-specific coupons
      (productId && (coupon.productIds || []).some((id) => String(id) === String(productId))) ||
      (restaurantItemId && (coupon.restaurantItemIds || []).some((id) => String(id) === String(restaurantItemId)));

    if (!matchesScope) {
      return response.status(400).json({ success: false, error: true, message: "This coupon is not valid for this shop", discountAmount: 0 });
    }

    const result = computeDiscount(coupon, totalAmount);
    if (!result.valid) {
      return response.status(400).json({ success: false, error: true, message: result.message, discountAmount: 0 });
    }

    // Return coupon data in application-friendly format
    return response.status(200).json({ 
      success: true, 
      error: false, 
      message: result.message,
      discountAmount: result.discountAmount,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discount: result.discountAmount,
        discountType: coupon.type === "percentage" ? "percentage" : "fixed",
        minOrder: coupon.minOrderAmount || 0,
        maxDiscount: coupon.maxDiscountAmount,
        label: coupon.title || coupon.description,
        expiryDate: coupon.expiresAt,
        isActive: coupon.isActive,
      }
    });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const getAllCouponsAdminController = async (request, response) => {
  try {
    const coupons = await CouponModel.find().sort({ createdAt: -1 });
    return response.status(200).json({ success: true, error: false, data: coupons });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const getSellerCouponsController = async (request, response) => {
  try {
    const scope = await sellerScope(request);
    const query = scope.audience === "grocery" ? { shopId: scope.shopId } : { restaurantId: scope.restaurantId };
    const coupons = await CouponModel.find(query).sort({ createdAt: -1 });
    return response.status(200).json({ success: true, error: false, data: coupons });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ success: false, error: true, message: error.message || error });
  }
};

export const createCouponController = async (request, response) => {
  try {
    const scope = SELLER_ROLES.includes(request.currentUser?.role) ? await sellerScope(request) : { audience: request.body?.audience || "global", createdBy: request.userId };
    const payload = { ...normalizeCouponPayload(request.body), ...scope };

    const coupon = await CouponModel.create(payload);
    return response.status(201).json({ success: true, error: false, message: "Coupon created", data: coupon });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ success: false, error: true, message: error.message || error });
  }
};

export const updateCouponController = async (request, response) => {
  try {
    const payload = normalizeCouponPayload(request.body);
    let query = { _id: request.params.id };
    if (SELLER_ROLES.includes(request.currentUser?.role)) {
      const scope = await sellerScope(request);
      query = scope.audience === "grocery" ? { ...query, shopId: scope.shopId } : { ...query, restaurantId: scope.restaurantId };
      Object.assign(payload, scope);
    }

    const coupon = await CouponModel.findOneAndUpdate(query, payload, { new: true, runValidators: true });
    if (!coupon) {
      return response.status(404).json({ success: false, error: true, message: "Coupon not found" });
    }

    return response.status(200).json({ success: true, error: false, message: "Coupon updated", data: coupon });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ success: false, error: true, message: error.message || error });
  }
};

export const deleteCouponController = async (request, response) => {
  try {
    let query = { _id: request.params.id };
    if (SELLER_ROLES.includes(request.currentUser?.role)) {
      const scope = await sellerScope(request);
      query = scope.audience === "grocery" ? { ...query, shopId: scope.shopId } : { ...query, restaurantId: scope.restaurantId };
    }
    const coupon = await CouponModel.findOneAndDelete(query);
    if (!coupon) {
      return response.status(404).json({ success: false, error: true, message: "Coupon not found" });
    }

    return response.status(200).json({ success: true, error: false, message: "Coupon deleted" });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ success: false, error: true, message: error.message || error });
  }
};