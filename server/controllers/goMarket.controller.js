import Market from "../models/market.model.js";
import GroceryShop from "../models/groceryShop.model.js";
import Restaurant from "../models/restaurant.model.js";
import GroceryProduct from "../models/groceryProduct.model.js";
import RestaurantMenu from "../models/restaurantMenu.model.js";
import RestaurantItem from "../models/restaurantItem.model.js";
import GoMarketCategory from "../models/goMarketCategory.model.js";
import GoMarketSubCategory from "../models/goMarketSubCategory.model.js";
import ReviewModel from "../models/reviews.model.js";
import {
  bumpGroceryShopProductCount,
  getOrCreateDefaultRestaurantMenu,
  getSellerGroceryShop,
  getSellerRestaurant,
} from "../utils/goMarketSellerCatalog.js";
import { buildQuery, findNearbyMarkets, isObjectId, paginate, resources } from "../services/goMarket.service.js";
import { apiBaseFromRequest, resolveMediaUrl } from "../utils/resolveMediaUrl.js";

const sendError = (res, error, status = 500) => res.status(status).json({ error: true, success: false, message: error.message || error });
const GROCERY_BANNER_FALLBACK = "https://placehold.co/800x160/e8f5e9/2e7d32?text=Grocery+Shop";
const RESTAURANT_BANNER_FALLBACK = "https://placehold.co/800x160/fff3e0/e65100?text=Restaurant";
const LOGO_FALLBACK = "https://placehold.co/120x120/f5f5f5/9e9e9e?text=Store+Logo";
const ok = (res, body) => res.json({ error: false, success: true, ...body });
const required = (body, fields) => fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");

const requiredFields = {
  markets: ["name", "city", "state", "pincode", "latitude", "longitude"],
  owners: ["name", "email", "mobile"],
  "grocery-shops": ["marketId", "ownerId", "shopName", "address", "latitude", "longitude"],
  restaurants: ["marketId", "ownerId", "restaurantName", "address", "latitude", "longitude"],
  products: ["shopId", "name", "price"],
  menus: ["restaurantId", "menuName"],
  items: ["restaurantId", "menuId", "itemName", "price"],
  categories: ["name", "type"],
  subcategories: ["parentId", "name", "type"],
};

const GO_MARKET_SHOP_SELLER_ROLES = ["GROCERY_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER", "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER", "BOOKS_STATIONERY_SELLER", "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"];
const isGoMarketShopSeller = (role) => GO_MARKET_SHOP_SELLER_ROLES.includes(role);
const SELLER_ROLES = ["SELLER", "RESTAURANT_SELLER", ...GO_MARKET_SHOP_SELLER_ROLES];
const isSellerRole = (role) => SELLER_ROLES.includes(role);
const getSellerCategoryType = (role) => {
  if (role === "GROCERY_SELLER") return "grocery";
  if (role === "RESTAURANT_SELLER") return "restaurant";
  if (role === "FASHION_SELLER") return "fashion";
  if (role === "ELECTRONICS_SELLER") return "electronics";
  if (role === "MEDICAL_SELLER") return "medical";
  if (role === "BEAUTY_SELLER") return "beauty";
  if (role === "HOME_KITCHEN_SELLER") return "home_kitchen";
  if (role === "GIFTS_TOYS_SELLER") return "gifts_toys";
  if (role === "BOOKS_STATIONERY_SELLER") return "books_stationery";
  if (role === "JEWELLERY_SELLER") return "jewellery";
  if (role === "HARDWARE_SELLER") return "hardware";
  if (role === "AUTOMOBILE_SELLER") return "automobile";
  return null;
};
const getSellerOwnerIds = async (req) => {
  if (!isSellerRole(req.currentUser?.role)) return null;
  const owners = await resources.owners.model.find({
    $or: [{ userId: req.userId }, { email: req.currentUser.email }],
  }).select("_id").lean();
  return owners.map((owner) => owner._id);
};

