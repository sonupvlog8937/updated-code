import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
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

const app = express();
const allowedOrigins = [
  "https://www.zeedaddy.in",  // production (www zeedaddy)
  "https://zeedaddy.in",      // production (non-www zeedaddy)
  "https://decemberadmin-2grx.vercel.app", // admin panel
  "https://zeedaddyseller.vercel.app", // seller panel
  "http://localhost:5173",    // local dev
  "http://localhost:5174",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(requestContext)


app.use(express.json())
app.use(cookieParser())
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'))
}
app.use(helmet({
    crossOriginResourcePolicy: false
}))


app.get("/", (request, response) => {
    ///server to client
    response.json({
        message: "Server is running " + process.env.PORT
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


app.use('/api/user',userRouter)
app.use('/api/category',categoryRouter)
app.use('/api/product',productRouter);
app.use("/api/cart",cartRouter)
app.use("/api/myList",myListRouter)
app.use("/api/address",addressRouter)
app.use("/api/homeSlides",homeSlidesRouter)
app.use("/api/bannerV1",bannerV1Router)
app.use("/api/bannerList2",bannerList2Router)
app.use("/api/blog",blogRouter)
app.use("/api/order",orderRouter)
app.use("/api/logo",logoRouter)
app.use("/api/notifications",notificationRouter)
app.use("/api/coupon",couponRouter)
app.use("/api/notification-settings",notificationSettingRouter)

app.use(notFoundHandler)
app.use(globalErrorHandler)


connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("Server is running", process.env.PORT);
    });

    // 🔥 Auto self ping every 5 min
    setInterval(async () => {
        try {
            const url = `https://sonuserver-5.onrender.com/health`;
            const res = await fetch(url);
            console.log("Self ping success:", res.status);
        } catch (err) {
            console.log("Self ping failed:", err.message);
        }
    }, 5 * 60 * 1000); // 5 min
});