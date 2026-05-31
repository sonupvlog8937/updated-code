import Market from "../models/market.model.js";
import GroceryShop from "../models/groceryShop.model.js";
import Restaurant from "../models/restaurant.model.js";
import GroceryProduct from "../models/groceryProduct.model.js";
import RestaurantMenu from "../models/restaurantMenu.model.js";
import RestaurantItem from "../models/restaurantItem.model.js";
import { buildQuery, findNearbyMarkets, isObjectId, paginate, resources } from "../services/goMarket.service.js";

const sendError = (res, error, status = 500) => res.status(status).json({ error: true, success: false, message: error.message || error });
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
};

export const listResource = (resourceKey) => async (req, res) => {
  try {
    const resource = resources[resourceKey];
    const filter = buildQuery(req.query, resource.searchFields);
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
    const missing = required(req.body, requiredFields[resourceKey] || []);
    if (missing.length) return sendError(res, `Missing required fields: ${missing.join(", ")}`, 400);
    const resource = resources[resourceKey];
    const data = await resource.model.create(req.body);
    ok(res, { message: `${resource.label} created`, data });
  } catch (error) { sendError(res, error, 400); }
};

export const updateResource = (resourceKey) => async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid id", 400);
    const resource = resources[resourceKey];
    const data = await resource.model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return sendError(res, `${resource.label} not found`, 404);
    ok(res, { message: `${resource.label} updated`, data });
  } catch (error) { sendError(res, error, 400); }
};

export const deleteResource = (resourceKey) => async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid id", 400);
    const resource = resources[resourceKey];
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
    const data = await findNearbyMarkets({ latitude: Number(req.query.latitude), longitude: Number(req.query.longitude), limit: Number(req.query.limit || 10) });
    ok(res, { data });
  } catch (error) { sendError(res, error); }
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
    const shop = await GroceryShop.findById(req.params.id).populate("marketId ownerId").lean();
    if (!shop) return sendError(res, "Grocery shop not found", 404);
    const products = await GroceryProduct.find({ shopId: req.params.id }).lean();
    ok(res, { data: { shop, products } });
  } catch (error) { sendError(res, error); }
};

export const getRestaurantDetail = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return sendError(res, "Invalid restaurant id", 400);
    const restaurant = await Restaurant.findById(req.params.id).populate("marketId ownerId").lean();
    if (!restaurant) return sendError(res, "Restaurant not found", 404);
    const [menus, items] = await Promise.all([RestaurantMenu.find({ restaurantId: req.params.id }).lean(), RestaurantItem.find({ restaurantId: req.params.id }).lean()]);
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
    ok(res, { message: "Shop followed", data: shop });
  } catch (error) { sendError(res, error); }
};

export const followRestaurant = async (req, res) => {
  try {
    const userId = req.userId;
    const { restaurantId } = req.body;
    if (!userId || !isObjectId(restaurantId)) return sendError(res, "Valid restaurantId and login are required", 400);
    const restaurant = await Restaurant.findByIdAndUpdate(restaurantId, { $addToSet: { followers: userId } }, { new: true });
    if (!restaurant) return sendError(res, "Restaurant not found", 404);
    ok(res, { message: "Restaurant followed", data: restaurant });
  } catch (error) { sendError(res, error); }
};