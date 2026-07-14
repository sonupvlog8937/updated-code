import { addToCart, fetchMyListData, setCartData, useAppDispatch, useAppSelector } from "@/src/store";
import { fetchDataFromApi, postData } from "@/src/utils/api";
import { gmImg, GO_MARKET_FALLBACK } from "@/src/utils/goMarketMedia";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SortModal, SORT_OPTIONS } from "./SortModal";
import { AddToCartDialog } from "./AddToCartDialog";
import { showToast } from "@/src/utils/toast";
import { FilterModal, FilterValues } from "./FilterModal";
import { GrocerySearchModal } from "./GrocerySearchModal";

const TABS = [
  { key: "featured", label: "Featured" },
  { key: "popular", label: "Popular" },
  { key: "latest", label: "Latest" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Props = {
  shopId: string;
  searchMode?: boolean;
  initialQuery?: string;
  listHeader?: React.ReactElement;
  shopIsOpen?: boolean;
};

export function GoMarketShopCatalog({
  shopId,
  searchMode = false,
  initialQuery = "",
  shopIsOpen = true,
  listHeader,
}: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLogin, userData, myListData, cartData } = useAppSelector((s: any) => s.app);
  const [search, setSearch] = useState(initialQuery);
  const [appliedSearch, setAppliedSearch] = useState(initialQuery);
  const [tab, setTab] = useState<TabKey>("featured");
  const [sort, setSort] = useState("latest");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [gridColumns, setGridColumns] = useState<1 | 2>(2);

  const [products, setProducts] = useState<any[]>([]);
  const [filterMeta, setFilterMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const flatListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [suggestions, setSuggestions] = useState<{
    suggestions: any[];
    recentSearches: string[];
    trendingSearches: string[];
    popularProducts: any[];
    topSearches: string[];
  }>({ suggestions: [], recentSearches: [], trendingSearches: [], popularProducts: [], topSearches: [] });
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cartDialogVisible, setCartDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    setSearch(initialQuery);
    // Don't auto-show suggestions - only show when user focuses
  }, [initialQuery]);

  const apiPath = searchMode
    ? `/api/go-market/grocery-shops/${shopId}/search`
    : `/api/go-market/grocery-shops/${shopId}/catalog`;

  const loadPage = useCallback(
    async (pageNum: number, append: boolean, isTabChange: boolean = false, overrideTab?: TabKey) => {
      if (!shopId) return;
      if (append) setLoadingMore(true);
      else if (isTabChange) {
        setTabLoading(true);
        setProducts([]);
      }
      else setLoading(true);
      try {
        const activeTab = overrideTab ?? tab;
        const p = new URLSearchParams({
          page: String(pageNum),
          limit: "12",
          tab: activeTab,
          search: appliedSearch,
          ...(sort && sort !== "latest" ? { sort } : {}),
          ...(inStock ? { inStock: "true" } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(subCategoryId ? { subCategoryId } : {}),
          ...(minPrice ? { minPrice } : {}),
          ...(maxPrice ? { maxPrice } : {}),
          ...(minRating > 0 ? { minRating: String(minRating) } : {}),
        });
        if (searchMode && appliedSearch) p.set("q", appliedSearch);
        const res = await fetchDataFromApi(`${apiPath}?${p}`);
        if (res?.success || res?.error === false) {
          const rows = res.data || [];
          setFilterMeta(res.filterMeta || null);
          setProducts((prev) => (append ? [...prev, ...rows] : rows));
          setTotalPages(res.pagination?.totalPages || 1);
          setPage(pageNum);
        }
      } finally {
        setLoading(false);
        setTabLoading(false);
        setLoadingMore(false);
      }
    },
    [shopId, apiPath, tab, sort, appliedSearch, inStock, categoryId, subCategoryId, minPrice, maxPrice, minRating, searchMode],
  );

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  const fetchDefaults = useCallback(() => {
    if (!shopId) return;
    fetchDataFromApi(`/api/go-market/grocery-shops/${shopId}/search-defaults`).then((res) => {
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
  }, [shopId]);

  useEffect(() => {
    if (!shopId) {
      setSuggestions({ suggestions: [], recentSearches: [], trendingSearches: [], popularProducts: [], topSearches: [] });
      return;
    }
    if (!search.trim()) {
      fetchDefaults();
      return;
    }
    setSuggestionsLoading(true);
    const t = setTimeout(() => {
      fetchDataFromApi(
        `/api/go-market/grocery-shops/${shopId}/search-suggestions?q=${encodeURIComponent(search.trim())}`,
      ).then((res) => {
        console.log('🔍 Search Suggestions Response:', res);
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
      }).finally(() => setSuggestionsLoading(false));
    }, 150);
    return () => clearTimeout(t);
  }, [shopId, search, fetchDefaults]);

  const goSearch = (q?: string) => {
    const query = (q || search).trim();
    if (!query) return;
    setAppliedSearch(query);
    setSearch(query);
    setShowSuggestions(false); // Close modal
    Keyboard.dismiss();
    if (searchMode) return;
    router.push(`/go-market-shop/${shopId}/search?q=${encodeURIComponent(query)}` as never);
  };

  const handleApplyFilters = (filters: FilterValues) => {
    setCategoryId(filters.categoryId);
    setSubCategoryId(filters.subCategoryId);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setMinRating(filters.minRating);
    setInStock(filters.inStock);
  };

  const subCats = useMemo(
    () =>
      (filterMeta?.subCategories || []).filter(
        (sc: any) => !categoryId || String(sc.parentId) === String(categoryId),
      ),
    [filterMeta, categoryId],
  );

  const handleAddToCart = (product: any) => {
    if (!shopIsOpen) {
      showToast("error", "Shop is currently closed. You cannot add items to cart.");
      return;
    }

    const hasOptions =
      product.options?.length > 0 ||
      product.productOptions?.some((opt: any) => opt.values?.length > 0);

    if (hasOptions) {
      setSelectedProduct(product);
      setCartDialogVisible(true);
    } else {
      handleConfirmAddToCart(product, null, 1);
    }
  };

  const handleConfirmAddToCart = async (product: any, selectedOption: any, quantity: number) => {
    if (!shopIsOpen) {
      showToast("error", "Shop is currently closed. You cannot add items to cart.");
      return;
    }

    const selectedOptionsData: Record<string, string> | undefined = selectedOption
      ? { option: String(selectedOption.name || "") }
      : undefined;

    const cartProduct = {
      _id: product._id,
      name: product.name || product.itemName || product.productName,
      price:
        selectedOption?.price && selectedOption.price > 0
          ? selectedOption.price
          : product.discountPrice && product.discountPrice > 0
          ? product.discountPrice
          : product.price,
      oldPrice: product.oldPrice || product.originalPrice || product.price,
      images: product.images || (product.image ? [product.image] : []),
      countInStock: product.countInStock ?? product.stock ?? 999,
      rating: product.rating || product.averageRating || 0,
      brand: product.brand,
      discount: product.discount,
      weight: selectedOption?.name || product.weight,
      ...(selectedOptionsData && { selectedOptions: selectedOptionsData }),
    };

    if (isLogin && (userData?._id || userData?.id)) {
      await dispatch(
        addToCart({ product: cartProduct, userId: userData?._id || userData?.id, quantity }) as any,
      ).unwrap();
      return;
    }

    const localItem = {
      _id: `${product._id}-${selectedOption?._id || "default"}`,
      productId: product._id,
      productTitle: cartProduct.name,
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
    dispatch(
      setCartData([
        ...cartData.filter((item: any) => item._id !== localItem._id),
        localItem,
      ]) as any,
    );
    showToast("success", `${quantity}x ${cartProduct.name} added to cart`);
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
      price:
        product.discountPrice && product.discountPrice > 0
          ? product.discountPrice
          : product.price,
      oldPrice: product.oldPrice || product.originalPrice || product.price,
      productId: product._id,
      brand: product.brand || product.shopName || product.restaurantName || "GoMarket",
      discount: product.discount,
    });
    if (res?.error === false) {
      showToast("success", "Added to wishlist");
      dispatch(fetchMyListData() as any);
    } else {
      showToast("error", res?.message || "Failed to add wishlist");
    }
  };

  const renderProduct = ({ item: p }: { item: any }) => {
    const sellingPrice = p.price || 0;
    const mrp = p.oldPrice || p.mrp || p.price;
    const price = sellingPrice;
    const oldPrice = mrp;
    const hasDiscount = mrp > 0 && sellingPrice > 0 && sellingPrice < mrp;
    const discountPercent =
      p.discount || (hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0);
    const saveAmount = hasDiscount ? mrp - sellingPrice : 0;
    const inWishlist = myListData?.some((item: any) => item?.productId === p._id);
    const rating = p.rating || p.averageRating || 0;
    const isOutOfStock = p.stock === 0 || p.inStock === false;
    const isStoreClosed = !shopIsOpen;

    return (
      <TouchableOpacity
        style={[S.tile, gridColumns === 1 && S.tileFull]}
        onPress={() => router.push(`/go-market-product/grocery/${p._id}` as never)}
        activeOpacity={0.7}
      >
        <View style={S.tileImageWrap}>
          <Image
            source={{ uri: gmImg(p.image, GO_MARKET_FALLBACK) }}
            style={S.tileImg}
          />
          {discountPercent > 0 && (
            <View style={S.discountBadge}>
              <Text style={S.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
          {isOutOfStock && (
            <View style={S.outOfStockOverlay}>
              <Text style={S.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          <TouchableOpacity
            style={[S.wishlistBtn, inWishlist && S.wishlistBtnActive]}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              handleWishlist(p);
            }}
          >
            <Text style={[S.wishlistIcon, inWishlist && S.wishlistIconActive]}>
              {inWishlist ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={S.tileContent}>
          <Text style={S.tileName} numberOfLines={1}>
            {p.name}
          </Text>

          {p.description && (
            <Text style={S.tileDesc} numberOfLines={1}>
              {p.description}
            </Text>
          )}

          {p.weight && <Text style={S.tileWeight}>{p.weight}</Text>}

          {rating > 0 && (
            <View style={S.ratingRow}>
              <Text style={S.ratingStar}>⭐</Text>
              <Text style={S.ratingText}>{rating.toFixed(1)}</Text>
              {p.reviewCount > 0 && (
                <Text style={S.reviewCount}>({p.reviewCount})</Text>
              )}
            </View>
          )}

          <View style={S.priceRow}>
            <View style={S.priceCol}>
              <Text style={S.tilePrice}>₹{price}</Text>
              {hasDiscount && oldPrice > price && (
                <>
                  <Text style={S.originalPrice}>₹{oldPrice}</Text>
                  {saveAmount > 0 && (
                    <Text style={S.savePrice}>Save ₹{saveAmount}</Text>
                  )}
                </>
              )}
            </View>

            {!isOutOfStock && !isStoreClosed && (
              <TouchableOpacity
                style={S.addBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart(p);
                }}
                activeOpacity={0.7}
              >
                <Text style={S.addBtnText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── List Header ────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {listHeader ?? null}

      {/* Search bar - Different for searchMode */}
      {searchMode ? (
        // Search Mode: Trigger modal on click (same as catalog mode)
        <View style={S.searchWrap}>
          <TouchableOpacity
            style={S.searchRow}
            onPress={() => {
              setSearch(""); // Clear search so keywords show immediately
              setShowSuggestions(true);
              // Always fetch defaults when opening modal
              fetchDataFromApi(`/api/go-market/grocery-shops/${shopId}/search-defaults`).then((res) => {
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
            }}
            activeOpacity={0.7}
          >
            <View pointerEvents="none">
              <Feather name="search" size={17} color="#64748b" />
            </View>
            <Text style={S.searchPlaceholder}>
              {search || "Search products…"}
            </Text>
            <View pointerEvents="none">
              <Feather name="sliders" size={17} color="#64748b" />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        // Normal Mode: Trigger modal on click
        <View style={S.searchWrap}>
          <TouchableOpacity
            style={S.searchRow}
            onPress={() => {
              setSearch(""); // Clear search so keywords show immediately
              setShowSuggestions(true);
              // Always fetch defaults when opening modal
              fetchDataFromApi(`/api/go-market/grocery-shops/${shopId}/search-defaults`).then((res) => {
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
            }}
            activeOpacity={0.7}
          >
            <View pointerEvents="none">
              <Feather name="search" size={17} color="#64748b" />
            </View>
            <Text style={S.searchPlaceholder}>Search products…</Text>
            <View pointerEvents="none">
              <Feather name="sliders" size={17} color="#64748b" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs + Sort + Filters row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.chips}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[S.chip, tab === t.key && S.chipOn]}
            onPress={() => {
              if (tab !== t.key) {
                setTab(t.key);
                loadPage(1, false, true, t.key);
              }
            }}
            disabled={tabLoading}
          >
            <Text style={[S.chipTxt, tab === t.key && S.chipTxtOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[S.chip, sort !== "latest" && S.chipOn]}
          onPress={() => setSortModalVisible(true)}
        >
          <Text style={[S.chipTxt, sort !== "latest" && S.chipTxtOn]}>
            {sort === "latest"
              ? "Sort"
              : `Sort: ${SORT_OPTIONS.find((o) => o.key === sort)?.label || "Sort"}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.chip, (categoryId || subCategoryId || minPrice || maxPrice || minRating > 0 || inStock) && S.chipOn]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={[S.chipTxt, (categoryId || subCategoryId || minPrice || maxPrice || minRating > 0 || inStock) && S.chipTxtOn]}>
            Filters
            {(categoryId || subCategoryId || minPrice || maxPrice || minRating > 0 || inStock) && 
              ` (${[categoryId, subCategoryId, minPrice, maxPrice, minRating > 0, inStock].filter(Boolean).length})`
            }
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={S.gridToggle}
          onPress={() => setGridColumns(gridColumns === 2 ? 1 : 2)}
        >
          <Text style={S.gridToggleText}>{gridColumns === 2 ? "▤ 1 row" : "▦ 2 row"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {tabLoading && (
        <View style={{ paddingHorizontal: 14 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  minWidth: "45%",
                  maxWidth: "48%",
                  height: 260,
                  backgroundColor: "#e8f0dc",
                  borderRadius: 16,
                  overflow: "hidden",
                  marginBottom: 4,
                  opacity: 0.6 + (i % 2) * 0.15,
                }}
              >
                <View style={{ height: 140, backgroundColor: "#d4e0c4" }} />
                <View style={{ padding: 10, gap: 8 }}>
                  <View style={{ height: 12, borderRadius: 6, backgroundColor: "#d4e0c4", width: "70%" }} />
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: "#d4e0c4", width: "50%" }} />
                  <View style={{ height: 16, borderRadius: 6, backgroundColor: "#c8d8b4", width: "40%", marginTop: 4 }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {loading && !products.length && (
        <ActivityIndicator color="#2563eb" style={{ marginVertical: 20 }} />
      )}
    </View>
  );

  return (
    <>
      <FlatList
        ref={flatListRef}
        key={gridColumns}
        data={products}
        keyExtractor={(p) => p._id}
        numColumns={gridColumns}
        columnWrapperStyle={
          gridColumns === 2 ? { gap: 10, paddingHorizontal: 14 } : undefined
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={ListHeader}
        renderItem={renderProduct}
        onEndReached={() => {
          if (page < totalPages && !loadingMore && !loading) {
            loadPage(page + 1, true);
          }
        }}
        onEndReachedThreshold={0.4}
        scrollEventThrottle={16}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={50}
        initialNumToRender={12}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color="#2563eb" style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? <Text style={S.empty}>No products found.</Text> : null
        }
      />

      {/* Grocery Search Modal - Full-Screen Modal for both modes */}
      <GrocerySearchModal
        visible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        search={search}
        onSearchChange={setSearch}
        onSearch={goSearch}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        shopId={shopId}
      />

      <SortModal
        visible={sortModalVisible}
        selectedSort={sort}
        onSelect={(sortKey) => setSort(sortKey)}
        onClose={() => setSortModalVisible(false)}
      />
      
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        filterMeta={filterMeta}
        currentFilters={{
          categoryId,
          subCategoryId,
          minPrice,
          maxPrice,
          minRating,
          inStock,
        }}
        subCats={subCats}
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
    </>
  );
}

const S = StyleSheet.create({
  searchWrap: {
    marginHorizontal: 14,
    marginBottom: 10,
    position: "relative",
    zIndex: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  searchRowActive: {
    borderColor: "#2563eb",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  searchBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },

  // Tabs, filters, and product grid styles
  chips: { gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  chip: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  chipOn: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  chipTxt: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  chipTxtOn: { color: "#fff" },
  filterPanel: { paddingBottom: 8 },
  gridToggle: {
    borderWidth: 1.5,
    borderColor: "#2D5016",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#E8F5E1",
  },
  gridToggleText: { fontSize: 13, fontWeight: "900", color: "#2D5016" },
  miniInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
    fontSize: 12,
  },
  tile: {
    flex: 1,
    maxWidth: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tileFull: { maxWidth: "100%", marginHorizontal: 14 },
  tileImageWrap: { position: "relative", width: "100%", height: 140, backgroundColor: "#f8fafc" },
  tileImg: { width: "100%", height: "100%", resizeMode: "cover" },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wishlistBtnActive: { backgroundColor: "#FF3B30" },
  wishlistIcon: { fontSize: 16, color: "#FF3B30" },
  wishlistIconActive: { color: "#fff" },
  tileContent: { padding: 10, minHeight: 132 },
  tileName: { fontSize: 13, fontWeight: "700", color: "#0f172a", lineHeight: 17, marginBottom: 4 },
  tileDesc: { fontSize: 10, color: "#64748b", lineHeight: 13, marginBottom: 4 },
  tileWeight: { fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 6 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 8 },
  ratingStar: { fontSize: 11 },
  ratingText: { fontSize: 11, fontWeight: "700", color: "#0f172a" },
  reviewCount: { fontSize: 10, fontWeight: "600", color: "#94a3b8" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceCol: { flexDirection: "row", alignItems: "center", gap: 6 },
  tilePrice: { fontSize: 16, fontWeight: "900", color: "#2D5016", letterSpacing: -0.3 },
  originalPrice: { fontSize: 12, fontWeight: "600", color: "#94a3b8", textDecorationLine: "line-through" },
  savePrice: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#2D5016",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2D5016",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 20 },
  empty: { textAlign: "center", color: "#94a3b8", padding: 32 },
});