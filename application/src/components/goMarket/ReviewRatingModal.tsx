import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchDataFromApi, postData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const C = {
  primary: "#2563eb",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  white: "#ffffff",
};

type Mode = "outlet" | "product";

type Props = {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
  title: string;
  isLogin: boolean;
  onLoginRequired: () => void;
  outletId?: string;
  outletType?: "grocery" | "restaurant";
  productId?: string;
  userName?: string;
  initialAverage?: number;
  initialTotal?: number;
  onStatsChange?: (s: { averageRating: number; totalReviews: number }) => void;
};

const StarRow = ({ value, size = 14 }: { value: number; size?: number }) => (
  <Text style={{ fontSize: size, color: "#f59e0b" }}>
    {[1, 2, 3, 4, 5].map((i) => (value >= i ? "★" : "☆")).join("")}
  </Text>
);

function buildUrl(mode: Mode, p: { outletId?: string; outletType?: string; productId?: string }, page: number) {
  if (mode === "product") {
    return `/api/product/reviews/${p.productId}?page=${page}&limit=8&sort=NEWEST`;
  }
  const base =
    p.outletType === "restaurant"
      ? `/api/go-market/restaurants/${p.outletId}/reviews`
      : `/api/go-market/grocery-shops/${p.outletId}/reviews`;
  return `${base}?page=${page}&limit=8&sort=NEWEST`;
}

export function ReviewRatingModal({
  visible,
  onClose,
  mode,
  title,
  isLogin,
  onLoginRequired,
  outletId,
  outletType = "grocery",
  productId,
  userName = "",
  initialAverage = 0,
  initialTotal = 0,
  onStatsChange,
}: Props) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [avgRating, setAvgRating] = useState(initialAverage);
  const [totalReviews, setTotalReviews] = useState(initialTotal);
  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await fetchDataFromApi(
          buildUrl(mode, { outletId, outletType, productId }, pageNum),
        );
        const payload = res?.data || res;
        const list = payload?.reviews || [];
        setReviews((prev) => (append ? [...prev, ...list] : list));
        const more = Boolean(payload?.hasMore);
        setHasMore(more);
        setPage(pageNum);
        const avg = payload?.averageRating ?? payload?.avgRating;
        const total = payload?.totalReviews ?? payload?.total;
        if (avg != null) setAvgRating(Number(avg));
        if (total != null) {
          setTotalReviews(total);
          onStatsChange?.({ averageRating: Number(avg ?? 0), totalReviews: total });
        }
      } catch {
        if (!append) setReviews([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [mode, outletId, outletType, productId, onStatsChange],
  );

  useEffect(() => {
    if (!visible) return;
    setReviews([]);
    setDraftText("");
    setDraftRating(5);
    setHasMore(true);
    setAvgRating(initialAverage);
    setTotalReviews(initialTotal);
    loadPage(1, false);
  }, [visible, outletId, productId, outletType]);

  const submitReview = async () => {
    if (!isLogin) {
      showToast("error", "Login to leave a review");
      onLoginRequired();
      return;
    }
    if (!draftText.trim()) {
      showToast("error", "Please write your review");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "product") {
        const res = await postData("/api/product/reviews/add", {
          productId,
          rating: draftRating,
          review: draftText.trim(),
          userName: userName || "Customer",
        });
        if (res?.error) throw new Error(res.message);
      } else {
        const url =
          outletType === "restaurant"
            ? `/api/go-market/restaurants/${outletId}/reviews`
            : `/api/go-market/grocery-shops/${outletId}/reviews`;
        const res = await postData(url, { rating: draftRating, review: draftText.trim() });
        if (res?.error) throw new Error(res.message);
      }
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

  const renderReview = ({ item: r }: { item: any }) => (
    <View style={styles.reviewRow}>
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
  );

  const header = (
    <View>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreBig}>{Number(avgRating || 0).toFixed(1)}</Text>
        <View>
          <StarRow value={avgRating} size={16} />
          <Text style={styles.scoreSub}>{totalReviews} reviews</Text>
        </View>
      </View>
      <View style={styles.form}>
        <Text style={styles.formLabel}>Your rating</Text>
        <View style={styles.starPick}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setDraftRating(s)}>
              <Text style={[styles.starBtn, draftRating >= s && styles.starOn]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Share your experience…"
          placeholderTextColor="#94a3b8"
          multiline
          value={draftText}
          onChangeText={setDraftText}
          maxLength={2000}
        />
        <TouchableOpacity style={styles.submitBtn} onPress={submitReview} disabled={submitting}>
          <Text style={styles.submitTxt}>{submitting ? "Submitting…" : "Submit review"}</Text>
        </TouchableOpacity>
      </View>
      {loading && reviews.length === 0 && (
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} />
          <Text style={styles.muted}>Loading reviews…</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Reviews & ratings</Text>
              <Text style={styles.modalSub} numberOfLines={1}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={reviews}
            keyExtractor={(item, i) => item._id || String(i)}
            renderItem={renderReview}
            ListHeaderComponent={header}
            ListEmptyComponent={
              !loading ? <Text style={[styles.muted, { textAlign: "center", padding: 20 }]}>No reviews yet</Text> : null
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={C.primary} style={{ padding: 16 }} />
              ) : !hasMore && reviews.length > 0 ? (
                <Text style={[styles.muted, { textAlign: "center", padding: 12 }]}>All reviews loaded</Text>
              ) : null
            }
            onEndReached={() => {
              if (hasMore && !loadingMore && !loading) loadPage(page + 1, true);
            }}
            onEndReachedThreshold={0.3}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ReviewsRatingButton({
  averageRating = 0,
  totalReviews = 0,
  onPress,
}: {
  averageRating?: number;
  totalReviews?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.triggerBtn} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.triggerIcon}>💬</Text>
      <Text style={styles.triggerTxt}>
        <Text style={styles.triggerBold}>{Number(averageRating || 0).toFixed(1)}★ </Text>
        Reviews ({totalReviews || 0})
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
  panel: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    minHeight: "55%",
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  modalSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: { fontSize: 18, color: "#334155", fontWeight: "600" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  scoreBig: { fontSize: 40, fontWeight: "800", color: C.text },
  scoreSub: { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 4 },
  form: { backgroundColor: C.bg, borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  formLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6, color: C.text },
  starPick: { flexDirection: "row", gap: 4, marginBottom: 8 },
  starBtn: { fontSize: 28, color: "#cbd5e1" },
  starOn: { color: "#f59e0b" },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    backgroundColor: C.white,
  },
  submitBtn: { marginTop: 10, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  submitTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  reviewRow: { flexDirection: "row", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontWeight: "800" },
  reviewName: { fontSize: 14, fontWeight: "700", color: C.text },
  reviewBody: { fontSize: 13, color: "#475569", marginTop: 4, lineHeight: 19 },
  center: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
  muted: { fontSize: 13, color: C.muted },
  triggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  triggerIcon: { fontSize: 14 },
  triggerTxt: { fontSize: 13, fontWeight: "600", color: C.text },
  triggerBold: { fontWeight: "800", color: C.primary },
});
