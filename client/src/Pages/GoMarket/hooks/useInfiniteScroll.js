import { useCallback, useEffect, useRef } from "react";

/**
 * Calls onLoadMore when sentinel enters viewport (infinite scroll).
 */
export const useInfiniteScroll = ({
  enabled,
  hasMore,
  loading,
  onLoadMore,
  rootMargin = "200px",
}) => {
  const sentinelRef = useRef(null);

  const loadMore = useCallback(() => {
    if (!enabled || !hasMore || loading) return;
    onLoadMore();
  }, [enabled, hasMore, loading, onLoadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin, threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, loadMore, rootMargin]);

  return sentinelRef;
};
