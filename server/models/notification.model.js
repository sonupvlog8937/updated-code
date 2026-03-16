import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ["Orders", "Offers", "System", "All"],
            default: "System",
        },
        icon: {
            type: String,
            default: "🔔",
        },
        actionUrl: {
            type: String,
            default: "", // Agar kisi specific page pe bhejna ho (e.g., "/my-orders")
        },
        unread: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Performance ke liye Indexes (Taaki user ki notifications fast load ho)
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, unread: 1 });

const NotificationModel = mongoose.model("Notification", notificationSchema);

export default NotificationModel;