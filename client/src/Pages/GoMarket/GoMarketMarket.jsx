import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchDataFromApi } from "../../utils/api";
import { followGoMarketShop, followGoMarketRestaurant, unfollowGoMarketShop, unfollowGoMarketRestaurant, savePreferredMarket } from "../../store/goMarketSlice";
import toast from "react-hot-toast";
import {
  Breadcrumb, CatalogToolbar, ResultBar, SkeletonGrid, STYLES, img, useDebouncedValue,
} from "./shared";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { getOutletBaseMinutes, getOutletDistanceEta } from "../../utils/geoCoords";

const GM_LOC_KEY = "gm_user_location";

const readSavedLocation = () => {
  try {
    const raw = sessionStorage.getItem(GM_LOC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng)) {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch { /* ignore */ }
  return null;
};

const SORT_OPTIONS = [
  { value: "rating", label: "Following + top rated" },
  { value: "name", label: "Name A–Z" },
  { value: "followers", label: "Most popular" },
  { value: "newest", label: "Newest" },
];

const SHOP_TYPE_LABELS = {
  restaurant: "🍽️ Restaurant",
  grocery: "🛒 Grocery",
  fashion: "👕 Fashion",
  electronics: "📱 Electronics",
  medical: "💊 Medical",
  beauty: "💄 Beauty",
  home_kitchen: "🏠 Home & Kitchen",
  gifts_toys: "🎁 Gifts & Toys",
  books_stationery: "📚 Books",
  jewellery: "💎 Jewellery",
  hardware: "🔧 Hardware",
  automobile: "🚗 Automobile",
};

const GoMarketMarket = () => {
  const { marketId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLogin = useSelector((s) => s.app.isLogin);
  const userData = useSelector((s) => s.app.userData);
  
  // Get URL search params to restore filters
  const [searchParams, setSearchParams] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      type: params.get("type") || "all",
      sort: params.get("sort") || "rating",
      openOnly: params.get("openOnly") === "true",
      minRating: Number(params.get("minRating") || 0),
      search: params.get("search") || "",
    };
  });
  
  const [market, setMarket] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [counts, setCounts] = useState({ grocery: 0, restaurant: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.search);
  const debouncedSearch = useDebouncedValue(search, 350);
  const [appliedSearch, setAppliedSearch] = useState(searchParams.search);
  const [sort, setSort] = useState(searchParams.sort);
  const [type, setType] = useState(searchParams.type);
  const [openOnly, setOpenOnly] = useState(searchParams.openOnly);
  const [minRating, setMinRating] = useState(searchParams.minRating);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 12;

  // User geolocation — cache/address first, GPS upgrades without reloading shops
  const [userLocation, setUserLocationState] = useState(readSavedLocation);
  const locationSourceRef = useRef(readSavedLocation() ? "cache" : null);

  const applyAddressFallback = useCallback(() => {
    if (locationSourceRef.current === "gps") return;
    const addresses = userData?.address_details || [];
    const selected = addresses.find((a) => a.selected) || addresses[0];
    if (selected?.latitude && selected?.longitude) {
      locationSourceRef.current = "address";
      const loc = { lat: Number(selected.latitude), lng: Number(selected.longitude) };
      setUserLocationState(loc);
      try {
        sessionStorage.setItem(GM_LOC_KEY, JSON.stringify(loc));
      } catch { /* ignore */ }
    }
  }, [userData]);

  const setUserLocation = useCallback((loc, source = "cache") => {
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return;
    if (locationSourceRef.current === "gps" && source !== "gps") return;
    locationSourceRef.current = source;
    setUserLocationState(loc);
    try {
      sessionStorage.setItem(GM_LOC_KEY, JSON.stringify(loc));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!userData?.goMarketLocation?.coordinates?.length) return;
    const [lng, lat] = userData.goMarketLocation.coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setUserLocation({ lat, lng }, "profile");
    }
  }, [userData?.goMarketLocation, setUserLocation]);

  // Use saved address while GPS loads (if no cache yet)
  useEffect(() => {
    if (locationSourceRef.current) return;
    applyAddressFallback();
  }, [userData, applyAddressFallback]);

  // GPS — ONLY use cached location or fallback to address, do NOT auto-fetch GPS on page load
  useEffect(() => {
    // Skip automatic GPS fetch - only use saved/cached location or address fallback
    if (locationSourceRef.current) {
      // Already have location from cache or profile
      console.log("📍 Using existing location source:", locationSourceRef.current);
      return;
    }
    console.log("📍 No location found, using address fallback");
    applyAddressFallback();
  }, [applyAddressFallback]);

  // Auto-save GPS location to database when GPS detects it (ONLY when manually updated)
  useEffect(() => {
    if (locationSourceRef.current !== "gps" || !userLocation || !isLogin || !marketId) return;
    
    const saveLocationToDB = async () => {
      try {
        console.log("💾 Saving GPS location to database:", userLocation);
        await dispatch(savePreferredMarket({ 
          marketId, 
          location: userLocation,
          address: `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`
        })).unwrap();
        console.log("✅ Location saved successfully");
      } catch (err) {
        console.error("❌ Failed to save location:", err);
      }
    };
    
    saveLocationToDB();
  }, [userLocation, isLogin, marketId, dispatch]);

  // Shop suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchRef = React.useRef(null);

  // Update URL params when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (sort !== "rating") params.set("sort", sort);
    if (openOnly) params.set("openOnly", "true");
    if (minRating > 0) params.set("minRating", String(minRating));
    if (appliedSearch) params.set("search", appliedSearch);
    
    const newSearch = params.toString();
    const currentSearch = window.location.search.slice(1);
    if (newSearch !== currentSearch) {
      navigate(`/go-market/market/${marketId}${newSearch ? `?${newSearch}` : ""}`, { replace: true });
    }
  }, [type, sort, openOnly, minRating, debouncedSearch, marketId, navigate]);

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (type !== "all") count++;
    if (openOnly) count++;
    if (minRating > 0) count++;
    if (appliedSearch) count++;
    return count;
  }, [type, openOnly, minRating, appliedSearch]);

  // Clear all filters
  const clearFilters = () => {
    setType("all");
    setOpenOnly(false);
    setMinRating(0);
    setSearch("");
    setAppliedSearch("");
    setSort("rating");
  };

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLogin) {
      navigate("/login");
    }
  }, [isLogin, navigate]);

  const load = useCallback(
    (pageNum, append) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams({
        type,
        sort,
        page: String(pageNum),
        limit: String(limit),
        search: appliedSearch,
        ...(openOnly ? { openOnly: "true" } : {}),
        ...(minRating > 0 ? { minRating: String(minRating) } : {}),
      });
      const url = `/api/go-market/markets/${marketId}/outlets?${params}`;
      fetchDataFromApi(url)
        .then((res) => {
          if (res?.success || res?.error === false) {
            setMarket(res.market);
            setOutlets((prev) => (append ? [...prev, ...(res.data || [])] : res.data || []));
            setCounts(res.counts || {});
            setPagination(res.pagination || { totalPages: 1, total: 0 });
            setPage(pageNum);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [marketId, type, sort, appliedSearch, openOnly, minRating],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  // Fetch shop suggestions with debounced search
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!search.trim() || search.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const params = new URLSearchParams({ q: search });
        const url = `/api/go-market/markets/${marketId}/shop-suggestions?${params}`;
        const res = await fetchDataFromApi(url);
        if (res?.success) {
          setSuggestions(res.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [search, marketId]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasMore = page < (pagination.totalPages || 1);
  const marketSentinel = useInfiniteScroll({
    enabled: true,
    hasMore,
    loading: loading || loadingMore,
    onLoadMore: () => load(page + 1, true),
  });

  const onSearch = (e) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion.label);
    setAppliedSearch(suggestion.label);
    setShowSuggestions(false);
    
    // Navigate to the shop
    const path = suggestion.type === "restaurant"
      ? `/go-market/restaurant/${suggestion._id}`
      : `/go-market/shop/${suggestion._id}`;
    navigate(path);
  };

  const handleFollow = async (e, outlet) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLogin) {
      toast.error("Please login to follow");
      navigate("/login");
      return;
    }

    try {
      const isRestaurant = outlet.outletType === "restaurant";
      const wasFollowing = outlet.isFollowing;
      const action = wasFollowing
        ? (isRestaurant ? unfollowGoMarketRestaurant : unfollowGoMarketShop)
        : (isRestaurant ? followGoMarketRestaurant : followGoMarketShop);

      // Optimistic update — no full reload
      setOutlets((prev) =>
        prev.map((o) =>
          o._id === outlet._id
            ? {
                ...o,
                isFollowing: !wasFollowing,
                followerCount: Math.max(0, (o.followerCount || 0) + (wasFollowing ? -1 : 1)),
              }
            : o
        )
      );

      await dispatch(action(outlet._id)).unwrap();
      toast.success(wasFollowing ? "Unfollowed" : `Following ${outlet.displayName}`);
    } catch {
      // Revert optimistic update on failure
      setOutlets((prev) =>
        prev.map((o) =>
          o._id === outlet._id
            ? {
                ...o,
                isFollowing: outlet.isFollowing,
                followerCount: outlet.followerCount,
              }
            : o
        )
      );
      toast.error("Failed to update follow");
    }
  };

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <div className="gmp-container">
        <Breadcrumb items={[
          { to: "/go-market", label: "Go Market" },
          { label: market?.name || "Market" },
        ]} />

        {market && (
          <div
            className="gmp-market-banner"
            style={{ backgroundImage: `url(${img(market.banner)})` }}
          >
            <div className="gmp-market-banner-overlay">
              <div>
                <h2>{market.name}</h2>
                <p>{market.city}, {market.state} · {market.pincode}</p>
              </div>
              {/* <button
                type="button"
                onClick={() => navigate("/go-market?edit=true")}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e2e8f0",
                  color: "#1e293b",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 1)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.95)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <span>✏️</span>
                Change Market
              </button> */}
              <button
                type="button"
                onClick={() => navigate("/go-market?edit=true&updateLocation=true")}
                style={{
                  position: "absolute", top: 58, right: 16, background: "rgba(16,185,129,.95)",
                  border: "1px solid rgba(255,255,255,.5)", color: "#fff", padding: "8px 14px",
                  borderRadius: "6px", fontWeight: 700, fontSize: "13px", cursor: "pointer"
                }}
              >
                📍 Update Location
              </button>
            </div>
          </div>
        )}

        <div className="gmp-chip-row" style={{ marginTop: 16 }}>
          {[
            { k: "all", l: "🏪 All Shops", icon: "🏪" },
            { k: "grocery", l: "🛒 Grocery", icon: "🛒" },
            { k: "restaurant", l: "🍽 Restaurant", icon: "🍽" },
            { k: "fashion", l: "👕 Fashion", icon: "👕" },
            { k: "electronics", l: "📱 Electronics", icon: "📱" },
            { k: "medical", l: "💊 Medical", icon: "💊" },
            { k: "beauty", l: "💄 Beauty", icon: "💄" },
            { k: "home_kitchen", l: "🏠 Home & Kitchen", icon: "🏠" },
            { k: "gifts_toys", l: "🎁 Gifts & Toys", icon: "🎁" },
            { k: "books_stationery", l: "📚 Books & Stationery", icon: "📚" },
            { k: "jewellery", l: "💎 Jewellery", icon: "💎" },
            { k: "hardware", l: "🔧 Hardware", icon: "🔧" },
            { k: "automobile", l: "🚗 Automobile", icon: "🚗" },
          ].map((t) => (
            <button
              key={t.k}
              type="button"
              className={`gmp-chip${type === t.k ? " active" : ""}`}
              onClick={() => { setType(t.k); }}
            >
              {t.l}
            </button>
          ))}
          
          {/* Clear filters button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="gmp-chip"
              style={{ 
                background: "#fee2e2", 
                color: "#dc2626", 
                borderColor: "#fecaca",
                fontWeight: 700 
              }}
              onClick={clearFilters}
            >
              ✕ Clear {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}
            </button>
          )}
        </div>

        <CatalogToolbar
          search={search}
          setSearch={setSearch}
          onSearch={onSearch}
          sort={sort}
          setSort={(v) => { setSort(v); }}
          sortOptions={SORT_OPTIONS}
          searchRef={searchRef}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          suggestionsLoading={suggestionsLoading}
          onSuggestionClick={handleSuggestionClick}
          activeFiltersCount={activeFiltersCount}
          filters={(
            <>
              
              <select
                className="gmp-select"
                style={{ width: "auto", paddingLeft: 12, height: 38 }}
                value={minRating}
                onChange={(e) => { setMinRating(Number(e.target.value)); }}
              >
                <option value={0}>Any rating</option>
                <option value={3}>3★+</option>
                <option value={4}>4★+</option>
              </select>
            </>
          )}
        />

        <ResultBar total={pagination.total} label="shops & restaurants" loading={loading} />

        {loading ? (
          <SkeletonGrid count={6} />
        ) : outlets.length === 0 ? (
          <div className="gmp-empty">
            <span className="gmp-empty-icon">🏪</span>
            No shops match your filters.
          </div>
        ) : (
          <div className="gmp-grid">
            {outlets.map((o) => {
              const href = o.outletType === "restaurant"
                ? `/go-market/restaurant/${o._id}`
                : `/go-market/shop/${o._id}`;
              
              return (
                <div key={`${o.outletType}-${o._id}`} className="gmp-card-wrapper">
                  <Link to={href} className="gmp-card gmp-card-enhanced">
                    {/* Banner Image */}
                    <div className="gmp-card-banner-container">
                      <img className="gmp-card-banner" src={img(o.banner)} alt={o.displayName} />
                      <div className="gmp-card-badge">
                        {SHOP_TYPE_LABELS[o.outletType] || SHOP_TYPE_LABELS[o.shopType] || "🛒 Grocery"}
                      </div>
                      {o.isOpen && <div className="gmp-card-open-badge">Open Now</div>}
                    </div>

                    {/* Logo Overlay */}
                    <div className="gmp-card-logo-wrapper">
                      <img src={img(o.logo)} alt={o.displayName} className="gmp-card-logo" />
                    </div>

                    <div className="gmp-card-body">
                      {/* Title & Address */}
                      <div style={{ marginTop: 32 }}>
                        <div className="gmp-card-title">{o.displayName}</div>
                        <div className="gmp-card-addr">{o.address}</div>
                      </div>

                      {/* Stats Row */}
                      <div className="gmp-card-stats">
                        <div className="gmp-card-stat">
                          <span className="gmp-card-stat-icon">⭐</span>
                          <span className="gmp-card-stat-value">{(o.rating || 0).toFixed(1)}</span>
                        </div>
                        <div className="gmp-card-stat">
                          <span className="gmp-card-stat-icon">❤️</span>
                          <span className="gmp-card-stat-value">{o.followerCount || 0}</span>
                        </div>
                        <div className="gmp-card-stat">
                          <span className="gmp-card-stat-icon">💬</span>
                          <span className="gmp-card-stat-value">{o.reviewCount || 0}</span>
                        </div>
                        <div className="gmp-card-stat">
                          <span className="gmp-card-stat-icon">📦</span>
                          <span className="gmp-card-stat-value">{o.totalProducts || 0}</span>
                        </div>
                      </div>

                      {/* Distance & Delivery Time — computed client-side */}
                      {(() => {
                        const { distanceDisplay: distLabel, estimatedTime: eta } = getOutletDistanceEta({
                          userLat: userLocation?.lat,
                          userLng: userLocation?.lng,
                          shopLat: o.latitude,
                          shopLng: o.longitude,
                          marketLat: market?.latitude,
                          marketLng: market?.longitude,
                          baseMinutes: getOutletBaseMinutes(o.outletType),
                        });
                        if (!distLabel) return null;
                        return (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              background: "#EEF2FF", color: "#3730A3",
                              border: "1px solid #C7D2FE",
                              borderRadius: 999, padding: "3px 10px",
                              fontSize: 12, fontWeight: 700,
                            }}>
                              📍 {distLabel}
                            </span>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              background: "#FEF3C7", color: "#92400E",
                              border: "1px solid #FDE68A",
                              borderRadius: 999, padding: "3px 10px",
                              fontSize: 12, fontWeight: 700,
                            }}>
                              🕐 {eta} min
                            </span>
                          </div>
                        );
                      })()}

                      {/* Meta Info */}
                      <div className="gmp-card-meta">{o.meta}</div>

                      {/* Action Buttons */}
                      <div className="gmp-card-actions">
                        <button
                          type="button"
                          className={`gmp-card-btn gmp-card-btn-follow${o.isFollowing ? " following" : ""}`}
                          onClick={(e) => handleFollow(e, o)}
                        >
                          <span>{o.isFollowing ? "✓" : "❤️"}</span>
                          {o.isFollowing ? "Following" : "Follow"}
                        </button>
                        <div className="gmp-card-btn gmp-card-btn-view">
                          View Shop →
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div ref={marketSentinel} style={{ height: 1 }} />
        {loadingMore && (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: 16 }}>Loading more shops…</p>
        )}
      </div>
    </div>
  );
};

export default GoMarketMarket;
