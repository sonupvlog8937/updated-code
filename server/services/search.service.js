import ProductModel from "../models/product.modal.js";
import GroceryProductModel from "../models/groceryProduct.model.js";
import RestaurantItemModel from "../models/restaurantItem.model.js";
import GroceryShopModel from "../models/groceryShop.model.js";
import RestaurantModel from "../models/restaurant.model.js";
import CategoryModel from "../models/category.modal.js";
import GoMarketCategoryModel from "../models/goMarketCategory.model.js";
import {
  normalizeSearchText,
  sanitizeSearchQuery,
  buildSafeRegex,
  getMeaningfulTokens,
  getMeaningfulTokensSync,
  getExpandedSearchTerms,
  getExpandedSearchTermsSync,
  scoreSearchItem,
  getSpellCorrection,
  buildVocabulary,
  highlightSearchText,
  paginateResults,
} from "../utils/searchEngine.js";
import { expandSynonyms, expandSynonymsSync } from "../utils/searchSynonyms.js";
import { rankSuggestions } from "../utils/searchSuggest.js";
import { cacheGet, cacheSet, buildCacheKey } from "../utils/searchCache.js";
import topSearchRepository from "../repositories/topSearch.repository.js";

const PRODUCT_FIELDS = [
  "name", "brand", "description", "keywords", "catName", "subCat",
  "thirdsubCat", "title", "searchKeywords", "seoDescription", "attributes", "productType",
];

const GROCERY_FIELDS = [
  "name", "title", "description", "keywords", "tags",
  "searchKeywords", "seoDescription", "attributes", "productType",
];

const RESTAURANT_ITEM_FIELDS = [
  "itemName", "title", "description", "keywords", "tags",
  "searchKeywords", "seoDescription", "attributes", "productType",
];

const buildProductQuery = (terms) => {
  const orConditions = [];
  for (const term of terms) {
    const regex = buildSafeRegex(term);
    if (!regex) continue;
    orConditions.push({
      $or: PRODUCT_FIELDS.map((field) => ({ [field]: regex })),
    });
  }
  return orConditions.length ? { $or: orConditions.flatMap((c) => c.$or) } : {};
};

const buildGroceryQuery = (terms) => {
  const orConditions = [];
  for (const term of terms) {
    const regex = buildSafeRegex(term);
    if (!regex) continue;
    orConditions.push({
      $or: GROCERY_FIELDS.map((field) => ({ [field]: regex })),
    });
  }
  return orConditions.length ? { $or: orConditions.flatMap((c) => c.$or) } : {};
};

const buildRestaurantItemQuery = (terms) => {
  const orConditions = [];
  for (const term of terms) {
    const regex = buildSafeRegex(term);
    if (!regex) continue;
    orConditions.push({
      $or: RESTAURANT_ITEM_FIELDS.map((field) => ({ [field]: regex })),
    });
  }
  return orConditions.length ? { $or: orConditions.flatMap((c) => c.$or) } : {};
};

const mapProduct = (item, query, terms) => {
  const score = scoreSearchItem({
    query,
    terms,
    name: item.name,
    brand: item.brand,
    category: item.catName || item.subCat,
    fields: [
      item.description, item.title, item.searchKeywords,
      item.seoDescription, item.attributes, item.productType,
      ...(item.keywords || []),
    ],
    isPopular: Number(item.sale || 0) > 10 || Number(item.rating || 0) >= 4,
    isTrending: Boolean(item.isFeatured),
  });

  return {
    _id: item._id,
    name: item.name,
    highlightedName: highlightSearchText(item.name, query),
    brand: item.brand,
    highlightedBrand: highlightSearchText(item.brand, query),
    price: item.price,
    oldPrice: item.oldPrice,
    discount: item.discount,
    image: item.images?.[0] || item.bannerimages?.[0] || "",
    images: item.images || [],
    category: item.catName || item.subCat || "",
    rating: item.rating || 0,
    countInStock: item.countInStock || 0,
    sale: item.sale || 0,
    isFeatured: item.isFeatured || false,
    source: "product",
    score,
  };
};