const applySellerScope = async (resourceKey, filter, req) => {
  const ownerIds = await getSellerOwnerIds(req);
  if (!ownerIds) return filter;

  if (resourceKey === "categories") {
    const sellerType = getSellerCategoryType(req.currentUser?.role);
    if (sellerType) return { ...filter, type: sellerType };
    return filter;
  }
  if (resourceKey === "subcategories") {
    const sellerType = getSellerCategoryType(req.currentUser?.role);
    if (sellerType) return { ...filter, type: sellerType };
    return filter;
  }
  if (resourceKey === "owners") return { ...filter, _id: { $in: ownerIds } };
  if (["grocery-shops", "restaurants"].includes(resourceKey)) return { ...filter, ownerId: { $in: ownerIds } };

  if (resourceKey === "products") {
    const shops = await GroceryShop.find({ ownerId: { $in: ownerIds } }).select("_id").lean();
    return { ...filter, shopId: { $in: shops.map((shop) => shop._id) } };
  }

  if (["menus", "items"].includes(resourceKey)) {
    const restaurants = await Restaurant.find({ ownerId: { $in: ownerIds } }).select("_id").lean();
    const restaurantIds = restaurants.map((restaurant) => restaurant._id);
    return resourceKey === "menus"
      ? { ...filter, restaurantId: { $in: restaurantIds } }
      : { ...filter, restaurantId: { $in: restaurantIds } };
  }

  return filter;
};

const assertSellerCanWrite = async (resourceKey, body, req) => {
  if (!isSellerRole(req.currentUser?.role)) return body;
  const ownerIds = await getSellerOwnerIds(req);
  const ownerIdStrings = ownerIds.map(String);

  if (["grocery-shops", "restaurants"].includes(resourceKey)) {
    if (!ownerIds.length) throw Object.assign(new Error("No Go Market owner found for this seller"), { statusCode: 403 });
    return { ...body, ownerId: ownerIds[0] };
  }

  if (resourceKey === "products") {
    let shopId = body.shopId;
    if (!shopId && isGoMarketShopSeller(req.currentUser?.role)) {
      const shop = await getSellerGroceryShop(req.userId, req.currentUser.email);
      shopId = shop?._id;
    }
    const shop = await GroceryShop.findOne({ _id: shopId, ownerId: { $in: ownerIds } }).select("_id");
    if (!shop) throw Object.assign(new Error("Please select your own shop"), { statusCode: 403 });
    return { ...body, shopId: shop._id };
  }

  if (["menus", "items"].includes(resourceKey)) {
    let restaurantId = body.restaurantId;
    if (!restaurantId && req.currentUser?.role === "RESTAURANT_SELLER") {
      const restaurant = await getSellerRestaurant(req.userId, req.currentUser.email);
      restaurantId = restaurant?._id;
    }
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId: { $in: ownerIds } }).select("_id");
    if (!restaurant) throw Object.assign(new Error("Please select your own restaurant"), { statusCode: 403 });

    if (resourceKey === "items") {
      let menuId = body.menuId;
      if (!menuId) {
        const menu = await getOrCreateDefaultRestaurantMenu(restaurant._id);
        menuId = menu._id;
      }
      return {
        ...body,
        restaurantId: restaurant._id,
        menuId,
        itemName: body.itemName || body.name,
      };
    }

    return { ...body, restaurantId: restaurant._id };
  }

  if (["categories", "subcategories"].includes(resourceKey)) {
    throw Object.assign(
      new Error("Only admin can create or edit categories. Please select from categories added by admin."),
      { statusCode: 403 },
    );
  }

  if (resourceKey === "owners" && body._id && !ownerIdStrings.includes(String(body._id))) {
    throw Object.assign(new Error("You can only manage your own owner profile"), { statusCode: 403 });
  }

  return body;
};

export const listResource = (resourceKey) => async (req, res) => {
  try {
    const resource = resources[resourceKey];
    const filter = await applySellerScope(resourceKey, buildQuery(req.query, resource.searchFields), req);
    const result = await paginate(resource.model, filter, req.query, resource.populate);
    ok(res, result);
  } catch (error) { sendError(res, error); }
};

export const getResource = (resourceKey) => async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid id", 400);
    const resource = resources[resourceKey];
    const find = resource.model.findById(req.params.id);
    if (resource.populate) find.populate(resource.populate);
    const data = await find.lean();
    if (!data) return sendError(res, `${resource.label} not found`, 404);
    ok(res, { data });
  } catch (error) { sendError(res, error); }
};

export const createResource = (resourceKey) => async (req, res) => {
  try {
    let expectedFields = requiredFields[resourceKey] || [];
    if (isSellerRole(req.currentUser?.role)) {
      if (["grocery-shops", "restaurants"].includes(resourceKey)) {
        expectedFields = expectedFields.filter((field) => field !== "ownerId");
      }
      if (resourceKey === "products" && isGoMarketShopSeller(req.currentUser?.role)) {
        expectedFields = expectedFields.filter((field) => field !== "shopId");
      }
      if (resourceKey === "items" && req.currentUser?.role === "RESTAURANT_SELLER") {
        expectedFields = expectedFields.filter((field) => !["restaurantId", "menuId"].includes(field));
      }
    }
    const missing = required(req.body, expectedFields);
    if (missing.length) return sendError(res, `Missing required fields: ${missing.join(", ")}`, 400);
    const resource = resources[resourceKey];
    const payload = await assertSellerCanWrite(resourceKey, req.body, req);
    const data = await resource.model.create(payload);
    if (resourceKey === "products" && data?.shopId) {
      await bumpGroceryShopProductCount(data.shopId, 1);
    }
    ok(res, { message: `${resource.label} created`, data });
  } catch (error) { sendError(res, error, error.statusCode || 400); }
};

