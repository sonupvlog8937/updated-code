import { Router } from "express";
import auth from "../middlewares/auth.js";
import { isSeller } from "../middlewares/Sellerauth .js";
import {
    captureOrderPaypalController,
    createOrderController,
    createOrderPaypalController,
    deleteOrder,
    getOrderDetailsController,
    getTotalOrdersCountController,
    getUserOrderDetailsController,
    totalSalesController,
    totalUsersController,
    updateOrderStatusController,
    // ✅ NEW seller order controllers
    getSellerOrdersController,
    updateSellerItemStatusController,
} from "../controllers/order.controller.js";

const orderRouter = Router();

// ─── EXISTING ROUTES (unchanged) ───
orderRouter.post('/create', auth, createOrderController)
orderRouter.get("/order-list", auth, getOrderDetailsController)                   // Admin - all orders
orderRouter.get('/create-order-paypal', auth, createOrderPaypalController)
orderRouter.post('/capture-order-paypal', auth, captureOrderPaypalController)
orderRouter.put('/order-status/:id', auth, updateOrderStatusController)           // Admin - update order status
orderRouter.get('/count', auth, getTotalOrdersCountController)
orderRouter.get('/sales', auth, totalSalesController)
orderRouter.get('/users', auth, totalUsersController)
orderRouter.get('/order-list/orders', auth, getUserOrderDetailsController)        // Customer - my orders
orderRouter.delete('/deleteOrder/:id', auth, deleteOrder)

// ─── ✅ NEW: SELLER ROUTES ───
orderRouter.get('/seller/my-orders', auth, isSeller, getSellerOrdersController)                              // Seller - get my orders
orderRouter.put('/seller/item-status/:orderId/:productId', auth, isSeller, updateSellerItemStatusController) // Seller - update item status

export default orderRouter;