import { Router } from "express";
import auth from "../middlewares/auth.js";
import { createRazorpayOrderController } from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/razorpay/create", auth, createRazorpayOrderController);

export default paymentRouter;