const mapGroceryProduct = (item, query, terms, shopMap = {}) => {
  const shop = shopMap[String(item.shopId)] || {};
  const score = scoreSearchItem({
    query,
    terms,
    name: item.name,
    brand: shop.shopName || "",
    category: "",
    fields: [item.description, item.title, item.keywords, item.tags, item.searchKeywords],
    isPopular: Number(item.soldCount || 0) > 5,
    isTrending: Boolean(item.isFeatured),
  });

  return {
    _id: item._id,
    name: item.name,
    highlightedName: highlightSearchText(item.name, query),
    brand: shop.shopName || "",
    price: item.price,
    oldPrice: item.discountPrice || item.price,
    discount: item.discountPrice ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0,
    image: item.image || item.images?.[0] || "",
    shopId: item.shopId,
    shopName: shop.shopName || "",
    shopType: shop.shopType || "grocery",
    stock: item.stock || 0,
    soldCount: item.soldCount || 0,
    isFeatured: item.isFeatured || false,
    source: "grocery",
    score,
  };
};

const mapRestaurantItem = (item, query, terms, restaurantMap = {}) => {
  const restaurant = restaurantMap[String(item.restaurantId)] || {};
  const score = scoreSearchItem({
    query,
    terms,
    name: item.itemName,
    brand: restaurant.restaurantName || "",
    fields: [item.description, item.title, item.keywords, item.tags],
    isPopular: Number(item.soldCount || 0) > 5,
    isTrending: Boolean(item.isFeatured),
  });

  return {
    _id: item._id,
    name: item.itemName,
    highlightedName: highlightSearchText(item.itemName, query),
    brand: restaurant.restaurantName || "",
    price: item.price,
    oldPrice: item.discountPrice || item.price,
    image: item.image || item.images?.[0] || "",
    restaurantId: item.restaurantId,
    restaurantName: restaurant.restaurantName || "",
    isAvailable: item.isAvailable !== false,
    soldCount: item.soldCount || 0,
    source: "restaurant",
    score,
  };
};

const applyProductFilters = (items, filters = {}) => {
  let result = [...items];
  const { brands, minPrice, maxPrice, minDiscount, minRating, inStock, shopId } = filters;

  if (brands?.length) {
    result = result.filter((p) => brands.includes(p.brand));
  }
  if (minPrice != null) result = result.filter((p) => Number(p.price) >= Number(minPrice));
  if (maxPrice != null) result = result.filter((p) => Number(p.price) <= Number(maxPrice));
  if (minDiscount != null) result = result.filter((p) => Number(p.discount) >= Number(minDiscount));
  if (minRating != null) result = result.filter((p) => Number(p.rating || 0) >= Number(minRating));
  if (inStock === true) result = result.filter((p) => Number(p.countInStock || p.stock || 0) > 0);
  if (shopId) result = result.filter((p) => String(p.shopId) === String(shopId));

  return result;
};

const sortProducts = (items, sortBy = "relevance") => {
  const sorted = [...items];
  switch (sortBy) {
    case "priceAsc":
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case "priceDesc":
      return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case "rating":
      return sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    case "popular":
      return sorted.sort((a, b) => Number(b.sale || b.soldCount || 0) - Number(a.sale || a.soldCount || 0));
    case "latest":
      return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    default:
      return sorted.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  }
};

/**
 * Unified intelligent search across all catalogs.
 * @param {object} options
 */
