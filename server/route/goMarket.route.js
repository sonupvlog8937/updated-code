import express from "express";
import auth from "../middlewares/auth.js";
import optionalAuth from "../middlewares/optionalAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import {
  createResource,
  deleteResource,
  followRestaurant,
  followShop,
  unfollowRestaurant,
  unfollowShop,
  getGroceryShopDetail,
  getMarketDetail,
  getResource,
  getRestaurantDetail,
  listResource,
  nearbyMarkets,
  searchMarkets,
  updateResource,
  setPreferredMarket,
  debugMarkets,
  addTestCoordinatesToMarkets,
} from "../controllers/goMarket.controller.js";
import {
  getGroceryProductStorefront,
  getRestaurantItemStorefront,
  listMarketOutlets,
  listRestaurantItemsCatalog,
  listShopProductsCatalog,
  searchShopProducts,
  shopProductSearchSuggestions,
  restaurantItemSearchSuggestions,
  marketShopSearchSuggestions,
  shopSearchDefaults,
  shopSearchSuggestionsEnhanced,
  restaurantSearchDefaults,
  restaurantSearchSuggestionsEnhanced,
} from "../controllers/goMarketCatalog.controller.js";
import {
  addGroceryShopReview,
  addRestaurantReview,
  getGroceryShopReviews,
  getRestaurantReviews,
} from "../controllers/goMarketReview.controller.js";
import { getSellerGroceryShop, getSellerOwnerIds, getSellerRestaurant } from "../utils/goMarketSellerCatalog.js";

const router = express.Router();
const canManage = [auth, authorizeRole("ADMIN", "SELLER", "GROCERY_SELLER", "RESTAURANT_SELLER")];
const adminOnly = [auth, authorizeRole("ADMIN")];

const crud = (path, key, detailHandler = null, writeMiddleware = canManage) => {
  router.get(path, optionalAuth, listResource(key));
  router.post(path, ...writeMiddleware, createResource(key));
  router.get(`${path}/:id`, detailHandler || getResource(key));
  router.put(`${path}/:id`, ...writeMiddleware, updateResource(key));
  router.delete(`${path}/:id`, ...writeMiddleware, deleteResource(key));
};

router.get("/markets/search", searchMarkets);
router.get("/markets/nearby", nearbyMarkets);
router.get("/markets/debug/info", debugMarkets);
router.post("/markets/debug/add-test-coordinates", addTestCoordinatesToMarkets);
router.get("/markets/:marketId/outlets", optionalAuth, listMarketOutlets);
router.get("/markets/:marketId/shop-suggestions", optionalAuth, marketShopSearchSuggestions);
router.get("/grocery-shops/:shopId/catalog", optionalAuth, listShopProductsCatalog);
router.get("/grocery-shops/:shopId/search", optionalAuth, searchShopProducts);
router.get("/grocery-shops/:shopId/search-suggestions", optionalAuth, shopSearchSuggestionsEnhanced);
router.get("/grocery-shops/:shopId/search-defaults", optionalAuth, shopSearchDefaults);
router.get("/grocery-shops/:shopId/reviews", optionalAuth, getGroceryShopReviews);
router.post("/grocery-shops/:shopId/reviews", auth, addGroceryShopReview);
router.get("/restaurants/:restaurantId/catalog", optionalAuth, listRestaurantItemsCatalog);
router.get("/restaurants/:restaurantId/search", optionalAuth, listRestaurantItemsCatalog);
router.get("/restaurants/:restaurantId/search-suggestions", optionalAuth, restaurantSearchSuggestionsEnhanced);
router.get("/restaurants/:restaurantId/search-defaults", optionalAuth, restaurantSearchDefaults);
router.get("/restaurants/:restaurantId/reviews", optionalAuth, getRestaurantReviews);
router.post("/restaurants/:restaurantId/reviews", auth, addRestaurantReview);
router.get("/catalog/grocery-product/:id", optionalAuth, getGroceryProductStorefront);
router.get("/catalog/restaurant-item/:id", optionalAuth, getRestaurantItemStorefront);
crud("/markets", "markets", getMarketDetail);
crud("/owners", "owners");
router.get("/grocery-shops/:id", optionalAuth, getGroceryShopDetail);
router.get("/restaurants/:id", optionalAuth, getRestaurantDetail);
router.get("/grocery-shops", optionalAuth, listResource("grocery-shops"));
router.post("/grocery-shops", ...canManage, createResource("grocery-shops"));
router.put("/grocery-shops/:id", ...canManage, updateResource("grocery-shops"));
router.delete("/grocery-shops/:id", ...canManage, deleteResource("grocery-shops"));
router.get("/restaurants", optionalAuth, listResource("restaurants"));
router.post("/restaurants", ...canManage, createResource("restaurants"));
router.put("/restaurants/:id", ...canManage, updateResource("restaurants"));
router.delete("/restaurants/:id", ...canManage, deleteResource("restaurants"));
crud("/products", "products");
crud("/menus", "menus");
crud("/items", "items");
crud("/categories", "categories", null, adminOnly);
crud("/subcategories", "subcategories", null, adminOnly);

