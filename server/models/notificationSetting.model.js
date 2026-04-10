import mongoose from "mongoose";

const notificationSettingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    orderUpdates: { type: Boolean, default: true },
    offersAndCoupons: { type: Boolean, default: true },
    sellerProgram: { type: Boolean, default: true },
    productUpdates: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const NotificationSettingModel = mongoose.model("NotificationSetting", notificationSettingSchema);

export default NotificationSettingModel;