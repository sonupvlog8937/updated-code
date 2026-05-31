import mongoose from "mongoose";
const shopOwnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  mobile: { type: String, required: true, trim: true },
  avatar: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
}, { timestamps: true });
export default mongoose.model("ShopOwner", shopOwnerSchema);