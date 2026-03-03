import mongoose from "mongoose";

const restaurantOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantShop",
      required: true,
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RestaurantItem",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
         discountPercent: {
          type: Number,
          default: 0,
          min: 0,
          max: 80,
        },
      },
    ],
     pricing: {
      subtotal: { type: Number, default: 0, min: 0 },
      itemDiscount: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      platformFee: { type: Number, default: 0, min: 0 },
      gst: { type: Number, default: 0, min: 0 },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "cod", "wallet"],
      default: "upi",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "placed",
    },
    statusTimeline: [
      {
        status: {
          type: String,
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    estimatedDeliveryAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const RestaurantOrderModel = mongoose.model("RestaurantOrder", restaurantOrderSchema);

export default RestaurantOrderModel;