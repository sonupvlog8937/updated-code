/**
 * Reliable in-app back navigation for React Router SPAs.
 * Uses history.state.idx when available; otherwise navigates to a sensible parent route.
 */
export function canGoBackInApp() {
  const idx = window.history.state?.idx;
  if (typeof idx === "number") return idx > 0;
  return window.history.length > 1;
}

export function getBackFallbackPath(pathname) {
  if (pathname.startsWith("/product/")) return "/products";
  if (/^\/go-market\/product\//.test(pathname)) return "/go-market";
  if (pathname.startsWith("/go-market/") && pathname !== "/go-market") {
    return "/go-market";
  }
  if (pathname.startsWith("/blog/") && pathname !== "/blog") return "/blog";
  if (pathname.startsWith("/store/")) return "/";
  if (
    pathname !== "/" &&
    ["/login", "/register", "/verify", "/forgot-password"].includes(pathname)
  ) {
    return "/";
  }
  return "/";
}

export function goBack(navigate, pathname) {
  if (canGoBackInApp()) {
    // Prefer native back — stays in sync with React Router's history stack
    window.history.back();
    return;
  }
  navigate(getBackFallbackPath(pathname));
}
