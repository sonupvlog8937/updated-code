import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMarkets, fetchNearbyMarkets, savePreferredMarket } from "../../store/goMarketSlice";
import { fetchDataFromApi } from "../../utils/api";
import { STYLES, useMyLocation } from "./shared";

const GoMarketHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { markets, nearbyMarkets, loading } = useSelector((s) => s.goMarket);
  const isLogin = useSelector((s) => s.app.isLogin);
  const userData = useSelector((s) => s.app.userData);

  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [collections, setCollections] = useState([]);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLogin) {
      navigate("/login");
    }
  }, [isLogin, navigate]);

  // Auto-navigate to preferred market if exists (skip if coming from edit)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isFromEdit = params.get("edit") === "true";
    
    if (isLogin && userData?.preferredMarketId && !isFromEdit) {
      console.log("🎯 Auto-navigating to preferred market:", userData.preferredMarketId);
      navigate(`/go-market/market/${userData.preferredMarketId}`);
    }
  }, [isLogin, userData, navigate]);

  useEffect(() => {
    dispatch(fetchMarkets({ search: "" }));
  }, [dispatch]);
  fetchDataFromApi("/api/settings/commerce").then((res) => setCollections((res?.data?.collections || []).filter((c) => c.isActive !== false)));

  const allMarkets = useMemo(() => {
    const map = new Map([...nearbyMarkets, ...markets].map((m) => [m._id, m]));
    return Array.from(map.values());
  }, [markets, nearbyMarkets]);

  // Fuzzy search function - matches even with typos
  const fuzzyMatch = (text, query) => {
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
      (m) =>
        fuzzyMatch(m.name, q) ||
        fuzzyMatch(m.city, q) ||
        String(m.pincode || "").includes(q),
    );
  }, [allMarkets, search]);

  const onSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    dispatch(fetchMarkets({ search }));
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setShowSuggestions(true);
    setFocusedIndex(-1);
  };

  const handleSuggestionClick = (market) => {
    console.log("🔍 Suggestion clicked:", market.name, market._id);
    setSearch(market.name);
    setShowSuggestions(false);
    // Save preferred market and navigate
    dispatch(savePreferredMarket(market._id));
    openMarket(market._id);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(filtered[focusedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const useLocation = useMyLocation((lat, lng) => {
    dispatch(fetchNearbyMarkets({ latitude: lat, longitude: lng }))
      .unwrap()
      .then((response) => {
        console.log("📍 Nearby markets response:", response);
        // Get the nearest market (first one in the sorted list)
        if (response?.data && response.data.length > 0) {
          const nearestMarket = response.data[0];
          console.log("🎯 Navigating to nearest market:", nearestMarket.name);
          // Save preferred market and navigate
          dispatch(savePreferredMarket(nearestMarket._id));
          openMarket(nearestMarket._id);
        } else {
          console.log("⚠️ No nearby markets found");
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching nearby markets:", error);
      });
  });

  const openMarket = (marketId) => {
    if (!marketId) return;
    // Save preferred market before navigating
    dispatch(savePreferredMarket(marketId));
    navigate(`/go-market/market/${marketId}`);
  };

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <section className="gmp-hero">
        <div className="gmp-container">
          <p className="gmp-eyebrow">Quick commerce · 10–30 min delivery</p>
          <h1>Go Market</h1>
          <p>Search your market, use current location, then pick a market to browse grocery shops and restaurants nearby.</p>

          <form onSubmit={onSearch} className="gmp-tools">
            <div className="gmp-input-wrap" style={{ position: "relative" }}>
              <span className="gmp-input-icon">🔍</span>
              <input
                className="gmp-input"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => search && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                placeholder="Search market by name, city, pincode…"
                autoComplete="off"
              />
              
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && search.trim() && filtered.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    maxHeight: 300,
                    overflowY: "auto",
                    zIndex: 1000,
                  }}
                >
                  {filtered.slice(0, 5).map((market, idx) => (
                    <button
                      key={market._id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleSuggestionClick(market);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        background: focusedIndex === idx ? "#f1f5f9" : "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        borderBottom: idx < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={() => setFocusedIndex(idx)}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b", marginBottom: 2 }}>
                        {market.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {market.city}{market.state ? `, ${market.state}` : ""} · {market.pincode || "—"}
                        {market.distanceKm != null ? ` · ${market.distanceKm} km away` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="gmp-btn gmp-btn-outline" onClick={useLocation}>
              📍 Current location
            </button>
            <button type="submit" className="gmp-btn gmp-btn-primary">Search</button>
          </form>
        </div>
      </section>

      {collections.length > 0 && <div className="gmp-container" style={{ marginTop: 24 }}><p style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 10 }}>Collections</p><div className="gmp-chip-row">{collections.map((c, i) => <button key={`${c.title}-${i}`} className="gmp-chip active" type="button">{c.image ? <img src={c.image} alt="" style={{ width: 22, height: 22, borderRadius: 999, objectFit: "cover", marginRight: 6 }} /> : null}{c.title}</button>)}</div></div>}

      <div className="gmp-container" style={{ marginTop: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
          Select a market to continue
        </p>

        {loading && <p style={{ color: "#94a3b8", fontSize: 13 }}>Loading markets…</p>}

        {!loading && filtered.length === 0 && (
          <div className="gmp-empty">
            <span className="gmp-empty-icon">🗺️</span>
            No markets found. Try another search or enable location.
          </div>
        )}

        <div className="gmp-market-pick">
          {filtered.map((m) => (
            <button
              key={m._id}
              type="button"
              className="gmp-market-row"
              onClick={() => openMarket(m._id)}
            >
              <div>
                <div className="gmp-market-row-name">{m.name}</div>
                <div className="gmp-market-row-sub">
                  {m.city}{m.state ? `, ${m.state}` : ""} · {m.pincode || "—"}
                  {m.distanceKm != null ? ` · ${m.distanceKm} km away` : ""}
                </div>
              </div>
              <span style={{ fontSize: 18, color: "#2563eb" }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoMarketHome;
