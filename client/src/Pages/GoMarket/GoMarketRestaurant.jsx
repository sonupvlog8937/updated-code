import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDataFromApi } from "../../utils/api";
import { followGoMarketRestaurant, unfollowGoMarketRestaurant } from "../../store/goMarketSlice";
import toast from "react-hot-toast";
import {
  Breadcrumb,
  CatalogToolbar,
  Pagination,
  ResultBar,
  SkeletonGrid,
  STYLES,
  StarRating,
  img,
} from "./shared";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
];

const GoMarketRestaurant = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isLogin = useSelector((s) => s.app.isLogin);

  const queryFromUrl = (searchParams.get("q") || "").trim();
  const isSearchPage = location.pathname.endsWith("/search");

  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(queryFromUrl);
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!isLogin) navigate("/login");
  }, [isLogin, navigate]);

  useEffect(() => {
    setSearch(queryFromUrl);
    setPage(1);
  }, [queryFromUrl, isSearchPage]);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    const params = new URLSearchParams({
      sort,
      page: String(page),
      limit: "16",
      search: isSearchPage ? queryFromUrl : "",
      ...(availableOnly ? { availableOnly: "true" } : {}),
      ...(minPrice ? { minPrice } : {}),
      ...(maxPrice ? { maxPrice } : {}),
    });
    fetchDataFromApi(`/api/go-market/restaurants/${id}/catalog?${params}`)
      .then((res) => {
        if (res?.success || res?.error === false) {
          setRestaurant(res.restaurant);
          setItems(res.data || []);
          setPagination(res.pagination || { totalPages: 1, total: 0 });
        }
      })
      .finally(() => setLoading(false));
  }, [id, sort, page, isSearchPage, queryFromUrl, availableOnly, minPrice, maxPrice]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (e) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) {
      if (isSearchPage) navigate(`/go-market/restaurant/${id}`);
      return;
    }
    if (isSearchPage && query === queryFromUrl) {
      setPage(1);
      return;
    }
    navigate(`/go-market/restaurant/${id}/search?q=${encodeURIComponent(query)}`);
  };

  const handleFollowToggle = async () => {
    if (!isLogin) {
      toast.error("Please login to follow");
      navigate("/login");
      return;
    }
    if (!restaurant?._id) return;
    setFollowBusy(true);
    try {
      const action = restaurant.isFollowing ? unfollowGoMarketRestaurant : followGoMarketRestaurant;
      const res = await dispatch(action(restaurant._id)).unwrap();
      const data = res?.data || res;
      setRestaurant((r) => ({
        ...r,
        isFollowing: data?.isFollowing ?? !r.isFollowing,
        followerCount: data?.followerCount ?? r.followerCount,
      }));
      toast.success(restaurant.isFollowing ? "Unfollowed" : "Following restaurant");
    } catch {
      toast.error("Could not update follow");
    } finally {
      setFollowBusy(false);
    }
  };

  if (!restaurant && loading) {
    return (
      <div className="gmp-root">
        <style>{STYLES}</style>
        <div className="gmp-empty">Loading restaurant…</div>
      </div>
    );
  }

  const marketId = restaurant?.marketId?._id || restaurant?.marketId;

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <div className="gmp-detail-head">
        <img src={img(restaurant?.restaurantBanner)} className="gmp-detail-banner" alt="" />
        <div className="gmp-detail-info">
          <img src={img(restaurant?.restaurantLogo)} className="gmp-detail-logo" alt="" />
          <div className="gmp-detail-body" style={{ flex: 1 }}>
            <Breadcrumb
              items={[
                { to: "/go-market", label: "Go Market" },
                ...(marketId
                  ? [{ to: `/go-market/market/${marketId}`, label: restaurant?.marketId?.name || "Market" }]
                  : []),
                { to: `/go-market/restaurant/${id}`, label: restaurant?.restaurantName },
                ...(isSearchPage ? [{ label: queryFromUrl ? `Search: ${queryFromUrl}` : "Search" }] : []),
              ]}
            />
            <h1>{restaurant?.restaurantName}</h1>

            <div className="gmp-meta-row">
              <span className="gmp-meta-chip">📍 {restaurant?.address}</span>
              <span className="gmp-meta-chip">
                <StarRating value={restaurant?.rating} /> {Number(restaurant?.rating || 0).toFixed(1)}
              </span>
              <span className="gmp-meta-chip">👥 {restaurant?.followerCount ?? 0} followers</span>
              <span className="gmp-meta-chip">💬 {restaurant?.totalReviews ?? 0} reviews</span>
              <span className={`gmp-status ${restaurant?.isOpen ? "open" : "closed"}`}>
                {restaurant?.isOpen ? "Open" : "Closed"}
              </span>
            </div>

            {restaurant?.description && (
              <p style={{ fontSize: 14, color: "#475569", marginTop: 10, lineHeight: 1.55, maxWidth: 640 }}>
                {restaurant.description}
              </p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`gmp-btn ${restaurant?.isFollowing ? "gmp-btn-outline" : "gmp-btn-primary"}`}
                disabled={followBusy}
                onClick={handleFollowToggle}
              >
                {restaurant?.isFollowing ? "✓ Following" : "❤️ Follow"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="gmp-container">
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "20px 0 0" }}>
          {isSearchPage ? (queryFromUrl ? `Results for “${queryFromUrl}”` : "Search dishes") : "Menu"}
        </h2>

        <CatalogToolbar
          search={search}
          setSearch={setSearch}
          onSearch={submitSearch}
          sort={sort}
          setSort={(v) => {
            setSort(v);
            setPage(1);
          }}
          sortOptions={SORT_OPTIONS}
          filters={
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => {
                    setAvailableOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                Available only
              </label>
              <input
                className="gmp-input"
                style={{ width: 90, height: 38, paddingLeft: 10 }}
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
              />
              <input
                className="gmp-input"
                style={{ width: 90, height: 38, paddingLeft: 10 }}
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
              />
            </>
          }
        />

        <ResultBar total={pagination.total} label="dishes" loading={loading} />

        {loading ? (
          <SkeletonGrid count={8} type="product" />
        ) : items.length === 0 ? (
          <div className="gmp-empty">
            <span className="gmp-empty-icon">🍽️</span>
            No dishes found.
          </div>
        ) : (
          <div className="gmp-product-grid">
            {items.map((item) => (
              <Link to={`/go-market/product/restaurant/${item._id}`} className="gmp-product-tile" key={item._id}>
                <img src={img(item.image)} alt={item.itemName} />
                <div className="gmp-product-body">
                  <div className="gmp-product-name">{item.itemName}</div>
                  <div className="gmp-product-price">
                    <b>₹{item.price}</b>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={pagination.totalPages || 1} onPage={setPage} />
      </div>
    </div>
  );
};

export default GoMarketRestaurant;