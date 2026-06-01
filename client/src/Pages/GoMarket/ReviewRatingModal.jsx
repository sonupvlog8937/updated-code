import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchDataFromApi, postData } from "../../utils/api";
import { StarRating } from "./shared";

const MODAL_STYLES = `
.gmp-modal-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 0;
  animation: gmpModalIn .2s ease;
}
@media (min-width: 640px) {
  .gmp-modal-backdrop { align-items: center; padding: 24px; }
}
@keyframes gmpModalIn { from { opacity: 0; } to { opacity: 1; } }
.gmp-modal-panel {
  background: #fff;
  width: 100%;
  max-width: 520px;
  max-height: 92vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 40px rgba(15,23,42,.18);
  animation: gmpPanelUp .28s cubic-bezier(.22,1,.36,1);
}
@media (min-width: 640px) {
  .gmp-modal-panel { border-radius: 20px; max-height: 88vh; }
}
@keyframes gmpPanelUp { from { transform: translateY(24px); opacity: .9; } to { transform: translateY(0); opacity: 1; } }
.gmp-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.gmp-modal-close {
  width: 36px; height: 36px; border-radius: 10px;
  border: 1px solid #e2e8f0; background: #f8fafc;
  font-size: 20px; cursor: pointer; color: #334155;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.gmp-modal-close:hover { background: #fee2e2; color: #dc2626; }
.gmp-modal-body { overflow-y: auto; padding: 16px 18px 24px; flex: 1; }
.gmp-reviews-score { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.gmp-reviews-score-num { font-size: 40px; font-weight: 800; color: #0f172a; line-height: 1; }
.gmp-review-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
.gmp-review-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg,#2563eb,#7c3aed);
  color: #fff; font-weight: 700; font-size: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.gmp-review-form { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin-bottom: 16px; }
.gmp-review-form textarea {
  width: 100%; min-height: 80px; border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: 12px; font-size: 14px; resize: vertical; font-family: inherit;
}
.gmp-star-pick { display: flex; gap: 4px; margin: 8px 0; }
.gmp-star-pick button { background: none; border: none; font-size: 26px; cursor: pointer; opacity: .35; padding: 0; }
.gmp-star-pick button.on { opacity: 1; transform: scale(1.08); }
.gmp-infinite-loader { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; color: #64748b; font-size: 13px; font-weight: 600; }
.gmp-infinite-dots span { width: 6px; height: 6px; border-radius: 50%; background: #2563eb; display: inline-block; animation: gmpDot 1.2s infinite ease-in-out; margin: 0 2px; }
.gmp-infinite-dots span:nth-child(2) { animation-delay: .15s; }
.gmp-infinite-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes gmpDot { 0%,80%,100% { transform: scale(.6); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }
`;

const buildFetchUrl = (mode, { outletId, outletType, productId }, page) => {
  if (mode === "product") {
    return `/api/product/reviews/${productId}?page=${page}&limit=8&sort=NEWEST`;
  }
  const base =
    outletType === "restaurant"
      ? `/api/go-market/restaurants/${outletId}/reviews`
      : `/api/go-market/grocery-shops/${outletId}/reviews`;
  return `${base}?page=${page}&limit=8&sort=NEWEST`;
};

