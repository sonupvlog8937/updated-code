import { ProductReviewsSection } from "@/src/components/goMarket/ProductReviewsSection";
import { addToCart, useAppDispatch, useAppSelector } from "@/src/store";
import { fetchDataFromApi } from "@/src/utils/api";
import { gmImg } from "@/src/utils/goMarketMedia";
import { showToast } from "@/src/utils/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const userId = useAppSelector((s: any) => s.app.user?._id);
  const userName = useAppSelector((s: any) => s.app.userData?.name);
  const isLogin = useAppSelector((s: any) => s.app.isLogin);

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
  const productOptions: any[] = normalizeProductOptions(product?.productOptions || []);

  const optionsComplete =
    !productOptions.length ||
    productOptions.every((opt: any) => String(selectedOptions[opt.name || opt.label] || "").trim());

  const loadMoreRelated = async () => {
    if (kind !== "grocery" || relatedPage >= relatedTotalPages) return;
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
        images: product.images || (product.image ? [product.image] : []),
        countInStock: product.countInStock ?? product.stock ?? 0,
        rating: data?.averageRating || product.rating,
        brand: product.brand,
        discount: product.discount,
        selectedOptions,
      }
    : null;

  const addCart = async () => {
    if (!isLogin) {
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
      const res = await dispatch(addToCart({ product: cartProduct, userId, quantity: qty })).unwrap();
      showToast("success", res?.message || "Added to cart");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to add");
    } finally {
      setBusy(false);
    }
  };

  const buyNow = () => {
    if (!isLogin) {
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
    const buyNowItem = {
      productId: product._id,
      productTitle: product.name,
      image: product.image || product.images?.[0],
      price: product.price,
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
      <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
        <Text style={{ fontSize: 18 }}>‹</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: gmImg(product.image || product.images?.[0], FALLBACK) }} style={S.heroImg} />

        <View style={S.panel}>
          <Text style={S.brand}>{product.brand}</Text>
          <Text style={S.title}>{product.name}</Text>
          <Text style={S.rating}>
            ⭐ {Number(data?.averageRating || product.rating || 0).toFixed(1)} · {data?.totalReviews || 0} reviews
          </Text>
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

          {productOptions.map((opt: any) => {
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

          <TouchableOpacity style={S.cartBtn} onPress={addCart} disabled={busy || !optionsComplete}>
            <Text style={S.cartBtnTxt}>{busy ? "Adding…" : "🛒 Add to cart"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.buyBtn} onPress={buyNow} disabled={busy || !optionsComplete}>
            <Text style={S.buyBtnTxt}>⚡ Buy now</Text>
          </TouchableOpacity>

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
          initialAverage={data?.averageRating || product.rating}
          initialTotal={data?.totalReviews || 0}
          onLoginRequired={() => router.replace("/login" as never)}
          onStatsChange={(stats) =>
            setData((d: any) => (d ? { ...d, averageRating: stats.averageRating, totalReviews: stats.totalReviews } : d))
          }
        />

        {related.length > 0 && (
          <View style={S.block}>
            <Text style={S.blockTitle}>You may also like</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {related.map((r: any) => (
                <TouchableOpacity
                  key={r._id}
                  style={S.relCard}
                  onPress={() => router.replace(`/go-market-product/${r.goMarketKind || kind}/${r._id}` as never)}
                >
                  <Image source={{ uri: gmImg(r.image, FALLBACK) }} style={S.relImg} />
                  <Text style={S.relName} numberOfLines={2}>{r.name}</Text>
                  <Text style={S.relPrice}>₹{r.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {relatedPage < relatedTotalPages && (
              <TouchableOpacity style={S.loadMore} onPress={loadMoreRelated} disabled={loadingRelated}>
                <Text style={S.loadMoreTxt}>{loadingRelated ? "Loading…" : "Load more"}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 16,
    left: 14,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  scroll: { paddingBottom: 40 },
  heroImg: { width: "100%", aspectRatio: 1, backgroundColor: "#eee" },
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
  loadMore: { marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: "#f3f4f6", alignItems: "center" },
  loadMoreTxt: { fontWeight: "800", color: T.text },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center" },
  cartBtn: { backgroundColor: T.black, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  cartBtnTxt: { color: T.white, fontWeight: "800", fontSize: 15 },
  buyBtn: { borderWidth: 1.5, borderColor: T.border, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  buyBtnTxt: { fontWeight: "800", fontSize: 15 },
  stock: { marginTop: 12, fontSize: 12, fontWeight: "700" },
  block: { backgroundColor: T.white, marginHorizontal: 14, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  blockTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  specRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  specKey: { width: "40%", fontSize: 13, color: T.textSoft, fontWeight: "600" },
  specVal: { flex: 1, fontSize: 13, color: T.text },
  review: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  muted: { fontSize: 13, color: T.textSoft, marginTop: 4 },
  relCard: { width: 130, backgroundColor: "#fafafa", borderRadius: 12, padding: 8, borderWidth: 1, borderColor: T.border },
  relImg: { width: "100%", height: 100, borderRadius: 8 },
  relName: { fontSize: 12, fontWeight: "600", marginTop: 6, minHeight: 32 },
  relPrice: { fontSize: 14, fontWeight: "800", marginTop: 4 },
});
