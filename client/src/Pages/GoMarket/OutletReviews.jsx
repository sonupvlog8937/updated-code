import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchDataFromApi, postData } from "../../utils/api";
import { StarRating } from "./shared";

const REVIEW_STYLES = `
.gmp-reviews-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-top: 20px; }
.gmp-reviews-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.gmp-reviews-score { display: flex; align-items: center; gap: 14px; }
.gmp-reviews-score-num { font-size: 42px; font-weight: 800; line-height: 1; color: #0f172a; }
.gmp-reviews-list { margin-top: 8px; }
.gmp-review-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
.gmp-review-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#2563eb,#7c3aed); color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.gmp-review-form { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 16px; }
.gmp-review-form textarea { width: 100%; min-height: 88px; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px; font-size: 14px; resize: vertical; font-family: inherit; }
.gmp-review-form textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.gmp-star-pick { display: flex; gap: 4px; margin: 10px 0; }
.gmp-star-pick button { background: none; border: none; font-size: 26px; cursor: pointer; padding: 0; line-height: 1; opacity: 0.35; transition: transform .1s, opacity .15s; }
.gmp-star-pick button.on { opacity: 1; transform: scale(1.08); }
.gmp-infinite-sentinel { height: 1px; }
.gmp-infinite-loader { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; color: #64748b; font-size: 13px; font-weight: 600; }
.gmp-infinite-dots span { width: 6px; height: 6px; border-radius: 50%; background: #2563eb; display: inline-block; animation: gmpDot 1.2s infinite ease-in-out; }
.gmp-infinite-dots span:nth-child(2) { animation-delay: .15s; }
.gmp-infinite-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes gmpDot { 0%,80%,100% { transform: scale(.6); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }
`;

const reviewApiBase = (outletType, outletId) =>
  outletType === "restaurant"
    ? `/api/go-market/restaurants/${outletId}/reviews`
    : `/api/go-market/grocery-shops/${outletId}/reviews`;

export const OutletReviewsSection = ({
  outletId,
  outletType = "grocery",
  outletName = "Shop",
  isLogin,
  initialAverage = 0,
  initialTotal = 0,
  initialBreakdown = null,
  onStatsChange,
}) => {
  const navigate = useNavigate();
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [avgRating, setAvgRating] = useState(initialAverage);
  const [totalReviews, setTotalReviews] = useState(initialTotal);
  const [breakdown, setBreakdown] = useState(initialBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPage = useCallback(
    async (pageNum, append = false) => {
      if (!outletId) return;
      if (append) {
        if (loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetchDataFromApi(
          `${reviewApiBase(outletType, outletId)}?page=${pageNum}&limit=8&sort=NEWEST`,
        );
        const payload = res?.data || res;
        const list = payload?.reviews || [];
        setReviews((prev) => (append ? [...prev, ...list] : list));
        setHasMore(Boolean(payload?.hasMore));
        setPage(pageNum);
        if (payload?.averageRating != null) setAvgRating(payload.averageRating);
        if (payload?.totalReviews != null) {
          setTotalReviews(payload.totalReviews);
          onStatsChange?.({ averageRating: payload.averageRating, totalReviews: payload.totalReviews });
        }
        if (payload?.breakdown) setBreakdown(payload.breakdown);
      } catch {
        if (!append) setReviews([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [outletId, outletType, hasMore, onStatsChange],
  );

  useEffect(() => {
    setReviews([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, false);
  }, [outletId, outletType]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          loadPage(page + 1, true);
        }
      },
      { rootMargin: "120px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, loadPage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin) {
      toast.error("Login to leave a review");
      navigate("/login");
      return;
    }
    if (!draftText.trim()) {
      toast.error("Please write your review");
      return;
    }
    setSubmitting(true);
    try {
      const res = await postData(reviewApiBase(outletType, outletId), {
        rating: draftRating,
        review: draftText.trim(),
      });
      if (res?.error) throw new Error(res.message || "Failed");
      toast.success("Review submitted!");
      setDraftText("");
      setDraftRating(5);
      setReviews([]);
      setHasMore(true);
      await loadPage(1, false);
    } catch (err) {
      toast.error(err?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const total = totalReviews || 0;
  const maxBar = Math.max(...[1, 2, 3, 4, 5].map((k) => breakdown[k] || breakdown[String(k)] || 0), 1);

  return (
    <section className="gmp-reviews-card">
      <style>{REVIEW_STYLES}</style>
      <div className="gmp-reviews-head">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Reviews &amp; ratings</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            What customers say about {outletName}
          </p>
        </div>
        <div className="gmp-reviews-score">
          <span className="gmp-reviews-score-num">{Number(avgRating || 0).toFixed(1)}</span>
          <div>
            <StarRating value={avgRating} size={18} />
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 600 }}>
              {total} review{total !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="gmp-rating-bars">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[star] ?? breakdown[String(star)] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div className="gmp-rating-bar-row" key={star}>
              <span style={{ width: 28 }}>{star}★</span>
              <div className="gmp-rating-bar-track">
                <div className="gmp-rating-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span style={{ width: 24, textAlign: "right" }}>{count}</span>
            </div>
          );
        })}
      </div>

      <form className="gmp-review-form" onSubmit={handleSubmit}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Rate this shop</div>
        <div className="gmp-star-pick">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              className={draftRating >= s ? "on" : ""}
              onClick={() => setDraftRating(s)}
              aria-label={`${s} stars`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          placeholder={`Share your experience at ${outletName}…`}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          maxLength={2000}
        />
        <button
          type="submit"
          className="gmp-btn gmp-btn-primary"
          style={{ marginTop: 10 }}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>

      <div className="gmp-reviews-list">
        {loading && reviews.length === 0 ? (
          <div className="gmp-infinite-loader">
            <span className="gmp-infinite-dots">
              <span /><span /><span />
            </span>
            Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>
            No reviews yet. Be the first!
          </p>
        ) : (
          reviews.map((r) => (
            <article className="gmp-review-item" key={r._id}>
              <div className="gmp-review-avatar">
                {(r.userName || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14 }}>{r.userName || "Customer"}</strong>
                  <StarRating value={r.rating} size={12} />
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{r.review}</p>
              </div>
            </article>
          ))
        )}
      </div>

      {loadingMore && (
        <div className="gmp-infinite-loader">
          <span className="gmp-infinite-dots">
            <span /><span /><span />
          </span>
          Loading more…
        </div>
      )}
      {!hasMore && reviews.length > 0 && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 12 }}>
          You&apos;ve seen all reviews
        </p>
      )}
      <div ref={sentinelRef} className="gmp-infinite-sentinel" aria-hidden="true" />
    </section>
  );
};

export default OutletReviewsSection;
