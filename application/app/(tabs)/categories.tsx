import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/src/components/EmptyState";
import { useAppSelector } from "@/src/store";
import { Category } from "@/src/store/appSlice";

// ─── Constants ────────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH = 100;
const RIGHT_H_PAD = 14;
const GRID_GAP = 10;

// ─── Sidebar Item ────────────────────────────────────────────────────────────
const SidebarItem = ({
  cat,
  isActive,
  onPress,
  colors,
}: {
  cat: Category;
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 30,
    }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.sideItem,
          { transform: [{ scale: scaleAnim }] },
          isActive && {
            backgroundColor: colors.background,
            borderRightColor: colors.primary,
            borderRightWidth: 3,
          },
        ]}
      >
        <Text
          numberOfLines={2}
          style={[
            styles.sideText,
            {
              color: isActive ? colors.primary : colors.mutedForeground,
              fontFamily: isActive ? "Inter_700Bold" : "Inter_500Medium",
              fontSize: isActive ? 12.5 : 11.5,
            },
          ]}
        >
          {cat.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// ─── Subcategory Card ─────────────────────────────────────────────────────────
const SubcategoryCard = ({
  sub,
  onPress,
  colors,
  cardWidth,
}: {
  sub: Category;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  cardWidth: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
    }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.subItem,
          {
            width: cardWidth,
            backgroundColor: colors.card,
            borderColor: colors.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {sub.images?.[0] ? (
          <Image
            source={{ uri: sub.images[0] }}
            style={{ width: cardWidth, aspectRatio: 1 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: cardWidth,
              aspectRatio: 1,
              backgroundColor: sub.color || colors.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={[styles.subImgPlaceholder, { color: colors.foreground }]}
            >
              {sub.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.subLabelRow}>
          <Text
            numberOfLines={2}
            style={[styles.subLabel, { color: colors.foreground }]}
          >
            {sub.name}
          </Text>
          <Feather name="chevron-right" size={13} color={colors.primary} />
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  count,
  colors,
}: {
  title: string;
  count: number;
  colors: ReturnType<typeof useColors>;
}) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
      {title}
    </Text>
    <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
      <Text style={[styles.countText, { color: colors.primary }]}>{count}</Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CategoriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const catData = useAppSelector((s) => s.app.catData);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useMemo(
    () => catData.find((c) => c._id === (activeId || catData[0]?._id)) || null,
    [catData, activeId],
  );

  const cardWidth = Math.floor(
    (screenWidth - SIDEBAR_WIDTH - RIGHT_H_PAD * 2 - GRID_GAP) / 2,
  );

  if (!catData?.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="grid"
          title="No categories yet"
          description="Categories will appear once available"
        />
      </View>
    );
  }

  return (
    // ✅ No SafeAreaView with edges here — let the parent tab layout / 
    //    expo-router screen handle safe area insets so there's no extra
    //    top-space / fixed gap under the header.
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.body}>

        {/* ── Sidebar: single independent scroll ── */}
        <View
          style={[
            styles.sidebar,
            {
              backgroundColor: colors.surfaceAlt,
              borderRightColor: colors.border,
            },
          ]}
        >
          {/* "Categories" label — scrolls WITH the list, not fixed */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            {/* Inline header at top of scrollable sidebar */}
            <View
              style={[
                styles.sidebarHeaderInline,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.sidebarHeaderTitle,
                  { color: colors.foreground },
                ]}
              >
                Categories
              </Text>
            </View>

            {catData.map((cat: Category) => {
              const isActive = (active?._id || catData[0]._id) === cat._id;
              return (
                <SidebarItem
                  key={cat._id}
                  cat={cat}
                  isActive={isActive}
                  onPress={() => setActiveId(cat._id)}
                  colors={colors}
                />
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        {/* ── Right panel: plain ScrollView, no nested ScrollablePage ── */}
        <ScrollView
          style={styles.right}
          contentContainerStyle={{ padding: RIGHT_H_PAD, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner */}
          {active?.images?.[0] ? (
            <Pressable
              onPress={() =>
                router.push(
                  `/products?catId=${active._id}&catName=${encodeURIComponent(active.name)}` as never,
                )
              }
              style={styles.banner}
            >
              <Image
                source={{ uri: active.images[0] }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerContent}>
                <Text style={styles.bannerEyebrow}>Explore</Text>
                <Text style={styles.bannerText}>{active.name}</Text>
                <View style={styles.bannerCtaBadge}>
                  <Text style={styles.bannerCtaText}>View all</Text>
                  <Feather name="arrow-right" size={12} color="#fff" />
                </View>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={() =>
                router.push(
                  `/products?catId=${active?._id}&catName=${encodeURIComponent(active?.name ?? "")}` as never,
                )
              }
              style={[
                styles.banner,
                styles.bannerFallback,
                { backgroundColor: active?.color || colors.muted },
              ]}
            >
              <View style={styles.bannerContent}>
                <Text style={[styles.bannerText, { color: colors.foreground }]}>
                  {active?.name}
                </Text>
                <View
                  style={[
                    styles.bannerCtaBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.bannerCtaText}>View all</Text>
                  <Feather name="arrow-right" size={12} color="#fff" />
                </View>
              </View>
            </Pressable>
          )}

          {/* Subcategories */}
          {active?.children?.length ? (
            <>
              <SectionHeader
                title="Subcategories"
                count={active.children.length}
                colors={colors}
              />
              <View style={[styles.subGrid, { gap: GRID_GAP }]}>
                {active.children.map((sub) => (
                  <SubcategoryCard
                    key={sub._id}
                    sub={sub}
                    cardWidth={cardWidth}
                    onPress={() =>
                      router.push(
                        `/products?subCatId=${sub._id}&catName=${encodeURIComponent(sub.name)}` as never,
                      )
                    }
                    colors={colors}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={[styles.emptySubcat, { borderColor: colors.border }]}>
              <View
                style={[styles.emptyIcon, { backgroundColor: colors.muted }]}
              >
                <Feather name="layers" size={24} color={colors.primary} />
              </View>
              <Text
                style={[styles.emptySubcatText, { color: colors.foreground }]}
              >
                No Subcategories
              </Text>
              <Text
                style={[
                  styles.emptySubcatSub,
                  { color: colors.mutedForeground },
                ]}
              >
                Tap banner above to browse all products
              </Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, flexDirection: "row" },

  sidebar: { width: SIDEBAR_WIDTH, borderRightWidth: StyleSheet.hairlineWidth },

  // ✅ Header is now INSIDE the ScrollView — scrolls with content
  sidebarHeaderInline: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    marginBottom: 4,
  },
  sidebarHeaderTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },

  sideItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRightWidth: 0,
    borderRightColor: "transparent",
    marginHorizontal: 6,
    marginVertical: 3,
    borderRadius: 10,
  },
  sideText: { lineHeight: 16, textAlign: "center", letterSpacing: 0.1 },

  right: { flex: 1 },

  banner: {
    height: 155,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
    justifyContent: "flex-end",
  },
  bannerFallback: { paddingHorizontal: 14, paddingVertical: 18 },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  bannerContent: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 5,
  },
  bannerEyebrow: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  bannerText: {
    color: "#fff",
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  bannerCtaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 4,
  },
  bannerCtaText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: 2,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 28,
    alignItems: "center",
  },
  countText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  subGrid: { flexDirection: "row", flexWrap: "wrap" },
  subItem: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  subImgPlaceholder: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    opacity: 0.35,
  },
  subLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  subLabel: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
    letterSpacing: -0.1,
  },

  emptySubcat: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    borderStyle: "dashed",
    marginTop: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySubcatText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  emptySubcatSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});