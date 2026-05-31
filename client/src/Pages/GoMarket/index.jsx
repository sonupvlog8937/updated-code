import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchGroceryShopDetail, fetchMarketDetail, fetchMarkets,
  fetchNearbyMarkets, fetchRestaurantDetail,
  followGoMarketRestaurant, followGoMarketShop, setActiveTab
} from "../../store/goMarketSlice";
import "./style.css";

const fallback = "https://placehold.co/800x420/f3f4f6/111827?text=Go+Market";
const img   = (src) => src || fallback;
const count = (v)   => Array.isArray(v) ? v.length : Number(v || 0);

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

:root {
  --ink:       #0a0a0a;
  --ink2:      #3a3a3a;
  --ink3:      #6b6b6b;
  --ink4:      #9a9a9a;
  --surface:   #ffffff;
  --surface2:  #f7f7f6;
  --surface3:  #f0efed;
  --border:    #e8e6e3;
  --border2:   #d4d1cb;
  --accent:    #111111;
  --green:     #16a34a;
  --green-bg:  #f0fdf4;
  --red:       #dc2626;
  --red-bg:    #fef2f2;
  --radius:    10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06);
  --font:      'DM Sans', sans-serif;
  --mono:      'DM Mono', monospace;
  --transition: 0.18s cubic-bezier(0.4,0,0.2,1);
}

.gmp-root * { box-sizing: border-box; margin: 0; padding: 0; }
.gmp-root {
  font-family: var(--font);
  font-size: 13.5px;
  color: var(--ink);
  background: var(--surface2);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ── PAGE LAYOUT ── */
.gmp-root { padding: 0 0 64px; }
.gmp-container { max-width: 1160px; margin: 0 auto; padding: 0 20px; }

/* ── HERO ── */
.gmp-hero {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 28px 0 24px;
}
.gmp-hero-inner {
  max-width: 1160px; margin: 0 auto; padding: 0 20px;
  display: flex; flex-direction: column; gap: 20px;
}
.gmp-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.gmp-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ink3);
  background: var(--surface3); border: 1px solid var(--border);
  padding: 3px 10px; border-radius: 99px; margin-bottom: 6px;
}
.gmp-eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green);
  animation: livePulse 2s ease-in-out infinite;
}
@keyframes livePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
  50%      { box-shadow: 0 0 0 4px rgba(22,163,74,0); }
}
.gmp-hero h1 {
  font-size: 26px; font-weight: 700; letter-spacing: -0.5px;
  color: var(--ink); line-height: 1.2;
}
.gmp-hero-desc {
  font-size: 13px; color: var(--ink3); margin-top: 4px; line-height: 1.55;
  max-width: 480px;
}
.gmp-stats {
  display: flex; gap: 20px; flex-wrap: wrap; align-items: center;
}
.gmp-stat {
  display: flex; flex-direction: column; align-items: flex-end;
}
.gmp-stat-val { font-size: 18px; font-weight: 700; color: var(--ink); line-height: 1; }
.gmp-stat-lbl { font-size: 10.5px; color: var(--ink4); margin-top: 2px; }

