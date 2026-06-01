import mongoose from "mongoose";
const restaurantItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  menuId: { type: mongoose.Schema.Types.ObjectId, ref: "RestaurantMenu", required: true, index: true },
  itemName: { type: String, required: true, trim: true, index: true },
  title: { type: String, default: "", trim: true },
  specifications: [{
    key: { type: String, default: "" },
    value: { type: String, default: "" },
  }],
  image: { type: String, default: "" },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GoMarketCategory", default: null, index: true },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GoMarketSubCategory", default: null, index: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: "" },
  isAvailable: { type: Boolean, default: true, index: true },
}, { timestamps: true });
restaurantItemSchema.index({ itemName: "text", description: "text" });
export default mongoose.model("RestaurantItem", restaurantItemSchema);