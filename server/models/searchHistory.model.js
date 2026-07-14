import mongoose from 'mongoose';

/**
 * Search History Model
 * Tracks every search made by users for analytics and personalization
 */

const SearchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    normalizedKeyword: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['website', 'android', 'ios', 'mobile-web'],
      default: 'website',
      index: true,
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    clickedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    purchasedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    filters: {
      brands: [String],
      categories: [String],
      minPrice: Number,
      maxPrice: Number,
      minRating: Number,
    },
    sortBy: {
      type: String,
      enum: ['relevance', 'priceAsc', 'priceDesc', 'rating', 'popular', 'latest'],
      default: 'relevance',
    },
    sessionId: {
      type: String,
      index: true,
    },
    deviceInfo: {
      userAgent: String,
      deviceType: String,
      browser: String,
      os: String,
    },
    location: {
      country: String,
      state: String,
      city: String,
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number], // [longitude, latitude]
      },
    },
    searchDuration: {
      type: Number, // milliseconds
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ normalizedKeyword: 1, createdAt: -1 });
SearchHistorySchema.index({ platform: 1, createdAt: -1 });
SearchHistorySchema.index({ userId: 1, platform: 1, createdAt: -1 });
SearchHistorySchema.index({ sessionId: 1, createdAt: -1 });

// Text index for full-text search
SearchHistorySchema.index({ keyword: 'text', normalizedKeyword: 'text' });

// Geospatial index for location-based analytics
SearchHistorySchema.index({ 'location.coordinates': '2dsphere' });

// TTL index - automatically delete old search history after 1 year (using createdAt from timestamps)
SearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Static methods

/**
 * Save search history
 */
SearchHistorySchema.statics.saveSearch = async function (data) {
  try {
    const history = new this({
      userId: data.userId,
      keyword: data.keyword,
      normalizedKeyword: (data.keyword || '').toLowerCase().trim(),
      platform: data.platform || 'website',
      resultCount: data.resultCount || 0,
      filters: data.filters,
      sortBy: data.sortBy,
      sessionId: data.sessionId,
      deviceInfo: data.deviceInfo,
      location: data.location,
      searchDuration: data.searchDuration,
    });

    await history.save();
    return history;
  } catch (error) {
    console.error('Error saving search history:', error);
    throw error;
  }
};

/**
 * Get user search history
 */
SearchHistorySchema.statics.getUserHistory = async function (userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get popular searches
 */
SearchHistorySchema.statics.getPopularSearches = async function (timeRange = 'week', limit = 20) {
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 7));
  }

  return this.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: '$normalizedKeyword',
        count: { $sum: 1 },
        lastSearched: { $max: '$timestamp' },
        avgResultCount: { $avg: '$resultCount' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        keyword: '$_id',
        count: 1,
        lastSearched: 1,
        avgResultCount: 1,
      },
    },
  ]);
};

/**
 * Get failed searches (no results)
 */
SearchHistorySchema.statics.getFailedSearches = async function (limit = 50) {
  return this.find({ resultCount: 0 })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get search analytics
 */
SearchHistorySchema.statics.getAnalytics = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date(),
        },
      },
    },
    {
      $facet: {
        totalSearches: [{ $count: 'count' }],
        successfulSearches: [
          { $match: { resultCount: { $gt: 0 } } },
          { $count: 'count' },
        ],
        failedSearches: [
          { $match: { resultCount: 0 } },
          { $count: 'count' },
        ],
        platformDistribution: [
          { $group: { _id: '$platform', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        topKeywords: [
          { $group: { _id: '$normalizedKeyword', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ],
        avgResultsPerSearch: [
          { $group: { _id: null, avg: { $avg: '$resultCount' } } },
        ],
      },
    },
  ]);
};

const SearchHistory = mongoose.model('SearchHistory', SearchHistorySchema);

export default SearchHistory;
