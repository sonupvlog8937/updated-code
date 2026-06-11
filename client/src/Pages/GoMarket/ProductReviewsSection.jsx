import React, { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchDataFromApi, postData } from "../../utils/api";
import { StarRating } from "./shared";

const SECTION_STYLES = `
.gmp-pr-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 22px 20px;
  margin-top: 20px;
}
.gmp-pr-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.gmp-pr-score { display: flex; align-items: center; gap: 14px; }
.gmp-pr-score-num { font-size: 42px; font-weight: 800; color: #0f172a; line-height: 1; }
.gmp-pr-bar-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; margin-bottom: 4px; }
.gmp-pr-bar { flex: 1; height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
.gmp-pr-bar-fill { height: 100%; background: linear-gradient(90deg,#f59e0b,#fbbf24); border-radius: 99px; }
.gmp-pr-form { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 18px; }
.gmp-pr-form textarea {
  width: 100%; min-height: 88px; border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: 12px; font-size: 14px; resize: vertical; font-family: inherit; margin-top: 8px;
}
.gmp-pr-star-pick { display: flex; gap: 4px; margin: 6px 0; }
.gmp-pr-star-pick button { background: none; border: none; font-size: 28px; cursor: pointer; opacity: .35; padding: 0; }
.gmp-pr-star-pick button.on { opacity: 1; transform: scale(1.06); }
.gmp-pr-item { display: flex; gap: 12px; padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
.gmp-pr-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: linear-gradient(135deg,#2563eb,#7c3aed);
  color: #fff; font-weight: 700; font-size: 15px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.gmp-pr-load { width: 100%; margin-top: 12px; padding: 12px; border-radius: 12px;
  border: 1.5px solid #e2e8f0; background: #fff; font-weight: 700; font-size: 14px; color: #334155; cursor: pointer; }
.gmp-pr-load:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.gmp-pr-load:disabled { opacity: .6; cursor: not-allowed; }
@media (max-width: 720px) {
  .gmp-pr-split { grid-template-columns: 1fr !important; }
}
`;

export default function ProductReviewsSection({
  productId,
  productTitle = "Product",
  isLogin,
  userName = "",
  initialAverage = 0,
  initialTotal = 0,
  onStatsChange,
}) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [avgRating, setAvgRating] = useState(initialAverage);
  const [totalReviews, setTotalReviews] = useState(initialTotal);
  const [breakdown, setBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sentinelRef = useRef(null);

  const applyStats = useCallback((payload) => {
    const avg = payload?.avgRating ?? payload?.averageRating;
    const total = payload?.total ?? payload?.totalReviews;
    if (avg != null) setAvgRating(Number(avg));
    if (total != null) {
      setTotalReviews(total);
      onStatsChange?.({
        averageRating: Number(avg ?? initialAverage),
        totalReviews: total,
      });
    }
    if (payload?.breakdown) {
      setBreakdown({
        1: payload.breakdown["1"] ?? payload.breakdown[1] ?? 0,
        2: payload.breakdown["2"] ?? payload.breakdown[2] ?? 0,
        3: payload.breakdown["3"] ?? payload.breakdown[3] ?? 0,
        4: payload.breakdown["4"] ?? payload.breakdown[4] ?? 0,
        5: payload.breakdown["5"] ?? payload.breakdown[5] ?? 0,
      });
    }
  }, [initialAverage, onStatsChange]);

  const loadPage = useCallback(async (pageNum, append = false) => {
    if (!productId) return;
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await fetchDataFromApi(
        `/api/product/reviews/${productId}?page=${pageNum}&limit=8&sort=NEWEST`,
      );
      const list = res?.reviews || [];
      setReviews((prev) => (append ? [...prev, ...list] : list));
      setHasMore(Boolean(res?.hasMore));
      setPage(pageNum);
      applyStats(res);
    } catch {
      if (!append) setReviews([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [productId, applyStats]);

  useEffect(() => {
    setAvgRating(initialAverage);
    setTotalReviews(initialTotal);
    loadPage(1, false);
  }, [productId]);

  // Infinity scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadPage(page + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page]);

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
      const res = await postData("/api/product/reviews/add", {
        productId,
        rating: draftRating,
        review: draftText.trim(),
        userName: userName || "Customer",
      });
      if (res?.error) throw new Error(res.message || "Failed");
      toast.success("Review submitted!");
      setDraftText("");
      setDraftRating(5);
      await loadPage(1, false);
    } catch (err) {
      toast.error(err?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const total = totalReviews || 0;
  const maxBar = Math.max(...Object.values(breakdown), 1);

  return (
    <section className="gmp-pr-section" aria-labelledby="gmp-pr-title">
      <style>{SECTION_STYLES}</style>
      <div className="gmp-pr-head">
        <div>
          <h2 id="gmp-pr-title" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
            Ratings &amp; reviews
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{productTitle}</p>
        </div>
        <div className="gmp-pr-score">
          <span className="gmp-pr-score-num">{Number(avgRating || 0).toFixed(1)}</span>
          <div>
            <StarRating value={avgRating} size={18} />
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              {total} review{total === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <div className="gmp-pr-split" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: 20, marginBottom: 20 }}>
        <div>
          {[5, 4, 3, 2, 1].map((star) => (
            <div className="gmp-pr-bar-row" key={star}>
              <span style={{ width: 28 }}>{star}★</span>
              <div className="gmp-pr-bar">
                <div
                  className="gmp-pr-bar-fill"
                  style={{ width: `${((breakdown[star] || 0) / maxBar) * 100}%` }}
                />
              </div>
              <span style={{ width: 24, textAlign: "right" }}>{breakdown[star] || 0}</span>
            </div>
          ))}
        </div>

        <form className="gmp-pr-form" onSubmit={handleSubmit}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Write a review</p>
          <div className="gmp-pr-star-pick" role="group" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={draftRating >= n ? "on" : ""}
                onClick={() => setDraftRating(n)}
                aria-label={`${n} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Share your experience with this product…"
            maxLength={2000}
          />
          <button
            type="submit"
            className="gmp-btn gmp-btn-primary"
            style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </div>

      {loading && !reviews.length ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>No reviews yet. Be the first to review!</p>
      ) : (
        <div>
          {reviews.map((r) => (
            <article className="gmp-pr-item" key={r._id}>
              <div className="gmp-pr-avatar">{(r.userName || "U").charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <strong style={{ fontSize: 14 }}>{r.userName || "Customer"}</strong>
                  <StarRating value={Number(r.rating)} size={14} />
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.55, marginTop: 6 }}>{r.review}</p>
              </div>
            </article>
          ))}
          {hasMore && (
            <>
              <div ref={sentinelRef} style={{ height: 1 }} />
              {loadingMore && (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: 12, fontSize: 14 }}>
                  Loading more reviews…
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
