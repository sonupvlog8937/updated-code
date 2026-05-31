import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  fetchGoMarketDetail,
  fetchGoMarkets,
  fetchGoNearbyMarkets,
  setGoMarketTab,
  useAppDispatch,
  useAppSelector,
} from "@/src/store";

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  orange:      "#FF6B2C",
  orangeLight: "#FFF3ED",
  orangeMid:   "#FFD4B8",
  orangeDark:  "#D94F10",
  white:       "#FFFFFF",
  bg:          "#F9F9F9",
  border:      "#EBEBEB",
  borderWarm:  "#FFE0CC",
  text:        "#111111",
  textMid:     "#555555",
  textSoft:    "#999999",
  green:       "#16A34A",
  greenLight:  "#DCFCE7",
  black:       "#111111",
};

const FALLBACK = "https://placehold.co/800x420/FFF3ED/FF6B2C?text=Go+Market";
const LOGO_FB  = "https://placehold.co/200x200/FFE0CC/FF6B2C?text=GM";
const count    = (v: any) => Array.isArray(v) ? v.length : Number(v || 0);

// ─── Skeleton Pulse ──────────────────────────────────────────────────────────
const Pulse = ({ style }: { style: any }) => {
  const a = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ backgroundColor: "#F0D8C8", borderRadius: 8 }, style, { opacity: a }]} />;
};

const SkeletonCard = () => (
  <View style={[S.marketChipCard, { padding: 14 }]}>
    <Pulse style={{ height: 16, width: "55%", marginBottom: 8 }} />
    <Pulse style={{ height: 12, width: "35%" }} />
  </View>
);

