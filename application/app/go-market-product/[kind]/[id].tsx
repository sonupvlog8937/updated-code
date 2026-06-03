import { ProductReviewsSection } from "@/src/components/goMarket/ProductReviewsSection";
import { addToCart, useAppDispatch, useAppSelector } from "@/src/store";
import { fetchDataFromApi } from "@/src/utils/api";
import { gmImg } from "@/src/utils/goMarketMedia";
import { showToast } from "@/src/utils/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const T = { orange: "#FF6B2C", white: "#FFF", bg: "#F9F9F9", border: "#EBEBEB", text: "#111", textSoft: "#999", black: "#111", green: "#16A34A" };
const FALLBACK = "https://placehold.co/600x600/FFF3ED/FF6B2C?text=Product";
const cleanText = (value: unknown) => String(value ?? "").trim();
const normalizeProductOptions = (options: any[] = []) =>
  (Array.isArray(options) ? options : [])
    .map((opt: any) => {
      const key = cleanText(opt?.name || opt?.label);
      const values = [...new Set((Array.isArray(opt?.values) ? opt.values : []).map(cleanText).filter(Boolean))];
      if (!key || values.length === 0) return null;
      return {
        ...opt,
        name: cleanText(opt?.name) || key,
        label: cleanText(opt?.label) || key,
        values,
      };
    })
    .filter(Boolean)
    .filter((opt: any) => Array.isArray(opt.values) && opt.values.length > 1);

