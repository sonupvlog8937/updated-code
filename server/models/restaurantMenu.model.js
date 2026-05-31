import mongoose from "mongoose";
const restaurantMenuSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  menuName: { type: String, required: true, trim: true, index: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
}, { timestamps: true });
restaurantMenuSchema.index({ menuName: "text", description: "text" });
export default mongoose.model("RestaurantMenu", restaurantMenuSchema);