router.get("/products/shop/:shopId", (req, res, next) => {
  req.query.shopId = req.params.shopId;
  return listResource("products")(req, res, next);
});
router.get("/menus/restaurant/:restaurantId", (req, res, next) => {
  req.query.restaurantId = req.params.restaurantId;
  return listResource("menus")(req, res, next);
});
router.get("/items/menu/:menuId", (req, res, next) => {
  req.query.menuId = req.params.menuId;
  return listResource("items")(req, res, next);
});

router.post("/follow-shop", auth, followShop);
router.post("/unfollow-shop", auth, unfollowShop);
router.post("/follow-restaurant", auth, followRestaurant);
router.post("/unfollow-restaurant", auth, unfollowRestaurant);
router.post("/set-preferred-market", auth, setPreferredMarket);

// ─── Seller GoMarket Shop Profile ─────────────────────────────────────────
const sellerOwnerFilter = async (req) => {
  const ownerIds = await getSellerOwnerIds(req.userId, req.currentUser?.email);
  return ownerIds.length ? { ownerId: { $in: ownerIds } } : { ownerId: req.userId };
};

// All GoMarket shop sellers
const GO_MARKET_SHOP_SELLERS = [
  'GROCERY_SELLER', 'FASHION_SELLER', 'ELECTRONICS_SELLER', 'MEDICAL_SELLER',
  'BEAUTY_SELLER', 'HOME_KITCHEN_SELLER', 'GIFTS_TOYS_SELLER',
  'BOOKS_STATIONERY_SELLER', 'JEWELLERY_SELLER', 'HARDWARE_SELLER', 'AUTOMOBILE_SELLER'
];

const pickDefined = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const normalizeSellerLocationPayload = (payload) => {
  ["latitude", "longitude"].forEach((key) => {
    if (payload[key] === "" || payload[key] === null) delete payload[key];
    else if (payload[key] !== undefined) payload[key] = Number(payload[key]);
    if (payload[key] !== undefined && !Number.isFinite(payload[key])) delete payload[key];
  });
  if (payload.latitude !== undefined && payload.longitude !== undefined) payload.locationUpdatedAt = new Date();
  return payload;
};

