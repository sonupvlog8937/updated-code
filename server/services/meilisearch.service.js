import meilisearchClient, { INDEXES } from '../config/meilisearch.config.js';

/**
 * Meilisearch Service
 * Handles all Meilisearch operations for ultra-fast search
 */

/**
 * Index a single document
 */
export const indexDocument = async (indexName, document) => {
  try {
    const index = meilisearchClient.index(indexName);
    const result = await index.addDocuments([document], { primaryKey: '_id' });
    return result;
  } catch (error) {
    console.error(`Error indexing document in ${indexName}:`, error);
    throw error;
  }
};

/**
 * Index multiple documents in batch
 */
export const indexDocuments = async (indexName, documents) => {
  try {
    if (!documents || documents.length === 0) return null;

    const index = meilisearchClient.index(indexName);
    const result = await index.addDocuments(documents, { primaryKey: '_id' });
    return result;
  } catch (error) {
    console.error(`Error batch indexing in ${indexName}:`, error);
    throw error;
  }
};

/**
 * Update a single document
 */
export const updateDocument = async (indexName, document) => {
  try {
    const index = meilisearchClient.index(indexName);
    const result = await index.updateDocuments([document], { primaryKey: '_id' });
    return result;
  } catch (error) {
    console.error(`Error updating document in ${indexName}:`, error);
    throw error;
  }
};

/**
 * Delete a document by ID
 */
export const deleteDocument = async (indexName, documentId) => {
  try {
    const index = meilisearchClient.index(indexName);
    const result = await index.deleteDocument(documentId);
    return result;
  } catch (error) {
    console.error(`Error deleting document from ${indexName}:`, error);
    throw error;
  }
};

/**
 * Delete multiple documents
 */
export const deleteDocuments = async (indexName, documentIds) => {
  try {
    const index = meilisearchClient.index(indexName);
    const result = await index.deleteDocuments(documentIds);
    return result;
  } catch (error) {
    console.error(`Error deleting documents from ${indexName}:`, error);
    throw error;
  }
};

/**
 * Search in a specific index
 */
export const searchIndex = async (indexName, query, options = {}) => {
  try {
    const index = meilisearchClient.index(indexName);
    
    const searchOptions = {
      limit: options.limit || 20,
      offset: options.offset || 0,
      attributesToRetrieve: options.attributesToRetrieve || ['*'],
      attributesToHighlight: options.attributesToHighlight || ['*'],
      highlightPreTag: options.highlightPreTag || '<mark>',
      highlightPostTag: options.highlightPostTag || '</mark>',
      filter: options.filter,
      sort: options.sort,
      facets: options.facets,
      showMatchesPosition: options.showMatchesPosition || false,
    };

    const results = await index.search(query, searchOptions);
    return results;
  } catch (error) {
    console.error(`Error searching in ${indexName}:`, error);
    throw error;
  }
};

/**
 * Multi-index search
 */
