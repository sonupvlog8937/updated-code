import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    audience: {
      type: String,
      enum: ["global", "grocery", "restaurant"],
      default: "global",
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroceryShop",
      default: null,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },
    productIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroceryProduct",
    }],
    restaurantItemIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantItem",
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

const CouponModel = mongoose.model("Coupon", couponSchema);

export default CouponModel;