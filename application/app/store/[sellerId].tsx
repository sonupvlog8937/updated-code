import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useColors } from "@/hooks/useColors";
import { showToast } from "@/src/utils/toast";
import ProductItem from "@/src/components/ProductItem";
import {
  useAppDispatch,
  useAppSelector,
  fetchSellerStore,
  fetchSellerProfile,
  setSortBy,
  setSearch,
  setCategoryFilter,
  setPriceRange,
  setMinRating,
  setDiscountMin,
  toggleBrandFilter,
  toggleColorFilter,
  toggleSizeFilter,
  toggleRamFilter,
  toggleWeightFilter,
  resetFilters,
  setCurrentPage,
} from "@/src/store";

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

export default function StoreScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const colors = useColors();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const footerBottomPadding = Math.max(insets.bottom, 12) + 12;

  // Redux state
  const {
    products,
    loading,
    loadingMore,
    refreshing,
    sellerProfile,
    categories,
    filterOptions,
    ratingStats,
    meta,
    currentPage,
    sortBy,
    filters,
  } = useAppSelector((state) => state.sellerStore);

  // Local UI state
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice);

  const scrollViewRef = useRef<ScrollView>(null);

  // Initial fetch
  useEffect(() => {
    if (!sellerId) return;
    dispatch(fetchSellerStore({ sellerId, page: 1, append: false }) as any);
    dispatch(fetchSellerProfile(sellerId) as any);
  }, [sellerId, dispatch]);

  // Sync local search with Redux
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    setLocalMinPrice(filters.minPrice);
    setLocalMaxPrice(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  // Handle refresh
  const onRefresh = () => {
    dispatch(fetchSellerStore({ sellerId: sellerId as string, page: 1, append: false }) as any);
  };

  // Handle load more
  const handleLoadMore = () => {
    console.log("Load More:", { currentPage, totalPages: meta.totalPages, loadingMore });
    if (!loadingMore && currentPage < meta.totalPages && sellerId) {
      const nextPage = currentPage + 1;
      console.log("Fetching page:", nextPage);
      dispatch(
        fetchSellerStore({ sellerId, page: nextPage, append: true }) as any
      );
    }
  };

  // Apply filters
  const applyFilters = () => {
    dispatch(setSearch(localSearch));
    dispatch(setPriceRange({ min: localMinPrice, max: localMaxPrice }));
    dispatch(setCurrentPage(1));
    setFilterModalOpen(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    dispatch(fetchSellerStore({ sellerId: sellerId as string, page: 1, append: false }) as any);
  };

  // Reset all filters
  const handleResetFilters = () => {
    dispatch(resetFilters());
    setLocalSearch("");
    setLocalMinPrice("");
    setLocalMaxPrice("");
    setFilterModalOpen(false);
    dispatch(fetchSellerStore({ sellerId: sellerId as string, page: 1, append: false }) as any);
  };

  // Count active filters
  const activeFilterCount = [
    filters.categoryId,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.search,
    filters.discountMin,
    ...filters.brands,
    ...filters.colors,
    ...filters.sizes,
    ...filters.ramOptions,
    ...filters.weights,
  ].filter(Boolean).length;

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
            {[{ _id: "", name: "All Categories" }, ...categories].map((cat) => (
              <TouchableOpacity
                key={cat._id}
                onPress={() => dispatch(setCategoryFilter(cat._id || ""))}
                style={styles.filterOption}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor:
                        filters.categoryId === cat._id ? colors.primary : colors.border,
                      backgroundColor:
                        filters.categoryId === cat._id ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {filters.categoryId === cat._id && (
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
                onPress={() =>
                  dispatch(setPriceRange({ min: range.min, max: range.max }))
                }
                style={styles.filterOption}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor:
                        filters.minPrice === range.min && filters.maxPrice === range.max
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        filters.minPrice === range.min && filters.maxPrice === range.max
                          ? colors.primary
                          : "transparent",
                    },
                  ]}
                >
                  {filters.minPrice === range.min && filters.maxPrice === range.max && (
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
                value={localMinPrice}
                onChangeText={setLocalMinPrice}
                keyboardType="numeric"
                style={[
                  styles.priceInput,
                  { borderColor: colors.border, color: colors.foreground },
                ]}
                placeholderTextColor={colors.mutedForeground}
              />
              <TextInput
                placeholder="Max ₹"
                value={localMaxPrice}
                onChangeText={setLocalMaxPrice}
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
                onPress={() =>
                  dispatch(
                    setMinRating(
                      filters.minRating === String(rating) ? "" : String(rating)
                    )
                  )
                }
                style={styles.filterOption}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor:
                        filters.minRating === String(rating) ? colors.primary : colors.border,
                      backgroundColor:
                        filters.minRating === String(rating) ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {filters.minRating === String(rating) && (
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
          {filterOptions.brands?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                Brand
              </Text>
              {filterOptions.brands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  onPress={() => dispatch(toggleBrandFilter(brand))}
                  style={styles.filterOption}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: filters.brands.includes(brand)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: filters.brands.includes(brand)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    {filters.brands.includes(brand) && (
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
          {filterOptions.colors?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                Color
              </Text>
              <View style={styles.colorGrid}>
                {filterOptions.colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => dispatch(toggleColorFilter(color))}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: getColorValue(color),
                        borderColor: filters.colors.includes(color)
                          ? colors.primary
                          : colors.border,
                        borderWidth: filters.colors.includes(color) ? 3 : 1,
                      },
                    ]}
                  >
                    {filters.colors.includes(color) && (
                      <Feather name="check" size={10} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Size */}
          {filterOptions.sizes?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                Size
              </Text>
              <View style={styles.tagGrid}>
                {filterOptions.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => dispatch(toggleSizeFilter(size))}
                    style={[
                      styles.tag,
                      {
                        borderColor: filters.sizes.includes(size)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: filters.sizes.includes(size)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: filters.sizes.includes(size)
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
          {filterOptions.ramOptions?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                RAM
              </Text>
              <View style={styles.tagGrid}>
                {filterOptions.ramOptions.map((ram) => (
                  <TouchableOpacity
                    key={ram}
                    onPress={() => dispatch(toggleRamFilter(ram))}
                    style={[
                      styles.tag,
                      {
                        borderColor: filters.ramOptions.includes(ram)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: filters.ramOptions.includes(ram)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: filters.ramOptions.includes(ram)
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
          {filterOptions.weights?.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>
                Weight
              </Text>
              {filterOptions.weights.map((weight) => (
                <TouchableOpacity
                  key={weight}
                  onPress={() => dispatch(toggleWeightFilter(weight))}
                  style={styles.filterOption}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: filters.weights.includes(weight)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: filters.weights.includes(weight)
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    {filters.weights.includes(weight) && (
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
                  dispatch(
                    setDiscountMin(
                      filters.discountMin === discount.v ? "" : discount.v
                    )
                  )
                }
                style={styles.filterOption}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor:
                        filters.discountMin === discount.v ? colors.primary : colors.border,
                      backgroundColor:
                        filters.discountMin === discount.v ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {filters.discountMin === discount.v && (
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
        <View style={[styles.filterFooter, { borderTopColor: colors.border, paddingBottom: footerBottomPadding }]}>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={handleResetFilters}
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
    <>
      <Stack.Screen
        options={{
          headerTitle: sellerProfile?.storeName || "Store",
        }}
      />
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
                {sellerProfile?.storeLogo ? (
                  <Image
                    source={{ uri: sellerProfile.storeLogo }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <Feather name="shopping-bag" size={28} color="#fff" />
                )}
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
                    {sellerProfile?.storeName || "Store"}
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
                value={localSearch}
                onChangeText={setLocalSearch}
                onSubmitEditing={applyFilters}
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Sort */}
            <TouchableOpacity
              onPress={() => setSortModalOpen(!sortModalOpen)}
              style={[styles.sortDropdown, { borderColor: colors.border }]}
            >
              <Feather name="sliders" size={14} color={colors.foreground} />
              <Text style={[styles.sortText, { color: colors.foreground }]}>Sort</Text>
            </TouchableOpacity>

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
                    position: "absolute",
                    top: -2,
                    right: -2,
                    backgroundColor: colors.destructive,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    textAlign: "center",
                    lineHeight: 16,
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
                    <ProductItem item={item as any} />
                  </View>
                ))}
              </View>

              {/* Load more button */}
              {currentPage < meta.totalPages ? (
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
                      Load More (Page {currentPage} of {meta.totalPages})
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {/* End message */}
              {currentPage >= meta.totalPages && meta.total > 0 && (
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
                onPress={handleResetFilters}
                style={[styles.resetBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.resetBtnText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Filter modal */}
        {renderFilterModal()}

        {/* Sort modal */}
        <Modal
          visible={sortModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setSortModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.sortOverlay}
            onPress={() => setSortModalOpen(false)}
          >
            <View
              style={[
                styles.sortMenu,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {SORTS.map((sort) => (
                <TouchableOpacity
                  key={sort.v}
                  onPress={() => {
                    dispatch(setSortBy(sort.v));
                    setSortModalOpen(false);
                    dispatch(setCurrentPage(1));
                    dispatch(
                      fetchSellerStore({ sellerId: sellerId as string, page: 1, append: false }) as any
                    );
                  }}
                  style={[
                    styles.sortOption,
                    sortBy === sort.v && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      {
                        color:
                          sortBy === sort.v ? "#fff" : colors.foreground,
                      },
                    ]}
                  >
                    {sort.l}
                  </Text>
                  {sortBy === sort.v && (
                    <Feather name="check" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </>
  );
}

function getColorValue(colorName: string): string {
  const colorMap: Record<string, string> = {
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
    overflow: "hidden",
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
  sortOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sortMenu: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
