import { fetchDataFromApi } from "@/src/utils/api";
import { gmImg, GO_MARKET_FALLBACK, GO_MARKET_LOGO_FALLBACK } from "@/src/utils/goMarketMedia";
import { getOutletBaseMinutes, getOutletDistanceEta } from "@/src/utils/geoCoords";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  followGoRestaurant,
  followGoShop,
  unfollowGoRestaurant,
  unfollowGoShop,
  useAppDispatch,
  useAppSelector,
} from "@/src/store";
import { showToast } from "@/src/utils/toast";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GM_LOC_KEY = "gm_user_location";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  // Brand palette
  primary: "#1A56DB",
  primaryLight: "#EBF2FF",
  primaryMid: "#3B82F6",
  accent: "#F59E0B",

  // Backgrounds
  bg: "#F6F8FC",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFBFD",

  // Text
  text: "#111827",
  textSub: "#374151",
  muted: "#6B7280",
  placeholder: "#9CA3AF",

  // Status
  green: "#059669",
  greenBg: "#ECFDF5",
  greenBorder: "#A7F3D0",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FCA5A5",
  amber: "#D97706",
  amberBg: "#FFFBEB",

  // Borders
  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  // Type badges
  restaurantBg: "#FFF3E4",
  restaurantText: "#B45309",
  groceryBg: "#EBF5FF",
  groceryText: "#1D4ED8",
  fashionBg: "#FDF2F8",
  fashionText: "#BE185D",
  electronicsBg: "#F0FDF4",
  electronicsText: "#15803D",
  medicalBg: "#FEF2F2",
  medicalText: "#DC2626",
  beautyBg: "#FFF7ED",
  beautyText: "#C2410C",
  defaultBg: "#F3F4F6",
  defaultText: "#4B5563",

  // Radii
  r4: 4,
  r8: 8,
  r12: 12,
  r16: 16,
  r24: 24,
  r999: 999,
};

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={[S.cardWrap, { opacity }]}>
      <View style={[S.skeletonBanner, { backgroundColor: T.borderLight }]} />
      <View style={S.skeletonLogoWrap}>
        <View style={[S.skeletonLogo, { backgroundColor: T.border }]} />
      </View>
      <View style={S.cardBody}>
        <View style={[S.skeletonLine, { width: "55%", alignSelf: "center" }]} />
        <View style={[S.skeletonLine, { width: "40%", alignSelf: "center", marginTop: 6 }]} />
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[S.skeletonLine, { width: 44, height: 16 }]} />
          ))}
        </View>
      </View>
      <View style={[S.cardActions, { gap: 10 }]}>
        <View style={[S.skeletonLine, { flex: 1, height: 38 }]} />
        <View style={[S.skeletonLine, { flex: 1, height: 38 }]} />
      </View>
    </Animated.View>
  );
}

