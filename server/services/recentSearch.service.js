import recentSearchRepository from "../repositories/recentSearch.repository.js";

export const getRecentSearches = (userId) =>
  recentSearchRepository.findByUser(userId);

export const saveRecentSearch = (userId, keyword) =>
  recentSearchRepository.upsert(userId, keyword);

export const deleteRecentSearch = (userId, keyword) =>
  recentSearchRepository.deleteOne(userId, keyword);

export const clearRecentSearches = (userId) =>
  recentSearchRepository.deleteAll(userId);

export default {
  getRecentSearches,
  saveRecentSearch,
  deleteRecentSearch,
  clearRecentSearches,
};
