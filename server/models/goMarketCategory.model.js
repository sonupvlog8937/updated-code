import mongoose from "mongoose";

const goMarketCategorySchema = new mongoose.Schema({
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

goMarketCategorySchema.index({ name: "text", description: "text" });

goMarketCategorySchema.index({ name: 1, type: 1 }, { unique: true });

export default mongoose.model("GoMarketCategory", goMarketCategorySchema);
