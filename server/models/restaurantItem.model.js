import mongoose from "mongoose";

const restaurantItemSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantShop",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "Chef Specials",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 4.2,
      min: 0,
      max: 5,
    },
    prepTimeMins: {
      type: Number,
      default: 20,
      min: 5,
    },
    vegType: {
      type: String,
      enum: ["veg", "non-veg", "egg"],
      default: "veg",
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 80,
    },
    bestseller: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const RestaurantItemModel = mongoose.model("RestaurantItem", restaurantItemSchema);

export default RestaurantItemModel;