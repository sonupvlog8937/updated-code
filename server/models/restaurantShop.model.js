import mongoose from "mongoose";

const restaurantShopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    cuisineTags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.1,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgDeliveryTimeMins: {
      type: Number,
      default: 35,
      min: 10,
    },
    minOrderAmount: {
      type: Number,
      default: 149,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 25,
      min: 0,
    },
    promoted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const RestaurantShopModel = mongoose.model("RestaurantShop", restaurantShopSchema);

export default RestaurantShopModel;