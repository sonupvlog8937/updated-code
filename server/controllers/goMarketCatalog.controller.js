import Market from "../models/market.model.js";
import GroceryShop from "../models/groceryShop.model.js";
import Restaurant from "../models/restaurant.model.js";
import GroceryProduct from "../models/groceryProduct.model.js";
import RestaurantItem from "../models/restaurantItem.model.js";
import RestaurantMenu from "../models/restaurantMenu.model.js";
import GoMarketCategory from "../models/goMarketCategory.model.js";
import GoMarketSubCategory from "../models/goMarketSubCategory.model.js";
import ReviewModel from "../models/reviews.model.js";
import { buildQuery, isObjectId, paginate } from "../services/goMarket.service.js";
import {
  OUTLET_TARGET,
  enrichOutletWithReviews,
} from "../services/goMarketReview.service.js";
import { displayProductTitle, mergeSpecifications } from "../utils/productSpecs.js";
import { apiBaseFromRequest, resolveMediaUrl } from "../utils/resolveMediaUrl.js";
import { buildProductOptionsFromSpecs } from "../utils/productOptions.js";
import { rankSuggestions } from "../utils/searchSuggest.js";

const ok = (res, body) => res.json({ error: false, success: true, ...body });

// Fallback images when shops don't have banners/logos
const GROCERY_BANNER_FALLBACK = "https://placehold.co/800x160/e8f5e9/2e7d32?text=Grocery+Shop";
const RESTAURANT_BANNER_FALLBACK = "https://placehold.co/800x160/fff3e0/e65100?text=Restaurant";
const LOGO_FALLBACK = "https://placehold.co/120x120/f5f5f5/9e9e9e?text=Store+Logo";

const productReviewStatsForIds = async (ids = []) => {
  const stringIds = ids.map((id) => String(id)).filter(Boolean);
  if (!stringIds.length) return new Map();
  const rows = await ReviewModel.aggregate([
    { $match: { productId: { $in: stringIds } } },
    { $group: { _id: "$productId", averageRating: { $avg: { $toDouble: "$rating" } }, totalReviews: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), {
    averageRating: Number(r.averageRating || 0),
    totalReviews: Number(r.totalReviews || 0),
  }]));
};

const outletProductRatingStats = async (kind, outletId) => {
  const ProductModel = kind === "restaurant" ? RestaurantItem : GroceryProduct;
  const outletKey = kind === "restaurant" ? "restaurantId" : "shopId";
  const products = await ProductModel.find({ [outletKey]: outletId }).select("_id").lean();
  const ids = products.map((p) => String(p._id));
  if (!ids.length) return { rating: 0, reviewCount: 0 };
  const rows = await ReviewModel.aggregate([
    { $match: { productId: { $in: ids } } },
    { $group: { _id: null, averageRating: { $avg: { $toDouble: "$rating" } }, reviewCount: { $sum: 1 } } },
  ]);
  return {
    rating: rows[0]?.averageRating ? Number(rows[0].averageRating.toFixed(1)) : 0,
    reviewCount: rows[0]?.reviewCount || 0,
  };
};

const applyProductReviewStats = async (rows, baseUrl) => {
  const statsMap = await productReviewStatsForIds(rows.map((p) => p._id));
  return rows.map((p) => mapProductRow(p, baseUrl, statsMap.get(String(p._id))));
};

const mapProductRow = (p, baseUrl, reviewStats = null) => {
  const selling = p.discountPrice > 0 ? p.discountPrice : p.price;
    const discount = p.discountPrice > 0 && p.price > p.discountPrice
    ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
    : 0;
  return {
    ...p,
    image: resolveMediaUrl(p.image, baseUrl),
    images: (Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : [])).map((image) => resolveMediaUrl(image, baseUrl)).filter(Boolean),
    price: selling,
    discountPrice: p.discountPrice,
    mrp: p.price,
    oldPrice: p.price,
    discount,
    productOptions: p.productOptions || [],
    rating: reviewStats?.averageRating || p.rating || 0,
    averageRating: reviewStats?.averageRating || p.rating || 0,
    totalReviews: reviewStats?.totalReviews || 0,
    isFeatured: Boolean(p.isFeatured),
    soldCount: p.soldCount || 0,
  };
};

const sortForCatalogTab = (tab) => {
  const t = String(tab || "featured").toLowerCase();
  if (t === "latest") return "-createdAt";
  if (t === "popular") return "-soldCount -createdAt";
  return "-isFeatured -createdAt";
};

