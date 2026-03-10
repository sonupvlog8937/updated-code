// ─── Load ENV first ───────────────────────────────────────────────────────────
import dotenv from "dotenv";
dotenv.config();

// ─── Validate ENV before anything else ───────────────────────────────────────
import { validateEnv } from "./config/validateEnv.js";
validateEnv();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import mongoose from "mongoose";

import connectDB from "./config/connectDb.js";
import logger from "./config/logger.js";

// ─── Middlewares ──────────────────────────────────────────────────────────────
import { requestContext } from "./middlewares/requestContext.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { mongoSanitizer, xssSanitizer } from "./middlewares/security.js";
import { apiLimiter, authLimiter, otpLimiter, uploadLimiter, orderLimiter } from "./middlewares/rateLimiter.js";
import { handleMulterError } from "./middlewares/multer.js";

// ─── Routes ───────────────────────────────────────────────────────────────────
import userRouter from "./route/user.route.js";
import categoryRouter from "./route/category.route.js";
import productRouter from "./route/product.route.js";
import cartRouter from "./route/cart.route.js";
import myListRouter from "./route/mylist.route.js";
import addressRouter from "./route/address.route.js";
import homeSlidesRouter from "./route/homeSlides.route.js";
import bannerV1Router from "./route/bannerV1.route.js";
import bannerList2Router from "./route/bannerList2.route.js";
import blogRouter from "./route/blog.route.js";
import orderRouter from "./route/order.route.js";
import logoRouter from "./route/logo.route.js";
import sellerRouter from "./route/Seller.route.js";
import adminSellerRouter from "./route/Adminseller.route.js";
import payoutRouter from "./route/Payout.route.js";

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://www.zeedaddy.in",
  "https://zeedaddy.in",
  "https://seller.zeedaddy.in",
  "https://admin.zeedaddy.in",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked: ${origin}`);
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

// ─── Trust proxy (for correct IP behind nginx/load balancer) ─────────────────
app.set("trust proxy", 1);

// ─── Core Middlewares ─────────────────────────────────────────────────────────
app.use(requestContext);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression()); // Gzip responses

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === "production",
  })
);
app.use(mongoSanitizer);  // NoSQL injection protection
app.use(xssSanitizer);    // XSS protection

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  // Production: log only errors and slow requests
  app.use(
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400,
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ─── Global Rate Limiting ─────────────────────────────────────────────────────
app.use("/api/", apiLimiter);

// ─── Health Check (no auth, no rate limit) ────────────────────────────────────
app.get("/", (req, res) =>
  res.json({ message: "Server is running", version: "1.0.0" })
);

app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    service: "api",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: { connected: isDbConnected, state: dbState },
    requestId: req.id,
  });
});

// ─── Routes with targeted rate limits ────────────────────────────────────────

// Auth routes — strict limits
app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user/forgot-password", authLimiter);
app.use("/api/user/verify-email", otpLimiter);
app.use("/api/user/resend-otp", otpLimiter);

// Upload routes
app.use("/api/product/uploadImages", uploadLimiter);
app.use("/api/product/uploadBannerImages", uploadLimiter);
app.use("/api/seller/products/uploadImages", uploadLimiter);

// Order routes
app.use("/api/order/create", orderLimiter);
app.use("/api/order/capture-order-paypal", orderLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/user", userRouter);
app.use("/api/category", categoryRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/myList", myListRouter);
app.use("/api/address", addressRouter);
app.use("/api/homeSlides", homeSlidesRouter);
app.use("/api/bannerV1", bannerV1Router);
app.use("/api/bannerList2", bannerList2Router);
app.use("/api/blog", blogRouter);
app.use("/api/order", orderRouter);
app.use("/api/logo", logoRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/admin", adminSellerRouter);
app.use("/api/payout", payoutRouter);

// ─── Error Handlers (MUST be last) ───────────────────────────────────────────
app.use(handleMulterError);
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });

    // Force close after 10s if not done
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection", { reason: reason?.message || reason });
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
    process.exit(1);
  });
});