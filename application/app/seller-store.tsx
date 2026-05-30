import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Modal,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useColors } from "@/hooks/useColors";
import { useAppDispatch } from "@/src/store";
import { fetchDataFromApi } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";
import ProductItem from "@/src/components/ProductItem";

const SORTS = [
  { v: "latest", l: "Newest First" },
  { v: "popularity", l: "Best Selling" },
  { v: "rating", l: "Top Rated" },
  { v: "priceLowToHigh", l: "Price: Low → High" },
  { v: "priceHighToLow", l: "Price: High → Low" },
  { v: "discount", l: "Biggest Discount" },
];

const QUICK_PRICES = [
  { l: "Under ₹500", min: "", max: "500" },
  { l: "₹500 – ₹1,000", min: "500", max: "1000" },
  { l: "₹1,000 – ₹5,000", min: "1000", max: "5000" },
  { l: "₹5,000 – ₹10,000", min: "5000", max: "10000" },
  { l: "Above ₹10,000", min: "10000", max: "" },
];

const DISCOUNT_OPTS = [
  { v: "10", l: "10% or more" },
  { v: "20", l: "20% or more" },
  { v: "30", l: "30% or more" },
  { v: "50", l: "50% or more" },
];

export default function SellerStorePage() {
  const colors = useColors();
  const router = useRouter();
  const { sellerId } = useLocalSearchParams();

  // Remote state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sellerName, setSellerName] = useState("Seller Store");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filterOpts, setFilterOpts] = useState({
    brands: [],
    sizes: [],
    colors: [],
    ramOptions: [],
    weights: [],
  });
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [ratingStats, setRatingStats] = useState({ avg: 0, breakdown: {}, totalReviews: 0 });

  // UI state
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("latest");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedRam, setSelectedRam] = useState([]);
  const [selectedWeights, setSelectedWeights] = useState([]);
  const [minRating, setMinRating] = useState("");
  const [discountMin, setDiscountMin] = useState("");

  const scrollViewRef = useRef();

  // Fetch products
  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      if (!sellerId) return;

      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const query = new URLSearchParams({
          page: pageNum,
          limit: 20,
          sortBy,
          ...(searchInput && { search: searchInput }),
          ...(selectedCategory && { catId: selectedCategory }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(minRating && { minRating }),
          ...(selectedBrands.length && { brands: selectedBrands.join(",") }),
          ...(selectedColors.length && { colors: selectedColors.join(",") }),
          ...(selectedSizes.length && { sizes: selectedSizes.join(",") }),
          ...(selectedRam.length && { ramOptions: selectedRam.join(",") }),
          ...(selectedWeights.length && { weights: selectedWeights.join(",") }),
          ...(discountMin && { discountMin }),
        });

        const res = await fetchDataFromApi(
          `/api/product/store/${sellerId}?${query.toString()}`
        );

        if (res?.success) {
          if (append) {
            setProducts((prev) => [...prev, ...(res.products || [])]);
          } else {
            setProducts(res.products || []);
          }
          setMeta({ total: res.total || 0, totalPages: res.totalPages || 1 });
          setCategories(res.categories || []);
          if (res.filterOptions) setFilterOpts(res.filterOptions);
          if (res.ratingStats) setRatingStats(res.ratingStats);
          const first = res.products?.[0];
          if (first)
            setSellerName(
              first?.seller?.storeProfile?.storeName ||
              first?.seller?.name ||
              "Seller Store"
            );
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        showToast("error", "Failed to load products");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [sellerId, sortBy, searchInput, selectedCategory, minPrice, maxPrice, minRating, selectedBrands, selectedColors, selectedSizes, selectedRam, selectedWeights, discountMin]
  );

  // Fetch seller profile
  useEffect(() => {
    if (!sellerId) return;
    fetchDataFromApi(`/api/user/seller/store-profile/${sellerId}`).then((res) => {
      if (res?.success) {
        setSellerProfile(res?.seller?.storeProfile || null);
        setSellerName(
          res?.seller?.storeProfile?.storeName ||
          res?.seller?.name ||
          "Seller Store"
        );
      }
    });
  }, [sellerId]);

  // Initial fetch
  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  // Load more on pagination
  const handleLoadMore = () => {
    if (!loadingMore && page < meta.totalPages) {
      setPage((prev) => prev + 1);
      fetchProducts(page + 1, true);
    }
  };

  // Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1, false);
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1);
    setFilterModalOpen(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    fetchProducts(1, false);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchInput("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategory("");
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedRam([]);
    setSelectedWeights([]);
    setMinRating("");
    setDiscountMin("");
    setSortBy("latest");
    setPage(1);
    setFilterModalOpen(false);
  };

  // Count active filters
  const activeFilterCount =
    [
      selectedCategory,
      minPrice,
      maxPrice,
      minRating,
      searchInput,
      discountMin,
      ...selectedBrands,
      ...selectedColors,
      ...selectedSizes,
      ...selectedRam,
      ...selectedWeights,
    ].filter(Boolean).length;

  // Toggle array selections
  const toggleSelection = (arr, setArr, val) => {
    if (arr.includes(val)) {
      setArr(arr.filter((x) => x !== val));
    } else {
      setArr([...arr, val]);
    }
  };

  const renderProduct = ({ item }) => (
    <ProductItem item={item} />
  );

  const renderFilterModal = () => (
    <Modal
      visible={filterModalOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setFilterModalOpen(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={[
            styles.filterHeader,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.filterTitle, { color: colors.foreground }]}>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Text>
          <TouchableOpacity
            onPress={() => setFilterModalOpen(false)}
            style={styles.closeBtn}
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.filterContent}
        >
          {/* Category */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
              Category
            </Text>
            {[
              { _id: "", name: "All Categories" },
              ...categories,
            ].map((cat) => (
              <TouchableOpacity
                key={cat._id}
                onPress={() => setSelectedCategory(cat._id)}
                style={styles.filterOption}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: selectedCategory === cat._id ? colors.primary : colors.border,
                      backgroundColor: selectedCategory === cat._id ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {selectedCategory === cat._id && (
                    <Feather name="check" size={12} color={colors.background} />
                  )}
                </View>
                <Text style={[styles.filterOptionText, { color: colors.foreground }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
              Price Range
            </Text>
            {QUICK_PRICES.map((range) => (
              <TouchableOpacity
                key={range.l}
                onPress={() => {
                  setMinPrice(range.min);
                  setMaxPrice(range.max);
                }}
                style={styles.filterOption}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor:
                        minPrice === range.min && maxPrice === range.max
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        minPrice === range.min && maxPrice === range.max
                          ? colors.primary
                          : "transparent",
                    },
                  ]}
                >
                  {minPrice === range.min && maxPrice === range.max && (
                    <Feather name="check" size={12} color={colors.background} />
                  )}
                </View>
                <Text style={[styles.filterOptionText, { color: colors.foreground }]}>
                  {range.l}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.priceInputRow}>
              <TextInput
                placeholder="Min ₹"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                style={[
                  styles.priceInput,
                  { borderColor: colors.border, color: colors.foreground },
                ]}
                placeholderTextColor={colors.mutedForeground}
              />
              <TextInput
                placeholder="Max ₹"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                style={[
                  styles.priceInput,
                  { borderColor: colors.border, color: colors.foreground },
                ]}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          {/* Rating */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
              Rating
            </Text>
            {[4, 3, 2].map((rating) => (
              <TouchableOpacity
                key={rating}
                onPress={() => setMinRating(minRating === String(rating) ? "" : String(rating))}
                style={styles.filterOption}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: minRating === String(rating) ? colors.primary : colors.border,
                      backgroundColor: minRating === String(rating) ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {minRating === String(rating) && (
                    <Feather name="check" size={12} color={colors.background} />
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ flexDirection: "row", gap: 1 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= rating ? "star" : "star-outline"}
                        size={10}
                        color="#fbbf24"
                      />
                    ))}
                  </View>
                  <Text style={[styles.filterOptionText, { color: colors.foreground }]}>
                    & above
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Brand */}
          {filterOpts.brands?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                Brand
              </Text>
              {filterOpts.brands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  onPress={() => toggleSelection(selectedBrands, setSelectedBrands, brand)}
                  style={styles.filterOption}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: selectedBrands.includes(brand)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: selectedBrands.includes(brand)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    {selectedBrands.includes(brand) && (
                      <Feather name="check" size={12} color={colors.background} />
                    )}
                  </View>
                  <Text style={[styles.filterOptionText, { color: colors.foreground }]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Color */}
          {filterOpts.colors?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                Color
              </Text>
              <View style={styles.colorGrid}>
                {filterOpts.colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => toggleSelection(selectedColors, setSelectedColors, color)}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: getColorValue(color),
                        borderColor: selectedColors.includes(color)
                          ? colors.primary
                          : colors.border,
                        borderWidth: selectedColors.includes(color) ? 3 : 1,
                      },
                    ]}
                  >
                    {selectedColors.includes(color) && (
                      <Feather name="check" size={10} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Size */}
          {filterOpts.sizes?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                Size
              </Text>
              <View style={styles.tagGrid}>
                {filterOpts.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => toggleSelection(selectedSizes, setSelectedSizes, size)}
                    style={[
                      styles.tag,
                      {
                        borderColor: selectedSizes.includes(size)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: selectedSizes.includes(size)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: selectedSizes.includes(size)
                            ? colors.background
                            : colors.foreground,
                        },
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* RAM */}
          {filterOpts.ramOptions?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                RAM
              </Text>
              <View style={styles.tagGrid}>
                {filterOpts.ramOptions.map((ram) => (
                  <TouchableOpacity
                    key={ram}
                    onPress={() => toggleSelection(selectedRam, setSelectedRam, ram)}
                    style={[
                      styles.tag,
                      {
                        borderColor: selectedRam.includes(ram)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: selectedRam.includes(ram)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: selectedRam.includes(ram)
                            ? colors.background
                            : colors.foreground,
                        },
                      ]}
                    >
                      {ram}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Weight */}
          {filterOpts.weights?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                Weight
              </Text>
              {filterOpts.weights.map((weight) => (
                <TouchableOpacity
                  key={weight}
                  onPress={() => toggleSelection(selectedWeights, setSelectedWeights, weight)}
                  style={styles.filterOption}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: selectedWeights.includes(weight)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: selectedWeights.includes(weight)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    {selectedWeights.includes(weight) && (
                      <Feather name="check" size={12} color={colors.background} />
                    )}
                  </View>
                  <Text style={[styles.filterOptionText, { color: colors.foreground }]}>
                    {weight}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Discount */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
              Discount
            </Text>
            {DISCOUNT_OPTS.map((discount) => (
              <TouchableOpacity
                key={discount.v}
                onPress={() =>
                  setDiscountMin(discountMin === discount.v ? "" : discount.v)
                }
                style={styles.filterOption}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: discountMin === discount.v ? colors.primary : colors.border,
                      backgroundColor: discountMin === discount.v ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {discountMin === discount.v && (
                    <Feather name="check" size={12} color={colors.background} />
                  )}
                </View>
                <Text style={[styles.filterOptionText, { color: colors.foreground }]}>
                  {discount.l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Footer buttons */}
        <View style={[styles.filterFooter, { borderTopColor: colors.border }]}>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={resetFilters}
              style={[styles.filterBtn, { backgroundColor: colors.destructive }]}
            >
              <Text style={styles.filterBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={applyFilters}
            style={[styles.filterBtn, { backgroundColor: colors.primary, flex: 1 }]}
          >
            <Text style={styles.filterBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        scrollEventThrottle={16}
      >
        {/* Seller Banner */}
        <View style={[styles.sellerBanner, { backgroundColor: colors.primary }]}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={[
                styles.sellerAvatar,
                { backgroundColor: "rgba(255,255,255,0.1)" },
              ]}
            >
              <Feather name="store" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "Inter_700Bold",
                    color: "#fff",
                  }}
                  numberOfLines={1}
                >
                  {sellerName}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color="#2563eb" />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 2,
                  marginBottom: 6,
                }}
              >
                {sellerProfile?.description || "Verified Seller · Quality Assured"}
              </Text>
              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                {ratingStats?.avg > 0 && (
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                    ⭐ {ratingStats.avg.toFixed(1)}
                  </Text>
                )}
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                  📦 {meta.total} Products
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Toolbar */}
        <View
          style={[
            styles.toolbar,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          {/* Search */}
          <View style={[styles.searchBar, { borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              placeholder="Search products…"
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={() => applyFilters()}
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Sort */}
          <View style={[styles.sortDropdown, { borderColor: colors.border }]}>
            <Feather name="arrow-down-up" size={14} color={colors.foreground} />
            <Text style={[styles.sortText, { color: colors.foreground }]}>Sort</Text>
          </View>

          {/* Filter button */}
          <TouchableOpacity
            onPress={() => setFilterModalOpen(true)}
            style={[
              styles.filterButtonMain,
              {
                borderColor: colors.border,
                backgroundColor:
                  activeFilterCount > 0 ? colors.primary : colors.card,
              },
            ]}
          >
            <Feather
              name="filter"
              size={16}
              color={activeFilterCount > 0 ? "#fff" : colors.foreground}
            />
            {activeFilterCount > 0 && (
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                {activeFilterCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading products…
            </Text>
          </View>
        ) : products.length > 0 ? (
          <>
            {/* Product count */}
            <View style={styles.countSection}>
              <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                Showing{" "}
                <Text style={{ fontWeight: "700", color: colors.foreground }}>
                  {products.length}
                </Text>{" "}
                of{" "}
                <Text style={{ fontWeight: "700", color: colors.foreground }}>
                  {meta.total}
                </Text>{" "}
                products
              </Text>
            </View>

            {/* Products grid */}
            <View style={styles.productsContainer}>
              {products.map((item) => (
                <View key={item._id} style={styles.productWrapper}>
                  <ProductItem item={item} />
                </View>
              ))}
            </View>

            {/* Load more button */}
            {page < meta.totalPages && (
              <TouchableOpacity
                onPress={handleLoadMore}
                disabled={loadingMore}
                style={[
                  styles.loadMoreBtn,
                  { backgroundColor: colors.primary, opacity: loadingMore ? 0.6 : 1 },
                ]}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Load More (Page {page} of {meta.totalPages})
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* End message */}
            {page >= meta.totalPages && meta.total > 0 && (
              <View style={styles.endMessage}>
                <Text style={[styles.endMessageText, { color: colors.mutedForeground }]}>
                  No more products to load
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No products found
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Try adjusting your filters or search query
            </Text>
            <TouchableOpacity
              onPress={resetFilters}
              style={[styles.resetBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.resetBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Filter modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
}

// Helper function to get color value
function getColorValue(colorName) {
  const colorMap = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    black: "#1f2937",
    white: "#f8fafc",
    orange: "#f97316",
    pink: "#ec4899",
    purple: "#a855f7",
    grey: "#9ca3af",
    gray: "#9ca3af",
    brown: "#92400e",
    navy: "#1e3a5f",
    gold: "#d97706",
    silver: "#94a3b8",
    cream: "#fef3c7",
  };
  return colorMap[colorName?.toLowerCase()] || "#e2e8f0";
}

const styles = StyleSheet.create({
  sellerBanner: {
    padding: 16,
    margin: 12,
    borderRadius: 12,
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  sortDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
  },
  sortText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  filterButtonMain: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 12,
  },
  productsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    gap: 8,
  },
  productWrapper: {
    width: "48%",
  },
  loadingContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyContainer: {
    minHeight: 400,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: "center",
  },
  resetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  resetBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  loadMoreBtn: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  endMessage: {
    alignItems: "center",
    paddingVertical: 24,
  },
  endMessageText: {
    fontSize: 12,
  },
  // Filter modal styles
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    padding: 6,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  filterOptionText: {
    fontSize: 12,
  },
  priceInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  filterFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  filterBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
});
