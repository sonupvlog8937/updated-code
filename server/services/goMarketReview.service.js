import mongoose from "mongoose";
import ReviewModel from "../models/reviews.model.js";
import GroceryShop from "../models/groceryShop.model.js";
import Restaurant from "../models/restaurant.model.js";
import UserModel from "../models/user.model.js";
import { isObjectId } from "./goMarket.service.js";

export const OUTLET_TARGET = {
  GROCERY: "grocery_shop",
  RESTAURANT: "restaurant",
};

const reviewMatch = (outletId, targetType) => ({
  outletId: String(outletId),
  targetType,
});

export async function getOutletReviewStats(outletId, targetType) {
  const match = reviewMatch(outletId, targetType);
  const matchId = isObjectId(outletId) ? new mongoose.Types.ObjectId(outletId) : outletId;

  const [total, statsAgg] = await Promise.all([
    ReviewModel.countDocuments(match),
    ReviewModel.aggregate([
      { $match: { outletId: String(outletId), targetType } },
      {
        $group: {
          _id: null,
          sum: { $sum: { $toDouble: "$rating" } },
          count: { $sum: 1 },
          s1: { $sum: { $cond: [{ $eq: [{ $round: [{ $toDouble: "$rating" }] }, 1] }, 1, 0] } },
          s2: { $sum: { $cond: [{ $eq: [{ $round: [{ $toDouble: "$rating" }] }, 2] }, 1, 0] } },
          s3: { $sum: { $cond: [{ $eq: [{ $round: [{ $toDouble: "$rating" }] }, 3] }, 1, 0] } },
          s4: { $sum: { $cond: [{ $eq: [{ $round: [{ $toDouble: "$rating" }] }, 4] }, 1, 0] } },
          s5: { $sum: { $cond: [{ $eq: [{ $round: [{ $toDouble: "$rating" }] }, 5] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const s = statsAgg[0] || { sum: 0, count: 0, s1: 0, s2: 0, s3: 0, s4: 0, s5: 0 };
  const averageRating = s.count > 0 ? Number((s.sum / s.count).toFixed(1)) : 0;
  const breakdown = { 1: s.s1, 2: s.s2, 3: s.s3, 4: s.s4, 5: s.s5 };

  return { totalReviews: total, averageRating, breakdown };
}

export async function syncOutletRating(outletId, targetType) {
  const { averageRating } = await getOutletReviewStats(outletId, targetType);
  if (targetType === OUTLET_TARGET.GROCERY) {
    await GroceryShop.findByIdAndUpdate(outletId, { rating: averageRating });
  } else if (targetType === OUTLET_TARGET.RESTAURANT) {
    await Restaurant.findByIdAndUpdate(outletId, { rating: averageRating });
  }
  return averageRating;
}

export function sanitizeOutletDoc(doc, userId) {
  if (!doc) return doc;
  const shop = { ...doc };
  const followers = Array.isArray(shop.followers) ? shop.followers : [];
  shop.followerCount = followers.length;
  shop.isFollowing = userId
    ? followers.some((f) => String(f?._id || f) === String(userId))
    : false;
  delete shop.followers;
  return shop;
}

export async function enrichOutletWithReviews(doc, targetType, userId) {
  const base = sanitizeOutletDoc(doc, userId);
  const stats = await getOutletReviewStats(doc._id, targetType);
  return {
    ...base,
    ...stats,
    reviewCount: stats.totalReviews,
  };
}

export async function listOutletReviewsPaginated({
  outletId,
  targetType,
  page = 1,
  limit = 8,
  sort = "NEWEST",
}) {
  const match = reviewMatch(outletId, targetType);
  const sortMap = {
    NEWEST: { createdAt: -1 },
    OLDEST: { createdAt: 1 },
    HIGHEST: { rating: -1 },
    LOWEST: { rating: 1 },
  };
  const sortObj = sortMap[sort] || sortMap.NEWEST;
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 30);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);

  const [total, reviews, stats] = await Promise.all([
    ReviewModel.countDocuments(match),
    ReviewModel.find(match)
      .sort(sortObj)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    getOutletReviewStats(outletId, targetType),
  ]);

  return {
    reviews,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
    hasMore: safePage * safeLimit < total,
    ...stats,
  };
}

export async function createOutletReview({
  userId,
  outletId,
  targetType,
  rating,
  review,
  image = "",
}) {
  if (!isObjectId(outletId)) throw new Error("Invalid outlet id");
  const ratingNum = Number(rating);
  if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new Error("Rating must be 1–5");
  }
  if (!review?.trim()) throw new Error("Review text is required");

  if (targetType === OUTLET_TARGET.GROCERY) {
    const shop = await GroceryShop.findById(outletId);
    if (!shop) throw new Error("Grocery shop not found");
  } else if (targetType === OUTLET_TARGET.RESTAURANT) {
    const restaurant = await Restaurant.findById(outletId);
    if (!restaurant) throw new Error("Restaurant not found");
  } else {
    throw new Error("Invalid outlet type");
  }

  const existing = await ReviewModel.findOne({
    userId: String(userId),
    outletId: String(outletId),
    targetType,
  });
  if (existing) throw new Error("You have already reviewed this shop");

  const user = await UserModel.findById(userId).select("name avatar").lean();
  const userName = user?.name || "Customer";

  const doc = await ReviewModel.create({
    image: image || user?.avatar || "",
    userName,
    review: review.trim(),
    rating: String(ratingNum),
    userId: String(userId),
    productId: "",
    outletId: String(outletId),
    targetType,
  });

  const averageRating = await syncOutletRating(outletId, targetType);
  const stats = await getOutletReviewStats(outletId, targetType);

  return { review: doc, averageRating, ...stats };
}
