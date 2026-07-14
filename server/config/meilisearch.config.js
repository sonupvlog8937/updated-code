import { MeiliSearch } from 'meilisearch';

/**
 * Meilisearch Configuration
 * Enterprise-grade search engine for ultra-fast search
 */

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || 'masterKey';

// Initialize Meilisearch client
export const meilisearchClient = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});

/**
 * Index names for different data types
 */
export const INDEXES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  SHOPS: 'shops',
  GROCERY_PRODUCTS: 'grocery_products',
  RESTAURANT_ITEMS: 'restaurant_items',
};

/**
 * Searchable attributes configuration per index
 */
export const SEARCHABLE_ATTRIBUTES = {
  [INDEXES.PRODUCTS]: [
    'name',
    'brand',
    'description',
    'keywords',
    'catName',
    'subCat',
    'thirdsubCat',
    'title',
    'searchKeywords',
  ],
  [INDEXES.CATEGORIES]: ['name', 'description'],
  [INDEXES.BRANDS]: ['name'],
  [INDEXES.SHOPS]: ['shopName', 'description'],
  [INDEXES.GROCERY_PRODUCTS]: ['name', 'title', 'description', 'keywords', 'tags'],
  [INDEXES.RESTAURANT_ITEMS]: ['itemName', 'title', 'description', 'keywords'],
};

/**
 * Filterable attributes configuration per index
 */
export const FILTERABLE_ATTRIBUTES = {
  [INDEXES.PRODUCTS]: [
    'brand',
    'catName',
    'subCat',
    'thirdsubCat',
    'price',
    'discount',
    'rating',
    'countInStock',
    'isFeatured',
    'isActive',
  ],
  [INDEXES.CATEGORIES]: ['status', 'type'],
  [INDEXES.BRANDS]: ['isActive'],
  [INDEXES.SHOPS]: ['shopType', 'isActive', 'rating'],
  [INDEXES.GROCERY_PRODUCTS]: ['price', 'shopId', 'stock', 'isFeatured'],
  [INDEXES.RESTAURANT_ITEMS]: ['price', 'restaurantId', 'isAvailable'],
};

/**
 * Sortable attributes configuration per index
 */
export const SORTABLE_ATTRIBUTES = {
  [INDEXES.PRODUCTS]: ['price', 'rating', 'sale', 'discount', 'createdAt'],
  [INDEXES.CATEGORIES]: ['name', 'createdAt'],
  [INDEXES.BRANDS]: ['name'],
  [INDEXES.SHOPS]: ['rating', 'createdAt'],
  [INDEXES.GROCERY_PRODUCTS]: ['price', 'soldCount', 'createdAt'],
  [INDEXES.RESTAURANT_ITEMS]: ['price', 'soldCount', 'createdAt'],
};

/**
 * Ranking rules configuration per index
 */
export const RANKING_RULES = {
  [INDEXES.PRODUCTS]: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
    'rating:desc',
    'sale:desc',
  ],
  [INDEXES.CATEGORIES]: ['words', 'typo', 'proximity', 'attribute', 'exactness'],
  [INDEXES.BRANDS]: ['words', 'typo', 'exactness'],
  [INDEXES.SHOPS]: ['words', 'typo', 'proximity', 'attribute', 'rating:desc'],
  [INDEXES.GROCERY_PRODUCTS]: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'soldCount:desc',
  ],
  [INDEXES.RESTAURANT_ITEMS]: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'soldCount:desc',
  ],
};

/**
 * Typo tolerance configuration
 */
export const TYPO_TOLERANCE = {
  enabled: true,
  minWordSizeForTypos: {
    oneTypo: 4,
    twoTypos: 8,
  },
  disableOnWords: [],
  disableOnAttributes: [],
};

/**
 * Faceting configuration
 */
export const FACETING_CONFIG = {
  maxValuesPerFacet: 100,
};

/**
 * Pagination configuration
 */
export const PAGINATION_CONFIG = {
  maxTotalHits: 10000,
};

/**
 * Initialize all indexes with proper configuration
 */
export const initializeMeilisearch = async () => {
  try {
    console.log('🔍 Initializing Meilisearch indexes...');

    const indexPromises = Object.values(INDEXES).map(async (indexName) => {
      try {
        // Get or create index
        const index = meilisearchClient.index(indexName);

        // Update settings
        await index.updateSettings({
          searchableAttributes: SEARCHABLE_ATTRIBUTES[indexName] || ['*'],
          filterableAttributes: FILTERABLE_ATTRIBUTES[indexName] || [],
          sortableAttributes: SORTABLE_ATTRIBUTES[indexName] || [],
          rankingRules: RANKING_RULES[indexName] || [
            'words',
            'typo',
            'proximity',
            'attribute',
            'sort',
            'exactness',
          ],
          typoTolerance: TYPO_TOLERANCE,
          faceting: FACETING_CONFIG,
          pagination: PAGINATION_CONFIG,
          stopWords: [],
          synonyms: {},
          distinctAttribute: null,
        });

        console.log(`✅ Initialized index: ${indexName}`);
      } catch (error) {
        console.error(`❌ Error initializing index ${indexName}:`, error.message);
      }
    });

    await Promise.all(indexPromises);
    console.log('✅ All Meilisearch indexes initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Meilisearch:', error);
    throw error;
  }
};

/**
 * Health check for Meilisearch
 */
export const checkMeilisearchHealth = async () => {
  try {
    const health = await meilisearchClient.health();
    return health.status === 'available';
  } catch (error) {
    console.error('❌ Meilisearch health check failed:', error);
    return false;
  }
};

export default meilisearchClient;
