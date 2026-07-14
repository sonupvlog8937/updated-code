import TopSearchModel from "../models/topSearch.model.js";
import { normalizeSearchText } from "../utils/searchEngine.js";

const getDayKey = (date = new Date()) => date.toISOString().slice(0, 10);
const getWeekKey = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
};
const getMonthKey = (date = new Date()) => date.toISOString().slice(0, 7);

export const topSearchRepository = {
  increment: async (keyword) => {
    const normalized = normalizeSearchText(keyword);
    if (!normalized) return null;

    const now = new Date();
    const dayKey = getDayKey(now);
    const weekKey = getWeekKey(now);
    const monthKey = getMonthKey(now);

    const existing = await TopSearchModel.findOne({ normalizedKeyword: normalized });

    if (!existing) {
      return TopSearchModel.create({
        keyword: keyword.trim(),
        normalizedKeyword: normalized,
        count: 1,
        todayCount: 1,
        weekCount: 1,
        monthCount: 1,
        lastSearchedAt: now,
        lastResetDay: dayKey,
        lastResetWeek: weekKey,
        lastResetMonth: monthKey,
      });
    }

    const updates = {
      keyword: keyword.trim(),
      count: existing.count + 1,
      lastSearchedAt: now,
      todayCount: existing.lastResetDay === dayKey ? existing.todayCount + 1 : 1,
      weekCount: existing.lastResetWeek === weekKey ? existing.weekCount + 1 : 1,
      monthCount: existing.lastResetMonth === monthKey ? existing.monthCount + 1 : 1,
      lastResetDay: dayKey,
      lastResetWeek: weekKey,
      lastResetMonth: monthKey,
    };

    return TopSearchModel.findByIdAndUpdate(existing._id, updates, { new: true });
  },

  getTop: (limit = 20) =>
    TopSearchModel.find().sort({ count: -1 }).limit(limit).lean(),

  getTopToday: (limit = 20) =>
    TopSearchModel.find().sort({ todayCount: -1, lastSearchedAt: -1 }).limit(limit).lean(),

  getTopWeek: (limit = 20) =>
    TopSearchModel.find().sort({ weekCount: -1, lastSearchedAt: -1 }).limit(limit).lean(),

  getTopMonth: (limit = 20) =>
    TopSearchModel.find().sort({ monthCount: -1, lastSearchedAt: -1 }).limit(limit).lean(),
};

export default topSearchRepository;
