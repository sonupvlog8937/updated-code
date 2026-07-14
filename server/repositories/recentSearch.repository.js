import RecentSearchModel from "../models/recentSearch.model.js";
import { normalizeSearchText } from "../utils/searchEngine.js";

const MAX_RECENT = 20;

export const recentSearchRepository = {
  upsert: async (userId, keyword) => {
    const normalized = normalizeSearchText(keyword);
    if (!userId || !normalized) return [];

    await RecentSearchModel.findOneAndUpdate(
      { userId, normalizedKeyword: normalized },
      { keyword: keyword.trim(), normalizedKeyword: normalized },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const all = await RecentSearchModel.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    if (all.length > MAX_RECENT) {
      const toDelete = all.slice(MAX_RECENT).map((r) => r._id);
      await RecentSearchModel.deleteMany({ _id: { $in: toDelete } });
    }

    return RecentSearchModel.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(MAX_RECENT)
      .lean();
  },

  findByUser: (userId, limit = MAX_RECENT) =>
    RecentSearchModel.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean(),

  deleteOne: async (userId, keyword) => {
    const normalized = normalizeSearchText(keyword);
    await RecentSearchModel.deleteOne({ userId, normalizedKeyword: normalized });
    return RecentSearchModel.find({ userId }).sort({ updatedAt: -1 }).limit(MAX_RECENT).lean();
  },

  deleteAll: async (userId) => {
    await RecentSearchModel.deleteMany({ userId });
    return [];
  },
};

export default recentSearchRepository;
