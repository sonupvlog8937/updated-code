import { GoMarketShopCatalog } from "@/src/components/goMarket/GoMarketShopCatalog";
import { CartViewDialog } from "@/src/components/goMarket/CartViewDialog";
import { fetchDataFromApi } from "@/src/utils/api";
import {
  GO_MARKET_FALLBACK,
  GO_MARKET_LOGO_FALLBACK,
  gmImg,
} from "@/src/utils/goMarketMedia";
import {
  followGoShop,
  unfollowGoShop,
  useAppDispatch,
  useAppSelector,
} from "@/src/store";
import { showToast } from "@/src/utils/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  LayoutAnimation,
  Linking,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { getOutletBaseMinutes, getOutletDistanceEta } from "@/src/utils/geoCoords";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Grocery Theme Colors
const T = {
  green: "#2D5016",
  greenDark: "#1E3410",
  greenLight: "#E8F5E1",
  greenAccent: "#6BC34A",
  white: "#FFFFFF",
  bg: "#F5F8F2",
  surface: "#FFFFFF",
  border: "#E0E8D8",
  borderStrong: "#CED6C4",
  text: "#1A1A1A",
  textSoft: "#5A6B4D",
  textMuted: "#9BA896",
  gold: "#D4A574",
  goldLight: "#FEF8F3",
  red: "#D32F2F",
  shimmer1: "#E0E8D8",
  shimmer2: "#EFF3EB",
};

