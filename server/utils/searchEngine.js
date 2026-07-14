import { levenshtein } from "./searchSuggest.js";
import { expandSynonyms, expandSynonymsSync } from "./searchSynonyms.js";
import { loadStopWords } from "../services/searchStopWord.service.js";
import { getRankingWeights } from "../services/searchSettings.service.js";

// Static fallback stop words (used if database is empty or unavailable)
const STATIC_STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "for", "to", "in", "on", "of", "with", "at", "by",
  "is", "it", "ka", "ke", "ki", "se", "me", "mein", "aur", "ya",
]);

// Static fallback ranking weights
const STATIC_RANK_WEIGHTS = {
  EXACT: 1000,
  STARTS_WITH: 900,
  PREFIX: 800,
  BRAND: 700,
  CATEGORY: 600,
  PRODUCT: 500,
  SYNONYM: 400,
  RELATED: 300,
  POPULAR: 200,
  TRENDING: 100,
};

/** Ranking priority weights (higher = better) - dynamic from database */
export const RANK_WEIGHTS = STATIC_RANK_WEIGHTS;

/** Get dynamic ranking weights from database with fallback */
export const getDynamicRankWeights = async () => {
  try {
    const weights = await getRankingWeights();
    return weights;
  } catch (error) {
    console.warn("Failed to load dynamic ranking weights, using static fallback:", error.message);
    return STATIC_RANK_WEIGHTS;
  }
};

/** Get dynamic stop words from database with fallback */
export const getDynamicStopWords = async () => {
  try {
    const stopWords = await loadStopWords();
    return stopWords;
  } catch (error) {
    console.warn("Failed to load dynamic stop words, using static fallback:", error.message);
    return STATIC_STOP_WORDS;
  }
};

/**
 * Normalize search text: lowercase, trim, accent-insensitive.
 * @param {string} text
 * @returns {string}
 */
export const normalizeSearchText = (text = "") =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Escape special regex characters to prevent regex injection.
 * @param {string} str
 * @returns {string}
 */
export const escapeRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Sanitize user search input.
 * @param {string} query
 * @param {number} maxLength
 * @returns {string}
 */
export const sanitizeSearchQuery = (query = "", maxLength = 120) => {
  return String(query || "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
};

/**
 * Build safe case-insensitive regex from user input.
 * @param {string} query
 * @param {string} flags
 * @returns {RegExp|null}
 */
export const buildSafeRegex = (query = "", flags = "i") => {
  const cleaned = sanitizeSearchQuery(query);
  if (!cleaned) return null;
  try {
    return new RegExp(escapeRegex(cleaned), flags);
  } catch {
    return null;
  }
};

/**
 * Tokenize text into meaningful search tokens.
 * @param {string} text
 * @param {Set<string>} stopWords - Optional custom stop words set
 * @returns {string[]}
 */
export const tokenizeText = (text = "", stopWords = null) => {
  const normalized = normalizeSearchText(text);
  if (!normalized) return [];
  const tokens = normalized.split(/[\s,./\\|+\-_]+/).filter(Boolean);
  const stopWordSet = stopWords || STATIC_STOP_WORDS;
  const filtered = tokens.filter(
    (t) => t.length > 1 && !stopWordSet.has(t),
  );
  return filtered.length ? filtered : tokens;
};

/**
 * Get meaningful tokens excluding stop words (async - uses dynamic stop words).
 * @param {string} query
 * @returns {Promise<string[]>}
 */
export const getMeaningfulTokens = async (query = "") => {
  try {
    const stopWords = await getDynamicStopWords();
    return tokenizeText(query, stopWords);
  } catch (error) {
    console.error("Error in getMeaningfulTokens, falling back to sync:", error.message);
    return getMeaningfulTokensSync(query);
  }
};

/**
 * Get meaningful tokens excluding stop words (sync - uses static stop words).
 * @param {string} query
 * @returns {string[]}
 */
export const getMeaningfulTokensSync = (query = "") => tokenizeText(query);

/**
 * Expand query with synonyms for search (async - uses dynamic synonyms).
 * @param {string} query
 * @returns {Promise<string[]>}
 */
export const getExpandedSearchTerms = async (query = "") => {
  try {
    const base = await getMeaningfulTokens(query);
    const synonyms = await expandSynonyms(query);
    return [...new Set([...base, ...synonyms, normalizeSearchText(query)].filter(Boolean))];
  } catch (error) {
    console.error("Error in getExpandedSearchTerms, falling back to sync:", error.message);
    return getExpandedSearchTermsSync(query);
  }
};

/**
 * Expand query with synonyms for search (sync - uses static synonyms).
 * @param {string} query
 * @returns {string[]}
 */
export const getExpandedSearchTermsSync = (query = "") => {
  const base = getMeaningfulTokensSync(query);
  const synonyms = expandSynonymsSync(query);
  return [...new Set([...base, ...synonyms, normalizeSearchText(query)].filter(Boolean))];
};

/**
 * Build MongoDB-safe $or regex conditions for fields.
 * @param {string[]} terms
 * @param {string[]} fields
 * @returns {object[]}
 */
export const buildRegexOrConditions = (terms = [], fields = []) => {
  const conditions = [];
  for (const term of terms) {
    const regex = buildSafeRegex(term);
    if (!regex) continue;
    const orFields = fields.map((field) => ({ [field]: regex }));
    if (orFields.length) conditions.push({ $or: orFields });
  }
  return conditions;
};

/**
 * Score a searchable item against query terms.
 * @param {object} params
 * @returns {number}
 */
export const scoreSearchItem = ({
  query = "",
  terms = [],
  name = "",
  brand = "",
  category = "",
  fields = [],
  matchType = "product",
  isSynonymMatch = false,
  isPopular = false,
  isTrending = false,
}) => {
  const normalizedQuery = normalizeSearchText(query);
  const searchable = [
    normalizeSearchText(name),
    normalizeSearchText(brand),
    normalizeSearchText(category),
    ...fields.map(normalizeSearchText),
  ].filter(Boolean);

  const combined = searchable.join(" ");
  if (!combined) return 0;

  let score = 0;

  if (combined === normalizedQuery) score += RANK_WEIGHTS.EXACT;
  else if (searchable.some((f) => f.startsWith(normalizedQuery))) score += RANK_WEIGHTS.STARTS_WITH;
  else if (searchable.some((f) => f.includes(normalizedQuery))) score += RANK_WEIGHTS.PREFIX;

  for (const term of terms) {
    if (!term) continue;
    if (normalizeSearchText(brand).includes(term) || normalizeSearchText(brand) === term) {
      score += RANK_WEIGHTS.BRAND;
    }
    if (normalizeSearchText(category).includes(term) || normalizeSearchText(category) === term) {
      score += RANK_WEIGHTS.CATEGORY;
    }
    if (searchable.some((f) => f.includes(term))) {
      score += RANK_WEIGHTS.PRODUCT;
    } else {
      const fuzzyThreshold = term.length > 6 ? 2 : 1;
      const fuzzyMatch = searchable.some((f) =>
        f.split(/\s+/).some((word) => levenshtein(term, word) <= fuzzyThreshold),
      );
      if (fuzzyMatch) score += RANK_WEIGHTS.RELATED;
    }
  }

  if (isSynonymMatch) score += RANK_WEIGHTS.SYNONYM;
  if (isPopular) score += RANK_WEIGHTS.POPULAR;
  if (isTrending) score += RANK_WEIGHTS.TRENDING;

  if (matchType === "brand" && terms.some((t) => normalizeSearchText(brand) === t)) {
    score += RANK_WEIGHTS.BRAND;
  }
  if (matchType === "category" && terms.some((t) => normalizeSearchText(category).includes(t))) {
    score += RANK_WEIGHTS.CATEGORY;
  }

  return score;
};

/**
 * Spell correction using vocabulary.
 * @param {string} query
 * @param {string[]} vocabulary
 * @returns {string|null}
 */
export const getSpellCorrection = (query = "", vocabulary = []) => {
  const words = tokenizeText(query);
  if (!words.length || !vocabulary.length) return null;

  let modified = false;
  const corrected = words.map((word) => {
    if (vocabulary.includes(word)) return word;

    let bestMatch = word;
    let bestDistance = Infinity;

    for (const token of vocabulary) {
      if (Math.abs(token.length - word.length) > 3) continue;
      const dist = levenshtein(word, token);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatch = token;
      }
    }

    const maxDist = word.length > 7 ? 2 : 1;
    if (bestDistance <= maxDist && bestMatch !== word) {
      modified = true;
      return bestMatch;
    }
    return word;
  });

  return modified ? corrected.join(" ") : null;
};

