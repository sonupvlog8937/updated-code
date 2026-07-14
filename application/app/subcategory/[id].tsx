import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAppSelector } from "@/src/store";
import { Category } from "@/src/store/appSlice";

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SubcategoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  
  const catData = useAppSelector((s) => s.app.catData);

  const cardWidth = Math.floor((screenWidth - 48 - 12) / 2);

  // Find the subcategory from the Redux store
  const subcategory = useMemo(() => {
    for (const cat of catData) {
      if (cat.children) {
        const found = cat.children.find((sub: Category) => sub._id === id);
        if (found) return found;
      }
    }
    return null;
  }, [catData, id]);

  const subSubCategories = subcategory?.children || [];
  const hasSubSubCategories = subSubCategories.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {name || subcategory?.name || "Subcategory"}
          </Text>
          {hasSubSubCategories && (
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {subSubCategories.length} categories
            </Text>
          )}
        </View>
        <Pressable
          onPress={() =>
            router.push(
              `/products?subCatId=${id}&catName=${encodeURIComponent(name || subcategory?.name || "")}` as never
            )
          }
          style={[styles.viewAllBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Feather name="grid" size={14} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        {subcategory?.images?.[0] && (
          <View style={styles.banner}>
            <Image
              source={{ uri: subcategory.images[0] }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerContent}>
              <Text style={styles.bannerEyebrow}>Explore</Text>
              <Text style={styles.bannerText}>{subcategory.name}</Text>
            </View>
          </View>
        )}

        {/* Sub-subcategories Grid */}
        {hasSubSubCategories ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                All Categories
              </Text>
              <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>
                  {subSubCategories.length}
                </Text>
              </View>
            </View>

            <View style={[styles.grid, { gap: 12 }]}>
              {subSubCategories.map((subSub: Category) => (
                <Pressable
                  key={subSub._id}
                  onPress={() =>
                    router.push(
                      `/products?subSubCatId=${subSub._id}&catName=${encodeURIComponent(subSub.name)}` as never
                    )
                  }
                  style={[
                    styles.card,
                    {
                      width: cardWidth,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {subSub.images?.[0] ? (
                    <Image
                      source={{ uri: subSub.images[0] }}
                      style={{ width: cardWidth, aspectRatio: 1 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: cardWidth,
                        aspectRatio: 1,
                        backgroundColor: subSub.color || colors.muted,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={[
                          styles.cardPlaceholder,
                          { color: colors.foreground },
                        ]}
                      >
                        {subSub.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text
                      numberOfLines={2}
                      style={[styles.cardLabel, { color: colors.foreground }]}
                    >
                      {subSub.name}
                    </Text>
                    <Feather name="chevron-right" size={13} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="layers" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Sub-categories
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap "View All" above to browse products
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  viewAllText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    justifyContent: "flex-end",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  bannerContent: {
    position: "relative",
    zIndex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
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
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  countText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPlaceholder: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    opacity: 0.3,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  cardLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    borderStyle: "dashed",
    marginTop: 20,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
