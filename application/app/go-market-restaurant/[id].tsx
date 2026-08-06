import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  View,
  LayoutAnimation,
  UIManager,
  Easing,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  addToCart,
  fetchGoRestaurantDetail,
  fetchMyListData,
  followGoRestaurant,
  unfollowGoRestaurant,
  useAppDispatch,
  setCartData,
  useAppSelector,
} from "@/src/store";
import { showToast } from "@/src/utils/toast";
import { fetchDataFromApi, postData } from "@/src/utils/api";
import { SortModal, SORT_OPTIONS } from "@/src/components/goMarket/SortModal";
import { AddToCartDialog } from "@/src/components/goMarket/AddToCartDialog";
import { CartViewDialog } from "@/src/components/goMarket/CartViewDialog";
import { FilterModal, FilterValues } from "@/src/components/goMarket/FilterModal";
import { getOutletBaseMinutes, getOutletDistanceEta } from "@/src/utils/geoCoords";
import { PaginationControls } from "@/src/components/PaginationControls";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get("window");
const BANNER_H = 220;
const LOGO_SIZE = 70;

const getFoodTypeLabel = (item: any = {}) => String(item?.foodType || item?.food_type || item?.foodtype || "").trim();

const foodTypeBadgeStyles = (foodType = "") => {
  const normalized = String(foodType).trim().toLowerCase();
  if (normalized === "veg") return { badge: S.foodTypeVeg, text: { color: "#166534" } };
  if (normalized === "non-veg" || normalized === "egg") return { badge: S.foodTypeNonVeg, text: { color: "#991b1b" } };
  return { badge: S.foodTypeOther, text: { color: "#3730a3" } };
};

const FALLBACK = "https://placehold.co/800x420/2d2416/9d7d4d?text=Restaurant";
const STATUS_H = Platform.OS === "android" ? (StatusBar.currentHeight ?? 20) : 24;
const ITEMS_PER_PAGE = 25;
const GM_LOC_KEY = "gm_user_location";

// Restaurant Theme Colors
const C = {
  bg: "#FAF9F7",
  surface: "#FFFFFF",
  border: "#E8E3DB",
  borderStrong: "#D9D0C3",
  text: "#1A1410",
  sub: "#5A5246",
  muted: "#9A8F84",
  accent: "#D4571B",
  accentDark: "#B83D0D",
  accentLight: "#FFF3ED",
  accentBorder: "#F5D4C6",
  gold: "#D4A574",
  goldLight: "#FEF8F3",
  green: "#2B7A3F",
  greenBg: "#E8F5ED",
  red: "#C23030",
  shimmer1: "#E8E3DB",
  shimmer2: "#F0ECEB",
};

function Bone({ w, h, r = 8, style }: { w?: number | string; h: number; r?: number; style?: object }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
  }, []);
  const bg = shimmer.interpolate({ inputRange: [0, 1], outputRange: [C.shimmer1, C.shimmer2] });
  return <Animated.View style={[{ width: w ?? "100%", height: h, borderRadius: r, backgroundColor: bg }, style]} />;
}

function SkeletonScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Bone w={SW} h={BANNER_H} r={0} />
      <View style={{ padding: 14, gap: 10, marginTop: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Bone h={LOGO_SIZE} w={LOGO_SIZE} r={LOGO_SIZE / 2} />
          <View style={{ flex: 1, gap: 6 }}>
            <Bone h={16} w="60%" />
            <Bone h={10} w="40%" />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
          {[0, 1, 2, 3, 4].map((k) => <Bone key={k} h={26} w={50} r={999} />)}
        </View>
        <Bone h={12} w="85%" />
        <Bone h={12} w="65%" />
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          <Bone h={36} r={10} style={{ flex: 1.4 }} />
          <Bone h={36} r={10} style={{ flex: 1 }} />
          <Bone h={36} r={10} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: object }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    // Cap delay so late-loaded items (higher absolute list index) don't wait
    // several seconds before becoming visible. Stagger max 260ms, then fade in.
    const safeDelay = Math.min(delay, 260);
    const anim = Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 260, delay: safeDelay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, speed: 20, bounciness: 6, delay: safeDelay, useNativeDriver: true } as any),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);
  return <Animated.View style={[{ opacity: op, transform: [{ translateY: ty }] }, style]}>{children}</Animated.View>;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: "row", gap: 0.5 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 9, color: i <= full ? "#FFB84D" : half && i === full + 1 ? "#FFD699" : C.border }}>
          {i <= full ? "★" : half && i === full + 1 ? "★" : "☆"}
        </Text>
      ))}
    </View>
  );
}

