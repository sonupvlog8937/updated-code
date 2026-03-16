import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from "../controllers/notification.controller.js";

const notificationRouter = Router();

// GET /api/notifications - Get all
notificationRouter.get("/", auth, getUserNotifications);

// PUT /api/notifications/read-all - Mark all as read (Make sure this is ABOVE /:id routes)
notificationRouter.put("/read-all", auth, markAllAsRead);

// PUT /api/notifications/:id/read - Mark single as read
notificationRouter.put("/:id/read", auth, markAsRead);

// DELETE /api/notifications/:id - Dismiss/Delete single notification
notificationRouter.delete("/:id", auth, deleteNotification);

export default notificationRouter;