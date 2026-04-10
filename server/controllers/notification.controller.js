import NotificationModel from "../models/notification.model.js";

// 1. Get all notifications for the logged-in user
export async function getUserNotifications(request, response) {
    try {
        const userId = request.userId; // auth middleware se aayega
        
        // Fetch last 50 notifications to keep it fast
        const notifications = await NotificationModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return response.status(200).json({
            error: false,
            success: true,
            data: notifications,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

// 2. Mark a single notification as read
export async function markAsRead(request, response) {
    try {
        const userId = request.userId;
        const notificationId = request.params.id;

        const updated = await NotificationModel.findOneAndUpdate(
            { _id: notificationId, userId: userId },
            { unread: false },
            { new: true }
        );

        if (!updated) {
            return response.status(404).json({ error: true, success: false, message: "Notification not found" });
        }

        return response.status(200).json({
            error: false,
            success: true,
            message: "Marked as read",
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// 3. Mark ALL notifications as read for the user
export async function markAllAsRead(request, response) {
    try {
        const userId = request.userId;

        await NotificationModel.updateMany(
            { userId: userId, unread: true },
            { $set: { unread: false } }
        );

        return response.status(200).json({
            error: false,
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// 4. Delete/Dismiss a notification
export async function deleteNotification(request, response) {
    try {
        const userId = request.userId;
        const notificationId = request.params.id;

        const deleted = await NotificationModel.findOneAndDelete({
            _id: notificationId,
            userId: userId,
        });

        if (!deleted) {
            return response.status(404).json({ error: true, success: false, message: "Notification not found" });
        }

        return response.status(200).json({
            error: false,
            success: true,
            message: "Notification deleted",
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// ------------------------------------------------------------------
// HELPER FUNCTION: Dusre controllers (jaise Order Controller) se 
// notification bhejne ke liye is function ko use karein.
// ------------------------------------------------------------------
export async function createNotification(userId, title, message, category = "System", icon = "🔔", actionUrl = "") {
    try {
        await NotificationModel.create({
            userId,
            title,
            message,
            category,
            icon,
            actionUrl
        });
    } catch (error) {
        console.error("Failed to create notification:", error.message);
    }
}