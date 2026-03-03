import { Router } from "express";
import auth from "../middlewares/auth.js";
import isAdmin from "../middlewares/isAdmin.js";
import { createShop, getAllShopsForAdmin, getShopByCity, updateShop } from "../controllers/restaurantShop.controller.js";

const restaurantShopRouter = Router();

restaurantShopRouter.post("/admin/create", auth, isAdmin, createShop);
restaurantShopRouter.put("/admin/:id", auth, isAdmin, updateShop);
restaurantShopRouter.get("/admin/all", auth, isAdmin, getAllShopsForAdmin);

restaurantShopRouter.get("/get-by-city/:city", getShopByCity);

export default restaurantShopRouter;