/* ── SEARCH TOOLS ── */
.gmp-tools {
  display: grid; gap: 10px;
  grid-template-columns: 1fr 1fr auto auto;
}
.gmp-input-wrap { position: relative; }
.gmp-input-icon {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--ink4); font-size: 14px; pointer-events: none;
}
.gmp-input, .gmp-select {
  width: 100%; height: 38px;
  border: 1.5px solid var(--border2);
  border-radius: var(--radius);
  font-family: var(--font); font-size: 13px;
  color: var(--ink); background: var(--surface);
  outline: none; transition: border-color var(--transition), box-shadow var(--transition);
}
.gmp-input { padding: 0 12px 0 34px; }
.gmp-select { padding: 0 12px; cursor: pointer; appearance: none; }
.gmp-input:focus, .gmp-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
}
.gmp-btn {
  height: 38px; padding: 0 18px; border-radius: var(--radius);
  border: none; font-family: var(--font); font-size: 13px;
  font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: all var(--transition); display: inline-flex;
  align-items: center; gap: 6px;
}
.gmp-btn-primary { background: var(--accent); color: #fff; }
.gmp-btn-primary:hover { background: #2a2a2a; transform: translateY(-1px); box-shadow: var(--shadow); }
.gmp-btn-outline {
  background: var(--surface); color: var(--ink2);
  border: 1.5px solid var(--border2);
}
.gmp-btn-outline:hover { border-color: var(--accent); color: var(--ink); background: var(--surface3); }
.gmp-btn:active { transform: translateY(0); }

/* ── NEARBY SECTION ── */
.gmp-section { padding: 20px 0 0; }
.gmp-section-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.gmp-section-title {
  font-size: 13px; font-weight: 700; color: var(--ink);
  letter-spacing: -0.1px; display: flex; align-items: center; gap: 7px;
}
.gmp-section-title span { font-size: 15px; }
.gmp-count {
  font-size: 10.5px; font-weight: 600; color: var(--ink4);
  background: var(--surface3); padding: 2px 8px;
  border-radius: 99px; border: 1px solid var(--border);
}

/* ── CHIPS ── */
.gmp-chip-row {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.gmp-chip {
  display: inline-flex; flex-direction: column; align-items: flex-start;
  padding: 8px 14px; border-radius: var(--radius);
  border: 1.5px solid var(--border); background: var(--surface);
  cursor: pointer; transition: all var(--transition);
  font-family: var(--font); text-align: left;
}
.gmp-chip:hover { border-color: var(--accent); background: var(--surface); box-shadow: var(--shadow-sm); }
.gmp-chip.active { border-color: var(--accent); background: var(--accent); color: #fff; }
.gmp-chip.active .gmp-chip-sub { color: rgba(255,255,255,0.6); }
.gmp-chip-name { font-size: 12.5px; font-weight: 600; line-height: 1.2; }
.gmp-chip-sub  { font-size: 10.5px; color: var(--ink4); margin-top: 2px; line-height: 1; }

/* ── MARKET DETAIL ── */
.gmp-market-detail { padding-top: 20px; }
.gmp-market-banner {
  width: 100%; height: 180px; border-radius: var(--radius-lg);
  background-size: cover; background-position: center;
  position: relative; overflow: hidden;
  box-shadow: var(--shadow);
}
.gmp-market-banner-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%);
  display: flex; align-items: flex-end; padding: 20px;
}
.gmp-market-banner-overlay h2 { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
.gmp-market-banner-overlay p  { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 3px; }

/* ── TABS ── */
.gmp-tabs {
  display: flex; gap: 4px;
  background: var(--surface3); border-radius: var(--radius);
  padding: 4px; margin-top: 16px; width: fit-content;
}
.gmp-tab {
  padding: 7px 18px; border-radius: 7px; border: none;
  font-family: var(--font); font-size: 12.5px; font-weight: 600;
  cursor: pointer; transition: all var(--transition);
  color: var(--ink3); background: transparent;
  display: flex; align-items: center; gap: 6px;
}
.gmp-tab.active {
  background: var(--surface); color: var(--ink);
  box-shadow: var(--shadow-sm);
}
.gmp-tab-badge {
  font-size: 10px; font-weight: 700;
  background: var(--border); color: var(--ink3);
  padding: 1px 6px; border-radius: 99px;
}
.gmp-tab.active .gmp-tab-badge { background: var(--ink); color: #fff; }

/* ── GRID ── */
.gmp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px; margin-top: 16px;
}
.gmp-grid.compact { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }

/* ── CARDS ── */
.gmp-card {
  background: var(--surface); border-radius: var(--radius-lg);
  border: 1px solid var(--border); overflow: hidden;
  text-decoration: none; color: inherit;
  transition: all var(--transition);
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-sm);
}
.gmp-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--border2); }
.gmp-card-banner {
  width: 100%; height: 140px; object-fit: cover;
  background: var(--surface3); display: block;
}
.gmp-card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; position: relative; }
.gmp-card-header { display: flex; align-items: flex-start; gap: 10px; }
.gmp-card-logo {
  width: 38px; height: 38px; border-radius: 9px;
  object-fit: cover; border: 2px solid var(--surface);
  box-shadow: var(--shadow-sm); flex-shrink: 0;
  background: var(--surface3);
}
.gmp-card-title { font-size: 13.5px; font-weight: 700; color: var(--ink); line-height: 1.25; letter-spacing: -0.1px; }
.gmp-card-addr  { font-size: 11.5px; color: var(--ink4); line-height: 1.4; margin-top: 1px; }
.gmp-card-meta  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
.gmp-meta-item  { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--ink3); }
.gmp-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border); }

