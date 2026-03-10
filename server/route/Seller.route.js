import { Router } from "express";
import auth from "../middlewares/auth.js";
import { isSeller } from "../middlewares/Sellerauth .js";
import upload from "../middlewares/multer.js";
import {
  registerSeller,
  getSellerProfile,
  updateSellerProfile,
  getSellerStore,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerEarnings,
} from "../controllers/Seller.controller.js";

const sellerRouter = Router();

// ─── PUBLIC ROUTES ───
// Client can view seller store page
sellerRouter.get("/store/:storeSlug", getSellerStore);

// ─── AUTH REQUIRED ───
// Register as seller (any logged in user)
sellerRouter.post("/register", auth, registerSeller);

// ─── SELLER ONLY ROUTES ───
sellerRouter.get("/profile", auth, isSeller, getSellerProfile);
sellerRouter.put("/profile", auth, isSeller, updateSellerProfile);
sellerRouter.put("/profile/logo", auth, isSeller, upload.array("storeLogo"), updateSellerProfile);

// Seller Products
sellerRouter.get("/products", auth, isSeller, getSellerProducts);
sellerRouter.post("/products/create", auth, isSeller, createSellerProduct);
sellerRouter.put("/products/:id", auth, isSeller, updateSellerProduct);
sellerRouter.delete("/products/:id", auth, isSeller, deleteSellerProduct);

// Upload product images (seller)
sellerRouter.post("/products/uploadImages", auth, isSeller, upload.array("images"), async (req, res) => {
  try {
    const imageUrls = req.files.map((f) => f.path || f.filename);
    return res.status(200).json({ images: imageUrls, error: false, success: true });
  } catch (e) {
    return res.status(500).json({ message: e.message, error: true, success: false });
  }
});

// Earnings Dashboard
sellerRouter.get("/earnings", auth, isSeller, getSellerEarnings);

export default sellerRouter;