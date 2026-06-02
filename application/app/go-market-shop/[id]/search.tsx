import { GoMarketShopCatalog } from "@/src/components/goMarket/GoMarketShopCatalog";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useAppSelector } from "@/src/store";

const T = {
  bg: "#F7F8FA",
} as const;

export default function GoMarketShopSearchScreen() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>();
  const router = useRouter();
  const { isLogin } = useAppSelector((s: any) => s.app);

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
});
