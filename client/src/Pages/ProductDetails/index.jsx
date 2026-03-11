import React, { useEffect, useRef, useState } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductZoom } from "../../components/ProductZoom";
import { ProductDetailsComponent } from "../../components/ProductDetails";
import ProductItem from "../../components/ProductItem";
import { fetchDataFromApi } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { Reviews } from "./reviews";
import "./style.css";

export const ProductDetails = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [productData, setProductData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [relatedProductData, setRelatedProductData] = useState([]);
  const [activeImages, setActiveImages] = useState([]);
  const [visibleSpecifications, setVisibleSpecifications] = useState(5);
  const [relatedProductsPage, setRelatedProductsPage] = useState(1);
  const [hasMoreRelatedProducts, setHasMoreRelatedProducts] = useState(false);
  const [isRelatedProductsLoading, setIsRelatedProductsLoading] = useState(false);
  const [sellerProductsCount, setSellerProductsCount] = useState(0);
  const [sellerProductsPreview, setSellerProductsPreview] = useState([]);

  const { id } = useParams();
  const navigate = useNavigate();
  const reviewSec = useRef();

  useEffect(() => {
    fetchDataFromApi(`/api/user/getReviews?productId=${id}`).then((res) => {
      if (res?.error === false) setReviewsCount(res.reviews.length);
    });
  }, [id]);

  const loadRelatedProducts = async (subCatId, pageToLoad, shouldAppend = false) => {
    if (!subCatId) return;
    setIsRelatedProductsLoading(true);
    const res = await fetchDataFromApi(
      `/api/product/getAllProductsBySubCatId/${subCatId}?page=${pageToLoad}&perPage=10`
    );
    if (res?.error === false) {
      const filteredData = (res?.products || []).filter((item) => item?._id !== id);
      setRelatedProductData((prev) => {
        if (!shouldAppend) return filteredData;
        const existingIds = new Set(prev.map((item) => item?._id));
        return [...prev, ...filteredData.filter((item) => !existingIds.has(item?._id))];
      });
      setHasMoreRelatedProducts((res?.products || []).length === 10);
      setRelatedProductsPage(pageToLoad);
    }
    setIsRelatedProductsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    setRelatedProductData([]);
    setRelatedProductsPage(1);
    setHasMoreRelatedProducts(false);
    // Reset seller state on product change
    setSellerProductsCount(0);
    setSellerProductsPreview([]);

    fetchDataFromApi(`/api/product/${id}`).then(async (res) => {
      if (res?.error === false) {
        const product = res?.product;
        setProductData(product);
        setActiveImages(product?.images || []);
        setVisibleSpecifications(5);

        // FIX: Use seller._id properly and accept both response shapes
        const sellerId = product?.seller?._id || product?.seller;
        if (sellerId) {
          fetchDataFromApi(`/api/product/store/${sellerId}?limit=5&page=1`).then((storeRes) => {
            if (storeRes?.error === false || storeRes?.success === true) {
              setSellerProductsCount(storeRes?.total || 0);
              setSellerProductsPreview(
                (storeRes?.products || [])
                  .filter((item) => String(item?._id) !== String(id))
                  .slice(0, 4)
              );
            }
          });
        }

        await loadRelatedProducts(product?.subCatId, 1, false);
        setTimeout(() => setIsLoading(false), 700);
      } else {
        setIsLoading(false);
      }
    });

    window.scrollTo(0, 0);
  }, [id]);

  const gotoReviews = () => {
    window.scrollTo({ top: reviewSec?.current?.offsetTop - 170, behavior: "smooth" });
    setActiveTab(1);
  };

  // Seller ID for navigation — handles both populated and non-populated
  const sellerId = productData?.seller?._id || productData?.seller;

  const breadcrumbItems = [
    productData?.catName && productData?.catId
      ? { label: productData.catName, to: `/products?catId=${productData.catId}` }
      : null,
    productData?.subCat && productData?.subCatId
      ? { label: productData.subCat, to: `/products?subCatId=${productData.subCatId}` }
      : null,
    productData?.thirdsubCat && productData?.thirdsubCatId
      ? { label: productData.thirdsubCat, to: `/products?thirdLavelCatId=${productData.thirdsubCatId}` }
      : null,
  ].filter(Boolean);

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
          {isLoading ? (
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
                  </div>
                  <div className="pd-content-col">
                    <ProductDetailsComponent
                      item={productData}
                      reviewsCount={reviewsCount}
                      gotoReviews={gotoReviews}
                      onColorChange={(images) =>
                        setActiveImages(images?.length !== 0 ? images : productData?.images || [])
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ── Seller Store Card ── */}
              <div className="container" style={{ marginTop: "14px" }}>
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>Sold by</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                      {productData?.seller?.storeProfile?.storeName ||
                        productData?.seller?.name ||
                        "Marketplace Seller"}
                    </p>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {sellerProductsCount > 0
                        ? `${sellerProductsCount} products in this store`
                        : "Visit seller's store"}
                    </p>
                  </div>

                  {/* FIX: Use navigate() so click actually goes to store page */}
                  {sellerId && (
                    <button
                      onClick={() => navigate(`/store/${sellerId}`)}
                      className="pd-load-more-btn"
                      style={{ cursor: "pointer", border: "none", display: "inline-flex", width: "auto", padding: "10px 16px" }}
                    >
                      Visit Seller Store →
                    </button>
                  )}
                </div>
              </div>

              {/* ── More From This Seller ── */}
              {sellerProductsPreview?.length > 0 && (
                <div className="container" style={{ marginTop: "14px" }}>
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                        More from this seller
                      </h3>
                      {sellerId && (
                        <span
                          onClick={() => navigate(`/store/${sellerId}`)}
                          className="pd-breadcrumb-link"
                          style={{ cursor: "pointer" }}
                        >
                          See all →
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {sellerProductsPreview.map((item) => (
                        <ProductItem key={item?._id} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Product Specifications ── */}
              <div className="container pd-section">
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      padding: "24px",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <h2 className="pd-section-title">Product Specifications</h2>

                    {productData?.specifications?.length > 0 && (
                      <>
                        <div className="pd-specs-grid">
                          {productData.specifications
                            .slice(0, visibleSpecifications)
                            .map((spec, i) => (
                              <div key={`${spec?.key}-${i}`} className="pd-spec-item">
                                <p className="pd-spec-key">{spec?.key}</p>
                                <p className="pd-spec-val">{spec?.value}</p>
                              </div>
                            ))}
                        </div>

                        {productData.specifications.length > visibleSpecifications && (
                          <button
                            className="pd-see-btn"
                            onClick={() => setVisibleSpecifications((p) => p + 5)}
                          >
                            ↓ See More
                          </button>
                        )}
                        {visibleSpecifications > 5 &&
                          productData.specifications.length <= visibleSpecifications && (
                            <button
                              className="pd-see-btn"
                              onClick={() => setVisibleSpecifications(5)}
                            >
                              ↑ See Less
                            </button>
                          )}
                      </>
                    )}
                  </div>

                  <div className="pd-why-card">
                    <p className="pd-why-title">Why buy from us?</p>
                    <ul className="pd-why-list">
                      <li>Fresh stock with dynamic pricing from live product database.</li>
                      <li>Fast delivery and secure checkout support.</li>
                      <li>Detailed specifications and verified customer reviews.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── Reviews ── */}
              <div className="container pd-section" ref={reviewSec}>
                <h2 className="pd-section-title">Customer Reviews</h2>
                <div className="pd-reviews-wrapper">
                  {productData && (
                    <Reviews
                      productId={productData?._id}
                      setReviewsCount={setReviewsCount}
                    />
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
                        <button
                          className="pd-load-more-btn"
                          onClick={() =>
                            loadRelatedProducts(productData?.subCatId, relatedProductsPage + 1, true)
                          }
                          disabled={isRelatedProductsLoading}
                        >
                          {isRelatedProductsLoading ? (
                            <>
                              <CircularProgress size={14} style={{ color: "#fff" }} />
                              &nbsp;Loading…
                            </>
                          ) : (
                            "Load More"
                          )}
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