// ─── Market List Card (like screenshot: name + city in a box) ────────────────
const MarketListCard = ({ market, selected, onPress }: { market: any; selected: boolean; onPress: () => void }) => {
  const sc = useRef(new Animated.Value(1)).current;
  const tap = () => {
    Animated.sequence([
      Animated.timing(sc, { toValue: 0.96, duration: 60, useNativeDriver: true }),
      Animated.timing(sc, { toValue: 1,    duration: 60, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      <TouchableOpacity
        style={[S.marketChipCard, selected && S.marketChipCardOn]}
        onPress={tap}
        activeOpacity={0.9}
      >
        <Text style={[S.chipName, selected && S.chipNameOn]} numberOfLines={1}>
          {market.name}
        </Text>
        <Text style={[S.chipCity, selected && S.chipCityOn]} numberOfLines={1}>
          {market.city}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Store Card ──────────────────────────────────────────────────────────────
const StoreCard = ({ title, banner, logo, address, rating, followers, extra, isRestaurant, onPress }: any) => {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[S.storeCard, { transform: [{ scale: sc }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => Animated.timing(sc, { toValue: 0.975, duration: 80, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(sc, { toValue: 1,    duration: 80, useNativeDriver: true }).start()}
      >
        <View>
          <Image source={{ uri: banner || FALLBACK }} style={S.storeBanner} />
          {/* Rating pill */}
          <View style={S.ratingPill}>
            <Text style={{ fontSize: 10 }}>⭐</Text>
            <Text style={S.ratingTxt}>{rating || "—"}</Text>
          </View>
          {/* Type pill */}
          <View style={[S.typePill, isRestaurant && { backgroundColor: T.green }]}>
            <Text style={{ fontSize: 10 }}>{isRestaurant ? "🍽" : "🛒"}</Text>
            <Text style={S.typeTxt}>{isRestaurant ? "Restaurant" : "Grocery"}</Text>
          </View>
        </View>

        <View style={S.storeBody}>
          <Image source={{ uri: logo || LOGO_FB }} style={S.storeLogo} />
          <View style={S.storeInfo}>
            <Text style={S.storeName} numberOfLines={1}>{title}</Text>
            <Text style={S.storeAddr} numberOfLines={1}>📍 {address}</Text>
            <View style={S.pillRow}>
              <View style={S.pill}><Text style={{ fontSize: 10 }}>👥</Text><Text style={S.pillTxt}>{count(followers)}</Text></View>
              <View style={S.pill}><Text style={S.pillTxt}>{extra}</Text></View>
            </View>
          </View>
          <View style={S.arrowBox}>
            <Text style={S.arrowTxt}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────
const Empty = ({ icon, label }: { icon: string; label: string }) => (
  <View style={S.emptyWrap}>
    <Text style={S.emptyIco}>{icon}</Text>
    <Text style={S.emptyLbl}>{label}</Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function GoMarketScreen() {
  const dispatch = useAppDispatch();
  const router   = useRouter();

  const [search,     setSearch]     = useState("");
  const [selId,      setSelId]      = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [locBusy,    setLocBusy]    = useState(false);
  const [sortBy,     setSortBy]     = useState<"default" | "rating" | "followers">("default");
  const [filterRat,  setFilterRat]  = useState(0);

  const fade = useRef(new Animated.Value(0)).current;

  const {
    markets, nearbyMarkets, selectedMarket,
    groceryShops, restaurants, loading, error, activeTab,
  } = useAppSelector((s: any) => s.goMarket);

  useEffect(() => {
    dispatch(fetchGoMarkets(""));
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { if (selId) dispatch(fetchGoMarketDetail(selId)); }, [selId]);

  const allMarkets = useMemo(
    () => Array.from(new Map([...nearbyMarkets, ...markets].map((m: any) => [m._id, m])).values()),
    [markets, nearbyMarkets]
  );

  const sortList = (list: any[]) => {
    let out = [...list];
    if (filterRat > 0) out = out.filter(x => (x.rating || 0) >= filterRat);
    if (sortBy === "rating")    out.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === "followers") out.sort((a, b) => count(b.followers) - count(a.followers));
    return out;
  };

  const visibleShops = useMemo(() => sortList(groceryShops), [groceryShops, sortBy, filterRat]);
  const visibleRests = useMemo(() => sortList(restaurants),  [restaurants,  sortBy, filterRat]);
  const activeList   = activeTab === "grocery" ? visibleShops : visibleRests;

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchGoMarkets(search));
    setRefreshing(false);
  };

  const handleLoc = async () => {
    setLocBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Enable location to find nearby markets."); return; }
      const loc = await Location.getCurrentPositionAsync({});
      await dispatch(fetchGoNearbyMarkets({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
    } catch { Alert.alert("Error", "Could not get location."); }
    finally { setLocBusy(false); }
  };

  // Tab animated slider
  const tabAnim = useRef(new Animated.Value(0)).current;
  const switchTab = (t: "grocery" | "restaurants") => {
    Animated.timing(tabAnim, { toValue: t === "grocery" ? 0 : 1, duration: 200, useNativeDriver: false }).start();
    dispatch(setGoMarketTab(t));
    setFilterRat(0); setSortBy("default");
  };
  const sliderLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "51%"] });

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.orange} colors={[T.orange]} />
        }
      >
        {/* ── Header section (white card, like screenshot) ── */}
        <Animated.View style={[S.headerCard, { opacity: fade }]}>

          {/* "LOCAL COMMERCE" pill badge */}
          <View style={S.badgePill}>
            <View style={S.badgeDot} />
            <Text style={S.badgeTxt}>LOCAL COMMERCE</Text>
          </View>

          <Text style={S.heroTitle}>Go Market</Text>
          <Text style={S.heroCopy}>
            Browse local grocery shops & restaurants in your city. Select a market to explore.
          </Text>

          {/* Search input */}
          <View style={S.inputRow}>
            <Text style={{ fontSize: 13, color: T.textSoft }}>🔍</Text>
            <TextInput
              style={S.input}
              placeholder="Search by name, city, pincode..."
              placeholderTextColor={T.textSoft}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => dispatch(fetchGoMarkets(search))}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(""); dispatch(fetchGoMarkets("")); }}>
                <View style={S.clearX}><Text style={{ fontSize: 9, color: T.textSoft }}>✕</Text></View>
              </TouchableOpacity>
            )}
          </View>

          {/* Select Market (dropdown-style row) */}
          <View style={S.inputRow}>
            <Text style={{ fontSize: 13 }}>📍</Text>
            <Text style={[S.input, { color: selId ? T.text : T.textSoft, flex: 1, paddingVertical: 0 }]} numberOfLines={1}>
              {selId && allMarkets.find((m: any) => m._id === selId)
                ? allMarkets.find((m: any) => m._id === selId)!.name
                : "Select Market"}
            </Text>
            <Text style={{ fontSize: 12, color: T.textSoft }}>▾</Text>
          </View>

          {/* Search button */}
          <TouchableOpacity
            style={S.searchBtn}
            onPress={() => dispatch(fetchGoMarkets(search))}
            activeOpacity={0.88}
          >
            <Text style={S.searchBtnTxt}>Search</Text>
          </TouchableOpacity>

          {/* Nearby button */}
          <TouchableOpacity
            style={S.nearbyBtn}
            onPress={handleLoc}
            disabled={locBusy}
            activeOpacity={0.85}
          >
            {locBusy
              ? <ActivityIndicator size="small" color={T.orange} />
              : <>
                  <Text style={{ fontSize: 13 }}>🧭</Text>
                  <Text style={S.nearbyTxt}>Nearby</Text>
                </>
            }
          </TouchableOpacity>
        </Animated.View>

        {/* ── All Markets section (light grey card, like screenshot) ── */}
        {(allMarkets.length > 0 || loading) && (
          <View style={S.marketsCard}>

            {/* Section header row */}
            <View style={S.marketSecHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 14 }}>🏪</Text>
                <Text style={S.marketSecTitle}>All Markets</Text>
              </View>
              <View style={S.foundBadge}>
                <Text style={S.foundTxt}>{allMarkets.length} found</Text>
              </View>
            </View>

            {/* Market list */}
            {loading && !selectedMarket
              ? [1, 2].map(i => <SkeletonCard key={i} />)
              : allMarkets.map((m: any) => (
                  <MarketListCard
                    key={m._id}
                    market={m}
                    selected={selId === m._id}
                    onPress={() => setSelId(m._id)}
                  />
                ))
            }

            {!loading && error && (
              <Text style={S.noResultTxt}>No markets found. Try a different search.</Text>
            )}
          </View>
        )}

        {/* Initial empty state */}
        {!loading && !error && allMarkets.length === 0 && (
          <View style={S.marketsCard}>
            <Empty icon="🔍" label="Search for markets above" />
          </View>
        )}

        {/* ── Selected Market detail ── */}
        {selectedMarket && (
          <View style={S.detailWrap}>

            {/* Market banner */}
            <View style={S.bannerWrap}>
              <Image source={{ uri: selectedMarket.banner || FALLBACK }} style={S.mktBanner} />
              <View style={S.bannerScrim} />
              <View style={S.bannerOverlay}>
                <Text style={S.mktName}>{selectedMarket.name}</Text>
                <Text style={S.mktAddr}>
                  {selectedMarket.city}, {selectedMarket.state} — {selectedMarket.pincode}
                </Text>
              </View>
            </View>

            {/* Grocery / Restaurants tab (like screenshot: pill buttons with count) */}
            <View style={S.tabWrap}>
              <Animated.View style={[S.tabSlider, { left: sliderLeft, width: "47%" }]} />
              <TouchableOpacity style={S.tabBtn} onPress={() => switchTab("grocery")} activeOpacity={0.8}>
                <Text style={{ fontSize: 11 }}>🛒</Text>
                <Text style={[S.tabLbl, activeTab === "grocery" && S.tabLblOn]}>Grocery</Text>
                <View style={[S.tabCount, activeTab === "grocery" && S.tabCountOn]}>
                  <Text style={[S.tabCountTxt, activeTab === "grocery" && { color: T.white }]}>
                    {groceryShops.length}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={S.tabBtn} onPress={() => switchTab("restaurants")} activeOpacity={0.8}>
                <Text style={{ fontSize: 11 }}>🍽</Text>
                <Text style={[S.tabLbl, activeTab === "restaurants" && S.tabLblOn]}>Restaurants</Text>
                <View style={[S.tabCount, activeTab === "restaurants" && S.tabCountOn]}>
                  <Text style={[S.tabCountTxt, activeTab === "restaurants" && { color: T.white }]}>
                    {restaurants.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Sort / filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterRow}>
              {(["default", "rating", "followers"] as const).map(k => (
                <TouchableOpacity
                  key={k}
                  style={[S.fChip, sortBy === k && S.fChipOn]}
                  onPress={() => setSortBy(k)}
                >
                  <Text style={[S.fChipTxt, sortBy === k && S.fChipTxtOn]}>
                    {k === "default" ? "Default" : k === "rating" ? "⭐ Top Rated" : "🔥 Popular"}
                  </Text>
                </TouchableOpacity>
              ))}
              {[4, 3].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[S.fChip, filterRat === r && S.fChipOn]}
                  onPress={() => setFilterRat(filterRat === r ? 0 : r)}
                >
                  <Text style={[S.fChipTxt, filterRat === r && S.fChipTxtOn]}>⭐ {r}+</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Store list */}
            {loading
              ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
              : activeList.length === 0
                ? <Empty
                    icon={activeTab === "grocery" ? "🛒" : "🍽"}
                    label={`No ${activeTab === "grocery" ? "grocery shops" : "restaurants"} in this market`}
                  />
                : activeList.map((item: any) => {
                    const isR = activeTab === "restaurants";
                    return (
                      <StoreCard
                        key={item._id}
                        title={isR ? item.restaurantName : item.shopName}
                        banner={isR ? item.restaurantBanner : item.shopBanner}
                        logo={isR ? item.restaurantLogo : item.shopLogo}
                        address={item.address}
                        rating={item.rating}
                        followers={item.followers}
                        extra={isR ? `${item.totalMenus} menus · ${item.totalItems} items` : `${item.totalProducts} products`}
                        isRestaurant={isR}
                        onPress={() => router.push(isR ? `/go-market-restaurant/${item._id}` : `/go-market-shop/${item._id}`)}
                      />
                    );
                  })
            }
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },
  scroll: { paddingBottom: 100 },

  // ── Header Card (white bg, padding, like screenshot top section) ──
  headerCard: {
    backgroundColor: T.white,
    marginHorizontal: 14,
    marginTop: Platform.OS === "ios" ? 54 : 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: T.border,
  },

  // Badge pill "LOCAL COMMERCE"
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
    backgroundColor: T.white,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.green,
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: "800",
    color: T.textMid,
    letterSpacing: 0.8,
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: T.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroCopy: {
    fontSize: 13,
    color: T.textSoft,
    lineHeight: 19,
    marginBottom: 20,
  },

  // Input rows (search + select market)
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 5,
    backgroundColor: T.white,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: T.text,
    fontWeight: "500",
  },
  clearX: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },

  // Search button (black, full width)
  searchBtn: {
    backgroundColor: T.black,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  searchBtnTxt: {
    color: T.white,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Nearby button (outline)
  nearbyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: T.white,
    minHeight: 48,
  },
  nearbyTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: T.textMid,
  },

  // ── Markets Card (grey section, like screenshot) ──
  marketsCard: {
    backgroundColor: T.white,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: T.border,
  },

  marketSecHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  marketSecTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: T.text,
  },
  foundBadge: {
    backgroundColor: T.orangeLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: T.borderWarm,
  },
  foundTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: T.orange,
  },

  // Market chip card (like screenshot: name bold, city small below)
  marketChipCard: {
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
    backgroundColor: T.white,
  },
  marketChipCardOn: {
    borderColor: T.orange,
    backgroundColor: T.orangeLight,
  },
  chipName:   { fontSize: 13.5, fontWeight: "800", color: T.text, marginBottom: 2 },
  chipNameOn: { color: T.orangeDark },
  chipCity:   { fontSize: 11, color: T.textSoft, fontWeight: "500" },
  chipCityOn: { color: T.orange },

  noResultTxt: {
    fontSize: 13,
    color: T.textSoft,
    textAlign: "center",
    paddingVertical: 16,
  },

  // ── Detail section ──
  detailWrap: {
    marginHorizontal: 14,
  },

  // Market banner
  bannerWrap: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  mktBanner:  { width: "100%", height: 170 },
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  mktName: {
    fontSize: 22,
    fontWeight: "900",
    color: T.white,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  mktAddr: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    fontWeight: "600",
  },

  // ── Tab bar (like screenshot: Grocery 0 | Restaurants 0) ──
  tabWrap: {
    flexDirection: "row",
    backgroundColor: T.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.border,
    padding: 4,
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  tabSlider: {
    position: "absolute",
    top: 4,
    bottom: 4,
    backgroundColor: T.black,
    borderRadius: 11,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    zIndex: 1,
  },
  tabLbl:   { fontSize: 12.5, fontWeight: "700", color: T.textMid },
  tabLblOn: { color: T.white },
  tabCount: {
    backgroundColor: T.border,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  tabCountOn: { backgroundColor: T.orange },
  tabCountTxt: { fontSize: 10, fontWeight: "800", color: T.textMid },

  // ── Filter chips ──
  filterRow: {
    gap: 8,
    paddingBottom: 10,
  },
  fChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: T.white,
  },
  fChipOn:    { backgroundColor: T.orange, borderColor: T.orange },
  fChipTxt:   { fontSize: 11, fontWeight: "700", color: T.textMid },
  fChipTxtOn: { color: T.white },

  // ── Store Card ──
  storeCard: {
    backgroundColor: T.white,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  storeBanner: { width: "100%", height: 125 },
  ratingPill: {
    position: "absolute",
    top: 9, right: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingTxt: { color: T.white, fontSize: 11, fontWeight: "800" },
  typePill: {
    position: "absolute",
    top: 9, left: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.orange,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  typeTxt: { color: T.white, fontSize: 10, fontWeight: "800" },

  storeBody: {
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  storeLogo: {
    width: 46,
    height: 46,
    borderRadius: 12,
    marginTop: -30,
    borderWidth: 2.5,
    borderColor: T.white,
    backgroundColor: T.orangeLight,
  },
  storeInfo: { flex: 1 },
  storeName: {
    fontSize: 14,
    fontWeight: "900",
    color: T.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  storeAddr: { fontSize: 11, color: T.textSoft, marginBottom: 7 },

  pillRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: T.orangeLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: T.borderWarm,
  },
  pillTxt: { fontSize: 10, fontWeight: "700", color: T.orangeDark },

  arrowBox: {
    width: 28, height: 28,
    borderRadius: 9,
    backgroundColor: T.orangeLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: T.borderWarm,
  },
  arrowTxt: { fontSize: 18, color: T.orange, fontWeight: "700", lineHeight: 24 },

  // ── Empty ──
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  emptyIco: { fontSize: 36, opacity: 0.45 },
  emptyLbl: { fontSize: 13, color: T.textSoft, fontWeight: "600", textAlign: "center" },
});