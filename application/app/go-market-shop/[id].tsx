import { GoMarketShopCatalog } from "@/src/components/goMarket/GoMarketShopCatalog";
import { fetchDataFromApi } from "@/src/utils/api";
import { gmImg, GO_MARKET_FALLBACK, GO_MARKET_LOGO_FALLBACK } from "@/src/utils/goMarketMedia";
import { followGoShop, unfollowGoShop, useAppDispatch, useAppSelector } from "@/src/store";
import { showToast } from "@/src/utils/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const T = {
  orange: "#FF6B2C",
  white: "#FFFFFF",
  bg: "#F9F9F9",
  border: "#EBEBEB",
  text: "#111111",
  textSoft: "#999999",
  green: "#16A34A",
  red: "#EF4444",
};

export default function GoMarketShopDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLogin } = useAppSelector((s: any) => s.app);

  useEffect(() => {
    if (!isLogin) router.replace("/login" as never);
  }, [isLogin]);

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

  const loadShop = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchDataFromApi(`/api/go-market/grocery-shops/${id}/catalog?limit=1&page=1`)
      .then((res) => {
        if (res?.success || res?.error === false) setShop(res.shop);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const handleFollow = async () => {
    if (!shop?._id || followBusy) return;
    setFollowBusy(true);
    try {
      const action = shop.isFollowing ? unfollowGoShop : followGoShop;
      const res = await dispatch(action(shop._id)).unwrap();
      const data = res?.data || res;
      setShop((s: any) => ({
        ...s,
        isFollowing: data?.isFollowing ?? !s.isFollowing,
        followerCount: data?.followerCount ?? s.followerCount,
      }));
      showToast("success", shop.isFollowing ? "Unfollowed" : "Following shop");
    } catch {
      showToast("error", "Could not update follow");
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading && !shop) {
    return (
      <View style={[S.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={T.orange} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={[S.root, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Shop not found</Text>
      </View>
    );
  }

  const followersN = shop.followerCount ?? 0;

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" />
      <View style={S.bannerWrap}>
        <Image source={{ uri: gmImg(shop.shopBanner, GO_MARKET_FALLBACK) }} style={S.banner} />
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
      </View>

      <View style={S.infoCard}>
        <Image source={{ uri: gmImg(shop.shopLogo, GO_MARKET_LOGO_FALLBACK) }} style={S.logo} />
        <Text style={S.shopName}>{shop.shopName}</Text>
        <Text style={S.shopAddr} numberOfLines={2}>{shop.address}</Text>
        <View style={S.statsRow}>
          <Text style={S.stat}>⭐ {Number(shop.rating || 0).toFixed(1)}</Text>
          <Text style={S.stat}>👥 {followersN}</Text>
          <Text style={S.stat}>📦 {shop.totalProducts || 0}</Text>
        </View>
        {!!shop.description && <Text style={S.desc}>{shop.description}</Text>}
        <View style={S.actions}>
          <TouchableOpacity style={[S.btn, shop.isFollowing && S.btnOutline]} onPress={handleFollow}>
            <Text style={[S.btnTxt, shop.isFollowing && S.btnTxtOutline]}>
              {shop.isFollowing ? "✓ Following" : "❤️ Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.btn, S.btnOutline]}
            onPress={() => Share.share({ message: `${shop.shopName}\n${shop.address}` })}
          >
            <Text style={S.btnTxtOutline}>Share</Text>
          </TouchableOpacity>
          {shop.ownerId?.mobile && (
            <TouchableOpacity style={[S.btn, S.btnOutline]} onPress={() => Linking.openURL(`tel:${shop.ownerId.mobile}`)}>
              <Text style={S.btnTxtOutline}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={S.secTitle}>Products</Text>
      {id ? <GoMarketShopCatalog shopId={id} /> : null}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  bannerWrap: { position: "relative" },
  banner: { width: "100%", height: 180 },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 16,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    marginHorizontal: 14,
    marginTop: -24,
    backgroundColor: T.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignSelf: "center",
    marginTop: -48,
    borderWidth: 3,
    borderColor: T.white,
    marginBottom: 8,
  },
  shopName: { fontSize: 20, fontWeight: "900", textAlign: "center", color: T.text },
  shopAddr: { fontSize: 12, color: T.textSoft, textAlign: "center", marginTop: 4 },
  statsRow: { flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 10 },
  stat: { fontSize: 11, fontWeight: "700", color: "#475569" },
  desc: { fontSize: 13, color: "#555", marginTop: 10, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: T.text, alignItems: "center" },
  btnOutline: { backgroundColor: T.white, borderWidth: 1.5, borderColor: T.border },
  btnTxt: { color: T.white, fontWeight: "800", fontSize: 12 },
  btnTxtOutline: { color: T.text, fontWeight: "800", fontSize: 12 },
  secTitle: { fontSize: 18, fontWeight: "900", marginHorizontal: 14, marginBottom: 4, color: T.text },
});
