import mongoose from "mongoose";
const appSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  shippingFee: { type: Number, default: 0, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  freeShippingAbove: { type: Number, default: 0, min: 0 },
  collections: [{ title: { type: String, default: "" }, type: { type: String, default: "mixed" }, categoryId: { type: String, default: "" }, image: { type: String, default: "" }, sortOrder: { type: Number, default: 0 }, isActive: { type: Boolean, default: true } }],
}, { timestamps: true });
export default mongoose.model("AppSettings", appSettingsSchema);
