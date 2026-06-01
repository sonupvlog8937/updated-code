import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchDataFromApi } from "../../utils/api";
import { followGoMarketShop, followGoMarketRestaurant, unfollowGoMarketShop, unfollowGoMarketRestaurant } from "../../store/goMarketSlice";
import toast from "react-hot-toast";
import {
  Breadcrumb, CatalogToolbar, ResultBar, SkeletonGrid, STYLES, img, useDebouncedValue,
} from "./shared";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";

const SORT_OPTIONS = [
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Name A–Z" },
  { value: "followers", label: "Most popular" },
  { value: "newest", label: "Newest" },
];

const GoMarketMarket = () => {
  const { marketId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLogin = useSelector((s) => s.app.isLogin);
  
  const [market, setMarket] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [counts, setCounts] = useState({ grocery: 0, restaurant: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [sort, setSort] = useState("rating");
  const [type, setType] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 12;

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
        search: debouncedSearch,
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
    [marketId, type, sort, debouncedSearch, openOnly, minRating],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const hasMore = page < (pagination.totalPages || 1);
  const marketSentinel = useInfiniteScroll({
    enabled: true,
    hasMore,
    loading: loading || loadingMore,
    onLoadMore: () => load(page + 1, true),
  });

  const onSearch = (e) => {
    e.preventDefault();
    load(1, false);
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
      const action = outlet.isFollowing
        ? (isRestaurant ? unfollowGoMarketRestaurant : unfollowGoMarketShop)
        : (isRestaurant ? followGoMarketRestaurant : followGoMarketShop);
      await dispatch(action(outlet._id)).unwrap();
      toast.success(outlet.isFollowing ? "Unfollowed" : `Following ${outlet.displayName}`);
      load(1, false);
    } catch {
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
            </div>
          </div>
        )}

        <div className="gmp-chip-row" style={{ marginTop: 16 }}>
          {[
            { k: "all", l: `All (${(counts.grocery || 0) + (counts.restaurant || 0)})` },
            { k: "grocery", l: `Grocery (${counts.grocery || 0})` },
            { k: "restaurant", l: `Restaurants (${counts.restaurant || 0})` },
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
        </div>

        <CatalogToolbar
          search={search}
          setSearch={setSearch}
          onSearch={onSearch}
          sort={sort}
          setSort={(v) => { setSort(v); }}
          sortOptions={SORT_OPTIONS}
          filters={(
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                <input type="checkbox" checked={openOnly} onChange={(e) => { setOpenOnly(e.target.checked); }} />
                Open now
              </label>
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
                        {o.outletType === "restaurant" ? "🍽️ Restaurant" : "🛒 Grocery"}
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
