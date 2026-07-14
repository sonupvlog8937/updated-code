import { GoMarketShopCatalog } from "@/src/components/goMarket/GoMarketShopCatalog";
import { CartViewDialog } from "@/src/components/goMarket/CartViewDialog";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "@/src/store";

const T = {
  bg: "#F7F8FA",
  green: "#2D5016",
  white: "#FFFFFF",
} as const;

export default function GoMarketShopSearchScreen() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>();
  const router = useRouter();
  const { isLogin } = useAppSelector((s: any) => s.app);
  const insets = useSafeAreaInsets();
  const [cartDialogVisible, setCartDialogVisible] = useState(false);

  const initialQuery = typeof q === "string" ? q : "";

  useEffect(() => {
    if (!isLogin) router.replace("/login" as never);
  }, [isLogin]);

  if (!id) return null;

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <View style={S.contentWrapper}>
        <GoMarketShopCatalog shopId={id} searchMode initialQuery={initialQuery} />
      </View>

      {/* Sticky Cart Button */}
      <TouchableOpacity
        style={[
          S.stickyCartBtn,
          { bottom: Math.max(insets.bottom, 12) + 12 },
        ]}
        onPress={() => setCartDialogVisible(true)}
        activeOpacity={0.9}
      >
        <View style={S.cartBtnContent}>
          <Text style={S.cartIcon}>🛒</Text>
          <Text style={S.cartBtnText}>View Cart</Text>
        </View>
      </TouchableOpacity>

      <CartViewDialog
        visible={cartDialogVisible}
        onClose={() => setCartDialogVisible(false)}
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 12,
  },
  stickyCartBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 56,
    backgroundColor: T.green,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBtnContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: T.white,
    letterSpacing: 0.3,
  },
});
