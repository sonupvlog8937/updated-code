import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDataFromApi } from "../../utils/api";
import { followGoMarketShop, unfollowGoMarketShop } from "../../store/goMarketSlice";
import toast from "react-hot-toast";
import { Breadcrumb, STYLES, StarRating, img } from "./shared";
import GoMarketShopCatalog from "./GoMarketShopCatalog";

const GoMarketShop = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLogin = useSelector((s) => s.app.isLogin);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!isLogin) navigate("/login");
  }, [isLogin, navigate]);

  const loadShop = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchDataFromApi(`/api/go-market/grocery-shops/${id}/catalog?limit=1&page=1`)
      .then((res) => {
        if (res?.success || res?.error === false) setShop(res.shop);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const handleFollowToggle = async () => {
    if (!isLogin) {
      toast.error("Please login to follow");
      navigate("/login");
      return;
    }
    if (!shop?._id) return;
    setFollowBusy(true);
    try {
      const action = shop.isFollowing ? unfollowGoMarketShop : followGoMarketShop;
      const res = await dispatch(action(shop._id)).unwrap();
      const data = res?.data || res;
      setShop((s) => ({
        ...s,
        isFollowing: data?.isFollowing ?? !s.isFollowing,
        followerCount: data?.followerCount ?? s.followerCount,
      }));
      toast.success(shop.isFollowing ? "Unfollowed" : "Following shop");
    } catch {
      toast.error("Could not update follow");
    } finally {
      setFollowBusy(false);
    }
  };

  if (!shop && loading) {
    return (
      <div className="gmp-root">
        <style>{STYLES}</style>
        <div className="gmp-empty">Loading shop…</div>
      </div>
    );
  }

  const marketId = shop?.marketId?._id || shop?.marketId;
  const followerCount = shop?.followerCount ?? 0;
  const productRating = shop?.productAverageRating ?? shop?.rating ?? 0;
  const reviewTotal = shop?.productReviewCount ?? shop?.totalReviews ?? 0;

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <div className="gmp-detail-head">
        <img src={img(shop?.shopBanner)} className="gmp-detail-banner" alt="" />
        <div className="gmp-detail-info">
          <img src={img(shop?.shopLogo)} className="gmp-detail-logo" alt="" />
          <div className="gmp-detail-body" style={{ flex: 1 }}>
            <Breadcrumb
              items={[
                { to: "/go-market", label: "Go Market" },
                ...(marketId
                  ? [{ to: `/go-market/market/${marketId}`, label: shop?.marketId?.name || "Market" }]
                  : []),
                { label: shop?.shopName },
              ]}
            />
            <h1>{shop?.shopName}</h1>
            <div className="gmp-meta-row">
              <span className="gmp-meta-chip">📍 {shop?.address}</span>
              <span className="gmp-meta-chip">
                <StarRating value={productRating} /> {Number(productRating || 0).toFixed(1)} avg product rating
              </span>
              <span className="gmp-meta-chip">👥 {followerCount} followers</span>
              <span className="gmp-meta-chip">💬 {reviewTotal} product reviews</span>
              <span className="gmp-meta-chip">📦 {shop?.totalProducts || 0} products</span>
              <span className={`gmp-status ${shop?.isOpen ? "open" : "closed"}`}>
                {shop?.isOpen ? "Open" : "Closed"}
              </span>
            </div>
            {shop?.description && (
              <div style={{ marginTop: 10, maxWidth: 640 }}>
                <p style={{ 
                  fontSize: 14, 
                  color: "#475569", 
                  lineHeight: 1.55,
                  display: '-webkit-box',
                  WebkitLineClamp: descExpanded ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: descExpanded ? 'visible' : 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {shop.description}
                </p>
                {shop.description.length > 100 && (
                  <button 
                    type="button"
                    onClick={() => setDescExpanded(!descExpanded)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 0',
                      marginTop: 4
                    }}
                  >
                    {descExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`gmp-btn ${shop?.isFollowing ? "gmp-btn-outline" : "gmp-btn-primary"}`}
                disabled={followBusy}
                onClick={handleFollowToggle}
              >
                {shop?.isFollowing ? "✓ Following" : "❤️ Follow"}
              </button>
              {shop?.ownerId?.mobile && (
                <a
                  className="gmp-btn gmp-btn-outline"
                  href={`tel:${shop.ownerId.mobile}`}
                  style={{ textDecoration: "none" }}
                >
                  📞 Contact
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="gmp-container">
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "20px 0 0" }}>Products</h2>
        <GoMarketShopCatalog shopId={id} />
      </div>
    </div>
  );
};

export default GoMarketShop;
