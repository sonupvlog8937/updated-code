import rateLimit from "express-rate-limit";

// ─── Generic API Rate Limiter ─────────────────────────────────────────────────
// All routes: 100 requests per 15 min per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
});

// ─── Auth Routes Limiter ──────────────────────────────────────────────────────
// Login/Register: 10 attempts per 15 min (brute force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// ─── OTP Limiter ─────────────────────────────────────────────────────────────
// OTP send: 5 attempts per 10 min
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    success: false,
    message: "Too many OTP requests. Please try again after 10 minutes.",
  },
});

// ─── Upload Limiter ───────────────────────────────────────────────────────────
// File uploads: 30 per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    success: false,
    message: "Upload limit reached. Please try again after an hour.",
  },
});

// ─── Order Limiter ────────────────────────────────────────────────────────────
// Orders: 20 per hour per IP
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    success: false,
    message: "Order limit reached. Please try again later.",
  },
});