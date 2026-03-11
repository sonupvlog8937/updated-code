import { Router } from "express";
import auth from "../middlewares/auth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import {  captureOrderPaypalController, createOrderController, createOrderPaypalController, deleteOrder, getOrderDetailsController, getTotalOrdersCountController, getUserOrderDetailsController, totalSalesController, totalUsersController, updateOrderStatusController, getSellerOrdersController, getSellerDashboardStats } from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post('/create',auth,createOrderController)
orderRouter.get("/order-list",auth,authorizeRole('ADMIN'),getOrderDetailsController)
orderRouter.get('/create-order-paypal',auth,createOrderPaypalController)
orderRouter.post('/capture-order-paypal',auth,captureOrderPaypalController)
orderRouter.put('/order-status/:id',auth,authorizeRole('ADMIN','SELLER'),updateOrderStatusController)
orderRouter.get('/count',auth,authorizeRole('ADMIN'),getTotalOrdersCountController)
orderRouter.get('/sales',auth,authorizeRole('ADMIN'),totalSalesController)
orderRouter.get('/users',auth,authorizeRole('ADMIN'),totalUsersController)
orderRouter.get('/order-list/orders',auth,getUserOrderDetailsController)
orderRouter.get('/seller/orders',auth,authorizeRole('SELLER'),getSellerOrdersController)
orderRouter.delete('/deleteOrder/:id',auth,authorizeRole('ADMIN'),deleteOrder)

orderRouter.get('/seller/dashboard-stats', auth, authorizeRole('SELLER'), getSellerDashboardStats)

export default orderRouter;