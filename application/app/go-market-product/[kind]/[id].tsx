import { ProductReviewsSection } from "@/src/components/goMarket/ProductReviewsSection";
import { addToCart, useAppDispatch, useAppSelector } from "@/src/store";
import { fetchDataFromApi } from "@/src/utils/api";
import { gmImg } from "@/src/utils/goMarketMedia";
import { showToast } from "@/src/utils/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
      const values = (Array.isArray(opt?.values) ? opt.values : [])
        .map((val: any) => {
          if (typeof val === 'object') {
            return {
              label: cleanText(val?.label || val?.value || ''),
              value: cleanText(val?.value || val?.label || ''),
              price: Number(val?.price) || 0,
              oldPrice: Number(val?.oldPrice) || 0,
              isDefault: Boolean(val?.isDefault),
            };
          }
          const cleaned = cleanText(val);
          return { label: cleaned, value: cleaned, price: 0, oldPrice: 0, isDefault: false };
        })
        .filter((v: any) => v.label);
      
      if (!key || values.length === 0) return null;
      return {
        ...opt,
        name: cleanText(opt?.name) || key,
        label: cleanText(opt?.label) || key,
        values,
      };
    })
    .filter(Boolean);

export default function GoMarketProductScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { isLogin, userData } = useAppSelector((s: any) => s.app);
  const userId = userData?._id || userData?.id;
  const userName = userData?.name;

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
  const [totalRelatedCount, setTotalRelatedCount] = useState(0);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewScrollTrigger, setReviewScrollTrigger] = useState(0);
  const [shopData, setShopData] = useState<any>(null);

  const loadProduct = useCallback(() => {
    const endpoint =
      kind === "restaurant"
        ? `/api/go-market/catalog/restaurant-item/${id}`
        : `/api/go-market/catalog/grocery-product/${id}`;
    
    return fetchDataFromApi(endpoint).then((res) => {
      if (res?.success || res?.error === false) {
        setData(res);
        
        // Store shop/restaurant data for isOpen check
        if (kind === "restaurant" && res.restaurant) {
          setShopData(res.restaurant);
        } else if (kind !== "restaurant" && res.shop) {
          setShopData(res.shop);
        }
        
        // Get related products - handle multiple field names
        const relatedData = res.related || res.relatedProducts || res.suggestionProducts || [];
        setRelated(relatedData);
        setRelatedPage(1);
        
        // Get total count - handle multiple field names
        let totalCount = relatedData.length;
        if (res.relatedTotal) totalCount = res.relatedTotal;
        else if (res.totalRelated) totalCount = res.totalRelated;
        else if (res.relatedPagination?.total) totalCount = res.relatedPagination.total;
        else if (res.relatedPagination?.totalItems) totalCount = res.relatedPagination.totalItems;
        else if (res.relatedCount) totalCount = res.relatedCount;
        
        console.log('[Product Load] Related:', relatedData.length, 'Total:', totalCount);
        setTotalRelatedCount(totalCount);
        
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
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const visibleSpecs = showAllSpecs ? specs : specs.slice(0, 5);

  const productImages = product ? ((Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image]).filter(Boolean)) : [];
  
  const productOptions: any[] = normalizeProductOptions(product?.productOptions || []);

  const calculatePriceFromOptions = () => {
    let hasOptionWithPrice = false;
    let optionPrice = 0;
    let optionOldPrice = 0;
    
    productOptions.forEach((opt: any) => {
      const selectedValue = selectedOptions[opt.name || opt.label];
      if (selectedValue) {
        const valueObj = opt.values.find((v: any) => v.value === selectedValue || v.label === selectedValue);
        if (valueObj && valueObj.price > 0) {
          hasOptionWithPrice = true;
          optionPrice = Number(valueObj.price) || 0;
          optionOldPrice = Number(valueObj.oldPrice) || 0;
        }
      }
    });
    
    if (hasOptionWithPrice) {
      return {
        price: optionPrice,
        oldPrice: optionOldPrice > 0 ? optionOldPrice : optionPrice,
      };
    }
    
    return {
      price: product?.price || 0,
      oldPrice: product?.oldPrice || product?.price || 0,
    };
  };

  const currentPricing = product ? calculatePriceFromOptions() : { price: 0, oldPrice: 0 };
  const displayPrice = currentPricing.price;
  const displayOldPrice = currentPricing.oldPrice;
  const displayDiscount = displayOldPrice > displayPrice ? Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100) : 0;

  const optionsComplete =
    !productOptions.length ||
    productOptions.every((opt: any) => String(selectedOptions[opt.name || opt.label] || "").trim());

  const loadMoreRelated = async () => {
    const ITEMS_PER_PAGE = 8;
    const itemsLoaded = related.length;
    
    if (itemsLoaded >= totalRelatedCount || loadingRelated) {
      console.log(`[Load More] Already have all: ${itemsLoaded}/${totalRelatedCount}`);
      return;
    }
    
    const nextPage = Math.floor(itemsLoaded / ITEMS_PER_PAGE) + 1;
    console.log(`[Load More] Fetching page ${nextPage}. Have ${itemsLoaded}, Total ${totalRelatedCount}`);
    
    setLoadingRelated(true);
    try {
      // Use page & limit params
      const endpoint = kind === "restaurant"
        ? `/api/go-market/catalog/restaurant-item/${id}?page=${nextPage}&limit=${ITEMS_PER_PAGE}`
        : `/api/go-market/catalog/grocery-product/${id}?page=${nextPage}&limit=${ITEMS_PER_PAGE}`;
      
      console.log(`[Load More] URL: ${endpoint}`);
      const res = await fetchDataFromApi(endpoint);
      console.log(`[Load More] Response:`, res);
      
      if (res?.success || res?.error === false) {
        // Try multiple field names
        const newItems = res.related || res.relatedProducts || res.data || res.products || [];
        console.log(`[Load More] Got ${newItems.length} items`);
        
        if (newItems.length > 0) {
          setRelated((prev) => {
            const updated = [...prev, ...newItems];
            console.log(`[Load More] Total: ${updated.length}`);
            return updated;
          });
          
          // Update total
          let backendTotal = totalRelatedCount;
          if (res.relatedTotal) backendTotal = res.relatedTotal;
          else if (res.totalRelated) backendTotal = res.totalRelated;
          else if (res.total) backendTotal = res.total;
          else if (res.count) backendTotal = res.count;
          
          setTotalRelatedCount(backendTotal);
        } else {
          setTotalRelatedCount(itemsLoaded);
        }
      } else {
        setTotalRelatedCount(itemsLoaded);
      }
    } catch (error) {
      console.error(`[Load More] Error:`, error);
      setTotalRelatedCount(itemsLoaded);
    } finally {
      setLoadingRelated(false);
    }
  };

  const cartProduct = product
    ? {
        _id: product._id,
        name: product.name,
        price: displayPrice,
        oldPrice: displayOldPrice,
        description: product.description,
        discount: displayDiscount,
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
    // Check if shop/restaurant is open
    if (shopData && shopData.isOpen === false) {
      showToast("error", kind === "restaurant" ? "Restaurant is currently closed. You cannot add items to cart." : "Shop is currently closed. You cannot add items to cart.");
      return;
    }
    setBusy(true);
    try {
      await dispatch(addToCart({ product: cartProduct, userId, quantity: qty })).unwrap();
    } catch (e: any) {
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
    // Check if shop/restaurant is open
    if (shopData && shopData.isOpen === false) {
      showToast("error", kind === "restaurant" ? "Restaurant is currently closed. You cannot buy this item." : "Shop is currently closed. You cannot buy this item.");
      return;
    }
    showToast("success", "Ready for checkout");
    const buyNowItem = {
      productId: product._id,
      productTitle: product.name,
      image: product.image || product.images?.[0],
      price: displayPrice,
      oldPrice: displayOldPrice,
      description: product.description,
      rating: data?.averageRating || product.rating,
      discount: displayDiscount,
      quantity: qty,
      subTotal: displayPrice * qty,
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

  const hasMoreProducts = related.length < totalRelatedCount;

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={({ nativeEvent }) => {
          const { contentSize, layoutMeasurement, contentOffset } = nativeEvent;
          const remaining = contentSize.height - layoutMeasurement.height - contentOffset.y;
          
          if (remaining < 800) {
            setReviewScrollTrigger((prev) => prev + 1);
          }
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
            <Text style={S.price}>₹{displayPrice}</Text>
            {displayOldPrice > displayPrice && <Text style={S.mrp}>₹{displayOldPrice}</Text>}
            {displayDiscount > 0 && <Text style={S.off}>{displayDiscount}% off</Text>}
          </View>

          {/* {offers.length > 0 && (
            <View style={{ marginTop: 12, gap: 8 }}>
              {offers.slice(0, 3).map((offer: any) => (
                <View key={offer._id || offer.code} style={S.offerBox}>
                  <Text style={S.offerCode}>{offer.code}</Text>
                  <Text style={S.offerTitle}>{offer.title}</Text>
                </View>
              ))}
            </View>
          )} */}

          {productOptions.length > 0 && productOptions.map((opt: any) => {
            const key = opt.name || opt.label;
            return (
              <View key={key} style={{ marginTop: 14 }}>
                <Text style={S.optLabel}>{key} *</Text>
                <View style={S.optRow}>
                  {(opt.values || []).map((val: any) => {
                    const isSelected = selectedOptions[key] === (val.value || val.label);
                    return (
                      <TouchableOpacity
                        key={val.value || val.label}
                        style={[S.optChip, isSelected && S.optChipOn]}
                        onPress={() => setSelectedOptions((s) => ({ ...s, [key]: val.value || val.label }))}
                      >
                        <Text style={[S.optChipTxt, isSelected && S.optChipTxtOn]}>
                          {val.label || val.value}{val.price > 0 ? ` · ₹${val.price}` : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
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

          {shopData && shopData.isOpen === false && (
            <View style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: "#FEF2F2",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}>
              <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "700" }}>
                {kind === "restaurant" ? "🔴 Restaurant is currently closed" : "🔴 Shop is currently closed"}
              </Text>
            </View>
          )}
        </View>

        {specs.length > 0 && (
          <View style={S.block}>
            <Text style={S.blockTitle}>Specifications</Text>
            {visibleSpecs.map((s: any, i: number) => (
              <View key={i} style={S.specRow}>
                <Text style={S.specKey}>{s.key}</Text>
                <Text style={S.specVal}>{s.value}</Text>
              </View>
            ))}
            {specs.length > 5 && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 8,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
                onPress={() => setShowAllSpecs(!showAllSpecs)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {showAllSpecs ? "Show Less" : `Read More (${specs.length - 5} more)`}
                </Text>
                <Text style={{ fontSize: 14 }}>{showAllSpecs ? "▲" : "▼"}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Related Products - 2 Column Grid with Load More Button */}
        {related.length > 0 && (
          <View style={{ marginHorizontal: 14, marginBottom: 20 }}>
            <Text style={S.blockTitle}>You may also like</Text>
            <Text style={S.relatedSubtitle}>Similar products you might enjoy</Text>
            <FlatList
              data={related}
              keyExtractor={(item, idx) => `${item._id || idx}`}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item: r }) => {
                const rPrice = r.discountPrice > 0 ? r.discountPrice : r.price;
                const rOldPrice = r.oldPrice || r.price;
                const hasDiscount = rOldPrice > rPrice;
                const rDiscount = hasDiscount 
                  ? Math.round(((rOldPrice - rPrice) / rOldPrice) * 100)
                  : r.discount || 0;
                const saveAmount = hasDiscount ? rOldPrice - rPrice : 0;
                
                return (
                  <TouchableOpacity
                    style={[S.gridCard, { flex: 1 }]}
                    onPress={() => router.replace(`/go-market-product/${r.goMarketKind || kind}/${r._id}` as never)}
                  >
                    <Image source={{ uri: gmImg(r.image, FALLBACK) }} style={S.gridImg} />
                    {rDiscount > 0 && (
                      <View style={S.gridBadge}>
                        <Text style={S.gridBadgeText}>{rDiscount}% OFF</Text>
                      </View>
                    )}
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
                        <Text style={S.gridPrice}>₹{rPrice}</Text>
                        {hasDiscount && rOldPrice > rPrice && (
                          <Text style={S.gridMrp}>₹{rOldPrice}</Text>
                        )}
                      </View>
                      {saveAmount > 0 && (
                        <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "600", marginTop: 3 }}>
                          You save ₹{saveAmount}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            
            {/* Load More Button */}
            {hasMoreProducts && (
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  padding: 14,
                  backgroundColor: "#fff",
                  borderWidth: 2,
                  borderColor: "#e2e8f0",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
                onPress={loadMoreRelated}
                disabled={loadingRelated}
                activeOpacity={0.7}
              >
                {loadingRelated ? (
                  <>
                    <ActivityIndicator size="small" color="#475569" />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
                      Loading...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 16 }}>↓</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
                      Load More
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {!hasMoreProducts && related.length > 0 && totalRelatedCount > 0 && (
              <View style={{ marginTop: 16, padding: 14, backgroundColor: "#dcfce7", borderRadius: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#16a34a" }}>
                  ✓ All {totalRelatedCount} products loaded
                </Text>
              </View>
            )}
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
          onScroll={reviewScrollTrigger}
        />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer with Action Buttons */}
      <View style={[S.stickyFooter, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <TouchableOpacity 
          style={[S.cartBtn, busy && S.actionDisabled, shopData && shopData.isOpen === false && S.actionDisabled]} 
          onPress={addCart} 
          disabled={busy || (shopData && shopData.isOpen === false)}
        >
          <Text style={S.cartBtnTxt}>{busy ? "Adding…" : "🛒 Add to cart"}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[S.buyBtn, busy && S.actionDisabled, shopData && shopData.isOpen === false && S.actionDisabled]} 
          onPress={buyNow} 
          disabled={busy || (shopData && shopData.isOpen === false)}
        >
          <Text style={S.buyBtnTxt}>⚡ Buy now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  actionDisabled: { opacity: 0.7 },
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingBottom: 120 },
  imageSliderContainer: { position: "relative", width: "100%" },
  heroImg: { width: "100%", aspectRatio: 1, backgroundColor: "#eee" },
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
    paddingTop: 12,
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
  cartBtn: { flex: 1, backgroundColor: T.black, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cartBtnTxt: { color: T.white, fontWeight: "800", fontSize: 15 },
  buyBtn: { flex: 1, backgroundColor: "#DC2626", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
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
    position: "relative",
  },
  gridImg: { width: "100%", height: 140, backgroundColor: "#eee" },
  gridBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#DC2626", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 1 },
  gridBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  gridBody: { padding: 10 },
  gridName: { fontSize: 13, fontWeight: "700", minHeight: 36, color: T.text, lineHeight: 18 },
  gridDesc: { fontSize: 10, color: T.textSoft, marginTop: 3, lineHeight: 14, minHeight: 14 },
  gridRatingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  gridRatingStar: { fontSize: 10 },
  gridRatingText: { fontSize: 11, fontWeight: "700", color: T.text },
  gridMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" },
  gridPrice: { fontSize: 15, fontWeight: "900", color: T.orange },
  gridMrp: { fontSize: 10, color: T.textSoft, textDecorationLine: "line-through" },
  gridDiscount: { marginTop: 4, fontSize: 10, fontWeight: "800", color: T.green },
});
