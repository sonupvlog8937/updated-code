import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/src/components/EmptyState";
import { ProductItem } from "@/src/components/ProductItem";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchMyListData, MyListItem, Product } from "@/src/store/appSlice";

const IS_SMALL = require("react-native").Dimensions.get("window").width < 375;

export default function MyListScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const myList = useAppSelector((s) => s.app.myListData);
  const isLogin = useAppSelector((s) => s.app.isLogin);
  const [refreshing, setRefreshing] = useState(false);

  if (!isLogin) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <EmptyState
          icon="heart"
          title="Sign in to view your wishlist"
          ctaTitle="Sign In"
          onCta={() => router.push("/login" as never)}
        />
      </SafeAreaView>
    );
  }

  if (!myList?.length) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <EmptyState
          icon="heart"
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it for later"
          ctaTitle="Browse products"
          onCta={() => router.push("/(tabs)" as never)}
        />
      </SafeAreaView>
    );
  }

  const items: Product[] = myList.map((m: MyListItem) => ({
    _id: m.productId,
    name: m.productTitle,
    images: [m.image],
    price: m.price,
    oldPrice: m.oldPrice,
    rating: m.rating,
    brand: m.brand,
    discount: m.discount,
    countInStock: 10,
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyListData());
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(it) => it._id}
        numColumns={2}
        ListHeaderComponent={
          <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
            <View
              style={[
                styles.header,
                { backgroundColor: colors.card, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                My Wishlist ({items.length})
              </Text>
            </View>
          </SafeAreaView>
        }
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => <ProductItem item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: IS_SMALL ? 12 : 14,
    paddingVertical: IS_SMALL ? 10 : 12,
    paddingTop: IS_SMALL ? 12 : 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: IS_SMALL ? 16 : 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  list: { padding: 12, gap: 12, paddingBottom: 30, paddingTop: 0 },
});
