import searchHistoryRepository from "../repositories/searchHistory.repository.js";
import { detectPlatform } from "../utils/searchEngine.js";

export const recordSearchHistory = async ({
  userId = null,
  keyword,
  resultCount = 0,
  platform = "unknown",
  device = "",
  sessionId = "",
  ipAddress = "",
  clickedProduct = null,
  clickedProductType = null,
}) => {
  if (!keyword?.trim()) return null;

  return searchHistoryRepository.create({
    userId: userId || null,
    keyword: keyword.trim(),
    resultCount,
    platform,
    device: String(device).slice(0, 200),
    sessionId: String(sessionId).slice(0, 100),
    ipAddress: String(ipAddress).slice(0, 45),
    clickedProduct,
    clickedProductType,
  });
};

export const getUserSearchHistory = (userId, options = {}) =>
  searchHistoryRepository.findByUser(userId, options);

export const buildHistoryFromRequest = (req, overrides = {}) => ({
  platform: detectPlatform(req),
  device: req.headers["x-device"] || req.headers["user-agent"] || "",
  sessionId: req.headers["x-session-id"] || req.cookies?.sessionId || "",
  ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
  ...overrides,
});

export default { recordSearchHistory, getUserSearchHistory, buildHistoryFromRequest };