export const multiSearch = async (queries) => {
  try {
    const results = await meilisearchClient.multiSearch({
      queries: queries.map((q) => ({
        indexUid: q.indexName,
        q: q.query,
        limit: q.limit || 20,
        offset: q.offset || 0,
        filter: q.filter,
        sort: q.sort,
        facets: q.facets,
        attributesToHighlight: q.attributesToHighlight || ['*'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      })),
    });
    return results;
  } catch (error) {
    console.error('Error in multi-search:', error);
    throw error;
  }
};

/**
 * Get facet distribution
 */
export const getFacets = async (indexName, query, facets) => {
  try {
    const index = meilisearchClient.index(indexName);
    const results = await index.search(query, {
      limit: 0,
      facets,
    });
    return results.facetDistribution;
  } catch (error) {
    console.error(`Error getting facets from ${indexName}:`, error);
    throw error;
  }
};

/**
 * Clear all documents from an index
 */
export const clearIndex = async (indexName) => {
  try {
    const index = meilisearchClient.index(indexName);
    const result = await index.deleteAllDocuments();
    return result;
  } catch (error) {
    console.error(`Error clearing index ${indexName}:`, error);
    throw error;
  }
};

/**
 * Get index stats
 */
export const getIndexStats = async (indexName) => {
  try {
    const index = meilisearchClient.index(indexName);
    const stats = await index.getStats();
    return stats;
  } catch (error) {
    console.error(`Error getting stats for ${indexName}:`, error);
    throw error;
  }
};

/**
 * Sync products from MongoDB to Meilisearch
 */
export const syncProductsToMeilisearch = async (products) => {
  try {
    const documentsToIndex = products.map((product) => ({
      _id: product._id.toString(),
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      keywords: product.keywords || [],
      catName: product.catName || '',
      subCat: product.subCat || '',
      thirdsubCat: product.thirdsubCat || '',
      title: product.title || '',
      searchKeywords: product.searchKeywords || [],
      price: Number(product.price) || 0,
      oldPrice: Number(product.oldPrice) || 0,
      discount: Number(product.discount) || 0,
      rating: Number(product.rating) || 0,
      countInStock: Number(product.countInStock) || 0,
      sale: Number(product.sale) || 0,
      isFeatured: Boolean(product.isFeatured),
      isActive: product.isActive !== false,
      images: product.images || [],
      createdAt: product.createdAt || new Date(),
    }));

    const result = await indexDocuments(INDEXES.PRODUCTS, documentsToIndex);
    return result;
  } catch (error) {
    console.error('Error syncing products to Meilisearch:', error);
    throw error;
  }
};

/**
 * Sync categories from MongoDB to Meilisearch
 */
export const syncCategoriesToMeilisearch = async (categories) => {
  try {
    const documentsToIndex = categories.map((category) => ({
      _id: category._id.toString(),
      name: category.name || '',
      description: category.description || '',
      image: category.images?.[0] || '',
      status: category.status || 'active',
      type: category.type || 'category',
      createdAt: category.createdAt || new Date(),
    }));

    const result = await indexDocuments(INDEXES.CATEGORIES, documentsToIndex);
    return result;
  } catch (error) {
    console.error('Error syncing categories to Meilisearch:', error);
    throw error;
  }
};

/**
 * Sync brands from MongoDB to Meilisearch
 */
export const syncBrandsToMeilisearch = async (brands) => {
  try {
    const documentsToIndex = brands.map((brand) => ({
      _id: brand._id || brand,
      name: brand.name || brand,
      isActive: true,
    }));

    const result = await indexDocuments(INDEXES.BRANDS, documentsToIndex);
    return result;
  } catch (error) {
    console.error('Error syncing brands to Meilisearch:', error);
    throw error;
  }
};

/**
 * Build search query with filters
 */
export const buildSearchFilter = (filters = {}) => {
  const filterParts = [];

  if (filters.brands?.length) {
    const brandFilter = filters.brands.map((b) => `brand = "${b}"`).join(' OR ');
    filterParts.push(`(${brandFilter})`);
  }

  if (filters.categories?.length) {
    const catFilter = filters.categories.map((c) => `catName = "${c}"`).join(' OR ');
    filterParts.push(`(${catFilter})`);
  }

  if (filters.minPrice != null) {
    filterParts.push(`price >= ${filters.minPrice}`);
  }

  if (filters.maxPrice != null) {
    filterParts.push(`price <= ${filters.maxPrice}`);
  }

  if (filters.minRating != null) {
    filterParts.push(`rating >= ${filters.minRating}`);
  }

  if (filters.inStock === true) {
    filterParts.push('countInStock > 0');
  }

  if (filters.isFeatured === true) {
    filterParts.push('isFeatured = true');
  }

  filterParts.push('isActive = true');

  return filterParts.join(' AND ');
};

/**
 * Build sort array
 */
export const buildSort = (sortBy = 'relevance') => {
  const sortMap = {
    priceAsc: ['price:asc'],
    priceDesc: ['price:desc'],
    rating: ['rating:desc'],
    popular: ['sale:desc'],
    latest: ['createdAt:desc'],
    relevance: [],
  };

  return sortMap[sortBy] || [];
};

export default {
  indexDocument,
  indexDocuments,
  updateDocument,
  deleteDocument,
  deleteDocuments,
  searchIndex,
  multiSearch,
  getFacets,
  clearIndex,
  getIndexStats,
  syncProductsToMeilisearch,
  syncCategoriesToMeilisearch,
  syncBrandsToMeilisearch,
  buildSearchFilter,
  buildSort,
};
