import mongoose from "mongoose";

const goMarketSubSubCategorySchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GoMarketCategory",
    required: true,
    index: true,
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GoMarketSubCategory",
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true, index: true },
  type: {
    type: String,
    enum: ["grocery", "restaurant", "fashion", "electronics", "medical", "beauty", "home_kitchen", "gifts_toys", "books_stationery", "jewellery", "hardware", "automobile"],
    required: true,
    index: true,
  },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
}, { timestamps: true });

goMarketSubSubCategorySchema.index({ name: 1, subCategoryId: 1 }, { unique: true });

export default mongoose.model("GoMarketSubSubCategory", goMarketSubSubCategorySchema);