.gmp-status {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10.5px; font-weight: 600;
  padding: 2px 8px; border-radius: 99px;
}
.gmp-status.open   { background: var(--green-bg); color: var(--green); }
.gmp-status.open::before   { content:''; width:5px; height:5px; border-radius:50%; background: var(--green); }
.gmp-status.closed { background: var(--red-bg); color: var(--red); }
.gmp-status.closed::before { content:''; width:5px; height:5px; border-radius:50%; background: var(--red); }

.gmp-owner-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  border: 1.5px solid var(--surface); object-fit: cover;
}
.gmp-card-arrow {
  font-size: 16px; color: var(--ink4);
  transition: transform var(--transition), color var(--transition);
}
.gmp-card:hover .gmp-card-arrow { transform: translateX(3px); color: var(--ink2); }

/* ── PRODUCT GRID ── */
.gmp-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px; margin-top: 16px;
}
.gmp-product-tile {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
  transition: all var(--transition); box-shadow: var(--shadow-sm);
}
.gmp-product-tile:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.gmp-product-tile img  { width: 100%; height: 120px; object-fit: cover; background: var(--surface3); display: block; }
.gmp-product-body { padding: 10px 12px; }
.gmp-product-name { font-size: 12.5px; font-weight: 600; color: var(--ink); line-height: 1.3; }
.gmp-product-price { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
.gmp-product-price b { font-size: 13.5px; font-weight: 700; color: var(--ink); }
.gmp-product-price del { font-size: 11px; color: var(--ink4); }
.gmp-product-stock { font-size: 10.5px; color: var(--ink4); margin-top: 3px; }

/* ── DETAIL HEADER ── */
.gmp-detail-head { background: var(--surface); border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.gmp-detail-banner { width: 100%; height: 200px; object-fit: cover; display: block; background: var(--surface3); }
.gmp-detail-info {
  max-width: 1160px; margin: 0 auto; padding: 20px 20px 24px;
  display: flex; gap: 16px; align-items: flex-start;
}
.gmp-detail-logo {
  width: 64px; height: 64px; border-radius: 14px;
  object-fit: cover; border: 2px solid var(--border);
  flex-shrink: 0; background: var(--surface3);
  margin-top: -32px; box-shadow: var(--shadow);
}
.gmp-detail-body { flex: 1; }
.gmp-detail-body h1 { font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: -0.4px; }
.gmp-detail-body .gmp-meta-row { display: flex; gap: 14px; flex-wrap: wrap; margin: 6px 0; }
.gmp-meta-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; color: var(--ink3);
}
.gmp-detail-desc { font-size: 12.5px; color: var(--ink3); line-height: 1.55; margin-top: 6px; max-width: 600px; }
.gmp-action-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }

/* ── EMPTY & LOADING ── */
.gmp-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; padding: 48px 20px;
  color: var(--ink4); text-align: center;
}
.gmp-empty-icon { font-size: 36px; opacity: 0.4; }
.gmp-empty-text { font-size: 13px; font-weight: 500; }
.gmp-empty-sub  { font-size: 12px; color: var(--ink4); }

.gmp-loading {
  display: flex; gap: 14px; flex-wrap: wrap; padding: 16px 0;
}
.gmp-skeleton {
  background: var(--border); border-radius: var(--radius-lg);
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.45; }
}

/* ── SECTION CARD (wrapper) ── */
.gmp-section-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 18px;
  box-shadow: var(--shadow-sm);
}

