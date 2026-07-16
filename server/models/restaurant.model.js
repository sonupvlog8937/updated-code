import mongoose from "mongoose";
const restaurantSchema = new mongoose.Schema({
  marketId: { type: mongoose.Schema.Types.ObjectId, ref: "Market", required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "ShopOwner", required: true, index: true },
  restaurantName: { type: String, required: true, trim: true, index: true },
  restaurantBanner: { type: String, default: "" },
  restaurantLogo: { type: String, default: "" },
  address: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  locationUpdatedAt: { type: Date, default: null },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  totalMenus: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
  description: { type: String, default: "" },
  isOpen: { type: Boolean, default: true },
  deliveryMinutes: { type: Number, default: 30, min: 5, max: 120 },
  minOrderValue: { type: Number, default: 149, min: 0 },
  avgPrepMinutes: { type: Number, default: 25, min: 5, max: 90 },
}, { timestamps: true });
restaurantSchema.index({ restaurantName: "text", address: "text", description: "text" });
export default mongoose.model("Restaurant", restaurantSchema);