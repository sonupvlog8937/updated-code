import { GoMarketShopCatalog } from "@/src/components/goMarket/GoMarketShopCatalog";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppSelector } from "@/src/store";

export default function GoMarketShopSearchScreen() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>();
  const router = useRouter();
  const { isLogin } = useAppSelector((s: any) => s.app);
  const query = typeof q === "string" ? q : "";

  useEffect(() => {
    if (!isLogin) router.replace("/login" as never);
  }, [isLogin]);

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" />
      <View style={S.head}>
        <TouchableOpacity onPress={() => router.back()} style={S.back}>
          <Text style={{ fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={S.title}>{query ? `“${query}”` : "Search"}</Text>
          <Text style={S.sub}>Shop products</Text>
        </View>
      </View>
      {id ? <GoMarketShopCatalog shopId={id} searchMode initialQuery={query} /> : null}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: Platform.OS === "ios" ? 54 : 16,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  sub: { fontSize: 12, color: "#64748b", marginTop: 2 },
});
