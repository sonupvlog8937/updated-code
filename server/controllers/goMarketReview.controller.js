import {
  OUTLET_TARGET,
  createOutletReview,
  listOutletReviewsPaginated,
} from "../services/goMarketReview.service.js";
import { isObjectId } from "../services/goMarket.service.js";

const ok = (res, body) => res.json({ error: false, success: true, ...body });
const sendError = (res, error, status = 500) =>
  res.status(status).json({
    error: true,
    success: false,
    message: error.message || error,
  });

const resolveTarget = (type) => {
  const t = String(type || "").toLowerCase();
  if (t === "grocery" || t === "grocery_shop" || t === "shop") {
    return OUTLET_TARGET.GROCERY;
  }
  if (t === "restaurant") return OUTLET_TARGET.RESTAURANT;
  return null;
};

export const getGroceryShopReviews = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!isObjectId(shopId)) return sendError(res, "Invalid shop id", 400);
    const data = await listOutletReviewsPaginated({
      outletId: shopId,
      targetType: OUTLET_TARGET.GROCERY,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });
    ok(res, { data });
  } catch (error) {
    sendError(res, error);
  }
};

export const getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!isObjectId(restaurantId)) return sendError(res, "Invalid restaurant id", 400);
    const data = await listOutletReviewsPaginated({
      outletId: restaurantId,
      targetType: OUTLET_TARGET.RESTAURANT,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });
    ok(res, { data });
  } catch (error) {
    sendError(res, error);
  }
};

export const addGroceryShopReview = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return sendError(res, "Login required", 401);
    const { shopId } = req.params;
    const { rating, review, image } = req.body;
    const result = await createOutletReview({
      userId,
      outletId: shopId,
      targetType: OUTLET_TARGET.GROCERY,
      rating,
      review,
      image,
    });
    ok(res, { message: "Review submitted", data: result });
  } catch (error) {
    const status = error.message?.includes("already reviewed") ? 409 : 400;
    sendError(res, error, status);
  }
};

export const addRestaurantReview = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return sendError(res, "Login required", 401);
    const { restaurantId } = req.params;
    const { rating, review, image } = req.body;
    const result = await createOutletReview({
      userId,
      outletId: restaurantId,
      targetType: OUTLET_TARGET.RESTAURANT,
      rating,
      review,
      image,
    });
    ok(res, { message: "Review submitted", data: result });
  } catch (error) {
    const status = error.message?.includes("already reviewed") ? 409 : 400;
    sendError(res, error, status);
  }
};

export const getOutletReviewsByType = async (req, res) => {
  try {
    const { outletId, outletType } = req.params;
    const targetType = resolveTarget(outletType);
    if (!targetType || !isObjectId(outletId)) {
      return sendError(res, "Invalid outlet", 400);
    }
    const data = await listOutletReviewsPaginated({
      outletId,
      targetType,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });
    ok(res, { data });
  } catch (error) {
    sendError(res, error);
  }
};
