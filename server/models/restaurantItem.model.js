import mongoose from "mongoose";
const restaurantItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  menuId: { type: mongoose.Schema.Types.ObjectId, ref: "RestaurantMenu", required: true, index: true },
  itemName: { type: String, required: true, trim: true, index: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: "" },
}, { timestamps: true });
restaurantItemSchema.index({ itemName: "text", description: "text" });
export default mongoose.model("RestaurantItem", restaurantItemSchema);