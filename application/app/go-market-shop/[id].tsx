import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchGoShopDetail, followGoShop, useAppDispatch, useAppSelector } from "@/src/store";

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
  red:         "#EF4444",
  redLight:    "#FEE2E2",
};

const { width: SW } = Dimensions.get("window");
const FALLBACK = "https://placehold.co/800x420/FFF3ED/FF6B2C?text=Shop";
const PROD_FB  = "https://placehold.co/400x400/FFF3ED/FF6B2C?text=Product";

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

const LoadingSkeleton = () => (
  <View style={{ backgroundColor: T.bg, flex: 1 }}>
    <Pulse style={{ height: 220 }} />
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
        <Pulse style={{ width: 84, height: 84, borderRadius: 20, marginTop: -42 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <Pulse style={{ height: 18, width: "70%" }} />
          <Pulse style={{ height: 13, width: "50%" }} />
        </View>
      </View>
      <Pulse style={{ height: 13, width: "90%" }} />
      <Pulse style={{ height: 13, width: "60%" }} />
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        {[1,2,3].map(i => <Pulse key={i} style={{ flex: 1, height: 42, borderRadius: 12 }} />)}
      </View>
    </View>
  </View>
);

// ─── Product Tile ─────────────────────────────────────────────────────────────
const ProductTile = ({ product, onPress }: { product: any; onPress: () => void }) => {
  const sc = useRef(new Animated.Value(1)).current;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discount    = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <Animated.View style={[styles.tile, { transform: [{ scale: sc }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => Animated.timing(sc, { toValue: 0.96, duration: 80, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(sc, { toValue: 1,    duration: 80, useNativeDriver: true }).start()}
      >
        <View style={{ position: "relative" }}>
          <Image source={{ uri: product.image || PROD_FB }} style={styles.productImg} />
          {hasDiscount && (
            <View style={styles.discBadge}>
              <Text style={styles.discTxt}>{discount}% OFF</Text>
            </View>
          )}
          {product.stock <= 0 && (
            <View style={styles.oosBadge}>
              <Text style={styles.oosTxt}>Out of Stock</Text>
            </View>
          )}
        </View>
        <View style={{ padding: 9 }}>
          <Text style={styles.prodName} numberOfLines={2}>{product.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 }}>
            <Text style={styles.prodPrice}>₹{hasDiscount ? product.discountPrice : product.price}</Text>
            {hasDiscount && <Text style={styles.prodMrp}>₹{product.price}</Text>}
          </View>
          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: product.stock > 0 ? T.green : T.red }]} />
            <Text style={[styles.stockTxt, { color: product.stock > 0 ? T.green : T.red }]}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Stat Pill ────────────────────────────────────────────────────────────────
const StatPill = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => (
  <View style={styles.statPill}>
    <Text style={{ fontSize: 13 }}>{icon}</Text>
    <View>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  </View>
);

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn = ({
  icon, label, onPress, variant = "outline",
}: {
  icon: string; label: string; onPress: () => void; variant?: "primary" | "outline" | "danger";
}) => {
  const bgMap   = { primary: T.black,      outline: T.white,     danger: T.redLight };
  const txtMap  = { primary: T.white,      outline: T.text,      danger: T.red };
  const brdMap  = { primary: T.black,      outline: T.border,    danger: T.red };

  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: bgMap[variant], borderColor: brdMap[variant] }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text style={[styles.actionBtnTxt, { color: txtMap[variant] }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GoMarketShopDetails() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router   = useRouter();

  const [productSearch, setProductSearch] = useState("");
  const [sortBy,        setSortBy]        = useState<"default" | "price_asc" | "price_desc" | "stock">("default");
  const [followed,      setFollowed]      = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  const { shopDetail, loading } = useAppSelector((s: any) => s.goMarket);

  useEffect(() => {
    if (id) dispatch(fetchGoShopDetail(id));
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [id]);

  if (loading || !shopDetail) return <LoadingSkeleton />;

  const { shop, products } = shopDetail;

  // Filter + sort products
  let filtered = [...products];
  if (productSearch.trim()) {
    const q = productSearch.toLowerCase();
    filtered = filtered.filter((p: any) => p.name?.toLowerCase().includes(q));
  }
  if (sortBy === "price_asc")  filtered.sort((a: any, b: any) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  if (sortBy === "price_desc") filtered.sort((a: any, b: any) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  if (sortBy === "stock")      filtered.sort((a: any, b: any) => b.stock - a.stock);

  const inStock    = products.filter((p: any) => p.stock > 0).length;
  const followersN = Array.isArray(shop.followers) ? shop.followers.length : Number(shop.followers || 0);

  const handleFollow = async () => {
    await dispatch(followGoShop(shop._id));
    setFollowed(f => !f);
  };

  const handleShare = () =>
    Share.share({ title: shop.shopName, message: `${shop.shopName}\n${shop.address}` });

  const handleContact = () => {
    const phone = shop.ownerId?.mobile || "";
    if (!phone) { Alert.alert("No contact", "This shop has no contact number."); return; }
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Animated.ScrollView
        style={{ opacity: fade }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Banner ── */}
        <View style={styles.bannerWrap}>
          <Image source={{ uri: shop.shopBanner || FALLBACK }} style={styles.banner} />
          <View style={styles.bannerScrim} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={{ fontSize: 16, color: T.white }}>‹</Text>
          </TouchableOpacity>

          {/* Share on banner */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Text style={{ fontSize: 13 }}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info Card ── */}
        <View style={styles.infoCard}>

          {/* Logo + name row */}
          <View style={styles.logoRow}>
            <Image source={{ uri: shop.shopLogo || FALLBACK }} style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopName}>{shop.shopName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={{ fontSize: 11 }}>📍</Text>
                <Text style={styles.shopAddr} numberOfLines={1}>{shop.address}</Text>
              </View>
            </View>
          </View>

          {/* "LOCAL COMMERCE" pill */}
          <View style={styles.badgePill}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeTxt}>GROCERY SHOP</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatPill icon="⭐" value={shop.rating || "0"} label="Rating" />
            <View style={styles.statDiv} />
            <StatPill icon="👥" value={followersN} label="Followers" />
            <View style={styles.statDiv} />
            <StatPill icon="📦" value={shop.totalProducts || products.length} label="Products" />
            <View style={styles.statDiv} />
            <StatPill icon="✅" value={inStock} label="In Stock" />
          </View>

          {/* Description */}
          {!!shop.description && (
            <Text style={styles.desc}>{shop.description}</Text>
          )}

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <ActionBtn
              icon={followed ? "✓" : "＋"}
              label={followed ? "Following" : "Follow"}
              onPress={handleFollow}
              variant={followed ? "outline" : "primary"}
            />
            <ActionBtn icon="↗" label="Share"   onPress={handleShare}   variant="outline" />
            <ActionBtn icon="📞" label="Contact" onPress={handleContact} variant="outline" />
          </View>
        </View>

        {/* ── Products section ── */}
        <View style={styles.productsCard}>

          {/* Section header */}
          <View style={styles.secHeader}>
            <Text style={styles.secTitle}>Products</Text>
            <View style={styles.countTag}>
              <Text style={styles.countTxt}>{filtered.length}</Text>
            </View>
          </View>

          {/* Product search */}
          <View style={styles.prodSearch}>
            <Text style={{ fontSize: 13, color: T.textSoft }}>🔍</Text>
            <TextInput
              style={styles.prodSearchInput}
              placeholder="Search products…"
              placeholderTextColor={T.textSoft}
              value={productSearch}
              onChangeText={setProductSearch}
            />
            {productSearch.length > 0 && (
              <TouchableOpacity onPress={() => setProductSearch("")}>
                <View style={styles.clearX}><Text style={{ fontSize: 9, color: T.textSoft }}>✕</Text></View>
              </TouchableOpacity>
            )}
          </View>

          {/* Sort chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
            {([
              { k: "default",    l: "Default"       },
              { k: "price_asc",  l: "Price: Low ↑"  },
              { k: "price_desc", l: "Price: High ↓" },
              { k: "stock",      l: "In Stock"       },
            ] as const).map(({ k, l }) => (
              <TouchableOpacity
                key={k}
                style={[styles.sortChip, sortBy === k && styles.sortChipOn]}
                onPress={() => setSortBy(k)}
              >
                <Text style={[styles.sortChipTxt, sortBy === k && styles.sortChipTxtOn]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Grid */}
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIco}>📦</Text>
              <Text style={styles.emptyTxt}>
                {productSearch ? "No products match your search." : "No products in this shop yet."}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map((p: any) => (
                <ProductTile key={p._id} product={p} onPress={() => {}} />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const TILE_W = (SW - 14 * 2 - 16 * 2 - 10) / 2;

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },
  scroll: { paddingBottom: 100 },

  // Banner
  bannerWrap:  { position: "relative" },
  banner:      { width: "100%", height: 220 },
  bannerScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
  backBtn: {
    position: "absolute", top: Platform.OS === "ios" ? 54 : 18, left: 14,
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  shareBtn: {
    position: "absolute", top: Platform.OS === "ios" ? 54 : 18, right: 14,
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },

  // Info Card
  infoCard: {
    backgroundColor: T.white,
    marginHorizontal: 14,
    marginTop: -20,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 14,
  },

  logoRow:  { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 12 },
  logo: {
    width: 78, height: 78, borderRadius: 18,
    marginTop: -46,
    borderWidth: 3, borderColor: T.white,
    backgroundColor: T.orangeLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  shopName: { fontSize: 20, fontWeight: "900", color: T.text, letterSpacing: -0.3, marginBottom: 3 },
  shopAddr: { fontSize: 11.5, color: T.textSoft, fontWeight: "500", flex: 1 },

  badgePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1, borderColor: T.border,
    borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 14,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.orange },
  badgeTxt: { fontSize: 10, fontWeight: "800", color: T.textMid, letterSpacing: 0.7 },

  // Stats
  statsRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.bg,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1, borderColor: T.border,
  },
  statPill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  statVal:  { fontSize: 14, fontWeight: "900", color: T.orange },
  statLbl:  { fontSize: 10, color: T.textSoft, fontWeight: "600" },
  statDiv:  { width: 1, height: 28, backgroundColor: T.border },

  desc: { fontSize: 13, color: T.textMid, lineHeight: 19, marginBottom: 14 },

  // Actions
  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5,
  },
  actionBtnTxt: { fontSize: 12, fontWeight: "800" },

  // Products card
  productsCard: {
    backgroundColor: T.white,
    marginHorizontal: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1, borderColor: T.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  secHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  secTitle:  { fontSize: 18, fontWeight: "900", color: T.text, letterSpacing: -0.3 },
  countTag: {
    backgroundColor: T.orangeLight, borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3,
    borderWidth: 1, borderColor: T.borderWarm,
  },
  countTxt: { fontSize: 11, fontWeight: "800", color: T.orange },

  // Product search
  prodSearch: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: T.border,
    borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 11 : 4,
    backgroundColor: T.bg, marginBottom: 10,
  },
  prodSearchInput: { flex: 1, fontSize: 13, color: T.text, fontWeight: "500" },
  clearX: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: "#EEEEEE",
    alignItems: "center", justifyContent: "center",
  },

  // Sort chips
  sortRow: { gap: 8, paddingBottom: 12 },
  sortChip: {
    borderWidth: 1.5, borderColor: T.border, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: T.white,
  },
  sortChipOn:    { backgroundColor: T.black, borderColor: T.black },
  sortChipTxt:   { fontSize: 11, fontWeight: "700", color: T.textMid },
  sortChipTxtOn: { color: T.white },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: TILE_W,
    backgroundColor: T.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1, borderColor: T.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  productImg: { width: "100%", height: 120 },

  discBadge: {
    position: "absolute", top: 7, left: 7,
    backgroundColor: T.orange, borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  discTxt: { fontSize: 9, fontWeight: "900", color: T.white },

  oosBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  oosTxt: { color: T.white, fontSize: 11, fontWeight: "800" },

  prodName:  { fontSize: 12.5, fontWeight: "800", color: T.text, lineHeight: 17, marginBottom: 2 },
  prodPrice: { fontSize: 14, fontWeight: "900", color: T.orange },
  prodMrp:   { fontSize: 11, color: T.textSoft, textDecorationLine: "line-through", fontWeight: "600" },

  stockRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockTxt: { fontSize: 10, fontWeight: "700" },

  // Empty
  emptyWrap: { alignItems: "center", paddingVertical: 36, gap: 8 },
  emptyIco:  { fontSize: 34, opacity: 0.35 },
  emptyTxt:  { fontSize: 13, color: T.textSoft, fontWeight: "600", textAlign: "center" },
});