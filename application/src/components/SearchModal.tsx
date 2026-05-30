import { useColors } from "@/hooks/useColors";
import { saveRecentSearch, setPage, useAppDispatch } from "@/src/store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const TRENDING_SEARCHES = [
  { text: "shirt", emoji: "👔" },
  { text: "jeans", emoji: "👖" },
  { text: "t shirts", emoji: "👕" },
  { text: "bag", emoji: "👜" },
  { text: "watches", emoji: "⌚" },
  { text: "trouser", emoji: "🩳" },
];

const MOST_SEARCHED = [
  "formal pant",
  "zara jeans",
  "formal shirt",
  "baggy jeans",
  "black shirt",
  "white shirt",
];

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colors = useColors();

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const trendingAnims = useRef(
    TRENDING_SEARCHES.map(() => new Animated.Value(0)),
  ).current;

  // ── Get filtered suggestions based on query ──
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    const pool = [
      ...recentSearches,
      ...TRENDING_SEARCHES.map((t) => t.text),
      ...MOST_SEARCHED,
    ];
    return [...new Set(pool)]
      .filter((term) => term.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, recentSearches]);

  const isSearching = query.trim().length > 0;

  // ── Open / close animation ──
  useEffect(() => {
    if (visible) {
      trendingAnims.forEach((a) => a.setValue(0));

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isSearching) {
          Animated.stagger(
            44,
            trendingAnims.map((a) =>
              Animated.timing(a, {
                toValue: 1,
                duration: 260,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ),
          ).start();
        }
      });

      // Auto-focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 250);
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      setQuery("");
      setFocused(false);
    }
  }, [visible]);

  // ── Load recent searches ──
  useEffect(() => {
    if (visible) {
      try {
        const saved =
          global.localStorage?.getItem?.("recent_searches_mobile") || "[]";
        const parsed = JSON.parse(saved);
        setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 8) : []);
      } catch {
        setRecentSearches([]);
      }
    }
  }, [visible]);

  const handleSearch = useCallback(
    (searchText: string) => {
      const trimmed = searchText.trim();
      if (!trimmed) return;
      dispatch(saveRecentSearch(trimmed));
      dispatch(setPage(1));
      onClose();
      setTimeout(() => {
        router.push(`/search?query=${encodeURIComponent(trimmed)}`);
      }, 100);
    },
    [dispatch, router, onClose],
  );

  const handleRemoveRecent = useCallback(
    (term: string) => {
      const updated = recentSearches.filter((t) => t !== term);
      setRecentSearches(updated);
      try {
        global.localStorage?.setItem?.(
          "recent_searches_mobile",
          JSON.stringify(updated),
        );
      } catch {}
    },
    [recentSearches],
  );

  const clearAllRecent = useCallback(() => {
    setRecentSearches([]);
    try {
      global.localStorage?.setItem?.("recent_searches_mobile", "[]");
    } catch {}
  }, []);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View
        style={[
          styles.root,
          { backgroundColor: colors.background, opacity: fadeAnim },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[styles.inner, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* ══════════════════════════════
                HEADER
            ══════════════════════════════ */}
            <View style={styles.header}>
              {/* Back button */}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={10}
                style={styles.backBtn}
                activeOpacity={0.7}
              >
                <Feather
                  name="arrow-left"
                  size={20}
                  color={colors.foreground}
                />
              </TouchableOpacity>

              {/* Search Input */}
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: focused ? "#FFFFFF" : colors.card,
                    borderColor: focused ? "#111827" : colors.border,
                  },
                ]}
              >
                <Feather
                  name="search"
                  size={16}
                  color={focused ? "#111827" : colors.mutedForeground}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={inputRef}
                  placeholder="Search products, brands & more..."
                  placeholderTextColor={colors.mutedForeground}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => handleSearch(query)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                  underlineColorAndroid="transparent"
                  style={[styles.searchInput, { color: colors.foreground }]}
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    hitSlop={8}
                  >
                    <View style={styles.clearCircle}>
                      <Feather name="x" size={10} color="#fff" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Cancel */}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={10}
                activeOpacity={0.6}
              >
                <Text style={[styles.cancelText, { color: colors.foreground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Header bottom line */}
            <View
              style={[styles.headerLine, { backgroundColor: colors.border }]}
            />

            {/* ══════════════════════════════
                BODY
            ══════════════════════════════ */}
            <ScrollView
              style={styles.body}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* SEARCH SUGGESTIONS */}
              {isSearching && suggestions.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <View style={[styles.sectionIcon, { backgroundColor: "#DBEAFE" }]}>
                      <Ionicons name="search" size={11} color="#2563EB" />
                    </View>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      SUGGESTIONS
                    </Text>
                  </View>

                  <View style={styles.suggestionsList}>
                    {suggestions.map((term, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionRow}
                        onPress={() => handleSearch(term)}
                        activeOpacity={0.6}
                      >
                        <Feather name="search" size={14} color={colors.mutedForeground} />
                        <Text
                          style={[
                            styles.suggestionText,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {term}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* RECENT (only show when not searching) */}
              {!isSearching && recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <View
                      style={[
                        styles.sectionIcon,
                        { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Ionicons name="time" size={11} color="#2563EB" />
                    </View>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      RECENT
                    </Text>
                    <TouchableOpacity onPress={clearAllRecent} hitSlop={8}>
                      <Text style={styles.clearAllText}>Clear all</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.chipWrap}>
                    {recentSearches.map((term, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.recentChip}
                        onPress={() => handleSearch(term)}
                        onLongPress={() => handleRemoveRecent(term)}
                        activeOpacity={0.72}
                      >
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color="#2563EB"
                        />
                        <Text style={styles.recentChipText} numberOfLines={1}>
                          {term}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View
                    style={[styles.sep, { backgroundColor: colors.border }]}
                  />
                </View>
              )}

              {/* TRENDING (only show when not searching) */}
              {!isSearching && (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <View
                      style={[styles.sectionIcon, { backgroundColor: "#FEE2E2" }]}
                    >
                      <Feather name="trending-up" size={11} color="#DC2626" />
                    </View>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      TRENDING
                    </Text>
                  </View>

                  <View style={styles.trendingList}>
                    {TRENDING_SEARCHES.map((item, idx) => (
                      <Animated.View
                        key={idx}
                        style={{
                          opacity: trendingAnims[idx],
                          transform: [
                            {
                              translateX: trendingAnims[idx].interpolate({
                                inputRange: [0, 1],
                                outputRange: [-18, 0],
                              }),
                            },
                          ],
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.trendingRow,
                            { backgroundColor: colors.card },
                          ]}
                          onPress={() => handleSearch(item.text)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.trendingRank}>
                            {String(idx + 1).padStart(2, "0")}
                          </Text>
                          <View style={styles.trendingIconBox}>
                            <Text style={styles.trendingEmoji}>{item.emoji}</Text>
                          </View>
                          <Text
                            style={[
                              styles.trendingLabel,
                              { color: colors.foreground },
                            ]}
                          >
                            {item.text}
                          </Text>
                          <Feather
                            name="arrow-up-right"
                            size={14}
                            color={colors.mutedForeground}
                          />
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>

                  <View
                    style={[styles.sep, { backgroundColor: colors.border }]}
                  />
                </View>
              )}

              {/* MOST SEARCHED (only show when not searching) */}
              {!isSearching && (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <View
                      style={[styles.sectionIcon, { backgroundColor: "#F3E8FF" }]}
                    >
                      <Feather name="star" size={11} color="#9333EA" />
                    </View>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      MOST SEARCHED
                    </Text>
                  </View>

                  <View style={styles.chipWrap}>
                    {MOST_SEARCHED.map((term, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.popularChip}
                        onPress={() => handleSearch(term)}
                        activeOpacity={0.72}
                      >
                        <Text style={styles.popularChipText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 48 }} />
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

// ─────────────────────── Styles ───────────────────────
const ANDROID_STATUSBAR =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  inner: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: ANDROID_STATUSBAR + 10,
    paddingBottom: 10,
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

  /* Search box */
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 13,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 0,
  },
  headerLine: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.5,
  },

  /* Body */
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 16, paddingTop: 22 },

  /* Sections */
  section: { marginBottom: 4 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  clearAllText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
    opacity: 0.5,
  },

  /* Chip rows */
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recentChip: {
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
  recentChipText: {
    fontSize: 12.5,
    fontFamily: "Inter_500Medium",
    color: "#2563EB",
    maxWidth: 110,
  },
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
    fontFamily: "Inter_600SemiBold",
    color: "#7C3AED",
  },

  /* Trending */
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
    fontFamily: "Inter_700Bold",
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
    fontFamily: "Inter_500Medium",
  },

  /* Suggestions */
  suggestionsList: { gap: 0 },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
