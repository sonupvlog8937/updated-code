import { Router } from 'express';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import {
  createProduct,
  createProductRAMS, addReview, getProductReviews, deleteReview,
  deleteMultipleProduct, deleteProduct, deleteProductRAMS,
  getAllFeaturedProducts, getAllProducts, getAllProductsByCatId,
  getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating,
  getAllProductsBySubCatId, getAllProductsBySubCatName,
  getAllProductsByThirdLavelCatId, getProduct, getProductRams,
  getProductsCount, updateProduct, updateProductRam, uploadImages,
  getProductRamsById, createProductWEIGHT, deleteProductWEIGHT,
  updateProductWeight, getProductWeight, getProductWeightById,
  createProductSize, deleteProductSize, updateProductSize,
  getProductSize, getProductSizeById, uploadBannerImages,
  getAllProductsBanners, filters, sortBy, searchProductController,
  productSearchSuggestions,
  getSellerProducts, getProductsBySellerPublic, getSellerDashboardStats,
} from '../controllers/product.controller.js';
import {
  patchGroceryStock,
  patchRestaurantAvailability,
} from '../controllers/quickCommerceSeller.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';

const productRouter = Router();

// All seller roles that can manage products
const ALL_SELLER_ROLES = [
  'ADMIN', 'SELLER', 'GROCERY_SELLER', 'RESTAURANT_SELLER',
  'FASHION_SELLER', 'ELECTRONICS_SELLER', 'MEDICAL_SELLER', 'BEAUTY_SELLER',
  'HOME_KITCHEN_SELLER', 'GIFTS_TOYS_SELLER', 'BOOKS_STATIONERY_SELLER',
  'JEWELLERY_SELLER', 'HARDWARE_SELLER', 'AUTOMOBILE_SELLER'
];

// All GoMarket shop sellers (use grocery-style stock management)
const GO_MARKET_SHOP_SELLERS = [
  'GROCERY_SELLER', 'FASHION_SELLER', 'ELECTRONICS_SELLER', 'MEDICAL_SELLER',
  'BEAUTY_SELLER', 'HOME_KITCHEN_SELLER', 'GIFTS_TOYS_SELLER',
  'BOOKS_STATIONERY_SELLER', 'JEWELLERY_SELLER', 'HARDWARE_SELLER', 'AUTOMOBILE_SELLER'
];

// All seller roles (for endpoints that work with any seller type)
const ANY_SELLER_ROLES = [
  'SELLER', 'GROCERY_SELLER', 'RESTAURANT_SELLER',
  'FASHION_SELLER', 'ELECTRONICS_SELLER', 'MEDICAL_SELLER', 'BEAUTY_SELLER',
  'HOME_KITCHEN_SELLER', 'GIFTS_TOYS_SELLER', 'BOOKS_STATIONERY_SELLER',
  'JEWELLERY_SELLER', 'HARDWARE_SELLER', 'AUTOMOBILE_SELLER'
];

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────
productRouter.post('/uploadImages',       auth, authorizeRole(...ALL_SELLER_ROLES), upload.array('images'),      uploadImages);
productRouter.post('/uploadBannerImages', auth, authorizeRole(...ALL_SELLER_ROLES), upload.array('bannerimages'), uploadBannerImages);

// ─── PRODUCT CRUD ─────────────────────────────────────────────────────────────
productRouter.post('/create',               auth, authorizeRole(...ALL_SELLER_ROLES), createProduct);
productRouter.put('/updateProduct/:id',     auth, authorizeRole(...ALL_SELLER_ROLES), updateProduct);
productRouter.delete('/deleteMultiple',     deleteMultipleProduct);

// ─── LISTING ROUTES (ALL STATIC PATHS BEFORE /:id) ───────────────────────────
// ⚠️  CRITICAL: Static paths MUST come before /:id
//    Express matches routes top-to-bottom. If /:id is declared first,
//    it will catch requests like /getAllProducts, /seller/products etc.
productRouter.get('/getAllProducts',                    getAllProducts);
productRouter.get('/getAllProductsBanners',             getAllProductsBanners);
productRouter.get('/getAllProductsByCatId/:id',         getAllProductsByCatId);
productRouter.get('/getAllProductsByCatName',           getAllProductsByCatName);
productRouter.get('/getAllProductsBySubCatId/:id',      getAllProductsBySubCatId);
productRouter.get('/getAllProductsBySubCatName',        getAllProductsBySubCatName);
productRouter.get('/getAllProductsByThirdLavelCat/:id', getAllProductsByThirdLavelCatId);
productRouter.get('/getAllProductsByThirdLavelCatName', getAllProductsBySubCatName);
productRouter.get('/getAllProductsByPrice',             getAllProductsByPrice);
productRouter.get('/getAllProductsByRating',            getAllProductsByRating);
productRouter.get('/getAllProductsCount',               getProductsCount);
productRouter.get('/getAllFeaturedProducts',            getAllFeaturedProducts);

