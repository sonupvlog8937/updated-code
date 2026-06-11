import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchGoMarkets, fetchGoNearbyMarkets, savePreferredMarket, useAppDispatch, useAppSelector } from "@/src/store";

const T = {
  orange: "#FF6B2C",
  orangeLight: "#FFF3ED",
  white: "#FFFFFF",
  bg: "#F9F9F9",
  border: "#EBEBEB",
  text: "#111111",
  textSoft: "#999999",
  black: "#111111",
  green: "#16A34A",
};

export default function GoMarketScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  const { markets, nearbyMarkets, loading } = useAppSelector((s: any) => s.goMarket);
  const { isLogin, userData } = useAppSelector((s: any) => s.app);

  // Wait for auth to be checked before redirecting
  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked && !isLogin) {
      router.replace("/login" as never);
    }
  }, [isLogin, authChecked]);

  // Auto-navigate to preferred market if exists (skip if coming from edit)
  useEffect(() => {
    // Don't auto-redirect if in edit mode (coming from market page via edit button)
    const isFromEdit = params?.edit === "true";
    
    if (authChecked && isLogin && userData?.preferredMarketId && !isFromEdit) {
      console.log("🎯 Auto-navigating to preferred market:", userData.preferredMarketId);
      router.replace(`/go-market-market/${userData.preferredMarketId}` as never);
    }
  }, [authChecked, isLogin, userData?.preferredMarketId, params?.edit]);

  useEffect(() => {
    dispatch(fetchGoMarkets(""));
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const allMarkets = useMemo(
    () => Array.from(new Map([...nearbyMarkets, ...markets].map((m: any) => [m._id, m])).values()),
    [markets, nearbyMarkets],
  );

  // Fuzzy search function - matches even with typos
  const fuzzyMatch = (text: string, query: string) => {
    if (!text || !query) return false;
    text = text.toLowerCase();
    query = query.toLowerCase();
    
    // Exact match
    if (text.includes(query)) return true;
    
    // Fuzzy match - allows 1-2 character differences
    let queryIndex = 0;
    let matchCount = 0;
    
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        matchCount++;
        queryIndex++;
      }
    }
    
    // If matched at least 70% of query characters, consider it a match
    return matchCount >= Math.floor(query.length * 0.7);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allMarkets;
    return allMarkets.filter(
      (m: any) =>
        fuzzyMatch(m.name, q) ||
        fuzzyMatch(m.city, q) ||
        String(m.pincode || "").includes(q),
    );
  }, [allMarkets, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchGoMarkets(search));
    setRefreshing(false);
  };

  const handleLoc = async () => {
    setLocBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Enable location to find nearby markets.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const result = await dispatch(
        fetchGoNearbyMarkets({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
      ).unwrap();
      
      // Auto-navigate to nearest market and save preference
      if (result?.data && result.data.length > 0) {
        const nearestMarket = result.data[0];
        console.log("🎯 Navigating to nearest market:", nearestMarket.name);
        await saveAndNavigate(nearestMarket._id);
      } else {
        Alert.alert("No markets found", "No nearby markets found in your area.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not get location.");
      console.error("Location error:", error);
    } finally {
      setLocBusy(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setShowSuggestions(text.trim().length > 0);
  };

  const handleSuggestionClick = (market: any) => {
    setSearch(market.name);
    setShowSuggestions(false);
    saveAndNavigate(market._id);
  };

  const saveAndNavigate = async (marketId: string) => {
    // Save preferred market to database
    await dispatch(savePreferredMarket(marketId));
    // Navigate to market page
    router.push(`/go-market-market/${marketId}` as never);
  };

  const openMarket = (id: string) => saveAndNavigate(id);

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView
        contentContainerStyle={S.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.orange} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[S.headerCard, { opacity: fade }]}>
          <View style={S.badgePill}>
            <View style={S.badgeDot} />
            <Text style={S.badgeTxt}>QUICK COMMERCE</Text>
          </View>
          <Text style={S.heroTitle}>Go Market</Text>
          <Text style={S.heroCopy}>Search your market or use current location, then tap a market to browse shops.</Text>

          <View style={S.inputRow}>
            <Text style={{ fontSize: 13 }}>🔍</Text>
            <TextInput
              style={S.input}
              placeholder="Search by name, city, pincode…"
              placeholderTextColor={T.textSoft}
              value={search}
              onChangeText={handleSearchChange}
              onSubmitEditing={() => dispatch(fetchGoMarkets(search))}
              onFocus={() => search.trim() && setShowSuggestions(true)}
              returnKeyType="search"
            />
          </View>

          {/* Autocomplete Suggestions */}
          {showSuggestions && search.trim() && filtered.length > 0 && (
            <View style={S.suggestionsBox}>
              {filtered.slice(0, 5).map((market: any) => (
                <TouchableOpacity
                  key={market._id}
                  style={S.suggestionItem}
                  onPress={() => handleSuggestionClick(market)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={S.suggestionName}>{market.name}</Text>
                    <Text style={S.suggestionSub}>
                      {market.city}{market.state ? `, ${market.state}` : ""} · {market.pincode || "—"}
                      {market.distanceKm != null ? ` · ${market.distanceKm} km` : ""}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, color: T.orange }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={S.searchBtn} onPress={() => dispatch(fetchGoMarkets(search))}>
            <Text style={S.searchBtnTxt}>Search markets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={S.nearbyBtn} onPress={handleLoc} disabled={locBusy}>
            {locBusy ? (
              <ActivityIndicator color={T.orange} />
            ) : (
              <>
                <Text style={{ fontSize: 13 }}>📍</Text>
                <Text style={S.nearbyTxt}>Use current location</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={S.listCard}>
          <Text style={S.listTitle}>Select market</Text>
          {loading && <ActivityIndicator color={T.orange} style={{ marginVertical: 16 }} />}
          {!loading && filtered.length === 0 && (
            <Text style={S.emptyTxt}>No markets found. Try search or location.</Text>
          )}
          {filtered.map((m: any) => (
            <TouchableOpacity key={m._id} style={S.marketRow} onPress={() => openMarket(m._id)} activeOpacity={0.85}>
              <View style={{ flex: 1 }}>
                <Text style={S.marketName}>{m.name}</Text>
                <Text style={S.marketSub}>
                  {m.city}{m.distanceKm != null ? ` · ${m.distanceKm} km` : ""}
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: T.orange }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingBottom: 40 },
  headerCard: {
    backgroundColor: T.white,
    marginHorizontal: 14,
    marginTop: Platform.OS === "ios" ? 54 : 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
  },
  badgePill: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.green },
  badgeTxt: { fontSize: 10, fontWeight: "800", color: "#555", letterSpacing: 0.8 },
  heroTitle: { fontSize: 28, fontWeight: "900", color: T.text, marginBottom: 6 },
  heroCopy: { fontSize: 13, color: T.textSoft, lineHeight: 19, marginBottom: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 6,
    marginBottom: 10,
  },
  input: { flex: 1, fontSize: 14, color: T.text },
  searchBtn: {
    backgroundColor: T.black,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  searchBtnTxt: { color: T.white, fontWeight: "800", fontSize: 15 },
  nearbyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  nearbyTxt: { fontSize: 14, fontWeight: "700", color: "#555" },
  listCard: {
    backgroundColor: T.white,
    marginHorizontal: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  listTitle: { fontSize: 15, fontWeight: "800", marginBottom: 12, color: T.text },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  marketName: { fontSize: 14, fontWeight: "800", color: T.text },
  marketSub: { fontSize: 12, color: T.textSoft, marginTop: 2 },
  emptyTxt: { textAlign: "center", color: T.textSoft, paddingVertical: 20, fontSize: 13 },
  suggestionsBox: {
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: "700",
    color: T.text,
    marginBottom: 2,
  },
  suggestionSub: {
    fontSize: 11,
    color: T.textSoft,
  },
});