const { width: SCREEN_W } = Dimensions.get("window");
const BANNER_H = 180;
const LOGO_SIZE = 68;
const STATUS_H =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 20) : 44;
const GM_LOC_KEY = "gm_user_location";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function ShimmerBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [T.shimmer1, T.shimmer2],
  });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: bg }, style]}
    />
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: 10 }}>
      <ShimmerBox width="100%" height={BANNER_H} borderRadius={0} />
      <View style={[S.infoCard, { marginTop: -16 }]}>
        <ShimmerBox
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          borderRadius={14}
          style={{ alignSelf: "center", marginTop: -30, marginBottom: 8 }}
        />
        <ShimmerBox
          width={130}
          height={14}
          borderRadius={6}
          style={{ alignSelf: "center", marginBottom: 5 }}
        />
        <ShimmerBox
          width={95}
          height={10}
          borderRadius={4}
          style={{ alignSelf: "center", marginBottom: 10 }}
        />
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 5 }}>
          {[0, 1, 2, 3].map((i) => (
            <ShimmerBox key={i} width={52} height={20} borderRadius={10} />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 5, marginTop: 10 }}>
          <ShimmerBox width="50%" height={36} borderRadius={10} />
          <ShimmerBox width="25%" height={36} borderRadius={10} />
          <ShimmerBox width="25%" height={36} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

function StatChip({
  icon,
  value,
  label,
  delay,
}: {
  icon: string;
  value: string;
  label: string;
  delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        speed: 22,
        bounciness: 10,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[S.statChip, { opacity, transform: [{ scale }] }]}>
      <Text style={S.statChipIcon}>{icon}</Text>
      <View>
        <Text style={S.statChipVal}>{value}</Text>
        <Text style={S.statChipLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
}

function ShopBadge({
  label,
  icon,
  bgColor,
  textColor,
}: {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <View style={[S.shopBadge, { backgroundColor: bgColor }]}>
      <Text style={{ fontSize: 10, marginRight: 4 }}>{icon}</Text>
      <Text style={[S.shopBadgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  filled,
  busy,
  onPress,
  flex,
  isFollowing,
}: {
  label: string;
  icon?: string;
  filled?: boolean;
  busy?: boolean;
  onPress: () => void;
  flex?: number;
  isFollowing?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flex: flex ?? 1 }}
    >
      <Animated.View
        style={[
          S.actionBtn,
          filled && (isFollowing ? S.actionBtnFollowing : S.actionBtnNotFollowing),
          { transform: [{ scale }] },
          busy && { opacity: 0.65 },
        ]}
      >
        {busy ? (
          <ActivityIndicator
            size="small"
            color={filled ? (isFollowing ? T.text : T.white) : T.text}
          />
        ) : (
          <Text
            style={[
              S.actionBtnTxt,
              filled && !isFollowing && S.actionBtnTxtFilled,
              filled && isFollowing && S.actionBtnTxtFollowing,
            ]}
          >
            {icon ? `${icon} ${label}` : label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: object;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(ty, {
        toValue: 0,
        speed: 20,
        bounciness: 6,
        delay,
        useNativeDriver: true,
      } as any),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: op, transform: [{ translateY: ty }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function GoMarketShopDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLogin, userData } = useAppSelector((s: any) => s.app);
  const [authChecked, setAuthChecked] = useState(false);

  const cardSlide = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const sectionSlide = useRef(new Animated.Value(16)).current;
  const sectionOpacity = useRef(new Animated.Value(0)).current;

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [cartDialogVisible, setCartDialogVisible] = useState(false);
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
    const t = setTimeout(() => setAuthChecked(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (authChecked && !isLogin) router.replace("/login" as never);
  }, [isLogin, authChecked]);

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

  const loadShop = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchDataFromApi(
      `/api/go-market/grocery-shops/${id}/catalog?limit=1&page=1`
    )
      .then((res) => {
        if (res?.success || res?.error === false) {
          setShop(res.shop);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  useEffect(() => {
    if (!shop) return;

    Animated.stagger(60, [
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(sectionOpacity, {
          toValue: 1,
          duration: 300,
          delay: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sectionSlide, {
          toValue: 0,
          duration: 340,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [shop]);

  const handleFollow = async () => {
    if (!shop?._id || followBusy) return;
    setFollowBusy(true);
    try {
      const action = shop.isFollowing ? unfollowGoShop : followGoShop;
      const res = await dispatch(action(shop._id)).unwrap();
      const data = res?.data || res;
      setShop((s: any) => ({
        ...s,
        isFollowing: data?.isFollowing ?? !s.isFollowing,
        followerCount: data?.followerCount ?? s.followerCount,
      }));
      showToast("success", shop.isFollowing ? "Unfollowed" : "Following shop");
    } catch {
      showToast("error", "Could not update follow");
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading && !shop) {
    return (
      <View style={S.root}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LoadingSkeleton />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={S.root}>
        <StatusBar barStyle="dark-content" backgroundColor={T.white} />
        <View style={S.centered}>
          <Text style={S.notFoundIcon}>🏪</Text>
          <Text style={S.notFoundTitle}>Shop not found</Text>
          <Text style={S.notFoundSub}>
            This shop may have been removed or is unavailable.
          </Text>
          <TouchableOpacity style={S.goBackBtn} onPress={() => router.back()}>
            <Text style={S.goBackBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const followersN = shop.followerCount ?? 0;
  const productRating = shop.productAverageRating ?? shop.rating ?? 0;
  const productReviews = shop.productReviewCount ?? shop.totalReviews ?? 0;
  const isOpen = shop.isOpen ?? shop.status === "open";
  const descShort = (shop.description || "").length > 80;

  // Calculate distance and delivery time
  const { distanceDisplay, estimatedTime } = getOutletDistanceEta({
    userLat: userLocation?.lat ?? null,
    userLng: userLocation?.lng ?? null,
    shopLat: shop.latitude,
    shopLng: shop.longitude,
    marketLat: null,
    marketLng: null,
    baseMinutes: getOutletBaseMinutes("grocery"),
  });
  
  // Debug log
  console.log('🔍 Shop Distance Debug:', {
    userLocation,
    shopCoords: { lat: shop.latitude, lng: shop.longitude },
    distanceDisplay,
    estimatedTime
  });

  // ─── Shop Info Header ──────────────────────────────────────────────────────
  // Passed to GoMarketShopCatalog as listHeader so it renders inside FlatList.
  // This removes the outer ScrollView and enables native infinite scroll.
  const shopInfoHeader = (
    <View style={{ paddingTop: STATUS_H - 44 }}>
      {/* Banner */}
      <View style={S.bannerWrap}>
        <Image
          source={{ uri: gmImg(shop.shopBanner, GO_MARKET_FALLBACK) }}
          style={S.banner}
          resizeMode="cover"
        />
        <View style={S.bannerOverlay} />
        <View
          style={[
            S.statusBadge,
            {
              backgroundColor: isOpen
                ? "rgba(107,195,74,0.92)"
                : "rgba(211,47,47,0.92)",
            },
          ]}
        >
          <View
            style={[
              S.statusDot,
              { backgroundColor: isOpen ? "#A5D6A7" : "#EF9A9A" },
            ]}
          />
          <Text style={S.statusText}>{isOpen ? "Open Now" : "Closed"}</Text>
        </View>
        <View style={S.categoryBadge}>
          <Text style={{ fontSize: 11, marginRight: 4 }}>🛒</Text>
          <Text style={S.categoryBadgeTxt}>Grocery</Text>
        </View>
      </View>

      {/* Info Card */}
      <FadeIn delay={0}>
        <Animated.View
          style={[
            S.infoCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardSlide }],
            },
          ]}
        >
          <View style={S.logoWrap}>
            <Image
              source={{ uri: gmImg(shop.shopLogo, GO_MARKET_LOGO_FALLBACK) }}
              style={S.logo}
              resizeMode="cover"
            />
            <View style={S.onlineDot} />
          </View>

          <Text style={S.shopName}>{shop.shopName}</Text>

          {(shop.isPureVeg || shop.hasFastDelivery) && (
            <View style={S.badgesRow}>
              {shop.isPureVeg && (
                <ShopBadge
                  label="Pure Veg"
                  icon="🌿"
                  bgColor={T.greenLight}
                  textColor={T.green}
                />
              )}
              {shop.hasFastDelivery && (
                <ShopBadge
                  label="Fast Delivery"
                  icon="⚡"
                  bgColor="#FFF3E0"
                  textColor="#E65100"
                />
              )}
            </View>
          )}

          {!!shop.address && (
            <View style={S.addressRow}>
              <Text style={S.addressIcon}>📍</Text>
              <Text style={S.shopAddr} numberOfLines={2}>
                {shop.address}
              </Text>
            </View>
          )}

          {shop.openingHours && (
            <View style={S.addressRow}>
              <Text style={S.addressIcon}>🕐</Text>
              <Text style={S.shopAddr} numberOfLines={1}>
                {shop.openingHours}
              </Text>
            </View>
          )}

          {/* Distance & Delivery Time */}
          {distanceDisplay != null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, justifyContent: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: T.goldLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ fontSize: 10 }}>📍</Text>
                <Text style={{ fontSize: 10, fontWeight: "700", color: T.green }}>{distanceDisplay}</Text>
              </View>
              {estimatedTime != null && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ fontSize: 10 }}>🕐</Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#92400E" }}>{estimatedTime} min</Text>
                </View>
              )}
            </View>
          )}

          <View style={S.divider} />

          <View style={S.statsRow}>
            <StatChip
              icon="⭐"
              value={Number(productRating || 0).toFixed(1)}
              label="Rating"
              delay={0}
            />
            <StatChip
              icon="👥"
              value={formatCount(followersN)}
              label="Followers"
              delay={50}
            />
            <StatChip
              icon="💬"
              value={formatCount(productReviews)}
              label="Reviews"
              delay={100}
            />
            <StatChip
              icon="📦"
              value={formatCount(shop.totalProducts || 0)}
              label="Products"
              delay={150}
            />
          </View>

          {!!shop.description && (
            <View>
              <Text
                style={S.desc}
                numberOfLines={descExpanded ? undefined : 2}
              >
                {shop.description}
              </Text>
              {descShort && (
                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setDescExpanded(!descExpanded);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={S.descToggle}>
                    {descExpanded ? "Show less ▲" : "Read more ▼"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={S.divider} />

          <View style={S.actions}>
            <ActionButton
              label={shop.isFollowing ? "Following" : "Follow"}
              icon={shop.isFollowing ? "✓" : "❤️"}
              filled={true}
              busy={followBusy}
              onPress={handleFollow}
              flex={2}
              isFollowing={shop.isFollowing}
            />
            <ActionButton
              label="Share"
              icon="↗"
              filled={false}
              onPress={() =>
                Share.share({ message: `${shop.shopName}\n${shop.address}` })
              }
              flex={1}
            />
            {!!shop.ownerId?.mobile && (
              <ActionButton
                label="Call"
                icon="📞"
                filled={false}
                onPress={() => Linking.openURL(`tel:${shop.ownerId.mobile}`)}
                flex={1}
              />
            )}
          </View>
        </Animated.View>
      </FadeIn>

      {/* Products Section Header */}
      <FadeIn delay={60}>
        <Animated.View
          style={{
            opacity: sectionOpacity,
            transform: [{ translateY: sectionSlide }],
          }}
        >
          <View style={S.sectionHeader}>
            <View style={S.sectionTitleWrap}>
              <View style={S.sectionAccent} />
              <Text style={S.secTitle}>Products</Text>
            </View>
            <View style={S.productCountBadge}>
              <Text style={S.productCountTxt}>
                {formatCount(shop.totalProducts || 0)}
              </Text>
            </View>
          </View>
        </Animated.View>
      </FadeIn>
    </View>
  );

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* GoMarketShopCatalog now owns the ONLY FlatList/scroll.
          shopInfoHeader (banner + info card + section title) is injected
          as ListHeaderComponent so infinite scroll works natively. */}
      {id ? (
        <GoMarketShopCatalog shopId={id} listHeader={shopInfoHeader} shopIsOpen={isOpen} />
      ) : null}

      {/* Sticky Cart Button — absolute over the FlatList */}
      <TouchableOpacity
        style={[
          S.stickyCartBtn,
          { bottom: Math.max(insets.bottom, 12) + 12 }
        ]}
        onPress={() => setCartDialogVisible(true)}
        activeOpacity={0.9}
      >
        <View style={S.cartBtnContent}>
          <Text style={S.cartIcon}>🛒</Text>
          <Text style={S.cartBtnText}>View Cart</Text>
        </View>
      </TouchableOpacity>

      <CartViewDialog
        visible={cartDialogVisible}
        onClose={() => setCartDialogVisible(false)}
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },

  bannerWrap: { height: BANNER_H, overflow: "hidden", backgroundColor: "#C8D5B8" },
  banner: { width: SCREEN_W, height: BANNER_H, backgroundColor: "#C8D5B8" },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,26,26,0.20)",
  },
  statusBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },

  categoryBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(45,80,22,0.92)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadgeTxt: { color: T.white, fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  infoCard: {
    marginHorizontal: 10,
    marginTop: -18,
    backgroundColor: T.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  logoWrap: { alignSelf: "center", marginTop: -30, marginBottom: 8, position: "relative" },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: T.white,
  },
  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: T.greenAccent,
    borderWidth: 2.5,
    borderColor: T.white,
    position: "absolute",
    bottom: 0,
    right: 0,
    shadowColor: T.greenAccent,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },

  shopName: {
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    color: T.text,
    letterSpacing: -0.4,
    lineHeight: 18,
  },

  badgesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  shopBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  shopBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.2 },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 3,
    marginTop: 3,
    paddingHorizontal: 8,
  },
  addressIcon: { fontSize: 10, marginTop: 0.5, color: T.textSoft },
  shopAddr: { fontSize: 10, color: T.textSoft, textAlign: "center", lineHeight: 13, flex: 1 },

  divider: {
    height: 0.8,
    backgroundColor: T.border,
    marginVertical: 8,
    marginHorizontal: -4,
  },

  statsRow: { flexDirection: "row", justifyContent: "center", gap: 5, flexWrap: "wrap" },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.bg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 0.8,
    borderColor: T.border,
    minWidth: 56,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  statChipIcon: { fontSize: 11 },
  statChipVal: { fontSize: 11, fontWeight: "800", color: T.text, letterSpacing: -0.2 },
  statChipLabel: { fontSize: 8, fontWeight: "600", color: T.textMuted, marginTop: 0.5 },

  desc: { fontSize: 10, color: T.textSoft, lineHeight: 14, marginBottom: 2 },
  descToggle: { fontSize: 9, fontWeight: "800", color: T.greenAccent, marginTop: 2 },

  actions: { flexDirection: "row", gap: 5 },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.bg,
    borderWidth: 0.8,
    borderColor: T.border,
    minHeight: 38,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnFollowing: { backgroundColor: T.greenLight, borderColor: T.text },
  actionBtnNotFollowing: { backgroundColor: T.red, borderColor: T.red },
  actionBtnTxt: { color: T.text, fontWeight: "800", fontSize: 10, letterSpacing: -0.2 },
  actionBtnTxtFilled: { color: T.white },
  actionBtnTxtFollowing: { color: T.text },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionTitleWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  sectionAccent: { width: 2.5, height: 16, borderRadius: 1.5, backgroundColor: T.green },
  secTitle: { fontSize: 13, fontWeight: "900", color: T.text, letterSpacing: -0.3 },
  productCountBadge: {
    backgroundColor: T.greenLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  productCountTxt: { fontSize: 9, fontWeight: "700", color: T.green },

  notFoundIcon: { fontSize: 40 },
  notFoundTitle: { fontSize: 14, fontWeight: "800", color: T.text },
  notFoundSub: {
    fontSize: 11,
    color: T.textSoft,
    textAlign: "center",
    lineHeight: 14,
  },
  goBackBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: T.green,
    borderRadius: 10,
  },
  goBackBtnTxt: { color: T.white, fontWeight: "800", fontSize: 11 },

  stickyCartBtn: {
    position: "absolute",
    // bottom is set dynamically using insets
    left: 20,
    right: 20,
    height: 56,
    backgroundColor: T.green,
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
  cartIcon: { fontSize: 24 },
  cartBtnText: { fontSize: 16, fontWeight: "900", color: T.white, letterSpacing: 0.3 },
});