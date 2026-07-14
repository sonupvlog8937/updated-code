import mongoose from "mongoose";
import { normalizeSearchText } from "../utils/searchEngine.js";

const topSearchSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true, trim: true, maxlength: 120 },
    normalizedKeyword: { type: String, required: true, unique: true, trim: true },
    count: { type: Number, default: 1, min: 0 },
    todayCount: { type: Number, default: 1, min: 0 },
    weekCount: { type: Number, default: 1, min: 0 },
    monthCount: { type: Number, default: 1, min: 0 },
    lastSearchedAt: { type: Date, default: Date.now, index: true },
    lastResetDay: { type: String, default: "" },
    lastResetWeek: { type: String, default: "" },
    lastResetMonth: { type: String, default: "" },
  },
  { timestamps: true },
);

topSearchSchema.pre("validate", function setNormalized(next) {
  this.normalizedKeyword = normalizeSearchText(this.keyword);
  next();
});

topSearchSchema.index({ count: -1 });
topSearchSchema.index({ todayCount: -1 });
topSearchSchema.index({ weekCount: -1 });
topSearchSchema.index({ monthCount: -1 });
topSearchSchema.index({ lastSearchedAt: -1 });

export default mongoose.model("TopSearch", topSearchSchema);