function StatChip({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  const sc = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(sc, { toValue: 0.93, useNativeDriver: true, speed: 40 }).start();
  const release = () => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 24 }).start();
  return (
    <Pressable onPressIn={press} onPressOut={release}>
      <Animated.View style={[S.statChip, { transform: [{ scale: sc }] }]}>
        <Text style={S.statChipIcon}>{icon}</Text>
        <Text style={S.statChipVal}>{value}</Text>
        <Text style={S.statChipLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function TagBadge({ label, color = C.accentLight, textColor = C.accent, icon }: { label: string; color?: string; textColor?: string; icon?: string }) {
  return (
    <View style={[S.tagBadge, { backgroundColor: color }]}>
      <Text style={[S.tagBadgeText, { color: textColor }]}>
        {icon ? `${icon} ${label}` : label}
      </Text>
    </View>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <View style={S.sectionHead}>
      <View style={S.sectionAccent} />
      <Text style={S.sectionTitle}>{title}</Text>
      <View style={S.sectionBadge}>
        <Text style={S.sectionBadgeText}>{count}</Text>
      </View>
    </View>
  );
}

function MenuRow({ item, index }: { item: any; index: number }) {
  const sc = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(sc, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const release = () => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  return (
    <FadeIn delay={index * 50}>
      <Pressable onPressIn={press} onPressOut={release}>
        <Animated.View style={[S.menuRow, { transform: [{ scale: sc }] }]}>
          <Image source={{ uri: item.image || FALLBACK }} style={S.menuImg} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={S.menuName} numberOfLines={1}>{item.menuName}</Text>
            {!!item.description && <Text style={S.menuDesc} numberOfLines={1}>{item.description}</Text>}
            {item.totalItems != null && (
              <View style={S.menuCountBadge}>
                <Text style={S.menuCountText}>{item.totalItems} items</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: C.muted, fontWeight: "700" }}>›</Text>
        </Animated.View>
      </Pressable>
    </FadeIn>
  );
}

function ItemTile({ item, index, columns, onAddToCart, onWishlist, inWishlist, restaurantIsOpen }: { item: any; index: number; columns: 1 | 2; onAddToCart: (item: any) => void; onWishlist: (item: any) => void; inWishlist: boolean; restaurantIsOpen: boolean }) {
  const router = useRouter();
  const sc = useRef(new Animated.Value(1)).current;
  const imgOp = useRef(new Animated.Value(0)).current;
  const press = () => Animated.spring(sc, { toValue: 0.94, useNativeDriver: true, speed: 40 }).start();
  const release = () => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  const onImgLoad = () => Animated.timing(imgOp, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  // If the image URL fails to load, show the tile anyway instead of leaving it
  // invisible forever (opacity stuck at 0).
  const onImgError = () => imgOp.setValue(1);

  const isVeg = item.isVeg || item.category === "veg";
  const discount = item.discount || item.discountPercentage;
  const rating = item.rating || item.averageRating || 0;
  const reviewCount = item.reviewCount || item.totalReviews || 0;
  const isOutOfStock = item.stock === 0 || item.inStock === false;
  const isRestaurantClosed = !restaurantIsOpen;
  const itemName = item.itemName || item.name || item.productName;
  const foodTypeLabel = getFoodTypeLabel(item);

  return (
    <FadeIn delay={index * 40}>
      <Pressable 
        onPressIn={press} 
        onPressOut={release}
        onPress={() => router.push(`/go-market-product/restaurant/${item._id}` as never)}
      >
        <Animated.View style={[S.tile, columns === 1 && S.tileFull, { transform: [{ scale: sc }] }]}>
          <View style={{ position: "relative" }}>
            <Animated.Image
              source={{ uri: item.image || FALLBACK }}
              style={[S.tileImg, { opacity: imgOp }]}
              onLoad={onImgLoad}
              onError={onImgError}
            />
            {discount ? (
              <View style={S.discountBadge}>
                <Text style={S.discountText}>{discount}% OFF</Text>
              </View>
            ) : null}
            {isOutOfStock && (
              <View style={S.outOfStockOverlay}>
                <Text style={S.outOfStockText}>Out of Stock</Text>
              </View>
            )}
            {isRestaurantClosed && !isOutOfStock && (
              <View style={S.storeClosedOverlay}>
                <Text style={S.storeClosedText}>Store Closed</Text>
              </View>
            )}
            {isVeg !== undefined && (
              <View style={[S.vegDot, { borderColor: isVeg ? C.green : C.accent }]}>
                <View style={[S.vegDotInner, { backgroundColor: isVeg ? C.green : C.accent }]} />
              </View>
            )}
            <TouchableOpacity
              style={[S.wishlistBtn, inWishlist && S.wishlistBtnActive]}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                onWishlist(item);
              }}
            >
              <Text style={[S.wishlistIcon, inWishlist && S.wishlistIconActive]}>{inWishlist ? "♥" : "♡"}</Text>
            </TouchableOpacity>
          </View>

          <View style={S.tileBody}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Text style={S.tileName} numberOfLines={1}>{itemName}</Text>
              {foodTypeLabel && (
                <View style={[S.foodTypeBadgeInline, foodTypeBadgeStyles(foodTypeLabel).badge]}>
                  <Text style={[S.foodTypeTextInline, foodTypeBadgeStyles(foodTypeLabel).text]}>{foodTypeLabel}</Text>
                </View>
              )}
            </View>
            {!!item.description && <Text style={S.tileDesc} numberOfLines={1}>{item.description}</Text>}
            {item.weight && (
              <Text style={S.tileWeight}>{item.weight}</Text>
            )}
            {rating > 0 && (
              <View style={S.ratingRow}>
                <Text style={S.ratingStar}>⭐</Text>
                <Text style={S.ratingText}>{rating.toFixed(1)}</Text>
                {reviewCount > 0 && (
                  <Text style={S.reviewCount}>({reviewCount})</Text>
                )}
              </View>
            )}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  <Text style={S.tilePrice}>₹{item.price}</Text>
                  {(item.oldPrice || item.originalPrice) && (item.oldPrice > item.price || item.originalPrice > item.price) && (
                    <Text style={S.tilePriceOld}>₹{item.oldPrice || item.originalPrice}</Text>
                  )}
                </View>
                {(item.oldPrice || item.originalPrice) && (item.oldPrice > item.price || item.originalPrice > item.price) && (
                  <Text style={{ fontSize: 9, color: C.green, fontWeight: "600", marginTop: 1 }}>
                    Save ₹{((item.oldPrice || item.originalPrice) - item.price)}
                  </Text>
                )}
              </View>
              {!isOutOfStock && !isRestaurantClosed && (
                <TouchableOpacity 
                  style={S.addBtn} 
                  activeOpacity={0.75}
                  onPress={(e) => {
                    e.stopPropagation();
                    onAddToCart(item);
                  }}
                >
                  <Text style={S.addBtnText}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </FadeIn>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabW = (SW - 24 - 6) / tabs.length;

  useEffect(() => {
    Animated.spring(indicatorX, { toValue: active * tabW, useNativeDriver: true, speed: 28, bounciness: 6 } as any).start();
  }, [active, tabW]);

  return (
    <View style={S.tabBar}>
      <Animated.View style={[S.tabIndicator, { width: tabW - 4, transform: [{ translateX: indicatorX }] }]} />
      {tabs.map((t, i) => (
        <TouchableOpacity key={i} style={[S.tabItem, { width: tabW }]} onPress={() => onChange(i)} activeOpacity={0.7}>
          <Text style={[S.tabText, active === i && S.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <View style={S.emptyState}>
      <Text style={S.emptyEmoji}>🍽️</Text>
      <Text style={S.emptyTitle}>{query ? `No matches for "${query}"` : "No dishes available"}</Text>
      <Text style={S.emptySub}>{query ? "Try another search" : "Check back soon!"}</Text>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3, justifyContent: "center" }}>
      <Text style={{ fontSize: 10 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: C.sub, textAlign: "center" }} numberOfLines={1}>{text}</Text>
    </View>
  );
}

export default function GoMarketRestaurantDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { restaurantDetail, loading } = useAppSelector((s) => s.goMarket);
  const { isLogin, userData, myListData, cartData } = useAppSelector((s: any) => s.app);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<"featured" | "popular" | "latest">("featured");
  const [allCatalogItems, setAllCatalogItems] = useState<any[]>([]); // ALL items (pagination handled)
  const [displayedItems, setDisplayedItems] = useState<any[]>([]); // Items to show (12, 24, 36...)
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const isFetchingMoreRef = useRef(false); // synchronous guard, avoids duplicate fetches from rapid scroll events
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [gridOffset, setGridOffset] = useState(0);
  const [sort, setSort] = useState("latest");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [gridColumns, setGridColumns] = useState<1 | 2>(2);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [subSubCategoryId, setSubSubCategoryId] = useState("");
  const [menuId, setMenuId] = useState("");
  const [foodType, setFoodType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterMeta, setFilterMeta] = useState<any>(null);
  const [filteredSubCategories, setFilteredSubCategories] = useState<any[]>([]);
  const [filteredSubSubCategories, setFilteredSubSubCategories] = useState<any[]>([]);
  const [restaurantMenus, setRestaurantMenus] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<{
    suggestions: any[];
    recentSearches: string[];
    trendingSearches: string[];
    popularProducts: any[];
    topSearches: string[];
  }>({ suggestions: [], recentSearches: [], trendingSearches: [], popularProducts: [], topSearches: [] });
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [cartDialogVisible, setCartDialogVisible] = useState(false);
  const [cartViewDialogVisible, setCartViewDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [localRestaurant, setLocalRestaurant] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const searchFocused = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked && !isLogin) router.replace("/login" as never);
  }, [isLogin, authChecked]);

  useEffect(() => {
    if (id) dispatch(fetchGoRestaurantDetail(id));
  }, [id]); // Removed dispatch from dependencies to prevent unnecessary refetches

  // Sync localRestaurant with Redux state when restaurantDetail changes (only if not already set)
  useEffect(() => {
    if (restaurantDetail?.restaurant && !localRestaurant) {
      setLocalRestaurant(restaurantDetail.restaurant);
    }
  }, [restaurantDetail]); // Removed localRestaurant from dependencies to prevent infinite loops

  // Restore cached location
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

  // Load GPS location on mount
  useEffect(() => {
    refreshCurrentLocation();
  }, [refreshCurrentLocation]);

  const buildCatalogParams = useCallback((pageNum: number) => {
    const p = new URLSearchParams({ tab, limit: String(ITEMS_PER_PAGE), page: String(pageNum), ...(sort && sort !== "latest" ? { sort } : {}) });
    if (appliedSearch.trim()) p.set("q", appliedSearch.trim());
    if (menuId) p.set("menuId", menuId);
    if (categoryId) p.set("categoryId", categoryId);
    if (subCategoryId) p.set("subCategoryId", subCategoryId);
    if (subSubCategoryId) p.set("subSubCategoryId", subSubCategoryId);
    if (foodType) p.set("foodType", foodType);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (minRating > 0) p.set("minRating", String(minRating));
    if (inStock) p.set("inStock", "true");
    return p;
  }, [tab, sort, appliedSearch, menuId, categoryId, subCategoryId, subSubCategoryId, foodType, minPrice, maxPrice, minRating, inStock]);

  const loadCatalogPage = useCallback(async (pageNum: number) => {
    if (!id) return;

    setCatalogLoading(true);
    setDisplayedItems([]); // Clear old items to show skeleton loader
    
    try {
      const params = buildCatalogParams(pageNum);
      const url = `/api/go-market/restaurants/${id}/catalog?${params}`;
      const res = await fetchDataFromApi(url);
      
      if (res?.success || res?.error === false) {
        const newItems = res.data || [];
        setAllCatalogItems(newItems);
        setDisplayedItems(newItems);
        
        // Check if there are more pages
        const total = res.pagination?.totalPages;
        if (total !== undefined) {
          setHasMorePages(pageNum < total);
        } else {
          setHasMorePages(newItems.length === 25);
        }
        setCurrentPage(pageNum);
      } else {
        console.warn("API Error:", res);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setCatalogLoading(false);
      setCatalogLoadingMore(false);
    }
  }, [id, buildCatalogParams]);

  useEffect(() => {
    loadCatalogPage(1);
  }, [loadCatalogPage]);

  // Fetch filter metadata (categories, subcategories, sub sub categories, menus)
  useEffect(() => {
    if (!id) return;
    fetchDataFromApi(`/api/go-market/restaurants/${id}/catalog?limit=1&page=1`).then((res) => {
      if (res?.success || res?.error === false) {
        setFilterMeta(res.filterMeta || null);
        // Set menus from filterMeta if available
        if (res.filterMeta?.menus) {
          setRestaurantMenus(res.filterMeta.menus);
        }
      }
    });
  }, [id]);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (categoryId && filterMeta?.subCategories) {
      const filtered = filterMeta.subCategories.filter((sub: any) => 
        String(sub.categoryId) === String(categoryId) || String(sub.parentId) === String(categoryId)
      );
      setFilteredSubCategories(filtered);
      // Reset sub sub category when category changes
      setSubSubCategoryId("");
    } else {
      setFilteredSubCategories(filterMeta?.subCategories || []);
      setSubSubCategoryId("");
    }
  }, [categoryId, filterMeta]);

  // Filter sub sub categories based on selected sub category
  useEffect(() => {
    if (subCategoryId && filterMeta?.subSubCategories) {
      const filtered = filterMeta.subSubCategories.filter((subSub: any) => 
        String(subSub.subCategoryId) === String(subCategoryId)
      );
      setFilteredSubSubCategories(filtered);
    } else {
      setFilteredSubSubCategories(filterMeta?.subSubCategories || []);
    }
  }, [subCategoryId, filterMeta]);

  useEffect(() => {
    if (!id) {
      setSuggestions({ suggestions: [], recentSearches: [], trendingSearches: [], popularProducts: [], topSearches: [] });
      return;
    }
    // If no search, fetch defaults
    if (!search.trim()) {
      fetchDataFromApi(`/api/go-market/restaurants/${id}/search-defaults`).then((res) => {
        if (res?.success || res?.error === false) {
          // API returns data nested inside res.data
          const data = res.data || res;
          setSuggestions({
            suggestions: [],
            recentSearches: data.recentSearches || [],
            trendingSearches: data.trendingSearches || [],
            popularProducts: data.popularProducts || [],
            topSearches: data.topSearches || [],
          });
        }
      });
      return;
    }
    // If there's a search query, fetch enhanced suggestions
    setSuggestionsLoading(true);
    const t = setTimeout(() => {
      fetchDataFromApi(`/api/go-market/restaurants/${id}/search-suggestions?q=${encodeURIComponent(search.trim())}`)
        .then((res) => {
          console.log('🔍 Restaurant Search Suggestions Response:', res);
          if (res?.success || res?.error === false) {
            // API returns data nested inside res.data
            const data = res.data || res;
            console.log('✅ Suggestions:', data.suggestions);
            console.log('✅ Popular Products:', data.popularProducts);
            setSuggestions({
              suggestions: data.suggestions || [],
              recentSearches: [],
              trendingSearches: data.trendingSearches || [],
              popularProducts: data.popularProducts || [],
              topSearches: data.topSearches || [],
            });
          }
        })
        .finally(() => setSuggestionsLoading(false));
    }, 150);
    return () => clearTimeout(t);
  }, [id, search]);

  const submitSearch = (query = search) => {
    const q = query.trim();
    setSearch(q);
    setAppliedSearch(q);
    setShowSuggestions(false);
    loadCatalogPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setSuggestions({ suggestions: [], recentSearches: [], trendingSearches: [], popularProducts: [], topSearches: [] });
    setShowSuggestions(false);
  };

  const onSearchFocus = () => Animated.timing(searchFocused, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const onSearchBlur = () => Animated.timing(searchFocused, { toValue: 0, duration: 180, useNativeDriver: false }).start();

  if (loading || !restaurantDetail) return <SkeletonScreen />;

  // Use localRestaurant for display (for optimistic updates), fallback to Redux state
  const restaurant = localRestaurant || restaurantDetail.restaurant;
  const { menus, items } = restaurantDetail;

  const isFollowing = Boolean(restaurant.isFollowing);
  const followerCount = restaurant.followerCount ?? restaurant.followers?.length ?? 0;
  const reviewCount = restaurant.totalReviews ?? 0;
  const totalMenus = restaurant.totalMenus ?? menus?.length ?? 0;
  const totalItems = restaurant.totalItems ?? items?.length ?? 0;
  const rating = Number(restaurant.rating ?? 0);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  const descText = restaurant.description || "";
  const descShort = descText.length > 80;

  const handleFollow = async () => {
    if (followBusy || !restaurant?._id) return;
    setFollowBusy(true);
    const currentRestaurant = localRestaurant || restaurant;
    const wasFollowing = currentRestaurant.isFollowing;
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setFollowBusy(false);
      showToast("error", "Request timed out. Please try again.");
    }, 10000); // 10 second timeout
    
    try {
      // Optimistic update - ensure localRestaurant is initialized
      if (!localRestaurant) {
        setLocalRestaurant({
          ...restaurant,
          isFollowing: !wasFollowing,
          followerCount: Math.max(0, (restaurant.followerCount || 0) + (wasFollowing ? -1 : 1)),
        });
      } else {
        setLocalRestaurant((prev: any) => ({
          ...prev,
          isFollowing: !wasFollowing,
          followerCount: Math.max(0, (prev.followerCount || 0) + (wasFollowing ? -1 : 1)),
        }));
      }
      
      const action = wasFollowing ? unfollowGoRestaurant : followGoRestaurant;
      const res = await dispatch(action(restaurant._id)).unwrap();
      
      // Clear timeout on success
      clearTimeout(timeoutId);
      
      const data = res?.data || res;
      
      // Update with actual response data
      setLocalRestaurant((prev: any) => ({
        ...(prev || restaurant),
        isFollowing: data?.isFollowing ?? !wasFollowing,
        followerCount: data?.followerCount ?? (prev?.followerCount || restaurant.followerCount),
      }));
      
      showToast("success", wasFollowing ? "Unfollowed" : "Following!");
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      console.error("Follow/Unfollow error:", error);
      
      // Revert on failure
      setLocalRestaurant((prev: any) => {
        const base = prev || restaurant;
        return {
          ...base,
          isFollowing: wasFollowing,
          followerCount: Math.max(0, (base.followerCount || 0) + (wasFollowing ? 1 : -1)),
        };
      });
      showToast("error", "Could not update. Please try again.");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleAddToCart = (product: any) => {
    // Check if restaurant is open
    const isOpen = restaurant.isOpen ?? restaurant.status === "open";
    if (!isOpen) {
      showToast("error", "Restaurant is currently closed. You cannot add items to cart.");
      return;
    }

    const hasOptions = (product.options?.length > 0) || (product.productOptions?.some((opt: any) => opt.values?.length > 0));
    
    if (hasOptions) {
      setSelectedProduct(product);
      setCartDialogVisible(true);
    } else {
      handleConfirmAddToCart(product, null, 1);
    }
  };

  const handleConfirmAddToCart = async (product: any, selectedOption: any, quantity: number) => {
    // Check if restaurant is open
    const isOpen = restaurant.isOpen ?? restaurant.status === "open";
    if (!isOpen) {
      showToast("error", "Restaurant is currently closed. You cannot add items to cart.");
      return;
    }

    const name = product.name || product.itemName || product.productName;
    const cartProduct = {
      _id: product._id,
      name,
      price: product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price,
      oldPrice: product.oldPrice || product.originalPrice || product.price,
      images: product.images || (product.image ? [product.image] : []),
      countInStock: product.countInStock ?? product.stock ?? 999,
      rating: product.rating || product.averageRating || 0,
      brand: product.brand,
      discount: product.discount || product.discountPercentage,
      weight: selectedOption?.name || product.weight,
    };

    if (isLogin && (userData?._id || userData?.id)) {
      await dispatch(addToCart({ product: cartProduct, userId: userData?._id || userData?.id, quantity }) as any).unwrap();
      return;
    }

    const localItem = {
      _id: `${product._id}-${selectedOption?._id || "default"}`,
      productId: product._id,
      productTitle: name,
      image: cartProduct.images[0],
      rating: cartProduct.rating,
      price: cartProduct.price,
      oldPrice: cartProduct.oldPrice,
      quantity,
      subTotal: Math.round(cartProduct.price * quantity),
      countInStock: cartProduct.countInStock,
      brand: cartProduct.brand,
      weight: cartProduct.weight,
    };
    dispatch(setCartData([...cartData.filter((item: any) => item._id !== localItem._id), localItem]) as any);
    showToast("success", `${quantity}x ${name} added to cart`);
  };

  const handleWishlist = async (product: any) => {
    const title = product.name || product.itemName || product.productName || "Product";
    if (!isLogin) {
      showToast("error", "Please login first to save wishlist");
      return;
    }
    const exists = myListData?.some((item: any) => item?.productId === product._id);
    if (exists) {
      showToast("success", `${title} is already in wishlist`);
      return;
    }
    const res = await postData("/api/myList/add", {
      productTitle: title,
      image: product.images?.[0] || product.image,
      rating: product.rating || product.averageRating || 0,
      price: product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price,
      oldPrice: product.oldPrice || product.originalPrice || product.price,
      productId: product._id,
      brand: product.brand || product.shopName || product.restaurantName || "GoMarket",
      discount: product.discount || product.discountPercentage,
    });
    if (res?.error === false) {
      showToast("success", "Added to wishlist");
      dispatch(fetchMyListData() as any);
    } else {
      showToast("error", res?.message || "Failed to add wishlist");
    }
  };

  const handleApplyFilter = (filters: FilterValues) => {
    setCategoryId(filters.categoryId);
    setSubCategoryId(filters.subCategoryId);
    setSubSubCategoryId(filters.subSubCategoryId);
    setFoodType(filters.foodType);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setMinRating(filters.minRating);
    setInStock(filters.inStock);
    loadCatalogPage(1);
  };

  const activeFiltersCount = [
    categoryId,
    subCategoryId,
    subSubCategoryId,
    foodType,
    minPrice,
    maxPrice,
    minRating > 0,
    inStock,
  ].filter(Boolean).length;

  const searchBorder = searchFocused.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.accent] });
  const isOpen = restaurant.isOpen ?? restaurant.status === "open";
  const hoursText = restaurant.openingHours || restaurant.workingHours || null;

  // Calculate distance and delivery time
  const { distanceDisplay, estimatedTime } = getOutletDistanceEta({
    userLat: userLocation?.lat ?? null,
    userLng: userLocation?.lng ?? null,
    shopLat: restaurant.latitude,
    shopLng: restaurant.longitude,
    marketLat: null,
    marketLng: null,
    baseMinutes: getOutletBaseMinutes("restaurant"),
  });
  
  // Debug log
  console.log('🔍 Restaurant Distance Debug:', {
    userLocation,
    restaurantCoords: { lat: restaurant.latitude, lng: restaurant.longitude },
    distanceDisplay,
    estimatedTime
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: Platform.OS === "ios" ? 24 : (StatusBar.currentHeight ?? 0) }}
        nestedScrollEnabled={true}
      >
        <View style={{ height: BANNER_H, overflow: "hidden" }}>
          <Image
            source={{ uri: restaurant.restaurantBanner || FALLBACK }}
            style={S.banner}
          />
          <View style={S.bannerGradient} />
          
          <View style={S.bannerOverlay}>
            <Text style={S.bannerName} numberOfLines={1}>
              {restaurant.restaurantName}
            </Text>
            <View style={S.bannerBadge}>
              <Text style={S.bannerBadgeText}>🍽️ Restaurant</Text>
            </View>
          </View>
          
          <View style={[S.openBadge, { backgroundColor: isOpen ? "rgba(43,122,63,0.92)" : "rgba(194,48,48,0.92)" }]}>
            <View style={[S.openDot, { backgroundColor: isOpen ? "#62E29F" : "#FF9999" }]} />
            <Text style={S.openText}>{isOpen ? "Open Now" : "Closed"}</Text>
          </View>
        </View>

        <FadeIn delay={0}>
          <View style={S.logoRow}>
            <View style={S.logoWrap}>
              <Image source={{ uri: restaurant.restaurantLogo || FALLBACK }} style={S.logo} />
            </View>
            <View style={{ alignItems: "center", paddingHorizontal: 14 }}>
              <Text style={S.resName} numberOfLines={1}>{restaurant.restaurantName}</Text>
              {restaurant.isPureVeg && <TagBadge label="Pure Vegetarian" icon="🌿" color={C.greenBg} textColor={C.green} />}
              {!!restaurant.address && <InfoRow icon="📍" text={restaurant.address} />}
              {hoursText && <InfoRow icon="🕐" text={hoursText} />}
              {/* Distance & Delivery Time */}
              {distanceDisplay != null && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, justifyContent: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.goldLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                    <Text style={{ fontSize: 10 }}>📍</Text>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: C.accent }}>{distanceDisplay}</Text>
                  </View>
                  {estimatedTime != null && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                      <Text style={{ fontSize: 10 }}>🕐</Text>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#92400E" }}>{estimatedTime} min</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                <Stars rating={rating} />
                <Text style={{ fontSize: 10, fontWeight: "700", color: C.text }}>{rating.toFixed(1)}</Text>
                <Text style={{ fontSize: 9, color: C.muted }}>({fmt(reviewCount)})</Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {(restaurant.cuisine || restaurant.tags?.length) && (
          <FadeIn delay={50}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 5, paddingVertical: 3 }}>
              {restaurant.cuisine && <TagBadge label={restaurant.cuisine} />}
              {(restaurant.tags || []).map((t: string, i: number) => (
                <TagBadge key={i} label={t} color={C.bg} textColor={C.sub} />
              ))}
            </ScrollView>
          </FadeIn>
        )}

        <FadeIn delay={90}>
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
              <StatChip icon="⭐" value={rating.toFixed(1)} label="Rating" />
              <StatChip icon="👥" value={fmt(followerCount)} label="Follow" />
              <StatChip icon="💬" value={fmt(reviewCount)} label="Reviews" />
              <StatChip icon="📋" value={fmt(totalMenus)} label="Menus" />
              <StatChip icon="🥘" value={fmt(totalItems)} label="Items" />
            </ScrollView>
          </View>
        </FadeIn>

        {!!descText && (
          <FadeIn delay={130}>
            <View style={S.descBlock}>
              <Text style={S.desc} numberOfLines={descExpanded ? undefined : 2}>{descText}</Text>
              {descShort && (
                <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setDescExpanded(!descExpanded); }} activeOpacity={0.7}>
                  <Text style={S.descToggle}>{descExpanded ? "Show less" : "Read more"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </FadeIn>
        )}

        <FadeIn delay={160}>
          <View style={S.actions}>
            <TouchableOpacity
              style={[
                S.btnPrimary, 
                isFollowing && S.btnFollowed,
                followBusy && { opacity: 0.85 }
              ]}
              onPress={handleFollow}
              activeOpacity={0.85}
              disabled={followBusy}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {followBusy && (
                  <ActivityIndicator 
                    size="small" 
                    color={isFollowing ? C.green : C.surface} 
                    style={{ width: 14, height: 14 }}
                  />
                )}
                <Text style={[S.btnPrimaryText, isFollowing && { color: C.green }]}>
                  {followBusy 
                    ? (isFollowing ? "Unfollowing..." : "Following...") 
                    : (isFollowing ? "✓ Following" : "+ Follow")
                  }
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={S.btnOutline} onPress={() => Share.share({ title: restaurant.restaurantName, message: restaurant.address })} activeOpacity={0.85}>
              <Text style={S.btnOutlineText}>↑ Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.btnOutline} onPress={() => Linking.openURL(`tel:${restaurant.ownerId?.mobile ?? ""}`)} activeOpacity={0.85}>
              <Text style={S.btnOutlineText}>📞 Call</Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        <View style={S.divider} />

        <FadeIn delay={190}>
          <View style={S.searchSection}>
            {/* Search Button - Opens Modal */}
            <TouchableOpacity
              style={S.searchBox}
              onPress={() => {
                setShowSuggestions(true);
                if (!search.trim() && id) {
                  fetchDataFromApi(`/api/go-market/restaurants/${id}/search-defaults`).then((res) => {
                    if (res?.success || res?.error === false) {
                      // API returns data nested inside res.data
                      const data = res.data || res;
                      setSuggestions({
                        suggestions: [],
                        recentSearches: data.recentSearches || [],
                        trendingSearches: data.trendingSearches || [],
                        popularProducts: data.popularProducts || [],
                        topSearches: data.topSearches || [],
                      });
                    }
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }} pointerEvents="none">
                <Text style={{ fontSize: 12, color: C.muted }}>🔍</Text>
                <Text style={{ fontSize: 13, color: C.muted, flex: 1 }}>
                  {search || "Search dishes…"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </FadeIn>

        <TabBar
          tabs={["Featured", "Popular", "Latest"]}
          active={["featured", "popular", "latest"].indexOf(tab)}
          onChange={(i) => {
            const newTab = (["featured", "popular", "latest"] as const)[i];
            setTab(newTab);
            setDisplayedItems([]);
            setAllCatalogItems([]);
          }}
        />

        {/* Menu Selection */}
        {restaurantMenus.length > 0 && (
          <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                style={[S.menuChip, !menuId && S.menuChipActive]}
                onPress={() => {
                  setMenuId("");
                  loadCatalogPage(1);
                }}
                activeOpacity={0.7}
              >
                <Text style={[S.menuChipText, !menuId && S.menuChipTextActive]}>All Menus</Text>
              </TouchableOpacity>
              {restaurantMenus.map((m: any) => (
                <TouchableOpacity
                  key={m._id}
                  style={[S.menuChip, menuId === m._id && S.menuChipActive]}
                  onPress={() => {
                    setMenuId(m._id);
                    loadCatalogPage(1);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[S.menuChipText, menuId === m._id && S.menuChipTextActive]}>{m.name || m.menuName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={S.controlRow}>
          <TouchableOpacity style={[S.sortChip, sort !== "latest" && S.sortChipActive]} onPress={() => setSortModalVisible(true)} activeOpacity={0.8}>
            <Feather name="bar-chart-2" size={14} color={sort !== "latest" ? "#fff" : C.sub} style={{ transform: [{ rotate: "90deg" }] }} />
            <Text style={[S.sortChipText, sort !== "latest" && S.sortChipTextActive]}>
              {sort === "latest" ? "Sort" : SORT_OPTIONS.find(o => o.key === sort)?.label ?? "Sort"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[S.sortChip, activeFiltersCount > 0 && S.sortChipActive]} 
            onPress={() => setFilterModalVisible(true)} 
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={14} color={activeFiltersCount > 0 ? "#fff" : C.sub} />
            <Text style={[S.sortChipText, activeFiltersCount > 0 && S.sortChipTextActive]}>
              Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.gridToggle} onPress={() => setGridColumns(gridColumns === 2 ? 1 : 2)} activeOpacity={0.8}>
            <Text style={S.gridToggleText}>{gridColumns === 2 ? "▤ One per row" : "▦ Two per row"}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 12 }} onLayout={(e) => setGridOffset(e.nativeEvent.layout.y)}>
          <SectionHead
            title={`${tab[0].toUpperCase()}${tab.slice(1)} Dishes`}
            count={displayedItems.length}
          />

          {/* {menus.length > 0 && tab === "featured" && !search ? menus.slice(0, 3).map((m: any, i: number) => <MenuRow key={m._id} item={m} index={i} />) : null} */}

          {catalogLoading && !displayedItems.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: gridColumns === 1 ? "100%" : "45%",
                    maxWidth: gridColumns === 1 ? "100%" : "48%",
                    height: 240,
                    backgroundColor: "#fff3e8",
                    borderRadius: 14,
                    overflow: "hidden",
                    marginBottom: 4,
                    opacity: 0.65 + (i % 2) * 0.15,
                  }}
                >
                  <View style={{ height: 130, backgroundColor: "#fde8cc" }} />
                  <View style={{ padding: 10, gap: 8 }}>
                    <View style={{ height: 12, borderRadius: 6, backgroundColor: "#fde8cc", width: "70%" }} />
                    <View style={{ height: 10, borderRadius: 5, backgroundColor: "#fde8cc", width: "50%" }} />
                    <View style={{ height: 16, borderRadius: 6, backgroundColor: "#f5d0a0", width: "40%", marginTop: 4 }} />
                  </View>
                </View>
              ))}
            </View>
          ) : displayedItems.length === 0 ? (
            <EmptyState query={search} />
          ) : (
            <>
              <View style={[S.grid, gridColumns === 1 && S.gridOne]}>
                {displayedItems.map((item: any, i: number) => (
                  <ItemTile
                    key={item._id}
                    item={item}
                    index={i % ITEMS_PER_PAGE}
                    columns={gridColumns}
                    onAddToCart={handleAddToCart}
                    onWishlist={handleWishlist}
                    inWishlist={myListData?.some((w: any) => w?.productId === item._id)}
                    restaurantIsOpen={isOpen}
                  />
                ))}
              </View>
              
              <View style={{ marginTop: 20 }}>
                <PaginationControls
                  currentPage={currentPage}
                  hasMore={hasMorePages}
                  loading={catalogLoadingMore || catalogLoading}
                  onPageChange={(page) => {
                    loadCatalogPage(page);
                    if (scrollRef.current && gridOffset > 0) {
                      scrollRef.current.scrollTo({ y: gridOffset, animated: true });
                    }
                  }}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Enhanced Search Suggestions Modal - Full Screen */}
      <Modal
        visible={showSuggestions}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <View style={S.modalOverlay}>
          <View style={S.suggestionsContainer}>
            {/* Header with Back Button and Search Input */}
            <View style={S.searchModalHeader}>
              <TouchableOpacity 
                onPress={() => setShowSuggestions(false)} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={S.backButton}
              >
                <Text style={S.backButtonText}>←</Text>
              </TouchableOpacity>
              
              <View style={S.searchModalInputContainer}>
                <Text style={S.searchModalIcon}>🔍</Text>
                <TextInput
                  ref={searchInputRef}
                  style={S.searchModalInput}
                  placeholder="Search for dishes..."
                  placeholderTextColor={C.muted}
                  value={search}
                  onChangeText={(v) => setSearch(v)}
                  onSubmitEditing={() => submitSearch()}
                  autoFocus
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => {
                      setSearch("");
                      searchInputRef.current?.focus();
                    }} 
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={S.clearButton}
                  >
                    <Text style={S.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Loading indicator */}
              {suggestionsLoading && search.trim() && (
                <View style={S.emptyStateContainer}>
                  <ActivityIndicator size="large" color={C.accent} />
                  <Text style={S.emptyStateSubtext}>Searching…</Text>
                </View>
              )}

              {/* No results message */}
              {!suggestionsLoading && search.trim() && suggestions.suggestions.length === 0 && suggestions.popularProducts.length === 0 && (
                <View style={S.emptyStateContainer}>
                  <Text style={S.emptyStateEmoji}>🔍</Text>
                  <Text style={S.emptyStateText}>No dishes found</Text>
                  <Text style={S.emptyStateSubtext}>Try a different search term</Text>
                </View>
              )}

              {/* When searching: Show suggestions + popular products */}
              {!suggestionsLoading && search.trim() && suggestions.suggestions.length > 0 && (
                <View style={S.section}>
                  <View style={S.sectionHeader}>
                    <View style={S.sectionIconContainer}>
                      <Text style={{ fontSize: 14 }}>🔍</Text>
                    </View>
                    <Text style={S.sectionLabel}>Suggestions</Text>
                  </View>
                  {suggestions.suggestions.map((s, index) => (
                    <TouchableOpacity
                      key={s._id}
                      style={[S.suggestionRow, index === suggestions.suggestions.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => submitSearch(s.label)}
                      activeOpacity={0.7}
                    >
                      <View style={S.suggestionIconBox}>
                        <Text style={{ fontSize: 13, color: C.muted }}>🔍</Text>
                      </View>
                      <Text style={S.suggestionText}>{s.label}</Text>
                      <Text style={{ fontSize: 16, color: C.muted }}>↗</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Popular Products (shown when searching) */}
              {!suggestionsLoading && search.trim() && suggestions.popularProducts.length > 0 && (
                <View style={S.section}>
                  <View style={S.sectionHeader}>
                    <View style={S.sectionIconContainer}>
                      <Text style={{ fontSize: 14 }}>✨</Text>
                    </View>
                    <Text style={S.sectionLabel}>Popular Dishes</Text>
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                  >
                    {suggestions.popularProducts.map((p) => (
                      <TouchableOpacity
                        key={p._id}
                        style={S.productCard}
                        onPress={() => {
                          setShowSuggestions(false);
                          router.push(`/go-market-product/restaurant/${p._id}` as never);
                        }}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: p.image || FALLBACK }}
                          style={S.productImage}
                        />
                        <View style={S.productInfo}>
                          <Text style={S.productName} numberOfLines={2}>
                            {p.itemName || p.name}
                          </Text>
                          <Text style={S.productPrice}>₹{p.price}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* When NOT searching: Show defaults */}
              {!search.trim() && (
                <>
                  {/* Start typing message */}
                  {suggestions.recentSearches.length === 0 && suggestions.trendingSearches.length === 0 && suggestions.topSearches.length === 0 && suggestions.popularProducts.length === 0 && (
                    <View style={S.emptyStateContainer}>
                      <Text style={S.emptyStateEmoji}>🍽️</Text>
                      <Text style={S.emptyStateText}>Find your favorite dish</Text>
                      <Text style={S.emptyStateSubtext}>Start typing to search</Text>
                    </View>
                  )}

                  {/* Recent Searches */}
                  {suggestions.recentSearches.length > 0 && (
                    <View style={S.section}>
                      <View style={S.sectionHeader}>
                        <View style={S.sectionIconContainer}>
                          <Text style={{ fontSize: 14 }}>🕒</Text>
                        </View>
                        <Text style={S.sectionLabel}>Recent Searches</Text>
                      </View>
                      <View style={S.chipRow}>
                        {suggestions.recentSearches.map((term, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={S.chipButton}
                            onPress={() => submitSearch(term)}
                            activeOpacity={0.7}
                          >
                            <Text style={S.chipText}>{term}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Trending Searches */}
                  {suggestions.trendingSearches.length > 0 && (
                    <View style={S.section}>
                      <View style={S.sectionHeader}>
                        <View style={S.sectionIconContainer}>
                          <Text style={{ fontSize: 14 }}>🔥</Text>
                        </View>
                        <Text style={S.sectionLabel}>Trending Now</Text>
                      </View>
                      {suggestions.trendingSearches.map((term, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[S.suggestionRow, idx === suggestions.trendingSearches.length - 1 && { borderBottomWidth: 0 }]}
                          onPress={() => submitSearch(term)}
                          activeOpacity={0.7}
                        >
                          <View style={S.suggestionIconBox}>
                            <Text style={{ fontSize: 13, color: "#ff6b2b" }}>🔥</Text>
                          </View>
                          <Text style={S.suggestionText}>{term}</Text>
                          <Text style={{ fontSize: 16, color: C.muted }}>↗</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Top Searches */}
                  {suggestions.topSearches.length > 0 && (
                    <View style={S.section}>
                      <View style={S.sectionHeader}>
                        <View style={S.sectionIconContainer}>
                          <Text style={{ fontSize: 14 }}>⭐</Text>
                        </View>
                        <Text style={S.sectionLabel}>Top Searches</Text>
                      </View>
                      <View style={S.chipRow}>
                        {suggestions.topSearches.map((term, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={S.chipButton}
                            onPress={() => submitSearch(term)}
                            activeOpacity={0.7}
                          >
                            <Text style={S.chipText}>{term}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Popular Products */}
                  {suggestions.popularProducts.length > 0 && (
                    <View style={S.section}>
                      <View style={S.sectionHeader}>
                        <View style={S.sectionIconContainer}>
                          <Text style={{ fontSize: 14 }}>✨</Text>
                        </View>
                        <Text style={S.sectionLabel}>Popular Dishes</Text>
                      </View>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16 }}
                      >
                        {suggestions.popularProducts.map((p) => (
                          <TouchableOpacity
                            key={p._id}
                            style={S.productCard}
                            onPress={() => {
                              setShowSuggestions(false);
                              router.push(`/go-market-product/restaurant/${p._id}` as never);
                            }}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={{ uri: p.image || FALLBACK }}
                              style={S.productImage}
                            />
                            <View style={S.productInfo}>
                              <Text style={S.productName} numberOfLines={2}>
                                {p.itemName || p.name}
                              </Text>
                              <Text style={S.productPrice}>₹{p.price}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SortModal
        visible={sortModalVisible}
        selectedSort={sort}
        onSelect={(sortKey) => setSort(sortKey)}
        onClose={() => setSortModalVisible(false)}
      />
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilter}
        filterMeta={filterMeta}
        currentFilters={{
          categoryId,
          subCategoryId,
          subSubCategoryId,
          foodType,
          minPrice,
          maxPrice,
          minRating,
          inStock,
        }}
        subCats={filteredSubCategories}
        subSubCats={filteredSubSubCategories}
        isRestaurant={true}
      />
      <AddToCartDialog
        visible={cartDialogVisible}
        product={selectedProduct}
        onClose={() => {
          setCartDialogVisible(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleConfirmAddToCart}
      />

      <TouchableOpacity
        style={[
          S.stickyCartBtn,
          { bottom: Math.max(insets.bottom, 12) + 12 }
        ]}
        onPress={() => setCartViewDialogVisible(true)}
        activeOpacity={0.9}
      >
        <View style={S.cartBtnContent}>
          <Text style={S.cartIcon}>🛒</Text>
          <Text style={S.cartBtnText}>View Cart</Text>
        </View>
      </TouchableOpacity>

      <CartViewDialog
        visible={cartViewDialogVisible}
        onClose={() => setCartViewDialogVisible(false)}
      />
    </View>
  );
}

const TILE_W = (SW - 24 - 8) / 2;

const S = StyleSheet.create({
  banner: { width: SW, height: BANNER_H, backgroundColor: "#E0D5C8" },
  bannerGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(26,20,16,0.25)",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    gap: 4,
  },
  bannerName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  bannerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  openBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  openDot: { width: 5, height: 5, borderRadius: 2.5 },
  openText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },

  logoRow: {
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: -(LOGO_SIZE / 2 + 2),
    marginBottom: 8,
  },
  logoWrap: {
    width: LOGO_SIZE + 5,
    height: LOGO_SIZE + 5,
    borderRadius: (LOGO_SIZE + 5) / 2,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: C.surface,
    alignSelf: "center",
    marginBottom: 8,
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE / 2 },

  resName: { fontSize: 15, fontWeight: "900", color: C.text, letterSpacing: -0.4, marginBottom: 3, textAlign: "center" },

  statChip: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.border,
    gap: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    minWidth: 68,
  },
  statChipIcon: { fontSize: 13 },
  statChipVal: { fontSize: 11, fontWeight: "800", color: C.text },
  statChipLabel: { fontSize: 8, fontWeight: "600", color: C.muted, textTransform: "uppercase", letterSpacing: 0.3 },

  tagBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.2 },

  descBlock: { paddingHorizontal: 14, paddingBottom: 10 },
  desc: { fontSize: 11, color: C.sub, lineHeight: 16 },
  descToggle: { fontSize: 10, fontWeight: "800", color: C.accent, marginTop: 3 },

  actions: { flexDirection: "row", gap: 6, paddingHorizontal: 14, marginBottom: 3, marginTop: 8 },
  btnPrimary: {
    flex: 1.4,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.accent,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  btnFollowed: { backgroundColor: C.greenBg, borderWidth: 1.2, borderColor: C.green, shadowOpacity: 0 },
  btnPrimaryText: { fontSize: 10, fontWeight: "900", color: "#fff", letterSpacing: 0.2 },
  btnOutline: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: C.borderStrong,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineText: { fontSize: 10, fontWeight: "700", color: C.text },

  divider: { height: 6, backgroundColor: C.border, marginVertical: 4 },

  searchSection: { flexDirection: "row", gap: 6, marginHorizontal: 12, marginBottom: 3, marginTop: 6 },
  searchBox: {
    flex: 1,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderRadius: 10,
    backgroundColor: C.surface,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, height: 38, fontSize: 11, color: C.text },
  searchBtn: {
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  suggestBox: {
    marginHorizontal: 12,
    marginTop: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  suggestText: { fontSize: 11, fontWeight: "600", color: C.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: C.bg,
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: C.surface,
    paddingTop: Platform.OS === "ios" ? 50 : (StatusBar.currentHeight ?? 0) + 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  backButtonText: {
    fontSize: 20,
    color: C.text,
    fontWeight: "600",
  },
  searchModalInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchModalIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    fontWeight: "500",
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 12,
    color: C.sub,
    fontWeight: "700",
  },
  emptyStateContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
    letterSpacing: 0.3,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: C.bg,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  suggestionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chipButton: {
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },
  productCard: {
    width: 140,
    marginRight: 14,
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 120,
    borderRadius: 0,
    resizeMode: "cover",
    backgroundColor: C.border,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 6,
    lineHeight: 17,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: C.accent,
  },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: C.border,
    borderRadius: 10,
    padding: 2.5,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 2.5,
    left: 2.5,
    bottom: 2.5,
    backgroundColor: C.surface,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  tabItem: { height: 32, alignItems: "center", justifyContent: "center" },
  tabText: { fontSize: 10, fontWeight: "700", color: C.muted },
  tabTextActive: { color: C.text },

  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.2,
    borderColor: C.borderStrong,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: C.surface,
  },
  sortChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  sortChipText: { fontSize: 13, fontWeight: "600", color: C.sub },
  sortChipTextActive: { color: "#fff", fontWeight: "700" },

  menuChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  menuChipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  menuChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.sub,
  },
  menuChipTextActive: {
    color: "#fff",
  },

  sectionHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 2 },
  sectionAccent: { width: 2.5, height: 14, borderRadius: 1.5, backgroundColor: C.accent },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: C.text, letterSpacing: -0.2 },
  sectionBadge: { backgroundColor: C.accentLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  sectionBadgeText: { fontSize: 9, fontWeight: "800", color: C.accent },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  menuImg: { width: 54, height: 54, borderRadius: 10, backgroundColor: C.border },
  menuName: { fontSize: 11, fontWeight: "800", color: C.text },
  menuDesc: { fontSize: 10, color: C.sub, lineHeight: 13 },
  menuCountBadge: { backgroundColor: C.bg, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1.5, borderWidth: 0.8, borderColor: C.border },
  menuCountText: { fontSize: 8, fontWeight: "700", color: C.sub },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: {
    width: TILE_W,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  tileFull: {
    width: "100%",
  },
  tileImg: { width: "100%", height: 120, backgroundColor: C.border, resizeMode: "cover" },
  tileBody: { padding: 10, gap: 2 },
  tileName: { fontSize: 11, fontWeight: "800", color: C.text, lineHeight: 15 },
  tileDesc: { fontSize: 10, color: C.sub, lineHeight: 13, marginTop: 1 },
  tilePrice: { fontSize: 14, fontWeight: "900", color: C.green, letterSpacing: -0.3 },
  tilePriceOld: { fontSize: 11, color: C.muted, textDecorationLine: "line-through", fontWeight: "600" },

  discountBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: C.red,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: { fontSize: 8, fontWeight: "900", color: "#fff", letterSpacing: 0.3 },
  foodTypeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  foodTypeText: { fontSize: 8, fontWeight: "700", color: "#fff", letterSpacing: 0.3, textTransform: "uppercase" },
  foodTypeBadgeInline: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  foodTypeVeg: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  foodTypeNonVeg: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  foodTypeOther: {
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  foodTypeTextInline: { fontSize: 8, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  storeClosedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(211, 47, 47, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  storeClosedText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  wishlistBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wishlistBtnActive: {
    backgroundColor: C.accent,
  },
  wishlistIcon: {
    fontSize: 14,
    color: C.accent,
  },
  wishlistIconActive: {
    color: "#fff",
  },
  vegDot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  vegDotInner: { width: 7, height: 7, borderRadius: 2 },
  tileWeight: {
    fontSize: 10,
    fontWeight: "600",
    color: C.muted,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  ratingStar: {
    fontSize: 10,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.text,
  },
  reviewCount: {
    fontSize: 9,
    fontWeight: "600",
    color: C.muted,
  },

  gridOne: {
    flexDirection: "column",
  },
  gridToggle: {
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gridToggleText: {
    color: C.accent,
    fontSize: 11,
    fontWeight: "900",
  },

  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 15, fontWeight: "700", color: C.accent, lineHeight: 18 },

  loadingWrap: { alignItems: "center", paddingVertical: 28 },
  loadingText: { fontSize: 11, color: C.muted, marginTop: 8, fontWeight: "600" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 6 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 13, fontWeight: "800", color: C.text },
  emptySub: { fontSize: 11, color: C.muted },

  stickyCartBtn: {
    position: "absolute",
    // bottom is set dynamically using insets
    left: 20,
    right: 20,
    height: 56,
    backgroundColor: C.accent,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBtnContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
});