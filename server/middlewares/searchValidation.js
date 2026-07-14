import { sanitizeSearchQuery } from "../utils/searchEngine.js";

const VALID_PLATFORMS = ["website", "android", "ios", "unknown"];
const VALID_SCOPES = ["all", "products", "grocery", "restaurant"];
const VALID_SORT = ["relevance", "priceAsc", "priceDesc", "rating", "popular", "latest"];
const VALID_PERIODS = ["all", "today", "week", "month"];

/**
 * Validate GET /api/search query params.
 */
export const validateSearchQuery = (req, res, next) => {
  const q = sanitizeSearchQuery(req.query.q || req.query.query || "");
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const scope = VALID_SCOPES.includes(req.query.scope) ? req.query.scope : "all";
  const sortBy = VALID_SORT.includes(req.query.sortBy) ? req.query.sortBy : "relevance";
  const platform = VALID_PLATFORMS.includes(String(req.query.platform || "").toLowerCase())
    ? String(req.query.platform).toLowerCase()
    : undefined;

  const filters = {};
  if (req.query.brands) {
    filters.brands = String(req.query.brands).split(",").map((b) => b.trim()).filter(Boolean).slice(0, 20);
  }
  if (req.query.minPrice != null) filters.minPrice = Number(req.query.minPrice);
  if (req.query.maxPrice != null) filters.maxPrice = Number(req.query.maxPrice);
  if (req.query.minDiscount != null) filters.minDiscount = Number(req.query.minDiscount);
  if (req.query.minRating != null) filters.minRating = Number(req.query.minRating);
  if (req.query.inStock === "true") filters.inStock = true;
  if (req.query.shopId) filters.shopId = String(req.query.shopId);

  req.searchParams = { q, page, limit, scope, sortBy, platform, filters };
  next();
};

/**
 * Validate suggestions endpoint.
 */
export const validateSuggestionsQuery = (req, res, next) => {
  const q = sanitizeSearchQuery(req.query.q || req.query.query || "");
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
  req.suggestionParams = { q, limit };
  next();
};

/**
 * Validate top searches endpoint.
 */
export const validateTopSearchQuery = (req, res, next) => {
  const period = VALID_PERIODS.includes(req.query.period) ? req.query.period : "all";
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  req.topSearchParams = { period, limit };
  next();
};

/**
 * Validate POST /api/search/history body.
 */
export const validateHistoryBody = (req, res, next) => {
  const keyword = sanitizeSearchQuery(req.body.keyword || req.body.query || "");
  if (!keyword) {
    return res.status(400).json({ success: false, message: "Keyword is required" });
  }

  req.historyParams = {
    keyword,
    resultCount: Math.max(0, parseInt(req.body.resultCount, 10) || 0),
    clickedProduct: req.body.clickedProduct || null,
    clickedProductType: req.body.clickedProductType || null,
  };
  next();
};

/**
 * Validate DELETE recent search.
 */
export const validateRecentDelete = (req, res, next) => {
  const keyword = sanitizeSearchQuery(req.query.keyword || req.body.keyword || "");
  if (!keyword) {
    return res.status(400).json({ success: false, message: "Keyword is required" });
  }
  req.recentKeyword = keyword;
  next();
};

export default {
  validateSearchQuery,
  validateSuggestionsQuery,
  validateTopSearchQuery,
  validateHistoryBody,
  validateRecentDelete,
};
