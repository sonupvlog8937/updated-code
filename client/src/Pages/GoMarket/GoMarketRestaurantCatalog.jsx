import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchDataFromApi } from "../../utils/api";
import { img } from "../../utils/goMarketMedia";
import { ResultBar, SkeletonGrid, useDebouncedValue } from "./shared";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";

const TABS = [
  { key: "featured", label: "Featured" },
  { key: "popular", label: "Popular" },
  { key: "latest", label: "Latest" },
];

const SORT_OPTIONS = [
  { value: "", label: "Smart tab order" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
];

export default function GoMarketRestaurantCatalog({ restaurantId, searchMode = false, initialQuery = "", onRestaurant }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState(initialQuery);
  const debouncedSearch = useDebouncedValue(search, 350);
  const [tab, setTab] = useState("featured");
  const [sort, setSort] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [filterMeta, setFilterMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => setSearch(initialQuery), [initialQuery]);

  const state = useMemo(() => ({ tab, sort, availableOnly, categoryId, subCategoryId, minPrice, maxPrice, debouncedSearch }), [tab, sort, availableOnly, categoryId, subCategoryId, minPrice, maxPrice, debouncedSearch]);
  const apiPath = searchMode ? `/api/go-market/restaurants/${restaurantId}/search` : `/api/go-market/restaurants/${restaurantId}/catalog`;

  const loadPage = useCallback(async (pageNum, append) => {
    if (!restaurantId) return;
    append ? setLoadingMore(true) : setLoading(true);
    const p = new URLSearchParams({
      page: String(pageNum),
      limit: "16",
      tab: state.tab,
      ...(state.sort ? { sort: state.sort } : {}),
      search: state.debouncedSearch,
      ...(state.availableOnly ? { availableOnly: "true" } : {}),
      ...(state.categoryId ? { categoryId: state.categoryId } : {}),
      ...(state.subCategoryId ? { subCategoryId: state.subCategoryId } : {}),
      ...(state.minPrice ? { minPrice: state.minPrice } : {}),
      ...(state.maxPrice ? { maxPrice: state.maxPrice } : {}),
    });
    if (searchMode && state.debouncedSearch) p.set("q", state.debouncedSearch);
    try {
      const res = await fetchDataFromApi(`${apiPath}?${p}`);
      if (res?.success || res?.error === false) {
        setItems((prev) => append ? [...prev, ...(res.data || [])] : (res.data || []));
        setFilterMeta(res.filterMeta || null);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotal(res.pagination?.total || 0);
        setPage(pageNum);
        onRestaurant?.(res.restaurant);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [restaurantId, apiPath, state, searchMode, onRestaurant]);

  useEffect(() => { loadPage(1, false); }, [loadPage]);

  useEffect(() => {
    if (!restaurantId || !search.trim()) return setSuggestions([]);
    const t = setTimeout(() => {
      fetchDataFromApi(`/api/go-market/restaurants/${restaurantId}/search-suggestions?q=${encodeURIComponent(search.trim())}`)
        .then((res) => setSuggestions((res?.success || res?.error === false) ? (res.suggestions || []) : []));
    }, 200);
    return () => clearTimeout(t);
  }, [restaurantId, search]);

  const hasMore = page < totalPages;
  const sentinelRef = useInfiniteScroll({ enabled: true, hasMore, loading: loading || loadingMore, onLoadMore: () => loadPage(page + 1, true) });
  const subCats = (filterMeta?.subCategories || []).filter((s) => !categoryId || String(s.parentId) === String(categoryId));
  const goSearch = (q) => {
    const query = (q || search).trim();
    if (!query) return;
    navigate(`/go-market/restaurant/${restaurantId}/search?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  return (
    <div>
      <div className="gmp-toolbar" style={{ position: "relative" }}>
        <form onSubmit={(e) => { e.preventDefault(); searchMode ? loadPage(1, false) : goSearch(); }} style={{ display: "flex", flex: 1, gap: 8, minWidth: 220 }}>
          <div className="gmp-input-wrap" style={{ flex: 1, position: "relative" }}>
            <span className="gmp-input-icon">🔍</span>
            <input className="gmp-input" value={search} placeholder="Search dishes in this restaurant…" onFocus={() => search.trim() && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 180)} onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }} />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, marginTop: 4, boxShadow: "0 12px 28px rgba(15,23,42,.12)", overflow: "hidden" }}>
                {suggestions.map((s) => <button key={s._id} type="button" style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: 0, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600 }} onMouseDown={() => goSearch(s.label)}>{s.label}</button>)}
              </div>
            )}
          </div>
          <button className="gmp-btn gmp-btn-primary" type="submit">Search</button>
        </form>
        <select className="gmp-select" style={{ width: "auto", minWidth: 160, paddingLeft: 12 }} value={sort} onChange={(e) => setSort(e.target.value)}>{SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <button type="button" className="gmp-btn gmp-btn-outline" onClick={() => setFilterOpen((v) => !v)}>Filters</button>
      </div>
      <div className="gmp-chip-row" style={{ marginTop: 12 }}>{TABS.map((t) => <button key={t.key} type="button" className={`gmp-chip${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>
      {filterOpen && <div className="gmp-toolbar" style={{ marginTop: 10, alignItems: "stretch", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          <select className="gmp-select" style={{ paddingLeft: 12 }} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(""); }}><option value="">All categories</option>{(filterMeta?.categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
          <select className="gmp-select" style={{ paddingLeft: 12 }} value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}><option value="">All sub categories</option>{subCats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
          <input className="gmp-input" style={{ height: 38, paddingLeft: 12 }} type="number" placeholder="Min ₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <input className="gmp-input" style={{ height: 38, paddingLeft: 12 }} type="number" placeholder="Max ₹" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}><input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} /> Available only</label>
      </div>}
      <ResultBar total={total} label="dishes" loading={loading && !items.length} />
      {loading && !items.length ? <SkeletonGrid count={8} type="product" /> : items.length === 0 ? <div className="gmp-empty"><span className="gmp-empty-icon">🍽️</span>No dishes found.</div> : <div className="gmp-product-grid">{items.map((item) => <Link to={`/go-market/product/restaurant/${item._id}`} className="gmp-product-tile" key={item._id}><img src={img(item.image)} alt={item.itemName} /><div className="gmp-product-body"><div className="gmp-product-name">{item.itemName}</div><div className="gmp-product-price"><b>₹{item.price}</b>{item.discountPrice > 0 && item.oldPrice > item.price && <del>₹{item.oldPrice}</del>}</div><div style={{ fontSize: 11, color: item.isAvailable === false ? "#dc2626" : "#16a34a", marginTop: 4 }}>{item.isAvailable === false ? "Unavailable" : `${item.soldCount || 0} sold`}</div></div></Link>)}</div>}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loadingMore && <p style={{ textAlign: "center", color: "#94a3b8", padding: 16, fontSize: 13 }}>Loading more…</p>}
      {!hasMore && items.length > 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 12, fontSize: 12 }}>End of list</p>}
    </div>
  );
}
