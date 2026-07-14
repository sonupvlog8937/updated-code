import mongoose from "mongoose";
import { normalizeSearchText } from "../utils/searchEngine.js";

/**
 * TrendingSearch Model
 * Automatically calculates trending searches based on recent activity
 * Separate from TopSearch which tracks all-time popularity
 */
const trendingSearchSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    normalizedKeyword: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    // Recent activity counters
    last24hCount: { type: Number, default: 0, min: 0, index: true },
    last7dCount: { type: Number, default: 0, min: 0, index: true },
    last30dCount: { type: Number, default: 0, min: 0, index: true },
    
    // Trending score (calculated from recent activity + growth rate)
    trendingScore: { type: Number, default: 0, min: 0, index: true },
    
    // Growth metrics
    growthRate: { type: Number, default: 0 }, // Percentage growth
    velocityScore: { type: Number, default: 0 }, // Speed of growth
    
    // Last search timestamp
    lastSearchedAt: { type: Date, default: Date.now, index: true },
    
    // Reset timestamps for cleanup
    lastReset24h: { type: Date, default: Date.now },
    lastReset7d: { type: Date, default: Date.now },
    lastReset30d: { type: Date, default: Date.now },
    
    // Additional metadata
    category: { type: String, default: "", trim: true },
    peakHour: { type: Number, min: 0, max: 23 }, // Hour of day when most searched
    
    // TTL: Auto-delete after 90 days of inactivity
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true },
);

// Pre-save hook to normalize keyword
trendingSearchSchema.pre("validate", function (next) {
  this.normalizedKeyword = normalizeSearchText(this.keyword);
  this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
  next();
});

// Compound indexes for better query performance
trendingSearchSchema.index({ trendingScore: -1, lastSearchedAt: -1 });
trendingSearchSchema.index({ last24hCount: -1, growthRate: -1 });
trendingSearchSchema.index({ last7dCount: -1, lastSearchedAt: -1 });
trendingSearchSchema.index({ normalizedKeyword: 1, lastSearchedAt: -1 });

// Static method to calculate trending score
trendingSearchSchema.statics.calculateTrendingScore = function (counts) {
  const { last24hCount = 0, last7dCount = 0, last30dCount = 0 } = counts;
  
  // Weight recent activity more heavily
  const score = (last24hCount * 10) + (last7dCount * 3) + (last30dCount * 1);
  return score;
};

// Static method to calculate growth rate
trendingSearchSchema.statics.calculateGrowthRate = function (current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export default mongoose.model("TrendingSearch", trendingSearchSchema);
