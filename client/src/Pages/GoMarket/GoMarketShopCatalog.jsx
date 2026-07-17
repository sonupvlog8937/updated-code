import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchDataFromApi, postData } from "../../utils/api";
import { img } from "../../utils/goMarketMedia";
import { useDebouncedValue, SkeletonGrid, ResultBar } from "./shared";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { addToCart, fetchMyListData } from "../../store/appSlice";
import { normalizeProductOptions } from "./GoMarketProductOptions";
import "./style.css"

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
    search: state.appliedSearch,
    ...(state.inStock ? { inStock: "true" } : {}),
    ...(state.categoryId ? { categoryId: state.categoryId } : {}),
    ...(state.subCategoryId ? { subCategoryId: state.subCategoryId } : {}),
    ...(state.subSubCategoryId ? { subSubCategoryId: state.subSubCategoryId } : {}),
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
  const dispatch = useDispatch();
  const { isLogin, userData, myListData } = useSelector((s) => s.app);
  const [search, setSearch] = useState(initialQuery);
  const debouncedSearch = useDebouncedValue(search, 350);
  const [appliedSearch, setAppliedSearch] = useState(initialQuery);
  const [tab, setTab] = useState("featured");
  const [sort, setSort] = useState("");
  const [inStock, setInStock] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [subSubCategoryId, setSubSubCategoryId] = useState("");
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

  const [suggestions, setSuggestions] = useState({ 
    suggestions: [], 
    recentSearches: [], 
    trendingSearches: [], 
    popularProducts: [],
    topSearches: []
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [optionProduct, setOptionProduct] = useState(null);
  const [quickSelections, setQuickSelections] = useState({});
  const [shopData, setShopData] = useState(null);

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
      appliedSearch,
      inStock,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      minPrice,
      maxPrice,
      minRating,
    }),
    [tab, sort, appliedSearch, inStock, categoryId, subCategoryId, subSubCategoryId, minPrice, maxPrice, minRating],
  );

  const apiPath = searchMode
    ? `/api/go-market/grocery-shops/${shopId}/search`
    : `/api/go-market/grocery-shops/${shopId}/catalog`;

  const loadPage = useCallback(
    async (pageNum, append) => {
      if (!shopId) return;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setProducts([]); // clear immediately so skeleton shows on tab change
      }

      const params = buildParams(filterState, pageNum);
      if (searchMode && appliedSearch) params.set("q", appliedSearch);

      try {
        const res = await fetchDataFromApi(`${apiPath}?${params}`);
        if (res?.success || res?.error === false) {
          const rows = res.data || [];
          setFilterMeta(res.filterMeta || null);
          setProducts((prev) => (append ? [...prev, ...rows] : rows));
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total ?? rows.length);
          setPage(pageNum);
          // Store shop data for isOpen check
          if (res.shop) {
            setShopData(res.shop);
          }
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [shopId, apiPath, searchMode, appliedSearch, filterState],
  );

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  // Enhanced suggestions with recent searches, trending, etc.
  useEffect(() => {
    if (!shopId) return;
    
    if (!search.trim()) {
      // Show default content when not searching
      fetchDataFromApi(`/api/go-market/grocery-shops/${shopId}/search-defaults`).then((res) => {
        if (res?.success || res?.error === false) {
          setSuggestions(res.data || {
            recentSearches: [],
            trendingSearches: [],
            popularProducts: [],
            topSearches: []
          });
        }
      });
      return;
    }
    
    const t = setTimeout(() => {
      fetchDataFromApi(
        `/api/go-market/grocery-shops/${shopId}/search-suggestions?q=${encodeURIComponent(search.trim())}`,
      ).then((res) => {
        if (res?.success || res?.error === false) {
          setSuggestions(res.data || res.suggestions || []);
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
    subSubCategoryId,
    minPrice,
    maxPrice,
    inStock,
    minRating > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setCategoryId("");
    setSubCategoryId("");
    setSubSubCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setInStock(false);
  };

  const goToSearchPage = (q) => {
    const query = (q || search).trim();
    if (!query) return;
    setAppliedSearch(query);
    if (searchMode) {
      // In search mode, just apply the search to trigger filtering
      setShowSuggestions(false);
    } else {
      // Navigate to search page
      navigate(`/go-market/shop/${shopId}/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };

  const subCatsForCategory = (filterMeta?.subCategories || []).filter(
    (sc) => !categoryId || String(sc.parentId || sc.categoryId) === String(categoryId),
  );
  const subSubCatsForSubCategory = (filterMeta?.subSubCategories || []).filter(
    (ssc) => !subCategoryId || String(ssc.subCategoryId) === String(subCategoryId),
  );

  const optionGroups = normalizeProductOptions(optionProduct?.productOptions || []);
  
  // Calculate price and MRP based on selected options
  const getSelectedOptionData = () => {
    let price = Number(optionProduct?.price || 0);
    let oldPrice = optionProduct?.oldPrice || optionProduct?.mrp || optionProduct?.price || 0;
    
    optionGroups.forEach((opt) => {
      const key = opt.name || opt.label;
      const selectedLabel = quickSelections[key];
      if (selectedLabel) {
        const found = (opt.values || []).find((v) => v.label === selectedLabel || v.value === selectedLabel);
        if (found) {
          if (Number(found.price) > 0) {
            price = Number(found.price);
          }
          if (Number(found.oldPrice) > 0) {
            oldPrice = Number(found.oldPrice);
          }
        }
      }
    });
    
    return { price, oldPrice };
  };
  
  const { price: quickPrice, oldPrice: quickOldPrice } = optionProduct ? getSelectedOptionData() : { price: 0, oldPrice: 0 };
  const addProductWithOptions = async (product, selectedOptions = {}, priceOverride = null) => {
    if (!isLogin) { toast.error("Please login first"); navigate("/login"); return; }
    // Check if shop is open
    if (shopData && shopData.isOpen === false) {
      toast.error("Shop is currently closed. You cannot add items to cart.");
      return;
    }
    const cartProduct = { _id: product._id, name: product.name, price: priceOverride ?? (product.discountPrice > 0 ? product.discountPrice : product.price), oldPrice: product.oldPrice || product.price, image: product.image, images: product.images || [product.image], countInStock: product.countInStock ?? product.stock ?? 99, rating: product.rating || product.averageRating || 0, brand: product.brand || "GoMarket", source: "goMarket", discount: product.discount, selectedOptions };
    await dispatch(addToCart({ product: cartProduct, userId: userData?._id, quantity: 1 }));
  };
  const handleQuickAdd = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    const options = normalizeProductOptions(product.productOptions || []);
    if (options.length) { setOptionProduct(product); setQuickSelections({}); return; }
    addProductWithOptions(product);
  };
  const handleQuickWishlist = async (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (!isLogin) { toast.error("Please login first"); navigate("/login"); return; }
    if (myListData?.some((item) => item?.productId === product._id)) { toast.success("Already in wishlist"); return; }
    const res = await postData("/api/myList/add", { productTitle: product.name, image: product.image, rating: product.rating || product.averageRating || 0, price: product.discountPrice > 0 ? product.discountPrice : product.price, oldPrice: product.oldPrice || product.price, productId: product._id, brand: product.brand || "GoMarket", discount: product.discount });
    if (res?.error === false) { toast.success("Added to wishlist"); dispatch(fetchMyListData()); } else toast.error(res?.message || "Wishlist failed");
  };
  const confirmOptionAdd = () => {
    const complete = optionGroups.every((opt) => quickSelections[opt.name || opt.label]);
    if (!complete) { toast.error("Select all options"); return; }
    addProductWithOptions(optionProduct, quickSelections, quickPrice);
    setOptionProduct(null); setQuickSelections({});
  };


  return (
    <div>
      <div className="gmp-toolbar" style={{ position: "relative" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedSearch(search.trim());
            setShowSuggestions(false);
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
              onFocus={() => {
                setShowSuggestions(true);
                // Load defaults if no search query
                if (!search.trim()) {
                  fetchDataFromApi(`/api/go-market/grocery-shops/${shopId}/search-defaults`).then((res) => {
                    if (res?.success || res?.error === false) {
                      setSuggestions(res.data || {});
                    }
                  });
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
              placeholder="Search products in this shop…"
            />
            {showSuggestions && (
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
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {suggestionsLoading && (
                  <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 13 }}>
                    Searching...
                  </div>
                )}
                
                {/* When searching - show suggestions */}
                {search.trim() ? (
                  <>
                    {suggestions.suggestions?.length > 0 && (
                      <>
                        <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Suggestions
                        </div>
                        {suggestions.suggestions.map((s) => (
                          <button
                            key={s._id || s.label || s}
                            type="button"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 14px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              transition: "background 0.13s",
                            }}
                            onMouseDown={() => {
                              const query = s.label || s;
                              goToSearchPage(query);
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f7"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ fontSize: 14 }}>🔍</span>
                            <span>{s.label || s}</span>
                          </button>
                        ))}
                      </>
                    )}
                    
                    {suggestions.popularProducts?.length > 0 && (
                      <>
                        <div style={{ height: 1, background: "#f0f0f0", margin: "4px 0" }} />
                        <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Popular Products
                        </div>
                        {suggestions.popularProducts.slice(0, 5).map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              textAlign: "left",
                              padding: "8px 14px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              transition: "background 0.13s",
                            }}
                            onMouseDown={() => {
                              navigate(`/go-market/product/grocery/${p._id}`);
                              setShowSuggestions(false);
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f7"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 6, background: "#f0f0f5", flexShrink: 0, overflow: "hidden" }}>
                              {p.image && <img src={img(p.image)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                ₹{p.price}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  /* When not searching - show recent, trending, popular */
                  <>
                    {suggestions.recentSearches?.length > 0 && (
                      <>
                        <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          🕒 Recent Searches
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "4px 10px 8px" }}>
                          {suggestions.recentSearches.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 12px",
                                borderRadius: 20,
                                background: "#eef1ff",
                                border: "none",
                                fontSize: 12.5,
                                color: "#4a6cf7",
                                cursor: "pointer",
                                fontWeight: 500,
                                transition: "background 0.13s",
                              }}
                              onMouseDown={() => goToSearchPage(item)}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#dde3ff"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "#eef1ff"}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                        <div style={{ height: 1, background: "#f0f0f0", margin: "4px 0" }} />
                      </>
                    )}
                    
                    {suggestions.trendingSearches?.length > 0 && (
                      <>
                        <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          🔥 Trending in this shop
                        </div>
                        {suggestions.trendingSearches.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              textAlign: "left",
                              padding: "9px 14px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: 14,
                              color: "#1a1a2e",
                              transition: "background 0.13s",
                            }}
                            onMouseDown={() => goToSearchPage(item)}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f7"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              width: 30, 
                              height: 30, 
                              borderRadius: 8, 
                              background: "#fff2f0", 
                              color: "#e74c3c",
                              fontSize: 13,
                              flexShrink: 0
                            }}>
                              🔥
                            </span>
                            <span>{item}</span>
                          </button>
                        ))}
                        <div style={{ height: 1, background: "#f0f0f0", margin: "4px 0" }} />
                      </>
                    )}
                    
                    {suggestions.topSearches?.length > 0 && (
                      <>
                        <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          ⭐ Top Searches
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "4px 10px 8px" }}>
                          {suggestions.topSearches.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 12px",
                                borderRadius: 20,
                                background: "#fff0f5",
                                border: "1px solid #ffd6e8",
                                fontSize: 12.5,
                                color: "#e91e8c",
                                cursor: "pointer",
                                fontWeight: 500,
                                transition: "background 0.13s",
                              }}
                              onMouseDown={() => goToSearchPage(item)}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#ffe0ed"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "#fff0f5"}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    
                    {suggestions.popularProducts?.length > 0 && (
                      <>
                        <div style={{ height: 1, background: "#f0f0f0", margin: "4px 0" }} />
                        <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Popular Products
                        </div>
                        {suggestions.popularProducts.slice(0, 6).map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              textAlign: "left",
                              padding: "8px 14px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              transition: "background 0.13s",
                            }}
                            onMouseDown={() => {
                              navigate(`/go-market/product/grocery/${p._id}`);
                              setShowSuggestions(false);
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f7"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f0f0f5", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {p.image ? (
                                <img src={img(p.image)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                "🛍️"
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                                ₹{p.price}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
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
                setSubSubCategoryId("");
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
              onChange={(e) => { setSubCategoryId(e.target.value); setSubSubCategoryId(""); }}
              disabled={!categoryId && !(filterMeta?.subCategories || []).length}
            >
              <option value="">All sub categories</option>
              {subCatsForCategory.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.name}
                </option>
              ))}
            </select>
            <select className="gmp-select" style={{ paddingLeft: 12 }} value={subSubCategoryId} onChange={(e) => setSubSubCategoryId(e.target.value)} disabled={!subCategoryId}>
              <option value="">All sub sub categories</option>
              {subSubCatsForSubCategory.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
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
            // Server sends: price = selling price, oldPrice/mrp = original MRP
            const sellingPrice = p.price || 0;
            const mrp = p.oldPrice || p.mrp || p.price;
            const hasDiscount = mrp > sellingPrice && sellingPrice > 0;
            const discountPct = p.discount || (hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0);
            const saveAmount = hasDiscount ? mrp - sellingPrice : 0;
            const rating = Number(p.rating || p.averageRating || 0);
            const reviewCount = p.reviewCount || p.totalReviews || 0;
            
            return (
              <Link to={`/go-market/product/grocery/${p._id}`} className="gmp-product-tile" key={p._id}>
                <div className="gmp-tile-img-wrap">
                  <img src={img(p.image)} alt={p.name} />
                  {discountPct > 0 && (
                    <span className="gmp-tile-badge">{discountPct}% OFF</span>
                  )}
                  {p.stock === 0 && (
                    <div className="gmp-tile-oos-overlay">Out of Stock</div>
                  )}
                </div>
                <button className="gmp-card-icon gmp-card-heart" onClick={(e) => handleQuickWishlist(e, p)}>♡</button>
                <button 
                  className="gmp-card-icon gmp-card-plus" 
                  onClick={(e) => handleQuickAdd(e, p)}
                  disabled={shopData && shopData.isOpen === false}
                  style={{ 
                    opacity: shopData && shopData.isOpen === false ? 0.5 : 1,
                    cursor: shopData && shopData.isOpen === false ? 'not-allowed' : 'pointer'
                  }}
                >+</button>
                <div className="gmp-product-body">
                  {p.brand && <div className="gmp-tile-brand">{p.brand}</div>}
                  <div className="gmp-product-name">{p.name}</div>
                  {p.description && (
                    <div className="gmp-tile-desc">{p.description}</div>
                  )}
                  {rating > 0 && (
                    <div className="gmp-tile-rating">
                      <span className="gmp-tile-stars">
                        {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
                      </span>
                      <span className="gmp-tile-rating-val">{rating.toFixed(1)}</span>
                      {reviewCount > 0 && <span className="gmp-tile-review-count">({reviewCount})</span>}
                    </div>
                  )}
                  <div className="gmp-tile-price-row">
                    <span className="gmp-tile-price">₹{sellingPrice}</span>
                    {hasDiscount && mrp > sellingPrice && (
                      <>
                        <del className="gmp-tile-mrp">₹{mrp}</del>
                        {saveAmount > 0 && (
                          <span className="gmp-tile-save">Save ₹{saveAmount}</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="gmp-tile-stock" style={{ color: p.stock > 0 ? "#16a34a" : "#dc2626" }}>
                    {p.stock > 0 ? `✓ ${p.stock} in stock` : "✕ Out of stock"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {optionProduct && (
        <div className="gmp-option-modal" onClick={() => setOptionProduct(null)}>
          <div className="gmp-option-sheet" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <button 
              onClick={() => setOptionProduct(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#64748b',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#334155';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="gmp-option-sheet-header">
              <div className="gmp-option-sheet-img">
                {optionProduct.image && <img src={img(optionProduct.image)} alt={optionProduct.name} />}
              </div>
              <div className="gmp-option-sheet-meta">
                {optionProduct.brand && <div className="gmp-tile-brand">{optionProduct.brand}</div>}
                <h3 className="gmp-option-sheet-title">{optionProduct.name}</h3>
                {optionProduct.description && (
                  <p className="gmp-option-sheet-desc">{optionProduct.description}</p>
                )}
                {(() => {
                  const r = Number(optionProduct.rating || optionProduct.averageRating || 0);
                  const rc = optionProduct.reviewCount || optionProduct.totalReviews || 0;
                  return r > 0 ? (
                    <div className="gmp-tile-rating" style={{ marginTop: 4 }}>
                      <span className="gmp-tile-stars">{"★".repeat(Math.round(r))}{"☆".repeat(5 - Math.round(r))}</span>
                      <span className="gmp-tile-rating-val">{r.toFixed(1)}</span>
                      {rc > 0 && <span className="gmp-tile-review-count">({rc} reviews)</span>}
                    </div>
                  ) : null;
                })()}
                <div className="gmp-tile-price-row" style={{ marginTop: 6 }}>
                  <span className="gmp-pd-price">₹{quickPrice}</span>
                  {(() => {
                    const hasDiscount = quickOldPrice > quickPrice;
                    const discountPct = hasDiscount ? Math.round(((quickOldPrice - quickPrice) / quickOldPrice) * 100) : (optionProduct.discount || 0);
                    return (
                      <>
                        {hasDiscount && quickOldPrice > quickPrice && (
                          <del className="gmp-tile-mrp">₹{quickOldPrice}</del>
                        )}
                        {discountPct > 0 && (
                          <span className="gmp-tile-badge" style={{ position: "static", marginLeft: 6 }}>{discountPct}% OFF</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <p className="gmp-option-sheet-hint">Select options — price updates dynamically</p>
            {optionGroups.map((opt) => (
              <div key={opt.name || opt.label} className="gmp-option-group">
                <b className="gmp-option-group-label">{opt.label || opt.name}</b>
                <div className="gmp-option-chips">
                  {opt.values.map((v) => {
                    const optPrice = v.price || optionProduct.price;
                    const optOldPrice = v.oldPrice || optionProduct.oldPrice || optionProduct.mrp || optionProduct.price;
                    const hasOptDiscount = optOldPrice > optPrice;
                    
                    return (
                      <button
                        key={v.value || v.label}
                        type="button"
                        className={`gmp-option-chip${quickSelections[opt.name || opt.label] === v.label ? " active" : ""}`}
                        onClick={() => setQuickSelections((prev) => ({ ...prev, [opt.name || opt.label]: v.label }))}
                      >
                        <span>{v.label}</span>
                        <span className="gmp-chip-price">
                          ₹{optPrice}
                          {hasOptDiscount && (
                            <del style={{ marginLeft: 6, fontSize: 10, opacity: 0.6 }}>₹{optOldPrice}</del>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="gmp-option-sheet-footer">
              <div className="gmp-option-total">
                <span>Total</span>
                <span className="gmp-pd-price">₹{quickPrice}</span>
              </div>
              <button className="gmp-btn gmp-btn-primary" style={{ flex: 1 }} onClick={confirmOptionAdd}>
                🛒 Add to Cart
              </button>
            </div>
          </div>
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