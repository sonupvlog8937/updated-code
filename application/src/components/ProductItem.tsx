import { useColors } from "@/hooks/useColors";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useAppDispatch, useAppSelector } from "../store";
import {
  fetchMyListData,
  MyListItem,
  Product as AppProduct,
} from "../store/appSlice";
import { deleteData, postData } from "../utils/api";
import { showToast } from "../utils/toast";
import { RatingStars } from "./RatingStars";

const { width } = Dimensions.get("window");
const IS_SMALL_SCREEN = width < 375;

interface Props {
  item: Partial<AppProduct>;
  variant?: "grid" | "list";
  style?: StyleProp<ViewStyle>;
}

const getProductTag = (p: Partial<AppProduct>) => {
  const stock = Number(p?.countInStock || 0);
  const discount = Number(p?.discount || 0);
  if (stock <= 0) return { label: "Out of Stock", color: "#6b7280", bg: "#f3f4f6" };
  if (stock <= 5)
    return { label: `Only ${stock} left`, color: "#b45309", bg: "#fef3c7" };
  if ((p?.rating || 0) >= 4.2)
    return { label: "Top Rated", color: "#065f46", bg: "#d1fae5" };
  if (discount >= 25)
    return { label: "Trending", color: "#be123c", bg: "#ffe4e6" };
  return { label: "Featured", color: "#1d4ed8", bg: "#dbeafe" };
};

export const ProductItem: React.FC<Props> = ({ item, variant = "grid", style }) => {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((s) => s.app.userData);
  const myList = useAppSelector((s) => s.app.myListData);

  if (!item._id) return null;

  const tag = useMemo(() => getProductTag(item), [item]);
  const inWishlist = useMemo(
    () => myList?.some((m: MyListItem) => m?.productId === item?._id),
    [myList, item?._id],
  );

  // Calculate card width - ensure it works in production
  const screenW = Dimensions.get("window").width;
  const gap = 6;
  const horizontalPadding = 20; // 10px on each side from parent
  const availableWidth = screenW - horizontalPadding;
  const cardW = variant === "grid" 
    ? Math.floor((availableWidth - gap) / 2) 
    : availableWidth;

  const onWishlist = async () => {
    if (!userData?._id) {
      showToast("error", "Please login first");
      return;
    }
    if (!item._id) return;

    if (inWishlist) {
      const item2 = myList.find((m: MyListItem) => m?.productId === item._id);
      if (item2?._id) {
        const res = await deleteData(`/api/myList/${item2._id}`);
        if (res?.error === false) {
          showToast("success", "Removed from wishlist");
          dispatch(fetchMyListData());
        } else {
          showToast("error", res?.message || "Failed");
        }
      }
      return;
    }
    const data = {
      productTitle: item?.name,
      image: item?.images?.[0],
      rating: item?.rating,
      price: item?.price,
      oldPrice: item?.oldPrice,
      productId: item._id,
      brand: item?.brand,
      discount: item?.discount,
    };
    const res = await postData("/api/myList/add", data);
    if (res?.error === false) {
      showToast("success", "Added to wishlist");
      dispatch(fetchMyListData());
    } else {
      showToast("error", res?.message || "Failed");
    }
  };

  if (variant === "list") {
    return (
      <Pressable
        onPress={() => router.push(`/product/${item._id}` as never)}
        style={[
          styles.listCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          style,
        ]}
      >
        <Image
          source={{ uri: item?.images?.[0] }}
          style={styles.listImg}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.listBody}>
          {item?.brand ? (
            <Text style={[styles.brand, { color: colors.mutedForeground }]}>
              {item.brand}
            </Text>
          ) : null}
          <Text
            numberOfLines={2}
            style={[styles.title, { color: colors.foreground }]}
          >
            {item?.name}
          </Text>
          <RatingStars value={item?.rating || 0} size={12} showValue />
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              ₹{item?.price}
            </Text>
            {item?.oldPrice ? (
              <Text style={[styles.oldPrice, { color: colors.mutedForeground }]}>
                ₹{item?.oldPrice}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/product/${item._id}` as never)}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardW,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: item?.images?.[0] }}
          style={styles.img}
          contentFit="cover"
          transition={150}
        />
        {item?.discount ? (
          <View style={styles.discount}>
            <Text style={styles.discountText}>{item.discount}% OFF</Text>
          </View>
        ) : null}
        <Pressable
          onPress={onWishlist}
          style={[styles.heartBtn, { backgroundColor: colors.background }]}
        >
          <Ionicons
            name={inWishlist ? "heart" : "heart-outline"}
            size={15}
            color={inWishlist ? colors.primary : colors.foreground}
          />
        </Pressable>
        <View style={[styles.tag, { backgroundColor: tag.bg }]}>
          <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
        </View>
      </View>
      <View style={styles.body}>
        {item?.brand ? (
          <Text
            numberOfLines={1}
            style={[styles.brand, { color: colors.mutedForeground }]}
          >
            {item.brand}
          </Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={[styles.title, { color: colors.foreground }]}
        >
          {item?.name}
        </Text>
        <RatingStars value={item?.rating || 0} size={11} />
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>
            ₹{item?.price}
          </Text>
          {item?.oldPrice ? (
            <Text style={[styles.oldPrice, { color: colors.mutedForeground }]}>
              ₹{item?.oldPrice}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export default ProductItem;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 2,
    flexShrink: 0,
  },
  imgWrap: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
    backgroundColor: "#f8f8fa",
  },
  img: { width: "100%", height: "100%" },
  discount: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#ff5252",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 9,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  heartBtn: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tag: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  body: { padding: 8, gap: 3 },
  brand: { fontSize: 10, fontFamily: "Inter_500Medium" },
  title: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    minHeight: 30,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  price: { fontSize: 14, fontFamily: "Inter_700Bold" },
  oldPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
    fontFamily: "Inter_400Regular",
  },
  listCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 10,
    marginBottom: 8,
  },
  listImg: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f5f5f7",
  },
  listBody: { flex: 1, gap: 3 },
});