export const updateResource = (resourceKey) => async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid id", 400);
    const resource = resources[resourceKey];
    const existingFilter = await applySellerScope(resourceKey, { _id: req.params.id }, req);
    const existing = await resource.model.findOne(existingFilter).select("_id");
    if (!existing) return sendError(res, `${resource.label} not found`, 404);
    const payload = await assertSellerCanWrite(resourceKey, req.body, req);
    const data = await resource.model.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!data) return sendError(res, `${resource.label} not found`, 404);
    ok(res, { message: `${resource.label} updated`, data });
  } catch (error) { sendError(res, error, error.statusCode || 400); }
};

export const deleteResource = (resourceKey) => async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid id", 400);
    const resource = resources[resourceKey];
    const existingFilter = await applySellerScope(resourceKey, { _id: req.params.id }, req);
    const existing = await resource.model.findOne(existingFilter).select("_id");
    if (!existing) return sendError(res, `${resource.label} not found`, 404);
    const data = await resource.model.findByIdAndDelete(req.params.id);
    if (!data) return sendError(res, `${resource.label} not found`, 404);
    ok(res, { message: `${resource.label} deleted`, data });
  } catch (error) { sendError(res, error); }
};

export const searchMarkets = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || "").trim();
    if (!q) return ok(res, { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } });
    const result = await paginate(Market, buildQuery({ ...req.query, search: q, status: req.query.status || "active" }, resources.markets.searchFields), req.query);
    ok(res, result);
  } catch (error) { sendError(res, error); }
};

export const nearbyMarkets = async (req, res) => {
  try {
    const { latitude, longitude, limit } = req.query;
    
    console.log("📍 nearbyMarkets API called with params:", { latitude, longitude, limit });
    
    // Validate coordinates
    if (!latitude || !longitude) {
      console.warn("⚠️ Missing latitude or longitude");
      return sendError(res, "Latitude and longitude are required", 400);
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn("⚠️ Invalid coordinates (NaN):", { latitude, longitude });
      return sendError(res, "Invalid coordinates provided", 400);
    }

    console.log(`📍 Valid coordinates received: (${lat}, ${lng})`);
    const data = await findNearbyMarkets({ latitude: lat, longitude: lng, limit: Number(limit || 10) });
    
    console.log(`✅ Nearby markets API - Found ${data.length} markets for (${lat}, ${lng})`);
    ok(res, { data });
  } catch (error) {
    console.error("❌ Error in nearbyMarkets API:", error);
    sendError(res, error);
  }
};

export const getMarketDetail = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid market id", 400);
    const market = await Market.findById(req.params.id).lean();
    if (!market || market.status !== "active") return sendError(res, "No Market Available", 404);
    const [groceryShops, restaurants] = await Promise.all([
      GroceryShop.find({ marketId: req.params.id }).populate("ownerId").lean(),
      Restaurant.find({ marketId: req.params.id }).populate("ownerId").lean(),
    ]);
    ok(res, { data: { market, groceryShops, restaurants } });
  } catch (error) { sendError(res, error); }
};

export const getGroceryShopDetail = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid shop id", 400);
    const shopDoc = await GroceryShop.findById(req.params.id).populate("marketId ownerId").lean();
    if (!shopDoc) return sendError(res, "Grocery shop not found", 404);
    const { enrichOutletWithReviews, OUTLET_TARGET } = await import("../services/goMarketReview.service.js");
    const baseUrl = apiBaseFromRequest(req);
    const shopRaw = await enrichOutletWithReviews(shopDoc, OUTLET_TARGET.GROCERY, req.userId);
    const shop = {
      ...shopRaw,
      shopBanner: shopRaw.shopBanner?.trim() ? resolveMediaUrl(shopRaw.shopBanner, baseUrl) : GROCERY_BANNER_FALLBACK,
      shopLogo: shopRaw.shopLogo?.trim() ? resolveMediaUrl(shopRaw.shopLogo, baseUrl) : LOGO_FALLBACK,
    };
    const products = await GroceryProduct.find({ shopId: req.params.id }).lean();
    ok(res, { data: { shop, products } });
  } catch (error) { sendError(res, error); }
};

