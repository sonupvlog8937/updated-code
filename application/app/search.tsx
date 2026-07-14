import { useColors } from "@/hooks/useColors";
import FilterBottomSheet from "@/src/components/Filterbottomsheet";
import { ProductItem } from "@/src/components/ProductItem";
import SortModal from "@/src/components/Sortmodal";
import {
  fetchProducts,
  resetAllFilters,
  saveRecentSearch,
  setPage,
  setSelectedBrands,
  setSelectedColors,
  setSelectedDiscountRanges,
  setSelectedPriceRanges,
  setSelectedProductTypes,
  setSelectedRamOptions,
  setSelectedRatingBands,
  setSelectedSaleOnly,
  setSelectedSizes,
  setSelectedStockStatus,
  setSelectedWeights,
  setSortType,
  useAppDispatch,
  useAppSelector,
} from "@/src/store";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TRENDING_SEARCHES = [
  "shirt",
  "jeans",
  "t-shirts",
  "bags",
  "watches",
  "trousers",
];
const MOST_SEARCHED = [
  "formal pant",
  "zara jeans",
  "formal shirt",
  "baggy jeans",
  "black shirt",
  "white shirt",
];

interface RouteParams {
  query?: string;
}

// ─── Skeleton Loader ───────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => {
  const colors = useColors();
  return (
    <View style={skeletonStyles.card}>
      <View style={[skeletonStyles.image, { backgroundColor: colors.muted }]} />
      <View style={[skeletonStyles.line, { width: "85%", backgroundColor: colors.muted }]} />
      <View style={[skeletonStyles.line, { width: "55%", backgroundColor: colors.muted }]} />
      <View
        style={[
          skeletonStyles.line,
          skeletonStyles.priceLine,
          { width: "40%", backgroundColor: colors.muted },
        ]}
      />
    </View>
  );
};

