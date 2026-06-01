import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  View,
} from "react-native";
import {
  fetchGoRestaurantDetail,
  followGoRestaurant,
  unfollowGoRestaurant,
  useAppDispatch,
  useAppSelector,
} from "@/src/store";
import { showToast } from "@/src/utils/toast";

const { width: SW } = Dimensions.get("window");
const BANNER_H = 220;
const LOGO_SIZE = 72;
const FALLBACK = "https://placehold.co/800x420/f0f0f0/999999?text=GoMarket";
const STATUS_H = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 48;

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  border: "#F0F0F0",
  text: "#111111",
  sub: "#6B6B6B",
  muted: "#ABABAB",
  accent: "#FF4D00",
  accentBg: "#FFF2EE",
  green: "#0A8A5F",
  greenBg: "#E6F5F0",
  ink: "#1A1A1A",
};

// ─── Skeleton ───────────────────────────────────────────────────────────────
function Bone({ w, h, r = 8, style }: { w?: number | string; h: number; r?: number; style?: object }) {
  const op = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[{ width: w ?? "100%", height: h, borderRadius: r, backgroundColor: "#E0E0E0", opacity: op }, style]}
    />
  );
}

function SkeletonScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Bone w={SW} h={BANNER_H} r={0} />
      <View style={{ padding: 16, gap: 10, marginTop: 8 }}>
        <Bone h={LOGO_SIZE} w={LOGO_SIZE} r={LOGO_SIZE / 2} />
        <Bone h={18} w="52%" />
        <Bone h={12} w="36%" />
        <Bone h={12} w="78%" />
        <Bone h={12} w="62%" />
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          {[1, 2, 3].map((k) => <Bone key={k} h={36} r={10} style={{ flex: 1 }} />)}
        </View>
        {[1, 2, 3].map((k) => <Bone key={k} h={68} r={12} style={{ marginTop: 6 }} />)}
      </View>
    </View>
  );
}

// ─── Stat pill ──────────────────────────────────────────────────────────────
function Pill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={S.pill}>
      <Text style={S.pillEmoji}>{emoji}</Text>
      <Text style={S.pillLabel}>{label}</Text>
    </View>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────
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

// ─── Menu row ───────────────────────────────────────────────────────────────
function MenuRow({ item }: { item: any }) {
  return (
    <View style={S.menuRow}>
      <Image source={{ uri: item.image || FALLBACK }} style={S.menuImg} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={S.menuName} numberOfLines={1}>{item.menuName}</Text>
        {!!item.description && (
          <Text style={S.menuDesc} numberOfLines={2}>{item.description}</Text>
        )}
        {item.totalItems != null && (
          <Text style={S.menuMeta}>{item.totalItems} items</Text>
        )}
      </View>
      <View style={S.menuChevron}>
        <Text style={{ fontSize: 12, color: C.muted }}>›</Text>
      </View>
    </View>
  );
}

