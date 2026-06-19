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
  subSubCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GoMarketSubCategory", default: null, index: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  description: { type: String, default: "" },
  isFeatured: { type: Boolean, default: false, index: true },
  soldCount: { type: Number, default: 0, min: 0, index: true },
  keywords: { type: String, default: "", trim: true },
  tags: { type: String, default: "", trim: true },
  searchKeywords: { type: String, default: "", trim: true },
  seoDescription: { type: String, default: "", trim: true },
  attributes: { type: String, default: "", trim: true },
  productType: { type: String, default: "", trim: true },
}, { timestamps: true });
groceryProductSchema.index({ name: "text", description: "text", title: "text", keywords: "text", tags: "text", searchKeywords: "text", seoDescription: "text", attributes: "text", productType: "text" });
export default mongoose.model("GroceryProduct", groceryProductSchema);