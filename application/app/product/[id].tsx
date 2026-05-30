import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { ProductDetailsComponent } from "@/src/components/ProductDetailsComponent";
import { ProductImageCarousel } from "@/src/components/ProductImageCarousel";
import { ProductReviewsSection } from "@/src/components/ProductReviewsSection";
import { AppDispatch, RootState } from "@/src/store";
import { setGlobalLoading } from "@/src/store/appSlice";
import {
  fetchProductDetails,
  fetchRelatedProducts,
  fetchReviewsCount,
  fetchSellerInfo,
  resetProductDetails,
  setActiveImages,
  setVisibleSpecifications,
  type ProductDetailsState,
} from "@/src/store/productDetailsSlice";

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");
const PRIMARY = "#2563eb";
const CACHE_TTL = 5 * 60 * 1000;
const _cache = new Map<string, any>();

function cacheGet(id: string) {
  const entry = _cache.get(id);
  if (!entry || Date.now() - entry.ts > CACHE_TTL) {
    _cache.delete(id);
    return null;
  }
  return entry;
}
function cacheSet(id: string, data: any) {
  _cache.set(id, { ...data, ts: Date.now() });
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const SkeletonBox = ({ style }: { style: any }) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        { backgroundColor: "#e2e8f0", borderRadius: 8, opacity: anim },
        style,
      ]}
    />
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const productDetails = useSelector(
    (state: RootState) => state.productDetails as ProductDetailsState,
  );
  const { userData, myListData } = useSelector((state: RootState) => state.app);

  const [inWishlist, setInWishlist] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const specOffsetY = useRef(0);
  const reviewsOffsetY = useRef(0);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    dispatch(resetProductDetails());
    const cached = cacheGet(id as string);
    if (cached) {
      dispatch(setGlobalLoading(false));
      return;
    }
    dispatch(setGlobalLoading(true));
    dispatch(fetchProductDetails(id as string));
    dispatch(fetchReviewsCount(id as string));
  }, [id, dispatch]);

  useEffect(() => {
    if (!productDetails.currentProduct?.subCatId) return;
    dispatch(
      fetchRelatedProducts({
        subCatId: productDetails.currentProduct.subCatId,
        productId: id!,
        page: 1,
        perPage: 10,
      }),
    );
  }, [productDetails.currentProduct?.subCatId, id, dispatch]);

  useEffect(() => {
    if (!productDetails.currentProduct) return;
    const seller = productDetails.currentProduct.seller;
    const sellerId =
      typeof seller === "object" && seller
        ? seller._id
        : typeof seller === "string"
          ? seller
          : null;
    if (!sellerId) return;
    dispatch(
      fetchSellerInfo({
        sellerId,
        productId: id!,
        thirdsubCatId: productDetails.currentProduct.thirdsubCatId,
      }),
    );
  }, [productDetails.currentProduct, id, dispatch]);

  useEffect(() => {
    if (productDetails.currentProduct) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [productDetails.currentProduct, fadeAnim]);

  useEffect(() => {
    const found = myListData?.some(
      (m) => String(m.productId) === String(productDetails.currentProduct?._id),
    );
    setInWishlist(!!found);
  }, [myListData, productDetails.currentProduct?._id]);

  useEffect(() => {
    if (productDetails.currentProduct) dispatch(setGlobalLoading(false));
  }, [productDetails.currentProduct, dispatch]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const gotoSpecs = useCallback(() => {
    scrollViewRef.current?.scrollTo({
      y: specOffsetY.current - 80,
      animated: true,
    });
  }, []);

  const gotoReviews = useCallback(() => {
    scrollViewRef.current?.scrollTo({
      y: reviewsOffsetY.current - 80,
      animated: true,
    });
  }, []);

  const handleWishlistToggle = useCallback(async () => {
    if (!userData?._id) {
      router.push("/login" as never);
      return;
    }
    setInWishlist((prev) => !prev);
  }, [userData?._id, router]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const sellerId = useMemo(() => {
    const seller = productDetails.currentProduct?.seller;
    if (typeof seller === "object" && seller) return seller._id;
    return typeof seller === "string" ? seller : null;
  }, [productDetails.currentProduct?.seller]);

  const breadcrumbItems = useMemo(
    () =>
      [
        productDetails.currentProduct?.catName &&
        productDetails.currentProduct?.catId
          ? {
              label: productDetails.currentProduct.catName,
              to: `/products?catId=${productDetails.currentProduct.catId}`,
            }
          : null,
        productDetails.currentProduct?.subCat &&
        productDetails.currentProduct?.subCatId
          ? {
              label: productDetails.currentProduct.subCat,
              to: `/products?subCatId=${productDetails.currentProduct.subCatId}`,
            }
          : null,
        productDetails.currentProduct?.thirdsubCat &&
        productDetails.currentProduct?.thirdsubCatId
          ? {
              label: productDetails.currentProduct.thirdsubCat,
              to: `/products?thirdLavelCatId=${productDetails.currentProduct.thirdsubCatId}`,
            }
          : null,
      ].filter(Boolean) as Array<{ label: string; to: string }>,
    [productDetails.currentProduct],
  );

  const specs = productDetails.currentProduct?.specifications ?? [];
  const visibleSpecs = specs.slice(0, productDetails.visibleSpecifications);
  const currentProduct = productDetails.currentProduct;
  const carouselImages = useMemo(() => {
    if (productDetails.activeImages?.length) return productDetails.activeImages;
    return currentProduct?.images || [];
  }, [productDetails.activeImages, currentProduct?.images]);

  const handleCarouselImagesChange = useCallback(
    (images: string[]) => {
      dispatch(setActiveImages(images));
    },
    [dispatch],
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (productDetails.isLoadingProduct && !productDetails.currentProduct) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.skeletonWrap}>
          <SkeletonBox style={{ width: SW, height: SW * 0.85 }} />
          <View style={{ padding: 16, gap: 10 }}>
            <SkeletonBox style={{ height: 22, width: "70%" }} />
            <SkeletonBox style={{ height: 16, width: "45%" }} />
            <SkeletonBox style={{ height: 28, width: "35%" }} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <SkeletonBox style={{ flex: 1, height: 44 }} />
              <SkeletonBox style={{ flex: 1, height: 44 }} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!productDetails.isLoadingProduct && !productDetails.currentProduct) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.notFoundWrap}>
          <View style={styles.notFoundIcon}>
            <MaterialCommunityIcons
              name="package-variant-closed-remove"
              size={48}
              color="#94a3b8"
            />
          </View>
          <Text style={styles.notFoundTitle}>Product not found</Text>
          <Text style={styles.notFoundDesc}>
            This product may have been removed or is unavailable.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Navigation header ── */}
      <Stack.Screen
        options={{
          headerTitle: "",
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerBackBtn}
              >
                <Ionicons name="arrow-back" size={22} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.headerBrand}>ZeeDaddy</Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => router.push("/search" as never)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerIconBtn}
              >
                <Ionicons name="search-outline" size={21} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWishlistToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerIconBtn}
              >
                <Ionicons
                  name={inWishlist ? "heart" : "heart-outline"}
                  size={21}
                  color={inWishlist ? "#ef4444" : "#475569"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {}}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerIconBtn}
              >
                <Ionicons
                  name="share-social-outline"
                  size={21}
                  color="#475569"
                />
              </TouchableOpacity>
            </View>
          ),
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: true,
        }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Breadcrumb ── */}
          {breadcrumbItems.length > 0 && (
            <View style={styles.breadcrumbBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.breadcrumbContent}
              >
                <TouchableOpacity onPress={() => router.push("/" as never)}>
                  <Text style={styles.breadcrumbLink}>Home</Text>
                </TouchableOpacity>
                {breadcrumbItems.map((item) => (
                  <React.Fragment key={item.to}>
                    <Text style={styles.breadcrumbSep}>›</Text>
                    <TouchableOpacity
                      onPress={() => router.push(item.to as never)}
                    >
                      <Text style={styles.breadcrumbLink}>{item.label}</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
                <Text style={styles.breadcrumbSep}>›</Text>
                <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
                  {currentProduct?.name}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* ── Image carousel ── */}
          {carouselImages.length > 0 ? (
            <ProductImageCarousel images={carouselImages} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={48}
                color="#cbd5e1"
              />
            </View>
          )}

          {/* ── Quick action strip ── */}
          <View style={styles.qaStrip}>
            <TouchableOpacity
              style={[styles.qaBtn, styles.qaBtnPrimary]}
              onPress={gotoSpecs}
              activeOpacity={0.8}
            >
              <Ionicons name="list-outline" size={16} color={PRIMARY} />
              <Text style={[styles.qaBtnText, { color: PRIMARY }]}>
                Specifications
              </Text>
              {specs.length > 0 && (
                <View style={styles.qaBadgePrimary}>
                  <Text style={styles.qaBadgePrimaryText}>{specs.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.qaDivider} />
            <TouchableOpacity
              style={[styles.qaBtn, styles.qaBtnSecondary]}
              onPress={gotoReviews}
              activeOpacity={0.8}
            >
              <Ionicons name="star-outline" size={16} color="#475569" />
              <Text style={[styles.qaBtnText, { color: "#475569" }]}>
                Reviews
              </Text>
              {productDetails.reviewsCount > 0 && (
                <View style={styles.qaBadgeGray}>
                  <Text style={styles.qaBadgeGrayText}>
                    {productDetails.reviewsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Product main details ── */}
          {currentProduct && (
            <ProductDetailsComponent
              item={currentProduct}
              reviewsCount={productDetails.reviewsCount}
              gotoReviews={gotoReviews}
              gotoSpecs={gotoSpecs}
              onColorChange={handleCarouselImagesChange}
            />
          )}

          {/* ── Specifications ── */}
          {specs.length > 0 && (
            <View
              style={styles.card}
              onLayout={(e) => {
                specOffsetY.current = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.specIcon}>
                    <Ionicons name="list" size={14} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Specifications</Text>
                    <Text style={styles.cardSubtitle}>
                      Complete technical details
                    </Text>
                  </View>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{specs.length}</Text>
                </View>
              </View>

              <View style={styles.specTable}>
                {visibleSpecs.map((spec, i) => (
                  <View
                    key={`${spec.key}-${i}`}
                    style={[
                      styles.specRow,
                      { backgroundColor: i % 2 === 0 ? "#f8fafc" : "#fff" },
                    ]}
                  >
                    <Text style={styles.specKey}>{spec.key}</Text>
                    <Text style={styles.specValue}>{spec.value}</Text>
                  </View>
                ))}
              </View>

              {specs.length > productDetails.visibleSpecifications && (
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() =>
                    dispatch(
                      setVisibleSpecifications(
                        productDetails.visibleSpecifications + 5,
                      ),
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.expandBtnText}>
                    Show{" "}
                    {Math.min(
                      5,
                      specs.length - productDetails.visibleSpecifications,
                    )}{" "}
                    more
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#475569" />
                </TouchableOpacity>
              )}
              {productDetails.visibleSpecifications > 5 &&
                specs.length <= productDetails.visibleSpecifications && (
                  <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => dispatch(setVisibleSpecifications(5))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandBtnText}>Show less</Text>
                    <Ionicons name="chevron-up" size={14} color="#475569" />
                  </TouchableOpacity>
                )}

              <View style={styles.trustRow}>
                {[
                  { icon: "shield-checkmark-outline", label: "Verified" },
                  { icon: "flash-outline", label: "Fast delivery" },
                  { icon: "refresh-outline", label: "Easy returns" },
                  { icon: "headset-outline", label: "24/7 support" },
                ].map(({ icon, label }) => (
                  <View key={label} style={styles.trustChip}>
                    <Ionicons name={icon as any} size={13} color="#16a34a" />
                    <Text style={styles.trustChipText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Seller card ── */}
          {currentProduct && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="storefront-outline" size={22} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.soldByLabel}>Sold by</Text>
                <Text style={styles.storeName}>
                  {typeof currentProduct?.seller === "object"
                    ? (currentProduct?.seller?.storeProfile?.storeName ??
                      currentProduct?.seller?.name ??
                      "Marketplace Seller")
                    : "Marketplace Seller"}
                </Text>
                <Text style={styles.sellerMeta}>
                  {productDetails.sellerInfo.total > 0
                    ? `${productDetails.sellerInfo.total.toLocaleString()} products`
                    : "Visit seller's store"}
                </Text>
              </View>
              {sellerId && (
                <TouchableOpacity
                  style={styles.visitBtn}
                  onPress={() => router.push(`/store/${sellerId}` as never)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.visitBtnText}>Visit store</Text>
                  <Ionicons name="arrow-forward" size={13} color={PRIMARY} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── More from seller ── */}
          {productDetails.sellerInfo.preview &&
            productDetails.sellerInfo.preview.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>More from this seller</Text>
                  {sellerId && (
                    <TouchableOpacity
                      onPress={() => router.push(`/store/${sellerId}` as never)}
                    >
                      <Text style={styles.seeAllLink}>See all</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.previewGrid}>
                  {productDetails.sellerInfo.preview.map((item) => (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.previewCard}
                      onPress={() =>
                        router.push(`/product/${item._id}` as never)
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.previewTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.previewPrice}>
                        ₹{(item.price || 0).toLocaleString("en-IN")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

          {/* ── Reviews ── */}
          {currentProduct && (
            <View
              onLayout={(e) => {
                reviewsOffsetY.current = e.nativeEvent.layout.y;
              }}
            >
              <ProductReviewsSection
                productId={id!}
                onReviewsCountChange={() => {}}
              />
            </View>
          )}

          {/* ── Related products ── */}
          {productDetails.relatedProducts &&
            productDetails.relatedProducts.length > 0 && (
              <View style={[styles.card, { marginBottom: 32 }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Related Products</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {productDetails.relatedProducts.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.relatedGrid}>
                  {productDetails.relatedProducts.map((item) => (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.relatedCard}
                      onPress={() =>
                        router.push(`/product/${item._id}` as never)
                      }
                      activeOpacity={0.75}
                    >
                      {item.images && item.images.length > 0 ? (
                        <Image
                          source={{ uri: item.images[0] }}
                          style={styles.relatedImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.relatedImagePlaceholder}>
                          <Ionicons
                            name="image-outline"
                            size={28}
                            color="#cbd5e1"
                          />
                        </View>
                      )}

                      {item.discount && item.discount > 0 && (
                        <View style={styles.discountTag}>
                          <Text style={styles.discountTagText}>
                            {item.discount}% off
                          </Text>
                        </View>
                      )}

                      <View style={styles.relatedInfo}>
                        <Text style={styles.relatedTitle} numberOfLines={2}>
                          {item.name}
                        </Text>

                        {item.rating && item.rating > 0 && (
                          <View style={styles.ratingRow}>
                            <Ionicons name="star" size={11} color="#f59e0b" />
                            <Text style={styles.ratingText}>
                              {item.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}

                        <View style={styles.relatedPriceRow}>
                          <Text style={styles.relatedPrice}>
                            ₹{(item.price || 0).toLocaleString("en-IN")}
                          </Text>
                          {item.oldPrice &&
                            item.oldPrice > (item.price || 0) && (
                              <Text style={styles.relatedOldPrice}>
                                ₹{item.oldPrice.toLocaleString("en-IN")}
                              </Text>
                            )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {productDetails.hasMoreRelated && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={() =>
                      currentProduct?.subCatId &&
                      dispatch(
                        fetchRelatedProducts({
                          subCatId: currentProduct.subCatId,
                          productId: id!,
                          page: productDetails.relatedPage + 1,
                        }),
                      )
                    }
                    disabled={productDetails.isLoadingRelated}
                    activeOpacity={0.8}
                  >
                    {productDetails.isLoadingRelated ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="add-circle-outline"
                          size={16}
                          color="#fff"
                        />
                        <Text style={styles.loadMoreText}>Load more</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {!productDetails.hasMoreRelated &&
                  productDetails.relatedProducts.length > 0 && (
                    <View style={styles.allSeenRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color="#16a34a"
                      />
                      <Text style={styles.allSeenText}>
                        All related products loaded
                      </Text>
                    </View>
                  )}
              </View>
            )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_GAP = 10;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Skeleton / not-found
  skeletonWrap: { flex: 1, backgroundColor: "#fff" },
  notFoundWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  notFoundIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  notFoundDesc: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  backBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Header
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
    gap: 10,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  headerBrand: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  // Breadcrumb
  breadcrumbBar: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 10,
  },
  breadcrumbContent: { paddingHorizontal: 16, alignItems: "center", gap: 5 },
  breadcrumbLink: { fontSize: 11, color: "#2563eb", fontWeight: "500" },
  breadcrumbSep: { fontSize: 11, color: "#d1d5db", marginHorizontal: 1 },
  breadcrumbCurrent: {
    fontSize: 11,
    color: "#0f172a",
    fontWeight: "600",
    maxWidth: 140,
  },

  // Image placeholder
  imagePlaceholder: {
    width: SW,
    height: SW * 0.8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  // Quick action strip
  qaStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  qaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  qaBtnPrimary: { backgroundColor: "#eff6ff" },
  qaBtnSecondary: { backgroundColor: "#fff" },
  qaBtnText: { fontSize: 13, fontWeight: "600" },
  qaDivider: { width: StyleSheet.hairlineWidth, backgroundColor: "#e2e8f0" },
  qaBadgePrimary: {
    backgroundColor: "#2563eb",
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  qaBadgePrimaryText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  qaBadgeGray: {
    backgroundColor: "#f1f5f9",
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  qaBadgeGrayText: { fontSize: 10, fontWeight: "700", color: "#475569" },

  // Card (shared)
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardSubtitle: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  seeAllLink: { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  countBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countBadgeText: { fontSize: 11, fontWeight: "700", color: "#475569" },

  // Spec
  specIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  specTable: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
  },
  specRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  specKey: {
    flex: 4,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#f1f5f9",
  },
  specValue: {
    flex: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "500",
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  expandBtnText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14 },
  trustChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trustChipText: { fontSize: 11, color: "#166534", fontWeight: "600" },

  // Seller
  sellerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  soldByLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 2,
    fontWeight: "500",
  },
  storeName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  sellerMeta: { fontSize: 11, color: "#64748b", marginTop: 2 },
  visitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  visitBtnText: { color: "#2563eb", fontWeight: "700", fontSize: 12 },

  // Preview (more from seller)
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: CARD_GAP },
  previewCard: {
    width: (SW - 32 - 10) / 2 - 16 - CARD_GAP / 2,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    minHeight: 90,
    justifyContent: "space-between",
  },
  previewTitle: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 6,
  },
  previewPrice: { fontSize: 13, fontWeight: "700", color: "#0f172a" },

  // Related products
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    marginBottom: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  relatedCard: {
    width: (SW - 74 - CARD_GAP) / 2,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  relatedImage: { width: "100%", height: 130, backgroundColor: "#f8fafc" },
  relatedImagePlaceholder: {
    width: "100%",
    height: 130,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  discountTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#ef4444",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountTagText: { fontSize: 9, fontWeight: "700", color: "#fff" },
  relatedInfo: { padding: 10, gap: 4 },
  relatedTitle: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "500",
    lineHeight: 17,
    minHeight: 34,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  relatedPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    flexWrap: "wrap",
  },
  relatedPrice: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  relatedOldPrice: {
    fontSize: 11,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#2563eb",
    paddingVertical: 13,
    borderRadius: 12,
  },
  loadMoreText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  allSeenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  allSeenText: { fontSize: 12, fontWeight: "600", color: "#16a34a" },
});
