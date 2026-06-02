import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchDataFromApi } from "../../utils/api";
import { img } from "../../utils/goMarketMedia";
import { useDebouncedValue, SkeletonGrid, ResultBar } from "./shared";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";

const SORT_OPTIONS = [
  { value: "", label: "Smart tab order" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
  { value: "stock", label: "In stock first" },
];

const TABS = [
  { key: "featured", label: "Featured" },
  { key: "popular", label: "Popular" },
  { key: "latest", label: "Latest" },
];

const buildParams = (state, page) => {
  const p = new URLSearchParams({
    page: String(page),
    limit: "16",
    tab: state.tab,
    ...(state.sort ? { sort: state.sort } : {}),
    search: state.debouncedSearch,
    ...(state.inStock ? { inStock: "true" } : {}),
    ...(state.categoryId ? { categoryId: state.categoryId } : {}),
    ...(state.subCategoryId ? { subCategoryId: state.subCategoryId } : {}),
    ...(state.minPrice ? { minPrice: state.minPrice } : {}),
    ...(state.maxPrice ? { maxPrice: state.maxPrice } : {}),
    ...(state.minRating > 0 ? { minRating: String(state.minRating) } : {}),
  });
  return p;
};

/**
 * Shared grocery shop product catalog: tabs, filters, search suggestions, infinite scroll.
 */
export const GoMarketShopCatalog = ({
  shopId,
  searchMode = false,
  initialQuery = "",
  onQueryChange,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState(initialQuery);
  const debouncedSearch = useDebouncedValue(search, 350);
  const [tab, setTab] = useState("featured");
  const [sort, setSort] = useState("");
  const [inStock, setInStock] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [filterMeta, setFilterMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    onQueryChange?.(search);
  }, [search, onQueryChange]);

  const filterState = useMemo(
    () => ({
      tab,
      sort,
      debouncedSearch,
      inStock,
      categoryId,
      subCategoryId,
      minPrice,
      maxPrice,
      minRating,
    }),
    [tab, sort, debouncedSearch, inStock, categoryId, subCategoryId, minPrice, maxPrice, minRating],
  );

  const apiPath = searchMode
    ? `/api/go-market/grocery-shops/${shopId}/search`
    : `/api/go-market/grocery-shops/${shopId}/catalog`;

  const loadPage = useCallback(
    async (pageNum, append) => {
      if (!shopId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);

      const params = buildParams(filterState, pageNum);
      if (searchMode && debouncedSearch) params.set("q", debouncedSearch);

      try {
        const res = await fetchDataFromApi(`${apiPath}?${params}`);
        if (res?.success || res?.error === false) {
          const rows = res.data || [];
          setFilterMeta(res.filterMeta || null);
          setProducts((prev) => (append ? [...prev, ...rows] : rows));
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total ?? rows.length);
          setPage(pageNum);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [shopId, apiPath, searchMode, debouncedSearch, filterState],
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
        if (res?.success || res?.error === false) {
          setSuggestions(res.suggestions || []);
        }
      });
    }, 200);
    return () => clearTimeout(t);
  }, [shopId, search]);

  const hasMore = page < totalPages;
  const sentinelRef = useInfiniteScroll({
    enabled: true,
    hasMore,
    loading: loading || loadingMore,
    onLoadMore: () => loadPage(page + 1, true),
  });

  const activeFilterCount = [
    categoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    inStock,
    minRating > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setCategoryId("");
    setSubCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setInStock(false);
  };

  const goToSearchPage = (q) => {
    const query = (q || search).trim();
    if (!query) return;
    navigate(`/go-market/shop/${shopId}/search?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  const subCatsForCategory = (filterMeta?.subCategories || []).filter(
    (sc) => !categoryId || String(sc.parentId) === String(categoryId),
  );

  return (
    <div>
      <div className="gmp-toolbar" style={{ position: "relative" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchMode) loadPage(1, false);
            else goToSearchPage();
          }}
          style={{ display: "flex", flex: 1, gap: 8, minWidth: 200 }}
        >
          <div className="gmp-input-wrap" style={{ flex: 1, position: "relative" }}>
            <span className="gmp-input-icon">🔍</span>
            <input
              className="gmp-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => search.trim() && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
              placeholder="Search products in this shop…"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  marginTop: 4,
                  boxShadow: "0 12px 28px rgba(15,23,42,0.12)",
                  overflow: "hidden",
                }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    onMouseDown={() => goToSearchPage(s.label)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="gmp-btn gmp-btn-primary">
            Search
          </button>
        </form>

        <select
          className="gmp-select"
          style={{ width: "auto", minWidth: 160, paddingLeft: 12 }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="gmp-btn gmp-btn-outline"
          onClick={() => setFilterOpen((o) => !o)}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      {filterOpen && (
        <div
          className="gmp-toolbar"
          style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}
        >
          <div className="gmp-chip-row">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`gmp-chip${tab === t.key ? " active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            <select
              className="gmp-select"
              style={{ paddingLeft: 12 }}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubCategoryId("");
              }}
            >
              <option value="">All categories</option>
              {(filterMeta?.categories || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="gmp-select"
              style={{ paddingLeft: 12 }}
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value)}
              disabled={!categoryId && !(filterMeta?.subCategories || []).length}
            >
              <option value="">All sub categories</option>
              {subCatsForCategory.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.name}
                </option>
              ))}
            </select>
            <input
              className="gmp-input"
              style={{ height: 38, paddingLeft: 12 }}
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              className="gmp-input"
              style={{ height: 38, paddingLeft: 12 }}
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <select
              className="gmp-select"
              style={{ paddingLeft: 12 }}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
            >
              <option value={0}>Any rating</option>
              <option value={4}>4★ & up</option>
              <option value={3}>3★ & up</option>
              <option value={2}>2★ & up</option>
            </select>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
              In stock only
            </label>
            <button type="button" className="gmp-btn gmp-btn-outline" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        </div>
      )}

      {!filterOpen && (
        <div className="gmp-chip-row" style={{ marginTop: 12 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`gmp-chip${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <ResultBar total={total} label="products" loading={loading && !products.length} />

      {loading && !products.length ? (
        <SkeletonGrid count={8} type="product" />
      ) : products.length === 0 ? (
        <div className="gmp-empty">
          <span className="gmp-empty-icon">📦</span>
          No products found.
        </div>
      ) : (
        <div className="gmp-product-grid">
          {products.map((p) => {
            const price = p.discountPrice > 0 ? p.discountPrice : p.price;
            return (
              <Link to={`/go-market/product/grocery/${p._id}`} className="gmp-product-tile" key={p._id}>
                <img src={img(p.image)} alt={p.name} />
                <div className="gmp-product-body">
                  <div className="gmp-product-name">{p.name}</div>
                  <div className="gmp-product-price">
                    <b>₹{price}</b>
                    {p.discountPrice > 0 && p.price > p.discountPrice && <del>₹{p.price}</del>}
                  </div>
                  <div style={{ fontSize: 11, color: p.stock > 0 ? "#16a34a" : "#dc2626", marginTop: 4 }}>
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} style={{ height: 1 }} />
      {loadingMore && (
        <p style={{ textAlign: "center", color: "#94a3b8", padding: 16, fontSize: 13 }}>Loading more…</p>
      )}
      {!hasMore && products.length > 0 && (
        <p style={{ textAlign: "center", color: "#94a3b8", padding: 12, fontSize: 12 }}>End of list</p>
      )}
    </div>
  );
};

export default GoMarketShopCatalog;