export const executeSearch = async ({
  query = "",
  page = 1,
  limit = 20,
  scope = "all",
  filters = {},
  sortBy = "relevance",
  includeRelated = true,
} = {}) => {
  try {
    const cleanQuery = sanitizeSearchQuery(query);
    if (!cleanQuery) {
      return buildEmptyResponse();
    }

  // Temporarily disable cache for debugging
  // const cacheKey = buildCacheKey("search", cleanQuery, scope, page, limit, JSON.stringify(filters), sortBy);
  // const cached = cacheGet(cacheKey);
  // if (cached) {
  //   console.log("📦 Returning cached search results for:", cleanQuery);
  //   return cached;
  // }

  const normalizedQuery = normalizeSearchText(cleanQuery);
  const terms = await getMeaningfulTokens(cleanQuery);
  const expandedTerms = await getExpandedSearchTerms(cleanQuery);
  const isSynonymExpanded = expandedTerms.length > terms.length;

  const productQuery = buildProductQuery(expandedTerms);
  const groceryQuery = buildGroceryQuery(expandedTerms);
  const restaurantQuery = buildRestaurantItemQuery(expandedTerms);

  const searchPromises = [];

  if (scope === "all" || scope === "products") {
    searchPromises.push(
      Object.keys(productQuery).length
        ? ProductModel.find(productQuery).lean().limit(300)
        : Promise.resolve([]),
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }

  if (scope === "grocery") {
    searchPromises.push(
      Object.keys(groceryQuery).length
        ? GroceryProductModel.find(groceryQuery).lean().limit(200)
        : Promise.resolve([]),
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }

  if (scope === "restaurant") {
    searchPromises.push(
      Object.keys(restaurantQuery).length
        ? RestaurantItemModel.find(restaurantQuery).lean().limit(200)
        : Promise.resolve([]),
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }

  const brandRegex = buildSafeRegex(normalizedQuery);
  const categoryRegex = buildSafeRegex(normalizedQuery);
  const shopRegex = buildSafeRegex(normalizedQuery);

  searchPromises.push(
    brandRegex
      ? ProductModel.distinct("brand", { brand: brandRegex }).then((b) => b.filter(Boolean).slice(0, 10))
      : Promise.resolve([]),
  );

  searchPromises.push(
    categoryRegex
      ? CategoryModel.find({ name: categoryRegex }).limit(10).lean()
      : Promise.resolve([]),
  );

  searchPromises.push(
    categoryRegex
      ? GoMarketCategoryModel.find({ name: categoryRegex, status: "active" }).limit(10).lean()
      : Promise.resolve([]),
  );

  searchPromises.push(
    shopRegex
      ? GroceryShopModel.find({ shopName: shopRegex }).limit(10).lean()
      : Promise.resolve([]),
  );

  searchPromises.push(
    shopRegex
      ? RestaurantModel.find({ restaurantName: shopRegex }).limit(10).lean()
      : Promise.resolve([]),
  );

  const [
    rawProducts,
    rawGrocery,
    rawRestaurantItems,
    brandMatches,
    legacyCategories,
    goMarketCategories,
    groceryShops,
    restaurants,
  ] = await Promise.all(searchPromises);

  const shopIds = [...new Set(rawGrocery.map((g) => String(g.shopId)).filter(Boolean))];
  const restaurantIds = [...new Set(rawRestaurantItems.map((r) => String(r.restaurantId)).filter(Boolean))];

  const [shops, restaurantDocs] = await Promise.all([
    shopIds.length ? GroceryShopModel.find({ _id: { $in: shopIds } }).lean() : [],
    restaurantIds.length ? RestaurantModel.find({ _id: { $in: restaurantIds } }).lean() : [],
  ]);

  const shopMap = Object.fromEntries(shops.map((s) => [String(s._id), s]));
  const restaurantMap = Object.fromEntries(restaurantDocs.map((r) => [String(r._id), r]));

  let products = [
    ...rawProducts.map((p) => mapProduct(p, cleanQuery, expandedTerms)),
    ...rawGrocery.map((g) => mapGroceryProduct(g, cleanQuery, expandedTerms, shopMap)),
    ...rawRestaurantItems.map((r) => mapRestaurantItem(r, cleanQuery, expandedTerms, restaurantMap)),
  ];

  if (isSynonymExpanded) {
    products = products.map((p) => ({ ...p, score: (p.score || 0) + 50 }));
  }

  products = sortProducts(applyProductFilters(products, filters), sortBy);

  const vocabulary = buildVocabulary(
    [...rawProducts, ...rawGrocery, ...rawRestaurantItems],
    (item) => [
      item.name || item.itemName,
      item.brand,
      item.catName,
      item.subCat,
      item.keywords,
      item.title,
      item.searchKeywords,
    ].flat().filter(Boolean),
  );

  let didYouMean = getSpellCorrection(normalizedQuery, vocabulary);

  if (!products.length && includeRelated) {
    const [featuredProducts, popularGrocery] = await Promise.all([
      ProductModel.find({ isFeatured: true }).limit(12).lean(),
      GroceryProductModel.find({ isFeatured: true }).limit(12).lean(),
    ]);

    products = [
      ...featuredProducts.map((p) => mapProduct(p, cleanQuery, expandedTerms)),
      ...popularGrocery.map((g) => mapGroceryProduct(g, cleanQuery, expandedTerms, shopMap)),
    ].map((p) => ({ ...p, score: (p.score || 0) * 0.3, isRelated: true }));
  }

  const paginated = paginateResults(products, page, limit);
  const related = products.filter((p) => p.isRelated).slice(0, 12);
  const trending = products.filter((p) => p.isFeatured || Number(p.sale || p.soldCount || 0) > 5).slice(0, 10);

  const brands = (brandMatches || [])
    .filter(Boolean)
    .map((name) => ({
      name,
      highlightedName: highlightSearchText(name, cleanQuery),
      type: "brand",
    }));

  const categories = [
    ...(legacyCategories || []).map((c) => ({
      _id: c._id,
      name: c.name,
      highlightedName: highlightSearchText(c.name, cleanQuery),
      image: c.images?.[0] || "",
      type: "category",
      source: "legacy",
    })),
    ...(goMarketCategories || []).map((c) => ({
      _id: c._id,
      name: c.name,
      highlightedName: highlightSearchText(c.name, cleanQuery),
      image: c.image || "",
      type: "category",
      categoryType: c.type,
      source: "goMarket",
    })),
  ];

  const shopsResult = [
    ...(groceryShops || []).map((s) => ({
      _id: s._id,
      name: s.shopName,
      highlightedName: highlightSearchText(s.shopName, cleanQuery),
      logo: s.shopLogo || "",
      banner: s.shopBanner || "",
      shopType: s.shopType,
      rating: s.rating || 0,
      type: "shop",
      source: "grocery",
    })),
    ...(restaurants || []).map((r) => ({
      _id: r._id,
      name: r.restaurantName,
      highlightedName: highlightSearchText(r.restaurantName, cleanQuery),
      logo: r.restaurantLogo || "",
      banner: r.restaurantBanner || "",
      rating: r.rating || 0,
      type: "shop",
      source: "restaurant",
    })),
  ];

  const expandedSynonyms = await expandSynonyms(cleanQuery);
  const suggestions = rankSuggestions(cleanQuery, [
    ...paginated.items.map((p) => p.name),
    ...brands.map((b) => b.name),
    ...categories.map((c) => c.name),
    ...expandedSynonyms,
  ], { limit: 10, getLabel: (x) => x });

  if (!didYouMean && products.length === 0 && suggestions.length > 0) {
    didYouMean = suggestions[0];
  }

  const filterOptions = {
    brands: [...new Set(products.map((p) => p.brand).filter(Boolean))].slice(0, 30),
    categories: [...new Set(products.map((p) => p.category).filter(Boolean))].slice(0, 20),
    priceRange: {
      min: Math.min(...products.map((p) => Number(p.price || 0)).filter((n) => n > 0), 0) || 0,
      max: Math.max(...products.map((p) => Number(p.price || 0)), 0) || 0,
    },
  };

  const response = {
    success: true,
    query: cleanQuery,
    normalizedQuery,
    didYouMean,
    suggestions,
    products: paginated.items,
    totalProducts: paginated.total,
    page: paginated.page,
    totalPages: paginated.totalPages,
    categories,
    brands,
    shops: shopsResult,
    trending,
    related,
    popular: trending.slice(0, 8),
    filterOptions,
    meta: {
      scope,
      expandedTerms: expandedTerms.slice(0, 10),
      hasExactMatch: products.some((p) => normalizeSearchText(p.name) === normalizedQuery),
    },
  };

  // cacheSet(cacheKey, response, 45_000);
  return response;
} catch (error) {
  console.error("❌ Error in executeSearch:", error);
  throw error;
}
};

/**
 * Fast autocomplete suggestions (debounce-friendly).
 * @param {object} options
 */
export const executeSuggestions = async ({ query = "", limit = 10 } = {}) => {
  try {
    const cleanQuery = sanitizeSearchQuery(query);
    if (!cleanQuery || cleanQuery.length < 1) {
      return { success: true, suggestions: [], products: [], categories: [], brands: [], shops: [] };
    }

    // Temporarily disable cache for debugging
    // const cacheKey = buildCacheKey("suggestions", cleanQuery, limit);
    // const cached = cacheGet(cacheKey);
    // if (cached) return cached;

    const expandedTerms = await getExpandedSearchTerms(cleanQuery);
    const productQuery = buildProductQuery(expandedTerms.slice(0, 5));

  const [products, topSearches] = await Promise.all([
    Object.keys(productQuery).length
      ? ProductModel.find(productQuery)
          .select("name brand images price discount catName subCat rating sale isFeatured title searchKeywords")
          .limit(30)
          .lean()
      : [],
    topSearchRepository.getTop(10),
  ]);

  const terms = await getMeaningfulTokens(cleanQuery);
  const mappedProducts = [
    ...products.map((p) => mapProduct(p, cleanQuery, terms)),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const expandedSynonyms = await expandSynonyms(cleanQuery);
  const textSuggestions = rankSuggestions(
    cleanQuery,
    [
      ...mappedProducts.map((p) => p.name),
      ...topSearches.map((t) => t.keyword),
      ...expandedSynonyms,
    ],
    { limit, getLabel: (x) => x },
  );

  const vocabulary = buildVocabulary(products, (p) => [p.name, p.brand, p.catName, ...(p.keywords || [])]);
  const didYouMean = getSpellCorrection(normalizeSearchText(cleanQuery), vocabulary);

  const brandRegex = buildSafeRegex(cleanQuery);
  const brands = brandRegex
    ? (await ProductModel.distinct("brand", { brand: brandRegex })).slice(0, 5).map((name) => ({
        name,
        highlightedName: highlightSearchText(name, cleanQuery),
        type: "brand",
      }))
    : [];

  const categoryRegex = buildSafeRegex(cleanQuery);
  const categories = categoryRegex
    ? (await CategoryModel.find({ name: categoryRegex }).limit(5).lean()).map((c) => ({
        _id: c._id,
        name: c.name,
        highlightedName: highlightSearchText(c.name, cleanQuery),
        type: "category",
      }))
    : [];

  const response = {
    success: true,
    query: cleanQuery,
    didYouMean,
    suggestions: textSuggestions,
    products: mappedProducts,
    categories,
    brands,
    topSearches: topSearches.map((t) => t.keyword),
    loading: false,
  };

  // cacheSet(cacheKey, response, 30_000);
  return response;
} catch (error) {
  console.error("❌ Error in executeSuggestions:", error);
  throw error;
}
};

/**
 * Default empty state for focused search (no query).
 */
export const getSearchDefaults = async (userId = null) => {
  const [topAll, topToday, topWeek, recentFromTop] = await Promise.all([
    topSearchRepository.getTop(20),
    topSearchRepository.getTopToday(10),
    topSearchRepository.getTopWeek(10),
    topSearchRepository.getTopMonth(10),
  ]);

  const [featuredProducts, popularCategories, popularBrands] = await Promise.all([
    ProductModel.find({ isFeatured: true }).select("name brand images price discount rating").limit(8).lean(),
    CategoryModel.find().limit(8).lean(),
    ProductModel.distinct("brand", { brand: { $ne: "" } }).then((b) => b.filter(Boolean).slice(0, 10)),
  ]);

  return {
    success: true,
    topSearches: topAll.map((t) => ({ keyword: t.keyword, count: t.count })),
    topToday: topToday.map((t) => t.keyword),
    topWeek: topWeek.map((t) => t.keyword),
    topMonth: recentFromTop.map((t) => t.keyword),
    trending: topToday.slice(0, 8).map((t) => t.keyword),
    popularCategories: popularCategories.map((c) => ({
      _id: c._id,
      name: c.name,
      image: c.images?.[0] || "",
    })),
    popularBrands: popularBrands.map((name) => ({ name })),
    popularProducts: featuredProducts.map((p) => ({
      _id: p._id,
      name: p.name,
      brand: p.brand,
      image: p.images?.[0] || "",
      price: p.price,
      discount: p.discount,
      rating: p.rating,
    })),
    recentSearches: [],
  };
};

const buildEmptyResponse = () => ({
  success: true,
  query: "",
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

export default { executeSearch, executeSuggestions, getSearchDefaults };
