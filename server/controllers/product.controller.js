import ProductModel from "../models/product.modal.js";
import ProductRAMSModel from "../models/productRAMS.js";
import ProductWEIGHTModel from "../models/productWEIGHT.js";
import ProductSIZEModel from "../models/productSIZE.js";

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { request } from "http";

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
  normalizeSearchText(value)
    .split(" ")
    .filter(Boolean);

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
    const { page, limit } = request.query;
    const totalProducts = await ProductModel.find();

    const products = await ProductModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ProductModel.countDocuments(products);

    if (!products) {
      return response.status(400).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCount: totalProducts?.length,
      totalProducts: totalProducts,
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
      catId: request.params.id,
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
      subCatId: request.params.id,
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

//get all products by sub category id
export async function getAllProductsByThirdLavelCatId(request, response) {
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
      thirdsubCatId: request.params.id,
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
  try {
    const products = await ProductModel.find(filters)
      .populate("category")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ProductModel.countDocuments(filters);

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
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
    const { query, page, limit } = request.body;
    const requestedPage = parseInt(page) || 1;
    const requestedLimit = parseInt(limit) || 20;

    if (!query) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "Query is required",
      });
    }

    const cleanQuery = normalizeSearchText(query);
    const queryParts = cleanQuery.split(" ").filter(Boolean);

    const products = await ProductModel.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { keywords: { $in: queryParts.map((item) => new RegExp(item, "i")) } },
        { catName: { $regex: query, $options: "i" } },
        { subCat: { $regex: query, $options: "i" } },
        { thirdsubCat: { $regex: query, $options: "i" } },
      ],
    })
      .populate("category")
      .limit(250);

      const vocabulary = buildSearchVocabulary(products);
    const correctedQuery = getSpellCorrectedQuery(cleanQuery, vocabulary);

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

        for (const term of queryParts) {
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

        if (normalizeSearchText(item?.name).includes(cleanQuery)) {
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
        correctedQuery || getSpellCorrectedQuery(cleanQuery, fallbackVocabulary);
      scoredProducts = fuzzyFallback
        .map((item) => {
          const fields = [item?.name, ...(item?.keywords || []), item?.brand]
            .map((field) => normalizeSearchText(field))
            .filter(Boolean);

          const closestDistance = Math.min(
            ...fields.map((field) => {
              const words = field.split(" ").filter(Boolean);
              return Math.min(
                ...words.map((word) => levenshteinDistance(cleanQuery, word)),
              );
            }),
          );

          return { item, distance: closestDistance };
        })
        .filter((item) => item.distance <= 2)
        .sort((a, b) => a.distance - b.distance)
        .map((entry) => entry.item);
        const total = scoredProducts.length;
      const start = (requestedPage - 1) * requestedLimit;
      const paginatedProducts = scoredProducts.slice(
        start,
        start + requestedLimit,
      );

      return response.status(200).json({
        error: false,
        success: true,
        products: paginatedProducts,
        total,
        page: requestedPage,
        totalPages: Math.max(1, Math.ceil(total / requestedLimit)),
        originalQuery: query,
        correctedQuery: fallbackCorrection,
        aiInsights: buildAiSearchInsights(paginatedProducts, fallbackCorrection),
      });
    }

    const total = scoredProducts.length;
    const start = (requestedPage - 1) * requestedLimit;
    const paginatedProducts = scoredProducts.slice(
      start,
      start + requestedLimit,
    );

    return response.status(200).json({
      error: false,
      success: true,
      products: paginatedProducts,
      total,
      page: requestedPage,
      totalPages: Math.max(1, Math.ceil(total / requestedLimit)),
      originalQuery: query,
      correctedQuery,
      aiInsights: buildAiSearchInsights(paginatedProducts, correctedQuery),
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
