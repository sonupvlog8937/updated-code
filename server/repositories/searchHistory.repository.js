import SearchHistory from '../models/searchHistory.model.js';

/**
 * Search History Repository
 * Data access layer for search history operations
 */

/**
 * Save a search to history
 */
export const saveHistory = async (data) => {
  try {
    return await SearchHistory.saveSearch(data);
  } catch (error) {
    console.error('Error in saveHistory repository:', error);
    throw error;
  }
};

/**
 * Get user's search history
 */
export const getUserHistory = async (userId, limit = 50) => {
  try {
    return await SearchHistory.getUserHistory(userId, limit);
  } catch (error) {
    console.error('Error in getUserHistory repository:', error);
    throw error;
  }
};

/**
 * Get popular searches
 */
export const getPopularSearches = async (timeRange = 'week', limit = 20) => {
  try {
    return await SearchHistory.getPopularSearches(timeRange, limit);
  } catch (error) {
    console.error('Error in getPopularSearches repository:', error);
    throw error;
  }
};

/**
 * Get failed searches (searches with 0 results)
 */
export const getFailedSearches = async (limit = 50) => {
  try {
    return await SearchHistory.getFailedSearches(limit);
  } catch (error) {
    console.error('Error in getFailedSearches repository:', error);
    throw error;
  }
};

/**
 * Get search analytics
 */
export const getAnalytics = async (startDate, endDate) => {
  try {
    return await SearchHistory.getAnalytics(startDate, endDate);
  } catch (error) {
    console.error('Error in getAnalytics repository:', error);
    throw error;
  }
};

/**
 * Update search with click data
 */
export const updateWithClick = async (searchId, productId) => {
  try {
    return await SearchHistory.findByIdAndUpdate(
      searchId,
      { clickedProduct: productId },
      { new: true },
    );
  } catch (error) {
    console.error('Error in updateWithClick repository:', error);
    throw error;
  }
};

/**
 * Update search with purchase data
 */
export const updateWithPurchase = async (searchId, productId) => {
  try {
    return await SearchHistory.findByIdAndUpdate(
      searchId,
      { purchasedProduct: productId },
      { new: true },
    );
  } catch (error) {
    console.error('Error in updateWithPurchase repository:', error);
    throw error;
  }
};

/**
 * Get user's search patterns
 */
export const getUserSearchPatterns = async (userId, days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await SearchHistory.aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $facet: {
          topKeywords: [
            { $group: { _id: '$normalizedKeyword', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          topCategories: [
            { $unwind: '$filters.categories' },
            { $group: { _id: '$filters.categories', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          topBrands: [
            { $unwind: '$filters.brands' },
            { $group: { _id: '$filters.brands', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          priceRange: [
            {
              $group: {
                _id: null,
                avgMinPrice: { $avg: '$filters.minPrice' },
                avgMaxPrice: { $avg: '$filters.maxPrice' },
              },
            },
          ],
          searchFrequency: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);
  } catch (error) {
    console.error('Error in getUserSearchPatterns repository:', error);
    throw error;
  }
};

/**
 * Get search trends over time
 */
export const getSearchTrends = async (days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await SearchHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            keyword: '$normalizedKeyword',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1, count: -1 },
      },
      {
        $group: {
          _id: '$_id.date',
          keywords: {
            $push: {
              keyword: '$_id.keyword',
              count: '$count',
            },
          },
          totalSearches: { $sum: '$count' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
  } catch (error) {
    console.error('Error in getSearchTrends repository:', error);
    throw error;
  }
};

/**
 * Get Click-Through Rate (CTR)
 */
export const getCTR = async (days = 30) => {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await SearchHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          searchesWithClick: {
            $sum: { $cond: [{ $ne: ['$clickedProduct', null] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalSearches: 1,
          searchesWithClick: 1,
          ctr: {
            $multiply: [
              { $divide: ['$searchesWithClick', '$totalSearches'] },
              100,
            ],
          },
        },
      },
    ]);

    return result[0] || { totalSearches: 0, searchesWithClick: 0, ctr: 0 };
  } catch (error) {
    console.error('Error in getCTR repository:', error);
    throw error;
  }
};

export default {
  saveHistory,
  getUserHistory,
  getPopularSearches,
  getFailedSearches,
  getAnalytics,
  updateWithClick,
  updateWithPurchase,
  getUserSearchPatterns,
  getSearchTrends,
  getCTR,
};
