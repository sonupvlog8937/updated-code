import { Router } from "express";
import auth from "../middlewares/auth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import {  captureOrderPaypalController, createOrderController, createOrderPaypalController, deleteOrder, getOrderDetailsController, getTotalOrdersCountController, getUserOrderDetailsController, totalSalesController, totalUsersController, updateOrderStatusController, getSellerOrdersController, getSellerDashboardStats, requestOrderReturnController, updateReturnRefundStatusController, listDeliveryRidersController, assignOrderToRiderController, broadcastOrderToMarketController, getRiderOrdersController, getRiderStatsController, getRiderRecentDeliveriesController, confirmRiderOrderController, sendDeliveryOtpController, deliverRiderOrderController, cancelRiderOrderController, payRiderWalletController } from "../controllers/order.controller.js";
const orderRouter = Router();

const GO_MARKET_SHOP_SELLERS = [
  'GROCERY_SELLER', 'FASHION_SELLER', 'ELECTRONICS_SELLER', 'MEDICAL_SELLER',
  'BEAUTY_SELLER', 'HOME_KITCHEN_SELLER', 'GIFTS_TOYS_SELLER',
  'BOOKS_STATIONERY_SELLER', 'JEWELLERY_SELLER', 'HARDWARE_SELLER', 'AUTOMOBILE_SELLER'
];
const ALL_SELLER_ROLES = ['SELLER', ...GO_MARKET_SHOP_SELLERS, 'RESTAURANT_SELLER'];
const QUICK_COMMERCE_SELLERS = [...GO_MARKET_SHOP_SELLERS, 'RESTAURANT_SELLER'];


orderRouter.post('/create',auth,createOrderController)
orderRouter.get("/order-list",auth,authorizeRole('ADMIN'),getOrderDetailsController)
orderRouter.get('/create-order-paypal',auth,createOrderPaypalController)
orderRouter.post('/capture-order-paypal',auth,captureOrderPaypalController)
orderRouter.put('/order-status/:id',auth,authorizeRole('ADMIN',...ALL_SELLER_ROLES),updateOrderStatusController)
orderRouter.get('/count',auth,authorizeRole('ADMIN'),getTotalOrdersCountController)
orderRouter.get('/sales',auth,authorizeRole('ADMIN'),totalSalesController)
orderRouter.get('/users',auth,authorizeRole('ADMIN'),totalUsersController)
orderRouter.get('/order-list/orders',auth,getUserOrderDetailsController)
orderRouter.get('/seller/orders',auth,authorizeRole(...ALL_SELLER_ROLES),getSellerOrdersController)
orderRouter.delete('/deleteOrder/:id',auth,authorizeRole('ADMIN'),deleteOrder)
orderRouter.post('/return-request/:id',auth,requestOrderReturnController)
orderRouter.put('/return-refund-status/:id',auth,authorizeRole('ADMIN',...ALL_SELLER_ROLES),updateReturnRefundStatusController)

orderRouter.get('/seller/dashboard-stats', auth, authorizeRole(...ALL_SELLER_ROLES), getSellerDashboardStats)
orderRouter.get('/delivery-riders', auth, authorizeRole('ADMIN',...QUICK_COMMERCE_SELLERS), listDeliveryRidersController)
orderRouter.put('/assign-rider/:id', auth, authorizeRole('ADMIN',...QUICK_COMMERCE_SELLERS), assignOrderToRiderController)
orderRouter.put('/broadcast-order/:id', auth, authorizeRole('ADMIN',...QUICK_COMMERCE_SELLERS), broadcastOrderToMarketController)
orderRouter.get('/rider/orders', auth, authorizeRole('DELIVERY_RIDER'), getRiderOrdersController)
orderRouter.get('/rider/stats', auth, authorizeRole('DELIVERY_RIDER'), getRiderStatsController)
orderRouter.get('/rider/recent-deliveries', auth, authorizeRole('DELIVERY_RIDER'), getRiderRecentDeliveriesController)
orderRouter.put('/rider/orders/:id/confirm', auth, authorizeRole('DELIVERY_RIDER'), confirmRiderOrderController)
orderRouter.post('/rider/orders/:id/send-otp', auth, authorizeRole('DELIVERY_RIDER'), sendDeliveryOtpController)
orderRouter.put('/rider/orders/:id/deliver', auth, authorizeRole('DELIVERY_RIDER'), deliverRiderOrderController)
orderRouter.put('/rider/orders/:id/cancel', auth, authorizeRole('DELIVERY_RIDER'), cancelRiderOrderController)
orderRouter.post('/admin/rider-payout', auth, authorizeRole('ADMIN'), payRiderWalletController)

export default orderRouter;