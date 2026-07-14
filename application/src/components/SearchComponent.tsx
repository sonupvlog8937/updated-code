import { useColors } from "@/hooks/useColors";
import {
    clearSearchQuery,
    fetchSearchDefaults,
    fetchSearchSuggestions,
    loadRecentSearches,
    performSearch,
    saveRecentSearch,
    setIsDropdownOpen,
    setSearchQuery,
    useAppDispatch,
    useAppSelector,
    deleteRecentSearch,
    clearAllRecentSearches,
} from "@/src/store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
    Image,
    TouchableOpacity,
    Platform,
} from "react-native";

interface SearchComponentProps {
  showSearchBox?: boolean;
}

export default function SearchComponent(_props: SearchComponentProps) {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const inputRef = useRef<TextInput>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    search: searchQuery,
    suggestions,
    products: suggestedProducts,
    recentSearches,
    topSearches,
    trending,
    categories,
    brands,
    popularCategories,
    popularBrands,
    suggestionsLoading,
    isDropdownOpen,
  } = useAppSelector((state) => state.search);

  const recentKeywords = React.useMemo(
    () =>
      recentSearches
        .map((r) => (typeof r === "string" ? r : r.keyword))
        .filter(Boolean)
        .slice(0, 8),
    [recentSearches],
  );

  useEffect(() => {
    if (isDropdownOpen) {
      dispatch(loadRecentSearches());
      dispatch(fetchSearchDefaults());
    }
  }, [isDropdownOpen, dispatch]);

 useEffect(() => {
  if (debounceTimeoutRef.current) {
    clearTimeout(debounceTimeoutRef.current);
  }

  const q = searchQuery.trim();

  if (q.length < 1) {
    return;
  }

  debounceTimeoutRef.current = setTimeout(() => {
    dispatch(fetchSearchSuggestions(q));
  }, 150);

  return () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };
}, [searchQuery, dispatch]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    dispatch(setIsDropdownOpen(false));
    Keyboard.dismiss();
    dispatch(saveRecentSearch(searchQuery));
    dispatch(performSearch({ query: searchQuery, page: 1, limit: 20 }) as any);
    router.push(
      `/search?query=${encodeURIComponent(searchQuery)}` as never,
    );
  }, [searchQuery, dispatch, router]);

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      dispatch(setIsDropdownOpen(false));
      Keyboard.dismiss();
      dispatch(setSearchQuery(suggestion));
      dispatch(saveRecentSearch(suggestion));
      dispatch(performSearch({ query: suggestion, page: 1, limit: 20 }) as any);
      router.push(
        `/search?query=${encodeURIComponent(suggestion)}` as never,
      );
    },
    [dispatch, router],
  );

  const handleClearSearch = useCallback(() => {
    dispatch(clearSearchQuery());
    inputRef.current?.focus();
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    dispatch(setIsDropdownOpen(false));
    Keyboard.dismiss();
  }, [dispatch]);

  const typeaheadSuggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return suggestions.slice(0, 10);
  }, [searchQuery, suggestions]);

  const hasLiveSuggestions =
    typeaheadSuggestions.length > 0 ||
    suggestedProducts.length > 0 ||
    brands.length > 0 ||
    categories.length > 0;

  const isSearching = searchQuery.trim().length > 0;
  const shouldShowLiveSuggestions = isSearching && (hasLiveSuggestions || suggestionsLoading);

  return (
    <>
      {/* Restaurant-Style Full-Screen Search Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={false}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleCloseModal}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header with Back + Search Box */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
                paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 50,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={handleCloseModal}
                hitSlop={12}
                style={[styles.backBtn, { backgroundColor: colors.muted }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.backBtnText, { color: colors.foreground }]}>←</Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  ref={inputRef}
                  placeholder="Search products, brands..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchQuery}
                  onChangeText={(text) => dispatch(setSearchQuery(text))}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoFocus={true}
                  style={[styles.input, { color: colors.foreground }]}
                />
                {isSearching && (
                  <TouchableOpacity onPress={handleClearSearch} hitSlop={8} activeOpacity={0.7}>
                    <View style={[styles.clearBtn, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.clearBtnText, { color: colors.mutedForeground }]}>✕</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {shouldShowLiveSuggestions ? (
              <>
                {/* Loading State */}
                {suggestionsLoading && (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                      Searching…
                    </Text>
                  </View>
                )}

                {/* No Results */}
                {!suggestionsLoading && !hasLiveSuggestions && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🔍</Text>
                    <Text style={[styles.emptyText, { color: colors.foreground }]}>
                      No results found
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                      Try a different search term
                    </Text>
                  </View>
                )}

                {/* Suggestions */}
                {!suggestionsLoading && typeaheadSuggestions.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={[styles.sectionIconBox, { backgroundColor: `${colors.primary}15` }]}>
                        <Ionicons name="search" size={11} color={colors.primary} />
                      </View>
                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                        SUGGESTIONS
                      </Text>
                    </View>
                    <View style={styles.suggestionsList}>
                      {typeaheadSuggestions.map((item, idx) => (
                        <TouchableOpacity
                          key={`${item}-${idx}`}
                          style={styles.suggestionRow}
                          onPress={() => handleSelectSuggestion(item)}
                          activeOpacity={0.6}
                        >
                          <Feather name="search" size={14} color={colors.mutedForeground} />
                          <Text style={[styles.suggestionText, { color: colors.foreground }]} numberOfLines={1}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Suggested Products */}
                {!suggestionsLoading && suggestedProducts.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={[styles.sectionIconBox, { backgroundColor: `${colors.primary}15` }]}>
                        <Text style={styles.sectionIconText}>✨</Text>
                      </View>
                      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                        Suggested Products
                      </Text>
                    </View>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingRight: 16 }}
                    >
                      {suggestedProducts.slice(0, 6).map((product) => (
                        <TouchableOpacity
                          key={product._id || product.name}
                          style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                          onPress={() => {
                            dispatch(setIsDropdownOpen(false));
                            router.push(`/product/${product._id}` as never);
                          }}
                          activeOpacity={0.8}
                        >
                          {product.image ? (
                            <Image source={{ uri: product.image }} style={[styles.productImage, { backgroundColor: colors.muted }]} />
                          ) : (
                            <View style={[styles.productImage, { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
                              <Text style={styles.productImagePlaceholder}>🛍️</Text>
                            </View>
                          )}
                          <View style={styles.productInfo}>
                            <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>
                              {product.name}
                            </Text>
                            <Text style={[styles.productPrice, { color: colors.primary }]}>₹{product.price}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Empty State */}
                {recentKeywords.length === 0 && trending.length === 0 && topSearches.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🛍️</Text>
                    <Text style={[styles.emptyText, { color: colors.foreground }]}>
                      Find what you need
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                      Start typing to search
                    </Text>
                  </View>
                )}

                {/* Recent Searches */}
                {recentKeywords.length > 0 && (
                  <View style={styles.section}>
                    <View style={[styles.sectionHeader, { marginBottom: 14 }]}>
                      <View style={[styles.sectionIconBox, { backgroundColor: "#DBEAFE" }]}>
                        <Ionicons name="time" size={11} color="#2563EB" />
                      </View>
                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                        RECENT
                      </Text>
                    </View>
                    <View style={styles.chipRow}>
                      {recentKeywords.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={styles.chip}
                          onPress={() => handleSelectSuggestion(item)}
                          activeOpacity={0.72}
                        >
                          <Ionicons name="time-outline" size={11} color="#2563EB" />
                          <Text style={styles.chipText} numberOfLines={1}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={[styles.sep, { backgroundColor: colors.border }]} />
                  </View>
                )}

                {/* Trending */}
                {(trending.length > 0 || topSearches.length > 0) && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={[styles.sectionIconBox, { backgroundColor: "#FEE2E2" }]}>
                        <Feather name="trending-up" size={11} color="#DC2626" />
                      </View>
                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                        TRENDING
                      </Text>
                    </View>
                    <View style={styles.trendingList}>
                      {(trending.length ? trending : topSearches).slice(0, 8).map((item, idx) => (
                        <TouchableOpacity
                          key={item}
                          style={[styles.trendingRow, { backgroundColor: colors.card }]}
                          onPress={() => handleSelectSuggestion(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.trendingRank}>{String(idx + 1).padStart(2, "0")}</Text>
                          <View style={styles.trendingIconBox}>
                            <Text style={styles.trendingEmoji}>🔥</Text>
                          </View>
                          <Text style={[styles.trendingLabel, { color: colors.foreground }]}>
                            {item}
                          </Text>
                          <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={[styles.sep, { backgroundColor: colors.border }]} />
                  </View>
                )}

                {/* Popular Categories */}
                {popularCategories.length > 0 && (
                  <View style={styles.section}>
                    <View style={[styles.sectionHeader, { marginBottom: 14 }]}>
                      <View style={[styles.sectionIconBox, { backgroundColor: "#F3E8FF" }]}>
                        <Feather name="star" size={11} color="#9333EA" />
                      </View>
                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                        POPULAR CATEGORIES
                      </Text>
                    </View>
                    <View style={styles.chipRow}>
                      {popularCategories.slice(0, 8).map((cat) => (
                        <TouchableOpacity
                          key={cat._id || cat.name}
                          style={styles.popularChip}
                          onPress={() => handleSelectSuggestion(cat.name)}
                          activeOpacity={0.72}
                        >
                          <Text style={styles.popularChipText}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Popular Brands */}
                {(popularBrands.length > 0 || topSearches.length > 0) && (
                  <View style={styles.section}>
                    <View style={[styles.sectionHeader, { marginBottom: 14 }]}>
                      <View style={[styles.sectionIconBox, { backgroundColor: "#F3E8FF" }]}>
                        <Feather name="star" size={11} color="#9333EA" />
                      </View>
                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                        MOST SEARCHED
                      </Text>
                    </View>
                    <View style={styles.chipRow}>
                      {(popularBrands.length ? popularBrands.map((b) => b.name) : topSearches.slice(0, 8)).map(
                        (item) => (
                          <TouchableOpacity
                            key={item}
                            style={styles.popularChip}
                            onPress={() => handleSelectSuggestion(item)}
                            activeOpacity={0.72}
                          >
                            <Text style={styles.popularChipText}>{item}</Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: "600",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  clearBtnText: {
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 48,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionIconBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIconText: {
    fontSize: 11,
  },
  sectionLabel: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionIcon: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  suggestionIconEmoji: {
    fontSize: 14,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  arrowText: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#2563EB",
    maxWidth: 110,
  },
  productCard: {
    width: 140,
    marginRight: 14,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  productImagePlaceholder: {
    fontSize: 32,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 17,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "900",
  },
  suggestionsList: { gap: 0 },
  popularChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  popularChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#7C3AED",
  },
  trendingList: { gap: 6 },
  trendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  trendingRank: {
    width: 22,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#D1D5DB",
  },
  trendingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  trendingEmoji: { fontSize: 20 },
  trendingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
    opacity: 0.5,
  },
});
