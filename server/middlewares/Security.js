import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";
import logger from "../config/Logger.js";

// ─── MongoDB Injection Sanitizer ──────────────────────────────────────────────
export const mongoSanitizer = mongoSanitize({
  replaceWith: "_",
  onSanitizeRequest: ({ req }) => {
    // ✅ FIX: Use logger instead of console.warn - logs go to file in production
    logger.warn("MongoDB injection attempt blocked", {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
  },
});

// ─── XSS Sanitizer ───────────────────────────────────────────────────────────
export const xssSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj) {
  if (typeof obj === "string") return xss(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj !== null && typeof obj === "object") {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}