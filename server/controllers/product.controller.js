import ProductModel from "../models/product.modal.js";
import ProductRAMSModel from "../models/productRAMS.js";
import ProductWEIGHTModel from "../models/productWEIGHT.js";
import ProductSIZEModel from "../models/productSIZE.js";

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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

    // ✅ Fix: poore collection ka count, filtered products ka nahi
    const total = await ProductModel.countDocuments();

    const products = await ProductModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!products) {
      return response.status(400).json({ error: true, success: false });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
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
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

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
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

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
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

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
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

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
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

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
      .exec();

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
        .exec();
    }

    if (request.query.subCatId !== undefined) {
      products = await ProductModel.find({
        rating: request.query.rating,
        subCatId: request.query.subCatId,
      })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();
    }

    if (request.query.thirdsubCatId !== undefined) {
      products = await ProductModel.find({
        rating: request.query.rating,
        thirdsubCatId: request.query.thirdsubCatId,
      })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();
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
  const product = await ProductModel.findById(request.params.id).populate(
    "category",
  );

  if (!product) {
    return response.status(404).json({
      message: "Product Not found",
      error: true,
      success: false,
    });
  }

  const images = product.images;

  let img = "";
  for (img of images) {
    const imgUrl = img;
    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];

    if (imageName) {
      cloudinary.uploader.destroy(imageName, (error, result) => {
        // console.log(error, result);
      });
    }
  }

  const deletedProduct = await ProductModel.findByIdAndDelete(
    request.params.id,
  );

  if (!deletedProduct) {
    response.status(404).json({
      message: "Product not deleted!",
      success: false,
      error: true,
    });
  }

  return response.status(200).json({
    success: true,
    error: false,
    message: "Product Deleted!",
  });
}

