import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDataFromApi } from "../../utils/api";
import { followGoMarketRestaurant, unfollowGoMarketRestaurant } from "../../store/goMarketSlice";
import toast from "react-hot-toast";
import {
  Breadcrumb,
  STYLES,
  StarRating,
  img,
} from "./shared";

import GoMarketRestaurantCatalog from "./GoMarketRestaurantCatalog";

const GoMarketRestaurant = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isLogin = useSelector((st) => st.app.isLogin);

  const queryFromUrl = (searchParams.get("q") || "").trim();
  const isSearchPage = location.pathname.endsWith("/search");

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

 useEffect(() => { if (!isLogin) navigate("/login"); }, [isLogin, navigate]);

 const loadRestaurant = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchDataFromApi(`/api/go-market/restaurants/${id}/catalog?limit=1&page=1`).then((res) => {
      if (res?.success || res?.error === false) setRestaurant(res.restaurant);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadRestaurant(); }, [loadRestaurant]);

  const handleFollowToggle = async () => {
    if (!isLogin) { toast.error("Please login to follow"); navigate("/login"); return; }
    if (!restaurant?._id) return;
    setFollowBusy(true);
    try {
      const action = restaurant.isFollowing ? unfollowGoMarketRestaurant : followGoMarketRestaurant;
      const res = await dispatch(action(restaurant._id)).unwrap();
      const data = res?.data || res;
      setRestaurant((r) => ({ ...r, isFollowing: data?.isFollowing ?? !r.isFollowing, followerCount: data?.followerCount ?? r.followerCount }));
      toast.success(restaurant.isFollowing ? "Unfollowed" : "Following restaurant");
   } catch { toast.error("Could not update follow"); } finally { setFollowBusy(false); }
  };

  if (!restaurant && loading) {
    return <div className="gmp-root"><style>{STYLES}</style><div className="gmp-empty">Loading restaurant…</div></div>;
  }

  const marketId = restaurant?.marketId?._id || restaurant?.marketId;
  const productRating = restaurant?.productAverageRating ?? restaurant?.rating ?? 0;
  const productReviews = restaurant?.productReviewCount ?? restaurant?.totalReviews ?? 0;

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <div className="gmp-detail-head">
        <img src={img(restaurant?.restaurantBanner)} className="gmp-detail-banner" alt="" />
        <div className="gmp-detail-info">
          <img src={img(restaurant?.restaurantLogo)} className="gmp-detail-logo" alt="" />
          <div className="gmp-detail-body" style={{ flex: 1 }}>
           <Breadcrumb items={[{ to: "/go-market", label: "Go Market" }, ...(marketId ? [{ to: `/go-market/market/${marketId}`, label: restaurant?.marketId?.name || "Market" }] : []), { to: `/go-market/restaurant/${id}`, label: restaurant?.restaurantName }, ...(isSearchPage ? [{ label: queryFromUrl ? `Search: ${queryFromUrl}` : "Search" }] : [])]} />
            <h1>{restaurant?.restaurantName}</h1>

            <div className="gmp-meta-row">
              <span className="gmp-meta-chip">📍 {restaurant?.address}</span>
              <span className="gmp-meta-chip"><StarRating value={productRating} /> {Number(productRating || 0).toFixed(1)} avg product rating</span>
              <span className="gmp-meta-chip">👥 {restaurant?.followerCount ?? 0} followers</span>
              <span className="gmp-meta-chip">💬 {productReviews} product reviews</span>
              <span className={`gmp-status ${restaurant?.isOpen ? "open" : "closed"}`}>{restaurant?.isOpen ? "Open" : "Closed"}</span>
            </div>

             {restaurant?.description && <p style={{ fontSize: 14, color: "#475569", marginTop: 10, lineHeight: 1.55, maxWidth: 640 }}>{restaurant.description}</p>}

            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button type="button" className={`gmp-btn ${restaurant?.isFollowing ? "gmp-btn-outline" : "gmp-btn-primary"}`} disabled={followBusy} onClick={handleFollowToggle}>{restaurant?.isFollowing ? "✓ Following" : "❤️ Follow"}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="gmp-container">
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "20px 0 0" }}>{isSearchPage ? (queryFromUrl ? `Results for “${queryFromUrl}”` : "Search dishes") : "Menu"}</h2>
        <GoMarketRestaurantCatalog restaurantId={id} searchMode={isSearchPage} initialQuery={queryFromUrl} onRestaurant={setRestaurant} />
      </div>
    </div>
  );
};

export default GoMarketRestaurant;