/**
 * In-memory search cache layer (Redis-ready interface).
 * Swap `get/set/del` implementation with Redis client in production.
 */

const cache = new Map();
const DEFAULT_TTL_MS = 60_000;

/**
 * Clear all cache entries.
 */
export const cacheClearAll = () => {
  cache.clear();
  console.log("🗑️ Search cache cleared");
};

/**
 * @param {string} key
 * @returns {any|null}
 */
export const cacheGet = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

/**
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs
 */
export const cacheSet = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

/** @param {string} key */
export const cacheDel = (key) => {
  cache.delete(key);
};

/**
 * @param {string} prefix
 */
export const cacheDelByPrefix = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
};

/**
 * Build cache key from parts.
 * @param  {...string} parts
 * @returns {string}
 */
export const buildCacheKey = (...parts) =>
  parts.map((p) => String(p || "").toLowerCase().trim()).join(":");

export default { cacheGet, cacheSet, cacheDel, cacheDelByPrefix, buildCacheKey };
