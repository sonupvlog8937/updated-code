import { executeSearch, executeSuggestions, getSearchDefaults } from "../services/search.service.js";
import { recordSearchHistory, buildHistoryFromRequest } from "../services/searchHistory.service.js";
import { incrementTopSearch, getTopSearches } from "../services/topSearch.service.js";
import {
  getRecentSearches,
  saveRecentSearch,
  deleteRecentSearch,
  clearRecentSearches,
} from "../services/recentSearch.service.js";
import {
  trackSearch,
  trackClick,
  getSearchAnalytics,
  getZeroResultAnalytics,
  getTrendingKeywords,
} from "../services/searchAnalytics.service.js";

const formatRecent = (items = []) =>
  items.map((r) => ({ keyword: r.keyword, searchedAt: r.updatedAt || r.createdAt }));

/**
 * GET /api/search
 */
export async function searchController(req, res) {
  try {
    const { q, page, limit, scope, sortBy, filters } = req.searchParams;

    if (!q) {
      const defaults = await getSearchDefaults(req.userId || null);
      let recentSearches = [];
      if (req.userId) {
        const recent = await getRecentSearches(req.userId);
        recentSearches = formatRecent(recent);
      }
      return res.status(200).json({
        ...defaults,
        recentSearches,
        suggestions: [],
        didYouMean: null,
        products: defaults.popularProducts || [],
      });
    }

    const result = await executeSearch({ query: q, page, limit, scope, filters, sortBy });

    incrementTopSearch(q).catch(() => {});
    trackSearch(q, result.totalProducts).catch(() => {});

    const historyMeta = buildHistoryFromRequest(req, {
      userId: req.userId || null,
      keyword: q,
      resultCount: result.totalProducts,
    });
    recordSearchHistory(historyMeta).catch(() => {});

    if (req.userId) {
      saveRecentSearch(req.userId, q).catch(() => {});
    }

    let recentSearches = [];
    if (req.userId) {
      const recent = await getRecentSearches(req.userId);
      recentSearches = formatRecent(recent);
    }

    const topItems = await getTopSearches({ limit: 10 });

    return res.status(200).json({
      ...result,
      topSearches: topItems.map((t) => t.keyword),
      recentSearches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Search failed",
    });
  }
}

/**
 * GET /api/search/suggestions
 */
export async function suggestionsController(req, res) {
  try {
    const { q, limit } = req.suggestionParams;

    if (!q) {
      const defaults = await getSearchDefaults(req.userId || null);
      let recentSearches = [];
      if (req.userId) {
        const recent = await getRecentSearches(req.userId);
        recentSearches = formatRecent(recent);
      }
      return res.status(200).json({
        success: true,
        suggestions: [],
        products: [],
        categories: defaults.popularCategories || [],
        brands: defaults.popularBrands || [],
        topSearches: defaults.topSearches?.map((t) => t.keyword) || defaults.trending || [],
        trending: defaults.trending || [],
        recentSearches,
        didYouMean: null,
        loading: false,
      });
    }

    const result = await executeSuggestions({ query: q, limit });

    let recentSearches = [];
    if (req.userId) {
      const recent = await getRecentSearches(req.userId);
      recentSearches = formatRecent(recent);
    }

    return res.status(200).json({
      ...result,
      recentSearches,
      trending: result.topSearches || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Suggestions failed",
    });
  }
}

/**
 * GET /api/search/top
 */
export async function topSearchesController(req, res) {
  try {
    const { period, limit } = req.topSearchParams;
    const items = await getTopSearches({ period, limit });

    return res.status(200).json({
      success: true,
      period,
      topSearches: items.map((t) => ({
        keyword: t.keyword,
        count: t.count,
        todayCount: t.todayCount,
        weekCount: t.weekCount,
        monthCount: t.monthCount,
        lastSearchedAt: t.lastSearchedAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch top searches",
    });
  }
}

/**
 * GET /api/search/recent
 */
export async function recentSearchesController(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const recent = await getRecentSearches(req.userId);
    return res.status(200).json({
      success: true,
      recentSearches: formatRecent(recent),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch recent searches",
    });
  }
}

/**
 * POST /api/search/history
 */
export async function createHistoryController(req, res) {
  try {
    const { keyword, resultCount, clickedProduct, clickedProductType } = req.historyParams;
    const meta = buildHistoryFromRequest(req, {
      userId: req.userId || null,
      keyword,
      resultCount,
      clickedProduct,
      clickedProductType,
    });

    await recordSearchHistory(meta);
    if (clickedProduct) trackClick(keyword).catch(() => {});
    incrementTopSearch(keyword).catch(() => {});

    return res.status(201).json({ success: true, message: "Search history recorded" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to record search history",
    });
  }
}

/**
 * DELETE /api/search/recent
 */
export async function deleteRecentController(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const recent = await deleteRecentSearch(req.userId, req.recentKeyword);
    return res.status(200).json({
      success: true,
      recentSearches: formatRecent(recent),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete recent search",
    });
  }
}

/**
 * DELETE /api/search/recent/all
 */
export async function clearRecentController(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    await clearRecentSearches(req.userId);
    return res.status(200).json({ success: true, recentSearches: [] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear recent searches",
    });
  }
}

/**
 * GET /api/search/analytics
 */
export async function analyticsController(req, res) {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const sortBy = req.query.sortBy || "totalSearches";
    const type = req.query.type || "all";

    let analytics;
    if (type === "zeroResults") {
      analytics = await getZeroResultAnalytics(limit);
    } else if (type === "trending") {
      analytics = await getTrendingKeywords(limit);
    } else {
      analytics = await getSearchAnalytics({ limit, sortBy });
    }

    return res.status(200).json({ success: true, analytics });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch analytics",
    });
  }
}

/**
 * POST /api/search/voice — voice search ready endpoint
 */
export async function voiceSearchController(req, res) {
  try {
    const transcript = String(req.body.transcript || req.body.query || "").trim();
    if (!transcript) {
      return res.status(400).json({ success: false, message: "Transcript is required" });
    }

    req.searchParams = {
      q: transcript,
      page: 1,
      limit: 20,
      scope: "all",
      sortBy: "relevance",
      filters: {},
    };

    return searchController(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Voice search failed",
    });
  }
}

export default {
  searchController,
  suggestionsController,
  topSearchesController,
  recentSearchesController,
  createHistoryController,
  deleteRecentController,
  clearRecentController,
  analyticsController,
  voiceSearchController,
};
