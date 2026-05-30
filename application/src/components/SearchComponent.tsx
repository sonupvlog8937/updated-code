import { useColors } from "@/hooks/useColors";
import {
    clearSearchQuery,
    fetchSearchSuggestions,
    loadRecentSearches,
    performSearch,
    saveRecentSearch,
    setIsDropdownOpen,
    setSearchQuery,
    useAppDispatch,
    useAppSelector,
} from "@/src/store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Keyboard,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const TRENDING_TERMS = [
  "shirt",
  "jeans",
  "t-shirts",
  "bag",
  "watches",
  "trouser",
];
const POPULAR_TERMS = [
  "formal pant",
  "zara jeans",
  "formal shirt",
  "baggy jeans",
  "black shirt",
];

export default function SearchComponent() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const inputRef = useRef<TextInput>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    searchQuery,
    suggestions,
    suggestedProducts,
    correctedQuery,
    aiInsights,
    recentSearches,
    suggestionsLoading,
    isDropdownOpen,
    error,
  } = useAppSelector((state) => state.search);

  // Load recent searches on mount
  useEffect(() => {
    dispatch(loadRecentSearches());
  }, [dispatch]);

  // Debounced suggestions fetching
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      dispatch(fetchSearchSuggestions(searchQuery.trim()));
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, dispatch]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    dispatch(saveRecentSearch(searchQuery));
    dispatch(performSearch(searchQuery));
    Keyboard.dismiss();
    router.push(
      `/(tabs)/search?query=${encodeURIComponent(searchQuery)}` as never,
    );
  }, [searchQuery, dispatch, router]);

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      dispatch(setSearchQuery(suggestion));
      setTimeout(() => {
        dispatch(saveRecentSearch(suggestion));
        dispatch(performSearch(suggestion));
        dispatch(setIsDropdownOpen(false));
        Keyboard.dismiss();
        router.push(
          `/(tabs)/search?query=${encodeURIComponent(suggestion)}` as never,
        );
      }, 100);
    },
    [dispatch, router],
  );

  const handleClearSearch = useCallback(() => {
    dispatch(clearSearchQuery());
    inputRef.current?.focus();
  }, [dispatch]);

  // Combine all typeahead suggestions
  const typeaheadSuggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const pool = [
      ...recentSearches,
      ...suggestions,
      ...TRENDING_TERMS,
      ...POPULAR_TERMS,
      ...suggestedProducts.map((p) => p.name),
    ];

    const ranked = [...new Set(pool)]
      .map((i) => i.trim())
      .filter(Boolean)
      .filter((i) => i.toLowerCase().includes(q));

    return ranked.slice(0, 10);
  }, [searchQuery, recentSearches, suggestions, suggestedProducts]);

  const hasLiveSuggestions =
    typeaheadSuggestions.length > 0 ||
    suggestedProducts.length > 0 ||
    !!correctedQuery ||
    !!aiInsights?.summary;

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      {/* Search Box */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          ref={inputRef}
          placeholder="Search..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={(text) => dispatch(setSearchQuery(text))}
          onFocus={() => dispatch(setIsDropdownOpen(true))}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          style={[styles.input, { color: colors.foreground }]}
        />
        {isSearching && (
          <Pressable onPress={handleClearSearch} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => dispatch(setIsDropdownOpen(false))}
      >
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => dispatch(setIsDropdownOpen(false))}
        >
          <View
            style={[
              styles.dropdownContent,
              { backgroundColor: colors.background },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView
                style={styles.dropdownScroll}
                showsVerticalScrollIndicator={false}
              >
                {isSearching && hasLiveSuggestions ? (
                  <>
                    {/* Did You Mean */}
                    {correctedQuery &&
                      correctedQuery.toLowerCase() !==
                        searchQuery.trim().toLowerCase() && (
                        <Pressable
                          style={[
                            styles.didYouMeanBtn,
                            { backgroundColor: colors.muted },
                          ]}
                          onPress={() => handleSelectSuggestion(correctedQuery)}
                        >
                          <Text
                            style={[
                              styles.didYouMeanLabel,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            Did you mean
                          </Text>
                          <Text
                            style={[
                              styles.didYouMeanWord,
                              { color: colors.primary },
                            ]}
                          >
                            "{correctedQuery}"
                          </Text>
                        </Pressable>
                      )}

                    {/* AI Hint */}
                    {aiInsights?.summary && (
                      <View
                        style={[
                          styles.aiCard,
                          { backgroundColor: colors.muted },
                        ]}
                      >
                        <View style={styles.aiLabel}>
                          <Ionicons
                            name="sparkles"
                            size={14}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.aiLabelText,
                              { color: colors.primary },
                            ]}
                          >
                            AI Suggestion
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.aiSummary,
                            { color: colors.foreground },
                          ]}
                        >
                          {aiInsights.summary}
                        </Text>
                        {aiInsights.highlights &&
                          aiInsights.highlights.length > 0 && (
                            <View style={styles.aiHighlights}>
                              {aiInsights.highlights.map((hint, idx) => (
                                <Text
                                  key={idx}
                                  style={[
                                    styles.aiHighlightItem,
                                    { color: colors.mutedForeground },
                                  ]}
                                >
                                  • {hint}
                                </Text>
                              ))}
                            </View>
                          )}
                      </View>
                    )}

                    {/* Loading Indicator */}
                    {suggestionsLoading && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      </View>
                    )}

                    {/* Typeahead Suggestions */}
                    {!suggestionsLoading && typeaheadSuggestions.length > 0 && (
                      <View>
                        {typeaheadSuggestions.map((item) => {
                          const isRecent = recentSearches.includes(item);
                          return (
                            <Pressable
                              key={item}
                              style={styles.suggestionItem}
                              onPress={() => handleSelectSuggestion(item)}
                            >
                              <View
                                style={[
                                  styles.suggestionIcon,
                                  isRecent && styles.recentIcon,
                                  { backgroundColor: colors.muted },
                                ]}
                              >
                                <Feather
                                  name={isRecent ? "clock" : "search"}
                                  size={14}
                                  color={
                                    isRecent
                                      ? colors.primary
                                      : colors.mutedForeground
                                  }
                                />
                              </View>
                              <Text
                                style={[
                                  styles.suggestionText,
                                  { color: colors.foreground },
                                ]}
                              >
                                {item}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}

                    {/* Suggested Products */}
                    {!suggestionsLoading && suggestedProducts.length > 0 && (
                      <>
                        <View style={styles.divider} />
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          SUGGESTED PRODUCTS
                        </Text>
                        {suggestedProducts.map((product) => (
                          <Pressable
                            key={product._id || product.name}
                            style={styles.productCard}
                            onPress={() => handleSelectSuggestion(product.name)}
                          >
                            <View
                              style={[
                                styles.productThumb,
                                { backgroundColor: colors.muted },
                              ]}
                            >
                              <Text style={styles.productThumbText}>🛍️</Text>
                            </View>
                            <View style={styles.productInfo}>
                              <Text
                                style={[
                                  styles.productName,
                                  { color: colors.foreground },
                                ]}
                                numberOfLines={1}
                              >
                                {product.name}
                              </Text>
                              {product.brand && (
                                <Text
                                  style={[
                                    styles.productBrand,
                                    { color: colors.mutedForeground },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {product.brand}
                                </Text>
                              )}
                            </View>
                          </Pressable>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <>
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          <Feather name="clock" size={11} /> RECENT
                        </Text>
                        <View style={styles.chipRow}>
                          {recentSearches.map((item) => (
                            <Pressable
                              key={item}
                              style={[
                                styles.chip,
                                styles.recentChip,
                                { borderColor: colors.primary },
                              ]}
                              onPress={() => handleSelectSuggestion(item)}
                            >
                              <Feather
                                name="clock"
                                size={11}
                                color={colors.primary}
                              />
                              <Text
                                style={[
                                  styles.chipText,
                                  { color: colors.primary },
                                ]}
                              >
                                {item}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}

                    {/* Trending */}
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      <Ionicons name="flame" size={11} color="#ff6b2b" />{" "}
                      TRENDING
                    </Text>
                    <View>
                      {TRENDING_TERMS.map((item) => (
                        <Pressable
                          key={item}
                          style={styles.suggestionItem}
                          onPress={() => handleSelectSuggestion(item)}
                        >
                          <View
                            style={[
                              styles.suggestionIcon,
                              { backgroundColor: colors.muted },
                            ]}
                          >
                            <Ionicons name="flame" size={14} color="#ff6b2b" />
                          </View>
                          <Text
                            style={[
                              styles.suggestionText,
                              { color: colors.foreground },
                            ]}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Most Searched */}
                    <View style={styles.divider} />
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      MOST SEARCHED
                    </Text>
                    <View style={styles.chipRow}>
                      {POPULAR_TERMS.map((item) => (
                        <Pressable
                          key={item}
                          style={[
                            styles.chip,
                            styles.popularChip,
                            { borderColor: colors.primary },
                          ]}
                          onPress={() => handleSelectSuggestion(item)}
                        >
                          <Text
                            style={[styles.chipText, { color: colors.primary }]}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    flex: 1,
    maxWidth: 180,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  dropdownBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  dropdownContent: {
    flex: 1,
    marginTop: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dropdownScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },

  didYouMeanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  didYouMeanLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  didYouMeanWord: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },

  aiCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  aiLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  aiLabelText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  aiSummary: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    marginBottom: 6,
  },
  aiHighlights: {
    gap: 3,
  },
  aiHighlightItem: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },

  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  recentIcon: {},
  suggestionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  recentChip: {
    backgroundColor: "rgba(255, 107, 43, 0.08)",
  },
  popularChip: {
    backgroundColor: "rgba(255, 107, 43, 0.08)",
  },
  chipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  productThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  productThumbText: {
    fontSize: 18,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
});
