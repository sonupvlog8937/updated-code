import { INDEXES } from '../config/meilisearch.config.js';
import {
  searchIndex,
  multiSearch,
  buildSearchFilter,
  buildSort,
  getFacets,
} from './meilisearch.service.js';
import ProductModel from '../models/product.modal.js';
import CategoryModel from '../models/category.modal.js';
import topSearchRepository from '../repositories/topSearch.repository.js';
import { highlightSearchText, paginateResults } from '../utils/searchEngine.js';
import { expandSynonyms } from '../utils/searchSynonyms.js';
import { rankSuggestions } from '../utils/searchSuggest.js';

/**
 * Meilisearch-powered Search Service
 * Ultra-fast search with typo tolerance and advanced features
 */

/**
 * Execute intelligent search using Meilisearch
 */
export const executeSearchWithMeili = async ({
  query = '',
  page = 1,
  limit = 20,
  scope = 'all',
  filters = {},
  sortBy = 'relevance',
  includeRelated = true,
} = {}) => {
  try {
    if (!query || query.trim().length === 0) {
      return buildEmptyResponse();
    }

    const cleanQuery = query.trim();
    const offset = (page - 1) * limit;

    // Build filter string for Meilisearch
    const filterString = buildSearchFilter({
      ...filters,
      isActive: true,
    });

    // Build sort array
    const sortArray = buildSort(sortBy);

    // Perform multi-index search for comprehensive results
    const searchQueries = [];

    // Products search (main results)
    if (scope === 'all' || scope === 'products') {
      searchQueries.push({
        indexName: INDEXES.PRODUCTS,
        query: cleanQuery,
        limit,
        offset,
        filter: filterString,
        sort: sortArray,
        attributesToHighlight: ['name', 'brand', 'description'],
        facets: ['brand', 'catName', 'subCat'],
      });
    }

    // Categories search (for suggestions)
    searchQueries.push({
      indexName: INDEXES.CATEGORIES,
      query: cleanQuery,
      limit: 10,
      attributesToHighlight: ['name'],
    });

    // Brands search (for suggestions) - using products index to get unique brands
    searchQueries.push({
      indexName: INDEXES.PRODUCTS,
      query: cleanQuery,
      limit: 0,
      facets: ['brand'],
    });

    // Execute multi-search
    const searchResults = await multiSearch(searchQueries);

    // Parse results
    const productsResult = searchResults.results[0];
    const categoriesResult = searchResults.results[1];
    const brandsResult = searchResults.results[2];

    // Extract products
    const products = productsResult.hits.map((hit) => ({
      _id: hit._id,
      name: hit.name,
      highlightedName: hit._formatted?.name || hit.name,
      brand: hit.brand,
      highlightedBrand: hit._formatted?.brand || hit.brand,
      price: hit.price,
      oldPrice: hit.oldPrice,
      discount: hit.discount,
      rating: hit.rating,
      countInStock: hit.countInStock,
      sale: hit.sale,
      isFeatured: hit.isFeatured,
      images: hit.images || [],
      image: hit.images?.[0] || '',
      category: hit.catName || hit.subCat || '',
      source: 'product',
    }));

    // Extract categories
    const categories = categoriesResult.hits.map((hit) => ({
      _id: hit._id,
      name: hit.name,
      highlightedName: hit._formatted?.name || hit.name,
      image: hit.image || '',
      type: 'category',
    }));

    // Extract brands from facets
    const brandFacets = brandsResult.facetDistribution?.brand || {};
    const brands = Object.keys(brandFacets)
      .filter((brand) => brand && brand.toLowerCase().includes(cleanQuery.toLowerCase()))
      .slice(0, 10)
      .map((name) => ({
        name,
        highlightedName: highlightSearchText(name, cleanQuery),
        type: 'brand',
      }));

    // Get expanded synonyms for suggestions
    const expandedSynonyms = await expandSynonyms(cleanQuery);

    // Get top searches for suggestions
    const topSearches = await topSearchRepository.getTop(10);

    // Rank suggestions
    const suggestions = rankSuggestions(
      cleanQuery,
      [
        ...products.map((p) => p.name),
        ...brands.map((b) => b.name),
        ...categories.map((c) => c.name),
        ...expandedSynonyms,
        ...topSearches.map((t) => t.keyword),
      ],
      { limit: 10, getLabel: (x) => x },
    );

    // Did you mean (from Meilisearch typo tolerance)
    const didYouMean = productsResult.query !== cleanQuery ? productsResult.query : null;

    // Related products if no results
    let relatedProducts = [];
    if (products.length === 0 && includeRelated) {
      const featuredResult = await searchIndex(INDEXES.PRODUCTS, '', {
        limit: 12,
        filter: 'isFeatured = true AND isActive = true',
      });
      relatedProducts = featuredResult.hits.map((hit) => ({
        _id: hit._id,
        name: hit.name,
        price: hit.price,
        image: hit.images?.[0] || '',
        isRelated: true,
      }));
    }

    // Trending products
    const trendingResult = await searchIndex(INDEXES.PRODUCTS, '', {
      limit: 10,
      filter: 'isFeatured = true AND isActive = true',
      sort: ['sale:desc'],
    });
    const trending = trendingResult.hits.map((hit) => hit.name);

    // Filter options from facets
    const filterOptions = {
      brands: Object.keys(productsResult.facetDistribution?.brand || {}).slice(0, 30),
      categories: Object.keys(productsResult.facetDistribution?.catName || {}).slice(0, 20),
      priceRange: {
        min: Math.min(...products.map((p) => p.price).filter((p) => p > 0), 0) || 0,
        max: Math.max(...products.map((p) => p.price), 0) || 0,
      },
    };

    const totalPages = Math.ceil(productsResult.estimatedTotalHits / limit);

    return {
      success: true,
      query: cleanQuery,
      normalizedQuery: cleanQuery.toLowerCase(),
      didYouMean,
      suggestions,
      products,
      totalProducts: productsResult.estimatedTotalHits,
      page,
      totalPages,
      categories,
      brands,
      shops: [],
      trending,
      related: relatedProducts,
      popular: trending.slice(0, 8),
      filterOptions,
      meta: {
        scope,
        processingTimeMs: productsResult.processingTimeMs,
        hasExactMatch: products.some((p) => p.name.toLowerCase() === cleanQuery.toLowerCase()),
        source: 'meilisearch',
      },
    };
  } catch (error) {
    console.error('❌ Error in executeSearchWithMeili:', error);
    throw error;
  }
};