/* ── RESPONSIVE ── */
@media (max-width: 760px) {
  .gmp-tools { grid-template-columns: 1fr 1fr; }
  .gmp-tools .gmp-btn { width: 100%; justify-content: center; }
  .gmp-hero h1 { font-size: 20px; }
  .gmp-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
  .gmp-product-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .gmp-detail-banner { height: 150px; }
  .gmp-market-banner { height: 140px; }
  .gmp-stats { display: none; }
}
@media (max-width: 480px) {
  .gmp-tools { grid-template-columns: 1fr; }
  .gmp-grid { grid-template-columns: 1fr 1fr; }
}
`;

/* ─────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────── */
const SkeletonCards = ({ n = 4 }) => (
  <div className="gmp-loading">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="gmp-skeleton" style={{ width: 240, height: 220 }} />
    ))}
  </div>
);

/* ─────────────────────────────────────────
   GO MARKET HOME
───────────────────────────────────────── */
export const GoMarketHome = () => {
  const dispatch = useDispatch();
  const {
    markets, nearbyMarkets, selectedMarket, groceryShops,
    restaurants, loading, detailLoading, error, activeTab
  } = useSelector((s) => s.goMarket);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => { dispatch(fetchMarkets()); }, [dispatch]);
  useEffect(() => { if (selectedId) dispatch(fetchMarketDetail(selectedId)); }, [dispatch, selectedId]);

  const allMarkets = useMemo(() => {
    const map = new Map([...nearbyMarkets, ...markets].map((m) => [m._id, m]));
    return Array.from(map.values());
  }, [markets, nearbyMarkets]);

  const onSearch = (e) => { e.preventDefault(); dispatch(fetchMarkets({ search })); };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Location not supported");
    toast.loading("Detecting location…", { id: "loc" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        dispatch(fetchNearbyMarkets({ latitude: coords.latitude, longitude: coords.longitude }));
        toast.success("Nearby markets loaded", { id: "loc" });
      },
      () => toast.error("Unable to detect location", { id: "loc" }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const displayList = nearbyMarkets.length ? nearbyMarkets : markets;

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>

      {/* ── HERO ── */}
      <section className="gmp-hero">
        <div className="gmp-hero-inner">
          <div className="gmp-hero-top">
            <div>
              <div className="gmp-eyebrow">
                <span className="gmp-eyebrow-dot" /> Local Commerce
              </div>
              <h1>Go Market</h1>
              <p className="gmp-hero-desc">
                Browse local grocery shops &amp; restaurants in your city. Select a market to explore.
              </p>
            </div>
            <div className="gmp-stats">
              <div className="gmp-stat">
                <span className="gmp-stat-val">{markets.length || "—"}</span>
                <span className="gmp-stat-lbl">Markets</span>
              </div>
              <div className="gmp-stat">
                <span className="gmp-stat-val">{nearbyMarkets.length || "—"}</span>
                <span className="gmp-stat-lbl">Nearby</span>
              </div>
            </div>
          </div>

          {/* Search Tools */}
          <form onSubmit={onSearch} className="gmp-tools">
            <div className="gmp-input-wrap">
              <span className="gmp-input-icon">🔍</span>
              <input
                className="gmp-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city, pincode…"
              />
            </div>
            <div className="gmp-input-wrap">
              <span className="gmp-input-icon">📍</span>
              <select
                className="gmp-select"
                style={{ paddingLeft: 34 }}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">Select Market</option>
                {allMarkets.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} — {m.city}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="gmp-btn gmp-btn-primary">
              Search
            </button>
            <button type="button" className="gmp-btn gmp-btn-outline" onClick={useMyLocation}>
              📡 Nearby
            </button>
          </form>
        </div>
      </section>

      <div className="gmp-container">

        {/* ── NEARBY CHIPS ── */}
        <div className="gmp-section">
          <div className="gmp-section-card">
            <div className="gmp-section-head">
              <h2 className="gmp-section-title">
                <span>🏪</span>
                {nearbyMarkets.length ? "Nearby Markets" : "All Markets"}
              </h2>
              <span className="gmp-count">{displayList.length} found</span>
            </div>
            {loading ? (
              <p style={{ fontSize: 12, color: "var(--ink4)" }}>Loading markets…</p>
            ) : displayList.length === 0 ? (
              <div className="gmp-empty" style={{ padding: "20px 0" }}>
                <span className="gmp-empty-icon">🗺️</span>
                <span className="gmp-empty-text">No markets found</span>
              </div>
            ) : (
              <div className="gmp-chip-row">
                {displayList.map((m) => (
                  <button
                    key={m._id}
                    className={`gmp-chip${selectedId === m._id ? " active" : ""}`}
                    onClick={() => setSelectedId(m._id)}
                  >
                    <span className="gmp-chip-name">{m.name}</span>
                    <span className="gmp-chip-sub">
                      {m.city}{m.distanceKm ? ` • ${m.distanceKm} km` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="gmp-empty" style={{ paddingTop: 40 }}>
            <span className="gmp-empty-icon">⚠️</span>
            <span className="gmp-empty-text">No Market Available</span>
            <span className="gmp-empty-sub">Try a different city or pincode</span>
          </div>
        )}

        {/* ── PROMPT ── */}
        {!selectedMarket && !error && (
          <div className="gmp-empty" style={{ paddingTop: 48 }}>
            <span className="gmp-empty-icon">👆</span>
            <span className="gmp-empty-text">Select a market above</span>
            <span className="gmp-empty-sub">Shops &amp; restaurants will appear here</span>
          </div>
        )}

        {/* ── MARKET DETAIL ── */}
        {selectedMarket && (
          <div className="gmp-market-detail">
            {/* Banner */}
            <div
              className="gmp-market-banner"
              style={{ backgroundImage: `url(${img(selectedMarket.banner)})` }}
            >
              <div className="gmp-market-banner-overlay">
                <div>
                  <h2>{selectedMarket.name}</h2>
                  <p>{selectedMarket.city}, {selectedMarket.state} — {selectedMarket.pincode}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="gmp-tabs">
              <button
                className={`gmp-tab${activeTab === "grocery" ? " active" : ""}`}
                onClick={() => dispatch(setActiveTab("grocery"))}
              >
                🛒 Grocery
                <span className="gmp-tab-badge">{groceryShops.length}</span>
              </button>
              <button
                className={`gmp-tab${activeTab === "restaurants" ? " active" : ""}`}
                onClick={() => dispatch(setActiveTab("restaurants"))}
              >
                🍽 Restaurants
                <span className="gmp-tab-badge">{restaurants.length}</span>
              </button>
            </div>

            {detailLoading ? (
              <SkeletonCards />
            ) : activeTab === "grocery" ? (
              <GroceryShopGrid shops={groceryShops} />
            ) : (
              <RestaurantGrid restaurants={restaurants} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   GROCERY SHOP GRID
───────────────────────────────────────── */
const GroceryShopGrid = ({ shops }) =>
  shops.length ? (
    <div className="gmp-grid">
      {shops.map((shop) => (
        <Link to={`/go-market/shop/${shop._id}`} className="gmp-card" key={shop._id}>
          <img className="gmp-card-banner" src={img(shop.shopBanner)} alt={shop.shopName} />
          <div className="gmp-card-body">
            <div className="gmp-card-header">
              <img className="gmp-card-logo" src={img(shop.shopLogo)} alt="" />
              <div>
                <div className="gmp-card-title">{shop.shopName}</div>
                <div className="gmp-card-addr">{shop.address}</div>
              </div>
            </div>
            <div className="gmp-card-meta">
              <span className="gmp-meta-item">⭐ {shop.rating || 0}</span>
              <span className="gmp-meta-item">👥 {count(shop.followers)}</span>
              <span className="gmp-meta-item">📦 {shop.totalProducts} items</span>
            </div>
            <div className="gmp-card-footer">
              <span className={`gmp-status ${shop.isOpen ? "open" : "closed"}`}>
                {shop.isOpen ? "Open" : "Closed"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {shop.ownerId?.avatar && (
                  <img className="gmp-owner-avatar" src={shop.ownerId.avatar} alt="" />
                )}
                <span className="gmp-card-arrow">→</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <div className="gmp-empty">
      <span className="gmp-empty-icon">🛒</span>
      <span className="gmp-empty-text">No grocery shops in this market</span>
    </div>
  );

/* ─────────────────────────────────────────
   RESTAURANT GRID
───────────────────────────────────────── */
const RestaurantGrid = ({ restaurants }) =>
  restaurants.length ? (
    <div className="gmp-grid">
      {restaurants.map((r) => (
        <Link to={`/go-market/restaurant/${r._id}`} className="gmp-card" key={r._id}>
          <img className="gmp-card-banner" src={img(r.restaurantBanner)} alt={r.restaurantName} />
          <div className="gmp-card-body">
            <div className="gmp-card-header">
              <img className="gmp-card-logo" src={img(r.restaurantLogo)} alt="" />
              <div>
                <div className="gmp-card-title">{r.restaurantName}</div>
                <div className="gmp-card-addr">{r.address}</div>
              </div>
            </div>
            <div className="gmp-card-meta">
              <span className="gmp-meta-item">⭐ {r.rating || 0}</span>
              <span className="gmp-meta-item">👥 {count(r.followers)}</span>
              <span className="gmp-meta-item">🍽 {r.totalMenus} menus</span>
              <span className="gmp-meta-item">🥘 {r.totalItems} items</span>
            </div>
            <div className="gmp-card-footer">
              <span className={`gmp-status ${r.isOpen ? "open" : "closed"}`}>
                {r.isOpen ? "Open" : "Closed"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {r.ownerId?.avatar && (
                  <img className="gmp-owner-avatar" src={r.ownerId.avatar} alt="" />
                )}
                <span className="gmp-card-arrow">→</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <div className="gmp-empty">
      <span className="gmp-empty-icon">🍽</span>
      <span className="gmp-empty-text">No restaurants in this market</span>
    </div>
  );

/* ─────────────────────────────────────────
   SHOP DETAILS
───────────────────────────────────────── */
export const GoMarketShopDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { shopDetail, detailLoading } = useSelector((s) => s.goMarket);
  useEffect(() => { dispatch(fetchGroceryShopDetail(id)); }, [dispatch, id]);

  if (detailLoading || !shopDetail)
    return (
      <div className="gmp-root">
        <style>{STYLES}</style>
        <div className="gmp-empty" style={{ paddingTop: 80 }}>
          <span className="gmp-empty-icon">⏳</span>
          <span className="gmp-empty-text">Loading shop…</span>
        </div>
      </div>
    );

  const { shop, products } = shopDetail;
  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <DetailHeader
        title={shop.shopName} banner={shop.shopBanner} logo={shop.shopLogo}
        owner={shop.ownerId} address={shop.address} rating={shop.rating}
        followers={shop.followers} description={shop.description}
        meta={`${shop.totalProducts || products.length} products`}
        onFollow={() => dispatch(followGoMarketShop(shop._id))}
        shareText={shop.shopName} contact={shop.ownerId?.mobile}
        isOpen={shop.isOpen}
      />
      <div className="gmp-container">
        <div className="gmp-section-head" style={{ marginTop: 20, marginBottom: 0 }}>
          <h2 className="gmp-section-title"><span>📦</span> Products</h2>
          <span className="gmp-count">{products.length} items</span>
        </div>
        <div className="gmp-product-grid">
          {products.map((p) => (
            <div className="gmp-product-tile" key={p._id}>
              <img src={img(p.image)} alt={p.name} />
              <div className="gmp-product-body">
                <div className="gmp-product-name">{p.name}</div>
                <div className="gmp-product-price">
                  <b>₹{p.discountPrice || p.price}</b>
                  {p.discountPrice && <del>₹{p.price}</del>}
                </div>
                <div className="gmp-product-stock">Stock: {p.stock}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   RESTAURANT DETAILS
───────────────────────────────────────── */
export const GoMarketRestaurantDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { restaurantDetail, detailLoading } = useSelector((s) => s.goMarket);
  useEffect(() => { dispatch(fetchRestaurantDetail(id)); }, [dispatch, id]);

  if (detailLoading || !restaurantDetail)
    return (
      <div className="gmp-root">
        <style>{STYLES}</style>
        <div className="gmp-empty" style={{ paddingTop: 80 }}>
          <span className="gmp-empty-icon">⏳</span>
          <span className="gmp-empty-text">Loading restaurant…</span>
        </div>
      </div>
    );

  const { restaurant, menus, items } = restaurantDetail;
  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <DetailHeader
        title={restaurant.restaurantName} banner={restaurant.restaurantBanner}
        logo={restaurant.restaurantLogo} owner={restaurant.ownerId}
        address={restaurant.address} rating={restaurant.rating}
        followers={restaurant.followers} description={restaurant.description}
        meta={`${restaurant.totalMenus || menus.length} menus • ${restaurant.totalItems || items.length} items`}
        onFollow={() => dispatch(followGoMarketRestaurant(restaurant._id))}
        shareText={restaurant.restaurantName} contact={restaurant.ownerId?.mobile}
        isOpen={restaurant.isOpen}
      />
      <div className="gmp-container">
        <div className="gmp-section-head" style={{ marginTop: 20, marginBottom: 0 }}>
          <h2 className="gmp-section-title"><span>📋</span> Menus</h2>
          <span className="gmp-count">{menus.length}</span>
        </div>
        <div className="gmp-grid compact">
          {menus.map((m) => (
            <div className="gmp-product-tile" key={m._id}>
              <img src={img(m.image)} alt={m.menuName} />
              <div className="gmp-product-body">
                <div className="gmp-product-name">{m.menuName}</div>
                <div className="gmp-product-stock" style={{ marginTop: 4 }}>{m.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="gmp-section-head" style={{ marginTop: 24, marginBottom: 0 }}>
          <h2 className="gmp-section-title"><span>🥘</span> Items</h2>
          <span className="gmp-count">{items.length}</span>
        </div>
        <div className="gmp-product-grid">
          {items.map((i) => (
            <div className="gmp-product-tile" key={i._id}>
              <img src={img(i.image)} alt={i.itemName} />
              <div className="gmp-product-body">
                <div className="gmp-product-name">{i.itemName}</div>
                <div className="gmp-product-price"><b>₹{i.price}</b></div>
                <div className="gmp-product-stock">{i.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   DETAIL HEADER
───────────────────────────────────────── */
const DetailHeader = ({
  title, banner, logo, owner, address, rating,
  followers, description, meta, onFollow, shareText, contact, isOpen
}) => (
  <div className="gmp-detail-head">
    <img src={img(banner)} className="gmp-detail-banner" alt={title} />
    <div className="gmp-detail-info">
      <img src={img(logo)} className="gmp-detail-logo" alt="" />
      <div className="gmp-detail-body">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1>{title}</h1>
          <span className={`gmp-status ${isOpen ? "open" : "closed"}`}>
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>
        <div className="gmp-meta-row">
          <span className="gmp-meta-chip">📍 {address}</span>
          <span className="gmp-meta-chip">⭐ {rating || 0}</span>
          <span className="gmp-meta-chip">👥 {count(followers)} followers</span>
          <span className="gmp-meta-chip">📦 {meta}</span>
          {owner?.avatar && <img src={owner.avatar} className="gmp-owner-avatar" alt="" />}
        </div>
        {description && <p className="gmp-detail-desc">{description}</p>}
        <div className="gmp-action-row">
          <button className="gmp-btn gmp-btn-primary" onClick={onFollow}>
            ❤️ Follow
          </button>
          <button
            className="gmp-btn gmp-btn-outline"
            onClick={() =>
              navigator.share?.({ title: shareText, text: address }) ||
              navigator.clipboard?.writeText(window.location.href).then(() => toast.success("Link copied!"))
            }
          >
            🔗 Share
          </button>
          {contact && (
            <a href={`tel:${contact}`} className="gmp-btn gmp-btn-outline" style={{ textDecoration: "none" }}>
              📞 Call
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default GoMarketHome;