import { fetchDataFromApi, postData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Review = {
  _id: string;
  userName?: string;
  rating?: string | number;
  review?: string;
  createdAt?: string;
};

type Props = {
  productId: string;
  productTitle?: string;
  isLogin: boolean;
  userName?: string;
  initialAverage?: number;
  initialTotal?: number;
  onStatsChange?: (stats: { averageRating: number; totalReviews: number }) => void;
  onLoginRequired?: () => void;
};

const T = { orange: "#FF6B2C", border: "#EBEBEB", textSoft: "#999", text: "#111", green: "#16A34A" };

export function ProductReviewsSection({
  productId,
  productTitle = "Product",
  isLogin,
  userName = "",
  initialAverage = 0,
  initialTotal = 0,
  onStatsChange,
  onLoginRequired,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(Number(initialAverage) || 0);
  const [totalReviews, setTotalReviews] = useState(Number(initialTotal) || 0);
  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userReviewCount, setUserReviewCount] = useState(0);

  const applyStats = useCallback(
    (res: any) => {
      const avg = res?.avgRating ?? res?.averageRating ?? res?.rating;
      const total = res?.total ?? res?.totalReviews;
      if (avg != null && avg !== "") {
        const avgNum = Number(avg);
        if (!isNaN(avgNum) && avgNum >= 0) {
          setAvgRating(avgNum);
          if (total != null) {
            const totalNum = Number(total);
            setTotalReviews(totalNum);
            onStatsChange?.({ 
              averageRating: avgNum, 
              totalReviews: totalNum 
            });
          }
        }
      }
    },
    [onStatsChange],
  );

  const loadPage = useCallback(
    async (pageNum: number, append = false) => {
      if (!productId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await fetchDataFromApi(
          `/api/product/reviews/${productId}?page=${pageNum}&limit=8&sort=NEWEST`,
        );
        const list: Review[] = res?.reviews || [];
        setReviews((prev) => (append ? [...prev, ...list] : list));
        setHasMore(Boolean(res?.hasMore));
        setTotalPages(res?.totalPages || 1);
        setPage(pageNum);
        applyStats(res);
        
        // Count user's reviews for this product
        if (!append) {
          const userRevCount = list.filter((r) => r.userName === userName).length;
          setUserReviewCount(userRevCount);
        }
      } catch {
        if (!append) setReviews([]);
        setHasMore(false);
        setTotalPages(1);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId, applyStats, userName],
  );

  useEffect(() => {
    const avgNum = Number(initialAverage) || 0;
    const totalNum = Number(initialTotal) || 0;
    setAvgRating(avgNum);
    setTotalReviews(totalNum);
    loadPage(1, false);
  }, [productId]);

  const submitReview = async () => {
    if (!isLogin) {
      showToast("error", "Please login to review");
      onLoginRequired?.();
      return;
    }
    if (!draftText.trim()) {
      showToast("error", "Please write your review");
      return;
    }
    setSubmitting(true);
    try {
      const res = await postData("/api/product/reviews/add", {
        productId,
        rating: draftRating,
        review: draftText.trim(),
        userName: userName || "Customer",
      });
      if (res?.error) throw new Error(res.message || "Failed");
      showToast("success", "Review submitted! You can add more.");
      setDraftText("");
      setDraftRating(5);
      setUserReviewCount((prev) => prev + 1);
      await loadPage(1, false);
    } catch (e: any) {
      showToast("error", e?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={S.block}>
      <Text style={S.blockTitle}>Ratings & reviews</Text>
      <Text style={S.sub}>{productTitle}</Text>

      <View style={S.scoreRow}>
        {/* <Text style={S.bigScore}>{Number(avgRating || 0).toFixed(1)}</Text> */}
        <View>
          <Text style={S.stars}>{"★".repeat(Math.round(Number(avgRating) || 0))}</Text>
          <Text style={S.muted}>{totalReviews} review{totalReviews === 1 ? "" : "s"}</Text>
        </View>
      </View>

      <View style={S.form}>
        <View style={S.formHeader}>
          <Text style={S.formLabel}>Write a review</Text>
          {userReviewCount > 0 && (
            <Text style={S.yourReviewsHint}>You have {userReviewCount} review{userReviewCount > 1 ? "s" : ""}</Text>
          )}
        </View>
        <Text style={S.multipleReviewHint}>💡 You can submit multiple reviews</Text>
        <View style={S.starRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setDraftRating(n)}>
              <Text style={[S.starBtn, draftRating >= n && S.starOn]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={S.input}
          multiline
          placeholder="Share your experience…"
          value={draftText}
          onChangeText={setDraftText}
          maxLength={2000}
        />
        <TouchableOpacity style={S.submitBtn} onPress={submitReview} disabled={submitting}>
          <Text style={S.submitTxt}>{submitting ? "Submitting…" : "Submit review"}</Text>
        </TouchableOpacity>
      </View>

      {loading && !reviews.length ? (
        <ActivityIndicator color={T.orange} style={{ marginTop: 12 }} />
      ) : reviews.length === 0 ? (
        <Text style={S.muted}>No reviews yet. Be the first!</Text>
      ) : (
        <>
          {userReviewCount > 0 && (
            <View style={S.userReviewsContainer}>
              <Text style={S.userReviewsTitle}>📝 Your Reviews ({userReviewCount})</Text>
              {reviews
                .filter((r) => r.userName === userName)
                .map((r) => (
                  <View key={r._id} style={[S.review, S.userReview]}>
                    <View style={[S.avatar, S.userAvatar]}>
                      <Text style={S.avatarTxt}>{(r.userName || "U").charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.reviewName}>You</Text>
                      <Text style={S.reviewStars}>{"★".repeat(Number(r.rating) || 0)}</Text>
                      <Text style={S.reviewBody}>{r.review}</Text>
                      {r.createdAt ? (
                        <Text style={S.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
            </View>
          )}

          {reviews.filter((r) => r.userName !== userName).length > 0 && (
            <>
              <Text style={S.othersReviewsTitle}>⭐ Other Reviews</Text>
              {reviews
                .filter((r) => r.userName !== userName)
                .map((r) => (
                  <View key={r._id} style={S.review}>
                    <View style={S.avatar}>
                      <Text style={S.avatarTxt}>{(r.userName || "U").charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.reviewName}>{r.userName || "Customer"}</Text>
                      <Text style={S.reviewStars}>{"★".repeat(Number(r.rating) || 0)}</Text>
                      <Text style={S.reviewBody}>{r.review}</Text>
                      {r.createdAt ? (
                        <Text style={S.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
            </>
          )}
          
          {/* Debug info - remove after testing */}
          <Text style={{ fontSize: 10, color: '#999', marginTop: 8 }}>
            Debug: hasMore={String(hasMore)} | page={page} | totalPages={totalPages} | total={reviews.length}
          </Text>
          
          {hasMore && (
            <TouchableOpacity
              style={S.loadMoreBtn}
              onPress={() => loadPage(page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={S.loadMoreTxt}>Load More Reviews</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  block: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  blockTitle: { fontSize: 16, fontWeight: "800", color: T.text, letterSpacing: -0.3 },
  sub: { fontSize: 11, color: T.textSoft, marginTop: 3, marginBottom: 14, fontWeight: "500" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  bigScore: { fontSize: 40, fontWeight: "900", color: T.text },
  stars: { fontSize: 14, color: "#F59E0B", letterSpacing: 1 },
  muted: { fontSize: 11, color: T.textSoft, marginTop: 3, fontWeight: "500" },
  form: {
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  formLabel: { fontSize: 13, fontWeight: "700", color: T.text },
  yourReviewsHint: { fontSize: 10, fontWeight: "700", color: "#059669", backgroundColor: "#D1FAE5", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  multipleReviewHint: { fontSize: 10, color: "#4F46E5", marginBottom: 10, fontWeight: "600", fontStyle: "italic" },
  starRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  starBtn: { fontSize: 24, color: "#E5E7EB" },
  starOn: { color: "#FBBF24" },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    color: T.text,
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: T.orange,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    shadowColor: T.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  review: { 
    flexDirection: "row", 
    gap: 10, 
    paddingVertical: 12, 
    paddingHorizontal: 8,
    borderBottomWidth: 1, 
    borderBottomColor: "#F1F5F9",
    borderRadius: 8,
    marginBottom: 4,
  },
  userReview: { 
    backgroundColor: "#F0F9FF", 
    borderLeftWidth: 3, 
    borderLeftColor: "#0EA5E9", 
    borderBottomWidth: 0,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userReviewsContainer: { 
    backgroundColor: "#ECFDF5", 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: "#A7F3D0",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  userReviewsTitle: { fontSize: 12, fontWeight: "800", color: "#047857", marginBottom: 10, letterSpacing: -0.2 },
  othersReviewsTitle: { fontSize: 12, fontWeight: "800", color: T.text, marginVertical: 12, letterSpacing: -0.2 },
  moreReviewsHint: { fontSize: 11, color: "#6B7280", fontStyle: "italic", marginTop: 8, paddingLeft: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userAvatar: { backgroundColor: "#10B981", borderColor: "#D1FAE5" },
  avatarTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  reviewName: { fontWeight: "700", fontSize: 12, color: T.text, marginBottom: 2 },
  reviewStars: { color: "#F59E0B", fontSize: 11, marginTop: 2, marginBottom: 4, letterSpacing: 0.5 },
  reviewBody: { fontSize: 12, color: "#374151", lineHeight: 18, marginTop: 2 },
  reviewDate: { fontSize: 10, color: "#9CA3AF", marginTop: 4, fontWeight: "500" },
  loadMoreBtn: {
    marginTop: 16,
    backgroundColor: T.orange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    shadowColor: T.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loadMoreTxt: { 
    fontWeight: "800", 
    fontSize: 13, 
    color: "#fff",
    letterSpacing: -0.2,
  },
  loadMoreSubTxt: {
    fontSize: 11,
    color: "#fff",
    marginTop: 4,
    opacity: 0.9,
    fontWeight: "500",
  },
});