const buildGroceryCatalogFilter = async (req, shopId) => {
  const filter = buildQuery({ ...req.query, shopId }, ["name", "description", "title"]);
  if (req.query.inStock === "true") filter.stock = { $gt: 0 };
  if (String(req.query.tab || "").toLowerCase() === "featured") filter.isFeatured = true;
  if (req.query.categoryId && isObjectId(req.query.categoryId)) filter.categoryId = req.query.categoryId;
  if (req.query.subCategoryId && isObjectId(req.query.subCategoryId)) filter.subCategoryId = req.query.subCategoryId;

  const minPrice = Number(req.query.minPrice || 0);
  const maxPrice = Number(req.query.maxPrice || 0);
  if (minPrice > 0 || maxPrice > 0) {
    filter.price = { ...(filter.price || {}) };
    if (minPrice > 0) filter.price.$gte = minPrice;
    if (maxPrice > 0) filter.price.$lte = maxPrice;
  }

  const minRating = Number(req.query.minRating || 0);
  if (minRating > 0) {
    const rated = await ReviewModel.aggregate([
      { $match: { productId: { $exists: true, $ne: "" } } },
      { $group: { _id: "$productId", avg: { $avg: { $toDouble: "$rating" } } } },
      { $match: { avg: { $gte: minRating } } },
    ]);
    const ids = rated.map((r) => r._id).filter((id) => isObjectId(id));
    filter._id = ids.length ? { $in: ids } : { $in: [] };
  }

  return filter;
};

