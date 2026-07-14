import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchDataFromApi } from "../../utils/api";
import { addToCart } from "../../store/appSlice";
import { Breadcrumb, STYLES, StarRating, img } from "./shared";
import ProductReviewsSection from "./ProductReviewsSection";
import GoMarketProductOptions, {
  allOptionsSelected,
  normalizeProductOptions,
  selectedOptionPrice,
} from "./GoMarketProductOptions";

const GoMarketProduct = () => {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLogin = useSelector((s) => s.app.isLogin);
  const userData = useSelector((s) => s.app.userData);
  const userId = userData?._id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [offers, setOffers] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [shopData, setShopData] = useState(null);

  const [related, setRelated] = useState([]);
  const [totalRelatedCount, setTotalRelatedCount] = useState(0);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const loadProduct = useCallback(() => {
    const endpoint =
      kind === "restaurant"
        ? `/api/go-market/catalog/restaurant-item/${id}`
        : `/api/go-market/catalog/grocery-product/${id}`;
    return fetchDataFromApi(endpoint).then((res) => {
      if (res?.success || res?.error === false) {
        setData(res);
        
        // Store shop/restaurant data for isOpen check
        if (kind === "restaurant" && res.restaurant) {
          setShopData(res.restaurant);
        } else if (kind !== "restaurant" && res.shop) {
          setShopData(res.shop);
        }
        
        // Handle multiple field names for related products
        const relatedData = res.related || res.relatedProducts || res.suggestionProducts || [];
        setRelated(relatedData);
        
        // Get total count - handle multiple field names
        let totalCount = relatedData.length;
        if (res.relatedTotal) totalCount = res.relatedTotal;
        else if (res.totalRelated) totalCount = res.totalRelated;
        else if (res.relatedPagination?.total) totalCount = res.relatedPagination.total;
        else if (res.relatedPagination?.totalItems) totalCount = res.relatedPagination.totalItems;
        else if (res.relatedCount) totalCount = res.relatedCount;
        
        console.log('[Product Load] Related:', relatedData.length, 'Total:', totalCount);
        setTotalRelatedCount(totalCount);
        
        setSelectedOptions({});
        const offerParams = new URLSearchParams({
          audience: kind === "restaurant" ? "restaurant" : "grocery",
          ...(kind === "restaurant" ? { restaurantId: res.product?.restaurantId, restaurantItemId: id } : { shopId: res.product?.shopId, productId: id }),
        });
        fetchDataFromApi(`/api/coupon/active?${offerParams}`).then((offerRes) => {
          if (offerRes?.success) setOffers(offerRes.data || []);
        });
      }
    });
  }, [kind, id]);

  useEffect(() => {
    setLoading(true);
    loadProduct().finally(() => setLoading(false));
  }, [loadProduct]);

  const loadMoreRelated = useCallback(async () => {
    const ITEMS_PER_PAGE = 8;
    const itemsLoaded = related.length;
    
    // If already loaded all items, return
    if (itemsLoaded >= totalRelatedCount || loadingRelated) {
      console.log(`[Load More] Already have all: ${itemsLoaded}/${totalRelatedCount}`);
      return;
    }
    
    const nextPage = Math.floor(itemsLoaded / ITEMS_PER_PAGE) + 1;
    console.log(`[Load More] Fetching page ${nextPage}. Have ${itemsLoaded}, Total ${totalRelatedCount}`);
    
    setLoadingRelated(true);
    try {
      // Use page & limit params
      const endpoint = kind === "restaurant"
        ? `/api/go-market/catalog/restaurant-item/${id}?page=${nextPage}&limit=${ITEMS_PER_PAGE}`
        : `/api/go-market/catalog/grocery-product/${id}?page=${nextPage}&limit=${ITEMS_PER_PAGE}`;
      
      console.log(`[Load More] URL: ${endpoint}`);
      const res = await fetchDataFromApi(endpoint);
      console.log(`[Load More] Response:`, res);
      
      if (res?.success || res?.error === false) {
        // Try multiple field names
        const newItems = res.related || res.relatedProducts || res.data || res.products || [];
        console.log(`[Load More] Got ${newItems.length} items`);
        
        if (newItems.length > 0) {
          setRelated((prev) => {
            const updated = [...prev, ...newItems];
            console.log(`[Load More] Total: ${updated.length}`);
            return updated;
          });
          
          // Update total
          let backendTotal = totalRelatedCount;
          if (res.relatedTotal) backendTotal = res.relatedTotal;
          else if (res.totalRelated) backendTotal = res.totalRelated;
          else if (res.total) backendTotal = res.total;
          else if (res.count) backendTotal = res.count;
          
          setTotalRelatedCount(backendTotal);
        } else {
          setTotalRelatedCount(itemsLoaded);
        }
      } else {
        setTotalRelatedCount(itemsLoaded);
      }
    } catch (error) {
      console.error(`[Load More] Error:`, error);
      setTotalRelatedCount(itemsLoaded);
    } finally {
      setLoadingRelated(false);
    }
  }, [kind, id, related.length, totalRelatedCount, loadingRelated]);

  const product = data?.product;
  const specs = data?.specifications || [];
  const productOptions = normalizeProductOptions(product?.productOptions || []);
  const optionsComplete = allOptionsSelected(productOptions, selectedOptions);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const visibleSpecs = showAllSpecs ? specs : specs.slice(0, 5);
  
  // Calculate active price and old price based on selected options
  const getActivePricing = () => {
    let price = Number(product?.price || 0);
    let oldPrice = product?.oldPrice || product?.mrp || product?.price || 0;
    
    if (productOptions.length > 0 && selectedOptions) {
      productOptions.forEach((opt) => {
        const key = opt.name || opt.label;
        const selectedLabel = selectedOptions[key];
        if (selectedLabel) {
          const found = (opt.values || []).find((v) => v.label === selectedLabel || v.value === selectedLabel);
          if (found) {
            if (Number(found.price) > 0) {
              price = Number(found.price);
            }
            if (Number(found.oldPrice) > 0) {
              oldPrice = Number(found.oldPrice);
            }
          }
        }
      });
    }
    
    return { price, oldPrice };
  };
  
  const { price: activePrice, oldPrice: activeOldPrice } = product ? getActivePricing() : { price: 0, oldPrice: 0 };
  const hasDiscount = activeOldPrice > activePrice;
  const discountPercent = hasDiscount ? Math.round(((activeOldPrice - activePrice) / activeOldPrice) * 100) : (product?.discount || 0);
  const saveAmount = hasDiscount ? activeOldPrice - activePrice : 0;

  const cartProduct = product
    ? {
        _id: product._id,
        name: product.name,
        price: activePrice,
        oldPrice: activeOldPrice,
        image: product.image || product.images?.[0],
        images: product.images,
        countInStock: product.countInStock ?? product.stock ?? 0,
        rating: data?.averageRating || product.rating,
        brand: product.brand,
        source: "goMarket",
        discount: discountPercent,
        selectedOptions,
      }
    : null;

  const handleAddToCart = async () => {
    if (!isLogin) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (!optionsComplete) {
      toast.error("Please select all product options");
      return;
    }
    if (!cartProduct?.countInStock) {
      toast.error("This item is out of stock");
      return;
    }
    // Check if shop/restaurant is open
    if (shopData && shopData.isOpen === false) {
      toast.error(kind === "restaurant" ? "Restaurant is currently closed. You cannot add items to cart." : "Shop is currently closed. You cannot add items to cart.");
      return;
    }
    setBusy(true);
    await dispatch(addToCart({ product: cartProduct, userId, quantity }));
    setBusy(false);
  };

  const handleBuyNow = () => {
    if (!isLogin) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }
    if (!optionsComplete) {
      toast.error("Please select all product options");
      return;
    }
    if (!cartProduct?.countInStock) {
      toast.error("This item is out of stock");
      return;
    }
    // Check if shop/restaurant is open
    if (shopData && shopData.isOpen === false) {
      toast.error(kind === "restaurant" ? "Restaurant is currently closed. You cannot buy this item." : "Shop is currently closed. You cannot buy this item.");
      return;
    }
    navigate("/checkout", {
      state: {
        buyNowItem: {
          productId: product._id,
          productTitle: product.name,
          image: product.image || product.images?.[0],
          price: activePrice,
          quantity,
          subTotal: activePrice * quantity,
          selectedOptions,
          sellerId: product.sellerId || null,
          source: "goMarket",
          brand: product.brand || "GoMarket",
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="gmp-root">
        <style>{STYLES}</style>
        <div className="gmp-empty">Loading product…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="gmp-root">
        <style>{STYLES}</style>
        <div className="gmp-empty">Product not found.</div>
      </div>
    );
  }

  const marketId = product.marketId;
  const shopHref =
    kind === "restaurant"
      ? `/go-market/restaurant/${product.restaurantId}`
      : `/go-market/shop/${product.shopId}`;

  const hasMoreProducts = related.length < totalRelatedCount;

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <div className="gmp-container" style={{ paddingTop: 16 }}>
        <Breadcrumb
          items={[
            { to: "/go-market", label: "Go Market" },
            ...(marketId ? [{ to: `/go-market/market/${marketId}`, label: "Market" }] : []),
            { to: shopHref, label: product.brand || "Shop" },
            { label: product.name },
          ]}
        />

        <div className="gmp-pd-grid">
          <div>
            <div className="gmp-pd-gallery">
              {(() => {
                const images = product.images?.length
                  ? product.images
                  : [product.image].filter(Boolean);
                return (
                  <>
                    <div className="gmp-pd-main-img-wrap">
                      {product.discount > 0 && (
                        <span className="gmp-tile-badge gmp-pd-badge">{product.discount}% OFF</span>
                      )}
                      <img
                        src={img(images[activeImg] || images[0])}
                        alt={product.name}
                        className="gmp-pd-main-img"
                      />
                    </div>
                    {images.length > 1 && (
                      <div className="gmp-pd-thumbs">
                        {images.map((im, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`gmp-pd-thumb${activeImg === i ? " active" : ""}`}
                            onClick={() => setActiveImg(i)}
                          >
                            <img src={img(im)} alt={`${product.name} ${i + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="gmp-pd-panel">
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {product.brand}
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "6px 0 10px", lineHeight: 1.3 }}>{product.name}</h1>

            {/* Rating row */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <StarRating value={data.averageRating || product.rating} size={16} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                {Number(data.averageRating || product.rating || 0).toFixed(1)}
              </span>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                · {data.totalReviews || 0} review{(data.totalReviews || 0) === 1 ? "" : "s"}
              </span>
              {product.soldCount > 0 && (
                <span style={{ fontSize: 12, color: "#64748b", marginLeft: "auto" }}>
                  🛍 {product.soldCount} sold
                </span>
              )}
            </div>

            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.65, marginBottom: 12 }}>
              {product.description}
            </p>

            {/* Price block */}
            <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #fff 100%)", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span className="gmp-pd-price">₹{activePrice}</span>
                {hasDiscount && activeOldPrice > activePrice && (
                  <span className="gmp-pd-mrp">₹{activeOldPrice}</span>
                )}
                {discountPercent > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 10px", borderRadius: 20 }}>
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              {saveAmount > 0 && (
                <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 4 }}>
                  You save ₹{saveAmount}
                </div>
              )}
            </div>

            {/* {offers.length > 0 && (
              <div style={{ margin: "12px 0", display: "grid", gap: 8 }}>
                {offers.slice(0, 3).map((offer) => (
                  <div key={offer._id || offer.code} style={{ border: "1px dashed #f97316", background: "#fff7ed", borderRadius: 12, padding: 10 }}>
                    <b style={{ color: "#c2410c", fontSize: 13 }}>{offer.code}</b>
                    <span style={{ marginLeft: 8, fontSize: 12, color: "#7c2d12" }}>{offer.title}</span>
                  </div>
                ))}
              </div>
            )} */}

            <GoMarketProductOptions
              options={productOptions}
              selected={selectedOptions}
              onSelect={(key, val) => setSelectedOptions((s) => ({ ...s, [key]: val }))}
            />

            {!optionsComplete && productOptions.length > 0 && (
              <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 10 }}>
                Select all options above to continue
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Qty</span>
              <button
                type="button"
                className="gmp-page-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span style={{ fontWeight: 700, minWidth: 24, textAlign: "center" }}>{quantity}</span>
              <button type="button" className="gmp-page-btn" onClick={() => setQuantity((q) => q + 1)}>
                +
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="gmp-btn gmp-btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={busy || !optionsComplete || (shopData && shopData.isOpen === false)}
                onClick={handleAddToCart}
              >
                🛒 Add to cart
              </button>
              <button
                type="button"
                className="gmp-btn gmp-btn-outline"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={busy || !optionsComplete || (shopData && shopData.isOpen === false)}
                onClick={handleBuyNow}
              >
                ⚡ Buy now
              </button>
            </div>

            <p
              style={{
                fontSize: 12,
                color: product.countInStock > 0 ? "#16a34a" : "#dc2626",
                marginTop: 14,
                fontWeight: 600,
              }}
            >
              {product.countInStock > 0 ? `✓ ${product.countInStock} available` : "Currently unavailable"}
            </p>

            {shopData && shopData.isOpen === false && (
              <p
                style={{
                  fontSize: 12,
                  color: "#dc2626",
                  marginTop: 8,
                  fontWeight: 600,
                  background: "#fef2f2",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #fecaca",
                }}
              >
                {kind === "restaurant" ? "🔴 Restaurant is currently closed" : "🔴 Shop is currently closed"}
              </p>
            )}
          </div>
        </div>

        {specs.length > 0 && (
          <section
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
              marginTop: 24,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Specifications</h3>
            <table className="gmp-spec-table">
              <tbody>
                {visibleSpecs.map((s, i) => (
                  <tr key={i}>
                    <td>{s.key}</td>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {specs.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllSpecs(!showAllSpecs)}
                style={{
                  marginTop: 16,
                  padding: "10px 16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#e2e8f0";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
              >
                {showAllSpecs ? "Show Less" : `Read More (${specs.length - 5} more)`}
                <span style={{ fontSize: 16 }}>{showAllSpecs ? "▲" : "▼"}</span>
              </button>
            )}
          </section>
        )}

        {related.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>You may also like</h2>
            <div className="gmp-product-grid">
              {related.map((r) => {
                const rRating = Number(r.rating || r.averageRating || 0);
                const rPrice = r.discountPrice > 0 ? r.discountPrice : r.price;
                const rOldPrice = r.oldPrice || r.price;
                const hasDiscount = rOldPrice > rPrice;
                const rDiscount = hasDiscount 
                  ? Math.round(((rOldPrice - rPrice) / rOldPrice) * 100)
                  : r.discount || 0;
                const saveAmount = hasDiscount ? rOldPrice - rPrice : 0;
                
                return (
                  <Link
                    to={`/go-market/product/${r.goMarketKind || kind}/${r._id}`}
                    className="gmp-product-tile"
                    key={r._id}
                  >
                    <div className="gmp-tile-img-wrap">
                      <img src={img(r.image)} alt={r.name} />
                      {rDiscount > 0 && <span className="gmp-tile-badge">{rDiscount}% OFF</span>}
                    </div>
                    <div className="gmp-product-body">
                      {r.brand && <div className="gmp-tile-brand">{r.brand}</div>}
                      <div className="gmp-product-name">{r.name}</div>
                      {r.description && <div className="gmp-tile-desc">{r.description}</div>}
                      {rRating > 0 && (
                        <div className="gmp-tile-rating">
                          <span className="gmp-tile-stars">{"★".repeat(Math.round(rRating))}{"☆".repeat(5 - Math.round(rRating))}</span>
                          <span className="gmp-tile-rating-val">{rRating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="gmp-tile-price-row">
                        <span className="gmp-tile-price">₹{rPrice}</span>
                        {hasDiscount && rOldPrice > rPrice && (
                          <del className="gmp-tile-mrp">₹{rOldPrice}</del>
                        )}
                      </div>
                      {saveAmount > 0 && (
                        <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 4 }}>
                          You save ₹{saveAmount}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            {hasMoreProducts && (
              <button
                type="button"
                onClick={loadMoreRelated}
                disabled={loadingRelated}
                style={{
                  marginTop: 20,
                  padding: "12px 24px",
                  background: loadingRelated ? "#f1f5f9" : "#fff",
                  border: "2px solid #e2e8f0",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: loadingRelated ? "not-allowed" : "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s",
                  opacity: loadingRelated ? 0.6 : 1,
                }}
                onMouseOver={(e) => {
                  if (!loadingRelated) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }
                }}
                onMouseOut={(e) => {
                  if (!loadingRelated) {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }
                }}
              >
                {loadingRelated ? (
                  <>
                    <span style={{ fontSize: 16 }}>⏳</span>
                    Loading more products...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 16 }}>↓</span>
                    Load More Products ({related.length}/{totalRelatedCount})
                  </>
                )}
              </button>
            )}
            {!hasMoreProducts && related.length > 0 && totalRelatedCount > 0 && (
              <div style={{
                marginTop: 20,
                padding: "12px 24px",
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "#16a34a",
                textAlign: "center",
                width: "100%",
              }}>
                ✓ All {totalRelatedCount} products loaded
              </div>
            )}
          </section>
        )}

        <ProductReviewsSection
          productId={id}
          productTitle={product.title || product.name}
          isLogin={isLogin}
          userName={userData?.name}
          initialAverage={data?.averageRating || product.rating}
          initialTotal={data?.totalReviews || 0}
          onStatsChange={(stats) =>
            setData((d) =>
              d ? { ...d, averageRating: stats.averageRating, totalReviews: stats.totalReviews } : d,
            )
          }
        />
      </div>
    </div>
  );
};

export default GoMarketProduct;