export const getRestaurantDetail = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid restaurant id", 400);
    const restaurantDoc = await Restaurant.findById(req.params.id).populate("marketId ownerId").lean();
    if (!restaurantDoc) return sendError(res, "Restaurant not found", 404);
    const { enrichOutletWithReviews, OUTLET_TARGET } = await import("../services/goMarketReview.service.js");
    const baseUrl = apiBaseFromRequest(req);
    const restaurantRaw = await enrichOutletWithReviews(restaurantDoc, OUTLET_TARGET.RESTAURANT, req.userId);
    const restaurant = {
      ...restaurantRaw,
      restaurantBanner: restaurantRaw.restaurantBanner?.trim() ? resolveMediaUrl(restaurantRaw.restaurantBanner, baseUrl) : RESTAURANT_BANNER_FALLBACK,
      restaurantLogo: restaurantRaw.restaurantLogo?.trim() ? resolveMediaUrl(restaurantRaw.restaurantLogo, baseUrl) : LOGO_FALLBACK,
    };
    const [menus, items] = await Promise.all([RestaurantMenu.find({ restaurantId: req.params.id }).lean(), RestaurantItem.find({ restaurantId: req.params.id }).lean()]);
    
    // Add totalItems and totalMenus counts to restaurant object
    restaurant.totalItems = items.length;
    restaurant.totalMenus = menus.length;
    
    // Get product rating stats from reviews
    const itemIds = items.map((i) => String(i._id));
    if (itemIds.length > 0) {
      const ratingAgg = await ReviewModel.aggregate([
        { $match: { productId: { $in: itemIds } } },
        { $group: { _id: null, averageRating: { $avg: { $toDouble: "$rating" } }, reviewCount: { $sum: 1 } } },
      ]);
      if (ratingAgg.length > 0) {
        restaurant.rating = ratingAgg[0].averageRating ? Number(ratingAgg[0].averageRating.toFixed(1)) : 0;
        restaurant.totalReviews = ratingAgg[0].reviewCount || 0;
      }
    }
    
    ok(res, { data: { restaurant, menus, items } });
  } catch (error) { sendError(res, error); }
};

export const followShop = async (req, res) => {
  try {
    const userId = req.userId;
    const { shopId } = req.body;
    if (!userId || !isObjectId(shopId)) return sendError(res, "Valid shopId and login are required", 400);
    const shop = await GroceryShop.findByIdAndUpdate(shopId, { $addToSet: { followers: userId } }, { new: true });
    if (!shop) return sendError(res, "Grocery shop not found", 404);
    ok(res, {
      message: "Shop followed",
      data: {
        shopId: shop._id,
        followerCount: shop.followers?.length || 0,
        isFollowing: true,
      },
    });
  } catch (error) { sendError(res, error); }
};

export const unfollowShop = async (req, res) => {
  try {
    const userId = req.userId;
    const { shopId } = req.body;
    if (!userId || !isObjectId(shopId)) return sendError(res, "Valid shopId and login are required", 400);
    const shop = await GroceryShop.findByIdAndUpdate(shopId, { $pull: { followers: userId } }, { new: true });
    if (!shop) return sendError(res, "Grocery shop not found", 404);
    ok(res, {
      message: "Unfollowed shop",
      data: {
        shopId: shop._id,
        followerCount: shop.followers?.length || 0,
        isFollowing: false,
      },
    });
  } catch (error) { sendError(res, error); }
};

export const followRestaurant = async (req, res) => {
  try {
    const userId = req.userId;
    const { restaurantId } = req.body;
    if (!userId || !isObjectId(restaurantId)) return sendError(res, "Valid restaurantId and login are required", 400);
    const restaurant = await Restaurant.findByIdAndUpdate(restaurantId, { $addToSet: { followers: userId } }, { new: true });
    if (!restaurant) return sendError(res, "Restaurant not found", 404);
    ok(res, {
      message: "Restaurant followed",
      data: {
        restaurantId: restaurant._id,
        followerCount: restaurant.followers?.length || 0,
        isFollowing: true,
      },
    });
  } catch (error) { sendError(res, error); }
};

export const unfollowRestaurant = async (req, res) => {
  try {
    const userId = req.userId;
    const { restaurantId } = req.body;
    if (!userId || !isObjectId(restaurantId)) return sendError(res, "Valid restaurantId and login are required", 400);
    const restaurant = await Restaurant.findByIdAndUpdate(restaurantId, { $pull: { followers: userId } }, { new: true });
    if (!restaurant) return sendError(res, "Restaurant not found", 404);
    ok(res, {
      message: "Unfollowed restaurant",
      data: {
        restaurantId: restaurant._id,
        followerCount: restaurant.followers?.length || 0,
        isFollowing: false,
      },
    });
  } catch (error) { sendError(res, error); }
};

