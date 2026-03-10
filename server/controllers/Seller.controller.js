import SellerModel from "../models/Seller.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.modal.js";

// ─────────────────────────────────────────────
// SELLER REGISTRATION
// ─────────────────────────────────────────────

// POST /api/seller/register
export const registerSeller = async (request, response) => {
  try {
    const userId = request.userId;
    const { storeName, storeDescription, mobile, address, bankDetails } = request.body;

    if (!storeName) {
      return response.status(400).json({ message: "Store name is required", error: true, success: false });
    }

    // Check already registered
    const existing = await SellerModel.findOne({ userId });
    if (existing) {
      return response.status(400).json({ message: "Seller profile already exists", error: true, success: false });
    }

    // Check storeName unique
    const storeExists = await SellerModel.findOne({ storeName });
    if (storeExists) {
      return response.status(400).json({ message: "Store name already taken", error: true, success: false });
    }

    // ✅ FIX: Generate unique storeSlug from storeName
    const storeSlug =
      storeName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-") +
      "-" +
      Date.now();

    const seller = await SellerModel.create({
      userId,
      storeName,
      storeSlug,
      storeDescription,
      mobile,
      address,
      bankDetails,
      status: "pending",
    });

    // Update user role to SELLER and link seller profile
    await UserModel.findByIdAndUpdate(userId, {
      role: "SELLER",
      sellerProfile: seller._id,
    });

    return response.status(201).json({
      message: "Seller registration submitted. Awaiting admin approval.",
      data: seller,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// ─────────────────────────────────────────────
// SELLER PROFILE
// ─────────────────────────────────────────────

// GET /api/seller/profile
export const getSellerProfile = async (request, response) => {
  try {
    const seller = await SellerModel.findOne({ userId: request.userId });
    if (!seller) {
      return response.status(404).json({ message: "Seller not found", error: true, success: false });
    }
    return response.status(200).json({ data: seller, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/seller/profile
export const updateSellerProfile = async (request, response) => {
  try {
    const { storeName, storeDescription, storeLogo, storeBanner, mobile, address, bankDetails } = request.body;

    // Check storeName conflict
    if (storeName) {
      const conflict = await SellerModel.findOne({ storeName, userId: { $ne: request.userId } });
      if (conflict) {
        return response.status(400).json({ message: "Store name already taken", error: true, success: false });
      }
    }

    const seller = await SellerModel.findOneAndUpdate(
      { userId: request.userId },
      { storeName, storeDescription, storeLogo, storeBanner, mobile, address, bankDetails },
      { new: true, runValidators: true }
    );

    return response.status(200).json({ message: "Profile updated", data: seller, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// ─────────────────────────────────────────────
// SELLER STORE PAGE (Public - for clients)
// ─────────────────────────────────────────────

// GET /api/seller/store/:storeSlug  (public - no auth needed)
export const getSellerStore = async (request, response) => {
  try {
    const { storeSlug } = request.params;

    const seller = await SellerModel.findOne({ storeSlug, status: "approved" }).select(
      "-bankDetails -commission -totalEarnings -pendingPayout -totalPaidOut"
    );

    if (!seller) {
      return response.status(404).json({ message: "Store not found", error: true, success: false });
    }

    // Get all approved products of this seller
    const products = await ProductModel.find({ sellerId: seller._id, adminApproved: true })
      .sort({ createdAt: -1 });

    return response.status(200).json({
      data: { seller, products },
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// ─────────────────────────────────────────────
// SELLER PRODUCTS
// ─────────────────────────────────────────────

// GET /api/seller/products
export const getSellerProducts = async (request, response) => {
  try {
    const seller = request.seller;
    const { page = 1, limit = 10, status } = request.query;

    const filter = { sellerId: seller._id };
    if (status === "approved") filter.adminApproved = true;
    if (status === "pending") filter.adminApproved = false;

    const skip = (page - 1) * limit;
    const total = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
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

// POST /api/seller/products/create
export const createSellerProduct = async (request, response) => {
  try {
    const seller = request.seller;

    const product = await ProductModel.create({
      ...request.body,
      sellerId: seller._id,
      sellerName: seller.storeName,
      adminApproved: false, // Needs admin approval
    });

    // Increment seller product count
    await SellerModel.findByIdAndUpdate(seller._id, { $inc: { totalProducts: 1 } });

    return response.status(201).json({
      message: "Product submitted for admin review.",
      data: product,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// PUT /api/seller/products/:id
export const updateSellerProduct = async (request, response) => {
  try {
    const seller = request.seller;
    const { id } = request.params;

    const product = await ProductModel.findOne({ _id: id, sellerId: seller._id });
    if (!product) {
      return response.status(404).json({ message: "Product not found or unauthorized", error: true, success: false });
    }

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { ...request.body, adminApproved: false }, // Re-review after edit
      { new: true }
    );

    return response.status(200).json({ message: "Product updated. Sent for re-review.", data: updated, error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// DELETE /api/seller/products/:id
export const deleteSellerProduct = async (request, response) => {
  try {
    const seller = request.seller;
    const { id } = request.params;

    const product = await ProductModel.findOne({ _id: id, sellerId: seller._id });
    if (!product) {
      return response.status(404).json({ message: "Product not found or unauthorized", error: true, success: false });
    }

    await ProductModel.findByIdAndDelete(id);
    await SellerModel.findByIdAndUpdate(seller._id, { $inc: { totalProducts: -1 } });

    return response.status(200).json({ message: "Product deleted", error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};

// ─────────────────────────────────────────────
// SELLER EARNINGS DASHBOARD
// ─────────────────────────────────────────────

// GET /api/seller/earnings
export const getSellerEarnings = async (request, response) => {
  try {
    const seller = await SellerModel.findOne({ userId: request.userId });

    return response.status(200).json({
      data: {
        totalEarnings: seller.totalEarnings,
        pendingPayout: seller.pendingPayout,
        totalPaidOut: seller.totalPaidOut,
        commission: seller.commission,
        totalOrders: seller.totalOrders,
      },
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
};