// ─── Follow button with animation ──────────────────────────────────────────────
function FollowButton({ isFollowing, onPress }: { isFollowing: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity
        style={[S.followBtn, isFollowing && S.followBtnOn]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Text style={[S.followBtnTxt, isFollowing && S.followBtnTxtOn]}>
          {isFollowing ? "✓  Following" : "♡  Follow"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Type badge ────────────────────────────────────────────────────────────────
const SHOP_TYPE_CONFIG: Record<string, { icon: string; label: string; bg: string; color: string }> = {
  restaurant: { icon: "🍽", label: "Restaurant", bg: T.restaurantBg, color: T.restaurantText },
  grocery: { icon: "🛒", label: "Grocery", bg: T.groceryBg, color: T.groceryText },
  fashion: { icon: "👕", label: "Fashion", bg: T.fashionBg, color: T.fashionText },
  electronics: { icon: "📱", label: "Electronics", bg: T.electronicsBg, color: T.electronicsText },
  medical: { icon: "💊", label: "Medical", bg: T.medicalBg, color: T.medicalText },
  beauty: { icon: "💄", label: "Beauty", bg: T.beautyBg, color: T.beautyText },
  home_kitchen: { icon: "🏠", label: "Home & Kitchen", bg: T.defaultBg, color: T.defaultText },
  gifts_toys: { icon: "🎁", label: "Gifts & Toys", bg: T.defaultBg, color: T.defaultText },
  books_stationery: { icon: "📚", label: "Books", bg: T.defaultBg, color: T.defaultText },
  jewellery: { icon: "💎", label: "Jewellery", bg: T.defaultBg, color: T.defaultText },
  hardware: { icon: "🔧", label: "Hardware", bg: T.defaultBg, color: T.defaultText },
  automobile: { icon: "🚗", label: "Automobile", bg: T.defaultBg, color: T.defaultText },
};

function TypeBadge({ type }: { type: string }) {
  const config = SHOP_TYPE_CONFIG[type] || SHOP_TYPE_CONFIG.grocery;
  return (
    <View style={[S.typeBadge, { backgroundColor: config.bg }]}>
      <Text style={[S.typeBadgeTxt, { color: config.color }]}>
        {config.icon}  {config.label}
      </Text>
    </View>
  );
}

// ─── Rating pill ───────────────────────────────────────────────────────────────
function RatingPill({ value }: { value: number }) {
  const color = value >= 4 ? T.green : value >= 3 ? T.amber : T.red;
  const bg = value >= 4 ? T.greenBg : value >= 3 ? T.amberBg : T.redBg;
  return (
    <View style={[S.ratingPill, { backgroundColor: bg }]}>
      <Text style={[S.ratingPillTxt, { color }]}>★ {value.toFixed(1)}</Text>
    </View>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <View style={S.emptyWrap}>
      <Text style={S.emptyEmoji}>🏪</Text>
      <Text style={S.emptyTitle}>No shops found</Text>
      <Text style={S.emptySub}>
        {hasFilters ? "Try adjusting your filters or clear them to see all shops." : "This market has no shops yet."}
      </Text>
      {hasFilters && (
        <TouchableOpacity style={S.emptyBtn} onPress={onClear}>
          <Text style={S.emptyBtnTxt}>Clear filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

const sortFollowedOutlets = (rows: any[]) =>
  [...rows].sort((a, b) =>
    Number(Boolean(b.isFollowing)) - Number(Boolean(a.isFollowing)) ||
    (Number(b.rating || 0) - Number(a.rating || 0)) ||
    String(a.displayName || "").localeCompare(String(b.displayName || ""))
  );
export default function GoMarketMarketScreen() {
  const { marketId } = useLocalSearchParams<{ marketId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLogin, userData } = useAppSelector((s: any) => s.app);
  const [authChecked, setAuthChecked] = useState(false);

  // Wait for auth to be checked before redirecting
  useEffect(() => {
    const checkAuth = async () => {
      // Give time for initAuthFromStorage to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked && !isLogin) {
      router.replace("/login" as never);
    }
  }, [isLogin, authChecked]);

  const [market, setMarket] = useState<any>(null);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [type, setType] = useState<"all" | "grocery" | "restaurant" | "fashion" | "electronics" | "medical" | "beauty" | "home_kitchen" | "gifts_toys" | "books_stationery" | "jewellery" | "hardware" | "automobile">("all");
  const [sort, setSort] = useState("rating");
  const [openOnly, setOpenOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const locationSourceRef = useRef<"gps" | "address" | "cache" | null>(null);

  const applyAddressFallback = useCallback(() => {
    if (locationSourceRef.current === "gps") return;
    const addresses: any[] = userData?.address_details || [];
    const selected = addresses.find((a: any) => a.selected) || addresses[0];
    if (selected?.latitude && selected?.longitude) {
      locationSourceRef.current = "address";
      const loc = { lat: Number(selected.latitude), lng: Number(selected.longitude) };
      setUserLocationState(loc);
      AsyncStorage.setItem(GM_LOC_KEY, JSON.stringify(loc)).catch(() => {});
    }
  }, [userData]);

  const setUserLocation = useCallback((loc: { lat: number; lng: number }, source: "gps" | "address" | "cache" = "cache") => {
    if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return;
    if (locationSourceRef.current === "gps" && source !== "gps") return;
    locationSourceRef.current = source;
    setUserLocationState(loc);
    AsyncStorage.setItem(GM_LOC_KEY, JSON.stringify(loc)).catch(() => {});
  }, []);

  const refreshCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        applyAddressFallback();
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude }, "gps");
    } catch {
      applyAddressFallback();
    }
  }, [setUserLocation, applyAddressFallback]);

  const searchInputRef = useRef<TextInput>(null);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const listScrollY = useRef(new Animated.Value(0)).current;

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Restore cached location, then address while GPS loads
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(GM_LOC_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        if (Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng)) {
          setUserLocation({ lat: parsed.lat, lng: parsed.lng }, "cache");
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [setUserLocation]);

  useEffect(() => {
    if (locationSourceRef.current) return;
    applyAddressFallback();
  }, [userData, applyAddressFallback]);

  // Refresh GPS ONLY when explicitly requested - do NOT auto-fetch on focus
  // useFocusEffect(
  //   useCallback(() => {
  //     refreshCurrentLocation();
  //   }, [refreshCurrentLocation]),
  // );

  // ── Suggestions disabled for Go Market ──
  // useEffect(() => {
  //   if (search.trim().length < 1) {
  //     setSuggestions([]);
  //     setShowSuggestions(false);
  //     return;
  //   }
  //   setLoadingSuggestions(true);
  //   setShowSuggestions(true);
  //   const params = new URLSearchParams({ q: search.trim(), type, limit: "8" });
  //   fetchDataFromApi(`/api/go-market/markets/${marketId}/shop-suggestions?${params}`)
  //     .then((res) => {
  //       if (res?.success || res?.error === false) setSuggestions(res.suggestions || []);
  //     })
  //     .catch(() => setSuggestions([]))
  //     .finally(() => setLoadingSuggestions(false));
  // }, [search, marketId, type]);

  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  // ── Load outlets ──
  const load = useCallback(
    (pageNum: number, append: boolean) => {
      if (!marketId) return;
      if (append) {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOutlets([]);  // clear immediately so skeleton shows on tab/filter change
        hasMoreRef.current = true;
        setHasMore(true);
      }
      const params = new URLSearchParams({
        type, sort,
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
            const newOutlets = res.data || [];
            setOutlets((prev) => (append ? [...prev, ...newOutlets] : newOutlets));
            setTotalPages(res.pagination?.totalPages || 1);
            setPage(pageNum);
            const cur = res.pagination?.currentPage || pageNum;
            const total = res.pagination?.totalPages || 1;
            setHasMore(cur < total);
            hasMoreRef.current = cur < total;
          }
        })
        .catch(() => {
          setHasMore(false);
          hasMoreRef.current = false;
        })
        .finally(() => {
          setLoading(false);
          loadingMoreRef.current = false;
          setLoadingMore(false);
          setRefreshing(false);
        });
    },
    [marketId, type, sort, debouncedSearch, openOnly, minRating],
  );

  useEffect(() => {
    load(1, false);
  }, [type, sort, debouncedSearch, openOnly, minRating, marketId, load]);

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore && page < totalPages) load(page + 1, true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    refreshCurrentLocation();
    load(1, false);
  };

  const clearAllFilters = () => {
    setType("all");
    setSort("rating");
    setOpenOnly(false);
    setMinRating(0);
    setSearch("");
    setDebouncedSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (s: any) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setSearch("");
    if (s.type === "restaurant") router.push(`/go-market-restaurant/${s._id}` as never);
    else router.push(`/go-market-shop/${s._id}` as never);
  };

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
    const isRestaurant = o.outletType === "restaurant";
    const wasFollowing = o.isFollowing || followingIds.has(o._id);
    // Optimistic update
    setFollowingIds((prev) => {
      const next = new Set(prev);
      wasFollowing ? next.delete(o._id) : next.add(o._id);
      return next;
    });
    setOutlets((prev) => sortFollowedOutlets(prev.map((x) => x._id === o._id ? { ...x, isFollowing: !wasFollowing, followerCount: Math.max(0, (x.followerCount || 0) + (wasFollowing ? -1 : 1)) } : x)));
    try {
      const action = wasFollowing
        ? (isRestaurant ? unfollowGoRestaurant : unfollowGoShop)
        : (isRestaurant ? followGoRestaurant : followGoShop);
      await dispatch(action(o._id)).unwrap();
      showToast("success", wasFollowing ? "Unfollowed" : `Following ${o.displayName}`);
    } catch {
      // Revert on failure
      setOutlets((prev) => sortFollowedOutlets(prev.map((x) => x._id === o._id ? { ...x, isFollowing: wasFollowing, followerCount: Math.max(0, (x.followerCount || 0) + (wasFollowing ? 1 : -1)) } : x)));
      showToast("error", "Failed to update follow");
    }
  };

  const handleShare = async (o: any) => {
    try {
      await Share.share({
        message: `Check out ${o.displayName} on GoMarket!\n${o.address}`,
        title: o.displayName,
      });
    } catch { /* silent */ }
  };

  const hasActiveFilters = type !== "all" || sort !== "rating" || openOnly || minRating > 0 || !!search;

  // ─────────────────────────────────────────────────────────────────────────────
  // Outlet card
  // ─────────────────────────────────────────────────────────────────────────────
  const renderOutlet = ({ item: o, index }: { item: any; index: number }) => {
    const isFollowing = o.isFollowing;

    const { distanceDisplay, estimatedTime } = getOutletDistanceEta({
      userLat: userLocation?.lat ?? null,
      userLng: userLocation?.lng ?? null,
      shopLat: o.latitude,
      shopLng: o.longitude,
      marketLat: market?.latitude,
      marketLng: market?.longitude,
      baseMinutes: getOutletBaseMinutes(o.outletType),
    });
    
    // Debug log
    if (index === 0) {
      console.log('🔍 Distance Debug:', {
        userLocation,
        shopCoords: { lat: o.latitude, lng: o.longitude },
        marketCoords: { lat: market?.latitude, lng: market?.longitude },
        distanceDisplay,
        estimatedTime
      });
    }
    
    return (
      <View style={S.cardWrap}>
        {/* Banner */}
        <TouchableOpacity onPress={() => openOutlet(o)} activeOpacity={0.93}>
          <View style={S.bannerBox}>
            <Image
              source={{ uri: gmImg(o.banner, GO_MARKET_FALLBACK) }}
              style={S.cardBanner}
              resizeMode="cover"
            />
            {/* Gradient overlay */}
            <View style={S.bannerGradient} />

            <TypeBadge type={o.outletType} />

            {/* Top-right: Open badge + share */}
            <View style={{ position: "absolute", top: 10, right: 10, flexDirection: "row", gap: 6 }}>
              {o.isOpen && (
                <View style={S.openBadge}>
                  <View style={S.openDot} />
                  <Text style={S.openBadgeTxt}>Open</Text>
                </View>
              )}
              <TouchableOpacity style={S.shareIconBtn} onPress={() => handleShare(o)}>
                <Text style={{ fontSize: 14 }}>↗</Text>
              </TouchableOpacity>
            </View>

            {/* Rating overlay on banner */}
            <View style={{ position: "absolute", bottom: 10, right: 10 }}>
              <RatingPill value={o.rating || 0} />
            </View>
          </View>

          {/* Logo */}
          <View style={S.logoWrap}>
            <Image
              source={{ uri: gmImg(o.logo, GO_MARKET_LOGO_FALLBACK) }}
              style={S.logo}
              resizeMode="cover"
            />
          </View>

          {/* Body */}
          <View style={S.cardBody}>
            <Text style={S.cardTitle}>{o.displayName}</Text>
            <Text style={S.cardAddr} numberOfLines={1}>
              📍 {o.address}
            </Text>

            {/* Stats row */}
            <View style={S.statsRow}>
              <StatChip icon="❤️" value={o.followerCount || 0} label="followers" />
              <StatChip icon="💬" value={o.reviewCount || 0} label="reviews" />
              <StatChip icon="📦" value={o.totalProducts || 0} label="items" />
            </View>

            {/* Distance & Delivery Time */}
            {distanceDisplay != null && (
              <View style={S.distanceRow}>
                <View style={S.distanceChip}>
                  <Text style={S.distanceIcon}>📍</Text>
                  <Text style={S.distanceText}>{distanceDisplay}</Text>
                </View>
                {estimatedTime != null && (
                  <View style={[S.distanceChip, { backgroundColor: "#FEF3C7" }]}>
                    <Text style={S.distanceIcon}>🕐</Text>
                    <Text style={[S.distanceText, { color: "#92400E" }]}>{estimatedTime} min</Text>
                  </View>
                )}
              </View>
            )}

            {!!o.meta && (
              <View style={S.metaChip}>
                <Text style={S.metaChipTxt} numberOfLines={1}>{o.meta}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={S.cardActions}>
          <FollowButton isFollowing={isFollowing} onPress={() => handleFollow(o)} />
          <TouchableOpacity style={S.viewBtn} onPress={() => openOutlet(o)} activeOpacity={0.85}>
            <Text style={S.viewBtnTxt}>View →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // List header
  // ─────────────────────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Hero banner */}
      <View style={S.heroBannerWrap}>
        <Image
          source={{ uri: gmImg(market?.banner, GO_MARKET_FALLBACK) }}
          style={S.heroBanner}
          resizeMode="cover"
        />
        <View style={S.heroOverlay} />
        
        {/* Change Market Button */}
        {/* <TouchableOpacity 
          style={S.changeMarketBtn}
          onPress={() => router.push("/go-market?edit=true" as never)}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 14, marginRight: 4 }}>✏️</Text>
          <Text style={S.changeMarketBtnTxt}>Change Market</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={[S.changeMarketBtn, { top: 62, backgroundColor: T.green }]}
          onPress={() => router.push("/go-market?edit=true&updateLocation=true" as never)}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 14, marginRight: 4 }}>📍</Text>
          <Text style={S.changeMarketBtnTxt}>Update Location</Text>
        </TouchableOpacity>
        
        <View style={S.heroContent}>
          {market && (
            <View style={S.marketTypePill}>
              <Text style={S.marketTypePillTxt}>🏪 GoMarket</Text>
            </View>
          )}
          <Text style={S.heroTitle}>{market?.name || "Market"}</Text>
          <Text style={S.heroSub}>
            {market ? `📍 ${market.city}, ${market.state}` : "Loading…"}
          </Text>
          {market?.totalShops > 0 && (
            <Text style={S.heroCount}>{market.totalShops}+ shops available</Text>
          )}
        </View>
      </View>

      {/* Filters container */}
      <View style={S.filtersContainer}>
        {/* Type tabs - Horizontal Scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        >
          {[
            { k: "all", l: "All Shops", icon: "🏪" },
            { k: "grocery", l: "Grocery", icon: "🛒" },
            { k: "restaurant", l: "Restaurant", icon: "🍽" },
            { k: "fashion", l: "Fashion", icon: "👕" },
            { k: "electronics", l: "Electronics", icon: "📱" },
            { k: "medical", l: "Medical", icon: "💊" },
            { k: "beauty", l: "Beauty", icon: "💄" },
            { k: "home_kitchen", l: "Home & Kitchen", icon: "🏠" },
            { k: "gifts_toys", l: "Gifts & Toys", icon: "🎁" },
            { k: "books_stationery", l: "Books & Stationery", icon: "📚" },
            { k: "jewellery", l: "Jewellery", icon: "💎" },
            { k: "hardware", l: "Hardware", icon: "🔧" },
            { k: "automobile", l: "Automobile", icon: "🚗" },
          ].map(({ k, l, icon }) => (
            <TouchableOpacity
              key={k}
              style={[S.chip, type === k && S.chipOn]}
              onPress={() => setType(k as any)}
              activeOpacity={0.8}
            >
              <Text style={[S.chipTxt, type === k && S.chipTxtOn]}>
                {icon}  {l}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search bar */}
        <View style={{ position: "relative", zIndex: 100 }}>
          <View style={[S.searchBar, showSuggestions && suggestions.length > 0 && S.searchBarActive]}>
            <Text style={{ fontSize: 16, color: T.muted }}>🔍</Text>
            <TextInput
              ref={searchInputRef}
              style={S.searchInput}
              placeholder={`Search in ${market?.name || "market"}…`}
              placeholderTextColor={T.placeholder}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onFocus={() => {}} // Suggestions disabled
              onSubmitEditing={() => setShowSuggestions(false)}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ color: T.muted, fontSize: 16, fontWeight: "600" }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Suggestions dropdown */}
          {showSuggestions && search.trim().length > 0 && (
            <View style={S.suggestDrop}>
              {loadingSuggestions ? (
                <View style={S.suggestRow}>
                  <ActivityIndicator color={T.primary} size="small" />
                  <Text style={S.suggestLoading}>Searching…</Text>
                </View>
              ) : suggestions.length > 0 ? (
                suggestions.map((s, idx) => (
                  <Pressable
                    key={`${s._id}-${idx}`}
                    style={({ pressed }) => [
                      S.suggestRow,
                      idx < suggestions.length - 1 && S.suggestBorder,
                      pressed && { backgroundColor: T.primaryLight },
                    ]}
                    onPress={() => handleSuggestionSelect(s)}
                  >
                    <View style={S.suggestIconWrap}>
                      <Text style={{ fontSize: 18 }}>{(SHOP_TYPE_CONFIG[s.type] || SHOP_TYPE_CONFIG.grocery).icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.suggestName} numberOfLines={1}>{s.label || s.displayName}</Text>
                      <Text style={S.suggestAddr} numberOfLines={1}>{s.address}</Text>
                    </View>
                    <View style={[S.suggestTypePill, { backgroundColor: (SHOP_TYPE_CONFIG[s.type] || SHOP_TYPE_CONFIG.grocery).bg }]}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: (SHOP_TYPE_CONFIG[s.type] || SHOP_TYPE_CONFIG.grocery).color }}>
                        {(SHOP_TYPE_CONFIG[s.type] || SHOP_TYPE_CONFIG.grocery).label}
                      </Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={[S.suggestRow, { justifyContent: "center" }]}>
                  <Text style={{ fontSize: 13, color: T.muted }}>No results for "{search}"</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Filter row header */}
        <View style={S.filterHeaderRow}>
          <Text style={S.filterLabel}>SORT & FILTER</Text>
          {hasActiveFilters && (
            <TouchableOpacity style={S.clearBtn} onPress={clearAllFilters} activeOpacity={0.8}>
              <Text style={S.clearBtnTxt}>✕  Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort + filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          style={{ marginBottom: 12 }}
        >
          {[
            { k: "rating", l: "⭐  Top rated" },
            { k: "followers", l: "🔥  Popular" },
            { k: "newest", l: "✨  Newest" },
            { k: "name", l: "🔤  A–Z" },
          ].map(({ k, l }) => (
            <TouchableOpacity
              key={k}
              style={[S.chip, sort === k && S.chipOn]}
              onPress={() => setSort(k)}
              activeOpacity={0.8}
            >
              <Text style={[S.chipTxt, sort === k && S.chipTxtOn]}>{l}</Text>
            </TouchableOpacity>
          ))}

          <View style={S.chipDivider} />

          <TouchableOpacity
            style={[S.chip, openOnly && S.chipOn, openOnly && { borderColor: T.green }]}
            onPress={() => setOpenOnly(!openOnly)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              {openOnly && <View style={S.openDot} />}
              <Text style={[S.chipTxt, openOnly && { color: T.green, fontWeight: "700" }]}>Open now</Text>
            </View>
          </TouchableOpacity>

          {[4, 3].map((r) => (
            <TouchableOpacity
              key={r}
              style={[S.chip, minRating === r && S.chipOn]}
              onPress={() => setMinRating(minRating === r ? 0 : r)}
              activeOpacity={0.8}
            >
              <Text style={[S.chipTxt, minRating === r && S.chipTxtOn]}>{r}★+</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results summary */}
        {!loading && (
          <View style={S.resultsRow}>
            <Text style={S.resultsTxt}>
              {outlets.length === 0
                ? "No shops found"
                : `${outlets.length} shop${outlets.length !== 1 ? "s" : ""}${hasActiveFilters ? " (filtered)" : ""}`}
            </Text>
            {hasActiveFilters && outlets.length > 0 && (
              <View style={S.activeFilterBadge}>
                <Text style={S.activeFilterBadgeTxt}>Filters active</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Skeleton loading */}
      {loading && (
        <View style={{ paddingHorizontal: 14, paddingTop: 4 }}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      )}
    </View>
  );

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={loading ? [] : outlets}
        keyExtractor={(o, idx) => `${o.outletType}-${o._id}-${idx}`}
        renderItem={renderOutlet}
        extraData={userLocation}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primary}
            colors={[T.primary]}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={S.footerLoader}>
              <ActivityIndicator color={T.primary} size="small" />
              <Text style={S.footerLoaderTxt}>Loading more…</Text>
            </View>
          ) : !hasMore && outlets.length > 0 ? (
            <View style={S.footerEnd}>
              <View style={S.footerEndLine} />
              <Text style={S.footerEndTxt}>All shops loaded</Text>
              <View style={S.footerEndLine} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ paddingHorizontal: 14 }}>
              <EmptyState hasFilters={hasActiveFilters} onClear={clearAllFilters} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

// ─── Stat chip helper ──────────────────────────────────────────────────────────
function StatChip({ icon, value, label }: { icon: string; value: number; label: string }) {
  const display = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  return (
    <View style={S.statChip}>
      <Text style={S.statChipIcon}>{icon}</Text>
      <Text style={S.statChipVal}>{display}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // ── Hero banner ──
  heroBannerWrap: { position: "relative", height: 220 },
  heroBanner: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  heroContent: {
    position: "absolute",
    bottom: 20,
    left: 18,
    right: 18,
  },
  marketTypePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: T.r999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  marketTypePillTxt: { fontSize: 10, color: "#fff", fontWeight: "700", letterSpacing: 0.4 },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    marginTop: 4,
    fontWeight: "500",
  },
  heroCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 5,
  },
  changeMarketBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: T.r8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 999,
  },
  changeMarketBtnTxt: {
    fontSize: 12,
    fontWeight: "700",
    color: T.text,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : (StatusBar.currentHeight || 24) + 8,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: T.r12,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // ── Filters container ──
  filtersContainer: {
    backgroundColor: T.surface,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 50,
  },

  // ── Type tabs ──
  typeTabsRow: {
    flexDirection: "row",
    backgroundColor: T.surfaceElevated,
    borderRadius: T.r12,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: T.r8,
  },
  typeTabOn: {
    backgroundColor: T.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeTabTxt: { fontSize: 12, fontWeight: "600", color: T.muted },
  typeTabTxtOn: { color: T.primary },

  // ── Search bar ──
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: T.r12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: T.surfaceElevated,
    marginBottom: 12,
  },
  searchBarActive: {
    borderColor: T.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: T.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: T.text,
    padding: 0,
  },

  // ── Suggestions dropdown ──
  suggestDrop: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.primary,
    borderTopWidth: 0,
    borderBottomLeftRadius: T.r12,
    borderBottomRightRadius: T.r12,
    maxHeight: 300,
    zIndex: 2000,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  suggestBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderLight,
  },
  suggestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: T.r8,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestName: { fontSize: 13, fontWeight: "700", color: T.text },
  suggestAddr: { fontSize: 11, color: T.muted, marginTop: 2 },
  suggestTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.r999,
  },
  suggestLoading: { fontSize: 13, color: T.muted, marginLeft: 8 },

  // ── Filter chips ──
  filterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterLabel: { fontSize: 10, fontWeight: "800", color: T.placeholder, letterSpacing: 0.8 },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.r999,
    backgroundColor: T.redBg,
    borderWidth: 1,
    borderColor: T.redBorder,
  },
  clearBtnTxt: { fontSize: 11, fontWeight: "700", color: T.red },
  chip: {
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: T.r999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: T.surface,
  },
  chipOn: { backgroundColor: T.text, borderColor: T.text },
  chipTxt: { fontSize: 12, fontWeight: "600", color: T.muted },
  chipTxtOn: { color: "#fff" },
  chipDivider: { width: 1, height: 30, backgroundColor: T.border, alignSelf: "center" },

  // ── Results summary ──
  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
  },
  resultsTxt: { fontSize: 12, color: T.muted, fontWeight: "500" },
  activeFilterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.r999,
    backgroundColor: T.primaryLight,
  },
  activeFilterBadgeTxt: { fontSize: 10, fontWeight: "700", color: T.primary },

  // ── Cards ──
  cardWrap: {
    backgroundColor: T.surface,
    borderRadius: T.r16,
    marginHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    shadowColor: "#1A56DB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  bannerBox: { height: 140, position: "relative" },
  cardBanner: { width: "100%", height: "100%" },
  bannerGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  typeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.r8,
  },
  typeBadgeTxt: { fontSize: 10, fontWeight: "800" },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.greenBg,
    borderWidth: 1,
    borderColor: T.greenBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.r999,
  },
  openBadgeTxt: { color: T.green, fontSize: 10, fontWeight: "800" },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: T.r999,
    backgroundColor: T.green,
  },
  shareIconBtn: {
  width: 40,
  height: 30,
  borderRadius: 10,

  backgroundColor: "#FFFFFF",

  alignItems: "center",
  justifyContent: "center",

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.15,
  shadowRadius: 12,

  elevation: 8,
},
  ratingPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.r999,
  },
  ratingPillTxt: { fontSize: 11, fontWeight: "800" },
  logoWrap: {
    alignSelf: "center",
    marginTop: -30,
    padding: 3,
    backgroundColor: T.surface,
    borderRadius: T.r16,
    borderWidth: 3,
    borderColor: T.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: { width: 60, height: 60, borderRadius: T.r12 },
  cardBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.text, textAlign: "center", letterSpacing: -0.2 },
  cardAddr: { fontSize: 12, color: T.muted, marginTop: 3, textAlign: "center" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.bg,
    borderRadius: T.r999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  statChipIcon: { fontSize: 11 },
  statChipVal: { fontSize: 11, fontWeight: "700", color: T.textSub },
  metaChip: {
    alignSelf: "center",
    backgroundColor: T.primaryLight,
    borderRadius: T.r999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  metaChipTxt: { fontSize: 11, color: T.primary, fontWeight: "600" },

  // ── Distance & delivery time ──
  distanceRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  distanceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    borderRadius: T.r999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  distanceIcon: { fontSize: 11 },
  distanceText: { fontSize: 11, fontWeight: "700", color: "#3730A3" },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderLight,
  },
  followBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: T.r12,
    backgroundColor: T.redBg,
    borderWidth: 1,
    borderColor: T.redBorder,
    alignItems: "center",
  },
  followBtnOn: { backgroundColor: T.greenBg, borderColor: T.greenBorder },
  followBtnTxt: { fontSize: 12, fontWeight: "700", color: T.red },
  followBtnTxtOn: { color: T.green },
  viewBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: T.r12,
    backgroundColor: T.primaryLight,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
  },
  viewBtnTxt: { fontSize: 12, fontWeight: "700", color: T.primary },

  // ── Skeleton ──
  skeletonBanner: { height: 140 },
  skeletonLogoWrap: { alignSelf: "center", marginTop: -28 },
  skeletonLogo: { width: 60, height: 60, borderRadius: T.r12 },
  skeletonLine: { height: 12, borderRadius: T.r999, backgroundColor: T.border },

  // ── Footer ──
  footerLoader: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  footerLoaderTxt: { fontSize: 12, color: T.muted },
  footerEnd: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 12,
  },
  footerEndLine: { flex: 1, height: 1, backgroundColor: T.border },
  footerEndTxt: { fontSize: 11, color: T.placeholder, fontWeight: "500" },

  // ── Empty state ──
  emptyWrap: {
    paddingVertical: 48,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: T.muted, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: T.r12,
    backgroundColor: T.primaryLight,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  emptyBtnTxt: { fontSize: 13, fontWeight: "700", color: T.primary },
});