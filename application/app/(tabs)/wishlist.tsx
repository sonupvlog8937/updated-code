import { useColors } from "@/hooks/useColors";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchMyListData, setMyListData } from "@/src/store/appSlice";
import { deleteData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WishlistItem {
  _id?: string;
  productId?: string;
  productTitle?: string;
  image?: string;
  price?: number;
  oldPrice?: number;
  rating?: number;
  discount?: number;
  size?: string;
  weight?: string;
  ram?: string;
  color?: string;
  brand?: string;
}

export default function WishlistScreen() {
  const router = useRouter();
  const colors = useColors();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const myListData = useAppSelector((s) => s.app.myListData || []);
  const isLogin = useAppSelector((s) => s.app.isLogin);

  useEffect(() => {
    if (isLogin) {
      loadWishlist();
    }
  }, [isLogin]);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      await dispatch(fetchMyListData());
    } catch (error) {
      console.log("Error loading wishlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (item: WishlistItem) => {
    if (!item?._id) return;
    console.log("🗑️ Removing wishlist item:", item._id);
    try {
      const res = await deleteData(`/api/myList/${item._id}`);
      console.log("💝 Wishlist delete response:", res);
      if (res?.success === true) {
        dispatch(
          setMyListData(
            myListData.filter((w: WishlistItem) => w._id !== item._id),
          ),
        );
        showToast("success", "Removed from wishlist");
      } else {
        console.error("❌ Wishlist delete failed:", res);
        showToast("error", res?.message || "Failed to remove from wishlist");
        dispatch(fetchMyListData());
      }
    } catch (error: any) {
      console.error("❌ Wishlist delete error:", error);
      showToast("error", "Failed to remove item");
      dispatch(fetchMyListData());
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWishlist();
    setRefreshing(false);
  };

  if (!isLogin) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Wishlist
            </Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="heart-outline"
            size={64}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Sign In Required
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Please log in to see your wishlist
          </Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login" as never)}
          >
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      style={[
        styles.wishlistItem,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => router.push(`/product/${item.productId}` as never)}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={[styles.itemImage, { backgroundColor: colors.muted }]}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.itemImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Feather name="image" size={32} color={colors.mutedForeground} />
        )}
      </View>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemTitle, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.productTitle}
        </Text>

        {/* Brand */}
        {item.brand && (
          <Text style={[styles.brandText, { color: colors.mutedForeground }]}>
            {item.brand}
          </Text>
        )}

        {/* Size, Color, Weight, RAM */}
        <View style={styles.attributesRow}>
          {item.size && (
            <Text style={[styles.attribute, { color: colors.mutedForeground }]}>
              Size: {item.size}
            </Text>
          )}
          {item.color && (
            <Text style={[styles.attribute, { color: colors.mutedForeground }]}>
              Color: {item.color}
            </Text>
          )}
        </View>
        <View style={styles.attributesRow}>
          {item.weight && (
            <Text style={[styles.attribute, { color: colors.mutedForeground }]}>
              Weight: {item.weight}
            </Text>
          )}
          {item.ram && (
            <Text style={[styles.attribute, { color: colors.mutedForeground }]}>
              RAM: {item.ram}
            </Text>
          )}
        </View>

        {/* Rating */}
        {item.rating && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text
              style={[styles.ratingText, { color: colors.mutedForeground }]}
            >
              {item.rating.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>
            ₹{item.price}
          </Text>
          {item.oldPrice && (
            <Text style={[styles.oldPrice, { color: colors.mutedForeground }]}>
              ₹{item.oldPrice}
            </Text>
          )}
          {item.discount && (
            <View style={[styles.discount, { backgroundColor: "#ef4444" }]}>
              <Text style={styles.discountText}>{item.discount}% OFF</Text>
            </View>
          )}
        </View>
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeFromWishlist(item)}
      >
        <Feather name="x" size={20} color={colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Wishlist Items */}
      {isLoading ? (
        <>
          <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                My Wishlist
              </Text>
            </View>
          </SafeAreaView>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </>
      ) : myListData.length > 0 ? (
        <FlatList
          scrollEnabled
          data={myListData}
          keyExtractor={(item: WishlistItem) =>
            item._id || item.productId || Math.random().toString()
          }
          ListHeaderComponent={
            <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  My Wishlist
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.badgeText, { color: colors.foreground }]}>
                    {myListData.length}
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          }
          renderItem={renderWishlistItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <>
          <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                My Wishlist
              </Text>
            </View>
          </SafeAreaView>
          <View style={styles.emptyContainer}>
            <Ionicons
              name="heart-outline"
              size={64}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your Wishlist is Empty
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Add items to your wishlist to save them for later
            </Text>
            <TouchableOpacity
              style={[styles.shopBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/index" as never)}
            >
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },

  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    paddingBottom: 100,
    paddingTop: 0,
  },
  wishlistItem: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
    lineHeight: 18,
  },
  brandText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  attributesRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  attribute: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  price: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  oldPrice: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "line-through",
  },
  discount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  loginBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  shopBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shopBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