//delete multiple products
export async function deleteMultipleProduct(request, response) {
  const { ids } = request.body;

  if (!ids || !Array.isArray(ids)) {
    return response
      .status(400)
      .json({ error: true, success: false, message: "Invalid input" });
  }

  for (let i = 0; i < ids?.length; i++) {
    const product = await ProductModel.findById(ids[i]);

    const images = product.images;

    let img = "";
    for (img of images) {
      const imgUrl = img;
      const urlArr = imgUrl.split("/");
      const image = urlArr[urlArr.length - 1];

      const imageName = image.split(".")[0];

      if (imageName) {
        cloudinary.uploader.destroy(imageName, (error, result) => {
          // console.log(error, result);
        });
      }
    }
  }

  try {
    await ProductModel.deleteMany({ _id: { $in: ids } });
    return response.status(200).json({
      message: "Product delete successfully",
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

//get single product
export async function getProduct(request, response) {
  try {
    const product = await ProductModel.findById(request.params.id).populate(
      "category",
    );

    if (!product) {
      return response.status(404).json({
        message: "The product is not found",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
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

//delete images
export async function removeImageFromCloudinary(request, response) {
  const imgUrl = request.query.img;

  const urlArr = imgUrl.split("/");
  const image = urlArr[urlArr.length - 1];

  const imageName = image.split(".")[0];

  if (imageName) {
    const res = await cloudinary.uploader.destroy(
      imageName,
      (error, result) => {
        // console.log(error, res)
      },
    );

    if (res) {
      response.status(200).send(res);
    }
  }
}

//updated product
export async function updateProduct(request, response) {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
        subCat: request.body.subCat,
        description: request.body.description,
        bannerimages: request.body.bannerimages,
        bannerTitleName: request.body.bannerTitleName,
        isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
        images: request.body.images,
        bannerTitleName: request.body.bannerTitleName,
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
        productRam: request.body.productRam,
        size: request.body.size,
        productWeight: request.body.productWeight,
        sale: request.body.sale || 0,
        colorOptions: request.body.colorOptions || [],
        specifications: request.body.specifications || [],
      },
      { new: true },
    );

    if (!product) {
      return response.status(404).json({
        message: "the product can not be updated!",
        status: false,
      });
    }

    imagesArr = [];

    return response.status(200).json({
      message: "The product is updated",
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
    catId,
    subCatId,
    thirdsubCatId,
    minPrice,
    maxPrice,
    rating,
    colors,
    page,
    limit,
    brands,
    sizes,
    productTypes,
    priceRanges,
    saleOnly,
    stockStatus,
    discountRanges,
    weights,
    ramOptions,
    sortType,
    query,
  } = request.body;

  const filters = {};

  if (catId?.length) {
    filters.catId = { $in: catId };
  }

  if (subCatId?.length) {
    filters.subCatId = { $in: subCatId };
  }

  if (thirdsubCatId?.length) {
    filters.thirdsubCatId = { $in: thirdsubCatId };
  }

  if (minPrice || maxPrice) {
    filters.price = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
  }

  if (rating?.length) {
    filters.rating = { $in: rating };
  }
  if (colors?.length) {
    filters["colorOptions.name"] = { $in: colors };
  }
  if (brands?.length) {
    filters.brand = { $in: brands };
  }

  if (sizes?.length) {
    filters.size = { $in: sizes };
  }

  const andConditions = [];

  if (productTypes?.length) {
    andConditions.push({
      $or: [
        { productType: { $in: productTypes } },
        { thirdsubCat: { $in: productTypes } },
        { subCat: { $in: productTypes } },
        { catName: { $in: productTypes } },
      ],
    });
  }

  if (query?.trim()) {
    const queryRegex = new RegExp(query.trim(), "i");
    andConditions.push({
      $or: [
        { name: queryRegex },
        { description: queryRegex },
        { brand: queryRegex },
        { catName: queryRegex },
        { subCat: queryRegex },
        { thirdsubCat: queryRegex },
      ],
    });
  }

  if (priceRanges?.length) {
    const rangeFilters = priceRanges
      .map((range) => {
        const [min, max] = String(range).split("-").map(Number);
        if (Number.isNaN(min) || Number.isNaN(max)) return null;
        return { price: { $gte: min, $lte: max } };
      })
      .filter(Boolean);

    if (rangeFilters.length) {
      andConditions.push({ $or: rangeFilters });
    }
  }

  if (andConditions.length) {
    filters.$and = [...(filters.$and || []), ...andConditions];
  }

  if (saleOnly) {
    filters.discount = { $gt: 0 };
  }

  if (stockStatus === "inStock") {
    filters.countInStock = { $gt: 0 };
  }

  if (stockStatus === "outOfStock") {
    filters.countInStock = { $lte: 0 };
  }

  if (discountRanges?.length) {
    const minDiscount = Math.min(...discountRanges.map(Number).filter(Boolean));
    if (Number.isFinite(minDiscount)) {
      filters.discount = { ...(filters.discount || {}), $gte: minDiscount };
    }
  }

  if (weights?.length) {
    filters.productWeight = { $in: weights };
  }

  if (ramOptions?.length) {
    filters.productRam = { $in: ramOptions };
  }

  const sortConfig = {
    bestSeller: { sale: -1, rating: -1, createdAt: -1, _id: -1 },
    latest: { createdAt: -1, _id: -1 },
    popular: { rating: -1, sale: -1, _id: -1 },
    featured: { isFeatured: -1, sale: -1, _id: -1 },
    priceAsc: { price: 1, _id: 1 },
    priceDesc: { price: -1, _id: -1 },
    nameAsc: { name: 1, _id: 1 },
    nameDesc: { name: -1, _id: -1 },
  };
  try {
    const currentPage = Math.max(1, parseInt(page) || 1);
    const perPage = Math.max(1, parseInt(limit) || 20);
    const products = await ProductModel.find(filters)
      .populate("category")
      .sort(sortConfig[sortType] || sortConfig.bestSeller)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    const total = await ProductModel.countDocuments(filters);

    const filterOptionsProducts = await ProductModel.find({})
      .select("brand size productType thirdsubCat subCat catName productWeight productRam colorOptions.name")
      .lean();


    const filterOptions = {
      brands: [...new Set(filterOptionsProducts.map((item) => item?.brand?.trim()).filter(Boolean))],
      sizes: [...new Set(filterOptionsProducts.flatMap((item) => item?.size || []).filter(Boolean))],
      productTypes: [...new Set(filterOptionsProducts
        .map((item) => item?.productType || item?.thirdsubCat || item?.subCat || item?.catName)
        .filter(Boolean))],
      weights: [...new Set(filterOptionsProducts.flatMap((item) => item?.productWeight || []).filter(Boolean))],
      ramOptions: [...new Set(filterOptionsProducts.flatMap((item) => item?.productRam || []).filter(Boolean))],
      colors: [...new Set(filterOptionsProducts.flatMap((item) => (item?.colorOptions || []).map((colorItem) => colorItem?.name)).filter(Boolean))],
    };

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      total: total,
      page: currentPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      filterOptions,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Sort function
const sortItems = (products, sortBy, order) => {
  return products.sort((a, b) => {
    if (sortBy === "name") {
      return order === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortBy === "price") {
      return order === "asc" ? a.price - b.price : b.price - a.price;
    }
    return 0; // Default
  });
};

export async function sortBy(request, response) {
  const { products, sortBy, order } = request.body;
  const sortedItems = sortItems([...products?.products], sortBy, order);
  return response.status(200).json({
    error: false,
    success: true,
    products: sortedItems,
    totalPages: 0,
    page: 0,
  });
}

export async function searchProductController(request, response) {
  try {
    const {
      query,
      page,
      limit,
      brands,
      sizes,
      productTypes,
      priceRanges,
      saleOnly,
      stockStatus,
      discountRanges,
      weights,
      ramOptions,
      ratingBands,
      sortType,
    } = request.body;
    const requestedPage = parseInt(page) || 1;
    const requestedLimit = parseInt(limit) || 20;

    if (!query) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "Query is required",
      });
    }
    const applyAdvancedFilters = (items = []) => {
      return items.filter((item) => {
        if (brands?.length && !brands.includes(item?.brand)) return false;
        if (
          sizes?.length &&
          !(item?.size || []).some((size) => sizes.includes(size))
        )
          return false;

        if (productTypes?.length) {
          const itemType =
            item?.productType ||
            item?.thirdsubCat ||
            item?.subCat ||
            item?.catName;
          if (!productTypes.includes(itemType)) return false;
        }

        if (priceRanges?.length) {
          const itemPrice = Number(item?.price || 0);
          const inRange = priceRanges.some((range) => {
            const [min, max] = String(range).split("-").map(Number);
            return (
              !Number.isNaN(min) &&
              !Number.isNaN(max) &&
              itemPrice >= min &&
              itemPrice <= max
            );
          });
          if (!inRange) return false;
        }

        if (saleOnly && Number(item?.discount || 0) <= 0) return false;
        if (stockStatus === "inStock" && Number(item?.countInStock || 0) <= 0)
          return false;
        if (stockStatus === "outOfStock" && Number(item?.countInStock || 0) > 0)
          return false;

        if (discountRanges?.length) {
          const discount = Number(item?.discount || 0);
          if (!discountRanges.some((min) => discount >= Number(min || 0)))
            return false;
        }

        if (
          weights?.length &&
          !(item?.productWeight || []).some((w) => weights.includes(w))
        )
          return false;
        if (
          ramOptions?.length &&
          !(item?.productRam || []).some((ram) => ramOptions.includes(ram))
        )
          return false;

        if (ratingBands?.length) {
          const rating = Number(item?.rating || 0);
          const inBand = ratingBands.some(({ min, max }) =>
            max === null ? rating >= min : rating >= min && rating < max,
          );
          if (!inBand) return false;
        }

        return true;
      });
    };

    const sortFilteredItems = (items = []) => {
      return [...items].sort((a, b) => {
        if (sortType === "nameAsc") {
          return String(a?.name || "").localeCompare(String(b?.name || ""));
        }

        if (sortType === "nameDesc") {
          return String(b?.name || "").localeCompare(String(a?.name || ""));
        }

        if (sortType === "priceAsc") {
          return Number(a?.price || 0) - Number(b?.price || 0);
        }

        if (sortType === "priceDesc") {
          return Number(b?.price || 0) - Number(a?.price || 0);
        }

        if (sortType === "latest") {
          return (
            new Date(b?.createdAt || b?.updatedAt || 0).getTime() -
            new Date(a?.createdAt || a?.updatedAt || 0).getTime()
          );
        }

        if (sortType === "popular") {
          const ratingDiff = Number(b?.rating || 0) - Number(a?.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return Number(b?.sale || 0) - Number(a?.sale || 0);
        }

        if (sortType === "featured") {
          const featuredDiff =
            Number(Boolean(b?.isFeatured)) - Number(Boolean(a?.isFeatured));
          if (featuredDiff !== 0) return featuredDiff;
        }

        return Number(b?.sale || 0) - Number(a?.sale || 0);
      });
    };

    const cleanQuery = normalizeSearchText(query);
    const queryParts = getMeaningfulSearchTokens(cleanQuery);
    const intentPhrases = buildSearchIntentPhrases(cleanQuery);

    const fullQueryRegex = new RegExp(cleanQuery, "i");
    const intentPhraseMatchers = intentPhrases.map((phrase) => {
      const phraseRegex = new RegExp(phrase, "i");
      return {
        $or: [
          { name: phraseRegex },
          { brand: phraseRegex },
          { description: phraseRegex },
          { keywords: phraseRegex },
          { catName: phraseRegex },
          { subCat: phraseRegex },
          { thirdsubCat: phraseRegex },
        ],
      };
    });

    const termBasedMatcher = queryParts.map((term) => {
      const termRegex = new RegExp(term, "i");
      return {
        $or: [
          { name: termRegex },
          { brand: termRegex },
          { description: termRegex },
          { keywords: termRegex },
          { catName: termRegex },
          { subCat: termRegex },
          { thirdsubCat: termRegex },
        ],
      };
    });

    const products = await ProductModel.find({
      $or: [
        { name: fullQueryRegex },
        { brand: fullQueryRegex },
        { description: fullQueryRegex },
        { keywords: fullQueryRegex },
        { catName: fullQueryRegex },
        { subCat: fullQueryRegex },
        { thirdsubCat: fullQueryRegex },
        ...intentPhraseMatchers,
        ...(termBasedMatcher.length ? [{ $and: termBasedMatcher }] : []),
      ],
    })
      .populate("category")
      .limit(250);

    const vocabulary = buildSearchVocabulary(products);
    const correctedQuery = getSpellCorrectedQuery(cleanQuery, vocabulary);
    const correctedTokens = getMeaningfulSearchTokens(
      correctedQuery || cleanQuery,
    );

    let scoredProducts = products
      .map((item) => {
        const data = [
          item?.name,
          item?.brand,
          item?.catName,
          item?.subCat,
          item?.thirdsubCat,
          item?.description,
          ...(item?.keywords || []),
        ]
          .map((field) => normalizeSearchText(field))
          .filter(Boolean);

        let score = 0;

        for (const term of correctedTokens) {
          const hasContainMatch = data.some(
            (field) => field.includes(term) || term.includes(field),
          );

          if (hasContainMatch) {
            score += 8;
            continue;
          }

          const hasFuzzyMatch = data.some((field) => {
            const words = field.split(" ").filter(Boolean);
            return words.some((word) => {
              if (!word) return false;
              const distance = levenshteinDistance(term, word);
              const allowedDistance = term.length > 6 ? 2 : 1;
              return distance <= allowedDistance;
            });
          });

          if (hasFuzzyMatch) {
            score += 4;
          }
        }

        if (
          normalizeSearchText(item?.name).includes(cleanQuery) ||
          intentPhrases.some((phrase) =>
            normalizeSearchText(item?.name).includes(phrase),
          )
        ) {
          score += 10;
        }

        return { item, score };
      })
      .filter((item) => item.score > 0)
      .sort(
        (a, b) => b.score - a.score || (b.item.sale || 0) - (a.item.sale || 0),
      )
      .map((entry) => entry.item);

    if (!scoredProducts.length) {
      const fuzzyFallback = await ProductModel.find()
        .populate("category")
        .limit(200);

      const fallbackVocabulary = buildSearchVocabulary(fuzzyFallback);
      const fallbackCorrection =
        correctedQuery ||
        getSpellCorrectedQuery(cleanQuery, fallbackVocabulary);
      const fallbackTokens = getMeaningfulSearchTokens(
        fallbackCorrection || cleanQuery,
      );
      scoredProducts = fuzzyFallback
        .map((item) => {
          const fields = [item?.name, ...(item?.keywords || []), item?.brand]
            .map((field) => normalizeSearchText(field))
            .filter(Boolean);

          const closestDistance = Math.min(
            ...fields.map((field) => {
              const words = field.split(" ").filter(Boolean);
              return Math.min(
                ...fallbackTokens.map((token) =>
                  Math.min(
                    ...words.map((word) => levenshteinDistance(token, word)),
                  ),
                ),
              );
            }),
          );

          return { item, distance: closestDistance };
        })
        .filter((item) => item.distance <= 2)
        .sort((a, b) => a.distance - b.distance)
        .map((entry) => entry.item);
      scoredProducts = sortFilteredItems(applyAdvancedFilters(scoredProducts));

      const total = scoredProducts.length;
      const start = (requestedPage - 1) * requestedLimit;
      const paginatedProducts = scoredProducts.slice(start, start + requestedLimit);

      // ✅ Fix: poore DB se filterOptions
      const allProductsForOptions = await ProductModel.find({})
        .select("brand size productType thirdsubCat subCat catName productWeight productRam colorOptions.name")
        .lean();

      const filterOptions = {
        brands: [...new Set(allProductsForOptions.map((item) => item?.brand?.trim()).filter(Boolean))],
        sizes: [...new Set(allProductsForOptions.flatMap((item) => item?.size || []).filter(Boolean))],
        productTypes: [...new Set(allProductsForOptions.map((item) => item?.productType || item?.thirdsubCat || item?.subCat || item?.catName).filter(Boolean))],
        weights: [...new Set(allProductsForOptions.flatMap((item) => item?.productWeight || []).filter(Boolean))],
        ramOptions: [...new Set(allProductsForOptions.flatMap((item) => item?.productRam || []).filter(Boolean))],
        colors: [...new Set(allProductsForOptions.flatMap((item) => (item?.colorOptions || []).map((c) => c?.name)).filter(Boolean))],
      };

      return response.status(200).json({
        error: false,
        success: true,
        products: paginatedProducts,
        total,
        page: requestedPage,
        totalPages: Math.max(1, Math.ceil(total / requestedLimit)),
        originalQuery: query,
        correctedQuery: fallbackCorrection,
        suggestions: buildSearchSuggestions(scoredProducts, query, fallbackCorrection),
        suggestionProducts: buildSuggestionProducts(scoredProducts),
        aiInsights: buildAiSearchInsights(paginatedProducts, fallbackCorrection),
        filterOptions,
      });
    }

    scoredProducts = sortFilteredItems(applyAdvancedFilters(scoredProducts));
    const total = scoredProducts.length;
    const start = (requestedPage - 1) * requestedLimit;
    const paginatedProducts = scoredProducts.slice(
      start,
      start + requestedLimit,
    );

    // ✅ Fix: filterOptions poore DB se fetch karo — scored/filtered products se nahi
    // Isse filter apply hone ke baad bhi sidebar ke options stable rahenge
    const allProductsForOptions = await ProductModel.find({})
      .select("brand size productType thirdsubCat subCat catName productWeight productRam colorOptions.name")
      .lean();

    const filterOptions = {
      brands: [...new Set(allProductsForOptions.map((item) => item?.brand?.trim()).filter(Boolean))],
      sizes: [...new Set(allProductsForOptions.flatMap((item) => item?.size || []).filter(Boolean))],
      productTypes: [...new Set(allProductsForOptions.map((item) => item?.productType || item?.thirdsubCat || item?.subCat || item?.catName).filter(Boolean))],
      weights: [...new Set(allProductsForOptions.flatMap((item) => item?.productWeight || []).filter(Boolean))],
      ramOptions: [...new Set(allProductsForOptions.flatMap((item) => item?.productRam || []).filter(Boolean))],
      colors: [...new Set(allProductsForOptions.flatMap((item) => (item?.colorOptions || []).map((c) => c?.name)).filter(Boolean))],
    };

    return response.status(200).json({
      error: false,
      success: true,
      products: paginatedProducts,
      total,
      page: requestedPage,
      totalPages: Math.max(1, Math.ceil(total / requestedLimit)),
      originalQuery: query,
      correctedQuery,
      suggestions: buildSearchSuggestions(scoredProducts, query, correctedQuery),
      suggestionProducts: buildSuggestionProducts(scoredProducts),
      aiInsights: buildAiSearchInsights(paginatedProducts, correctedQuery),
      filterOptions,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}