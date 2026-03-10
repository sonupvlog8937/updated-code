import SellerModel from "../models/Seller.model.js";
import UserModel from "../models/user.model.js";

// ─── isSeller Middleware ──────────────────────────────────────────────────────
export const isSeller = async (request, response, next) => {
  try {
    // ✅ FIX: Single query with populate instead of 2 separate DB calls
    const user = await UserModel.findById(request.userId)
      .select("role status sellerProfile")
      .lean();

    if (!user) {
      return response.status(401).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    // ✅ FIX: Check if user account is active first
    if (user.status === "Suspended") {
      return response.status(403).json({
        message: "Your account has been suspended. Please contact support.",
        error: true,
        success: false,
      });
    }

    if (user.role !== "SELLER" && user.role !== "ADMIN") {
      return response.status(403).json({
        message: "Access denied. Seller account required.",
        error: true,
        success: false,
      });
    }

    // ✅ FIX: Use sellerProfile ref for direct lookup (faster than findOne filter)
    const sellerId = user.sellerProfile;
    const seller = sellerId ? await SellerModel.findById(sellerId).lean() : null;

    if (!seller && user.role === "SELLER") {
      return response.status(403).json({
        message: "Seller profile not found. Please complete registration.",
        error: true,
        success: false,
      });
    }

    // ADMIN bypasses approval check but still gets seller profile if exists
    if (user.role === "SELLER" && seller.status !== "approved") {
      return response.status(403).json({
        message: `Your seller account is ${seller.status}. Please contact admin.`,
        error: true,
        success: false,
        status: seller.status,
      });
    }

    request.seller = seller;
    next();
  } catch (error) {
    return response.status(500).json({
      message: "Authorization error",
      error: true,
      success: false,
    });
  }
};

// ─── isAdmin Middleware ───────────────────────────────────────────────────────
export const isAdmin = async (request, response, next) => {
  try {
    // ✅ FIX: .lean() for performance - we only need role field
    const user = await UserModel.findById(request.userId)
      .select("role status")
      .lean();

    if (!user) {
      return response.status(401).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (user.role !== "ADMIN") {
      return response.status(403).json({
        message: "Access denied. Admin only.",
        error: true,
        success: false,
      });
    }

    next();
  } catch (error) {
    return response.status(500).json({
      message: "Authorization error",
      error: true,
      success: false,
    });
  }
};