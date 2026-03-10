import SellerModel from "../models/Seller.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.modal.js";

// ─────────────────────────────────────────────
// ADMIN - SELLER MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/admin/sellers  - Get all sellers with filters
export const getAllSellers = async (request, response) => {
  try {
    const { page = 1, limit = 10, status } = request.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const total = await SellerModel.countDocuments(filter);
    const sellers = await SellerModel.find(filter)
      .populate("userId", "name email avatar mobile")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return response.status(200).json({
      data: sellers,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// GET /api/admin/sellers/:id
export const getSellerById = async (request, response) => {
  try {
    const seller = await SellerModel.findById(request.params.id).populate("userId", "name email avatar mobile");
    if (!seller) {
      return response.status(404).json({ message: "Seller not found", error: true, success: false });
    }
    return response.status(200).json({ data: seller, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/admin/sellers/:id/approve
export const approveSeller = async (request, response) => {
  try {
    const seller = await SellerModel.findByIdAndUpdate(
      request.params.id,
      { status: "approved", rejectionReason: "" },
      { new: true }
    );

    if (!seller) {
      return response.status(404).json({ message: "Seller not found", error: true, success: false });
    }

    // Ensure user role is SELLER
    await UserModel.findByIdAndUpdate(seller.userId, { role: "SELLER" });

    return response.status(200).json({ message: "Seller approved successfully", data: seller, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/admin/sellers/:id/reject
export const rejectSeller = async (request, response) => {
  try {
    const { reason } = request.body;

    const seller = await SellerModel.findByIdAndUpdate(
      request.params.id,
      { status: "rejected", rejectionReason: reason || "Not specified" },
      { new: true }
    );

    if (!seller) {
      return response.status(404).json({ message: "Seller not found", error: true, success: false });
    }

    // Revert role back to USER
    await UserModel.findByIdAndUpdate(seller.userId, { role: "USER" });

    return response.status(200).json({ message: "Seller rejected", data: seller, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/admin/sellers/:id/block
export const blockSeller = async (request, response) => {
  try {
    const seller = await SellerModel.findByIdAndUpdate(
      request.params.id,
      { status: "blocked" },
      { new: true }
    );

    if (!seller) {
      return response.status(404).json({ message: "Seller not found", error: true, success: false });
    }

    await UserModel.findByIdAndUpdate(seller.userId, { status: "Suspended" });

    return response.status(200).json({ message: "Seller blocked", data: seller, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/admin/sellers/:id/unblock
export const unblockSeller = async (request, response) => {
  try {
    const seller = await SellerModel.findByIdAndUpdate(
      request.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!seller) {
      return response.status(404).json({ message: "Seller not found", error: true, success: false });
    }

    await UserModel.findByIdAndUpdate(seller.userId, { status: "Active" });

    return response.status(200).json({ message: "Seller unblocked", data: seller, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/admin/sellers/:id/commission
export const setSellerCommission = async (request, response) => {
  try {
    const { commission } = request.body;

    if (commission < 0 || commission > 100) {
      return response.status(400).json({ message: "Commission must be between 0-100", error: true, success: false });
    }

    const seller = await SellerModel.findByIdAndUpdate(
      request.params.id,
      { commission },
      { new: true }
    );

    if (!seller) {
      return response.status(404).json({ message: "Seller not found", error: true, success: false });
    }

    return response.status(200).json({ message: `Commission set to ${commission}%`, data: seller, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// ─────────────────────────────────────────────
// ADMIN - PRODUCT REVIEW
// ─────────────────────────────────────────────

// GET /api/admin/seller-products?approved=false
export const getSellerProductsForReview = async (request, response) => {
  try {
    const { approved, page = 1, limit = 10 } = request.query;

    const filter = { sellerId: { $ne: null } };
    if (approved === "false") filter.adminApproved = false;
    if (approved === "true") filter.adminApproved = true;

    const skip = (page - 1) * limit;
    const total = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
      .populate("sellerId", "storeName storeLogo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return response.status(200).json({
      data: products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/admin/seller-products/:id/approve
export const approveSellerProduct = async (request, response) => {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      request.params.id,
      { adminApproved: true },
      { new: true }
    );

    if (!product) {
      return response.status(404).json({ message: "Product not found", error: true, success: false });
    }

    return response.status(200).json({ message: "Product approved and live", data: product, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/admin/seller-products/:id/reject
export const rejectSellerProduct = async (request, response) => {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      request.params.id,
      { adminApproved: false },
      { new: true }
    );

    return response.status(200).json({ message: "Product rejected", data: product, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};