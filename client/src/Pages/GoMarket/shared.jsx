import React from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { GO_MARKET_FALLBACK, img as gmImg } from "../../utils/goMarketMedia";

export const fallback = GO_MARKET_FALLBACK;
export const img = gmImg;
export const count = (v) => (Array.isArray(v) ? v.length : Number(v || 0));

export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
.gmp-root * { box-sizing: border-box; }
.gmp-root { font-family: 'DM Sans', system-ui, sans-serif; font-size: 14px; color: #0f172a; background: #f8fafc; min-height: 100vh; padding-bottom: 48px; }
.gmp-container { max-width: 1180px; margin: 0 auto; padding: 0 20px; }
.gmp-hero { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: #fff; padding: 32px 0 28px; }
.gmp-hero h1 { font-size: 28px; font-weight: 800; margin: 8px 0 6px; letter-spacing: -0.5px; }
.gmp-hero p { color: #cbd5e1; font-size: 14px; max-width: 520px; line-height: 1.55; }
.gmp-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; }
.gmp-tools { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; margin-top: 20px; }
@media (max-width: 720px) { .gmp-tools { grid-template-columns: 1fr; } }
.gmp-input-wrap { position: relative; }
.gmp-input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: 0.5; }
.gmp-input, .gmp-select { width: 100%; height: 42px; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 14px 0 38px; font-size: 14px; outline: none; background: #fff; color: #0f172a; }
.gmp-select { padding-left: 14px; cursor: pointer; }
.gmp-input:focus, .gmp-select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
.gmp-btn { height: 42px; padding: 0 18px; border-radius: 12px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.gmp-btn-primary { background: #2563eb; color: #fff; }
.gmp-btn-primary:hover { background: #1d4ed8; }
.gmp-btn-outline { background: #fff; color: #334155; border: 1.5px solid #e2e8f0; }
.gmp-btn-outline:hover { border-color: #94a3b8; }
.gmp-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: transform .15s, box-shadow .15s; display: block; }
.gmp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,23,42,0.1); }
.gmp-card-banner { width: 100%; height: 130px; object-fit: cover; display: block; background: #e2e8f0; }
.gmp-card-body { padding: 14px; }
.gmp-card-title { font-size: 15px; font-weight: 700; color: #0f172a; }
.gmp-card-addr { font-size: 12px; color: #64748b; margin-top: 3px; }
.gmp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; margin-top: 16px; }
.gmp-product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
.gmp-product-tile { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; display: block; transition: box-shadow .15s; }
.gmp-product-tile:hover { box-shadow: 0 8px 20px rgba(15,23,42,0.08); }
.gmp-product-tile img { width: 100%; aspect-ratio: 1; object-fit: cover; background: #f1f5f9; }
.gmp-product-body { padding: 10px 12px 12px; }
.gmp-product-name { font-size: 13px; font-weight: 600; line-height: 1.35; min-height: 36px; }
.gmp-product-price b { font-size: 15px; color: #0f172a; }
.gmp-product-price del { font-size: 11px; color: #94a3b8; margin-left: 6px; }
.gmp-toolbar { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin: 16px 0; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.gmp-toolbar .gmp-input { height: 38px; flex: 1; min-width: 180px; }
.gmp-chip-row { display: flex; gap: 8px; overflow-x: auto; overflow-y: hidden; flex-wrap: nowrap; padding-bottom: 4px; scrollbar-width: thin; }
.gmp-chip-row::-webkit-scrollbar { height: 4px; }
.gmp-chip-row::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 2px; }
.gmp-chip-row::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
.gmp-chip-row::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
.gmp-chip { padding: 6px 12px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; font-size: 12px; font-weight: 600; cursor: pointer; color: #475569; white-space: nowrap; flex-shrink: 0; }
.gmp-chip.active { background: #0f172a; color: #fff; border-color: #0f172a; }
.gmp-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 24px; flex-wrap: wrap; }
.gmp-page-btn { min-width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; font-weight: 600; cursor: pointer; }
.gmp-page-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; }
.gmp-page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.gmp-empty { text-align: center; padding: 48px 20px; color: #94a3b8; }
.gmp-empty-icon { font-size: 40px; display: block; margin-bottom: 10px; }
.gmp-status { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
.gmp-status.open { background: #dcfce7; color: #166534; }
.gmp-status.closed { background: #fee2e2; color: #991b1b; }
.gmp-breadcrumb { display: flex; gap: 8px; align-items: center; font-size: 12px; color: #64748b; margin: 16px 0 0; flex-wrap: wrap; }
.gmp-breadcrumb a { color: #2563eb; text-decoration: none; font-weight: 600; }
.gmp-market-banner { height: 200px; border-radius: 16px; background-size: cover; background-position: center; position: relative; overflow: hidden; margin-top: 12px; }
.gmp-market-banner-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.7), transparent); display: flex; align-items: flex-end; padding: 20px; color: #fff; }
.gmp-market-banner h2 { font-size: 22px; font-weight: 800; }
.gmp-detail-banner { width: 100%; height: 220px; object-fit: cover; display: block; }
.gmp-detail-head { background: #fff; border-bottom: 1px solid #e2e8f0; }
.gmp-detail-info { max-width: 1180px; margin: 0 auto; padding: 0 20px 20px; display: flex; gap: 16px; margin-top: -40px; position: relative; }
.gmp-detail-logo { width: 88px; height: 88px; border-radius: 16px; border: 4px solid #fff; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,.1); }
.gmp-detail-body h1 { font-size: 24px; font-weight: 800; margin-top: 44px; }
.gmp-meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.gmp-meta-chip { font-size: 12px; background: #f1f5f9; padding: 5px 10px; border-radius: 8px; color: #475569; }
.gmp-pd-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; margin-top: 20px; }
@media (max-width: 900px) { .gmp-pd-grid { grid-template-columns: 1fr; } }
.gmp-pd-gallery img { width: 100%; border-radius: 16px; aspect-ratio: 1; object-fit: cover; background: #f1f5f9; }
.gmp-pd-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; }
.gmp-option-group { margin-bottom: 14px; }
.gmp-option-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
.gmp-option-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.gmp-option-chip { padding: 8px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; color: #334155; }
.gmp-option-chip.active { background: #0f172a; color: #fff; border-color: #0f172a; }
.gmp-option-chip:disabled { opacity: 0.45; cursor: not-allowed; }
.gmp-pd-price { font-size: 28px; font-weight: 800; color: #0f172a; }
.gmp-pd-mrp { font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-left: 8px; }
.gmp-spec-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
.gmp-spec-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.gmp-spec-table td:first-child { color: #64748b; width: 40%; font-weight: 600; }
.gmp-review { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
.gmp-stars { color: #f59e0b; letter-spacing: 1px; }
.gmp-skeleton { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: gmpShim 1.2s infinite; }
@keyframes gmpShim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.gmp-market-pick { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; max-height: 320px; overflow-y: auto; }
.gmp-market-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; cursor: pointer; text-align: left; width: 100%; transition: border-color .15s, box-shadow .15s; }
.gmp-market-row:hover { border-color: #2563eb; box-shadow: 0 8px 20px rgba(37,99,235,.1); }
.gmp-market-row-name { font-size: 15px; font-weight: 700; color: #0f172a; }
.gmp-market-row-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
.gmp-trust-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.gmp-trust-pill { font-size: 11px; font-weight: 600; background: #f0fdf4; color: #166534; padding: 5px 10px; border-radius: 8px; border: 1px solid #bbf7d0; }
.gmp-rating-bars { margin-top: 12px; }
.gmp-rating-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 11px; color: #64748b; }
.gmp-rating-bar-track { flex: 1; height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
.gmp-rating-bar-fill { height: 100%; background: #f59e0b; border-radius: 99px; }

/* Enhanced Shop Card Styles */
.gmp-card-wrapper { position: relative; }
.gmp-card-enhanced { position: relative; }
.gmp-card-banner-container { position: relative; height: 160px; overflow: hidden; }
.gmp-card-banner-container .gmp-card-banner { height: 100%; }
.gmp-card-badge { position: absolute; top: 10px; left: 10px; background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); color: #fff; font-size: 10px; font-weight: 700; padding: 5px 10px; border-radius: 8px; }
.gmp-card-open-badge { position: absolute; top: 10px; right: 10px; background: #16a34a; color: #fff; font-size: 10px; font-weight: 700; padding: 5px 10px; border-radius: 8px; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
.gmp-card-logo-wrapper { position: absolute; top: 120px; left: 50%; transform: translateX(-50%); z-index: 10; }
.gmp-card-logo { width: 72px; height: 72px; border-radius: 16px; border: 4px solid #fff; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.15); background: #fff; }
.gmp-card-stats { display: flex; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
.gmp-card-stat { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #475569; }
.gmp-card-stat-icon { font-size: 14px; }
.gmp-card-stat-value { color: #0f172a; }
.gmp-card-meta { font-size: 11px; color: #64748b; margin-top: 8px; }
.gmp-card-actions { display: flex; gap: 8px; margin-top: 12px; }
.gmp-card-btn { flex: 1; height: 36px; border-radius: 10px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: all .15s; border: none; }
.gmp-card-btn-follow { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.gmp-card-btn-follow:hover { background: #dc2626; color: #fff; }
.gmp-card-btn-follow.following { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
.gmp-card-btn-follow.following:hover { background: #166534; color: #fff; }
.gmp-card-btn-view { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
.gmp-card-btn-view:hover { background: #2563eb; color: #fff; }
`;

export const useMyLocation = (onCoords) => {
  return () => {
    if (!navigator.geolocation) return toast.error("Location not supported");
    toast.loading("Detecting location…", { id: "gm-loc" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        console.log("✅ Current location obtained:", coords.latitude, coords.longitude);
        onCoords(coords.latitude, coords.longitude);
        toast.success("Location updated", { id: "gm-loc" });
      },
      (error) => {
        console.error("❌ Location error:", error.message);
        toast.error("Unable to detect location. Please check permissions.", { id: "gm-loc" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }, // maximumAge: 0 for fresh location
    );
  };
};

export const CatalogToolbar = ({
  search, setSearch, onSearch, sort, setSort, sortOptions,
  filters, children, searchRef, suggestions, showSuggestions, suggestionsLoading, onSuggestionClick,
  activeFiltersCount,
}) => (
  <div className="gmp-toolbar">
    <form onSubmit={onSearch} style={{ display: "flex", flex: 1, gap: 8, minWidth: 200, position: "relative" }}>
      <div ref={searchRef} className="gmp-input-wrap" style={{ flex: 1, position: "relative" }}>
        <span className="gmp-input-icon">🔍</span>
        <input 
          className="gmp-input" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search shops & restaurants…"
          autoComplete="off"
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            marginTop: "4px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxHeight: "320px",
            overflowY: "auto",
          }}>
            {suggestionsLoading ? (
              <div style={{ padding: "12px 16px", color: "#94a3b8", fontSize: "13px" }}>
                Searching...
              </div>
            ) : (
              suggestions.map((s) => (
                <div
                  key={s._id}
                  onClick={() => onSuggestionClick && onSuggestionClick(s)}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f5f9",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                    {s.type === "restaurant" ? "🍽️" : "🛒"} {s.label}
                  </div>
                  {s.address && (
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      {s.address}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <button type="submit" className="gmp-btn gmp-btn-primary">Search</button>
    </form>
    <div style={{ position: "relative" }}>
      <select className="gmp-select" style={{ width: "auto", minWidth: 160, paddingLeft: 12 }} value={sort} onChange={(e) => setSort(e.target.value)}>
        {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {activeFiltersCount > 0 && (
        <span style={{
          position: "absolute",
          top: -6,
          right: -6,
          background: "#dc2626",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          width: 18,
          height: 18,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #fff",
        }}>
          {activeFiltersCount}
        </span>
      )}
    </div>
    {filters}
    {children}
  </div>
);

export const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="gmp-pagination">
      <button type="button" className="gmp-page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>←</button>
      {pages.map((p) => (
        <button key={p} type="button" className={`gmp-page-btn${p === page ? " active" : ""}`} onClick={() => onPage(p)}>{p}</button>
      ))}
      <button type="button" className="gmp-page-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>→</button>
    </div>
  );
};

export const Breadcrumb = ({ items }) => (
  <nav className="gmp-breadcrumb">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span>›</span>}
        {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
      </React.Fragment>
    ))}
  </nav>
);

export const StarRating = ({ value, size = 14 }) => {
  const r = Number(value) || 0;
  return (
    <span className="gmp-stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (r >= i ? "★" : "☆"))}
    </span>
  );
};

export const useDebouncedValue = (value, delay = 400) => {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export const ResultBar = ({ total, label = "results", loading }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 4px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
    <span>{loading ? "Loading…" : `${total ?? 0} ${label}`}</span>
    <span style={{ fontSize: 11, color: "#94a3b8" }}>Minutes delivery</span>
  </div>
);

export const SkeletonGrid = ({ count = 6, type = "card" }) => (
  <div className={type === "product" ? "gmp-product-grid" : "gmp-grid"}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="gmp-skeleton" style={{ height: type === "product" ? 220 : 200, borderRadius: 16 }} />
    ))}
  </div>
);