router.get("/seller/grocery-shop", auth, authorizeRole(...GO_MARKET_SHOP_SELLERS), async (req, res) => {
  try {
    let shop = await getSellerGroceryShop(req.userId, req.currentUser?.email);

    // Auto-provision: if the seller has no shop yet, try to create one from their stored storeProfile
    if (!shop) {
      try {
        const UserModel = (await import("../models/user.model.js")).default;
        const ShopOwner = (await import("../models/shopOwner.model.js")).default;
        const GroceryShop = (await import("../models/groceryShop.model.js")).default;
        const Market = (await import("../models/market.model.js")).default;

        const user = await UserModel.findById(req.userId).lean();
        const marketId = user?.storeProfile?.marketId;
        const storeName = user?.storeProfile?.storeName || user?.name || "My Shop";

        // Upsert ShopOwner
        const owner = await ShopOwner.findOneAndUpdate(
          { $or: [{ userId: req.userId }, { email: req.currentUser.email }] },
          {
            $set: {
              userId: req.userId,
              name: user?.name || "",
              email: req.currentUser.email,
              mobile: String(user?.storeProfile?.contactNo || user?.mobile || ""),
              avatar: user?.avatar || "",
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (marketId) {
          const market = await Market.findById(marketId).lean();
          if (market) {
            const address = user?.storeProfile?.location ||
              [market.name, market.city, market.state, market.pincode].filter(Boolean).join(", ");
            shop = await GroceryShop.create({
              marketId: market._id,
              ownerId: owner._id,
              shopName: storeName,
              shopBanner: user?.storeProfile?.image || "",
              address,
              latitude: market.latitude,
              longitude: market.longitude,
              description: user?.storeProfile?.description || "",
              isOpen: true,
            });
          }
        }
      } catch (provisionErr) {
        console.error("Shop auto-provision error:", provisionErr.message);
      }
    }

    if (!shop) return res.json({ success: false, message: "Shop not found. Please complete your seller registration or contact support." });
    res.json({ success: true, shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/seller/grocery-shop", auth, authorizeRole(...GO_MARKET_SHOP_SELLERS), async (req, res) => {
  try {
    const GroceryShop = (await import("../models/groceryShop.model.js")).default;
    const { shopName, shopBanner, shopLogo, address, description, latitude, longitude, deliveryMinutes } = req.body;
    const payload = normalizeSellerLocationPayload(pickDefined({ shopName, shopBanner, shopLogo, address, description, latitude, longitude }));
    if (deliveryMinutes !== undefined) {
      const minutes = Number(deliveryMinutes) || 15;
      payload.deliveryMinutes = Math.max(15, Math.min(120, minutes));
    }
    const shop = await GroceryShop.findOneAndUpdate(
      await sellerOwnerFilter(req),
      payload,
      { new: true, lean: true, runValidators: true }
    );
    if (!shop) return res.json({ success: false, message: "Shop not found" });
    res.json({ success: true, message: "Shop updated successfully", shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/seller/restaurant", auth, authorizeRole("RESTAURANT_SELLER"), async (req, res) => {
  try {
    const restaurant = await getSellerRestaurant(req.userId, req.currentUser?.email);
    if (!restaurant) return res.json({ success: false, message: "Restaurant not found" });
    res.json({
      success: true,
      shop: {
        ...restaurant,
        shopName: restaurant.restaurantName,
        shopBanner: restaurant.restaurantBanner,
        shopLogo: restaurant.restaurantLogo,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/seller/restaurant", auth, authorizeRole("RESTAURANT_SELLER"), async (req, res) => {
  try {
    const Restaurant = (await import("../models/restaurant.model.js")).default;
    const { shopName, shopBanner, shopLogo, restaurantName, restaurantBanner, restaurantLogo, address, description, latitude, longitude, deliveryMinutes, avgPrepMinutes } = req.body;
    const payload = normalizeSellerLocationPayload(pickDefined({
      restaurantName: restaurantName || shopName,
      restaurantBanner: restaurantBanner ?? shopBanner,
      restaurantLogo: restaurantLogo ?? shopLogo,
      address,
      description,
      latitude,
      longitude,
      avgPrepMinutes,
    }));
    if (deliveryMinutes !== undefined) {
      const minutes = Number(deliveryMinutes) || 25;
      payload.deliveryMinutes = Math.max(25, Math.min(120, minutes));
    }
    const restaurant = await Restaurant.findOneAndUpdate(
      await sellerOwnerFilter(req),
      payload,
      { new: true, lean: true, runValidators: true }
    );
    if (!restaurant) return res.json({ success: false, message: "Restaurant not found" });
    res.json({
      success: true,
      message: "Restaurant updated successfully",
      shop: {
        ...restaurant,
        shopName: restaurant.restaurantName,
        shopBanner: restaurant.restaurantBanner,
        shopLogo: restaurant.restaurantLogo,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
