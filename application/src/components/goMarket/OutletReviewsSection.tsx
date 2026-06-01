import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchDataFromApi, postData } from "@/src/utils/api";

const T = {
  orange: "#FF6B2C",
  border: "#EBEBEB",
  text: "#111111",
  muted: "#64748b",
  card: "#FFFFFF",
  bg: "#F8FAFC",
};

type Props = {
  outletId: string;
  outletType: "grocery" | "restaurant";
  outletName: string;
  isLogin: boolean;
  onLoginRequired: () => void;
  onStatsChange?: (stats: { averageRating: number; totalReviews: number }) => void;
};

const apiBase = (type: string, id: string) =>
  type === "restaurant"
    ? `/api/go-market/restaurants/${id}/reviews`
    : `/api/go-market/grocery-shops/${id}/reviews`;

const StarRow = ({ value, size = 14 }: { value: number; size?: number }) => (
  <Text style={{ fontSize: size, color: "#f59e0b" }}>
    {[1, 2, 3, 4, 5].map((i) => (value >= i ? "★" : "☆")).join("")}
  </Text>
);

export function OutletReviewsSection({
  outletId,
  outletType,
  outletName,
  isLogin,
  onLoginRequired,
  onStatsChange,
}: Props) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPage = useCallback(
    async (pageNum: number, append = false) => {
      if (!outletId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await fetchDataFromApi(
          `${apiBase(outletType, outletId)}?page=${pageNum}&limit=8&sort=NEWEST`,
        );
        const payload = res?.data || res;
        const list = payload?.reviews || [];
        setReviews((prev) => (append ? [...prev, ...list] : list));
        setHasMore(Boolean(payload?.hasMore));
        setPage(pageNum);
        if (payload?.averageRating != null) setAvgRating(payload.averageRating);
        if (payload?.totalReviews != null) {
          setTotalReviews(payload.totalReviews);
          onStatsChange?.({
            averageRating: payload.averageRating,
            totalReviews: payload.totalReviews,
          });
        }
      } catch {
        if (!append) setReviews([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [outletId, outletType, onStatsChange],
  );

  useEffect(() => {
    setReviews([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, false);
  }, [outletId, outletType]);

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    loadPage(page + 1, true);
  };

  const submitReview = async () => {
    if (!isLogin) {
      onLoginRequired();
      return;
    }
    if (!draftText.trim()) return;
    setSubmitting(true);
    try {
      await postData(apiBase(outletType, outletId), {
        rating: draftRating,
        review: draftText.trim(),
      });
      setDraftText("");
      setDraftRating(5);
      await loadPage(1, false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Reviews & ratings</Text>
          <Text style={styles.sub}>What customers say about {outletName}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreNum}>{Number(avgRating || 0).toFixed(1)}</Text>
          <StarRow value={avgRating} size={12} />
          <Text style={styles.scoreSub}>{totalReviews} reviews</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.formLabel}>Rate this shop</Text>
        <View style={styles.starPick}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setDraftRating(s)}>
              <Text style={[styles.starBtn, draftRating >= s && styles.starBtnOn]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder={`Share your experience…`}
          placeholderTextColor="#94a3b8"
          multiline
          value={draftText}
          onChangeText={setDraftText}
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submitReview}
          disabled={submitting}
        >
          <Text style={styles.submitTxt}>{submitting ? "Submitting…" : "Submit review"}</Text>
        </TouchableOpacity>
      </View>

      {loading && reviews.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={T.orange} />
          <Text style={styles.loaderTxt}>Loading reviews…</Text>
        </View>
      ) : reviews.length === 0 ? (
        <Text style={styles.empty}>No reviews yet. Be the first!</Text>
      ) : (
        reviews.map((r) => (
          <View key={r._id} style={styles.reviewRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{(r.userName || "U").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Text style={styles.reviewName}>{r.userName || "Customer"}</Text>
                <StarRow value={Number(r.rating) || 0} size={11} />
              </View>
              <Text style={styles.reviewBody}>{r.review}</Text>
            </View>
          </View>
        ))
      )}

      {hasMore && reviews.length > 0 && (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
          {loadingMore ? (
            <ActivityIndicator size="small" color={T.orange} />
          ) : (
            <Text style={styles.loadMoreTxt}>Load more reviews</Text>
          )}
        </TouchableOpacity>
      )}
      {!hasMore && reviews.length > 0 && (
        <Text style={styles.endTxt}>You&apos;ve seen all reviews</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
  },
  headRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "800", color: T.text },
  sub: { fontSize: 12, color: T.muted, marginTop: 2 },
  scoreBox: { alignItems: "flex-end" },
  scoreNum: { fontSize: 32, fontWeight: "800", color: T.text, lineHeight: 34 },
  scoreSub: { fontSize: 11, color: T.muted, fontWeight: "600" },
  form: { backgroundColor: T.bg, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  formLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  starPick: { flexDirection: "row", gap: 4, marginBottom: 8 },
  starBtn: { fontSize: 28, color: "#cbd5e1" },
  starBtnOn: { color: "#f59e0b" },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: T.orange,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  reviewRow: { flexDirection: "row", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontWeight: "800" },
  reviewName: { fontSize: 14, fontWeight: "700" },
  reviewBody: { fontSize: 13, color: "#475569", marginTop: 4, lineHeight: 19 },
  loader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
  loaderTxt: { fontSize: 13, color: T.muted, fontWeight: "600" },
  empty: { textAlign: "center", color: "#94a3b8", paddingVertical: 16 },
  loadMoreBtn: { paddingVertical: 14, alignItems: "center" },
  loadMoreTxt: { fontSize: 13, fontWeight: "700", color: T.orange },
  endTxt: { textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 },
});