/**
 * Execute fast autocomplete suggestions using Meilisearch
 */
export const executeSuggestionsWithMeili = async ({ query = '', limit = 10 } = {}) => {
  try {
    if (!query || query.trim().length < 1) {
      return { success: true, suggestions: [], products: [], categories: [], brands: [] };
    }

    const cleanQuery = query.trim();

    // Multi-search for suggestions
    const searchResults = await multiSearch([
      {
        indexName: INDEXES.PRODUCTS,
        query: cleanQuery,
        limit: 10,
        filter: 'isActive = true',
        attributesToHighlight: ['name', 'brand'],
      },
      {
        indexName: INDEXES.CATEGORIES,
        query: cleanQuery,
        limit: 5,
        attributesToHighlight: ['name'],
      },
      {
        indexName: INDEXES.PRODUCTS,
        query: cleanQuery,
        limit: 0,
        facets: ['brand'],
      },
    ]);

    const productsResult = searchResults.results[0];
    const categoriesResult = searchResults.results[1];
    const brandsResult = searchResults.results[2];

    // Map products
    const products = productsResult.hits.slice(0, limit).map((hit) => ({
      _id: hit._id,
      name: hit.name,
      highlightedName: hit._formatted?.name || hit.name,
      brand: hit.brand,
      price: hit.price,
      image: hit.images?.[0] || '',
    }));

    // Map categories
    const categories = categoriesResult.hits.slice(0, 5).map((hit) => ({
      _id: hit._id,
      name: hit.name,
      highlightedName: hit._formatted?.name || hit.name,
      type: 'category',
    }));

    // Extract brands from facets
    const brandFacets = brandsResult.facetDistribution?.brand || {};
    const brands = Object.keys(brandFacets)
      .filter((brand) => brand && brand.toLowerCase().includes(cleanQuery.toLowerCase()))
      .slice(0, 5)
      .map((name) => ({
        name,
        highlightedName: highlightSearchText(name, cleanQuery),
        type: 'brand',
      }));

    // Get top searches
    const topSearches = await topSearchRepository.getTop(10);

    // Expand synonyms
    const expandedSynonyms = await expandSynonyms(cleanQuery);

    // Rank suggestions
    const textSuggestions = rankSuggestions(
      cleanQuery,
      [
        ...products.map((p) => p.name),
        ...topSearches.map((t) => t.keyword),
        ...expandedSynonyms,
      ],
      { limit, getLabel: (x) => x },
    );

    // Did you mean
    const didYouMean = productsResult.query !== cleanQuery ? productsResult.query : null;

    return {
      success: true,
      query: cleanQuery,
      didYouMean,
      suggestions: textSuggestions,
      products,
      categories,
      brands,
      topSearches: topSearches.map((t) => t.keyword),
      loading: false,
      meta: {
        processingTimeMs: productsResult.processingTimeMs,
        source: 'meilisearch',
      },
    };
  } catch (error) {
    console.error('❌ Error in executeSuggestionsWithMeili:', error);
    throw error;
  }
};

