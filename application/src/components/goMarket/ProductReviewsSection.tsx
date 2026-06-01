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
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [avgRating, setAvgRating] = useState(initialAverage);
  const [totalReviews, setTotalReviews] = useState(initialTotal);
  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const applyStats = useCallback(
    (res: any) => {
      const avg = res?.avgRating ?? res?.averageRating;
      const total = res?.total ?? res?.totalReviews;
      if (avg != null) setAvgRating(Number(avg));
      if (total != null) {
        setTotalReviews(total);
        onStatsChange?.({ averageRating: Number(avg ?? initialAverage), totalReviews: total });
      }
    },
    [initialAverage, onStatsChange],
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
        setPage(pageNum);
        applyStats(res);
      } catch {
        if (!append) setReviews([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId, applyStats],
  );

  useEffect(() => {
    setAvgRating(initialAverage);
    setTotalReviews(initialTotal);
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
      showToast("success", "Review submitted!");
      setDraftText("");
      setDraftRating(5);
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
        <Text style={S.bigScore}>{Number(avgRating || 0).toFixed(1)}</Text>
        <View>
          <Text style={S.stars}>{"★".repeat(Math.round(Number(avgRating) || 0))}</Text>
          <Text style={S.muted}>{totalReviews} review{totalReviews === 1 ? "" : "s"}</Text>
        </View>
      </View>

      <View style={S.form}>
        <Text style={S.formLabel}>Write a review</Text>
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
          {reviews.map((r) => (
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
          {hasMore ? (
            <TouchableOpacity
              style={S.loadMore}
              onPress={() => loadPage(page + 1, true)}
              disabled={loadingMore}
            >
              <Text style={S.loadMoreTxt}>{loadingMore ? "Loading…" : "Load more reviews"}</Text>
            </TouchableOpacity>
          ) : null}
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
  blockTitle: { fontSize: 17, fontWeight: "800", color: T.text },
  sub: { fontSize: 12, color: T.textSoft, marginTop: 2, marginBottom: 12 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  bigScore: { fontSize: 40, fontWeight: "900", color: T.text },
  stars: { fontSize: 16, color: "#F59E0B" },
  muted: { fontSize: 13, color: T.textSoft, marginTop: 4 },
  form: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 14,
  },
  formLabel: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  starRow: { flexDirection: "row", gap: 4, marginBottom: 8 },
  starBtn: { fontSize: 28, color: "#D1D5DB" },
  starOn: { color: "#F59E0B" },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: T.orange,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  review: { flexDirection: "row", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontWeight: "800" },
  reviewName: { fontWeight: "700", fontSize: 14 },
  reviewStars: { color: "#F59E0B", fontSize: 12, marginTop: 2 },
  reviewBody: { fontSize: 14, color: "#555", lineHeight: 20, marginTop: 4 },
  reviewDate: { fontSize: 11, color: T.textSoft, marginTop: 4 },
  loadMore: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  loadMoreTxt: { fontWeight: "700", fontSize: 14, color: T.text },
});
