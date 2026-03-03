import { Router } from "express";
import auth from "../middlewares/auth.js";
import isAdmin from "../middlewares/isAdmin.js";
import { addItem, deleteItem, editItem, getItemsByShop, searchItems } from "../controllers/restaurantItem.controller.js";

const restaurantItemRouter = Router();

restaurantItemRouter.post("/admin/add", auth, isAdmin, addItem);
restaurantItemRouter.put("/admin/edit/:id", auth, isAdmin, editItem);
restaurantItemRouter.delete("/admin/delete/:id", auth, isAdmin, deleteItem);

restaurantItemRouter.get("/get/:shopId", getItemsByShop);
restaurantItemRouter.get("/search", searchItems);

export default restaurantItemRouter;