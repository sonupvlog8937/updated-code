import express from "express";
import auth from "../middlewares/auth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import {
  createResource,
  deleteResource,
  followRestaurant,
  followShop,
  getGroceryShopDetail,
  getMarketDetail,
  getResource,
  getRestaurantDetail,
  listResource,
  nearbyMarkets,
  searchMarkets,
  updateResource,
} from "../controllers/goMarket.controller.js";

const router = express.Router();
const canManage = [auth, authorizeRole("ADMIN", "SELLER")];
const crud = (path, key, detailHandler = null) => {
  router.get(path, listResource(key));
  router.post(path, ...canManage, createResource(key));
  router.get(`${path}/:id`, detailHandler || getResource(key));
  router.put(`${path}/:id`, ...canManage, updateResource(key));
  router.delete(`${path}/:id`, ...canManage, deleteResource(key));
};

router.get("/markets/search", searchMarkets);
router.get("/markets/nearby", nearbyMarkets);
crud("/markets", "markets", getMarketDetail);
crud("/owners", "owners");
crud("/grocery-shops", "grocery-shops", getGroceryShopDetail);
crud("/restaurants", "restaurants", getRestaurantDetail);
crud("/products", "products");
crud("/menus", "menus");
crud("/items", "items");

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
router.post("/follow-restaurant", auth, followRestaurant);

export default router;