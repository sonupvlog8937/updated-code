import mongoose from "mongoose";
import { normalizeSearchText } from "../utils/searchEngine.js";

const searchAnalyticsSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true, trim: true, maxlength: 120 },
    normalizedKeyword: { type: String, required: true, unique: true, trim: true },
    totalSearches: { type: Number, default: 0, min: 0 },
    successfulSearches: { type: Number, default: 0, min: 0 },
    failedSearches: { type: Number, default: 0, min: 0 },
    averageResultCount: { type: Number, default: 0, min: 0 },
    clickCount: { type: Number, default: 0, min: 0 },
    CTR: { type: Number, default: 0, min: 0, max: 100 },
    conversionCount: { type: Number, default: 0, min: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 100 },
    zeroResultCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

searchAnalyticsSchema.pre("validate", function setNormalized(next) {
  this.normalizedKeyword = normalizeSearchText(this.keyword);
  next();
});

searchAnalyticsSchema.index({ totalSearches: -1 });
searchAnalyticsSchema.index({ failedSearches: -1 });
searchAnalyticsSchema.index({ zeroResultCount: -1 });
searchAnalyticsSchema.index({ CTR: -1 });

export default mongoose.model("SearchAnalytics", searchAnalyticsSchema);
