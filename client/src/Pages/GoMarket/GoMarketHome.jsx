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
  const [showNearby, setShowNearby] = useState(false);
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const updateLocationMode = queryParams.get("updateLocation") === "true";

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLogin) {
      navigate("/login");
    }
  }, [isLogin, navigate]);

  // Auto-navigate to preferred market if exists (skip if coming from edit)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isFromEdit = params.get("edit") === "true" || params.get("updateLocation") === "true";
    
    if (isLogin && userData?.preferredMarketId && !isFromEdit) {
      console.log("🎯 Auto-navigating to preferred market:", userData.preferredMarketId);
      navigate(`/go-market/market/${userData.preferredMarketId}`);
    }
  }, [isLogin, userData, navigate]);

  useEffect(() => {
    dispatch(fetchMarkets({ search: "" }));
  }, [dispatch]);
  useEffect(() => {
    fetchDataFromApi("/api/settings/commerce").then((res) => setCollections((res?.data?.collections || []).filter((c) => c.isActive !== false)));
  }, []);

  const allMarkets = useMemo(() => {
    if (showNearby) return nearbyMarkets;
    const map = new Map([...nearbyMarkets, ...markets].map((m) => [m._id, m]));
    return Array.from(map.values());
  }, [markets, nearbyMarkets, showNearby]);

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
    setShowNearby(false);
    setFocusedIndex(-1);
  };

  const handleSuggestionClick = (market) => {
    console.log("🔍 Suggestion clicked:", market.name, market._id);
    setSearch(market.name);
    setShowSuggestions(false);
    // Save preferred market and navigate
    dispatch(savePreferredMarket({ marketId: market._id }));
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
    console.log("📍 User coordinates detected:", { lat, lng });
    dispatch(fetchNearbyMarkets({ latitude: lat, longitude: lng }))
      .unwrap()
      .then((response) => {
        console.log("📍 API Response from nearby markets:", response);
        console.log("📍 Full response.data:", response?.data);
        if (response?.data && response.data.length > 0) {
          const nearestMarket = response.data[0];
          console.log("🎯 Nearest market found:", nearestMarket.name, "at", nearestMarket.distanceKm, "km");
          // Save preferred market and navigate
          dispatch(savePreferredMarket({ marketId: nearestMarket._id, location: { lat, lng }, address: `Current location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, forceLocationUpdate: true }))
            .finally(() => navigate(`/go-market/market/${nearestMarket._id}`));
        } else {
          console.warn("⚠️ No nearby markets found. Response:", response);
          alert("❌ No markets found in your area. Please try searching or check back later.");
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching nearby markets:", error);
        alert("❌ Failed to find nearby markets. Error: " + (error?.message || "Unknown error"));
      });
  });

  const openMarket = (marketId) => {
    if (!marketId) return;
    // Save preferred market before navigating
    dispatch(savePreferredMarket({ marketId, location: userData?.goMarketLocation ? { lat: userData.goMarketLocation.coordinates?.[1], lng: userData.goMarketLocation.coordinates?.[0] } : undefined, address: userData?.goMarketLocation?.address || "" }));
    navigate(`/go-market/market/${marketId}`);
  };

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <section className="gmp-hero">
        <div className="gmp-container">
          <p className="gmp-eyebrow">Quick commerce · 10–30 min delivery</p>
          <h1>Go Market</h1>
           <p>Use current location to save your delivery location and open the nearest market.</p>

          <div className="gmp-tools" style={{ gridTemplateColumns: "minmax(220px, 360px)" }}>
            <button type="button" className="gmp-btn gmp-btn-outline" onClick={useLocation}>
            📍 Use current location
            </button>
            </div>
        </div>
      </section>

      {collections.length > 0 && <div className="gmp-container" style={{ marginTop: 24 }}><p style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 10 }}>Collections</p><div className="gmp-chip-row">{collections.map((c, i) => <button key={`${c.title}-${i}`} className="gmp-chip active" type="button">{c.image ? <img src={c.image} alt="" style={{ width: 22, height: 22, borderRadius: 999, objectFit: "cover", marginRight: 6 }} /> : null}{c.title}</button>)}</div></div>}

      <div className="gmp-container" style={{ marginTop: 24 }}>
        <div className="gmp-empty">
          <span className="gmp-empty-icon">📍</span>
          Tap Use current location to save your Go Market delivery location and open the nearest market.
        </div>
      </div>
    </div>
  );
};

export default GoMarketHome;
