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
const sellerRoles = authorizeRole("GROCERY_SELLER", "RESTAURANT_SELLER");

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