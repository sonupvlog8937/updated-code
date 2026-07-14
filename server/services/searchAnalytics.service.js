import searchAnalyticsRepository from "../repositories/searchAnalytics.repository.js";

export const trackSearch = (keyword, resultCount) =>
  searchAnalyticsRepository.recordSearch(keyword, resultCount);

export const trackClick = (keyword) =>
  searchAnalyticsRepository.recordClick(keyword);

export const getSearchAnalytics = (options) =>
  searchAnalyticsRepository.getAnalytics(options);

export const getZeroResultAnalytics = (limit) =>
  searchAnalyticsRepository.getZeroResultAnalytics(limit);

export const getTrendingKeywords = (limit) =>
  searchAnalyticsRepository.getTrendingKeywords(limit);

export default {
  trackSearch,
  trackClick,
  getSearchAnalytics,
  getZeroResultAnalytics,
  getTrendingKeywords,
};
