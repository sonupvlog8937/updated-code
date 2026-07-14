import SearchAnalyticsModel from "../models/searchAnalytics.model.js";
import { normalizeSearchText } from "../utils/searchEngine.js";

export const searchAnalyticsRepository = {
  recordSearch: async (keyword, resultCount = 0) => {
    const normalized = normalizeSearchText(keyword);
    if (!normalized) return null;

    const isSuccess = resultCount > 0;
    const existing = await SearchAnalyticsModel.findOne({ normalizedKeyword: normalized });

    if (!existing) {
      return SearchAnalyticsModel.create({
        keyword: keyword.trim(),
        normalizedKeyword: normalized,
        totalSearches: 1,
        successfulSearches: isSuccess ? 1 : 0,
        failedSearches: isSuccess ? 0 : 1,
        zeroResultCount: isSuccess ? 0 : 1,
        averageResultCount: resultCount,
      });
    }

    const totalSearches = existing.totalSearches + 1;
    const successfulSearches = existing.successfulSearches + (isSuccess ? 1 : 0);
    const failedSearches = existing.failedSearches + (isSuccess ? 0 : 1);
    const zeroResultCount = existing.zeroResultCount + (isSuccess ? 0 : 1);
    const averageResultCount =
      (existing.averageResultCount * existing.totalSearches + resultCount) / totalSearches;

    return SearchAnalyticsModel.findByIdAndUpdate(
      existing._id,
      {
        keyword: keyword.trim(),
        totalSearches,
        successfulSearches,
        failedSearches,
        zeroResultCount,
        averageResultCount,
        CTR: existing.clickCount > 0 ? (existing.clickCount / totalSearches) * 100 : 0,
      },
      { new: true },
    );
  },

  recordClick: async (keyword) => {
    const normalized = normalizeSearchText(keyword);
    if (!normalized) return null;

    const existing = await SearchAnalyticsModel.findOne({ normalizedKeyword: normalized });
    if (!existing) return null;

    const clickCount = existing.clickCount + 1;
    const CTR = existing.totalSearches > 0 ? (clickCount / existing.totalSearches) * 100 : 0;

    return SearchAnalyticsModel.findByIdAndUpdate(
      existing._id,
      { clickCount, CTR },
      { new: true },
    );
  },

  getAnalytics: ({ limit = 50, sortBy = "totalSearches" } = {}) => {
    const sortField = ["totalSearches", "failedSearches", "zeroResultCount", "CTR"].includes(sortBy)
      ? sortBy
      : "totalSearches";
    return SearchAnalyticsModel.find()
      .sort({ [sortField]: -1 })
      .limit(limit)
      .lean();
  },

  getZeroResultAnalytics: (limit = 20) =>
    SearchAnalyticsModel.find({ zeroResultCount: { $gt: 0 } })
      .sort({ zeroResultCount: -1 })
      .limit(limit)
      .lean(),

  getTrendingKeywords: (limit = 20) =>
    SearchAnalyticsModel.find({ totalSearches: { $gt: 0 } })
      .sort({ totalSearches: -1, CTR: -1 })
      .limit(limit)
      .lean(),
};

export default searchAnalyticsRepository;
