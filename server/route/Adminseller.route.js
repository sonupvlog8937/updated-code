import { Router } from "express";
import auth from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/Sellerauth .js";
import {
  getAllSellers,
  getSellerById,
  approveSeller,
  rejectSeller,
  blockSeller,
  unblockSeller,
  setSellerCommission,
  getSellerProductsForReview,
  approveSellerProduct,
  rejectSellerProduct,
} from "../controllers/Adminseller.controller.js";

const adminSellerRouter = Router();

// All routes need auth + admin role
adminSellerRouter.use(auth, isAdmin);

// ─── SELLER MANAGEMENT ───
adminSellerRouter.get("/sellers", getAllSellers);                        // GET all sellers (filter: ?status=pending)
adminSellerRouter.get("/sellers/:id", getSellerById);                   // GET single seller
adminSellerRouter.put("/sellers/:id/approve", approveSeller);           // Approve seller
adminSellerRouter.put("/sellers/:id/reject", rejectSeller);             // Reject seller
adminSellerRouter.put("/sellers/:id/block", blockSeller);               // Block seller
adminSellerRouter.put("/sellers/:id/unblock", unblockSeller);           // Unblock seller
adminSellerRouter.put("/sellers/:id/commission", setSellerCommission);  // Set commission %

// ─── PRODUCT REVIEW ───
adminSellerRouter.get("/seller-products", getSellerProductsForReview);            // GET seller products (?approved=false for pending)
adminSellerRouter.put("/seller-products/:id/approve", approveSellerProduct);      // Approve product
adminSellerRouter.put("/seller-products/:id/reject", rejectSellerProduct);        // Reject product

export default adminSellerRouter;