import { useColors } from "@/hooks/useColors";
import FilterBottomSheet from "@/src/components/Filterbottomsheet";
import { ProductItem } from "@/src/components/ProductItem";
import SortModal from "@/src/components/Sortmodal";
import {
  fetchProducts,
  goToPage,
  nextPage,
  previousPage,
  setPage,
  setSortType,
  useAppDispatch,
  useAppSelector,
} from "@/src/store";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface Product {
  _id?: string;
  name?: string;
  images?: string[];
  price?: number;
  oldPrice?: number;
  discount?: number;
  brand?: string;
  rating?: number;
  countInStock?: number;
}

const SORT_OPTIONS = [
  { value: "bestseller", label: "🏆 Best Seller" },
  { value: "latest", label: "🆕 Latest" },
  { value: "popular", label: "⭐ Most Popular" },
  { value: "priceAsc", label: "💰 Price: Low → High" },
  { value: "priceDesc", label: "💰 Price: High → Low" },
];

// ---------- Skeleton Loader ----------
const SkeletonCard: React.FC = () => {
  const colors = useColors();
  return (
    <View style={[styles.gridItem, skeletonStyles.card]}>
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
          style={[
            viewMode === "grid" ? styles.gridItem : skeletonStyles.listFullItem,
            i % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight,
          ]}
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
    paddingHorizontal: 0,
  },
  card: {
    padding: 4,
  },
  listFullItem: {
    width: "100%",
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
// ---------- End Skeleton Loader ----------

const ProductListingPage: React.FC = () => {
  const colors = useColors();
  const params = useLocalSearchParams();
  const dispatch = useAppDispatch();

  const catId = params.catId
    ? Array.isArray(params.catId)
      ? params.catId[0]
      : params.catId
    : "";
  const subCatId = params.subCatId
    ? Array.isArray(params.subCatId)
      ? params.subCatId[0]
      : params.subCatId
    : "";
  const categoryName = params.categoryName
    ? Array.isArray(params.categoryName)
      ? params.categoryName[0]
      : params.categoryName
    : "All Products";

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(
    [],
  );
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedSaleOnly, setSelectedSaleOnly] = useState(false);
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [selectedDiscountRanges, setSelectedDiscountRanges] = useState<
    number[]
  >([]);
  const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
  const [selectedRamOptions, setSelectedRamOptions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedRatingBands, setSelectedRatingBands] = useState<number[]>([]);

  // Redux selectors for pagination & products
  const {
    productsData,
    isLoading,
    isRefreshing,
    totalPages,
    totalCount: reduxTotalCount,
    filters,
  } = useAppSelector((state) => state.products);
  const page = filters.page;
  const sortType = filters.sortType;
  const totalCount = reduxTotalCount || 0;

  const [sortLabel, setSortLabel] = useState("🏆 Best Seller");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const { width: screenWidth } = useWindowDimensions();

  // NEW: local flag for page-change loading (independent of initial isLoading logic)
  const [pageChanging, setPageChanging] = useState(false);

  const scrollViewRef = useRef<FlatList>(null);
  const lastScrollY = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const filterPills = useMemo(() => {
    const pills: Array<{ label: string; clear: () => void }> = [];
    selectedBrands.forEach((b) =>
      pills.push({
        label: b,
        clear: () => setSelectedBrands(selectedBrands.filter((x) => x !== b)),
      }),
    );
    selectedSizes.forEach((s) =>
      pills.push({
        label: `Size: ${s}`,
        clear: () => setSelectedSizes(selectedSizes.filter((x) => x !== s)),
      }),
    );
    selectedProductTypes.forEach((t) =>
      pills.push({
        label: t,
        clear: () =>
          setSelectedProductTypes(selectedProductTypes.filter((x) => x !== t)),
      }),
    );
    selectedColors.forEach((c) =>
      pills.push({
        label: c,
        clear: () => setSelectedColors(selectedColors.filter((x) => x !== c)),
      }),
    );
    selectedWeights.forEach((w) =>
      pills.push({
        label: w,
        clear: () => setSelectedWeights(selectedWeights.filter((x) => x !== w)),
      }),
    );
    selectedRamOptions.forEach((r) =>
      pills.push({
        label: `RAM: ${r}`,
        clear: () =>
          setSelectedRamOptions(selectedRamOptions.filter((x) => x !== r)),
      }),
    );
    selectedPriceRanges.forEach((pr) =>
      pills.push({
        label: pr,
        clear: () =>
          setSelectedPriceRanges(selectedPriceRanges.filter((x) => x !== pr)),
      }),
    );
    selectedDiscountRanges.forEach((d) =>
      pills.push({
        label: `${d}% off`,
        clear: () =>
          setSelectedDiscountRanges(
            selectedDiscountRanges.filter((x) => x !== d),
          ),
      }),
    );
    selectedRatingBands.forEach((rb) =>
      pills.push({
        label: `★ ${rb}+`,
        clear: () =>
          setSelectedRatingBands(selectedRatingBands.filter((x) => x !== rb)),
      }),
    );
    if (selectedSaleOnly)
      pills.push({
        label: "On Sale",
        clear: () => setSelectedSaleOnly(false),
      });
    if (selectedStockStatus !== "all")
      pills.push({
        label: selectedStockStatus === "in" ? "In Stock" : "Out of Stock",
        clear: () => setSelectedStockStatus("all"),
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
  ]);

  const resetAllFilters = useCallback(() => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedProductTypes([]);
    setSelectedPriceRanges([]);
    setSelectedSaleOnly(false);
    setSelectedStockStatus("all");
    setSelectedDiscountRanges([]);
    setSelectedWeights([]);
    setSelectedRamOptions([]);
    setSelectedColors([]);
    setSelectedRatingBands([]);
    dispatch(setPage(1));
  }, [dispatch]);

  // Fetch products with Redux dispatch
  const handleFetchProducts = useCallback(
    (pageNum?: number) => {
      dispatch(
        fetchProducts({
          catId,
          subCatId,
          filters: {
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
            page: pageNum ?? page,
          },
        }) as any,
      );
    },
    [
      dispatch,
      catId,
      subCatId,
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
    ],
  );

  // Fetch on filter/sort changes
  useEffect(() => {
    handleFetchProducts(1);
  }, [
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
    catId,
    subCatId,
  ]);

  // Fetch on page change
  useEffect(() => {
    handleFetchProducts();
  }, [page]);

  // NEW: turn off page-changing skeleton once redux isLoading resolves
  useEffect(() => {
    if (!isLoading && pageChanging) {
      setPageChanging(false);
    }
  }, [isLoading, pageChanging]);

  const onScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;

    if (Math.abs(diff) < 5) return;

    if (y <= 90) {
      setToolbarVisible(true);
    } else {
      setToolbarVisible(diff < 0);
    }

    lastScrollY.current = y;
  }, []);

  const handleRefresh = useCallback(() => {
    dispatch(setPage(1));
    handleFetchProducts(1);
  }, [dispatch, handleFetchProducts]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
        setPageChanging(true);
        dispatch(goToPage(newPage));
        scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    },
    [totalPages, dispatch, page],
  );

  const handlePrevPage = useCallback(() => {
    if (page <= 1) return;
    setPageChanging(true);
    dispatch(previousPage());
    scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [dispatch, page]);

  const handleNextPage = useCallback(() => {
    if (page >= totalPages) return;
    setPageChanging(true);
    dispatch(nextPage());
    scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [dispatch, page, totalPages]);

  const handleSortBy = useCallback((sortTypeVal: string, label: string) => {setSortLabel(label);setSortOpen(false);dispatch(setSortType(sortTypeVal));dispatch(setPage(1));}, [dispatch],);

  const products = productsData?.products || [];

  // Show skeleton when: initial page-1 load OR a page-change is in flight
  const showSkeleton = (isLoading && page === 1) || pageChanging;

  // Generate page numbers for dynamic pagination
  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    const maxVisible = Math.min(
      totalPages,
      screenWidth < 360 ? 3 : screenWidth < 420 ? 5 : 7,
    );
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, page - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  }, [page, totalPages, screenWidth]);

  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      if (!item?._id) return null;
      return (
        <View
          style={[
            styles.gridItem,
            index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight,
          ]}
        >
          <ProductItem item={item} />
        </View>
      );
    },
    [],
  );

  const ListHeader = useCallback(
    () => (
      <>
        <View style={styles.metaSection}>
          <Text style={[styles.titleLabel, { color: colors.foreground }]}>
            {categoryName}
          </Text>
          {totalCount > 0 && (
            <Text
              style={[styles.resultCount, { color: colors.mutedForeground }]}
            >
              {totalCount} products
            </Text>
          )}
        </View>

        {toolbarVisible && (
          <View
            style={[
              styles.toolbar,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.toolbarRow}>
              <TouchableOpacity
                style={[styles.filterBtn, { backgroundColor: "#0d0d12" }]}
                onPress={() => setFilterOpen(true)}
              >
                <MaterialCommunityIcons name="tune" size={16} color="#fff" />
                <Text style={styles.filterBtnText}>Filters</Text>
                {activeFiltersCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: "#E8362A" }]}>
                    <Text style={styles.badgeText}>{activeFiltersCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.toolbarRight}>
                <View style={styles.viewToggle}>
                  <TouchableOpacity
                    style={[
                      styles.viewBtn,
                      viewMode === "grid" && styles.viewBtnActive,
                    ]}
                    onPress={() => setViewMode("grid")}
                  >
                    <MaterialCommunityIcons
                      name="view-grid"
                      size={16}
                      color={
                        viewMode === "grid" ? "#fff" : colors.mutedForeground
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.viewBtn,
                      viewMode === "list" && styles.viewBtnActive,
                    ]}
                    onPress={() => setViewMode("list")}
                  >
                    <MaterialCommunityIcons
                      name="view-list"
                      size={16}
                      color={
                        viewMode === "list" ? "#fff" : colors.mutedForeground
                      }
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.sortBtn, { borderColor: colors.border }]}
                  onPress={() => setSortOpen(true)}
                >
                  <Text
                    style={[
                      styles.sortLabel,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {sortLabel}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {filterPills.length > 0 && (
              <View style={styles.pillsSection}>
                <View style={styles.pillsMeta}>
                  <Text
                    style={[
                      styles.pillsMetaText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {filterPills.length} filter
                    {filterPills.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.pillsRow}>
                  {filterPills.map((pill, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.pill, { backgroundColor: colors.muted }]}
                      onPress={pill.clear}
                    >
                      <Text
                        style={[styles.pillText, { color: colors.foreground }]}
                      >
                        {pill.label}
                      </Text>
                      <Feather
                        name="x"
                        size={12}
                        color={colors.mutedForeground}
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.pill, styles.pillClear]}
                    onPress={resetAllFilters}
                  >
                    <Text style={styles.pillClearText}>Clear all</Text>
                    <Feather
                      name="x"
                      size={12}
                      color="#E8362A"
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </>
    ),
    [
      colors,
      categoryName,
      totalCount,
      toolbarVisible,
      activeFiltersCount,
      viewMode,
      sortLabel,
      filterPills,
    ],
  );

  const ListEmpty = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>😕</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No Products Found
        </Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
          Try adjusting your filters or sorting options.
        </Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: "#0d0d12" }]}
            onPress={resetAllFilters}
          >
            <Ionicons name="close" size={14} color="#fff" />
            <Text style={styles.resetBtnText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [colors, activeFiltersCount],
  );

  const ListFooter = useCallback(() => {
    if (!products.length || totalPages <= 1 || showSkeleton) return null;

    const pageNumbers = getPageNumbers();

    return (
      <View style={styles.paginationWrapper}>
        {/* Previous/Next + Page Info */}
        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[
              styles.pagBtn,
              (page === 1 || isLoading) && styles.pagBtnDisabled,
            ]}
            onPress={handlePrevPage}
            disabled={page === 1 || isLoading}
            activeOpacity={page === 1 || isLoading ? 1 : 0.7}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={page === 1 || isLoading ? "#d1d5db" : "#2563eb"}
            />
            <Text
              style={[
                styles.pagBtnText,
                (page === 1 || isLoading) && styles.pagBtnTextDisabled,
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          <View style={styles.pageCountInfo}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.pageCountText}>
                {Math.min(page * 20, totalCount)} of {totalCount}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.pagBtn,
              (page >= totalPages || isLoading) && styles.pagBtnDisabled,
            ]}
            onPress={handleNextPage}
            disabled={page >= totalPages || isLoading}
            activeOpacity={page >= totalPages || isLoading ? 1 : 0.7}
          >
            <Text
              style={[
                styles.pagBtnText,
                (page >= totalPages || isLoading) && styles.pagBtnTextDisabled,
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={page >= totalPages || isLoading ? "#d1d5db" : "#2563eb"}
            />
          </TouchableOpacity>
        </View>

        {/* Dynamic Page Numbers */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pageNumbersScroll}
        >
          {pageNumbers.map((num, idx) => {
            const pageSize = screenWidth < 360 ? 30 : screenWidth < 420 ? 34 : 36;
            const pageFont = screenWidth < 360 ? 11 : 12;
            return (
              <View key={idx}>
                {num === "..." ? (
                  <View style={[styles.pageEllipsis, { width: pageSize, height: pageSize }]}> 
                    <Text style={styles.pageEllipsisText}>...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.pageNumber,
                      num === page && styles.pageNumberActive,
                      { width: pageSize, height: pageSize, borderRadius: pageSize / 2 },
                    ]}
                    onPress={() => handlePageChange(num as number)}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.pageNumberText,
                        num === page && styles.pageNumberTextActive,
                        { fontSize: pageFont },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(page / totalPages) * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    );
  }, [
    page,
    totalPages,
    products.length,
    totalCount,
    handlePageChange,
    getPageNumbers,
    isLoading,
    showSkeleton,
    colors,
    handlePrevPage,
    handleNextPage,
  ]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <FlatList
        ref={scrollViewRef}
        data={showSkeleton ? [] : products}
        keyExtractor={(item, i) => item?._id?.toString() || `product-${i}`}
        numColumns={viewMode === "grid" ? 2 : 1}
        key={viewMode}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
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
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={renderProduct}
      />

      <FilterBottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        selectedBrands={selectedBrands}
        setSelectedBrands={setSelectedBrands}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        selectedProductTypes={selectedProductTypes}
        setSelectedProductTypes={setSelectedProductTypes}
        selectedPriceRanges={selectedPriceRanges}
        setSelectedPriceRanges={setSelectedPriceRanges}
        selectedSaleOnly={selectedSaleOnly}
        setSelectedSaleOnly={setSelectedSaleOnly}
        selectedStockStatus={selectedStockStatus}
        setSelectedStockStatus={setSelectedStockStatus}
        selectedDiscountRanges={selectedDiscountRanges}
        setSelectedDiscountRanges={setSelectedDiscountRanges}
        selectedWeights={selectedWeights}
        setSelectedWeights={setSelectedWeights}
        selectedRamOptions={selectedRamOptions}
        setSelectedRamOptions={setSelectedRamOptions}
        selectedColors={selectedColors}
        setSelectedColors={setSelectedColors}
        selectedRatingBands={selectedRatingBands}
        setSelectedRatingBands={setSelectedRatingBands}
        activeFiltersCount={activeFiltersCount}
        onResetAllFilters={resetAllFilters}
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
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  gridRow: {
    gap: 12,
    marginBottom: 8,
  },
  gridItem: {
    flex: 1,
  },
  gridItemLeft: {
    marginRight: 6,
  },
  gridItemRight: {
    marginLeft: 6,
  },
  metaSection: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  titleLabel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  toolbar: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "Inter_700Bold",
  },
  toolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  viewToggle: {
    flexDirection: "row",
    gap: 4,
  },
  viewBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e8e8f0",
  },
  viewBtnActive: {
    backgroundColor: "#0d0d12",
    borderColor: "#0d0d12",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  sortLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  pillsSection: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
  },
  pillsMeta: {
    marginBottom: 8,
  },
  pillsMetaText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pillText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  pillClear: {
    backgroundColor: "#fff0f0",
  },
  pillClearText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#E8362A",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 10,
  },
  resetBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  paginationWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 20,
    gap: 12,
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pagBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
  },
  pagBtnDisabled: {
    opacity: 0.4,
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  pagBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#2563eb",
  },
  pagBtnTextDisabled: {
    color: "#9ca3af",
  },
  pageCountInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  pageCountText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#374151",
  },
  pageNumbersScroll: {
    gap: 6,
    paddingHorizontal: 2,
  },
  pageNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pageNumberActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  pageNumberText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#374151",
  },
  pageNumberTextActive: {
    color: "#fff",
  },
  pageEllipsis: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pageEllipsisText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
  },
});

export default ProductListingPage;