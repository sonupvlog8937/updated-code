/**
 * In-memory rate limiter for search endpoints (Redis-ready pattern).
 * Limits requests per IP within a sliding window.
 */

const store = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

const cleanup = () => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
};

setInterval(cleanup, 60_000).unref?.();

export const searchRateLimit = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const key = `search:${ip}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }

  entry.count += 1;

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - entry.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: "Too many search requests. Please try again shortly.",
    });
  }

  next();
};

export default searchRateLimit;
