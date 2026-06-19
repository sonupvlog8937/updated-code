import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchDataFromApi, postData } from "../../utils/api";
import { img } from "../../utils/goMarketMedia";
import { ResultBar, SkeletonGrid, useDebouncedValue } from "./shared";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { addToCart, fetchMyListData } from "../../store/appSlice";
import { normalizeProductOptions } from "./GoMarketProductOptions";
import "./style.css"
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
  const dispatch = useDispatch();
  const { isLogin, userData, myListData } = useSelector((s) => s.app);
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
  const [optionProduct, setOptionProduct] = useState(null);
  const [quickSelections, setQuickSelections] = useState({});
  const [restaurantData, setRestaurantData] = useState(null);

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
        // Store restaurant data for isOpen check
        if (res.restaurant) {
          setRestaurantData(res.restaurant);
        }
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

  const optionGroups = normalizeProductOptions(optionProduct?.productOptions || []);
  const quickPrice = optionGroups.reduce((price, opt) => { const key = opt.name || opt.label; const found = (opt.values || []).find((v) => v.label === quickSelections[key] || v.value === quickSelections[key]); return Number(found?.price) > 0 ? Number(found.price) : price; }, Number(optionProduct?.price || 0));
  const quickOldPrice = optionGroups.reduce((oldPrice, opt) => { const key = opt.name || opt.label; const found = (opt.values || []).find((v) => v.label === quickSelections[key] || v.value === quickSelections[key]); return Number(found?.oldPrice) > 0 ? Number(found.oldPrice) : oldPrice; }, Number(optionProduct?.oldPrice || optionProduct?.price || 0));
  const addProductWithOptions = async (product, selectedOptions = {}, priceOverride = null) => {
    if (!isLogin) { toast.error("Please login first"); navigate("/login"); return; }
    // Check if restaurant is open
    if (restaurantData && restaurantData.isOpen === false) {
      toast.error("Restaurant is currently closed. You cannot add items to cart.");
      return;
    }
    const name = product.itemName || product.name;
    await dispatch(addToCart({ product: { _id: product._id, name, price: priceOverride ?? product.price, oldPrice: product.oldPrice || product.price, image: product.image, images: product.images || [product.image], countInStock: product.countInStock ?? 99, rating: product.rating || product.averageRating || 0, brand: product.brand || "GoMarket Restaurant", discount: product.discount, selectedOptions }, userId: userData?._id, quantity: 1 }));
  };
  const handleQuickAdd = (e, product) => { e.preventDefault(); e.stopPropagation(); const options = normalizeProductOptions(product.productOptions || []); if (options.length) { setOptionProduct(product); setQuickSelections({}); return; } addProductWithOptions(product); };
  const handleQuickWishlist = async (e, product) => { e.preventDefault(); e.stopPropagation(); if (!isLogin) { toast.error("Please login first"); navigate("/login"); return; } if (myListData?.some((item) => item?.productId === product._id)) { toast.success("Already in wishlist"); return; } const name = product.itemName || product.name; const res = await postData("/api/myList/add", { productTitle: name, image: product.image, rating: product.rating || product.averageRating || 0, price: product.price, oldPrice: product.oldPrice || product.price, productId: product._id, brand: product.brand || "GoMarket Restaurant", discount: product.discount }); if (res?.error === false) { toast.success("Added to wishlist"); dispatch(fetchMyListData()); } else toast.error(res?.message || "Wishlist failed"); };
  const confirmOptionAdd = () => { if (!optionGroups.every((opt) => quickSelections[opt.name || opt.label])) { toast.error("Select all options"); return; } addProductWithOptions(optionProduct, quickSelections, quickPrice); setOptionProduct(null); setQuickSelections({}); };

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
      {loading && !items.length ? (
        <SkeletonGrid count={8} type="product" />
      ) : items.length === 0 ? (
        <div className="gmp-empty"><span className="gmp-empty-icon">🍽️</span>No dishes found.</div>
      ) : (
        <div className="gmp-product-grid">
          {items.map((item) => {
            const discountPct = item.oldPrice > item.price
              ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
              : item.discount || 0;
            const rating = Number(item.rating || item.averageRating || 0);
            const reviewCount = item.reviewCount || item.totalReviews || 0;
            return (
              <Link to={`/go-market/product/restaurant/${item._id}`} className="gmp-product-tile" key={item._id}>
                <div className="gmp-tile-img-wrap">
                  <img src={img(item.image)} alt={item.itemName} />
                  {discountPct > 0 && (
                    <span className="gmp-tile-badge">{discountPct}% OFF</span>
                  )}
                  {item.isAvailable === false && (
                    <div className="gmp-tile-oos-overlay">Unavailable</div>
                  )}
                </div>
                <button className="gmp-card-icon gmp-card-heart" onClick={(e) => handleQuickWishlist(e, item)}>♡</button>
                <button 
                  className="gmp-card-icon gmp-card-plus" 
                  onClick={(e) => handleQuickAdd(e, item)}
                  disabled={restaurantData && restaurantData.isOpen === false}
                  style={{ 
                    opacity: restaurantData && restaurantData.isOpen === false ? 0.5 : 1,
                    cursor: restaurantData && restaurantData.isOpen === false ? 'not-allowed' : 'pointer'
                  }}
                >+</button>
                <div className="gmp-product-body">
                  <div className="gmp-product-name">{item.itemName}</div>
                  {item.description && (
                    <div className="gmp-tile-desc">{item.description}</div>
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
                    <span className="gmp-tile-price">₹{item.price}</span>
                    {item.oldPrice > item.price && (
                      <del className="gmp-tile-mrp">₹{item.oldPrice}</del>
                    )}
                    {discountPct > 0 && (
                      <span className="gmp-tile-save">Save ₹{item.oldPrice - item.price}</span>
                    )}
                  </div>
                  <div className="gmp-tile-stock" style={{ color: item.isAvailable === false ? "#dc2626" : "#16a34a" }}>
                    {item.isAvailable === false ? "✕ Unavailable" : `✓ ${item.soldCount || 0} sold`}
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
                {optionProduct.image && <img src={img(optionProduct.image)} alt={optionProduct.itemName || optionProduct.name} />}
              </div>
              <div className="gmp-option-sheet-meta">
                <h3 className="gmp-option-sheet-title">{optionProduct.itemName || optionProduct.name}</h3>
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
                  {quickOldPrice > quickPrice && (
                    <del className="gmp-tile-mrp">₹{quickOldPrice}</del>
                  )}
                  {(() => {
                    const discountPct = quickOldPrice > quickPrice 
                      ? Math.round(((quickOldPrice - quickPrice) / quickOldPrice) * 100) 
                      : optionProduct.discount || 0;
                    return discountPct > 0 ? (
                      <span className="gmp-tile-badge" style={{ position: "static", marginLeft: 6 }}>{discountPct}% OFF</span>
                    ) : null;
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
                    const optOldPrice = v.oldPrice || optionProduct.oldPrice || optionProduct.price;
                    return (
                      <button
                        key={v.value || v.label}
                        type="button"
                        className={`gmp-option-chip${quickSelections[opt.name || opt.label] === v.label ? " active" : ""}`}
                        onClick={() => setQuickSelections((prev) => ({ ...prev, [opt.name || opt.label]: v.label }))}
                      >
                        <span>{v.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="gmp-chip-price">₹{optPrice}</span>
                          {optOldPrice > optPrice && (
                            <del style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>₹{optOldPrice}</del>
                          )}
                        </div>
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
      {loadingMore && <p style={{ textAlign: "center", color: "#94a3b8", padding: 16, fontSize: 13 }}>Loading more…</p>}
      {!hasMore && items.length > 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 12, fontSize: 12 }}>End of list</p>}
    </div>
  );
}