const buildShopFilterMeta = async (shopId) => {
  const rows = await GroceryProduct.find({ shopId })
    .select("price categoryId subCategoryId")
    .populate("categoryId subCategoryId")
    .lean();

  const catMap = new Map();
  const subMap = new Map();
  let minPrice = null;
  let maxPrice = null;

  for (const row of rows) {
    const price = Number(row.price || 0);
    if (price > 0) {
      minPrice = minPrice === null ? price : Math.min(minPrice, price);
      maxPrice = maxPrice === null ? price : Math.max(maxPrice, price);
    }
    if (row.categoryId?._id) {
      catMap.set(String(row.categoryId._id), {
        _id: row.categoryId._id,
        name: row.categoryId.name,
      });
    }
    if (row.subCategoryId?._id) {
      subMap.set(String(row.subCategoryId._id), {
        _id: row.subCategoryId._id,
        name: row.subCategoryId.name,
        parentId: row.subCategoryId.parentId,
      });
    }
  }

  return {
    categories: [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    subCategories: [...subMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    priceRange: { min: minPrice ?? 0, max: maxPrice ?? 0 },
    ratingOptions: [4, 3, 2],
  };
};
const sendError = (res, error, status = 500) =>
  res.status(status).json({ error: true, success: false, message: error.message || error });

const resolveOutletSort = (sortKey) => {
  const map = {
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    rating_asc: (a, b) => (a.rating || 0) - (b.rating || 0),
    name: (a, b) => String(a.displayName).localeCompare(String(b.displayName)),
    name_desc: (a, b) => String(b.displayName).localeCompare(String(a.displayName)),
    followers: (a, b) => (b.followerCount || 0) - (a.followerCount || 0),
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  };
  return map[sortKey] || map.rating;
};

const mapGroceryOutlet = (shop, userId = null, baseUrl = "") => {
  const followers = Array.isArray(shop.followers) ? shop.followers : [];
  
  // Use fallback images if empty
  const bannerUrl = shop.shopBanner?.trim() ? resolveMediaUrl(shop.shopBanner, baseUrl) : GROCERY_BANNER_FALLBACK;
  const logoUrl = shop.shopLogo?.trim() ? resolveMediaUrl(shop.shopLogo, baseUrl) : LOGO_FALLBACK;
  
  return {
    _id: shop._id,
    outletType: "grocery",
    displayName: shop.shopName,
    name: shop.shopName,
    banner: bannerUrl,
    logo: logoUrl,
    address: shop.address,
    rating: shop.rating || 0,
    reviewCount: shop.reviewCount ?? shop.totalReviews ?? 0,
    followerCount: followers.length,
    isFollowing: userId
      ? followers.some((f) => String(f?._id || f) === String(userId))
      : false,
    isOpen: shop.isOpen !== false,
    totalProducts: shop.totalProducts || 0,
    meta: `${shop.totalProducts || 0} products`,
    createdAt: shop.createdAt,
  };
};

const mapRestaurantOutlet = (r, userId = null, baseUrl = "") => {
  const followers = Array.isArray(r.followers) ? r.followers : [];
  
  // Use fallback images if empty
  const bannerUrl = r.restaurantBanner?.trim() ? resolveMediaUrl(r.restaurantBanner, baseUrl) : RESTAURANT_BANNER_FALLBACK;
  const logoUrl = r.restaurantLogo?.trim() ? resolveMediaUrl(r.restaurantLogo, baseUrl) : LOGO_FALLBACK;
  
  return {
    _id: r._id,
    outletType: "restaurant",
    displayName: r.restaurantName,
    name: r.restaurantName,
    banner: bannerUrl,
    logo: logoUrl,
    address: r.address,
    rating: r.rating || 0,
    reviewCount: r.reviewCount ?? r.totalReviews ?? 0,
    followerCount: followers.length,
    isFollowing: userId
      ? followers.some((f) => String(f?._id || f) === String(userId))
      : false,
    isOpen: r.isOpen !== false,
    totalProducts: r.totalItems || 0,
    meta: `${r.totalMenus || 0} menus · ${r.totalItems || 0} dishes`,
    createdAt: r.createdAt,
  };
};

export const marketShopSearchSuggestions = async (req, res) => {
  try {
    const { marketId } = req.params;
    if (!isObjectId(marketId)) return sendError(res, "Invalid market id", 400);

    const q = String(req.query.q || req.query.search || "").trim();
    if (!q) return ok(res, { suggestions: [] });

    // Fetch all shops and restaurants in this market
    const [groceryShops, restaurants] = await Promise.all([
      GroceryShop.find({ marketId }).select("shopName address").lean(),
      Restaurant.find({ marketId }).select("restaurantName address").lean(),
    ]);

    // Combine outlets with normalized structure
    const outlets = [
      ...groceryShops.map(s => ({ 
        _id: s._id, 
        name: s.shopName, 
        address: s.address,
        type: "grocery" 
      })),
      ...restaurants.map(r => ({ 
        _id: r._id, 
        name: r.restaurantName, 
        address: r.address,
        type: "restaurant" 
      })),
    ];

    // Use fuzzy search with typo tolerance
    const suggestions = rankSuggestions(q, outlets, {
      limit: 8,
      getLabel: (o) => o.name,
    }).map((o) => ({
      _id: o._id,
      label: o.name,
      address: o.address,
      type: o.type === "restaurant" ? "restaurant" : "shop",
    }));

    ok(res, { suggestions });
  } catch (error) {
    sendError(res, error);
  }
};

export const listMarketOutlets = async (req, res) => {
  try {
    const { marketId } = req.params;
    if (!isObjectId(marketId)) return sendError(res, "Invalid market id", 400);

    const market = await Market.findOne({ _id: marketId, status: "active" }).lean();
    if (!market) return sendError(res, "No Market Available", 404);

    const type = String(req.query.type || "all").toLowerCase();
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 48);
    const search = String(req.query.search || req.query.q || "").trim().toLowerCase();
    const minRating = Number(req.query.minRating || 0);
    const openOnly = req.query.openOnly === "true" || req.query.isOpen === "true";

    let outlets = [];

    const userId = req.userId || null;
    const baseUrl = apiBaseFromRequest(req);

    if (type === "all" || type === "grocery") {
      const groceryFilter = { marketId };
      if (openOnly) groceryFilter.isOpen = true;
      const shops = await GroceryShop.find(groceryFilter).populate("ownerId").lean();
      
      // Count products and get ratings for each grocery shop
      const shopIds = shops.map(s => s._id);
      const productCounts = await GroceryProduct.aggregate([
        { $match: { shopId: { $in: shopIds } } },
        { $group: { _id: "$shopId", count: { $sum: 1 } } },
      ]);
      const productCountMap = Object.fromEntries(productCounts.map(pc => [String(pc._id), pc.count]));
      
      // Get product ratings for each shop
      const ratingStatsPromises = shops.map(async (s) => {
        const stats = await outletProductRatingStats("grocery", s._id);
        return { shopId: String(s._id), ...stats };
      });
      const ratingStats = await Promise.all(ratingStatsPromises);
      const ratingMap = Object.fromEntries(ratingStats.map(rs => [rs.shopId, rs]));
      
      outlets.push(...shops.map((s) => {
        const mapped = mapGroceryOutlet(s, userId, baseUrl);
        const productCount = productCountMap[String(s._id)] || 0;
        const stats = ratingMap[String(s._id)] || { rating: 0, reviewCount: 0 };
        return {
          ...mapped,
          rating: stats.rating || mapped.rating || 0,
          reviewCount: stats.reviewCount || 0,
          totalProducts: productCount,
          meta: `${productCount} products`,
        };
      }));
    }

    if (type === "all" || type === "restaurant" || type === "restaurants") {
      const restFilter = { marketId };
      if (openOnly) restFilter.isOpen = true;
      const restaurants = await Restaurant.find(restFilter).populate("ownerId").lean();
      
      // Count items and get ratings for each restaurant
      const restaurantIds = restaurants.map(r => r._id);
      const itemCounts = await RestaurantItem.aggregate([
        { $match: { restaurantId: { $in: restaurantIds } } },
        { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
      ]);
      const itemCountMap = Object.fromEntries(itemCounts.map(ic => [String(ic._id), ic.count]));
      
      // Get product ratings for each restaurant
      const ratingStatsPromises = restaurants.map(async (r) => {
        const stats = await outletProductRatingStats("restaurant", r._id);
        return { restaurantId: String(r._id), ...stats };
      });
      const ratingStats = await Promise.all(ratingStatsPromises);
      const ratingMap = Object.fromEntries(ratingStats.map(rs => [rs.restaurantId, rs]));
      
      outlets.push(...restaurants.map((r) => {
        const mapped = mapRestaurantOutlet(r, userId, baseUrl);
        const itemCount = itemCountMap[String(r._id)] || 0;
        const stats = ratingMap[String(r._id)] || { rating: 0, reviewCount: 0 };
        return {
          ...mapped,
          rating: stats.rating || mapped.rating || 0,
          reviewCount: stats.reviewCount || 0,
          totalProducts: itemCount,
          meta: `${itemCount} dishes`,
        };
      }));
    }

    // Apply fuzzy search if query exists
    if (search) {
      // Use fuzzy matching with typo tolerance
      outlets = rankSuggestions(search, outlets, {
        limit: 999, // Don't limit here, we'll paginate later
        getLabel: (o) => `${o.displayName} ${o.address}`, // Search in both name and address
      });
    }
    if (minRating > 0) outlets = outlets.filter((o) => (o.rating || 0) >= minRating);

    const outletIds = outlets.map((o) => String(o._id));
    if (outletIds.length) {
      const reviewCounts = await ReviewModel.aggregate([
        {
          $match: {
            outletId: { $in: outletIds },
            targetType: { $in: [OUTLET_TARGET.GROCERY, OUTLET_TARGET.RESTAURANT] },
          },
        },
        { $group: { _id: "$outletId", count: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(reviewCounts.map((r) => [r._id, r.count]));
      outlets = outlets.map((o) => ({
        ...o,
        reviewCount: countMap[String(o._id)] ?? o.reviewCount ?? 0,
      }));
    }

    outlets.sort(resolveOutletSort(req.query.sort || "rating"));

    const total = outlets.length;
    const start = (page - 1) * limit;
    const data = outlets.slice(start, start + limit);

    const marketOut = market
      ? { ...market, banner: resolveMediaUrl(market.banner, baseUrl) }
      : market;

    ok(res, {
      market: marketOut,
      data,
      counts: {
        grocery: type === "restaurant" || type === "restaurants" ? 0 : await GroceryShop.countDocuments({ marketId }),
        restaurant: type === "grocery" ? 0 : await Restaurant.countDocuments({ marketId }),
        total: outlets.length,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    sendError(res, error);
  }
};

const productSort = (query) => {
  const map = {
    price_asc: "price",
    price: "price",
    price_desc: "-price",
    name: "name",
    name_desc: "-name",
    stock: "-stock",
    newest: "-createdAt",
  };
  return map[query.sort] || query.sort || "-createdAt";
};

const itemSort = (query) => {
  const map = {
    price_asc: "price",
    price: "price",
    price_desc: "-price",
    name: "itemName",
    name_desc: "-itemName",
    newest: "-createdAt",
    latest: "-createdAt",
    popular: "-soldCount -createdAt",
    featured: "-isFeatured -createdAt",
  };
  return map[query.sort] || map[String(query.tab || "featured").toLowerCase()] || "-isFeatured -createdAt";
};

export const listShopProductsCatalog = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!isObjectId(shopId)) return sendError(res, "Invalid shop id", 400);

    const baseUrl = apiBaseFromRequest(req);
    const shopDoc = await GroceryShop.findById(shopId).populate("marketId ownerId").lean();
    if (!shopDoc) return sendError(res, "Grocery shop not found", 404);
    const shopRaw = await enrichOutletWithReviews(shopDoc, OUTLET_TARGET.GROCERY, req.userId);
    const shop = {
      ...shopRaw,
      shopBanner: shopRaw.shopBanner?.trim() ? resolveMediaUrl(shopRaw.shopBanner, baseUrl) : GROCERY_BANNER_FALLBACK,
      shopLogo: shopRaw.shopLogo?.trim() ? resolveMediaUrl(shopRaw.shopLogo, baseUrl) : LOGO_FALLBACK,
    };

    const productStats = await outletProductRatingStats("grocery", shopId);
    shop.rating = productStats.rating || shop.rating || 0;
    shop.productAverageRating = productStats.rating;
    shop.productReviewCount = productStats.reviewCount;

    // Count total products for this shop
    const totalProducts = await GroceryProduct.countDocuments({ shopId });
    shop.totalProducts = totalProducts;

    const filter = await buildGroceryCatalogFilter(req, shopId);
    const tab = String(req.query.tab || "featured").toLowerCase();
    const sort = req.query.sort ? productSort(req.query) : sortForCatalogTab(tab);
    const result = await paginate(GroceryProduct, filter, { ...req.query, sort }, "categoryId subCategoryId");
    const filterMeta = await buildShopFilterMeta(shopId);

    ok(res, {
      shop,
      tab,
      filterMeta,
      data: await applyProductReviewStats(result.data || [], baseUrl),
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, error);
  }
};

export const shopProductSearchSuggestions = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!isObjectId(shopId)) return sendError(res, "Invalid shop id", 400);

    const q = String(req.query.q || req.query.search || "").trim();
    if (!q) return ok(res, { suggestions: [] });

    const products = await GroceryProduct.find({ shopId })
      .select("name title")
      .limit(200)
      .lean();

    const suggestions = rankSuggestions(q, products, {
      limit: 8,
      getLabel: (p) => displayProductTitle(p, p.name),
    }).map((p) => ({
      _id: p._id,
      label: displayProductTitle(p, p.name),
      type: "product",
    }));

    ok(res, { suggestions });
  } catch (error) {
    sendError(res, error);
  }
};

export const searchShopProducts = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!isObjectId(shopId)) return sendError(res, "Invalid shop id", 400);

    const baseUrl = apiBaseFromRequest(req);
    const shopDoc = await GroceryShop.findById(shopId).populate("marketId ownerId").lean();
    if (!shopDoc) return sendError(res, "Grocery shop not found", 404);
    const shopRaw = await enrichOutletWithReviews(shopDoc, OUTLET_TARGET.GROCERY, req.userId);
    const shop = {
      ...shopRaw,
      shopBanner: shopRaw.shopBanner?.trim() ? resolveMediaUrl(shopRaw.shopBanner, baseUrl) : GROCERY_BANNER_FALLBACK,
      shopLogo: shopRaw.shopLogo?.trim() ? resolveMediaUrl(shopRaw.shopLogo, baseUrl) : LOGO_FALLBACK,
    };

    const productStats = await outletProductRatingStats("grocery", shopId);
    shop.rating = productStats.rating || shop.rating || 0;
    shop.productAverageRating = productStats.rating;
    shop.productReviewCount = productStats.reviewCount;

    const filter = await buildGroceryCatalogFilter(req, shopId);
    const sort = productSort(req.query);
    const result = await paginate(GroceryProduct, filter, { ...req.query, sort }, "categoryId subCategoryId");
    const filterMeta = await buildShopFilterMeta(shopId);
    const queryLabel = String(req.query.q || req.query.search || "").trim();

    ok(res, {
      shop,
      query: queryLabel,
      filterMeta,
      data: await applyProductReviewStats(result.data || [], baseUrl),
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, error);
  }
};

const buildRestaurantCatalogFilter = (req, restaurantId) => {
  const filter = buildQuery({ ...req.query, restaurantId }, ["itemName", "description", "title"]);
  const tab = String(req.query.tab || "featured").toLowerCase();
  if (tab === "featured") filter.isFeatured = true;
  if (req.query.availableOnly === "true" || req.query.inStock === "true") filter.isAvailable = { $ne: false };
  if (req.query.categoryId && isObjectId(req.query.categoryId)) filter.categoryId = req.query.categoryId;
  if (req.query.subCategoryId && isObjectId(req.query.subCategoryId)) filter.subCategoryId = req.query.subCategoryId;
  if (req.query.minPrice) filter.price = { ...(filter.price || {}), $gte: Number(req.query.minPrice) };
  if (req.query.maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(req.query.maxPrice) };
  return filter;
};

const buildRestaurantFilterMeta = async (restaurantId) => {
  const rows = await RestaurantItem.find({ restaurantId })
    .select("price categoryId subCategoryId")
    .populate("categoryId subCategoryId")
    .lean();
  const catMap = new Map();
  const subMap = new Map();
  let minPrice = null;
  let maxPrice = null;
  rows.forEach((row) => {
    const price = Number(row.price || 0);
    if (price > 0) {
      minPrice = minPrice === null ? price : Math.min(minPrice, price);
      maxPrice = maxPrice === null ? price : Math.max(maxPrice, price);
    }
    if (row.categoryId?._id) catMap.set(String(row.categoryId._id), { _id: row.categoryId._id, name: row.categoryId.name });
    if (row.subCategoryId?._id) subMap.set(String(row.subCategoryId._id), { _id: row.subCategoryId._id, name: row.subCategoryId.name, parentId: row.subCategoryId.parentId });
  });
  return {
    categories: [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    subCategories: [...subMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    priceRange: { min: minPrice ?? 0, max: maxPrice ?? 0 },
  };
};

export const listRestaurantItemsCatalog = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!isObjectId(restaurantId)) return sendError(res, "Invalid restaurant id", 400);

    const restaurantDoc = await Restaurant.findById(restaurantId).populate("marketId ownerId").lean();
    if (!restaurantDoc) return sendError(res, "Restaurant not found", 404);
    const restaurant = await enrichOutletWithReviews(
      restaurantDoc,
      OUTLET_TARGET.RESTAURANT,
      req.userId,
    );

    const productStats = await outletProductRatingStats("restaurant", restaurantId);
    restaurant.rating = productStats.rating || restaurant.rating || 0;
    restaurant.productAverageRating = productStats.rating;
    restaurant.productReviewCount = productStats.reviewCount;

    // Count total items and menus for this restaurant
    const [totalItems, totalMenus] = await Promise.all([
      RestaurantItem.countDocuments({ restaurantId }),
      RestaurantMenu.countDocuments({ restaurantId }),
    ]);
    restaurant.totalItems = totalItems;
    restaurant.totalMenus = totalMenus;

    const filter = buildRestaurantCatalogFilter(req, restaurantId);
    const tab = String(req.query.tab || "featured").toLowerCase();
    const sort = req.query.sort ? itemSort(req.query) : itemSort({ tab });
    const result = await paginate(RestaurantItem, filter, { ...req.query, sort }, "categoryId subCategoryId menuId");
    const filterMeta = await buildRestaurantFilterMeta(restaurantId);
    const baseUrl = apiBaseFromRequest(req);
    const normalizedRestaurant = {
      ...restaurant,
      restaurantBanner: restaurant.restaurantBanner?.trim() ? resolveMediaUrl(restaurant.restaurantBanner, baseUrl) : RESTAURANT_BANNER_FALLBACK,
      restaurantLogo: restaurant.restaurantLogo?.trim() ? resolveMediaUrl(restaurant.restaurantLogo, baseUrl) : LOGO_FALLBACK,
    };
    const data = (result.data || []).map((item) => {
      const selling = item.discountPrice > 0 ? item.discountPrice : item.price;
      const discount = item.discountPrice > 0 && item.price > item.discountPrice
        ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
        : 0;
      return {
        ...item,
        image: resolveMediaUrl(item.image, baseUrl),
        price: selling,
        oldPrice: item.price,
        mrp: item.price,
        discount,
        productOptions: item.productOptions || [],
      };
    });

    ok(res, { restaurant: normalizedRestaurant, tab, filterMeta, data, pagination: result.pagination });
  } catch (error) {
    sendError(res, error);
  }
};

export const restaurantItemSearchSuggestions = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!isObjectId(restaurantId)) return sendError(res, "Invalid restaurant id", 400);
    const q = String(req.query.q || req.query.search || "").trim();
    if (!q) return ok(res, { suggestions: [] });
    const items = await RestaurantItem.find({ restaurantId }).select("itemName title").limit(200).lean();
    const suggestions = rankSuggestions(q, items, {
      limit: 8,
      getLabel: (p) => displayProductTitle(p, p.itemName),
    }).map((p) => ({ _id: p._id, label: displayProductTitle(p, p.itemName), type: "dish" }));
    ok(res, { suggestions });
  } catch (error) {
    sendError(res, error);
  }
};

