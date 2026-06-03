import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Linking,
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
} from "react-native";
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

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get("window");
const BANNER_H = 220;
const LOGO_SIZE = 70;
const FALLBACK = "https://placehold.co/800x420/2d2416/9d7d4d?text=Restaurant";
const STATUS_H = Platform.OS === "android" ? (StatusBar.currentHeight ?? 20) : 24;

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
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 320, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, speed: 20, bounciness: 6, delay, useNativeDriver: true } as any),
    ]).start();
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

function ItemTile({ item, index, columns, onAddToCart, onWishlist, inWishlist }: { item: any; index: number; columns: 1 | 2; onAddToCart: (item: any) => void; onWishlist: (item: any) => void; inWishlist: boolean }) {
  const router = useRouter();
  const sc = useRef(new Animated.Value(1)).current;
  const imgOp = useRef(new Animated.Value(0)).current;
  const press = () => Animated.spring(sc, { toValue: 0.94, useNativeDriver: true, speed: 40 }).start();
  const release = () => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  const onImgLoad = () => Animated.timing(imgOp, { toValue: 1, duration: 220, useNativeDriver: true }).start();

  const isVeg = item.isVeg || item.category === "veg";
  const discount = item.discount || item.discountPercentage;
  const rating = item.rating || item.averageRating || 0;
  const reviewCount = item.reviewCount || item.totalReviews || 0;
  const isOutOfStock = item.stock === 0 || item.inStock === false;
  const itemName = item.itemName || item.name || item.productName;

  return (
    <FadeIn delay={index * 40}>
      <Pressable 
        onPressIn={press} 
        onPressOut={release}
        onPress={() => router.push(`/go-market-product/restaurant/${item._id}` as never)}
      >
        <Animated.View style={[S.tile, columns === 1 && S.tileFull, { transform: [{ scale: sc }] }]}>
          <View style={{ position: "relative" }}>
            <Animated.Image source={{ uri: item.image || FALLBACK }} style={[S.tileImg, { opacity: imgOp }]} onLoad={onImgLoad} />
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
            <Text style={S.tileName} numberOfLines={1}>{itemName}</Text>
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
              <View>
                <Text style={S.tilePrice}>₹{item.price}</Text>
                {item.originalPrice && item.originalPrice > item.price && (
                  <Text style={S.tilePriceOld}>₹{item.originalPrice}</Text>
                )}
              </View>
              {!isOutOfStock && (
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
  const { restaurantDetail, loading } = useAppSelector((s) => s.goMarket);
  const { isLogin, userData, myListData, cartData } = useAppSelector((s: any) => s.app);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<"featured" | "popular" | "latest">("featured");
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [sort, setSort] = useState("latest");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [gridColumns, setGridColumns] = useState<1 | 2>(2);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [cartDialogVisible, setCartDialogVisible] = useState(false);
  const [cartViewDialogVisible, setCartViewDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const searchFocused = useRef(new Animated.Value(0)).current;

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
  }, [dispatch, id]);

  const buildCatalogParams = useCallback((pageNum: number) => {
    const p = new URLSearchParams({ tab, limit: "12", page: String(pageNum), ...(sort && sort !== "latest" ? { sort } : {}) });
    if (search.trim()) p.set("q", search.trim());
    return p;
  }, [tab, sort, search]);

  const loadCatalogPage = useCallback(async (pageNum: number) => {
    if (!id) return;
    setCatalogLoading(true);
    try {
      const params = buildCatalogParams(pageNum);
      const res = await fetchDataFromApi(`/api/go-market/restaurants/${id}/catalog?${params}`);
      if (res?.success || res?.error === false) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCatalogItems(res.data || []);
      }
    } finally {
      setCatalogLoading(false);
    }
  }, [id, buildCatalogParams]);

  useEffect(() => {
    loadCatalogPage(1);
  }, [loadCatalogPage]);

  useEffect(() => {
    if (!id || !search.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetchDataFromApi(`/api/go-market/restaurants/${id}/search-suggestions?q=${encodeURIComponent(search.trim())}`)
        .then((res) => setSuggestions((res?.success || res?.error === false) ? (res.suggestions || []) : []));
    }, 200);
    return () => clearTimeout(t);
  }, [id, search]);

  const submitSearch = (query = search) => {
    const q = query.trim();
    setSearch(q);
    setShowSuggestions(false);
    setCatalogItems([]);
    loadCatalogPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
    setCatalogItems([]);
  };

  const onSearchFocus = () => Animated.timing(searchFocused, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const onSearchBlur = () => Animated.timing(searchFocused, { toValue: 0, duration: 180, useNativeDriver: false }).start();

  if (loading || !restaurantDetail) return <SkeletonScreen />;

  const { restaurant, menus, items } = restaurantDetail;

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
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const action = isFollowing ? unfollowGoRestaurant : followGoRestaurant;
      await dispatch(action(restaurant._id)).unwrap();
      dispatch(fetchGoRestaurantDetail(id!));
      showToast("success", isFollowing ? "Unfollowed" : "Following!");
    } catch {
      showToast("error", "Could not update");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleAddToCart = (product: any) => {
    // Check if product has options
    const hasOptions = (product.options?.length > 0) || (product.productOptions?.some((opt: any) => opt.values?.length > 0));
    
    if (hasOptions) {
      // Product has options, show dialog
      setSelectedProduct(product);
      setCartDialogVisible(true);
    } else {
      // Product has no options, add directly to cart
      handleConfirmAddToCart(product, null, 1);
    }
  };

  const handleConfirmAddToCart = async (product: any, selectedOption: any, quantity: number) => {
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

  const searchBorder = searchFocused.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.accent] });
  const isOpen = restaurant.isOpen ?? restaurant.status === "open";
  const hoursText = restaurant.openingHours || restaurant.workingHours || null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: Platform.OS === "ios" ? 24 : (StatusBar.currentHeight ?? 0) }}
      >
        <View style={{ height: BANNER_H, overflow: "hidden" }}>
          <Image
            source={{ uri: restaurant.restaurantBanner || FALLBACK }}
            style={S.banner}
          />
          <View style={S.bannerGradient} />
          
          {/* Restaurant Name & Badge Overlay */}
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
              style={[S.btnPrimary, isFollowing && S.btnFollowed]}
              onPress={handleFollow}
              activeOpacity={0.85}
              disabled={followBusy}
            >
              {followBusy ? (
                <ActivityIndicator size="small" color={isFollowing ? C.green : "#fff"} />
              ) : (
                <Text style={[S.btnPrimaryText, isFollowing && { color: C.green }]}>
                  {isFollowing ? "✓ Following" : "+ Follow"}
                </Text>
              )}
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
            <Animated.View style={[S.searchBox, { borderColor: searchBorder }]}>
              <Text style={{ fontSize: 12, color: C.muted, marginRight: 5 }}>🔍</Text>
              <TextInput
                style={S.searchInput}
                placeholder="Search dishes…"
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={(v) => { setSearch(v); setShowSuggestions(true); }}
                onSubmitEditing={() => submitSearch()}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={{ fontSize: 11, color: C.muted, fontWeight: "700" }}>✕</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
            <TouchableOpacity style={S.searchBtn} onPress={() => submitSearch()}>
              <Text style={S.searchBtnText}>Go</Text>
            </TouchableOpacity>
          </View>

          {showSuggestions && suggestions.length > 0 && (
            <View style={S.suggestBox}>
              {suggestions.map((s: any, idx: number) => (
                <TouchableOpacity
                  key={s._id || idx}
                  style={[S.suggestRow, idx === suggestions.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => submitSearch(s.label)}
                >
                  <Text style={{ fontSize: 10, color: C.muted, marginRight: 6 }}>🔍</Text>
                  <Text style={S.suggestText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </FadeIn>

        <TabBar
          tabs={["Featured", "Popular", "Latest"]}
          active={["featured", "popular", "latest"].indexOf(tab)}
          onChange={(i) => setTab((["featured", "popular", "latest"] as const)[i])}
        />

        <View style={S.controlRow}>
          <TouchableOpacity style={[S.sortChip, sort !== "latest" && S.sortChipActive]} onPress={() => setSortModalVisible(true)} activeOpacity={0.8}>
            <Text style={[S.sortChipText, sort !== "latest" && S.sortChipTextActive]}>
              ⇅ {sort === "latest" ? "Sort" : SORT_OPTIONS.find(o => o.key === sort)?.label ?? "Sort"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.gridToggle} onPress={() => setGridColumns(gridColumns === 2 ? 1 : 2)} activeOpacity={0.8}>
            <Text style={S.gridToggleText}>{gridColumns === 2 ? "▤ One per row" : "▦ Two per row"}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 12 }}>
          <SectionHead
            title={`${tab[0].toUpperCase()}${tab.slice(1)} Dishes`}
            count={catalogItems.length}
          />

          {menus.length > 0 && tab === "featured" && !search ? menus.slice(0, 3).map((m: any, i: number) => <MenuRow key={m._id} item={m} index={i} />) : null}

          {catalogLoading && !catalogItems.length ? (
            <View style={S.loadingWrap}>
              <ActivityIndicator color={C.accent} size="large" />
              <Text style={S.loadingText}>Finding dishes…</Text>
            </View>
          ) : catalogItems.length === 0 ? (
            <EmptyState query={search} />
          ) : (
           <View style={[S.grid, gridColumns === 1 && S.gridOne]}>
              {catalogItems.map((item: any, i: number) => (
               <ItemTile
                  key={item._id}
                  item={item}
                  index={i}
                  columns={gridColumns}
                  onAddToCart={handleAddToCart}
                  onWishlist={handleWishlist}
                  inWishlist={myListData?.some((w: any) => w?.productId === item._id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <SortModal
        visible={sortModalVisible}
        selectedSort={sort}
        onSelect={(sortKey) => setSort(sortKey)}
        onClose={() => setSortModalVisible(false)}
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

      {/* Sticky Cart Button */}
      <TouchableOpacity
        style={S.stickyCartBtn}
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
    borderWidth: 1.2,
    borderColor: C.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    backgroundColor: C.surface,
  },
  sortChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  sortChipText: { fontSize: 10, fontWeight: "700", color: C.sub },
  sortChipTextActive: { color: "#fff" },

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
    bottom: 20,
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
