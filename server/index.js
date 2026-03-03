import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDb.js";
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
import { requestContext } from "./middlewares/requestContext.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.js";
import mongoose from "mongoose";
import restaurantShopRouter from "./route/restaurantShop.route.js";
import restaurantItemRouter from "./route/restaurantItem.route.js";
import restaurantOrderRouter from "./route/restaurantOrder.route.js";
import { createServer } from "http";
import { initSocket } from "./socket.js";

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: process.env.FRONTEND_URL?.split(",") || true,
    credentials: true,
  }),
);
app.options("*", cors());

app.use(requestContext);

app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.get("/", (request, response) => {
  ///server to client
  response.json({
    message: "Server is running " + process.env.PORT,
  });
});

app.get("/health", (request, response) => {
  const dbReadyState = mongoose.connection.readyState;
  const isDatabaseConnected = dbReadyState === 1;

  response.status(isDatabaseConnected ? 200 : 503).json({
    success: isDatabaseConnected,
    service: "api",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: isDatabaseConnected,
      state: dbReadyState,
    },
    requestId: request.id,
  });
});

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
app.use("/api/restaurant/shop", restaurantShopRouter);
app.use("/api/restaurant/item", restaurantItemRouter);
app.use("/api/restaurant/order", restaurantOrderRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

connectDB().then(() => {
  const io = initSocket(httpServer);
  app.set("io", io);

  httpServer.listen(process.env.PORT, () => {
    console.log("Server is running", process.env.PORT);
  });
});
