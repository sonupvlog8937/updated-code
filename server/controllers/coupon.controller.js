import CouponModel from "../models/coupon.model.js";

const isCouponLive = (coupon) => {
  const now = new Date();
  if (!coupon.isActive) return false;
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return false;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return false;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return false;
  return true;
};

const computeDiscount = (coupon, orderAmount) => {
  if (orderAmount < Number(coupon.minOrderAmount || 0)) {
    return { valid: false, discountAmount: 0, message: `Minimum order ₹${coupon.minOrderAmount} required` };
  }

  let discountAmount = 0;
  if (coupon.type === "percentage") {
    discountAmount = Math.round((orderAmount * Number(coupon.value || 0)) / 100);
  } else {
    discountAmount = Number(coupon.value || 0);
  }

  if (coupon.maxDiscountAmount !== null && discountAmount > coupon.maxDiscountAmount) {
    discountAmount = Number(coupon.maxDiscountAmount);
  }

  discountAmount = Math.min(discountAmount, orderAmount);

  return {
    valid: true,
    discountAmount,
    message: `${coupon.code} applied successfully`,
  };
};

export const getActiveCouponsController = async (request, response) => {
  try {
    const coupons = await CouponModel.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    const data = coupons.filter(isCouponLive).map((coupon) => ({
      _id: coupon._id,
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      expiresAt: coupon.expiresAt,
    }));

    return response.status(200).json({ success: true, error: false, data });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const validateCouponController = async (request, response) => {
  try {
    const { code = "", orderAmount = 0 } = request.body || {};
    const normalizedCode = String(code).trim().toUpperCase();

    if (!normalizedCode) {
      return response.status(400).json({ success: false, error: true, message: "Coupon code is required" });
    }

    const coupon = await CouponModel.findOne({ code: normalizedCode }).lean();
    if (!coupon || !isCouponLive(coupon)) {
      return response.status(404).json({ success: false, error: true, message: "Invalid or expired coupon" });
    }

    const result = computeDiscount(coupon, Number(orderAmount || 0));
    if (!result.valid) {
      return response.status(400).json({ success: false, error: true, message: result.message, discountAmount: 0 });
    }

    return response.status(200).json({ success: true, error: false, ...result, code: coupon.code });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const getAllCouponsAdminController = async (request, response) => {
  try {
    const coupons = await CouponModel.find().sort({ createdAt: -1 });
    return response.status(200).json({ success: true, error: false, data: coupons });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const createCouponController = async (request, response) => {
  try {
    const payload = {
      ...request.body,
      code: String(request.body?.code || "").trim().toUpperCase(),
    };

    const coupon = await CouponModel.create(payload);
    return response.status(201).json({ success: true, error: false, message: "Coupon created", data: coupon });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const updateCouponController = async (request, response) => {
  try {
    const payload = { ...request.body };
    if (payload.code) {
      payload.code = String(payload.code).trim().toUpperCase();
    }

    const coupon = await CouponModel.findByIdAndUpdate(request.params.id, payload, { new: true });
    if (!coupon) {
      return response.status(404).json({ success: false, error: true, message: "Coupon not found" });
    }

    return response.status(200).json({ success: true, error: false, message: "Coupon updated", data: coupon });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const deleteCouponController = async (request, response) => {
  try {
    const coupon = await CouponModel.findByIdAndDelete(request.params.id);
    if (!coupon) {
      return response.status(404).json({ success: false, error: true, message: "Coupon not found" });
    }

    return response.status(200).json({ success: true, error: false, message: "Coupon deleted" });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};