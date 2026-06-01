import { fetchDataFromApi } from "@/src/utils/api";
import { gmImg, GO_MARKET_FALLBACK, GO_MARKET_LOGO_FALLBACK } from "@/src/utils/goMarketMedia";
import {
  followGoRestaurant,
  followGoShop,
  unfollowGoRestaurant,
  unfollowGoShop,
  useAppDispatch,
  useAppSelector,
} from "@/src/store";
import { showToast } from "@/src/utils/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  primary: "#2563eb",
  bg: "#f8fafc",
  white: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  green: "#16a34a",
};

export default function GoMarketMarketScreen() {
  const { marketId } = useLocalSearchParams<{ marketId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLogin } = useAppSelector((s: any) => s.app);

  useEffect(() => {
    if (!isLogin) router.replace("/login" as never);
  }, [isLogin]);

  const [market, setMarket] = useState<any>(null);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState<"all" | "grocery" | "restaurant">("all");
  const [sort, setSort] = useState("rating");
  const [openOnly, setOpenOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    (pageNum: number, append: boolean) => {
      if (!marketId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams({
        type,
        sort,
        page: String(pageNum),
        limit: "12",
        search: debouncedSearch,
        ...(openOnly ? { openOnly: "true" } : {}),
        ...(minRating > 0 ? { minRating: String(minRating) } : {}),
      });
      fetchDataFromApi(`/api/go-market/markets/${marketId}/outlets?${params}`)
        .then((res) => {
          if (res?.success || res?.error === false) {
            setMarket(res.market);
            setOutlets((prev) => (append ? [...prev, ...(res.data || [])] : res.data || []));
            setTotalPages(res.pagination?.totalPages || 1);
            setPage(pageNum);
          }
        })
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [marketId, type, sort, debouncedSearch, openOnly, minRating],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const openOutlet = (o: any) => {
    if (o.outletType === "restaurant") router.push(`/go-market-restaurant/${o._id}` as never);
    else router.push(`/go-market-shop/${o._id}` as never);
  };

  const handleFollow = async (o: any) => {
    if (!isLogin) {
      showToast("error", "Please login to follow");
      router.push("/login" as never);
      return;
    }
    try {
      const isRestaurant = o.outletType === "restaurant";
      const action = o.isFollowing
        ? (isRestaurant ? unfollowGoRestaurant : unfollowGoShop)
        : (isRestaurant ? followGoRestaurant : followGoShop);
      await dispatch(action(o._id)).unwrap();
      showToast("success", o.isFollowing ? "Unfollowed" : `Following ${o.displayName}`);
      load(1, false);
    } catch {
      showToast("error", "Failed to update follow");
    }
  };

  const renderOutlet = ({ item: o }: { item: any }) => (
    <View style={S.cardWrap}>
      <TouchableOpacity onPress={() => openOutlet(o)} activeOpacity={0.92}>
        <View style={S.bannerBox}>
          <Image source={{ uri: gmImg(o.banner, GO_MARKET_FALLBACK) }} style={S.cardBanner} />
          <View style={S.typeBadge}>
            <Text style={S.typeBadgeTxt}>{o.outletType === "restaurant" ? "🍽 Restaurant" : "🛒 Grocery"}</Text>
          </View>
          {o.isOpen && (
            <View style={S.openBadge}>
              <Text style={S.openBadgeTxt}>Open</Text>
            </View>
          )}
        </View>
        <View style={S.logoWrap}>
          <Image source={{ uri: gmImg(o.logo, GO_MARKET_LOGO_FALLBACK) }} style={S.logo} />
        </View>
        <View style={S.cardBody}>
          <Text style={S.cardTitle}>{o.displayName}</Text>
          <Text style={S.cardAddr} numberOfLines={1}>{o.address}</Text>
          <View style={S.statsRow}>
            <Text style={S.stat}>⭐ {(o.rating || 0).toFixed(1)}</Text>
            <Text style={S.stat}>❤️ {o.followerCount || 0}</Text>
            <Text style={S.stat}>💬 {o.reviewCount || 0}</Text>
            <Text style={S.stat}>📦 {o.totalProducts || 0}</Text>
          </View>
          {!!o.meta && <Text style={S.meta}>{o.meta}</Text>}
        </View>
      </TouchableOpacity>
      <View style={S.cardActions}>
        <TouchableOpacity
          style={[S.followBtn, o.isFollowing && S.followBtnOn]}
          onPress={() => handleFollow(o)}
        >
          <Text style={[S.followBtnTxt, o.isFollowing && S.followBtnTxtOn]}>
            {o.isFollowing ? "✓ Following" : "❤️ Follow"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.viewBtn} onPress={() => openOutlet(o)}>
          <Text style={S.viewBtnTxt}>View shop →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListHeader = (
    <View>
      <View style={S.bannerWrap}>
        <Image source={{ uri: gmImg(market?.banner, GO_MARKET_FALLBACK) }} style={S.banner} />
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <View style={S.bannerOverlay}>
          <Text style={S.mktTitle}>{market?.name || "Market"}</Text>
          <Text style={S.mktSub}>
            {market?.city}, {market?.state}
          </Text>
        </View>
      </View>

      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {(["all", "grocery", "restaurant"] as const).map((k) => (
            <TouchableOpacity key={k} style={[S.chip, type === k && S.chipOn]} onPress={() => setType(k)}>
              <Text style={[S.chipTxt, type === k && S.chipTxtOn]}>
                {k === "all" ? "All" : k === "grocery" ? "🛒 Grocery" : "🍽 Restaurant"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={S.searchRow}>
          <Text>🔍</Text>
          <TextInput
            style={S.searchInput}
            placeholder="Search shops…"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {[
            { k: "rating", l: "Top rated" },
            { k: "name", l: "A–Z" },
            { k: "followers", l: "Popular" },
            { k: "newest", l: "Newest" },
          ].map(({ k, l }) => (
            <TouchableOpacity key={k} style={[S.chip, sort === k && S.chipOn]} onPress={() => setSort(k)}>
              <Text style={[S.chipTxt, sort === k && S.chipTxtOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[S.chip, openOnly && S.chipOn]} onPress={() => setOpenOnly(!openOnly)}>
            <Text style={[S.chipTxt, openOnly && S.chipTxtOn]}>Open now</Text>
          </TouchableOpacity>
          {[4, 3].map((r) => (
            <TouchableOpacity
              key={r}
              style={[S.chip, minRating === r && S.chipOn]}
              onPress={() => setMinRating(minRating === r ? 0 : r)}
            >
              <Text style={[S.chipTxt, minRating === r && S.chipTxtOn]}>{r}★+</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !outlets.length && <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} />}
    </View>
  );

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={outlets}
        keyExtractor={(o) => `${o.outletType}-${o._id}`}
        renderItem={renderOutlet}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 80 }}
        onEndReached={() => {
          if (page < totalPages && !loadingMore && !loading) load(page + 1, true);
        }}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={C.primary} style={{ marginVertical: 16 }} /> : null
        }
        ListEmptyComponent={
          !loading ? <Text style={S.empty}>No shops match your filters.</Text> : null
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  bannerWrap: { position: "relative" },
  banner: { width: "100%", height: 180 },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 16,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerOverlay: { position: "absolute", bottom: 16, left: 16, right: 16 },
  mktTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  mktSub: { fontSize: 12, color: "rgba(255,255,255,.9)", marginTop: 4 },
  chip: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.white,
  },
  chipOn: { backgroundColor: C.text, borderColor: C.text },
  chipTxt: { fontSize: 11, fontWeight: "700", color: C.muted },
  chipTxtOn: { color: C.white },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.white,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  cardWrap: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  bannerBox: { height: 130, position: "relative" },
  cardBanner: { width: "100%", height: "100%" },
  typeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(15,23,42,.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
  openBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openBadgeTxt: { color: C.green, fontSize: 10, fontWeight: "700" },
  logoWrap: {
    alignSelf: "center",
    marginTop: -36,
    padding: 4,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: C.white,
  },
  logo: { width: 72, height: 72, borderRadius: 14 },
  cardBody: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: C.text, textAlign: "center" },
  cardAddr: { fontSize: 12, color: C.muted, marginTop: 4, textAlign: "center" },
  statsRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 10 },
  stat: { fontSize: 11, fontWeight: "700", color: "#475569" },
  meta: { fontSize: 11, color: C.muted, textAlign: "center", marginTop: 6 },
  cardActions: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  followBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  followBtnOn: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  followBtnTxt: { fontSize: 12, fontWeight: "700", color: "#dc2626" },
  followBtnTxtOn: { color: C.green },
  viewBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    alignItems: "center",
  },
  viewBtnTxt: { fontSize: 12, fontWeight: "700", color: C.primary },
  empty: { textAlign: "center", color: C.muted, padding: 32 },
});
