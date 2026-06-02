import { fetchDataFromApi } from "@/src/utils/api";
import { gmImg, GO_MARKET_FALLBACK } from "@/src/utils/goMarketMedia";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TABS = [
  { key: "featured", label: "Featured" },
  { key: "popular", label: "Popular" },
  { key: "latest", label: "Latest" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Props = {
  shopId: string;
  searchMode?: boolean;
  initialQuery?: string;
};

export function GoMarketShopCatalog({ shopId, searchMode = false, initialQuery = "" }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [tab, setTab] = useState<TabKey>("featured");
  const [sort, setSort] = useState("");
  const [inStock, setInStock] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [filterMeta, setFilterMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  const apiPath = searchMode
    ? `/api/go-market/grocery-shops/${shopId}/search`
    : `/api/go-market/grocery-shops/${shopId}/catalog`;

  const buildParams = useCallback(
    (pageNum: number) => {
      const p = new URLSearchParams({
        page: String(pageNum),
        limit: "16",
        tab,
        ...(sort ? { sort } : {}),
        search: debouncedSearch,
        ...(inStock ? { inStock: "true" } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(subCategoryId ? { subCategoryId } : {}),
        ...(minPrice ? { minPrice } : {}),
        ...(maxPrice ? { maxPrice } : {}),
        ...(minRating > 0 ? { minRating: String(minRating) } : {}),
      });
      if (searchMode && debouncedSearch) p.set("q", debouncedSearch);
      return p;
    },
    [tab, sort, debouncedSearch, inStock, categoryId, subCategoryId, minPrice, maxPrice, minRating, searchMode],
  );

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!shopId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await fetchDataFromApi(`${apiPath}?${buildParams(pageNum)}`);
        if (res?.success || res?.error === false) {
          const rows = res.data || [];
          setFilterMeta(res.filterMeta || null);
          setProducts((prev) => (append ? [...prev, ...rows] : rows));
          setTotalPages(res.pagination?.totalPages || 1);
          setPage(pageNum);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [shopId, apiPath, buildParams],
  );

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    if (!shopId || !search.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetchDataFromApi(
        `/api/go-market/grocery-shops/${shopId}/search-suggestions?q=${encodeURIComponent(search.trim())}`,
      ).then((res) => {
        if (res?.success || res?.error === false) setSuggestions(res.suggestions || []);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [shopId, search]);

  const goSearch = (q?: string) => {
    const query = (q || search).trim();
    if (!query) return;
    if (searchMode) {
      setSearch(query);
      setShowSuggestions(false);
      return;
    }
    router.push(`/go-market-shop/${shopId}/search?q=${encodeURIComponent(query)}` as never);
    setShowSuggestions(false);
  };

  const subCats = useMemo(
    () =>
      (filterMeta?.subCategories || []).filter(
        (sc: any) => !categoryId || String(sc.parentId) === String(categoryId),
      ),
    [filterMeta, categoryId],
  );

  const renderProduct = ({ item: p }: { item: any }) => {
    const price = p.discountPrice > 0 ? p.discountPrice : p.price;
    return (
      <TouchableOpacity
        style={S.tile}
        onPress={() => router.push(`/go-market-product/grocery/${p._id}` as never)}
      >
        <Image source={{ uri: gmImg(p.image, GO_MARKET_FALLBACK) }} style={S.tileImg} />
        <Text style={S.tileName} numberOfLines={2}>{p.name}</Text>
        <Text style={S.tilePrice}>₹{price}</Text>
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <View>
      <View style={S.searchRow}>
        <Text>🔍</Text>
        <TextInput
          style={S.searchInput}
          placeholder="Search products…"
          value={search}
          onChangeText={(v) => {
            setSearch(v);
            setShowSuggestions(true);
          }}
          onSubmitEditing={() => goSearch()}
          returnKeyType="search"
        />
        <TouchableOpacity style={S.searchBtn} onPress={() => goSearch()}>
          <Text style={S.searchBtnTxt}>Go</Text>
        </TouchableOpacity>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={S.suggestBox}>
          {suggestions.map((s) => (
            <TouchableOpacity key={s._id} style={S.suggestRow} onPress={() => goSearch(s.label)}>
              <Text style={S.suggestTxt}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chips}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[S.chip, tab === t.key && S.chipOn]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[S.chipTxt, tab === t.key && S.chipTxtOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[S.chip, filtersOpen && S.chipOn]} onPress={() => setFiltersOpen(!filtersOpen)}>
          <Text style={[S.chipTxt, filtersOpen && S.chipTxtOn]}>Filters</Text>
        </TouchableOpacity>
      </ScrollView>

      {filtersOpen && (
        <View style={S.filterPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chips}>
            <TouchableOpacity
              style={[S.chip, !categoryId && S.chipOn]}
              onPress={() => { setCategoryId(""); setSubCategoryId(""); }}
            >
              <Text style={[S.chipTxt, !categoryId && S.chipTxtOn]}>All categories</Text>
            </TouchableOpacity>
            {(filterMeta?.categories || []).map((c: any) => (
              <TouchableOpacity
                key={c._id}
                style={[S.chip, categoryId === c._id && S.chipOn]}
                onPress={() => { setCategoryId(c._id); setSubCategoryId(""); }}
              >
                <Text style={[S.chipTxt, categoryId === c._id && S.chipTxtOn]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {subCats.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[S.chips, { marginTop: 8 }]}>
              <TouchableOpacity
                style={[S.chip, !subCategoryId && S.chipOn]}
                onPress={() => setSubCategoryId("")}
              >
                <Text style={[S.chipTxt, !subCategoryId && S.chipTxtOn]}>All sub</Text>
              </TouchableOpacity>
              {subCats.map((sc: any) => (
                <TouchableOpacity
                  key={sc._id}
                  style={[S.chip, subCategoryId === sc._id && S.chipOn]}
                  onPress={() => setSubCategoryId(sc._id)}
                >
                  <Text style={[S.chipTxt, subCategoryId === sc._id && S.chipTxtOn]}>{sc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <View style={[S.chips, { flexWrap: "wrap", marginTop: 8 }]}>
            <TextInput style={S.miniInput} placeholder="Min ₹" keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
            <TextInput style={S.miniInput} placeholder="Max ₹" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
            {[4, 3, 2].map((r) => (
              <TouchableOpacity
                key={r}
                style={[S.chip, minRating === r && S.chipOn]}
                onPress={() => setMinRating(minRating === r ? 0 : r)}
              >
                <Text style={[S.chipTxt, minRating === r && S.chipTxtOn]}>{r}★+</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[S.chip, inStock && S.chipOn]} onPress={() => setInStock(!inStock)}>
              <Text style={[S.chipTxt, inStock && S.chipTxtOn]}>In stock</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && !products.length && <ActivityIndicator color="#2563eb" style={{ marginVertical: 20 }} />}
    </View>
  );

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p._id}
      numColumns={2}
      columnWrapperStyle={{ gap: 10, paddingHorizontal: 14 }}
      contentContainerStyle={{ paddingBottom: 80 }}
      ListHeaderComponent={ListHeader}
      renderItem={renderProduct}
      onEndReached={() => {
        if (page < totalPages && !loadingMore && !loading) loadPage(page + 1, true);
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator color="#2563eb" style={{ marginVertical: 16 }} /> : null
      }
      ListEmptyComponent={
        !loading ? <Text style={S.empty}>No products found.</Text> : null
      }
    />
  );
}

const S = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  searchBtn: { backgroundColor: "#2563eb", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  searchBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  suggestBox: {
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  suggestRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  suggestTxt: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  chips: { gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  chip: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipOn: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  chipTxt: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  chipTxtOn: { color: "#fff" },
  filterPanel: { paddingBottom: 8 },
  miniInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
    fontSize: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 10,
  },
  tileImg: { width: "100%", height: 120 },
  tileName: { fontSize: 12, fontWeight: "800", padding: 8, color: "#0f172a" },
  tilePrice: { fontSize: 14, fontWeight: "900", color: "#FF6B2C", paddingHorizontal: 8, paddingBottom: 10 },
  empty: { textAlign: "center", color: "#94a3b8", padding: 32 },
});
