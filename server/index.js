import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/connectDb.js';
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js';
import productRouter from './route/product.route.js';
import cartRouter from './route/cart.route.js';
import myListRouter from './route/mylist.route.js';
import addressRouter from './route/address.route.js';
import homeSlidesRouter from './route/homeSlides.route.js';
import bannerV1Router from './route/bannerV1.route.js';
import bannerList2Router from './route/bannerList2.route.js';
import blogRouter from './route/blog.route.js';
import orderRouter from './route/order.route.js';
import logoRouter from './route/logo.route.js';
import { requestContext } from './middlewares/requestContext.js';
import { globalErrorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import mongoose from 'mongoose';
import notificationRouter from './route/notification.route.js';
import couponRouter from './route/coupon.route.js';
import notificationSettingRouter from './route/notificationSetting.route.js';
import paymentRouter from './route/payment.route.js';
import goMarketRouter from './route/goMarket.route.js';

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  "https://www.zeedaddy.in",
  "https://zeedaddy.in",
  "https://decemberadmin-2grx.vercel.app",
  "https://zeedaddyseller.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8000",
  "http://localhost:3000",
  "http://localhost:8081",      // Expo dev server - ADDED
  "http://127.0.0.1:8081",      // Alternative localhost - ADDED
  "exp://localhost:8081",
];

// CORS Configuration - Allow React Native/Expo apps (no origin header)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (React Native, Expo, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cookie"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(requestContext);

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Origin:', req.get('origin') || 'none (mobile/server)');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.get("/", (request, response) => {
  response.json({
    message: "Server is running on port " + process.env.PORT,
    status: "OK"
  })
})

app.get('/health', (request, response) => {
  const dbReadyState = mongoose.connection.readyState
  const isDatabaseConnected = dbReadyState === 1

  response.status(isDatabaseConnected ? 200 : 503).json({
    success: isDatabaseConnected,
    service: 'api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: isDatabaseConnected,
      state: dbReadyState
    },
    requestId: request.id
  })
})

// Routes
app.use('/api/user', userRouter)
app.use('/api/category', categoryRouter)
app.use('/api/product', productRouter)
app.use("/api/cart", cartRouter)
app.use("/api/myList", myListRouter)
app.use("/api/address", addressRouter)
app.use("/api/homeSlides", homeSlidesRouter)
app.use("/api/bannerV1", bannerV1Router)
app.use("/api/bannerList2", bannerList2Router)
app.use("/api/blog", blogRouter)
app.use("/api/order", orderRouter)
app.use("/api/logo", logoRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/coupon", couponRouter)
app.use("/api/notification-settings", notificationSettingRouter)
app.use("/api/payment", paymentRouter)
app.use("/api/go-market", goMarketRouter)

// Error handlers
app.use(notFoundHandler)
app.use(globalErrorHandler)

// Start server
connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log("✅ Server is running on port", process.env.PORT);
    console.log("🔒 Allowed origins:", allowedOrigins);
    console.log("📱 React Native/Expo apps - ALLOWED");
  });
}).catch((err) => {
  console.error("❌ Failed to connect to database:", err.message);
  process.exit(1);
});