const SkeletonGrid: React.FC<{ viewMode: "grid" | "list" }> = ({ viewMode }) => {
  const count = viewMode === "grid" ? 6 : 4;
  return (
    <View style={skeletonStyles.wrapper}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={
            viewMode === "grid"
              ? [styles.gridItem, skeletonStyles.gridSlot]
              : skeletonStyles.listFullItem
          }
        >
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridSlot: {
    minWidth: "47%",
  },
  listFullItem: {
    width: "100%",
    marginBottom: 10,
  },
  card: {
    padding: 4,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    marginBottom: 8,
    opacity: 0.6,
  },
  line: {
    height: 10,
    borderRadius: 4,
    marginBottom: 6,
    opacity: 0.5,
  },
  priceLine: {
    height: 14,
    marginTop: 2,
  },
});

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  const colors = useColors();

  const routeQuery = params.query as string | undefined;

  const {
    allProducts,
    isLoading,
    filters,
    totalPages,
    totalCount,
    error,
    productsData,
  } = useAppSelector((state) => state.products);

  const {
    selectedBrands,
    selectedSizes,
    selectedProductTypes,
    selectedPriceRanges,
    selectedSaleOnly,
    selectedStockStatus,
    selectedDiscountRanges,
    selectedWeights,
    selectedRamOptions,
    selectedColors,
    selectedRatingBands,
    sortType,
    page,
  } = filters;

  // ── UI state ──────────────────────────────────────────────────────────────
  const [sortLabel, setSortLabel] = useState("Best Seller");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setLocalSearchQuery] = useState(routeQuery || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // NEW: page-change loading flag (drives skeleton independently of initial load)
  const [pageChanging, setPageChanging] = useState(false);

  const listRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollY = useRef(0);
  const toolbarAnim = useRef(new Animated.Value(1)).current;
  const isToolbarVisible = useRef(true);
  const searchInputRef = useRef<TextInput>(null);

  // ── Recent searches ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved =
        global.localStorage?.getItem?.("recent_searches_mobile") || "[]";
      const parsed = JSON.parse(saved);
      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 6) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // ── Filters count ─────────────────────────────────────────────────────────
  const activeFiltersCount = useMemo(
    () =>
      selectedBrands.length +
      selectedSizes.length +
      selectedProductTypes.length +
      selectedPriceRanges.length +
      (selectedSaleOnly ? 1 : 0) +
      (selectedStockStatus !== "all" ? 1 : 0) +
      selectedDiscountRanges.length +
      selectedWeights.length +
      selectedRamOptions.length +
      selectedColors.length +
      selectedRatingBands.length,
    [
      selectedBrands,
      selectedSizes,
      selectedProductTypes,
      selectedPriceRanges,
      selectedSaleOnly,
      selectedStockStatus,
      selectedDiscountRanges,
      selectedWeights,
      selectedRamOptions,
      selectedColors,
      selectedRatingBands,
    ],
  );

  // ── Filter pills ─────────────────────────────────────────────────────────
  const filterPills = useMemo(() => {
    const pills: Array<{ label: string; clear: () => void }> = [];
    selectedBrands.forEach((b) =>
      pills.push({
        label: b,
        clear: () =>
          dispatch(setSelectedBrands(selectedBrands.filter((x) => x !== b))),
      }),
    );
    selectedSizes.forEach((s) =>
      pills.push({
        label: `Size: ${s}`,
        clear: () =>
          dispatch(setSelectedSizes(selectedSizes.filter((x) => x !== s))),
      }),
    );
    selectedProductTypes.forEach((t) =>
      pills.push({
        label: t,
        clear: () =>
          dispatch(
            setSelectedProductTypes(
              selectedProductTypes.filter((x) => x !== t),
            ),
          ),
      }),
    );
    selectedColors.forEach((c) =>
      pills.push({
        label: c,
        clear: () =>
          dispatch(setSelectedColors(selectedColors.filter((x) => x !== c))),
      }),
    );
    selectedWeights.forEach((w) =>
      pills.push({
        label: w,
        clear: () =>
          dispatch(setSelectedWeights(selectedWeights.filter((x) => x !== w))),
      }),
    );
    selectedRamOptions.forEach((r) =>
      pills.push({
        label: `RAM: ${r}`,
        clear: () =>
          dispatch(
            setSelectedRamOptions(selectedRamOptions.filter((x) => x !== r)),
          ),
      }),
    );
    selectedPriceRanges.forEach((pr) =>
      pills.push({
        label: pr,
        clear: () =>
          dispatch(
            setSelectedPriceRanges(selectedPriceRanges.filter((x) => x !== pr)),
          ),
      }),
    );
    selectedDiscountRanges.forEach((d) =>
      pills.push({
        label: `${d}% off`,
        clear: () =>
          dispatch(
            setSelectedDiscountRanges(
              selectedDiscountRanges.filter((x) => x !== d),
            ),
          ),
      }),
    );
    selectedRatingBands.forEach((rb) =>
      pills.push({
        label: `★ ${rb}+`,
        clear: () =>
          dispatch(
            setSelectedRatingBands(selectedRatingBands.filter((x) => x !== rb)),
          ),
      }),
    );
    if (selectedSaleOnly)
      pills.push({
        label: "On Sale",
        clear: () => dispatch(setSelectedSaleOnly(false)),
      });
    if (selectedStockStatus !== "all")
      pills.push({
        label: selectedStockStatus === "in" ? "In Stock" : "Out of Stock",
        clear: () => dispatch(setSelectedStockStatus("all")),
      });
    return pills;
  }, [
    selectedBrands,
    selectedSizes,
    selectedProductTypes,
    selectedColors,
    selectedWeights,
    selectedRamOptions,
    selectedPriceRanges,
    selectedDiscountRanges,
    selectedRatingBands,
    selectedSaleOnly,
    selectedStockStatus,
    dispatch,
  ]);

  const handleResetAllFilters = useCallback(
    () => dispatch(resetAllFilters()),
    [dispatch],
  );

  // ── Data fetching ─────────────────────────────────────────────────────────
  const loadProducts = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      dispatch(
        fetchProducts({ searchQuery: routeQuery, filters, append: false }),
      );
    }, 150);
  }, [dispatch, routeQuery, filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // NEW: turn off page-changing skeleton once redux isLoading resolves
  useEffect(() => {
    if (!isLoading && pageChanging) {
      setPageChanging(false);
    }
  }, [isLoading, pageChanging]);

  // ── Scroll hide/show toolbar ──────────────────────────────────────────────
  const onScroll = useCallback(
    (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      const diff = y - lastScrollY.current;
      if (Math.abs(diff) < 8) return;
      const shouldShow = y <= 60 || diff < 0;
      if (shouldShow !== isToolbarVisible.current) {
        isToolbarVisible.current = shouldShow;
        Animated.spring(toolbarAnim, {
          toValue: shouldShow ? 1 : 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      }
      lastScrollY.current = y;
    },
    [toolbarAnim],
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(setPage(1));
    loadProducts();
    setTimeout(() => setRefreshing(false), 800);
  }, [dispatch, loadProducts]);

  const handleSearch = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q) return;
      dispatch(saveRecentSearch(q));
      dispatch(setPage(1));
      setIsSearchFocused(false);
      router.push(`/(tabs)/search?query=${encodeURIComponent(q)}` as never);
    },
    [dispatch, router],
  );

  const handleSortBy = useCallback(
    (sortTypeVal: string, label: string) => {
      dispatch(setSortType(sortTypeVal));
      setSortLabel(label);
      setSortOpen(false);
    },
    [dispatch],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
        setPageChanging(true);
        dispatch(setPage(newPage));
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    },
    [totalPages, dispatch, page],
  );

  // ── Render product ────────────────────────────────────────────────────────
  const renderProduct = useCallback(
    ({ item, index }: any) => {
      if (!item?._id) return null;
      if (viewMode === "list") {
        return (
          <View style={styles.listItem}>
            <ProductItem item={item} />
          </View>
        );
      }
      return (
        <View style={styles.gridItem}>
          <ProductItem item={item} />
        </View>
      );
    },
    [viewMode],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Sub-components
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Search bar (always-visible header) ──────────────────────────────────
  // const SearchBar = useCallback(
  //   () => (
  //     <View
  //       style={[
  //         styles.searchBarWrap,
  //         { backgroundColor: colors.card, borderBottomColor: colors.border },
  //       ]}
  //     >
  //       <TouchableOpacity
  //         style={[
  //           styles.searchBox,
  //           {
  //             backgroundColor: colors.background,
  //             borderColor: isSearchFocused ? "#2563eb" : colors.border,
  //           },
  //         ]}
  //         onPress={() => {
  //           setIsSearchFocused(true);
  //           searchInputRef.current?.focus();
  //         }}
  //         activeOpacity={1}
  //       >
  //         <Feather
  //           name="search"
  //           size={17}
  //           color={isSearchFocused ? "#2563eb" : colors.mutedForeground}
  //         />
  //         <TextInput
  //           ref={searchInputRef}
  //           style={[styles.searchInput, { color: colors.foreground }]}
  //           placeholder="Search products, brands…"
  //           placeholderTextColor={colors.mutedForeground}
  //           value={searchQuery}
  //           onChangeText={setLocalSearchQuery}
  //           onSubmitEditing={() => handleSearch(searchQuery)}
  //           onFocus={() => setIsSearchFocused(true)}
  //           onBlur={() => setIsSearchFocused(false)}
  //           returnKeyType="search"
  //           autoCorrect={false}
  //           autoCapitalize="none"
  //         />
  //         {searchQuery.length > 0 && (
  //           <TouchableOpacity
  //             onPress={() => setLocalSearchQuery("")}
  //             hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  //           >
  //             <Feather
  //               name="x-circle"
  //               size={16}
  //               color={colors.mutedForeground}
  //             />
  //           </TouchableOpacity>
  //         )}
  //       </TouchableOpacity>

  //       {isSearchFocused && (
  //         <TouchableOpacity
  //           onPress={() => {
  //             setIsSearchFocused(false);
  //             searchInputRef.current?.blur();
  //           }}
  //           hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  //           style={styles.cancelBtn}
  //         >
  //           <Text style={[styles.cancelText, { color: "#2563eb" }]}>
  //             Cancel
  //           </Text>
  //         </TouchableOpacity>
  //       )}
  //     </View>
  //   ),
  //   [colors, searchQuery, isSearchFocused, handleSearch],
  // );

  // ── Suggestions overlay (shown when focused and no query yet) ───────────
  const SearchSuggestions = useCallback(() => {
    if (!isSearchFocused) return null;
    return (
      <View
        style={[
          styles.suggestionsPanel,
          { backgroundColor: colors.background },
        ]}
      >
        {/* Recent */}
        {recentSearches.length > 0 && (
          <View style={styles.suggestionSection}>
            <View style={styles.suggestionHeader}>
              <Text
                style={[
                  styles.suggestionTitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Recent
              </Text>
              <TouchableOpacity onPress={() => setRecentSearches([])}>
                <Text style={[styles.suggestionAction, { color: "#2563eb" }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionRow}
                onPress={() => {
                  setLocalSearchQuery(item);
                  handleSearch(item);
                }}
                activeOpacity={0.6}
              >
                <Feather
                  name="clock"
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.suggestionText, { color: colors.foreground }]}
                >
                  {item}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setRecentSearches((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    )
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={12} color={colors.mutedForeground} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Trending */}
        <View style={styles.suggestionSection}>
          <Text
            style={[styles.suggestionTitle, { color: colors.mutedForeground }]}
          >
            Trending
          </Text>
          <View style={styles.chipRow}>
            {TRENDING_SEARCHES.map((term, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chip, { backgroundColor: colors.muted }]}
                onPress={() => {
                  setLocalSearchQuery(term);
                  handleSearch(term);
                }}
                activeOpacity={0.7}
              >
                <Feather name="trending-up" size={11} color="#2563eb" />
                <Text style={[styles.chipText, { color: colors.foreground }]}>
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Most searched */}
        <View style={styles.suggestionSection}>
          <Text
            style={[styles.suggestionTitle, { color: colors.mutedForeground }]}
          >
            Popular
          </Text>
          {MOST_SEARCHED.map((term, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionRow}
              onPress={() => {
                setLocalSearchQuery(term);
                handleSearch(term);
              }}
              activeOpacity={0.6}
            >
              <Feather name="search" size={13} color={colors.mutedForeground} />
              <Text
                style={[styles.suggestionText, { color: colors.foreground }]}
              >
                {term}
              </Text>
              <Feather
                name="arrow-up-left"
                size={13}
                color={colors.mutedForeground}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [isSearchFocused, recentSearches, colors, handleSearch]);

  // ── Toolbar (filters + sort + view) ──────────────────────────────────────
  const Toolbar = useCallback(
    () => (
      <Animated.View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: toolbarAnim,
            transform: [
              {
                translateY: toolbarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.toolbarRow}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={15}
              color="#fff"
            />
            <Text style={styles.filterBtnText}>Filters</Text>
            {activeFiltersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.toolbarRight}>
            <View style={[styles.viewToggle, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  viewMode === "grid" && styles.viewBtnActive,
                ]}
                onPress={() => setViewMode("grid")}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 3 }}
              >
                <MaterialCommunityIcons
                  name="view-grid-outline"
                  size={15}
                  color={viewMode === "grid" ? "#fff" : colors.mutedForeground}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  viewMode === "list" && styles.viewBtnActive,
                ]}
                onPress={() => setViewMode("list")}
                hitSlop={{ top: 6, bottom: 6, left: 3, right: 6 }}
              >
                <MaterialCommunityIcons
                  name="view-agenda-outline"
                  size={15}
                  color={viewMode === "list" ? "#fff" : colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.sortBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              onPress={() => setSortOpen(true)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name="sort"
                size={14}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.sortLabel, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {sortLabel}
              </Text>
              <Ionicons
                name="chevron-down"
                size={13}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>

        {filterPills.length > 0 && (
          <View
            style={[styles.pillsSection, { borderTopColor: colors.border }]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsScroll}
            >
              <TouchableOpacity
                style={styles.pillClear}
                onPress={handleResetAllFilters}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={12} color="#E8362A" />
                <Text style={styles.pillClearText}>Clear all</Text>
              </TouchableOpacity>
              {filterPills.map((pill, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.pill, { backgroundColor: colors.muted }]}
                  onPress={pill.clear}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, { color: colors.foreground }]}>
                    {pill.label}
                  </Text>
                  <Feather
                    name="x"
                    size={10}
                    color={colors.mutedForeground}
                    style={{ marginLeft: 3 }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.View>
    ),
    [colors, toolbarAnim, activeFiltersCount, viewMode, sortLabel, filterPills],
  );

  // ── List header ───────────────────────────────────────────────────────────
  const ListHeader = useCallback(() => {
    if (isSearchFocused) return null;
    return (
      <View style={styles.listHeaderWrap}>
        {routeQuery && !isLoading && (
          <View style={styles.metaSection}>
            <Text
              style={[styles.queryLabel, { color: colors.foreground }]}
              numberOfLines={1}
            >
              Results for{" "}
              <Text style={styles.queryKeyword}>"{routeQuery}"</Text>
            </Text>
            {totalCount > 0 && (
              <Text
                style={[styles.resultCount, { color: colors.mutedForeground }]}
              >
                {totalCount.toLocaleString()} products · page {page}/
                {totalPages}
              </Text>
            )}
          </View>
        )}
        <Toolbar />
      </View>
    );
  }, [
    isSearchFocused,
    routeQuery,
    isLoading,
    colors,
    totalCount,
    page,
    totalPages,
    Toolbar,
  ]);

  // ── Empty state ───────────────────────────────────────────────────────────
  const ListEmpty = useCallback(() => {
    if (isSearchFocused) return null;
    if (!routeQuery) {
      return (
        <View style={styles.emptyState}>
          <View
            style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}
          >
            <Feather name="search" size={34} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Search for products
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Tap the search bar above and start typing
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}>
          <MaterialCommunityIcons
            name="package-variant-closed-remove"
            size={34}
            color={colors.mutedForeground}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          {error ? "Something went wrong" : "No results found"}
        </Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
          {error ||
            `No products found for "${routeQuery}". Try different keywords.`}
        </Text>
        {(activeFiltersCount > 0 || error) && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetAllFilters}
            activeOpacity={0.8}
          >
            <Text style={styles.resetBtnText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isSearchFocused, routeQuery, colors, error, activeFiltersCount]);

  // ── Pagination footer ─────────────────────────────────────────────────────
  const showSkeleton = (isLoading && page === 1) || pageChanging;

  const ListFooter = useCallback(() => {
    if (
      !allProducts.length ||
      totalPages <= 1 ||
      isSearchFocused ||
      showSkeleton
    )
      return null;
    const progress = page / totalPages;
    return (
      <View style={styles.paginationWrapper}>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` as any },
            ]}
          />
        </View>
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[
              styles.pagBtn,
              (page === 1 || isLoading) && styles.pagBtnDisabled,
            ]}
            onPress={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={page === 1 || isLoading ? colors.mutedForeground : "#2563eb"}
            />
            <Text
              style={[
                styles.pagBtnText,
                (page === 1 || isLoading) && { color: colors.mutedForeground },
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>
          <View
            style={[
              styles.pageIndicator,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <>
                <Text style={[styles.pageNum, { color: colors.foreground }]}>
                  <Text style={{ color: "#2563eb" }}>{page}</Text>
                  <Text style={{ color: colors.mutedForeground }}>
                    {" "}
                    / {totalPages}
                  </Text>
                </Text>
                <Text
                  style={[
                    styles.pageSubtext,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {Math.min(page * 20, totalCount)} of {totalCount}
                </Text>
              </>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.pagBtn,
              (page >= totalPages || isLoading) && styles.pagBtnDisabled,
            ]}
            onPress={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pagBtnText,
                (page >= totalPages || isLoading) && {
                  color: colors.mutedForeground,
                },
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={
                page >= totalPages || isLoading
                  ? colors.mutedForeground
                  : "#2563eb"
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    page,
    totalPages,
    allProducts.length,
    totalCount,
    colors,
    isSearchFocused,
    handlePageChange,
    isLoading,
    showSkeleton,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Dispatch helpers
  // ─────────────────────────────────────────────────────────────────────────
  const d = useCallback(
    <T,>(setter: (v: T) => any, current: T) =>
      (v: T | ((prev: T) => T)) => {
        const next =
          typeof v === "function" ? (v as (prev: T) => T)(current) : v;
        dispatch(setter(next));
      },
    [dispatch],
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Persistent search bar */}
      {/* <SearchBar /> */}

      {/* Suggestions overlay */}
      <SearchSuggestions />

      {/* Product list */}
      {!isSearchFocused && (
        <FlatList
          ref={listRef}
          data={showSkeleton ? [] : allProducts}
          keyExtractor={(item, i) => item?._id || String(i)}
          numColumns={viewMode === "grid" ? 2 : 1}
          key={viewMode}
          columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
          contentContainerStyle={[styles.listContent, { paddingBottom: 32 }]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            showSkeleton ? (
              <SkeletonGrid viewMode={viewMode} />
            ) : (
              <ListEmpty />
            )
          }
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#2563eb"
              colors={["#2563eb"]}
            />
          }
          renderItem={renderProduct}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
        />
      )}

      <FilterBottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        selectedBrands={selectedBrands}
        setSelectedBrands={d(setSelectedBrands, selectedBrands)}
        selectedSizes={selectedSizes}
        setSelectedSizes={d(setSelectedSizes, selectedSizes)}
        selectedProductTypes={selectedProductTypes}
        setSelectedProductTypes={d(
          setSelectedProductTypes,
          selectedProductTypes,
        )}
        selectedPriceRanges={selectedPriceRanges}
        setSelectedPriceRanges={d(setSelectedPriceRanges, selectedPriceRanges)}
        selectedSaleOnly={selectedSaleOnly}
        setSelectedSaleOnly={d(setSelectedSaleOnly, selectedSaleOnly)}
        selectedStockStatus={selectedStockStatus}
        setSelectedStockStatus={d(setSelectedStockStatus, selectedStockStatus)}
        selectedDiscountRanges={selectedDiscountRanges}
        setSelectedDiscountRanges={d(
          setSelectedDiscountRanges,
          selectedDiscountRanges,
        )}
        selectedWeights={selectedWeights}
        setSelectedWeights={d(setSelectedWeights, selectedWeights)}
        selectedRamOptions={selectedRamOptions}
        setSelectedRamOptions={d(setSelectedRamOptions, selectedRamOptions)}
        selectedColors={selectedColors}
        setSelectedColors={d(setSelectedColors, selectedColors)}
        selectedRatingBands={selectedRatingBands}
        setSelectedRatingBands={d(setSelectedRatingBands, selectedRatingBands)}
        activeFiltersCount={activeFiltersCount}
        onResetAllFilters={handleResetAllFilters}
        productsData={productsData}
      />

      <SortModal
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        selectedSortType={sortType}
        onSelect={handleSortBy}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Search bar
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  cancelBtn: {
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  // Suggestions
  suggestionsPanel: {
    flex: 1,
    paddingTop: 6,
  },
  suggestionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  suggestionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  suggestionAction: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  // List layout
  listContent: { paddingHorizontal: 14, paddingTop: 14 },
  listHeaderWrap: { marginBottom: 14 },
  gridRow: { gap: 10, marginBottom: 10 },
  gridItem: { flex: 1 },
  listItem: { marginBottom: 10 },

  // Meta
  metaSection: { marginBottom: 10, paddingHorizontal: 2 },
  queryLabel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  queryKeyword: { color: "#ff6b2b", fontFamily: "Inter_700Bold" },
  resultCount: { fontSize: 11, fontFamily: "Inter_400Regular" },

  // Toolbar
  toolbar: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  toolbarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#111827",
  },
  filterBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  toolbarRight: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  viewToggle: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9,
    overflow: "hidden",
  },
  viewBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnActive: { backgroundColor: "#111827" },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
  sortLabel: { fontSize: 11, fontFamily: "Inter_500Medium", flex: 1 },

  // Pills
  pillsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginHorizontal: -12,
  },
  pillsScroll: {
    paddingHorizontal: 12,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  pillClear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
  },
  pillClearText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#E8362A",
  },

  // Empty / loading
  emptyState: {
    alignItems: "center",
    paddingVertical: 72,
    paddingHorizontal: 28,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  resetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#111827",
  },
  resetBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  loadingContainer: { alignItems: "center", paddingVertical: 80, gap: 12 },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  // Pagination
  paginationWrapper: {
    paddingHorizontal: 4,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
  },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 2 },
  paginationRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pagBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  pagBtnDisabled: {
    opacity: 0.38,
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  pagBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#2563eb",
  },
  pageIndicator: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pageNum: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pageSubtext: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
});