export const setPreferredMarket = async (req, res) => {
  try {
    const userId = req.userId;
    const { marketId, location, address } = req.body;
    
    console.log("📍 setPreferredMarket called with:", { marketId, location, address });
    
    if (!userId) return sendError(res, "Login required", 401);
    if (!marketId || !isObjectId(marketId)) return sendError(res, "Valid marketId is required", 400);
    
    // Verify market exists and is active
    const market = await Market.findOne({ _id: marketId, status: "active" }).lean();
    if (!market) return sendError(res, "Market not found or inactive", 404);
    
    // Import UserModel dynamically to avoid circular dependency
    const UserModel = (await import("../models/user.model.js")).default;
    
    const update = { preferredMarketId: marketId };
    
    // Validate and save location in GeoJSON format
    if (location && Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng))) {
      const lat = Number(location.lat);
      const lng = Number(location.lng);
      
      console.log("✅ Valid location coordinates:", { lat, lng });
      console.log("📝 Saving in GeoJSON format: [lng, lat] =", [lng, lat]);
      
      update.goMarketLocation = {
        type: "Point",
        coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
        address: String(address || `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`),
        updatedAt: new Date(),
      };
    } else {
      console.warn("⚠️ Invalid location provided:", location);
    }

    // Update user's preferred market
    const user = await UserModel.findByIdAndUpdate(
      userId,
      update,
      { new: true }
    ).select("preferredMarketId goMarketLocation");
    
    if (!user) return sendError(res, "User not found", 404);
    
    console.log("💾 Saved goMarketLocation:", user?.goMarketLocation);
    
    ok(res, { message: "Preferred market saved", data: { preferredMarketId: marketId, goMarketLocation: user?.goMarketLocation || null } });
  } catch (error) {
    console.error("❌ setPreferredMarket error:", error);
    sendError(res, error);
  }
};

// DEBUG ENDPOINT - Check what markets exist
export const debugMarkets = async (req, res) => {
  try {
    const markets = await Market.find({ status: "active" }).lean();
    const marketsWithCoords = markets.filter(m => m.latitude != null && m.longitude != null);
    const marketsWithoutCoords = markets.filter(m => !m.latitude || !m.longitude);
    
    console.log(`\n📍 MARKET DEBUG INFO:`);
    console.log(`Total active markets: ${markets.length}`);
    console.log(`Markets with coordinates: ${marketsWithCoords.length}`);
    console.log(`Markets without coordinates: ${marketsWithoutCoords.length}\n`);
    
    ok(res, { 
      summary: {
        total: markets.length,
        withCoords: marketsWithCoords.length,
        withoutCoords: marketsWithoutCoords.length
      },
      withCoords: marketsWithCoords.map(m => ({ _id: m._id, name: m.name, lat: m.latitude, lng: m.longitude })),
      withoutCoords: marketsWithoutCoords.map(m => ({ _id: m._id, name: m.name }))
    });
  } catch (error) {
    sendError(res, error);
  }
};

// ADD TEST COORDINATES TO MARKETS
export const addTestCoordinatesToMarkets = async (req, res) => {
  try {
    const testCoordinates = [
      { lat: 28.6139, lng: 77.2090 }, // Delhi
      { lat: 19.0760, lng: 72.8777 }, // Mumbai
      { lat: 13.0827, lng: 80.2707 }, // Chennai
      { lat: 23.1815, lng: 79.9864 }, // Indore
      { lat: 31.6340, lng: 74.8711 }, // Lahore
    ];

    const markets = await Market.find({ status: "active" }).lean();
    const updates = [];

    for (let i = 0; i < markets.length; i++) {
      const coords = testCoordinates[i % testCoordinates.length];
      // Add some random offset to avoid all markets being at the same location
      const lat = coords.lat + (Math.random() - 0.5) * 0.1;
      const lng = coords.lng + (Math.random() - 0.5) * 0.1;
      
      const updated = await Market.findByIdAndUpdate(
        markets[i]._id,
        { latitude: lat, longitude: lng },
        { new: true }
      ).lean();
      
      updates.push(updated);
      console.log(`✅ Updated ${updated.name} with coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }

    ok(res, { 
      message: `Updated ${updates.length} markets with test coordinates`,
      markets: updates.map(m => ({ _id: m._id, name: m.name, lat: m.latitude, lng: m.longitude }))
    });
  } catch (error) {
    sendError(res, error);
  }
};
