import mongoose from "mongoose";
const groceryShopSchema = new mongoose.Schema({
  marketId: { type: mongoose.Schema.Types.ObjectId, ref: "Market", required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "ShopOwner", required: true, index: true },
  shopType: { 
    type: String, 
    enum: ["grocery", "fashion", "electronics", "medical", "beauty", "home_kitchen", "gifts_toys", "books_stationery", "jewellery", "hardware", "automobile"],
    default: "grocery",
    index: true
  },
  shopName: { type: String, required: true, trim: true, index: true },
  shopBanner: { type: String, default: "" },
  shopLogo: { type: String, default: "" },
  address: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  locationUpdatedAt: { type: Date, default: null },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  totalProducts: { type: Number, default: 0 },
  description: { type: String, default: "" },
  isOpen: { type: Boolean, default: true },
  deliveryMinutes: { type: Number, default: 15, min: 5, max: 120 },
  minOrderValue: { type: Number, default: 99, min: 0 },
}, { timestamps: true });
groceryShopSchema.index({ shopName: "text", address: "text", description: "text" });
export default mongoose.model("GroceryShop", groceryShopSchema);