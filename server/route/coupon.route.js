import { Router } from "express";
import auth from "../middlewares/auth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import {
  createCouponController,
  deleteCouponController,
  getActiveCouponsController,
  getAllCouponsAdminController,
  getSellerCouponsController,
  updateCouponController,
  validateCouponController,
} from "../controllers/coupon.controller.js";

const couponRouter = Router();
const GO_MARKET_SHOP_SELLERS = [
  "GROCERY_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER",
  "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER",
  "BOOKS_STATIONERY_SELLER", "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"
];
const sellerRoles = authorizeRole(...GO_MARKET_SHOP_SELLERS, "RESTAURANT_SELLER");

couponRouter.get("/active", getActiveCouponsController);
couponRouter.post("/validate", validateCouponController);

couponRouter.get("/seller", auth, sellerRoles, getSellerCouponsController);
couponRouter.post("/seller", auth, sellerRoles, createCouponController);
couponRouter.put("/seller/:id", auth, sellerRoles, updateCouponController);
couponRouter.delete("/seller/:id", auth, sellerRoles, deleteCouponController);

couponRouter.get("/admin", auth, authorizeRole("ADMIN"), getAllCouponsAdminController);
couponRouter.post("/admin", auth, authorizeRole("ADMIN"), createCouponController);
couponRouter.put("/admin/:id", auth, authorizeRole("ADMIN"), updateCouponController);
couponRouter.delete("/admin/:id", auth, authorizeRole("ADMIN"), deleteCouponController);

export default couponRouter;