export function ReviewRatingModal({
  open,
  onClose,
  mode = "outlet",
  outletId,
  outletType = "grocery",
  productId,
  title = "Reviews",
  isLogin,
  userName = "",
  initialAverage = 0,
  initialTotal = 0,
  onStatsChange,
}) {
  const navigate = useNavigate();
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [avgRating, setAvgRating] = useState(initialAverage);
  const [totalReviews, setTotalReviews] = useState(initialTotal);
  const [breakdown, setBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const entityKey = mode === "product" ? productId : `${outletType}-${outletId}`;

  const loadPage = useCallback(
    async (pageNum, append = false) => {
      if (!open) return;
      const id = mode === "product" ? productId : outletId;
      if (!id) return;

      if (append) {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetchDataFromApi(
          buildFetchUrl(mode, { outletId, outletType, productId }, pageNum),
        );
        const payload = res?.data || res;
        const list = payload?.reviews || [];
        setReviews((prev) => (append ? [...prev, ...list] : list));
        const more = Boolean(payload?.hasMore);
        hasMoreRef.current = more;
        setHasMore(more);
        pageRef.current = pageNum;

        const avg = payload?.averageRating ?? payload?.avgRating;
        const total = payload?.totalReviews ?? payload?.total;
        if (avg != null) setAvgRating(Number(avg));
        if (total != null) {
          setTotalReviews(total);
          onStatsChange?.({ averageRating: Number(avg ?? avgRating), totalReviews: total });
        }
        if (payload?.breakdown) setBreakdown(payload.breakdown);
      } catch {
        if (!append) setReviews([]);
        hasMoreRef.current = false;
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [open, mode, outletId, outletType, productId, onStatsChange, avgRating],
  );

  useEffect(() => {
    if (!open) return;
    setReviews([]);
    setDraftText("");
    setDraftRating(5);
    hasMoreRef.current = true;
    pageRef.current = 1;
    setHasMore(true);
    setAvgRating(initialAverage);
    setTotalReviews(initialTotal);
    loadPage(1, false);
  }, [open, entityKey]);

  useEffect(() => {
    if (!open) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMoreRef.current && !loadingMoreRef.current && !loading) {
          loadPage(pageRef.current + 1, true);
        }
      },
      { root: el.parentElement?.parentElement, rootMargin: "80px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, loading, loadingMore, loadPage, reviews.length]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

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
      let res;
      if (mode === "product") {
        res = await postData("/api/product/reviews/add", {
          productId,
          rating: draftRating,
          review: draftText.trim(),
          userName: userName || "Customer",
        });
      } else {
        const url =
          outletType === "restaurant"
            ? `/api/go-market/restaurants/${outletId}/reviews`
            : `/api/go-market/grocery-shops/${outletId}/reviews`;
        res = await postData(url, { rating: draftRating, review: draftText.trim() });
      }
      if (res?.error) throw new Error(res.message || "Failed");
      toast.success("Review submitted!");
      setDraftText("");
      setDraftRating(5);
      hasMoreRef.current = true;
      await loadPage(1, false);
    } catch (err) {
      toast.error(err?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const total = totalReviews || 0;

  const content = (
    <div className="gmp-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <style>{MODAL_STYLES}</style>
      <div className="gmp-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="gmp-modal-header">
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Reviews &amp; ratings</h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{title}</p>
          </div>
          <button type="button" className="gmp-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="gmp-modal-body">
          <div className="gmp-reviews-score">
            <span className="gmp-reviews-score-num">{Number(avgRating || 0).toFixed(1)}</span>
            <div>
              <StarRating value={avgRating} size={18} />
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 600 }}>
                {total} review{total !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="gmp-rating-bars" style={{ marginBottom: 16 }}>
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
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Your rating</div>
            <div className="gmp-star-pick">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={draftRating >= s ? "on" : ""}
                  onClick={() => setDraftRating(s)}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share your experience…"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              maxLength={2000}
            />
            <button type="submit" className="gmp-btn gmp-btn-primary" style={{ marginTop: 10, width: "100%", justifyContent: "center" }} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>

          {loading && reviews.length === 0 ? (
            <div className="gmp-infinite-loader">
              <span className="gmp-infinite-dots"><span /><span /><span /></span>
              Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: "16px 0" }}>No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => (
              <article className="gmp-review-item" key={r._id}>
                <div className="gmp-review-avatar">{(r.userName || "U").charAt(0).toUpperCase()}</div>
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

          {loadingMore && (
            <div className="gmp-infinite-loader">
              <span className="gmp-infinite-dots"><span /><span /><span /></span>
              Loading more…
            </div>
          )}
          {!hasMore && reviews.length > 0 && (
            <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", paddingTop: 8 }}>All reviews loaded</p>
          )}
          <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export function ReviewsRatingButton({ averageRating = 0, totalReviews = 0, onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`gmp-btn gmp-btn-outline ${className}`.trim()}
      onClick={onClick}
      style={{ gap: 8 }}
    >
      <span>💬</span>
      <span>
        <strong style={{ marginRight: 6 }}>{Number(averageRating || 0).toFixed(1)}★</strong>
        Reviews ({totalReviews || 0})
      </span>
    </button>
  );
}