const reviewStats = async (productId) => {
  const [totalReviews, statsAgg] = await Promise.all([
    ReviewModel.countDocuments({ productId: String(productId) }),
    ReviewModel.aggregate([
      { $match: { productId: String(productId) } },
      {
        $group: {
          _id: null,
          sum: { $sum: { $toDouble: "$rating" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);
  const s = statsAgg[0];
  const averageRating = s?.count
    ? Number((s.sum / s.count).toFixed(1))
    : 0;
  return { averageRating, totalReviews };
};

const buildSpecs = (entity, category, subCategory, extra = []) =>
  mergeSpecifications(entity.specifications, [
    category?.name ? { key: "Category", value: category.name } : null,
    subCategory?.name ? { key: "Sub category", value: subCategory.name } : null,
    ...extra,
  ]);

  const resolveProductImages = (entity, baseUrl) => {
  const raw = Array.isArray(entity?.images) ? entity.images.filter(Boolean) : [];
  if (entity?.image && !raw.includes(entity.image)) raw.unshift(entity.image);
  return [...new Set(raw)].map((image) => resolveMediaUrl(image, baseUrl)).filter(Boolean);
};

export const getGroceryProductStorefront = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return sendError(res, "Invalid product id", 400);

    const baseUrl = apiBaseFromRequest(req);
    const product = await GroceryProduct.findById(id)
      .populate("categoryId subCategoryId")
      .lean();
    if (!product) return sendError(res, "Product not found", 404);

    const shop = await GroceryShop.findById(product.shopId).populate("marketId").lean();
    const { averageRating, totalReviews } = await reviewStats(id);
    const displayName = displayProductTitle(product, product.name);

    const relatedPage = Math.max(parseInt(req.query.relatedPage || "1", 10), 1);
    const relatedLimit = Math.min(Math.max(parseInt(req.query.relatedLimit || "8", 10), 1), 24);
    const relatedSkip = (relatedPage - 1) * relatedLimit;

    const relatedFilter = { shopId: product.shopId, _id: { $ne: product._id } };
    const [related, relatedTotal] = await Promise.all([
      GroceryProduct.find(relatedFilter)
        .sort({ createdAt: -1 })
        .skip(relatedSkip)
        .limit(relatedLimit)
        .lean(),
      GroceryProduct.countDocuments(relatedFilter),
    ]);

    const sellingPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
    const discount =
      product.discountPrice > 0 && product.price > product.discountPrice
        ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
        : 0;

    const mergedSpecs = buildSpecs(product, product.categoryId, product.subCategoryId, [
      { key: "Sold by", value: shop?.shopName },
      { key: "Stock", value: String(product.stock ?? 0) },
    ]);
    const { productOptions, displaySpecs } = buildProductOptionsFromSpecs(mergedSpecs, product.productOptions);
    const productImages = resolveProductImages(product, baseUrl);
    const imageUrl = productImages[0] || resolveMediaUrl(product.image, baseUrl);

    ok(res, {
      kind: "grocery",
      product: {
        _id: product._id,
        name: displayName,
        title: displayName,
        internalName: product.name,
        description: product.description,
        image: imageUrl,
        images: productImages.length ? productImages : (imageUrl ? [imageUrl] : []),
        price: sellingPrice,
        oldPrice: product.price,
        mrp: product.price,
        discount,
        stock: product.stock,
        countInStock: product.stock,
        rating: averageRating || shop?.rating || 0,
        brand: shop?.shopName,
        shopId: shop?._id,
        marketId: shop?.marketId?._id || shop?.marketId,
        isGoMarket: true,
        goMarketKind: "grocery",
        productOptions,
      },
      shop: shop
        ? {
            ...shop,
            shopBanner: shop.shopBanner?.trim() ? resolveMediaUrl(shop.shopBanner, baseUrl) : GROCERY_BANNER_FALLBACK,
            shopLogo: shop.shopLogo?.trim() ? resolveMediaUrl(shop.shopLogo, baseUrl) : LOGO_FALLBACK,
          }
        : shop,
      specifications: displaySpecs,
      averageRating,
      totalReviews,
      related: (await applyProductReviewStats(related, baseUrl)).map((p) => ({
        _id: p._id,
        name: displayProductTitle({ name: p.name, title: p.title }, p.name),
        image: p.image,
        images: p.images,
        price: p.price,
        oldPrice: p.oldPrice,
        mrp: p.mrp,
        discount: p.discount,
        stock: p.stock || p.countInStock,
        description: p.description,
        rating: p.averageRating || p.rating || 0,
        goMarketKind: "grocery",
      })),
      relatedPagination: {
        page: relatedPage,
        limit: relatedLimit,
        total: relatedTotal,
        totalPages: Math.ceil(relatedTotal / relatedLimit) || 1,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

export const getRestaurantItemStorefront = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return sendError(res, "Invalid item id", 400);

    const baseUrl = apiBaseFromRequest(req);
    const item = await RestaurantItem.findById(id)
      .populate("categoryId subCategoryId menuId")
      .lean();
    if (!item) return sendError(res, "Item not found", 404);

    const restaurant = await Restaurant.findById(item.restaurantId).populate("marketId").lean();
    const { averageRating, totalReviews } = await reviewStats(id);
    const displayName = displayProductTitle(item, item.itemName);

    const relatedPage = Math.max(parseInt(req.query.relatedPage || "1", 10), 1);
    const relatedLimit = Math.min(Math.max(parseInt(req.query.relatedLimit || "8", 10), 1), 24);
    const relatedSkip = (relatedPage - 1) * relatedLimit;
    const relatedFilter = {
      restaurantId: item.restaurantId,
      _id: { $ne: item._id },
      isAvailable: { $ne: false },
    };
    const [related, relatedTotal] = await Promise.all([
      RestaurantItem.find(relatedFilter)
        .sort({ createdAt: -1 })
        .skip(relatedSkip)
        .limit(relatedLimit)
        .lean(),
      RestaurantItem.countDocuments(relatedFilter),
    ]);

      const sellingPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
    const discount = item.discountPrice > 0 && item.price > item.discountPrice
      ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
      : 0;
    const mergedSpecs = buildSpecs(item, item.categoryId, item.subCategoryId, [
      { key: "Restaurant", value: restaurant?.restaurantName },
      item.menuId?.menuName ? { key: "Menu", value: item.menuId.menuName } : null,
      { key: "Availability", value: item.isAvailable === false ? "Unavailable" : "Available" },
    ]);
    const { productOptions, displaySpecs } = buildProductOptionsFromSpecs(mergedSpecs, item.productOptions);
    const productImages = resolveProductImages(item, baseUrl);
    const imageUrl = productImages[0] || resolveMediaUrl(item.image, baseUrl);


    ok(res, {
      kind: "restaurant",
      product: {
        _id: item._id,
        name: displayName,
        title: displayName,
        internalName: item.itemName,
        description: item.description,
        image: imageUrl,
        images: productImages.length ? productImages : (imageUrl ? [imageUrl] : []),
        price: sellingPrice,
        oldPrice: item.price,
        mrp: item.price,
        discount,
        stock: item.isAvailable === false ? 0 : 99,
        countInStock: item.isAvailable === false ? 0 : 99,
        isAvailable: item.isAvailable !== false,
        rating: averageRating || restaurant?.rating || 0,
        brand: restaurant?.restaurantName,
        restaurantId: restaurant?._id,
        marketId: restaurant?.marketId?._id || restaurant?.marketId,
        isGoMarket: true,
        goMarketKind: "restaurant",
        productOptions,
      },
      restaurant: restaurant
        ? {
            ...restaurant,
            restaurantBanner: restaurant.restaurantBanner?.trim() ? resolveMediaUrl(restaurant.restaurantBanner, baseUrl) : RESTAURANT_BANNER_FALLBACK,
            restaurantLogo: restaurant.restaurantLogo?.trim() ? resolveMediaUrl(restaurant.restaurantLogo, baseUrl) : LOGO_FALLBACK,
          }
        : restaurant,
      specifications: displaySpecs,
      averageRating,
      totalReviews,
      related: await (async () => {
        const statsMap = await productReviewStatsForIds(related.map((p) => p._id));
        return related.map((p) => {
          const stats = statsMap.get(String(p._id));
          const selling = p.discountPrice > 0 ? p.discountPrice : p.price;
          const discount = p.discountPrice > 0 && p.price > p.discountPrice 
            ? Math.round(((p.price - p.discountPrice) / p.price) * 100) 
            : 0;
          return {
            _id: p._id,
            name: p.itemName,
            image: resolveProductImages(p, baseUrl)[0] || resolveMediaUrl(p.image, baseUrl),
            price: selling,
            oldPrice: p.price,
            discount,
            isAvailable: p.isAvailable !== false,
            description: p.description,
            rating: stats?.averageRating || 0,
            goMarketKind: "restaurant",
          };
        });
      })(),
      relatedPagination: {
        page: relatedPage,
        limit: relatedLimit,
        total: relatedTotal,
        totalPages: Math.ceil(relatedTotal / relatedLimit) || 1,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};