/**
 * Build vocabulary from searchable documents.
 * @param {object[]} items
 * @param {(item: object) => string[]} getFields
 * @returns {string[]}
 */
export const buildVocabulary = (items = [], getFields = () => []) => {
  const vocab = new Set();
  for (const item of items) {
    for (const field of getFields(item)) {
      tokenizeText(field).forEach((t) => {
        if (t.length > 1) vocab.add(t);
      });
    }
  }
  return Array.from(vocab);
};

/**
 * Highlight matched query terms in text (returns HTML-safe markup).
 * @param {string} text
 * @param {string} query
 * @returns {string}
 */
export const highlightSearchText = (text = "", query = "") => {
  const safeText = String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Use sync version — highlightSearchText is called synchronously in map/reduce
  const terms = getMeaningfulTokensSync(query);
  if (!terms.length) return safeText;

  let result = safeText;
  for (const term of terms.sort((a, b) => b.length - a.length)) {
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    result = result.replace(regex, "<mark>$1</mark>");
  }
  return result;
};

/**
 * Paginate array results.
 * @param {Array} items
 * @param {number} page
 * @param {number} limit
 * @returns {{ items: Array, total: number, page: number, totalPages: number }}
 */
export const paginateResults = (items = [], page = 1, limit = 20) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const total = items.length;
  const start = (safePage - 1) * safeLimit;
  return {
    items: items.slice(start, start + safeLimit),
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
};

/**
 * Detect platform from request headers.
 * @param {import('express').Request} req
 * @returns {'website'|'android'|'ios'|'unknown'}
 */
export const detectPlatform = (req) => {
  const platform = String(req.headers["x-platform"] || req.query.platform || "").toLowerCase();
  if (["website", "android", "ios"].includes(platform)) return platform;

  const ua = String(req.headers["user-agent"] || "").toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "ios";
  if (ua.includes("mozilla") || ua.includes("chrome") || ua.includes("safari")) return "website";
  return "unknown";
};

export default {
  normalizeSearchText,
  escapeRegex,
  sanitizeSearchQuery,
  buildSafeRegex,
  tokenizeText,
  getMeaningfulTokens,
  getExpandedSearchTerms,
  buildRegexOrConditions,
  scoreSearchItem,
  getSpellCorrection,
  buildVocabulary,
  highlightSearchText,
  paginateResults,
  detectPlatform,
  RANK_WEIGHTS,
};
