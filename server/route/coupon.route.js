import { Router } from "express";
import auth from "../middlewares/auth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import {
  createCouponController,
  deleteCouponController,
  getActiveCouponsController,
  getAllCouponsAdminController,
  updateCouponController,
  validateCouponController,
} from "../controllers/coupon.controller.js";

const couponRouter = Router();

couponRouter.get("/active", getActiveCouponsController);
couponRouter.post("/validate", validateCouponController);

couponRouter.get("/admin", auth, authorizeRole("ADMIN"), getAllCouponsAdminController);
couponRouter.post("/admin", auth, authorizeRole("ADMIN"), createCouponController);
couponRouter.put("/admin/:id", auth, authorizeRole("ADMIN"), updateCouponController);
couponRouter.delete("/admin/:id", auth, authorizeRole("ADMIN"), deleteCouponController);

export default couponRouter;