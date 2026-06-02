import mongoose from "mongoose";
const groceryProductSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "GroceryShop", required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  title: { type: String, default: "", trim: true },
  specifications: [{
    key: { type: String, default: "" },
    value: { type: String, default: "" },
  }],
  productOptions: [{
    name: { type: String, default: "", trim: true },
    label: { type: String, default: "", trim: true },
    values: [{ type: String, trim: true }],
  }],
  image: { type: String, default: "" },
  images: [{ type: String, default: "" }],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GoMarketCategory", default: null, index: true },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GoMarketSubCategory", default: null, index: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  description: { type: String, default: "" },
  isFeatured: { type: Boolean, default: false, index: true },
  soldCount: { type: Number, default: 0, min: 0, index: true },
}, { timestamps: true });
groceryProductSchema.index({ name: "text", description: "text" });
export default mongoose.model("GroceryProduct", groceryProductSchema);