/**
 * Get search defaults (recent, trending, popular)
 */
export const getSearchDefaults = async (userId = null) => {
  try {
    const [topAll, topToday, topWeek, popularCategories, popularBrands] = await Promise.all([
      topSearchRepository.getTop(20),
      topSearchRepository.getTopToday(10),
      topSearchRepository.getTopWeek(10),
      CategoryModel.find({ status: 'active' }).limit(8).lean(),
      ProductModel.distinct('brand', { brand: { $ne: '' } }).then((b) =>
        b.filter(Boolean).slice(0, 10),
      ),
    ]);

    // Get featured products from Meilisearch
    const featuredResult = await searchIndex(INDEXES.PRODUCTS, '', {
      limit: 8,
      filter: 'isFeatured = true AND isActive = true',
    });

    const popularProducts = featuredResult.hits.map((hit) => ({
      _id: hit._id,
      name: hit.name,
      brand: hit.brand,
      image: hit.images?.[0] || '',
      price: hit.price,
      discount: hit.discount,
      rating: hit.rating,
    }));

    return {
      success: true,
      topSearches: topAll.map((t) => ({ keyword: t.keyword, count: t.count })),
      topToday: topToday.map((t) => t.keyword),
      topWeek: topWeek.map((t) => t.keyword),
      trending: topToday.slice(0, 8).map((t) => t.keyword),
      popularCategories: popularCategories.map((c) => ({
        _id: c._id,
        name: c.name,
        image: c.images?.[0] || '',
      })),
      popularBrands: popularBrands.map((name) => ({ name })),
      popularProducts,
      recentSearches: [],
    };
  } catch (error) {
    console.error('❌ Error in getSearchDefaults:', error);
    throw error;
  }
};

const buildEmptyResponse = () => ({
  success: true,
  query: '',
  didYouMean: null,
  suggestions: [],
  products: [],
  totalProducts: 0,
  page: 1,
  totalPages: 0,
  categories: [],
  brands: [],
  shops: [],
  trending: [],
  related: [],
  popular: [],
  filterOptions: { brands: [], categories: [], priceRange: { min: 0, max: 0 } },
});

export default {
  executeSearchWithMeili,
  executeSuggestionsWithMeili,
  getSearchDefaults,
};
