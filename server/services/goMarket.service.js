import mongoose from "mongoose";
import Market from "../models/market.model.js";
import ShopOwner from "../models/shopOwner.model.js";
import GroceryShop from "../models/groceryShop.model.js";
import Restaurant from "../models/restaurant.model.js";
import GroceryProduct from "../models/groceryProduct.model.js";
import RestaurantMenu from "../models/restaurantMenu.model.js";
import RestaurantItem from "../models/restaurantItem.model.js";
import GoMarketCategory from "../models/goMarketCategory.model.js";
import GoMarketSubCategory from "../models/goMarketSubCategory.model.js";
import GoMarketSubSubCategory from "../models/goMarketSubSubCategory.model.js";
import { haversineKm as geoHaversineKm } from "../utils/geoCoords.js";

export const resources = {
  markets: { model: Market, label: "Market", searchFields: ["name", "city", "state", "pincode"] },
  owners: { model: ShopOwner, label: "Shop owner", searchFields: ["name", "email", "mobile"] },
  "grocery-shops": { model: GroceryShop, label: "Grocery shop", searchFields: ["shopName", "address", "description"], populate: "marketId ownerId" },
  restaurants: { model: Restaurant, label: "Restaurant", searchFields: ["restaurantName", "address", "description"], populate: "marketId ownerId" },
  products: { model: GroceryProduct, label: "Grocery product", searchFields: ["name", "description", "title", "keywords", "tags", "searchKeywords", "seoDescription", "attributes"], populate: "shopId categoryId subCategoryId" },
  menus: { model: RestaurantMenu, label: "Restaurant menu", searchFields: ["menuName", "description"], populate: "restaurantId" },
  items: { model: RestaurantItem, label: "Restaurant item", searchFields: ["itemName", "description", "title", "keywords", "tags", "searchKeywords", "seoDescription", "attributes"], populate: "restaurantId menuId categoryId" },
  categories: { model: GoMarketCategory, label: "Go Market category", searchFields: ["name", "description"] },
  subcategories: { model: GoMarketSubCategory, label: "Go Market sub category", searchFields: ["name", "description"], populate: "categoryId parentId" },
  subsubcategories: { model: GoMarketSubSubCategory, label: "Go Market sub sub category", searchFields: ["name", "description"], populate: "categoryId subCategoryId" },
};

export const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const buildQuery = (query = {}, searchFields = []) => {
  const filter = {};
  if (query.marketId && isObjectId(query.marketId)) filter.marketId = query.marketId;
  if (query.shopId && isObjectId(query.shopId)) filter.shopId = query.shopId;
  if (query.restaurantId && isObjectId(query.restaurantId)) filter.restaurantId = query.restaurantId;
  if (query.menuId && isObjectId(query.menuId)) filter.menuId = query.menuId;
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.categoryId && isObjectId(query.categoryId)) filter.categoryId = query.categoryId;
  if (query.parentId && isObjectId(query.parentId)) filter.parentId = query.parentId;
  if (query.parentModel) filter.parentModel = query.parentModel;
  if (query.isOpen !== undefined) filter.isOpen = query.isOpen === "true" || query.isOpen === true;
  const term = String(query.search || query.q || "").trim();
  if (term && searchFields.length) {
    filter.$or = searchFields.map((field) => ({ [field]: { $regex: term, $options: "i" } }));
  }
  return filter;
};

export const paginate = async (model, filter, query = {}, populate = "") => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "12", 10), 1), 100);
  const skip = (page - 1) * limit;
  const sort = query.sort || "-createdAt";
  const find = model.find(filter).sort(sort).skip(skip).limit(limit);
  if (populate) find.populate(populate);
  const [data, total] = await Promise.all([find.lean(), model.countDocuments(filter)]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export { geoHaversineKm as haversineKm };

export const findNearbyMarkets = async ({ latitude, longitude, limit = 10 }) => {
  try {
    let markets = await Market.find({ status: "active" }).lean();
    console.log(`📍 Total active markets: ${markets.length}`);
    
    // If no valid coordinates provided, return all active markets
     if (latitude === undefined || latitude === null || longitude === undefined || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      console.warn("⚠️ Invalid coordinates provided for nearby markets:", { latitude, longitude });
      return markets.slice(0, limit);
    }

    console.log(`📍 Searching nearby markets for coordinates: (${latitude}, ${longitude})`);

    // Filter markets that have valid latitude/longitude
    const marketsWithCoords = markets.filter(
      (m) => m.latitude != null && m.longitude != null && !isNaN(m.latitude) && !isNaN(m.longitude)
    );

    console.log(`📍 Markets with valid coordinates: ${marketsWithCoords.length}`);
    if (marketsWithCoords.length === 0) {
      console.warn("⚠️ No markets with valid coordinates found");
      return [];
    }

    // Calculate distance and sort by nearest. Guard against null/invalid haversine results.
    const nearby = marketsWithCoords
      .map((market) => {
        const dist = geoHaversineKm(latitude, longitude, market.latitude, market.longitude);
        if (dist == null || Number.isNaN(dist)) {
          console.warn(`⚠️ Invalid distance for market ${market.name}: ${dist}`);
          return null;
        }
        return {
          ...market,
          distanceKm: Number(dist.toFixed(2)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    console.log(`✅ Found ${nearby.length} nearby markets for coordinates (${latitude}, ${longitude})`);
    console.log("📍 Nearby markets:", nearby.map(m => ({ name: m.name, distance: m.distanceKm })));
    return nearby;
  } catch (error) {
    console.error("❌ Error finding nearby markets:", error);
    throw error;
  }
};