// ─── Item tile ──────────────────────────────────────────────────────────────
function ItemTile({ item, onPress }: { item: any; onPress?: () => void }) {
  const sc = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(sc, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const release = () => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  return (
    <Pressable onPressIn={press} onPressOut={release} onPress={onPress}>
      <Animated.View style={[S.tile, { transform: [{ scale: sc }] }]}>
        <Image source={{ uri: item.image || FALLBACK }} style={S.tileImg} />
        <View style={S.tileBody}>
          <Text style={S.tileName} numberOfLines={1}>{item.itemName}</Text>
          {!!item.description && (
            <Text style={S.tileDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <Text style={S.tilePrice}>₹{item.price}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Tab bar ────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <View style={S.tabBar}>
      {tabs.map((t, i) => (
        <TouchableOpacity key={i} style={[S.tabItem, active === i && S.tabItemActive]} onPress={() => onChange(i)} activeOpacity={0.75}>
          <Text style={[S.tabText, active === i && S.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function GoMarketRestaurantDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { restaurantDetail, loading } = useAppSelector((s) => s.goMarket);
  const { isLogin } = useAppSelector((s: any) => s.app);
  const [tab, setTab] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Login protection - redirect to login if not authenticated
  useEffect(() => {
    if (!isLogin) {
      router.replace("/login" as never);
    }
  }, [isLogin]);

  useEffect(() => { if (id) dispatch(fetchGoRestaurantDetail(id)); }, [dispatch, id]);

  if (loading || !restaurantDetail) return <SkeletonScreen />;

  const { restaurant, menus, items } = restaurantDetail;

  const headerBg = scrollY.interpolate({
    inputRange: [BANNER_H - 64, BANNER_H - 16],
    outputRange: ["rgba(250,250,250,0)", "rgba(250,250,250,1)"],
    extrapolate: "clamp",
  });
  const titleOp = scrollY.interpolate({
    inputRange: [BANNER_H - 48, BANNER_H],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const btnBg = scrollY.interpolate({
    inputRange: [BANNER_H - 80, BANNER_H - 20],
    outputRange: ["rgba(0,0,0,0.28)", "rgba(240,240,240,1)"],
    extrapolate: "clamp",
  });
  const btnColor = scrollY.interpolate({
    inputRange: [BANNER_H - 80, BANNER_H - 20],
    outputRange: ["rgba(255,255,255,1)", "rgba(17,17,17,1)"],
    extrapolate: "clamp",
  });

  const isFollowing = Boolean(restaurant.isFollowing);
  const followerCount = restaurant.followerCount ?? restaurant.followers?.length ?? 0;
  const reviewCount = restaurant.totalReviews ?? 0;

  const handleFollow = async () => {
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const action = isFollowing ? unfollowGoRestaurant : followGoRestaurant;
      await dispatch(action(restaurant._id)).unwrap();
      dispatch(fetchGoRestaurantDetail(id!));
      showToast("success", isFollowing ? "Unfollowed" : "Following restaurant");
    } catch {
      showToast("error", "Could not update follow");
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sticky header */}
      <Animated.View style={[S.header, { backgroundColor: headerBg, paddingTop: STATUS_H }]}>
        <Animated.View style={[S.iconBtn, { backgroundColor: btnBg }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Animated.Text style={[S.iconBtnText, { color: btnColor }]}>←</Animated.Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text style={[S.headerTitle, { opacity: titleOp }]} numberOfLines={1}>
          {restaurant.restaurantName}
        </Animated.Text>

        <Animated.View style={[S.iconBtn, { backgroundColor: btnBg }]}>
          <TouchableOpacity
            onPress={() => Share.share({ title: restaurant.restaurantName, message: restaurant.address })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.Text style={[S.iconBtnText, { color: btnColor }]}>↑</Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Scroll body */}
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Banner */}
        <Image source={{ uri: restaurant.restaurantBanner || FALLBACK }} style={S.banner} />

        {/* Logo */}
        <View style={S.logoRow}>
          <View style={S.logoWrap}>
            <Image source={{ uri: restaurant.restaurantLogo || FALLBACK }} style={S.logo} />
          </View>
        </View>

        {/* Info */}
        <View style={S.infoBlock}>
          <Text style={S.resName}>{restaurant.restaurantName}</Text>
          {!!restaurant.address && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
              <Text style={{ fontSize: 10, color: C.muted }}>📍</Text>
              <Text style={S.address} numberOfLines={1}>{restaurant.address}</Text>
            </View>
          )}

          {/* Stat pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
            contentContainerStyle={{ gap: 6 }}
          >
            <Pill emoji="⭐" label={`${Number(restaurant.rating ?? 0).toFixed(1)}`} />
            <Pill emoji="💬" label={`${reviewCount} reviews`} />
            <Pill emoji="👥" label={`${followerCount} followers`} />
            <Pill emoji="🍽" label={`${restaurant.totalMenus ?? menus.length} menus`} />
            <Pill emoji="🥘" label={`${restaurant.totalItems ?? items.length} items`} />
          </ScrollView>

          {/* Description */}
          {!!restaurant.description && (
            <Text style={S.desc}>{restaurant.description}</Text>
          )}

          {/* Action buttons */}
          <View style={S.actions}>
            <TouchableOpacity
              style={[S.btnPrimary, isFollowing && S.btnFollowed]}
              onPress={handleFollow}
              activeOpacity={0.8}
              disabled={followBusy}
            >
              <Text style={[S.btnPrimaryText, isFollowing && { color: C.green }]}>
                {isFollowing ? "✓ Following" : "+ Follow"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={S.btnOutline}
              onPress={() => Share.share({ title: restaurant.restaurantName, message: restaurant.address })}
              activeOpacity={0.8}
            >
              <Text style={S.btnOutlineText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={S.btnOutline}
              onPress={() => Linking.openURL(`tel:${restaurant.ownerId?.mobile ?? ""}`)}
              activeOpacity={0.8}
            >
              <Text style={S.btnOutlineText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Thick divider */}
        <View style={S.divider} />

        {/* Tabs */}
        <TabBar
          tabs={[`Menus  ${menus.length}`, `Items  ${items.length}`]}
          active={tab}
          onChange={setTab}
        />

        {/* Content */}
        {tab === 0 ? (
          <View style={{ paddingHorizontal: 14, paddingTop: 2 }}>
            <SectionHead title="All Menus" count={menus.length} />
            {menus.length === 0
              ? <Text style={S.empty}>No menus yet.</Text>
              : menus.map((m: any) => <MenuRow key={m._id} item={m} />)
            }
          </View>
        ) : (
          <View style={{ paddingHorizontal: 14, paddingTop: 2 }}>
            <SectionHead title="All Items" count={items.length} />
            {items.length === 0
              ? <Text style={S.empty}>No items yet.</Text>
              : (
                <View style={S.grid}>
                  {items.map((i: any) => (
                    <ItemTile
                      key={i._id}
                      item={i}
                      onPress={() => router.push(`/go-market-product/restaurant/${i._id}` as never)}
                    />
                  ))}
                </View>
              )
            }
          </View>
        )}
      </Animated.ScrollView>

    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const TILE_W = (SW - 28 - 10) / 2;

const S = StyleSheet.create({
  // Header
  header: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 99,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingBottom: 10, gap: 8,
  },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  iconBtnText: { fontSize: 15, fontWeight: "700" },
  headerTitle: {
    flex: 1, textAlign: "center",
    fontSize: 13, fontWeight: "700", color: C.text, letterSpacing: -0.2,
  },

  // Banner + logo
  banner: { width: SW, height: BANNER_H, backgroundColor: "#E0E0E0" },
  logoRow: {
    paddingHorizontal: 16,
    marginTop: -(LOGO_SIZE / 2 + 2),
    marginBottom: 8,
  },
  logoWrap: {
    width: LOGO_SIZE + 4, height: LOGO_SIZE + 4,
    borderRadius: (LOGO_SIZE + 4) / 2,
    backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 5,
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE / 2 },

  // Info
  infoBlock: { paddingHorizontal: 16, paddingBottom: 16 },
  resName: { fontSize: 18, fontWeight: "800", color: C.text, letterSpacing: -0.4 },
  address: { fontSize: 11, color: C.sub, flex: 1 },

  // Pills
  pill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.border, borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  pillEmoji: { fontSize: 10 },
  pillLabel: { fontSize: 10, fontWeight: "700", color: C.sub },

  // Desc
  desc: { fontSize: 12, color: C.sub, lineHeight: 17, marginTop: 10 },

  // Actions
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  btnPrimary: {
    flex: 1.4, height: 36, borderRadius: 10,
    backgroundColor: C.ink, alignItems: "center", justifyContent: "center",
  },
  btnFollowed: { backgroundColor: C.greenBg },
  btnPrimaryText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.2 },
  btnOutline: {
    flex: 1, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
  },
  btnOutlineText: { fontSize: 11, fontWeight: "700", color: C.text },

  // Divider
  divider: { height: 6, backgroundColor: C.border, marginVertical: 4 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 14, marginVertical: 10,
    backgroundColor: C.border, borderRadius: 10, padding: 3,
  },
  tabItem: {
    flex: 1, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  tabItemActive: {
    backgroundColor: C.surface,
    shadowColor: "#000", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  tabText: { fontSize: 11, fontWeight: "700", color: C.muted },
  tabTextActive: { color: C.text },

  // Section head
  sectionHead: {
    flexDirection: "row", alignItems: "center",
    gap: 7, marginBottom: 10, marginTop: 2,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: C.accent },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: C.text, letterSpacing: -0.2 },
  sectionBadge: {
    backgroundColor: C.accentBg, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: 10, fontWeight: "800", color: C.accent },

  // Menu row
  menuRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surface, borderRadius: 12,
    padding: 10, marginBottom: 7,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1,
  },
  menuImg: { width: 56, height: 56, borderRadius: 10, backgroundColor: C.border },
  menuName: { fontSize: 12, fontWeight: "800", color: C.text },
  menuDesc: { fontSize: 11, color: C.sub, lineHeight: 15 },
  menuMeta: { fontSize: 10, fontWeight: "700", color: C.muted, marginTop: 2 },
  menuChevron: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.border, alignItems: "center", justifyContent: "center",
  },

  // Items grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: TILE_W, borderRadius: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2,
  },
  tileImg: { width: "100%", height: 100, backgroundColor: C.border },
  tileBody: { padding: 8, gap: 2 },
  tileName: { fontSize: 11, fontWeight: "800", color: C.text },
  tileDesc: { fontSize: 10, color: C.sub, lineHeight: 13 },
  tilePrice: { fontSize: 12, fontWeight: "800", color: C.green, marginTop: 3 },

  // Empty
  empty: { textAlign: "center", color: C.muted, fontSize: 12, paddingVertical: 28 },
});