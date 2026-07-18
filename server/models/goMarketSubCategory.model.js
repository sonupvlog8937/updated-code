import mongoose from "mongoose";

const goMarketSubCategorySchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GoMarketCategory",
    required: true,
    index: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "parentModel",
    required: true,
    index: true,
  },
  parentModel: {
    type: String,
    enum: ["GoMarketCategory", "GoMarketSubCategory"],
    default: "GoMarketCategory",
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

goMarketSubCategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });

export default mongoose.model("GoMarketSubCategory", goMarketSubCategorySchema);