export default function GoMarketProductScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLogin, userData } = useAppSelector((s: any) => s.app);
  const userId = userData?._id || userData?.id;
  const userName = userData?.name;

  // Login protection - redirect to login if not authenticated
  useEffect(() => {
    if (!isLogin) {
      router.replace("/login" as never);
    }
  }, [isLogin]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [offers, setOffers] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedTotalPages, setRelatedTotalPages] = useState(1);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const loadProduct = useCallback(() => {
    const endpoint =
      kind === "restaurant"
        ? `/api/go-market/catalog/restaurant-item/${id}`
        : `/api/go-market/catalog/grocery-product/${id}`;
    return fetchDataFromApi(endpoint).then((res) => {
      if (res?.success || res?.error === false) {
        setData(res);
        setRelated(res.related || []);
        setRelatedPage(1);
        setRelatedTotalPages(res.relatedPagination?.totalPages || 1);
        setSelectedOptions({});
        const offerParams = new URLSearchParams({
          audience: kind === "restaurant" ? "restaurant" : "grocery",
          ...(kind === "restaurant"
            ? { restaurantId: String(res.product?.restaurantId || ""), restaurantItemId: String(id || "") }
            : { shopId: String(res.product?.shopId || ""), productId: String(id || "") }),
        });
        fetchDataFromApi(`/api/coupon/active?${offerParams}`).then((offerRes) => {
          if (offerRes?.success) setOffers(offerRes.data || []);
        });
      }
    });
  }, [kind, id]);

  useEffect(() => {
    setLoading(true);
    loadProduct().finally(() => setLoading(false));
  }, [loadProduct]);

  const product = data?.product;
  const specs = data?.specifications || [];

  const productImages = product ? ((Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image]).filter(Boolean)) : [];
  
  // Only show options if:
  // 1. productOptions array exists and has items
  // 2. After normalization, there are valid options with multiple values
  // 3. Options were added intentionally by seller (not test/dummy data)
  const productOptions: any[] = normalizeProductOptions(product?.productOptions || []);

  const optionsComplete =
    !productOptions.length ||
    productOptions.every((opt: any) => String(selectedOptions[opt.name || opt.label] || "").trim());

  const loadMoreRelated = async () => {
    if (relatedPage >= relatedTotalPages || loadingRelated) return;
    setLoadingRelated(true);
    const next = relatedPage + 1;
    try {
      const res = await fetchDataFromApi(
        `/api/go-market/catalog/grocery-product/${id}?relatedPage=${next}&relatedLimit=8`,
      );
      if (res?.success || res?.error === false) {
        setRelated((prev) => [...prev, ...(res.related || [])]);
        setRelatedPage(next);
        setRelatedTotalPages(res.relatedPagination?.totalPages || next);
      }
    } finally {
      setLoadingRelated(false);
    }
  };
  const cartProduct = product
    ? {
        _id: product._id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice,
        description: product.description,
        discount: product.discount,
        totalReviews: data?.totalReviews || product.totalReviews || 0,
        images: product.images || (product.image ? [product.image] : []),
        countInStock: product.countInStock ?? product.stock ?? 0,
        rating: data?.averageRating || product.rating,
        brand: product.brand,
        selectedOptions,
      }
    : null;

  const addCart = async () => {
    if (!isLogin || !userId) {
      showToast("error", "Please login first");
      router.push("/login" as never);
      return;
    }
    if (!optionsComplete) {
      showToast("error", "Please select all product options");
      return;
    }
    if (!cartProduct?.countInStock) {
      showToast("error", "Out of stock");
      return;
    }
    setBusy(true);
    try {
      await dispatch(addToCart({ product: cartProduct, userId, quantity: qty })).unwrap();
      // Toast is shown by Redux action
    } catch (e: any) {
      // Error toast is shown by Redux action
      console.error("Add to cart failed:", e);
    } finally {
      setBusy(false);
    }
  };

  const buyNow = () => {
    if (!isLogin || !userId) {
      showToast("error", "Please login first");
      router.push("/login" as never);
      return;
    }
    if (!optionsComplete) {
      showToast("error", "Please select all product options");
      return;
    }
    if (!cartProduct?.countInStock) {
      showToast("error", "Out of stock");
      return;
    }
    showToast("success", "Ready for checkout");
    const buyNowItem = {
      productId: product._id,
      productTitle: product.name,
      image: product.image || product.images?.[0],
      price: product.price,
      oldPrice: product.oldPrice,
      description: product.description,
      rating: data?.averageRating || product.rating,
      discount: product.discount,
      quantity: qty,
      subTotal: product.price * qty,
      selectedOptions,
      sellerId: product.sellerId || null,
    };
    router.push({ pathname: "/checkout", params: { isBuyNow: "true", buyNowItem: JSON.stringify(buyNowItem) } } as never);
  };

  if (loading) {
    return (
      <View style={[S.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={T.orange} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[S.root, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={400}
        onScroll={({ nativeEvent }) => {
          const remaining = nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - nativeEvent.contentOffset.y;
          if (remaining < 500 && relatedPage < relatedTotalPages && !loadingRelated) loadMoreRelated();
        }}
      >
        {/* Image Slider */}
        <View style={S.imageSliderContainer}>
          <FlatList
            data={productImages.length ? productImages : [FALLBACK]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get("window").width);
              setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={Dimensions.get("window").width}
            snapToAlignment="center"
            keyExtractor={(item, index) => `image-${index}`}
            renderItem={({ item }) => (
              <View style={{ width: Dimensions.get("window").width }}>
                <Image
                  source={{ uri: gmImg(item, FALLBACK) }}
                  style={S.heroImg}
                  resizeMode="cover"
                />
              </View>
            )}
          />
          {/* Pagination Dots */}
          {productImages.length > 1 && (
            <View style={S.paginationDots}>
              {productImages.map((_: any, index: number) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    S.dot,
                    activeImageIndex === index && S.dotActive
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={S.panel}>
          <Text style={S.brand}>{product.brand}</Text>
          <Text style={S.title}>{product.name}</Text>
          {(data?.averageRating > 0 || product.rating > 0 || data?.totalReviews > 0) && (
            <Text style={S.rating}>
              ⭐ {Number(data?.averageRating || product.rating || 0).toFixed(1)} · {data?.totalReviews || 0} reviews
            </Text>
          )}
          <Text style={S.desc}>{product.description}</Text>
          <View style={S.priceRow}>
            <Text style={S.price}>₹{product.price}</Text>
            {product.oldPrice > product.price && <Text style={S.mrp}>₹{product.oldPrice}</Text>}
            {product.discount > 0 && <Text style={S.off}>{product.discount}% off</Text>}
          </View>

          {offers.length > 0 && (
            <View style={{ marginTop: 12, gap: 8 }}>
              {offers.slice(0, 3).map((offer: any) => (
                <View key={offer._id || offer.code} style={S.offerBox}>
                  <Text style={S.offerCode}>{offer.code}</Text>
                  <Text style={S.offerTitle}>{offer.title}</Text>
                </View>
              ))}
            </View>
          )}

          {productOptions.length > 0 && productOptions.map((opt: any) => {
            const key = opt.name || opt.label;
            return (
              <View key={key} style={{ marginTop: 14 }}>
                <Text style={S.optLabel}>{key} *</Text>
                <View style={S.optRow}>
                  {(opt.values || []).map((val: string) => (
                    <TouchableOpacity
                      key={val}
                      style={[S.optChip, selectedOptions[key] === val && S.optChipOn]}
                      onPress={() => setSelectedOptions((s) => ({ ...s, [key]: val }))}
                    >
                      <Text style={[S.optChipTxt, selectedOptions[key] === val && S.optChipTxtOn]}>{val}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}

          {!optionsComplete && productOptions.length > 0 && (
            <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600", marginTop: 8 }}>
              Select all options to continue
            </Text>
          )}

          <View style={S.qtyRow}>
            <Text style={{ fontWeight: "700" }}>Qty</Text>
            <TouchableOpacity style={S.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}><Text>−</Text></TouchableOpacity>
            <Text style={{ fontWeight: "800", minWidth: 24, textAlign: "center" }}>{qty}</Text>
            <TouchableOpacity style={S.qtyBtn} onPress={() => setQty((q) => q + 1)}><Text>+</Text></TouchableOpacity>
          </View>

          <Text style={[S.stock, { color: product.countInStock > 0 ? T.green : "#DC2626" }]}>
            {product.countInStock > 0 ? `✓ ${product.countInStock} available` : "Currently unavailable"}
          </Text>
        </View>

        {specs.length > 0 && (
          <View style={S.block}>
            <Text style={S.blockTitle}>Specifications</Text>
            {specs.map((s: any, i: number) => (
              <View key={i} style={S.specRow}>
                <Text style={S.specKey}>{s.key}</Text>
                <Text style={S.specVal}>{s.value}</Text>
              </View>
            ))}
          </View>
        )}

        <ProductReviewsSection
          productId={String(id)}
          productTitle={product.title || product.name}
          isLogin={Boolean(isLogin)}
          userName={userName}
          initialAverage={Number(product?.rating) || Number(data?.averageRating) || 0}
          initialTotal={Number(data?.totalReviews) || 0}
          onLoginRequired={() => router.replace("/login" as never)}
          onStatsChange={(stats) =>
            setData((d: any) => (d ? { ...d, averageRating: stats.averageRating, totalReviews: stats.totalReviews } : d))
          }
        />

        {/* Related Products - 2 Column Grid with Infinity Scrolling */}
        {related.length > 0 && (
          <View style={{ marginHorizontal: 14, marginBottom: 20 }}>
            <Text style={S.blockTitle}>You may also like</Text>
            <Text style={S.relatedSubtitle}>Similar products you might enjoy</Text>
            <FlatList
              data={related}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12 }}
              onEndReached={() => {
                if (relatedPage < relatedTotalPages && !loadingRelated) {
                  loadMoreRelated();
                }
              }}
              onEndReachedThreshold={0.5}
              renderItem={({ item: r }) => (
                <TouchableOpacity
                  style={[S.gridCard, { flex: 1 }]}
                  onPress={() => router.replace(`/go-market-product/${r.goMarketKind || kind}/${r._id}` as never)}
                >
                  <Image source={{ uri: gmImg(r.image, FALLBACK) }} style={S.gridImg} />
                  <View style={S.gridBody}>
                    <Text style={S.gridName} numberOfLines={2}>{r.name}</Text>
                    {r.description && (
                      <Text style={S.gridDesc} numberOfLines={1}>{r.description}</Text>
                    )}
                    {r.rating > 0 && (
                      <View style={S.gridRatingRow}>
                        <Text style={S.gridRatingStar}>⭐</Text>
                        <Text style={S.gridRatingText}>{r.rating.toFixed(1)}</Text>
                      </View>
                    )}
                    <View style={S.gridMetaRow}>
                      <Text style={S.gridPrice}>₹{r.price}</Text>
                      {r.oldPrice > r.price && <Text style={S.gridMrp}>₹{r.oldPrice}</Text>}
                    </View>
                    {r.discount > 0 && <Text style={S.gridDiscount}>{r.discount}% off</Text>}
                  </View>
                </TouchableOpacity>
              )}
              ListFooterComponent={
                related.length > 0 ? (
                  <View style={{ width: '100%', paddingTop: 8, paddingBottom: 16 }}>
                    {loadingRelated ? (
                      <ActivityIndicator color={T.orange} size="small" />
                    ) : relatedPage < relatedTotalPages ? (
                      <TouchableOpacity 
                        style={S.loadMoreBtn} 
                        onPress={loadMoreRelated}
                      >
                        <Text style={S.loadMoreBtnText}>Load more products</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ textAlign: 'center', color: T.textSoft, fontSize: 12, marginTop: 12 }}>
                        No more products
                      </Text>
                    )}
                  </View>
                ) : null
              }
            />
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer with Action Buttons */}
      <View style={S.stickyFooter}>
        <TouchableOpacity style={[S.cartBtn, busy && S.actionDisabled]} onPress={addCart} disabled={busy}>
          <Text style={S.cartBtnTxt}>{busy ? "Adding…" : "🛒 Add to cart"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.buyBtn, busy && S.actionDisabled]} onPress={buyNow} disabled={busy}>
          <Text style={S.buyBtnTxt}>⚡ Buy now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  actionDisabled: {
    opacity: 0.7,
  },
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingBottom: 120 },
  imageSliderContainer: {
    position: "relative",
    width: "100%",
  },
  heroImg: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#eee"
  },
  paginationDots: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  dotActive: {
    width: 24,
    backgroundColor: T.white,
    borderColor: T.orange,
    borderWidth: 1.5,
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: T.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
    flexDirection: "row",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  panel: { backgroundColor: T.white, margin: 14, marginTop: -20, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: T.border },
  brand: { fontSize: 11, fontWeight: "700", color: T.textSoft, textTransform: "uppercase" },
  title: { fontSize: 20, fontWeight: "900", marginTop: 4, color: T.text },
  rating: { fontSize: 13, color: "#555", marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  price: { fontSize: 26, fontWeight: "900" },
  mrp: { fontSize: 14, color: T.textSoft, textDecorationLine: "line-through" },
  off: { fontSize: 11, fontWeight: "700", color: T.green, backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  desc: { fontSize: 14, color: "#555", lineHeight: 21, marginTop: 10 },
  offerBox: { borderWidth: 1, borderStyle: "dashed", borderColor: "#FB923C", backgroundColor: "#FFF7ED", borderRadius: 12, padding: 10 },
  offerCode: { color: "#C2410C", fontSize: 13, fontWeight: "900" },
  offerTitle: { color: "#7C2D12", fontSize: 12, fontWeight: "600", marginTop: 2 },
  optLabel: { fontSize: 11, fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: 8 },
  optRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: T.border },
  optChipOn: { backgroundColor: T.black, borderColor: T.black },
  optChipTxt: { fontSize: 13, fontWeight: "600", color: T.text },
  optChipTxtOn: { color: T.white },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center" },
  cartBtn: {
    flex: 1,
    backgroundColor: T.black,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cartBtnTxt: { color: T.white, fontWeight: "800", fontSize: 15 },
  buyBtn: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buyBtnTxt: { color: T.white, fontWeight: "800", fontSize: 15 },
  stock: { marginTop: 12, fontSize: 12, fontWeight: "700" },
  block: { backgroundColor: T.white, marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  blockTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  relatedSubtitle: { fontSize: 11, color: T.textSoft, marginBottom: 12, fontWeight: "500" },
  specRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  specKey: { width: "40%", fontSize: 13, color: T.textSoft, fontWeight: "600" },
  specVal: { flex: 1, fontSize: 13, color: T.text },
  review: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  muted: { fontSize: 13, color: T.textSoft, marginTop: 4 },
  
  // Grid Card Styles (2 columns)
  gridCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  gridImg: { width: "100%", height: 140, backgroundColor: "#eee" },
  gridBody: { padding: 10 },
  gridName: { fontSize: 13, fontWeight: "700", minHeight: 36, color: T.text, lineHeight: 18 },
  gridDesc: { 
    fontSize: 10, 
    color: T.textSoft, 
    marginTop: 3,
    lineHeight: 14,
    minHeight: 14,
  },
  gridRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  gridRatingStar: {
    fontSize: 10,
  },
  gridRatingText: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text,
  },
  gridMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" },
  gridPrice: { fontSize: 15, fontWeight: "900", color: T.orange },
  gridMrp: { fontSize: 10, color: T.textSoft, textDecorationLine: "line-through" },
  gridDiscount: { marginTop: 4, fontSize: 10, fontWeight: "800", color: T.green },

  // Load More Button
  loadMoreBtn: {
    backgroundColor: T.orange,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
