import mongoose from "mongoose";

const marketSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  city: { type: String, required: true, trim: true, index: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  banner: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
}, { timestamps: true });
marketSchema.index({ name: "text", city: "text", state: "text", pincode: "text" });
marketSchema.index({ latitude: 1, longitude: 1 });
export default mongoose.model("Market", marketSchema);