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

export const resources = {
  markets: { model: Market, label: "Market", searchFields: ["name", "city", "state", "pincode"] },
  owners: { model: ShopOwner, label: "Shop owner", searchFields: ["name", "email", "mobile"] },
  "grocery-shops": { model: GroceryShop, label: "Grocery shop", searchFields: ["shopName", "address", "description"], populate: "marketId ownerId" },
  restaurants: { model: Restaurant, label: "Restaurant", searchFields: ["restaurantName", "address", "description"], populate: "marketId ownerId" },
  products: { model: GroceryProduct, label: "Grocery product", searchFields: ["name", "description"], populate: "shopId categoryId subCategoryId" },
  menus: { model: RestaurantMenu, label: "Restaurant menu", searchFields: ["menuName", "description"], populate: "restaurantId" },
  items: { model: RestaurantItem, label: "Restaurant item", searchFields: ["itemName", "description"], populate: "restaurantId menuId categoryId" },
  categories: { model: GoMarketCategory, label: "Go Market category", searchFields: ["name", "description"] },
  subcategories: { model: GoMarketSubCategory, label: "Go Market sub category", searchFields: ["name", "description"], populate: "parentId" },
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

export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearbyMarkets = async ({ latitude, longitude, limit = 10 }) => {
  const markets = await Market.find({ status: "active" }).lean();
  if (!latitude || !longitude) return markets.slice(0, limit);
  return markets
    .map((market) => ({ ...market, distanceKm: Number(haversineKm(latitude, longitude, market.latitude, market.longitude).toFixed(2)) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};