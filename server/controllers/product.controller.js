import ReviewModel from "../models/reviews.model.js";
import ProductModel from "../models/product.modal.js";
import ProductRAMSModel from "../models/productRAMS.js";
import ProductWEIGHTModel from "../models/productWEIGHT.js";
import ProductSIZEModel from "../models/productSIZE.js";

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import mongoose from "mongoose";

const normalizeKeywords = (keywords) => {
  if (Array.isArray(keywords)) {
    return keywords
      .map((item) =>
        String(item || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);
  }

  if (typeof keywords === "string") {
    return keywords
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
};

const normalizeSearchText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeText = (value = "") =>
  normalizeSearchText(value).split(" ").filter(Boolean);

const SEARCH_STOP_WORDS = new Set([
  "for",
  "the",
  "and",
  "with",
  "from",
  "new",
  "latest",
  "best",
  "buy",
  "shop",
  "online",
]);

const getMeaningfulSearchTokens = (value = "") => {
  const tokens = tokenizeText(value);
  const filtered = tokens.filter(
    (token) => token.length > 1 && !SEARCH_STOP_WORDS.has(token),
  );

  return filtered.length ? filtered : tokens;
};

const levenshteinDistance = (a = "", b = "") => {
  const first = normalizeSearchText(a);
  const second = normalizeSearchText(b);

  if (!first.length) return second.length;
  if (!second.length) return first.length;

  const matrix = Array.from({ length: first.length + 1 }, () =>
    Array(second.length + 1).fill(0),
  );

  for (let i = 0; i <= first.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= second.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= first.length; i++) {
    for (let j = 1; j <= second.length; j++) {
      const cost = first[i - 1] === second[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[first.length][second.length];
};

const buildSearchVocabulary = (products = []) => {
  const vocabulary = new Set();

  products.forEach((item) => {
    [
      item?.name,
      item?.brand,
      item?.catName,
      item?.subCat,
      item?.thirdsubCat,
      ...(item?.keywords || []),
    ].forEach((field) => {
      tokenizeText(field).forEach((token) => {
        if (token.length > 1) {
          vocabulary.add(token);
        }
      });
    });
  });

  return Array.from(vocabulary);
};

const getSpellCorrectedQuery = (query = "", vocabulary = []) => {
  const words = tokenizeText(query);
  if (!words.length || !vocabulary.length) {
    return null;
  }

  let isModified = false;
  const correctedWords = words.map((word) => {
    if (vocabulary.includes(word)) {
      return word;
    }

    let bestMatch = word;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const token of vocabulary) {
      if (Math.abs(token.length - word.length) > 3) continue;
      const distance = levenshteinDistance(word, token);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = token;
      }
    }

    const maxDistance = word.length > 7 ? 2 : 1;
    if (bestDistance <= maxDistance && bestMatch !== word) {
      isModified = true;
      return bestMatch;
    }

    return word;
  });

  if (!isModified) {
    return null;
  }

  return correctedWords.join(" ");
};

const buildSearchIntentPhrases = (query = "") => {
  const tokens = getMeaningfulSearchTokens(query);
  if (!tokens.length) return [];

  const phrases = [tokens.join(" ")];
  if (tokens.length >= 2) {
    phrases.push(tokens.slice(0, 2).join(" "));
  }

  return Array.from(new Set(phrases.filter(Boolean)));
};

const buildAiSearchInsights = (products = [], correctedQuery = "") => {
  if (!products.length) {
    return {
      title: "AI Search Assistant",
      summary:
        "Mujhe exact product match nahi mila. Aap brand, category ya short keywords try karein.",
      highlights: [],
    };
  }

  const topProducts = products.slice(0, 3);
  const priceList = topProducts.map((item) => Number(item?.price) || 0);
  const minPrice = Math.min(...priceList);
  const maxPrice = Math.max(...priceList);

  return {
    title: "AI Search Assistant",
    summary: correctedQuery
      ? `Aapke search ke liye "${correctedQuery}" use kiya gaya hai. Yeh top relevant options hain.`
      : "Yeh products relevance, popularity aur pricing ke hisaab se recommend kiye gaye hain.",
    highlights: [
      `Top ${topProducts.length} recommendations curated by relevance score`,
      `Best visible price range: ₹${minPrice} - ₹${maxPrice}`,
      topProducts[0]?.brand
        ? `Leading brand in results: ${topProducts[0].brand}`
        : "Mixed brand results available",
    ],
  };
};

const buildSearchSuggestions = (
  products = [],
  query = "",
  correctedQuery = "",
) => {
  const cleanQuery = normalizeSearchText(query);
  if (!cleanQuery) return [];

  const collectedSuggestions = [];

  products.slice(0, 40).forEach((item) => {
    [
      item?.name,
      item?.brand,
      item?.catName,
      item?.subCat,
      item?.thirdsubCat,
      ...(item?.keywords || []),
    ].forEach((value) => {
      const normalized = normalizeSearchText(value);
      if (
        normalized &&
        (normalized.includes(cleanQuery) || cleanQuery.includes(normalized))
      ) {
        collectedSuggestions.push(normalized);
      }
    });
    normalizeKeywords(item?.keywords).forEach((keyword) => {
      if (keyword.includes(cleanQuery) || cleanQuery.includes(keyword)) {
        collectedSuggestions.push(keyword);
      }
    });
  });

  const suggestionSet = new Set([
    ...(correctedQuery ? [normalizeSearchText(correctedQuery)] : []),
    ...collectedSuggestions,
  ]);

  return Array.from(suggestionSet).filter(Boolean).slice(0, 12);
};

const buildSuggestionProducts = (products = []) => {
  return products.slice(0, 6).map((item) => ({
    _id: item?._id,
    name: item?.name || "",
    brand: item?.brand || "",
    description: item?.description || "",
    image: Array.isArray(item?.images) ? item.images[0] : "",
  }));
};

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});


// ═══════════════════════════════════════════════════════════════════
// SERVER-SIDE PRODUCT CACHE
// getProduct fast karne ke liye — same product dobara click pe
// DB hit nahi hogi, cache se instant response milega.
// TTL: 5 min. Update/Delete pe auto-invalidate.
// ═══════════════════════════════════════════════════════════════════
const _productCache = new Map();
const _CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function _cacheSet(id, data) {
  _productCache.set(String(id), { data, exp: Date.now() + _CACHE_TTL });
}
function _cacheGet(id) {
  const e = _productCache.get(String(id));
  if (!e) return null;
  if (Date.now() > e.exp) { _productCache.delete(String(id)); return null; }
  return e.data;
}
function _cacheDel(id) { _productCache.delete(String(id)); }

// filterOptions poore DB se ek baar fetch karo, 10 min cache rakho
// (filters/search function bar-bar ye fetch karta tha — ab nahi)
let _filterOptionsCache = null;
let _filterOptionsCacheExp = 0;
async function _getFilterOptions() {
  if (_filterOptionsCache && Date.now() < _filterOptionsCacheExp) {
    return _filterOptionsCache;
  }
  const items = await ProductModel.find({})
    .select("brand size productType thirdsubCat subCat catName productWeight productRam colorOptions.name")
    .lean();
  _filterOptionsCache = {
    brands:       [...new Set(items.map(i => i?.brand?.trim()).filter(Boolean))],
    sizes:        [...new Set(items.flatMap(i => i?.size || []).filter(Boolean))],
    productTypes: [...new Set(items.map(i => i?.productType || i?.thirdsubCat || i?.subCat || i?.catName).filter(Boolean))],
    weights:      [...new Set(items.flatMap(i => i?.productWeight || []).filter(Boolean))],
    ramOptions:   [...new Set(items.flatMap(i => i?.productRam || []).filter(Boolean))],
    colors:       [...new Set(items.flatMap(i => (i?.colorOptions || []).map(c => c?.name)).filter(Boolean))],
  };
  _filterOptionsCacheExp = Date.now() + 10 * 60 * 1000; // 10 min
  return _filterOptionsCache;
}
//image upload
var imagesArr = [];
export async function uploadImages(request, response) {
  try {
    imagesArr = [];

    const image = request.files;

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    for (let i = 0; i < image?.length; i++) {
      const img = await cloudinary.uploader.upload(
        image[i].path,
        options,
        function (error, result) {
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${request.files[i].filename}`);
        },
      );
    }

    return response.status(200).json({
      images: imagesArr,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

var bannerImage = [];
export async function uploadBannerImages(request, response) {
  try {
    bannerImage = [];

    const image = request.files;

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    for (let i = 0; i < image?.length; i++) {
      const img = await cloudinary.uploader.upload(
        image[i].path,
        options,
        function (error, result) {
          bannerImage.push(result.secure_url);
          fs.unlinkSync(`uploads/${request.files[i].filename}`);
        },
      );
    }

    return response.status(200).json({
      images: bannerImage,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//create product
export async function createProduct(request, response) {
  try {
    let product = new ProductModel({
      name: request.body.name,
      description: request.body.description,
      images: imagesArr,
      bannerimages: bannerImage,
      bannerTitleName: request.body.bannerTitleName,
      isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
      brand: request.body.brand,
      keywords: normalizeKeywords(request.body.keywords),
      price: request.body.price,
      oldPrice: request.body.oldPrice,
      catName: request.body.catName,
      category: request.body.category,
      catId: request.body.catId,
      subCatId: request.body.subCatId,
      subCat: request.body.subCat,
      thirdsubCat: request.body.thirdsubCat,
      thirdsubCatId: request.body.thirdsubCatId,
      countInStock: request.body.countInStock,
      rating: request.body.rating,
      isFeatured: request.body.isFeatured,
      discount: request.body.discount,
      productRam: request.body.productRam,
      size: request.body.size,
      productWeight: request.body.productWeight,
      sale: request.body.sale || 0,
      colorOptions: request.body.colorOptions || [],
      specifications: request.body.specifications || [],
      seller: request.userId,
    });

    product = await product.save();

    console.log(product);

    if (!product) {
      response.status(500).json({
        error: true,
        success: false,
        message: "Product Not created",
      });
    }

    imagesArr = [];

    return response.status(200).json({
      message: "Product Created successfully",
      error: false,
      success: true,
      product: product,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}


//get all products
export async function getAllProducts(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const total = await ProductModel.countDocuments();
    const products = await ProductModel.find()
      .populate("seller", "name email role status storeProfile")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // ✅ FIX: lean() — 2-3x faster, plain JS object return karta hai
    if (!products) return response.status(400).json({ error: true, success: false });
    return response.status(200).json({
      error: false, success: true, products,
      total, page, totalPages: Math.ceil(total / limit), totalCount: total,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}
//get all products by category id
export async function getAllProductsByCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.limit) || parseInt(request.query.perPage) || 10;

    // ✅ Fix: sirf is catId ke products count karo
    const totalPosts = await ProductModel.countDocuments({ catId: request.params.id });
    const totalPages = Math.ceil(totalPosts / perPage) || 1;

    const products = await ProductModel.find({ catId: request.params.id })
      .populate("category")
       .populate("seller", "name email role status storeProfile")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean().exec();

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      totalProducts: totalPosts,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all products by category name
export async function getAllProductsByCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;

    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "Page not found",
        success: false,
        error: true,
      });
    }

    const products = await ProductModel.find({
      catName: request.query.catName,
    })
      .populate("category")
      .populate("seller", "name email role status storeProfile")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean().exec();

    if (!products) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all products by sub category id
export async function getAllProductsBySubCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    // ✅ Fix: frontend 'limit' bhejta hai, 'perPage' nahi — dono support karo
    const perPage = parseInt(request.query.limit) || parseInt(request.query.perPage) || 10;

    // ✅ Fix: totalPages sirf is subCatId ke products se calculate karo, poore DB se nahi
    const totalPosts = await ProductModel.countDocuments({ subCatId: request.params.id });
    const totalPages = Math.ceil(totalPosts / perPage) || 1;

    const products = await ProductModel.find({ subCatId: request.params.id })
      .populate("category")
      .populate("seller", "name email role status storeProfile")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean().exec();

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      totalProducts: totalPosts,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all products by sub category name
export async function getAllProductsBySubCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;

    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "Page not found",
        success: false,
        error: true,
      });
    }

    const products = await ProductModel.find({
      subCat: request.query.subCat,
    })
      .populate("category")
      .populate("seller", "name email role status storeProfile")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean().exec();

    if (!products) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all products by third level category id
export async function getAllProductsByThirdLavelCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.limit) || parseInt(request.query.perPage) || 10;

    // ✅ Fix: sirf is thirdsubCatId ke products count karo
    const totalPosts = await ProductModel.countDocuments({ thirdsubCatId: request.params.id });
    const totalPages = Math.ceil(totalPosts / perPage) || 1;

    const products = await ProductModel.find({ thirdsubCatId: request.params.id })
      .populate("category")
       .populate("seller", "name email role status storeProfile")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean().exec();

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      totalProducts: totalPosts,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all products by sub category name
export async function getAllProductsByThirdLavelCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;

    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "Page not found",
        success: false,
        error: true,
      });
    }

    const products = await ProductModel.find({
      thirdsubCat: request.query.thirdsubCat,
    })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean().exec();

    if (!products) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all products by price

export async function getAllProductsByPrice(request, response) {
  let productList = [];

  if (request.query.catId !== "" && request.query.catId !== undefined) {
    const productListArr = await ProductModel.find({
      catId: request.query.catId,
    }).populate("category");

    productList = productListArr;
  }

  if (request.query.subCatId !== "" && request.query.subCatId !== undefined) {
    const productListArr = await ProductModel.find({
      subCatId: request.query.subCatId,
    }).populate("category");

    productList = productListArr;
  }

  if (
    request.query.thirdsubCatId !== "" &&
    request.query.thirdsubCatId !== undefined
  ) {
    const productListArr = await ProductModel.find({
      thirdsubCatId: request.query.thirdsubCatId,
    }).populate("category");

    productList = productListArr;
  }

  const filteredProducts = productList.filter((product) => {
    if (
      request.query.minPrice &&
      product.price < parseInt(+request.query.minPrice)
    ) {
      return false;
    }
    if (
      request.query.maxPrice &&
      product.price > parseInt(+request.query.maxPrice)
    ) {
      return false;
    }
    return true;
  });

  return response.status(200).json({
    error: false,
    success: true,
    products: filteredProducts,
    totalPages: 0,
    page: 0,
  });
}

//get all products by rating
export async function getAllProductsByRating(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;

    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "Page not found",
        success: false,
        error: true,
      });
    }

    console.log(request.query.subCatId);

    let products = [];

    if (request.query.catId !== undefined) {
      products = await ProductModel.find({
        rating: request.query.rating,
        catId: request.query.catId,
      })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean().exec();
    }

    if (request.query.subCatId !== undefined) {
      products = await ProductModel.find({
        rating: request.query.rating,
        subCatId: request.query.subCatId,
      })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean().exec();
    }

    if (request.query.thirdsubCatId !== undefined) {
      products = await ProductModel.find({
        rating: request.query.rating,
        thirdsubCatId: request.query.thirdsubCatId,
      })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean().exec();
    }

    if (!products) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
export async function getProductsBySellerPublic(request, response) {
  try {
    const sellerId = request.params.sellerId;
    const page  = Math.max(parseInt(request.query.page)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(request.query.limit) || 12, 1), 60);
    const sortBy     = request.query.sortBy    || "latest";
    const minPrice   = Number(request.query.minPrice   || 0);
    const maxPrice   = Number(request.query.maxPrice   || 0);
    const minRating  = Number(request.query.minRating  || 0);
    const catId      = request.query.catId      || "";
    const search     = String(request.query.search     || "").trim();
    const stockStatus = request.query.stockStatus || ""; // "inStock" | "outOfStock"
    const saleOnly   = request.query.saleOnly === "true";

    // Multi-value params (comma-separated)
    const brands     = request.query.brands    ? String(request.query.brands).split(",").map(s => s.trim()).filter(Boolean)  : [];
    const colors     = request.query.colors    ? String(request.query.colors).split(",").map(s => s.trim()).filter(Boolean)  : [];
    const sizes      = request.query.sizes     ? String(request.query.sizes).split(",").map(s => s.trim()).filter(Boolean)   : [];
    const ramOptions = request.query.ramOptions ? String(request.query.ramOptions).split(",").map(s => s.trim()).filter(Boolean) : [];
    const weights    = request.query.weights   ? String(request.query.weights).split(",").map(s => s.trim()).filter(Boolean) : [];
    const discountMin = Number(request.query.discountMin || 0);

    // Build mongo query
    const query = { seller: sellerId };

    if (catId) query.catId = catId;

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
        { catName: searchRegex },
        { subCat: searchRegex },
        { thirdsubCat: searchRegex },
      ];
    }

    if (minPrice > 0 || maxPrice > 0) {
      query.price = {};
      if (minPrice > 0) query.price.$gte = minPrice;
      if (maxPrice > 0) query.price.$lte = maxPrice;
    }

    if (minRating > 0) query.rating = { $gte: minRating };
    if (brands.length)     query.brand = { $in: brands };
    if (colors.length)     query["colorOptions.name"] = { $in: colors };
    if (sizes.length)      query.size = { $in: sizes };
    if (ramOptions.length) query.productRam = { $in: ramOptions };
    if (weights.length)    query.productWeight = { $in: weights };
    if (saleOnly)          query.discount = { $gt: 0 };
    if (discountMin > 0)   query.discount = { ...(query.discount || {}), $gte: discountMin };

    if (stockStatus === "inStock")    query.countInStock = { $gt: 0 };
    if (stockStatus === "outOfStock") query.countInStock = { $lte: 0 };

    const sortMap = {
      latest:         { createdAt: -1 },
      oldest:         { createdAt:  1 },
      priceLowToHigh: { price:  1 },
      priceHighToLow: { price: -1 },
      popularity:     { sale: -1, createdAt: -1 },
      rating:         { rating: -1, createdAt: -1 },
      nameAZ:         { name:  1 },
      nameZA:         { name: -1 },
      discount:       { discount: -1 },
    };
    const sortOption = sortMap[sortBy] || sortMap.latest;

    // Run all queries in parallel
    const [products, total, categoryFacets, filterOptionsRaw] = await Promise.all([
      ProductModel.find(query)
        .populate("seller", "name email role status storeProfile")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit).lean(),
      ProductModel.countDocuments(query),
      ProductModel.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: "$catId", name: { $first: "$catName" }, total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      // filterOptions always from ALL seller products (not filtered) so options stay stable
      ProductModel.find({ seller: sellerId })
        .select("brand size productWeight productRam colorOptions.name discount countInStock rating")
        .lean(),
    ]);

    const categories = (categoryFacets || [])
      .filter((item) => item?._id)
      .map((item) => ({ _id: String(item._id), name: item.name || "Uncategorized", total: item.total || 0 }));

    const filterOptions = {
      brands:     [...new Set(filterOptionsRaw.map(i => i?.brand?.trim()).filter(Boolean))].sort(),
      sizes:      [...new Set(filterOptionsRaw.flatMap(i => i?.size || []).filter(Boolean))].sort(),
      colors:     [...new Set(filterOptionsRaw.flatMap(i => (i?.colorOptions || []).map(c => c?.name)).filter(Boolean))].sort(),
      ramOptions: [...new Set(filterOptionsRaw.flatMap(i => i?.productRam || []).filter(Boolean))].sort(),
      weights:    [...new Set(filterOptionsRaw.flatMap(i => i?.productWeight || []).filter(Boolean))].sort(),
      hasDiscount: filterOptionsRaw.some(i => (i?.discount || 0) > 0),
      hasOutOfStock: filterOptionsRaw.some(i => (i?.countInStock || 0) <= 0),
    };

    // Rating stats
    const ratingList = filterOptionsRaw.map(i => Number(i?.rating) || 0).filter(r => r > 0);
    const ratingStats = {
      avg: ratingList.length ? parseFloat((ratingList.reduce((s, r) => s + r, 0) / ratingList.length).toFixed(1)) : 0,
      totalReviews: ratingList.length,
      breakdown: ratingList.reduce((acc, r) => {
        const key = Math.round(r);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    };

    return response.status(200).json({
      error: false,
      success: true,
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      categories,
      filterOptions,
      ratingStats,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getSellerProducts(request, response) {
  try {
    const products = await ProductModel.find({ seller: request.userId })
      .sort({ createdAt: -1 })
      .populate("seller", "name email role status storeProfile");

    return response.status(200).json({
      error: false,
      success: true,
      products,
      total: products.length,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
//get all products count

export async function getProductsCount(request, response) {
  try {
    const productsCount = await ProductModel.countDocuments();

    if (!productsCount) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      productCount: productsCount,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all features products
export async function getAllFeaturedProducts(request, response) {
  try {
    const products = await ProductModel.find({
      isFeatured: true,
    }).populate("category");

    if (!products) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all features products have banners
export async function getAllProductsBanners(request, response) {
  try {
    const products = await ProductModel.find({
      isDisplayOnHomeBanner: true,
    }).populate("category");

    if (!products) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//delete product
export async function deleteProduct(request, response) {
  const product = await ProductModel.findById(request.params.id).populate("category");
  if (!product) {
    return response.status(404).json({ message: "Product Not found", error: true, success: false });
  }
  for (const img of product.images) {
    const imageName = img.split("/").pop().split(".")[0];
    if (imageName) cloudinary.uploader.destroy(imageName, () => {});
  }
  const deletedProduct = await ProductModel.findByIdAndDelete(request.params.id);
  if (!deletedProduct) {
    return response.status(404).json({ message: "Product not deleted!", success: false, error: true });
  }
  _cacheDel(request.params.id); // ✅ FIX: cache invalidate
  return response.status(200).json({ success: true, error: false, message: "Product Deleted!" });
}

//delete multiple products
export async function deleteMultipleProduct(request, response) {
  const { ids } = request.body;
  if (!ids || !Array.isArray(ids)) {
    return response.status(400).json({ error: true, success: false, message: "Invalid input" });
  }
  for (const id of ids) {
    const product = await ProductModel.findById(id);
    if (product) {
      for (const img of product.images) {
        const imageName = img.split("/").pop().split(".")[0];
        if (imageName) cloudinary.uploader.destroy(imageName, () => {});
      }
    }
    _cacheDel(id); // ✅ FIX: cache invalidate
  }
  try {
    await ProductModel.deleteMany({ _id: { $in: ids } });
    return response.status(200).json({ message: "Product delete successfully", error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

// ── GET SINGLE PRODUCT — OPTIMIZED ──────────────────────────────────────────
// FIX 1: .lean() → plain JS object, 2-3x faster (no Mongoose document overhead)
// FIX 2: In-memory cache (5 min TTL) → dobara click pe instant response
// FIX 3: Cache-Control header → browser bhi cache kar sakta hai
export async function getProduct(request, response) {
  try {
    const id = request.params.id;

    // Cache hit — instant return, no DB call
    const cached = _cacheGet(id);
    if (cached) {
      return response
        .status(200)
        .set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
        .json({ error: false, success: true, product: cached });
    }

    // Cache miss — DB se fetch, lean() se fast
    const product = await ProductModel.findById(id)
      .populate("category")
      .lean(); // ✅ KEY FIX

    if (!product) {
      return response.status(404).json({ message: "The product is not found", error: true, success: false });
    }

    _cacheSet(id, product); // save for next request

    return response
      .status(200)
      .set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
      .json({ error: false, success: true, product });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//delete images
export async function removeImageFromCloudinary(request, response) {
  const imgUrl = request.query.img;
  const imageName = imgUrl.split("/").pop().split(".")[0];
  if (imageName) {
    const res = await cloudinary.uploader.destroy(imageName, () => {});
    if (res) response.status(200).send(res);
  }
}

//updated product
export async function updateProduct(request, response) {
  try {
    const existingProduct = await ProductModel.findById(request.params.id);
    if (!existingProduct) {
      return response.status(404).json({ error: true, success: false, message: "Product not found" });
    }
    if (request.currentUser?.role === "SELLER" && existingProduct.seller?.toString() !== request.userId) {
      return response.status(403).json({ error: true, success: false, message: "You can update only your products" });
    }
    const product = await ProductModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
        description: request.body.description,
        bannerimages: request.body.bannerimages,
        bannerTitleName: request.body.bannerTitleName,
        isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
        images: request.body.images,
        brand: request.body.brand,
        keywords: normalizeKeywords(request.body.keywords),
        price: request.body.price,
        oldPrice: request.body.oldPrice,
        catId: request.body.catId,
        catName: request.body.catName,
        subCat: request.body.subCat,
        subCatId: request.body.subCatId,
        category: request.body.category,
        thirdsubCat: request.body.thirdsubCat,
        thirdsubCatId: request.body.thirdsubCatId,
        countInStock: request.body.countInStock,
        rating: request.body.rating,
        isFeatured: request.body.isFeatured,
        discount: request.body.discount,
        productRam: request.body.productRam,
        size: request.body.size,
        productWeight: request.body.productWeight,
        sale: request.body.sale || 0,
        colorOptions: request.body.colorOptions || [],
        specifications: request.body.specifications || [],
        seller: request.body.seller,
      },
      { new: true },
    );
    if (!product) {
      return response.status(404).json({ message: "the product can not be updated!", status: false });
    }
    _cacheDel(request.params.id); // ✅ FIX: update ke baad cache clear
    _filterOptionsCache = null;   // ✅ FIX: filter options refresh
    imagesArr = [];
    return response.status(200).json({ message: "The product is updated", error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}
export async function createProductRAMS(request, response) {
  try {
    let productRAMS = new ProductRAMSModel({
      name: request.body.name,
    });

    productRAMS = await productRAMS.save();

    if (!productRAMS) {
      response.status(500).json({
        error: true,
        success: false,
        message: "Product RAMS Not created",
      });
    }

    return response.status(200).json({
      message: "Product RAMS Created successfully",
      error: false,
      success: true,
      product: productRAMS,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductRAMS(request, response) {
  const productRams = await ProductRAMSModel.findById(request.params.id);

  if (!productRams) {
    return response.status(404).json({
      message: "Item Not found",
      error: true,
      success: false,
    });
  }

  const deletedProductRams = await ProductRAMSModel.findByIdAndDelete(
    request.params.id,
  );

  if (!deletedProductRams) {
    response.status(404).json({
      message: "Item not deleted!",
      success: false,
      error: true,
    });
  }

  return response.status(200).json({
    success: true,
    error: false,
    message: "Product Ram Deleted!",
  });
}

export async function updateProductRam(request, response) {
  try {
    const productRam = await ProductRAMSModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true },
    );

    if (!productRam) {
      return response.status(404).json({
        message: "the product Ram can not be updated!",
        status: false,
      });
    }

    return response.status(200).json({
      message: "The product Ram is updated",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductRams(request, response) {
  try {
    const productRam = await ProductRAMSModel.find();

    if (!productRam) {
      return response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      data: productRam,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductRamsById(request, response) {
  try {
    const productRam = await ProductRAMSModel.findById(request.params.id);

    if (!productRam) {
      return response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      data: productRam,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function createProductWEIGHT(request, response) {
  try {
    let productWeight = new ProductWEIGHTModel({
      name: request.body.name,
    });

    productWeight = await productWeight.save();

    if (!productWeight) {
      response.status(500).json({
        error: true,
        success: false,
        message: "Product WEIGHT Not created",
      });
    }

    return response.status(200).json({
      message: "Product WEIGHT Created successfully",
      error: false,
      success: true,
      product: productWeight,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductWEIGHT(request, response) {
  const productWeight = await ProductWEIGHTModel.findById(request.params.id);

  if (!productWeight) {
    return response.status(404).json({
      message: "Item Not found",
      error: true,
      success: false,
    });
  }

  const deletedProductWeight = await ProductWEIGHTModel.findByIdAndDelete(
    request.params.id,
  );

  if (!deletedProductWeight) {
    response.status(404).json({
      message: "Item not deleted!",
      success: false,
      error: true,
    });
  }

  return response.status(200).json({
    success: true,
    error: false,
    message: "Product Weight Deleted!",
  });
}

export async function updateProductWeight(request, response) {
  try {
    const productWeight = await ProductWEIGHTModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true },
    );

    if (!productWeight) {
      return response.status(404).json({
        message: "the product weight can not be updated!",
        status: false,
      });
    }

    return response.status(200).json({
      message: "The product weight is updated",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductWeight(request, response) {
  try {
    const productWeight = await ProductWEIGHTModel.find();

    if (!productWeight) {
      return response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      data: productWeight,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductWeightById(request, response) {
  try {
    const productWeight = await ProductWEIGHTModel.findById(request.params.id);

    if (!productWeight) {
      return response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      data: productWeight,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function createProductSize(request, response) {
  try {
    let productSize = new ProductSIZEModel({
      name: request.body.name,
    });

    productSize = await productSize.save();

    if (!productSize) {
      response.status(500).json({
        error: true,
        success: false,
        message: "Product size Not created",
      });
    }

    return response.status(200).json({
      message: "Product size Created successfully",
      error: false,
      success: true,
      product: productSize,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductSize(request, response) {
  const productSize = await ProductSIZEModel.findById(request.params.id);

  if (!productSize) {
    return response.status(404).json({
      message: "Item Not found",
      error: true,
      success: false,
    });
  }

  const deletedProductSize = await ProductSIZEModel.findByIdAndDelete(
    request.params.id,
  );

  if (!deletedProductSize) {
    response.status(404).json({
      message: "Item not deleted!",
      success: false,
      error: true,
    });
  }

  return response.status(200).json({
    success: true,
    error: false,
    message: "Product size Deleted!",
  });
}

export async function updateProductSize(request, response) {
  try {
    const productSize = await ProductSIZEModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true },
    );

    if (!productSize) {
      return response.status(404).json({
        message: "the product size can not be updated!",
        status: false,
      });
    }

    return response.status(200).json({
      message: "The product size is updated",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductSize(request, response) {
  try {
    const productSize = await ProductSIZEModel.find();

    if (!productSize) {
      return response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      data: productSize,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductSizeById(request, response) {
  try {
    const productSize = await ProductSIZEModel.findById(request.params.id);

    if (!productSize) {
      return response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      data: productSize,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function filters(request, response) {
  const {
    catId, subCatId, thirdsubCatId, minPrice, maxPrice, rating,
    colors, page, limit, brands, sizes, productTypes, priceRanges,
    saleOnly, stockStatus, discountRanges, weights, ramOptions, sortType, query,
  } = request.body;

  const filterQuery = {};
  if (catId?.length)         filterQuery.catId         = { $in: catId };
  if (subCatId?.length)      filterQuery.subCatId      = { $in: subCatId };
  if (thirdsubCatId?.length) filterQuery.thirdsubCatId = { $in: thirdsubCatId };
  if (minPrice || maxPrice)  filterQuery.price         = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
  if (rating?.length)        filterQuery.rating        = { $in: rating };
  if (colors?.length)        filterQuery["colorOptions.name"] = { $in: colors };
  if (brands?.length)        filterQuery.brand         = { $in: brands };
  if (sizes?.length)         filterQuery.size          = { $in: sizes };
  if (weights?.length)       filterQuery.productWeight = { $in: weights };
  if (ramOptions?.length)    filterQuery.productRam    = { $in: ramOptions };
  if (saleOnly)              filterQuery.discount      = { $gt: 0 };
  if (stockStatus === "inStock")    filterQuery.countInStock = { $gt: 0 };
  if (stockStatus === "outOfStock") filterQuery.countInStock = { $lte: 0 };
  if (discountRanges?.length) {
    const minDiscount = Math.min(...discountRanges.map(Number).filter(Boolean));
    if (Number.isFinite(minDiscount)) filterQuery.discount = { ...(filterQuery.discount || {}), $gte: minDiscount };
  }

  const andConditions = [];
  if (productTypes?.length) {
    andConditions.push({ $or: [
      { productType: { $in: productTypes } }, { thirdsubCat: { $in: productTypes } },
      { subCat: { $in: productTypes } },      { catName: { $in: productTypes } },
    ]});
  }
  if (query?.trim()) {
    const qr = new RegExp(query.trim(), "i");
    andConditions.push({ $or: [{ name: qr }, { description: qr }, { brand: qr }, { catName: qr }, { subCat: qr }, { thirdsubCat: qr }] });
  }
  if (priceRanges?.length) {
    const rangeFilters = priceRanges.map(r => { const [mn, mx] = String(r).split("-").map(Number); return (isNaN(mn)||isNaN(mx)) ? null : { price: { $gte: mn, $lte: mx } }; }).filter(Boolean);
    if (rangeFilters.length) andConditions.push({ $or: rangeFilters });
  }
  if (andConditions.length) filterQuery.$and = [...(filterQuery.$and || []), ...andConditions];

  const sortConfig = {
    bestSeller: { sale: -1, rating: -1, createdAt: -1, _id: -1 },
    latest:     { createdAt: -1, _id: -1 },
    popular:    { rating: -1, sale: -1, _id: -1 },
    featured:   { isFeatured: -1, sale: -1, _id: -1 },
    priceAsc:   { price: 1, _id: 1 },
    priceDesc:  { price: -1, _id: -1 },
    nameAsc:    { name: 1, _id: 1 },
    nameDesc:   { name: -1, _id: -1 },
  };

  try {
    const currentPage = Math.max(1, parseInt(page) || 1);
    const perPage     = Math.max(1, parseInt(limit) || 20);

    // ✅ FIX: products + count parallel mein, aur filterOptions cached
    const [products, total, filterOptions] = await Promise.all([
      ProductModel.find(filterQuery)
        .populate("category")
        .sort(sortConfig[sortType] || sortConfig.bestSeller)
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
        .lean(), // ✅ lean()
      ProductModel.countDocuments(filterQuery),
      _getFilterOptions(), // ✅ FIX: cached — bar-bar poora DB scan nahi
    ]);

    return response.status(200).json({
      error: false, success: true, products, total,
      page: currentPage, totalPages: Math.max(1, Math.ceil(total / perPage)),
      filterOptions,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

// Sort function
const sortItems = (products, sortBy, order) => products.sort((a, b) => {
  if (sortBy === "name")  return order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  if (sortBy === "price") return order === "asc" ? a.price - b.price : b.price - a.price;
  return 0;
});

export async function sortBy(request, response) {
  const { products, sortBy, order } = request.body;
  const sortedItems = sortItems([...products?.products], sortBy, order);
  return response.status(200).json({ error: false, success: true, products: sortedItems, totalPages: 0, page: 0 });
}

export async function searchProductController(request, response) {
  try {
    const {
      query, page, limit, brands, sizes, productTypes, priceRanges,
      saleOnly, stockStatus, discountRanges, weights, ramOptions, ratingBands, sortType,
    } = request.body;
    const requestedPage  = parseInt(page)  || 1;
    const requestedLimit = parseInt(limit) || 20;

    if (!query) {
      return response.status(400).json({ error: true, success: false, message: "Query is required" });
    }

    const applyAdvancedFilters = (items = []) => items.filter((item) => {
      if (brands?.length && !brands.includes(item?.brand)) return false;
      if (sizes?.length && !(item?.size || []).some(s => sizes.includes(s))) return false;
      if (productTypes?.length) {
        const t = item?.productType || item?.thirdsubCat || item?.subCat || item?.catName;
        if (!productTypes.includes(t)) return false;
      }
      if (priceRanges?.length) {
        const p = Number(item?.price || 0);
        const inRange = priceRanges.some(r => { const [mn,mx] = String(r).split("-").map(Number); return !isNaN(mn)&&!isNaN(mx)&&p>=mn&&p<=mx; });
        if (!inRange) return false;
      }
      if (saleOnly && Number(item?.discount || 0) <= 0) return false;
      if (stockStatus === "inStock"    && Number(item?.countInStock || 0) <= 0) return false;
      if (stockStatus === "outOfStock" && Number(item?.countInStock || 0) > 0)  return false;
      if (discountRanges?.length && !discountRanges.some(mn => Number(item?.discount||0) >= Number(mn||0))) return false;
      if (weights?.length    && !(item?.productWeight || []).some(w => weights.includes(w)))    return false;
      if (ramOptions?.length && !(item?.productRam    || []).some(r => ramOptions.includes(r))) return false;
      if (ratingBands?.length) {
        const r = Number(item?.rating || 0);
        const inBand = ratingBands.some(({ min, max }) => max === null ? r >= min : r >= min && r < max);
        if (!inBand) return false;
      }
      return true;
    });

    const sortFilteredItems = (items = []) => [...items].sort((a, b) => {
      if (sortType === "nameAsc")   return String(a?.name||"").localeCompare(String(b?.name||""));
      if (sortType === "nameDesc")  return String(b?.name||"").localeCompare(String(a?.name||""));
      if (sortType === "priceAsc")  return Number(a?.price||0) - Number(b?.price||0);
      if (sortType === "priceDesc") return Number(b?.price||0) - Number(a?.price||0);
      if (sortType === "latest")    return new Date(b?.createdAt||0).getTime() - new Date(a?.createdAt||0).getTime();
      if (sortType === "popular")   { const d = Number(b?.rating||0)-Number(a?.rating||0); if(d!==0) return d; return Number(b?.sale||0)-Number(a?.sale||0); }
      if (sortType === "featured")  { const d = Number(Boolean(b?.isFeatured))-Number(Boolean(a?.isFeatured)); if(d!==0) return d; }
      return Number(b?.sale||0) - Number(a?.sale||0);
    });

    const cleanQuery     = normalizeSearchText(query);
    const queryParts     = getMeaningfulSearchTokens(cleanQuery);
    const intentPhrases  = buildSearchIntentPhrases(cleanQuery);
    const fullQueryRegex = new RegExp(cleanQuery, "i");

    const intentPhraseMatchers = intentPhrases.map(phrase => {
      const r = new RegExp(phrase, "i");
      return { $or: [{ name:r },{ brand:r },{ description:r },{ keywords:r },{ catName:r },{ subCat:r },{ thirdsubCat:r }] };
    });
    const termBasedMatcher = queryParts.map(term => {
      const r = new RegExp(term, "i");
      return { $or: [{ name:r },{ brand:r },{ description:r },{ keywords:r },{ catName:r },{ subCat:r },{ thirdsubCat:r }] };
    });

    // ✅ FIX: fetch + filterOptions parallel mein
    const [products, filterOptions] = await Promise.all([
      ProductModel.find({
        $or: [
          { name: fullQueryRegex }, { brand: fullQueryRegex }, { description: fullQueryRegex },
          { keywords: fullQueryRegex }, { catName: fullQueryRegex }, { subCat: fullQueryRegex },
          { thirdsubCat: fullQueryRegex },
          ...intentPhraseMatchers,
          ...(termBasedMatcher.length ? [{ $and: termBasedMatcher }] : []),
        ],
      }).populate("category").lean().limit(250),
      _getFilterOptions(), // ✅ FIX: cached — 2 separate full-DB scans hata diye
    ]);

    const vocabulary      = buildSearchVocabulary(products);
    const correctedQuery  = getSpellCorrectedQuery(cleanQuery, vocabulary);
    const correctedTokens = getMeaningfulSearchTokens(correctedQuery || cleanQuery);

    let scoredProducts = products.map(item => {
      const data = [item?.name, item?.brand, item?.catName, item?.subCat, item?.thirdsubCat, item?.description, ...(item?.keywords||[])]
        .map(f => normalizeSearchText(f)).filter(Boolean);
      let score = 0;
      for (const term of correctedTokens) {
        if (data.some(f => f.includes(term) || term.includes(f))) { score += 8; continue; }
        if (data.some(f => f.split(" ").filter(Boolean).some(w => levenshteinDistance(term,w) <= (term.length>6?2:1)))) score += 4;
      }
      if (normalizeSearchText(item?.name).includes(cleanQuery) || intentPhrases.some(p => normalizeSearchText(item?.name).includes(p))) score += 10;
      return { item, score };
    }).filter(e => e.score > 0).sort((a,b) => b.score-a.score || (b.item.sale||0)-(a.item.sale||0)).map(e => e.item);

    if (!scoredProducts.length) {
      // Fuzzy fallback
      const fuzzyFallback = await ProductModel.find().populate("category").lean().limit(200);
      const fbVocab       = buildSearchVocabulary(fuzzyFallback);
      const fbCorrection  = correctedQuery || getSpellCorrectedQuery(cleanQuery, fbVocab);
      const fbTokens      = getMeaningfulSearchTokens(fbCorrection || cleanQuery);

      scoredProducts = fuzzyFallback.map(item => {
        const fields = [item?.name, ...(item?.keywords||[]), item?.brand].map(f => normalizeSearchText(f)).filter(Boolean);
        const dist = Math.min(...fields.map(f => Math.min(...f.split(" ").filter(Boolean).map(w => Math.min(...fbTokens.map(t => levenshteinDistance(t,w)))))));
        return { item, distance: dist };
      }).filter(e => e.distance <= 2).sort((a,b) => a.distance-b.distance).map(e => e.item);

      scoredProducts = sortFilteredItems(applyAdvancedFilters(scoredProducts));
      const total = scoredProducts.length;
      const paginatedProducts = scoredProducts.slice((requestedPage-1)*requestedLimit, requestedPage*requestedLimit);

      return response.status(200).json({
        error: false, success: true, products: paginatedProducts, total,
        page: requestedPage, totalPages: Math.max(1, Math.ceil(total/requestedLimit)),
        originalQuery: query, correctedQuery: fbCorrection,
        suggestions: buildSearchSuggestions(scoredProducts, query, fbCorrection),
        suggestionProducts: buildSuggestionProducts(scoredProducts),
        aiInsights: buildAiSearchInsights(paginatedProducts, fbCorrection),
        filterOptions,
      });
    }

    scoredProducts = sortFilteredItems(applyAdvancedFilters(scoredProducts));
    const total = scoredProducts.length;
    const paginatedProducts = scoredProducts.slice((requestedPage-1)*requestedLimit, requestedPage*requestedLimit);

    return response.status(200).json({
      error: false, success: true, products: paginatedProducts, total,
      page: requestedPage, totalPages: Math.max(1, Math.ceil(total/requestedLimit)),
      originalQuery: query, correctedQuery,
      suggestions: buildSearchSuggestions(scoredProducts, query, correctedQuery),
      suggestionProducts: buildSuggestionProducts(scoredProducts),
      aiInsights: buildAiSearchInsights(paginatedProducts, correctedQuery),
      filterOptions,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}
// ─── Seller Dashboard Stats ───────────────────────────────────────────────────
// GET /api/product/seller/dashboard-stats
// Requires auth middleware — request.userId must be the seller's _id
export async function getSellerDashboardStats(request, response) {
  try {
    const sellerIdRaw = request.userId;

    let sellerId;
    try {
      sellerId = new mongoose.Types.ObjectId(sellerIdRaw);
    } catch {
      return response.status(400).json({ error: true, success: false, message: "Invalid seller ID" });
    }

    // 1. Total products this seller has listed
    const totalProducts = await ProductModel.countDocuments({ seller: sellerId });

    // 2. Dynamically import OrderModel to avoid circular deps
    //    Adjust path to match your project's order model location
    let OrderModel;
    try {
      const mod = await import("../models/order.model.js");
      OrderModel = mod.default;
    } catch {
      // Fallback: try alternate common path
      try {
        const mod = await import("../models/orders.model.js");
        OrderModel = mod.default;
      } catch {
        // Order model not found — return products only
        return response.status(200).json({
          error: false,
          success: true,
          totalProducts,
          totalOrders: 0,
          confirmedOrders: 0,
          deliveredOrders: 0,
          pendingOrders: 0,
          shippedOrders: 0,
          cancelledOrders: 0,
          totalEarning: 0,
          pendingEarning: 0,
          _note: "Order model not found — only product count available",
        });
      }
    }

    // 3. Get all orders that contain at least one product from this seller
    //    Supports two common order schemas:
    //      a) order.products[].seller  (product-level seller ref)
    //      b) order.sellerId           (order-level seller ref)
    const [orderAgg] = await OrderModel.aggregate([
      {
        $match: {
          $or: [
            { "products.seller": sellerId },
            { sellerId: sellerId },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalOrders:     { $sum: 1 },
          confirmedOrders: { $sum: { $cond: [{ $eq: [{ $toLower: "$order_status" }, "confirmed"] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: [{ $toLower: "$order_status" }, "delivered"] }, 1, 0] } },
          pendingOrders:   { $sum: { $cond: [{ $eq: [{ $toLower: "$order_status" }, "pending"]   }, 1, 0] } },
          shippedOrders:   { $sum: { $cond: [{ $eq: [{ $toLower: "$order_status" }, "shipped"]   }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: [{ $toLower: "$order_status" }, "cancelled"] }, 1, 0] } },
          // Total earning = sum of totalAmt for delivered orders
          totalEarning:    {
            $sum: {
              $cond: [
                { $eq: [{ $toLower: "$order_status" }, "delivered"] },
                { $ifNull: ["$totalAmt", 0] },
                0,
              ],
            },
          },
          // Pending earning = sum of totalAmt for confirmed + shipped (not yet delivered)
          pendingEarning: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: "$order_status" }, ["confirmed", "shipped"]] },
                { $ifNull: ["$totalAmt", 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    return response.status(200).json({
      error: false,
      success: true,
      totalProducts,
      totalOrders:     orderAgg?.totalOrders     || 0,
      confirmedOrders: orderAgg?.confirmedOrders || 0,
      deliveredOrders: orderAgg?.deliveredOrders || 0,
      pendingOrders:   orderAgg?.pendingOrders   || 0,
      shippedOrders:   orderAgg?.shippedOrders   || 0,
      cancelledOrders: orderAgg?.cancelledOrders || 0,
      totalEarning:    orderAgg?.totalEarning    || 0,
      pendingEarning:  orderAgg?.pendingEarning  || 0,
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/product/reviews/add  — Add a new review
export async function addReview(request, response) {
  try {
    const { image, userName, review, rating, productId } = request.body;
    const userId = request.userId; // auth middleware se aayega

    if (!review || !review.trim()) {
      return response.status(400).json({ error: true, message: "Review text is required" });
    }
    if (!productId) {
      return response.status(400).json({ error: true, message: "productId is required" });
    }
    if (!userId) {
      return response.status(400).json({ error: true, message: "userId is required" });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return response.status(400).json({ error: true, message: "Rating must be 1–5" });
    }

    // One review per user per product
    const existing = await ReviewModel.findOne({ userId, productId });
    if (existing) {
      return response.status(409).json({ error: true, message: "You have already reviewed this product" });
    }

    const newReview = await ReviewModel.create({
      image:     image     || "",
      userName:  userName  || "Anonymous",
      review:    review.trim(),
      rating:    String(ratingNum),
      userId,
      productId,
    });

    // Update product's average rating
    const allReviews = await ReviewModel.find({ productId });
    const avgRating  = allReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / allReviews.length;
    await ProductModel.findByIdAndUpdate(productId, { rating: parseFloat(avgRating.toFixed(1)) });
    _cacheDel(productId); // ✅ rating changed — cache clear

    return response.status(201).json({
      error:   false,
      success: true,
      message: "Review added successfully",
      review:  newReview,
    });
  } catch (error) {
    return response.status(500).json({ error: true, message: error.message || error });
  }
}

// GET /api/product/reviews/:productId  — Get paginated reviews for a product
// ── GET PRODUCT REVIEWS — OPTIMIZED ─────────────────────────────────────────
// FIX: Pehle 2 alag DB queries thi (paginated + full stats ke liye).
// Ab ek hi Promise.all mein — paginated reviews + aggregation stats ek saath.
export async function getProductReviews(request, response) {
  try {
    const { productId } = request.params;
    const page  = Math.max(1, parseInt(request.query.page)  || 1);
    const limit = Math.min(20, parseInt(request.query.limit) || 5);
    const sort  = request.query.sort || "NEWEST";

    if (!productId) {
      return response.status(400).json({ error: true, message: "productId is required" });
    }

    const sortMap = { NEWEST: { createdAt:-1 }, OLDEST: { createdAt:1 }, HIGHEST: { rating:-1 }, LOWEST: { rating:1 } };
    const sortObj = sortMap[sort] || sortMap.NEWEST;

    const matchId = mongoose.Types.ObjectId.isValid(productId)
      ? new mongoose.Types.ObjectId(productId) : productId;

    // ✅ FIX: 3 kaam ek saath — countDocuments + paginated find + stats aggregation
    const [total, reviews, statsAgg] = await Promise.all([
      ReviewModel.countDocuments({ productId }),
      ReviewModel.find({ productId }).sort(sortObj).skip((page-1)*limit).limit(limit).lean(),
      ReviewModel.aggregate([
        { $match: { productId: matchId } },
        { $group: {
          _id: null, sum: { $sum: { $toDouble: "$rating" } }, count: { $sum: 1 },
          s1: { $sum: { $cond: [{ $eq: [{ $round:[{$toDouble:"$rating"}] },1] },1,0] } },
          s2: { $sum: { $cond: [{ $eq: [{ $round:[{$toDouble:"$rating"}] },2] },1,0] } },
          s3: { $sum: { $cond: [{ $eq: [{ $round:[{$toDouble:"$rating"}] },3] },1,0] } },
          s4: { $sum: { $cond: [{ $eq: [{ $round:[{$toDouble:"$rating"}] },4] },1,0] } },
          s5: { $sum: { $cond: [{ $eq: [{ $round:[{$toDouble:"$rating"}] },5] },1,0] } },
        }},
      ]),
    ]);

    const s = statsAgg[0] || { sum:0, count:0, s1:0, s2:0, s3:0, s4:0, s5:0 };
    const avgRating  = s.count > 0 ? (s.sum / s.count).toFixed(1) : "0.0";
    const breakdown  = { "1": s.s1, "2": s.s2, "3": s.s3, "4": s.s4, "5": s.s5 };

    return response.status(200).json({
      error: false, success: true, reviews, total, avgRating, breakdown,
      page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total,
    });
  } catch (error) {
    return response.status(500).json({ error: true, message: error.message || error });
  }
}

// DELETE /api/product/reviews/:id  — Delete a review (admin only)
export async function deleteReview(request, response) {
  try {
    const deleted = await ReviewModel.findByIdAndDelete(request.params.id);
    if (!deleted) {
      return response.status(404).json({ error: true, message: "Review not found" });
    }

    // Recalculate product rating after deletion
    const allReviews = await ReviewModel.find({ productId: deleted.productId });
    const avgRating  = allReviews.length
      ? allReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / allReviews.length
      : 0;
    await ProductModel.findByIdAndUpdate(deleted.productId, {
      rating: parseFloat(avgRating.toFixed(1)),
    });

    _cacheDel(String(deleted.productId)); // ✅ rating changed — cache clear
    return response.status(200).json({ error: false, success: true, message: "Review deleted" });
  } catch (error) {
    return response.status(500).json({ error: true, message: error.message || error });
  }
}