// ─── SELLER ROUTES (static — must be above /:id) ─────────────────────────────
productRouter.get('/seller/products',        auth, authorizeRole(...ANY_SELLER_ROLES), getSellerProducts);
productRouter.get('/seller/dashboard-stats', auth, authorizeRole(...ANY_SELLER_ROLES), getSellerDashboardStats);
productRouter.patch('/seller/grocery-stock/:id', auth, authorizeRole(...GO_MARKET_SHOP_SELLERS), patchGroceryStock);
productRouter.patch('/seller/item-availability/:id', auth, authorizeRole('RESTAURANT_SELLER'), patchRestaurantAvailability);
productRouter.get('/store/:sellerId',        getProductsBySellerPublic);

// ─── REVIEW ROUTES ────────────────────────────────────────────────────────────
productRouter.post('/reviews/add',       auth,                        addReview);
productRouter.get('/reviews/:productId',                              getProductReviews);
productRouter.delete('/reviews/:id',     auth, authorizeRole('ADMIN'), deleteReview);

// ─── FILTER / SORT / SEARCH ───────────────────────────────────────────────────
productRouter.post('/filters',    filters);
productRouter.post('/sortBy',     sortBy);
productRouter.post('/search/get', searchProductController);
productRouter.get('/search/suggestions', productSearchSuggestions);

// ─── PRODUCT RAM ──────────────────────────────────────────────────────────────
productRouter.post('/productRAMS/create', auth, authorizeRole(...ALL_SELLER_ROLES), createProductRAMS);
productRouter.get('/productRAMS/get',     getProductRams);          // ← /get BEFORE /:id
productRouter.get('/productRAMS/:id',     getProductRamsById);
productRouter.put('/productRAMS/:id',     auth, authorizeRole(...ALL_SELLER_ROLES), updateProductRam);
productRouter.delete('/productRAMS/:id',  auth, authorizeRole(...ALL_SELLER_ROLES), deleteProductRAMS);

// ─── PRODUCT WEIGHT ───────────────────────────────────────────────────────────
productRouter.post('/productWeight/create', auth, authorizeRole(...ALL_SELLER_ROLES), createProductWEIGHT);
productRouter.get('/productWeight/get',     getProductWeight);      // ← /get BEFORE /:id
productRouter.get('/productWeight/:id',     getProductWeightById);
productRouter.put('/productWeight/:id',     auth, authorizeRole(...ALL_SELLER_ROLES), updateProductWeight);
productRouter.delete('/productWeight/:id',  auth, authorizeRole(...ALL_SELLER_ROLES), deleteProductWEIGHT);

// ─── PRODUCT SIZE ─────────────────────────────────────────────────────────────
productRouter.post('/productSize/create', auth, authorizeRole(...ALL_SELLER_ROLES), createProductSize);
productRouter.get('/productSize/get',     getProductSize);          // ← /get BEFORE /:id
productRouter.get('/productSize/:id',     getProductSizeById);
productRouter.put('/productSize/:id',     auth, authorizeRole(...ALL_SELLER_ROLES), updateProductSize);
productRouter.delete('/productSize/:id',  auth, authorizeRole(...ALL_SELLER_ROLES), deleteProductSize);

// ─── IMAGE DELETE ─────────────────────────────────────────────────────────────
productRouter.delete('/deteleImage', auth, removeImageFromCloudinary);

// ─── SINGLE PRODUCT — /:id MUST BE LAST ──────────────────────────────────────
// ⚠️  Isse HAMESHA sabse neeche rakho. Agar upar rakha to ye saari
//    /getAllProducts, /seller/products jaisi routes ko bhi match kar leta hai
//    aur wrong handler call hota hai — product page slow/broken ho jaata hai.
productRouter.delete('/:id', auth, authorizeRole(...ALL_SELLER_ROLES), deleteProduct);
productRouter.get('/:id',    getProduct);   // ← LAST

export default productRouter;