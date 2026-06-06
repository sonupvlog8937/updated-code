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
  productOptions: [{
    name: { type: String, default: "", trim: true },
    label: { type: String, default: "", trim: true },
    values: [{
      label: { type: String, default: "", trim: true },
      value: { type: String, default: "", trim: true },
      price: { type: Number, default: 0, min: 0 },
      oldPrice: { type: Number, default: 0, min: 0 },
      isDefault: { type: Boolean, default: false },
    }],
  }],
  image: { type: String, default: "" },
  images: [{ type: String, default: "" }],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GoMarketCategory", default: null, index: true },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GoMarketSubCategory", default: null, index: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  description: { type: String, default: "" },
  isAvailable: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  soldCount: { type: Number, default: 0, min: 0, index: true },
}, { timestamps: true });
restaurantItemSchema.index({ itemName: "text", description: "text" });
export default mongoose.model("RestaurantItem", restaurantItemSchema);