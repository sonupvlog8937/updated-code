import { Router } from 'express'
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import {createProduct, createProductRAMS, addReview, getProductReviews, deleteReview, deleteMultipleProduct, deleteProduct, deleteProductRAMS, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getAllProductsByThirdLavelCatId, getProduct, getProductRams, getProductsCount, updateProduct, updateProductRam, uploadImages, getProductRamsById, createProductWEIGHT, deleteProductWEIGHT, updateProductWeight, getProductWeight, getProductWeightById, createProductSize, deleteProductSize, updateProductSize, getProductSize, getProductSizeById, uploadBannerImages, getAllProductsBanners, filters, sortBy, searchProductController, getSellerProducts, getProductsBySellerPublic, getSellerDashboardStats} from '../controllers/product.controller.js';
import {removeImageFromCloudinary} from '../controllers/category.controller.js';

const productRouter = Router();

productRouter.post('/uploadImages',auth,authorizeRole('ADMIN', 'SELLER'),upload.array('images'),uploadImages);
productRouter.post('/uploadBannerImages',auth,authorizeRole('ADMIN', 'SELLER'),upload.array('bannerimages'),uploadBannerImages);
productRouter.post('/create',auth,authorizeRole('ADMIN', 'SELLER'),createProduct);
productRouter.get('/getAllProducts',getAllProducts);
productRouter.get('/getAllProductsBanners',getAllProductsBanners);
productRouter.get('/getAllProductsByCatId/:id',getAllProductsByCatId);
productRouter.get('/getAllProductsByCatName',getAllProductsByCatName);
productRouter.get('/getAllProductsBySubCatId/:id',getAllProductsBySubCatId);
productRouter.get('/getAllProductsBySubCatName',getAllProductsBySubCatName);
productRouter.get('/getAllProductsByThirdLavelCat/:id',getAllProductsByThirdLavelCatId);
productRouter.get('/getAllProductsByThirdLavelCatName',getAllProductsBySubCatName);
productRouter.get('/getAllProductsByPrice',getAllProductsByPrice);
productRouter.get('/getAllProductsByRating',getAllProductsByRating);
productRouter.get('/getAllProductsCount',getProductsCount);
productRouter.get('/getAllFeaturedProducts',getAllFeaturedProducts);
productRouter.delete('/deleteMultiple',deleteMultipleProduct);

productRouter.post("/reviews/add", auth, addReview);
productRouter.get("/reviews/:productId", getProductReviews);
productRouter.delete("/reviews/:id", auth, authorizeRole("ADMIN"), deleteReview);
productRouter.delete('/:id',auth,authorizeRole('ADMIN', 'SELLER'),deleteProduct);
productRouter.get('/:id',getProduct);

productRouter.delete('/deteleImage',auth,removeImageFromCloudinary);
productRouter.put('/updateProduct/:id',auth,authorizeRole('ADMIN', 'SELLER'),updateProduct);

productRouter.post('/productRAMS/create',auth,authorizeRole('ADMIN', 'SELLER'),createProductRAMS);
productRouter.delete('/productRAMS/:id',auth,authorizeRole('ADMIN', 'SELLER'),deleteProductRAMS);
productRouter.put('/productRAMS/:id',auth,authorizeRole('ADMIN', 'SELLER'),updateProductRam);
productRouter.get('/productRAMS/get',getProductRams);
productRouter.get('/productRAMS/:id',getProductRamsById);

productRouter.post('/productWeight/create',auth,authorizeRole('ADMIN', 'SELLER'),createProductWEIGHT);
productRouter.delete('/productWeight/:id',auth,authorizeRole('ADMIN', 'SELLER'),deleteProductWEIGHT);
productRouter.put('/productWeight/:id',auth,authorizeRole('ADMIN', 'SELLER'),updateProductWeight);
productRouter.get('/productWeight/get',getProductWeight);
productRouter.get('/productWeight/:id',getProductWeightById);


productRouter.post('/productSize/create',auth,authorizeRole('ADMIN', 'SELLER'),createProductSize);
productRouter.delete('/productSize/:id',auth,authorizeRole('ADMIN', 'SELLER'),deleteProductSize);
productRouter.put('/productSize/:id',auth,authorizeRole('ADMIN', 'SELLER'),updateProductSize);
productRouter.get('/productSize/get',getProductSize);
productRouter.get('/productSize/:id',getProductSizeById);

productRouter.post('/filters',filters);
productRouter.post('/sortBy',sortBy);
productRouter.post('/search/get',searchProductController);
productRouter.get('/seller/products',auth,authorizeRole('SELLER'),getSellerProducts);
productRouter.get('/store/:sellerId',getProductsBySellerPublic);
productRouter.get('/seller/dashboard-stats',auth,authorizeRole('SELLER'),getSellerDashboardStats);


// ── Review Routes ──────────────────────────────────────────────────────────


export default productRouter;