import mongoose from "mongoose";
const groceryProductSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "GroceryShop", required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  description: { type: String, default: "" },
}, { timestamps: true });
groceryProductSchema.index({ name: "text", description: "text" });
export default mongoose.model("GroceryProduct", groceryProductSchema);