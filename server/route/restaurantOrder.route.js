import { Router } from "express";
import auth from "../middlewares/auth.js";
import isAdmin from "../middlewares/isAdmin.js";
import { myOrders, placeOrder, updateOrderStatus, verifyPayment } from "../controllers/restaurantOrder.controller.js";

const restaurantOrderRouter = Router();

restaurantOrderRouter.post("/place-order", auth, placeOrder);
restaurantOrderRouter.post("/verify-payment", auth, verifyPayment);
restaurantOrderRouter.get("/my-orders", auth, myOrders);
restaurantOrderRouter.patch("/admin/:id/status", auth, isAdmin, updateOrderStatus);

export default restaurantOrderRouter;