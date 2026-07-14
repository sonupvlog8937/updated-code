import React, { useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { gmImg, GO_MARKET_FALLBACK } from "@/src/utils/goMarketMedia";
import { useRouter } from "expo-router";

type GrocerySearchModalProps = {
  visible: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (text: string) => void;
  onSearch: (query?: string) => void;
  suggestions: {
    suggestions: any[];
    recentSearches: string[];
    trendingSearches: string[];
    popularProducts: any[];
    topSearches: string[];
  };
  suggestionsLoading: boolean;
  shopId: string;
};

export function GrocerySearchModal({
  visible,
  onClose,
  search,
  onSearchChange,
  onSearch,
  suggestions,
  suggestionsLoading,
  shopId,
}: GrocerySearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const handleSelectSuggestion = (term: string) => {
    onSearch(term);
  };

  const handleClearSearch = () => {
    onSearchChange("");
    inputRef.current?.focus();
  };

  const hasLiveResults =
    suggestions.suggestions.length > 0 || suggestions.popularProducts.length > 0;
  const hasDefaultResults =
    suggestions.recentSearches.length > 0 ||
    suggestions.trendingSearches.length > 0 ||
    suggestions.topSearches.length > 0 ||
    suggestions.popularProducts.length > 0;

  const isSearching = search.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={S.container}>
        {/* Header */}
        <View
          style={[
            S.header,
            { paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 50 },
          ]}
        >
          <View style={S.headerRow}>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={S.backBtn} activeOpacity={0.7}>
              <Text style={S.backBtnText}>←</Text>
            </TouchableOpacity>

            <View style={S.searchBox}>
              <Text style={S.searchIcon}>🔍</Text>
              <TextInput
                ref={inputRef}
                style={S.searchInput}
                placeholder="Search products…"
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={onSearchChange}
                onSubmitEditing={() => onSearch()}
                autoFocus
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} hitSlop={8} activeOpacity={0.7}>
                  <View style={S.clearBtn}>
                    <Text style={S.clearBtnText}>✕</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={S.content}
          contentContainerStyle={S.contentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isSearching ? (
            <>
              {/* Loading State */}
              {suggestionsLoading && (
                <View style={S.emptyState}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={S.emptySubtext}>Searching…</Text>
                </View>
              )}

              {/* No Results */}
              {!suggestionsLoading && !hasLiveResults && (
                <View style={S.emptyState}>
                  <Text style={S.emptyEmoji}>🔍</Text>
                  <Text style={S.emptyText}>No matches found</Text>
                  <Text style={S.emptySubtext}>Try a different search term</Text>
                </View>
              )}

              {/* Suggestions */}
              {!suggestionsLoading && suggestions.suggestions.length > 0 && (
                <View style={S.section}>
                  <View style={S.sectionHeader}>
                    <View style={[S.sectionIconBox, { backgroundColor: "#DBEAFE" }]}>
                      <Ionicons name="search" size={11} color="#2563EB" />
                    </View>
                    <Text style={S.sectionLabel}>SUGGESTIONS</Text>
                  </View>
                  <View style={S.suggestionsList}>
                    {suggestions.suggestions.map((s, index) => (
                      <TouchableOpacity
                        key={s._id}
                        style={S.suggestionRow}
                        onPress={() => handleSelectSuggestion(s.label)}
                        activeOpacity={0.6}
                      >
                        <Feather name="search" size={14} color="#6B7280" />
                        <Text style={S.suggestionText} numberOfLines={1}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Popular Products */}
              {!suggestionsLoading && suggestions.popularProducts.length > 0 && (
                <View style={S.section}>
                  <View style={S.sectionHeader}>
                    <View style={[S.sectionIconBox, { backgroundColor: "#F3E8FF" }]}>
                      <Feather name="star" size={11} color="#9333EA" />
                    </View>
                    <Text style={S.sectionLabel}>POPULAR PRODUCTS</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                  >
                    {suggestions.popularProducts.map((p) => (
                      <TouchableOpacity
                        key={p._id}
                        style={S.productCard}
                        onPress={() => {
                          onClose();
                          router.push(`/go-market-product/grocery/${p._id}` as never);
                        }}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: gmImg(p.image, GO_MARKET_FALLBACK) }}
                          style={S.productImage}
                        />
                        <View style={S.productInfo}>
                          <Text style={S.productName} numberOfLines={2}>
                            {p.name}
                          </Text>
                          <Text style={S.productPrice}>₹{p.price}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={[S.sep, { backgroundColor: "#E5E7EB", opacity: 0.5 }]} />
                </View>
              )}
            </>
          ) : (
            <>
              {/* Empty State */}
              {!hasDefaultResults && (
                <View style={S.emptyState}>
                  <Text style={S.emptyEmoji}>🛒</Text>
                  <Text style={S.emptyText}>Find your groceries</Text>
                  <Text style={S.emptySubtext}>Start typing to search</Text>
                </View>
              )}

              {/* Recent Searches */}
              {suggestions.recentSearches.length > 0 && (
                <View style={S.section}>
                  <View style={[S.sectionHeader, { marginBottom: 14 }]}>
                    <View style={[S.sectionIconBox, { backgroundColor: "#DBEAFE" }]}>
                      <Ionicons name="time" size={11} color="#2563EB" />
                    </View>
                    <Text style={S.sectionLabel}>RECENT</Text>
                  </View>
                  <View style={S.chipRow}>
                    {suggestions.recentSearches.map((term, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={S.chip}
                        onPress={() => handleSelectSuggestion(term)}
                        activeOpacity={0.72}
                      >
                        <Ionicons name="time-outline" size={11} color="#2563EB" />
                        <Text style={S.chipText} numberOfLines={1}>
                          {term}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={[S.sep, { backgroundColor: "#E5E7EB", opacity: 0.5 }]} />
                </View>
              )}

              {/* Trending Searches */}
              {suggestions.trendingSearches.length > 0 && (
                <View style={S.section}>
                  <View style={S.sectionHeader}>
                    <View style={[S.sectionIconBox, { backgroundColor: "#FEE2E2" }]}>
                      <Feather name="trending-up" size={11} color="#DC2626" />
                    </View>
                    <Text style={S.sectionLabel}>TRENDING</Text>
                  </View>
                  <View style={S.trendingList}>
                    {suggestions.trendingSearches.map((term, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={S.trendingRow}
                        onPress={() => handleSelectSuggestion(term)}
                        activeOpacity={0.7}
                      >
                        <Text style={S.trendingRank}>{String(idx + 1).padStart(2, "0")}</Text>
                        <View style={S.trendingIconBox}>
                          <Text style={S.trendingEmoji}>🔥</Text>
                        </View>
                        <Text style={S.trendingLabel}>{term}</Text>
                        <Feather name="arrow-up-right" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={[S.sep, { backgroundColor: "#E5E7EB", opacity: 0.5 }]} />
                </View>
              )}

              {/* Top Searches */}
              {suggestions.topSearches.length > 0 && (
                <View style={S.section}>
                  <View style={[S.sectionHeader, { marginBottom: 14 }]}>
                    <View style={[S.sectionIconBox, { backgroundColor: "#F3E8FF" }]}>
                      <Feather name="star" size={11} color="#9333EA" />
                    </View>
                    <Text style={S.sectionLabel}>MOST SEARCHED</Text>
                  </View>
                  <View style={S.chipRow}>
                    {suggestions.topSearches.map((term, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={S.popularChip}
                        onPress={() => handleSelectSuggestion(term)}
                        activeOpacity={0.72}
                      >
                        <Text style={S.popularChipText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Popular Products */}
              {suggestions.popularProducts.length > 0 && (
                <View style={S.section}>
                  <View style={S.sectionHeader}>
                    <View style={[S.sectionIconBox, { backgroundColor: "#F3E8FF" }]}>
                      <Feather name="star" size={11} color="#9333EA" />
                    </View>
                    <Text style={S.sectionLabel}>POPULAR PRODUCTS</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                  >
                    {suggestions.popularProducts.map((p) => (
                      <TouchableOpacity
                        key={p._id}
                        style={S.productCard}
                        onPress={() => {
                          onClose();
                          router.push(`/go-market-product/grocery/${p._id}` as never);
                        }}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: gmImg(p.image, GO_MARKET_FALLBACK) }}
                          style={S.productImage}
                        />
                        <View style={S.productInfo}>
                          <Text style={S.productName} numberOfLines={2}>
                            {p.name}
                          </Text>
                          <Text style={S.productPrice}>₹{p.price}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
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
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
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
    backgroundColor: "#DBEAFE",
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
    color: "#6B7280",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    marginBottom: 6,
  },
  suggestionIcon: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionIconEmoji: {
    fontSize: 14,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  arrowText: {
    fontSize: 14,
    color: "#9CA3AF",
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
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#F3F4F6",
    resizeMode: "cover",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    lineHeight: 17,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#10B981",
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
    backgroundColor: "#F9FAFB",
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
    color: "#111827",
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
  },
});
