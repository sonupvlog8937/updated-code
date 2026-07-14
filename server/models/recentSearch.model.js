import mongoose from 'mongoose';

/**
 * Recent Search Model
 * Stores user's recent searches (last 20) for quick access
 */

const RecentSearchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedKeyword: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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

// Compound indexes
RecentSearchSchema.index({ userId: 1, createdAt: -1 });
RecentSearchSchema.index({ userId: 1, normalizedKeyword: 1 });

// TTL index - automatically delete after 90 days (using createdAt from timestamps)
RecentSearchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Static methods

/**
 * Add a recent search
 */
RecentSearchSchema.statics.addRecent = async function (userId, keyword) {
  try {
    const normalizedKeyword = keyword.toLowerCase().trim();

    // Remove existing entry for this keyword (to avoid duplicates)
    await this.deleteOne({ userId, normalizedKeyword });

    // Add new entry
    const recent = new this({
      userId,
      keyword,
      normalizedKeyword,
      timestamp: new Date(),
    });

    await recent.save();

    // Keep only last 20 searches per user
    const allRecent = await this.find({ userId })
      .sort({ timestamp: -1 })
      .skip(20)
      .select('_id');

    if (allRecent.length > 0) {
      const idsToDelete = allRecent.map((r) => r._id);
      await this.deleteMany({ _id: { $in: idsToDelete } });
    }

    return recent;
  } catch (error) {
    console.error('Error adding recent search:', error);
    throw error;
  }
};

/**
 * Get user's recent searches
 */
RecentSearchSchema.statics.getRecent = async function (userId, limit = 20) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('keyword timestamp')
    .lean();
};

/**
 * Delete a specific recent search
 */
RecentSearchSchema.statics.deleteRecent = async function (userId, searchId) {
  return this.deleteOne({ _id: searchId, userId });
};

/**
 * Clear all recent searches for a user
 */
RecentSearchSchema.statics.clearAll = async function (userId) {
  return this.deleteMany({ userId });
};

/**
 * Check if keyword exists in recent searches
 */
RecentSearchSchema.statics.exists = async function (userId, keyword) {
  const normalizedKeyword = keyword.toLowerCase().trim();
  const count = await this.countDocuments({ userId, normalizedKeyword });
  return count > 0;
};

const RecentSearch = mongoose.model('RecentSearch', RecentSearchSchema);

export default RecentSearch;
