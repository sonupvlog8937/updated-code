import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ProductZoom } from "../../components/ProductZoom";
import { ProductDetailsComponent } from "../../components/ProductDetails";
import ProductItem from "../../components/ProductItem";
import { fetchDataFromApi } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { Reviews } from "./reviews";
import "./style.css";

// ✅ Redux — global loading band karne ke liye
import { useDispatch } from "react-redux";
import { setGlobalLoading } from "../../store/appSlice";

// ─── Module-level cache ───────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cacheGet(id) {
  const e = _cache.get(id);
  if (!e || Date.now() - e.ts > CACHE_TTL) { _cache.delete(id); return null; }
  return e;
}
function cacheSet(id, data) {
  _cache.set(id, { ...data, ts: Date.now() });
}
// ─────────────────────────────────────────────────────────────────────────────

export const ProductDetails = () => {
  const [activeTab, setActiveTab]                         = useState(0);
  const [productData, setProductData]                     = useState(null);
  const [isLoading, setIsLoading]                         = useState(false);
  const [reviewsCount, setReviewsCount]                   = useState(0);
  const [relatedProductData, setRelatedProductData]       = useState([]);
  const [activeImages, setActiveImages]                   = useState([]);
  const [visibleSpecifications, setVisibleSpecifications] = useState(5);
  const [relatedProductsPage, setRelatedProductsPage]     = useState(1);
  const [hasMoreRelatedProducts, setHasMoreRelatedProducts] = useState(false);
  const [isRelatedProductsLoading, setIsRelatedProductsLoading] = useState(false);
  const [sellerProductsCount, setSellerProductsCount]     = useState(0);
  const [sellerProductsPreview, setSellerProductsPreview] = useState([]);

  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch(); // ✅ global loading ke liye
  const reviewSec = useRef();
  const specSec   = useRef();

  // ── Seed product from previous listing page for instant first paint ──────
  useEffect(() => {
    const seededProduct = location?.state?.product;
    if (!seededProduct || String(seededProduct?._id) !== String(id)) return;

    setProductData((prev) => prev || seededProduct);
    setActiveImages((prev) => (prev?.length ? prev : seededProduct?.images || []));
  }, [id, location?.state]);

  // Reviews count
  useEffect(() => {
    if (!id) return;
    fetchDataFromApi(`/api/user/getReviews?productId=${id}`).then((res) => {
      if (res?.error === false) setReviewsCount(res.reviews?.length || 0);
    });
  }, [id]);

  // Load more related products (pagination)
  const loadRelatedProducts = useCallback(async (subCatId, pageToLoad, shouldAppend = false) => {
    if (!subCatId) return;
    setIsRelatedProductsLoading(true);
    try {
      const res = await fetchDataFromApi(
        `/api/product/getAllProductsBySubCatId/${subCatId}?page=${pageToLoad}&perPage=10`
      );
      if (res?.error === false) {
        const filtered = (res?.products || []).filter((item) => item?._id !== id);
        setRelatedProductData((prev) => {
          if (!shouldAppend) return filtered;
          const seen = new Set(prev.map((p) => p?._id));
          return [...prev, ...filtered.filter((p) => !seen.has(p?._id))];
        });
        setHasMoreRelatedProducts((res?.products || []).length === 10);
        setRelatedProductsPage(pageToLoad);
      }
    } finally {
      setIsRelatedProductsLoading(false);
    }
  }, [id]);

  // ✅ Safety net — component unmount pe global loading zaroor band ho
  useEffect(() => {
    return () => {
      dispatch(setGlobalLoading(false));
    };
  }, [dispatch]);

  // ✅ productData aa jaaye toh bhi global loading band karo
  useEffect(() => {
    if (productData) {
      dispatch(setGlobalLoading(false));
    }
  }, [productData, dispatch]);

  // ─── Main data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    window.scrollTo(0, 0);

    // Cache hit — instant render, global loading turant band
    const cached = cacheGet(id);
    if (cached) {
      setProductData(cached.product);
      setActiveImages(cached.product?.images || []);
      setRelatedProductData(cached.relatedProducts || []);
      setHasMoreRelatedProducts((cached.relatedProducts || []).length >= 10);
      setSellerProductsCount(cached.sellerData?.total || 0);
      setSellerProductsPreview(cached.sellerData?.preview || []);
      setVisibleSpecifications(5);
      setRelatedProductsPage(1);

      // ✅ Cache se data mila — global loading band karo
      dispatch(setGlobalLoading(false));
      return;
    }

    // Cache miss — fresh fetch
    setIsLoading(true);
    setRelatedProductData([]);
    setRelatedProductsPage(1);
    setHasMoreRelatedProducts(false);
    setSellerProductsCount(0);
    setSellerProductsPreview([]);

    fetchDataFromApi(`/api/product/${id}`).then(async (res) => {
      if (res?.error !== false) {
        setIsLoading(false);
        // ✅ Error pe bhi global loading band karo — spinner hang na kare
        dispatch(setGlobalLoading(false));
        return;
      }

      const product  = res?.product;
      const sellerId = product?.seller?._id || product?.seller;

      setProductData(product);
      setActiveImages(product?.images || []);
      setVisibleSpecifications(5);

      // ✅ Product data aa gaya — global loading band karo
      // Related + seller data background mein load honge
      dispatch(setGlobalLoading(false));

      // Related + seller — parallel mein
      const [relatedRes, sellerRes] = await Promise.all([
        product?.subCatId
          ? fetchDataFromApi(`/api/product/getAllProductsBySubCatId/${product.subCatId}?page=1&perPage=10`)
          : Promise.resolve(null),
        sellerId
          ? fetchDataFromApi(`/api/product/store/${sellerId}?limit=6&page=1&thirdLavelCatId=${product?.thirdsubCatId || ""}`)
          : Promise.resolve(null),
      ]);

      const relatedProducts = relatedRes?.error === false
        ? (relatedRes.products || []).filter((item) => item?._id !== id)
        : [];

      const sellerData = (sellerRes?.error === false || sellerRes?.success === true)
        ? {
            total:   sellerRes?.total || 0,
            preview: (sellerRes?.products || []).filter((item) => String(item?._id) !== String(id)).slice(0, 5),
          }
        : { total: 0, preview: [] };

      setRelatedProductData(relatedProducts);
      setHasMoreRelatedProducts(relatedProducts.length >= 10);
      setSellerProductsCount(sellerData.total);
      setSellerProductsPreview(sellerData.preview);

      cacheSet(id, { product, relatedProducts, sellerData });
      setIsLoading(false);
      dispatch(setGlobalLoading(false));
    });

    // ✅ Agar effect dobara chale (id badla) toh purana loading state clear karo
    return () => {
      dispatch(setGlobalLoading(false));
    };
  }, [id, dispatch]);

  const gotoReviews = useCallback(() => {
    window.scrollTo({ top: reviewSec?.current?.offsetTop - 170, behavior: "smooth" });
    setActiveTab(1);
  }, []);

  const gotoSpecs = useCallback(() => {
    if (specSec?.current) {
      const top = specSec.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const sellerId = useMemo(
    () => productData?.seller?._id || productData?.seller,
    [productData?.seller]
  );

  const breadcrumbItems = useMemo(() => [
    productData?.catName && productData?.catId
      ? { label: productData.catName, to: `/products?catId=${productData.catId}` } : null,
    productData?.subCat && productData?.subCatId
      ? { label: productData.subCat, to: `/products?subCatId=${productData.subCatId}` } : null,
    productData?.thirdsubCat && productData?.thirdsubCatId
      ? { label: productData.thirdsubCat, to: `/products?thirdLavelCatId=${productData.thirdsubCatId}` } : null,
  ].filter(Boolean), [productData]);

  return (
    <>
      <div className="pd-root">

        {/* ── Breadcrumb ── */}
        <div className="pd-breadcrumb-bar">
          <div className="container" style={{ marginTop: "38px" }}>
            <Breadcrumbs
              aria-label="breadcrumb"
              separator={<span style={{ color: "#d1d5db", fontSize: 12 }}>/</span>}
            >
              <Link to="/" className="pd-breadcrumb-link">Home</Link>
              {breadcrumbItems.map((b) => (
                <Link key={b.to} to={b.to} className="pd-breadcrumb-link">{b.label}</Link>
              ))}
              <span className="pd-breadcrumb-current">{productData?.name}</span>
            </Breadcrumbs>
          </div>
        </div>

        {/* ── Main ── */}
        <section style={{ background: "var(--surface)", paddingTop: "0" }}>
          {isLoading && !productData ? (
            // ✅ Local spinner sirf tab dikhao jab global loader already band ho
            // (cache hit case mein isLoading kabhi true nahi hota)
            <div className="pd-loader">
              <CircularProgress style={{ color: "var(--primary)" }} />
            </div>
          ) : (
            <>
              {/* ── Hero: Image + Details ── */}
              <div className="container">
                <div className="pd-hero">
                  <div className="pd-image-wrapper">
                    <ProductZoom
                      images={activeImages?.length !== 0 ? activeImages : productData?.images}
                    />

                    <style>{`
                      @keyframes qaFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                      .pd-qa-row { display:flex; gap:10px; animation: qaFadeUp .4s .1s both; }
                      .pd-qa-btn {
                        flex:1; display:flex; align-items:center; justify-content:center; gap:7px;
                        padding:10px 14px; border-radius:10px; font-size:13px; font-weight:600;
                        cursor:pointer; border:1.5px solid; transition:all .18s; font-family:inherit;
                      }
                      .pd-qa-btn-spec { background:#fff; border-color:#2563eb; color:#2563eb; }
                      .pd-qa-btn-spec:hover { background:#2563eb; color:#fff; transform:translateY(-1px); box-shadow:0 4px 14px rgba(37,99,235,.25); }
                      .pd-qa-btn-rev { background:#fff; border-color:#e2e8f0; color:#475569; }
                      .pd-qa-btn-rev:hover { background:#f8fafc; border-color:#94a3b8; transform:translateY(-1px); }
                      .pd-qa-badge { background:#eff6ff; color:#2563eb; border-radius:99px; font-size:10px; font-weight:700; padding:1px 6px; min-width:18px; text-align:center; transition:background .18s,color .18s; }
                      .pd-qa-btn-spec:hover .pd-qa-badge { background:rgba(255,255,255,.25); color:#fff; }
                      .pd-qa-rev-badge { background:#f1f5f9; color:#64748b; border-radius:99px; font-size:10px; font-weight:700; padding:1px 6px; }
                    `}</style>

                    <div className="pd-qa-row">
                      <button className="pd-qa-btn pd-qa-btn-spec" onClick={gotoSpecs}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                        </svg>
                        Details
                        {productData?.specifications?.length > 0 && (
                          <span className="pd-qa-badge">{productData.specifications.length}</span>
                        )}
                      </button>
                      <button className="pd-qa-btn pd-qa-btn-rev" onClick={gotoReviews}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Reviews
                        {reviewsCount > 0 && (
                          <span className="pd-qa-rev-badge">{reviewsCount}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pd-content-col">
                    <ProductDetailsComponent
                      item={productData}
                      reviewsCount={reviewsCount}
                      gotoReviews={gotoReviews}
                      gotoSpecs={gotoSpecs}
                      onColorChange={(images) =>
                        setActiveImages(images?.length !== 0 ? images : productData?.images || [])
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ── Seller Store Card ── */}
              <div className="container" style={{ marginTop: "14px" }}>
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>Sold by</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                      {productData?.seller?.storeProfile?.storeName || productData?.seller?.name || "Marketplace Seller"}
                    </p>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {sellerProductsCount > 0 ? `${sellerProductsCount} products in this store` : "Visit seller's store"}
                    </p>
                  </div>
                  {sellerId && (
                    <button onClick={() => navigate(`/store/${sellerId}`)} className="pd-load-more-btn"
                      style={{ cursor: "pointer", border: "none", display: "inline-flex", width: "auto", padding: "10px 16px" }}>
                      Visit Seller Store →
                    </button>
                  )}
                </div>
              </div>

              {/* ── More From This Seller ── */}
              {sellerProductsPreview?.length > 0 && (
                <div className="container" style={{ marginTop: "14px" }}>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>More from this seller</h3>
                      {sellerId && (
                        <span onClick={() => navigate(`/store/${sellerId}`)} className="pd-breadcrumb-link" style={{ cursor: "pointer" }}>
                          See all →
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {sellerProductsPreview.map((item) => (
                        <ProductItem key={item?._id} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Product Specifications ── */}
              <div className="container pd-section" ref={specSec}>
                <style>{`
                  @keyframes specFadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                  .pd-spec-block { animation: specFadeIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
                  .pd-spec-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; padding-bottom:14px; border-bottom:2px solid #f1f5f9; }
                  .pd-spec-title-row { display:flex; align-items:center; gap:10px; }
                  .pd-spec-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#2563eb,#1d4ed8); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
                  .pd-spec-count-badge { background:#eff6ff; color:#2563eb; border-radius:99px; font-size:11px; font-weight:700; padding:2px 9px; }
                  .pd-spec-table-wrap { border-radius:10px; overflow:hidden; border:1px solid #e2e8f0; }
                  .pd-spec-tbl { width:100%; border-collapse:collapse; }
                  .pd-spec-tbl tr { transition:background .15s; }
                  .pd-spec-tbl tr:hover td { background:#f0f7ff !important; }
                  .pd-spec-tbl tr:nth-child(odd) td { background:#f8fafc; }
                  .pd-spec-tbl tr:nth-child(even) td { background:#ffffff; }
                  .pd-spec-tbl td { padding:11px 16px; font-size:13px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
                  .pd-spec-tbl tr:last-child td { border-bottom:none; }
                  .pd-spec-tbl td:first-child { color:#64748b; font-weight:600; width:36%; border-right:1px solid #f1f5f9; }
                  .pd-spec-tbl td:last-child { color:#0f172a; font-weight:500; }
                  .pd-spec-show-btn { display:flex; align-items:center; justify-content:center; gap:6px; margin:14px auto 0; padding:8px 22px; border:1.5px solid #e2e8f0; border-radius:8px; background:#fff; color:#475569; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; font-family:inherit; }
                  .pd-spec-show-btn:hover { border-color:#2563eb; color:#2563eb; background:#eff6ff; }
                  .pd-trust-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }
                  .pd-trust-pill { display:flex; align-items:center; gap:6px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:99px; padding:5px 12px; font-size:11px; color:#166534; font-weight:600; }
                `}</style>

                <div className="pd-spec-block" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                  <div className="pd-spec-header">
                    <div className="pd-spec-title-row">
                      <div className="pd-spec-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                        </svg>
                      </div>
                      <div>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Product Specifications</h2>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>Complete technical details</p>
                      </div>
                    </div>
                    {productData?.specifications?.length > 0 && (
                      <span className="pd-spec-count-badge">{productData.specifications.length} specs</span>
                    )}
                  </div>

                  {productData?.specifications?.length > 0 ? (
                    <>
                      <div className="pd-spec-table-wrap">
                        <table className="pd-spec-tbl">
                          <tbody>
                            {productData.specifications.slice(0, visibleSpecifications).map((spec, i) => (
                              <tr key={`${spec?.key}-${i}`}>
                                <td>{spec?.key}</td>
                                <td>{spec?.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {productData.specifications.length > visibleSpecifications && (
                        <button className="pd-spec-show-btn" onClick={() => setVisibleSpecifications((p) => p + 5)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                          Show {Math.min(5, productData.specifications.length - visibleSpecifications)} more specifications
                        </button>
                      )}
                      {visibleSpecifications > 5 && productData.specifications.length <= visibleSpecifications && (
                        <button className="pd-spec-show-btn" onClick={() => setVisibleSpecifications(5)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                          Show less
                        </button>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "28px 0" }}>
                      No specifications available for this product.
                    </p>
                  )}

                  <div className="pd-trust-row">
                    {["✓ Verified product", "✓ Fast delivery", "✓ Easy returns", "✓ 24/7 support"].map((t) => (
                      <span key={t} className="pd-trust-pill">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Reviews ── */}
              <div className="container pd-section" ref={reviewSec}>
                <h2 className="pd-section-title">Customer Reviews</h2>
                <div className="pd-reviews-wrapper">
                  {productData && (
                    <Reviews productId={productData?._id} setReviewsCount={setReviewsCount} />
                  )}
                </div>
              </div>

              {/* ── Related Products ── */}
              <div className="container pd-section-last">
                <div className="pd-related-header">
                  <h2 className="pd-related-title">Related Products</h2>
                  <div className="pd-related-line" />
                </div>
                {relatedProductData?.length !== 0 ? (
                  <>
                    <div className="pd-related-grid">
                      {relatedProductData.map((item) => (
                        <ProductItem key={item?._id} item={item} />
                      ))}
                    </div>
                    {hasMoreRelatedProducts && (
                      <div style={{ display: "flex", justifyContent: "center", marginTop: "28px" }}>
                        <button className="pd-load-more-btn"
                          onClick={() => loadRelatedProducts(productData?.subCatId, relatedProductsPage + 1, true)}
                          disabled={isRelatedProductsLoading}>
                          {isRelatedProductsLoading
                            ? <><CircularProgress size={14} style={{ color: "#fff" }} />&nbsp;Loading…</>
                            : "Load More"
                          }
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  !isRelatedProductsLoading && (
                    <div className="pd-no-related">No related products found.</div>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
};