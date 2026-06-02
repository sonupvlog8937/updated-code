import CouponModel from "../models/coupon.model.js";
import {
  getSellerGroceryShop,
  getSellerRestaurant,
} from "../utils/goMarketSellerCatalog.js";

const SELLER_ROLES = ["GROCERY_SELLER", "RESTAURANT_SELLER"];

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
  if (request.currentUser?.role === "GROCERY_SELLER") {
    const shop = await getSellerGroceryShop(request.userId, request.currentUser?.email);
    if (!shop) throw Object.assign(new Error("Seller grocery shop not found"), { statusCode: 404 });
    return { audience: "grocery", shopId: shop._id, restaurantId: null, createdBy: request.userId };
  }
  if (request.currentUser?.role === "RESTAURANT_SELLER") {
    const restaurant = await getSellerRestaurant(request.userId, request.currentUser?.email);
    if (!restaurant) throw Object.assign(new Error("Seller restaurant not found"), { statusCode: 404 });
    return { audience: "restaurant", restaurantId: restaurant._id, shopId: null, createdBy: request.userId };
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
      title: coupon.title,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      expiresAt: coupon.expiresAt,
      audience: coupon.audience,
      shopId: coupon.shopId,
      restaurantId: coupon.restaurantId,
      productIds: coupon.productIds,
      restaurantItemIds: coupon.restaurantItemIds,
    }));

    return response.status(200).json({ success: true, error: false, data });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const validateCouponController = async (request, response) => {
  try {
    const { code = "", orderAmount = 0, shopId, restaurantId, productId, restaurantItemId } = request.body || {};
    const normalizedCode = String(code).trim().toUpperCase();

    if (!normalizedCode) {
      return response.status(400).json({ success: false, error: true, message: "Coupon code is required" });
    }

    const coupon = await CouponModel.findOne({ code: normalizedCode }).lean();
    if (!coupon || !isCouponLive(coupon)) {
      return response.status(404).json({ success: false, error: true, message: "Invalid or expired coupon" });
    }

    const matchesScope =
      coupon.audience === "global" ||
      (coupon.audience === "grocery" && (shopId || productId) && !coupon.shopId && !(coupon.productIds || []).length) ||
      (coupon.audience === "restaurant" && (restaurantId || restaurantItemId) && !coupon.restaurantId && !(coupon.restaurantItemIds || []).length) ||
      (shopId && String(coupon.shopId || "") === String(shopId)) ||
      (restaurantId && String(coupon.restaurantId || "") === String(restaurantId)) ||
      (productId && (coupon.productIds || []).some((id) => String(id) === String(productId))) ||
      (restaurantItemId && (coupon.restaurantItemIds || []).some((id) => String(id) === String(restaurantItemId)));

    if (!matchesScope) {
      return response.status(400).json({ success: false, error: true, message: "Coupon is not valid for this item", discountAmount: 0 });
    }

    const result = computeDiscount(coupon, Number(orderAmount || 0));
    if (!result.valid) {
      return response.status(400).json({ success: false, error: true, message: result.message, discountAmount: 0 });
    }

    return response.status(200).json({ success: true, error: false, ...result, code: coupon.code });
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