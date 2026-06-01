import mongoose from "mongoose";

const goMarketSubCategorySchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GoMarketCategory",
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true, index: true },
  type: {
    type: String,
    enum: ["grocery", "restaurant"],
    required: true,
    index: true,
  },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
}, { timestamps: true });

goMarketSubCategorySchema.index({ name: 1, parentId: 1 }, { unique: true });

export default mongoose.model("GoMarketSubCategory", goMarketSubCategorySchema);
