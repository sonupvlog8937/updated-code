import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Rating from "@mui/material/Rating";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
import { MdZoomOutMap } from "react-icons/md";
import { useAppContext } from "../../hooks/useAppContext";
import { postData } from "../../utils/api";
import { IoMdHeart } from "react-icons/io";

/* ─────────────────────────────────────────────────────
   Tag logic
───────────────────────────────────────────────────── */
const getProductTag = (product) => {
  const stockCount = Number(product?.countInStock || 0);
  const soldCount = Number(
    product?.soldCount || product?.totalSales || product?.sales || product?.sold || 0,
  );
  if (stockCount <= 0) return { label: "Out of Stock", color: "#6b7280", bg: "#f3f4f6" };
  if (stockCount <= 5) return { label: `Only ${stockCount} Left`, color: "#b45309", bg: "#fef3c7" };
  if (stockCount <= 10) return { label: `${stockCount} Available`, color: "#0369a1", bg: "#e0f2fe" };
  if (soldCount >= 10) return { label: "Best Seller", color: "#7c3aed", bg: "#ede9fe" };
  if (Number(product?.rating || 0) >= 4.2) return { label: "Top Rated", color: "#065f46", bg: "#d1fae5" };
  if (Number(product?.discount || 0) >= 25) return { label: "Trending", color: "#be123c", bg: "#ffe4e6" };
  return { label: "Featured", color: "#1d4ed8", bg: "#dbeafe" };
};

/* ─────────────────────────────────────────────────────
   Shared styles
───────────────────────────────────────────────────── */
const font = "'Sora', sans-serif";

const S = {
  card: {
    position: "relative",
    background: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
    transition: "box-shadow 0.28s ease, transform 0.28s ease",
    fontFamily: font,
    display: "flex",
    flexDirection: "column",
    border: "1px solid #f0f0f2",
  },
  cardHover: {
    boxShadow: "0 8px 40px rgba(0,0,0,0.13)",
    transform: "translateY(-4px)",
  },
  imgWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    background: "#f8f8fa",
    flexShrink: 0,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.45s ease",
    display: "block",
  },
  imgHover: { transform: "scale(1.07)" },

  // Discount badge stays on image (top-right)
  discountBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "#e84040",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "8px",
    padding: "4px 9px",
    zIndex: 5,
    letterSpacing: "0.02em",
  },

  // Hover action buttons on image
  actions: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    opacity: 0,
    transform: "translateX(8px)",
    transition: "opacity 0.22s ease, transform 0.22s ease",
    zIndex: 6,
  },
  actionsVisible: { opacity: 1, transform: "translateX(0)" },
  actionBtn: {
    width: "34px",
    height: "34px",
    minWidth: "34px",
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.13)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.18s, color 0.18s, transform 0.15s",
    color: "#222",
  },

  // Info section below image
  info: {
    padding: "12px 14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    flex: 1,
  },

  // Tag row — NOW BELOW IMAGE
  tagRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "2px",
  },
  tagPill: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    borderRadius: "20px",
    padding: "3px 9px",
  },

  brand: {
    fontSize: "10.5px",
    color: "#9ca3af",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  title: {
    fontSize: "13.5px",
    fontWeight: 600,
    color: "#111827",
    lineHeight: "1.45",
    textDecoration: "none",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
  },
  price: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#e84040",
    fontFamily: font,
  },
  oldPrice: {
    fontSize: "12px",
    color: "#d1d5db",
    textDecoration: "line-through",
    fontWeight: 500,
  },
  divider: {
    height: "1px",
    background: "#f3f4f6",
    margin: "6px 0 0",
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "1px",
  },
  ratingCount: {
    fontSize: "11px",
    color: "#9ca3af",
    fontWeight: 500,
  },
};

/* ─────────────────────────────────────────────────────
   GRID CARD — default export
───────────────────────────────────────────────────── */
const ProductItem = (props) => {
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [hovered, setHovered] = useState(false);

  const context = useAppContext();
  const location = useLocation();

  const productDetailsUrl = `/product/${props?.item?._id}${
    location.pathname === "/search" ? location.search : ""
  }`;
  const linkState = { product: props?.item };

  useEffect(() => {
    const myListItem = context?.myListData?.filter((item) =>
      item.productId.includes(props?.item?._id)
    );
    setIsAddedInMyList(myListItem?.length !== 0);
  }, [context?.myListData]);

  const handleAddToMyList = (item) => {
    if (context?.userData === null) {
      context?.alertBox("error", "Please login to add items to your wishlist");
      return;
    }
    const obj = {
      productId: item?._id,
      userId: context?.userData?._id,
      productTitle: item?.name,
      image: item?.images[0],
      rating: item?.rating,
      price: item?.price,
      oldPrice: item?.oldPrice,
      brand: item?.brand,
      discount: item?.discount,
    };
    postData("/api/myList/add", obj).then((res) => {
      if (res?.error === false) {
        context?.alertBox("success", res?.message);
        setIsAddedInMyList(true);
        context?.getMyListData();
      } else {
        context?.alertBox("error", res?.message);
      }
    });
  };

  const tag = getProductTag(props?.item);
  const isOutOfStock = tag.label === "Out of Stock";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
        .prod-action-btn:hover { background: #f3f4f6 !important; transform: scale(1.1); }
        .prod-action-btn.wishlist-active:hover { background: #fff0f0 !important; }
        .prod-title-link:hover { color: #e84040 !important; }
      `}</style>

      <div
        style={{ ...S.card, ...(hovered ? S.cardHover : {}) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Image ── */}
        <div style={S.imgWrapper}>
          <Link to={productDetailsUrl} state={linkState}>
            <img
              src={props?.item?.images?.[0]}
              alt={props?.item?.name}
              style={{ ...S.img, ...(hovered ? S.imgHover : {}) }}
            />
            {/* Second image crossfade on hover */}
            {props?.item?.images?.length > 1 && (
              <img
                src={props?.item?.images[1]}
                alt=""
                style={{
                  ...S.img,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: hovered ? 1 : 0,
                  transition: "opacity 0.4s ease",
                }}
              />
            )}
          </Link>

          {/* Discount badge — stays on image */}
          {props?.item?.discount > 0 && (
            <span style={S.discountBadge}>−{props?.item?.discount}%</span>
          )}

          {/* Out-of-stock overlay */}
          {isOutOfStock && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(2px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  background: "#6b7280",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: font,
                }}
              >
                Out of Stock
              </span>
            </div>
          )}

          {/* Hover action buttons */}
          <div style={{ ...S.actions, ...(hovered ? S.actionsVisible : {}) }}>
            <button
              className="prod-action-btn"
              style={S.actionBtn}
              title="Quick View"
              onClick={() => context.handleOpenProductDetailsModal(true, props?.item)}
            >
              <MdZoomOutMap size={15} />
            </button>
            <button
              className="prod-action-btn"
              style={S.actionBtn}
              title="Compare"
            >
              <IoGitCompareOutline size={15} />
            </button>
            <button
              className={`prod-action-btn ${isAddedInMyList ? "wishlist-active" : ""}`}
              style={{
                ...S.actionBtn,
                background: isAddedInMyList ? "#fff0f0" : "#fff",
                color: isAddedInMyList ? "#e84040" : "#222",
              }}
              title={isAddedInMyList ? "In Wishlist" : "Add to Wishlist"}
              onClick={() => handleAddToMyList(props?.item)}
            >
              {isAddedInMyList
                ? <IoMdHeart size={15} color="#e84040" />
                : <FaRegHeart size={13} />
              }
            </button>
          </div>
        </div>

        {/* ── Info (below image) ── */}
        <div style={S.info}>

          {/* ✅ TAG ROW — moved from image to here */}
          <div style={S.tagRow}>
            <span
              style={{
                ...S.tagPill,
                color: tag.color,
                background: tag.bg,
              }}
            >
              {tag.label}
            </span>
            <span style={S.brand}>{props?.item?.brand}</span>
          </div>

          {/* Title */}
          <Link
            to={productDetailsUrl}
            state={linkState}
            className="prod-title-link"
            style={{ ...S.title, transition: "color 0.18s" }}
          >
            {props?.item?.name}
          </Link>

          {/* Rating */}
          <div style={S.ratingRow}>
            <Rating
              value={Number(props?.item?.rating || 0)}
              size="small"
              precision={0.5}
              readOnly
              sx={{ fontSize: "13px" }}
            />
            {props?.item?.numReviews > 0 && (
              <span style={S.ratingCount}>({props?.item?.numReviews})</span>
            )}
          </div>

          <div style={S.divider} />

          {/* Price */}
          <div style={S.priceRow}>
            <span style={S.price}>
              {props?.item?.price?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              })}
            </span>
            {props?.item?.oldPrice && (
              <span style={S.oldPrice}>
                {props?.item?.oldPrice?.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductItem;


/* ─────────────────────────────────────────────────────
   LIST VIEW variant — export as ProductItemList
───────────────────────────────────────────────────── */
export const ProductItemList = (props) => {
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [hovered, setHovered] = useState(false);

  const context = useAppContext();
  const location = useLocation();

  const productDetailsUrl = `/product/${props?.item?._id}${
    location.pathname === "/search" ? location.search : ""
  }`;
  const linkState = { product: props?.item };

  useEffect(() => {
    const myListItem = context?.myListData?.filter((item) =>
      item.productId.includes(props?.item?._id)
    );
    setIsAddedInMyList(myListItem?.length !== 0);
  }, [context?.myListData]);

  const handleAddToMyList = (item) => {
    if (context?.userData === null) {
      context?.alertBox("error", "Please login to add items to your wishlist");
      return;
    }
    const obj = {
      productId: item?._id,
      userId: context?.userData?._id,
      productTitle: item?.name,
      image: item?.images[0],
      rating: item?.rating,
      price: item?.price,
      oldPrice: item?.oldPrice,
      brand: item?.brand,
      discount: item?.discount,
    };
    postData("/api/myList/add", obj).then((res) => {
      if (res?.error === false) {
        context?.alertBox("success", res?.message);
        setIsAddedInMyList(true);
        context?.getMyListData();
      } else {
        context?.alertBox("error", res?.message);
      }
    });
  };

  const tag = getProductTag(props?.item);
  const isOutOfStock = tag.label === "Out of Stock";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
        .prod-action-btn:hover { background: #f3f4f6 !important; transform: scale(1.1); }
        .prod-action-btn.wishlist-active:hover { background: #fff0f0 !important; }
        .prod-title-link:hover { color: #e84040 !important; }
      `}</style>

      <div
        style={{
          fontFamily: font,
          display: "flex",
          flexDirection: "row",
          background: "#fff",
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid #f0f0f2",
          boxShadow: hovered
            ? "0 8px 32px rgba(0,0,0,0.11)"
            : "0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)",
          transition: "box-shadow 0.28s ease, transform 0.28s ease",
          transform: hovered ? "translateY(-3px)" : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Image ── */}
        <div
          style={{
            position: "relative",
            width: "170px",
            minWidth: "170px",
            overflow: "hidden",
            background: "#f8f8fa",
            flexShrink: 0,
          }}
        >
          <Link to={productDetailsUrl} state={linkState}>
            <img
              src={props?.item?.images?.[0]}
              alt={props?.item?.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.4s ease",
                transform: hovered ? "scale(1.06)" : "scale(1)",
                display: "block",
              }}
            />
          </Link>

          {/* Discount badge */}
          {props?.item?.discount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "#e84040",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                borderRadius: "6px",
                padding: "3px 7px",
                zIndex: 5,
                fontFamily: font,
              }}
            >
              −{props?.item?.discount}%
            </span>
          )}

          {isOutOfStock && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(2px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  background: "#6b7280",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: font,
                }}
              >
                Unavailable
              </span>
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div
          style={{
            flex: 1,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>

            {/* ✅ TAG + BRAND ROW — below image area, top of info */}
            <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
              <span
                style={{
                  ...S.tagPill,
                  color: tag.color,
                  background: tag.bg,
                }}
              >
                {tag.label}
              </span>
              <span style={S.brand}>{props?.item?.brand}</span>
            </div>

            {/* Title */}
            <Link
              to={productDetailsUrl}
              state={linkState}
              className="prod-title-link"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#111827",
                textDecoration: "none",
                lineHeight: "1.45",
                display: "block",
                transition: "color 0.18s",
                fontFamily: font,
              }}
            >
              {props?.item?.name}
            </Link>

            {/* Description */}
            {props?.item?.description && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  lineHeight: "1.55",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  margin: 0,
                  fontFamily: font,
                }}
              >
                {props?.item?.description}
              </p>
            )}

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Rating
                value={Number(props?.item?.rating || 0)}
                size="small"
                precision={0.5}
                readOnly
                sx={{ fontSize: "13px" }}
              />
              {props?.item?.numReviews > 0 && (
                <span style={S.ratingCount}>({props?.item?.numReviews})</span>
              )}
            </div>
          </div>

          {/* Bottom row: price + actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "4px",
              paddingTop: "10px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ ...S.price, fontSize: "17px" }}>
                {props?.item?.price?.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </span>
              {props?.item?.oldPrice && (
                <span style={S.oldPrice}>
                  {props?.item?.oldPrice?.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "7px" }}>
              <button
                className="prod-action-btn"
                style={{ ...S.actionBtn, background: "#f8f8fa", boxShadow: "none" }}
                title="Quick View"
                onClick={() => context.handleOpenProductDetailsModal(true, props?.item)}
              >
                <MdZoomOutMap size={15} />
              </button>
              <button
                className="prod-action-btn"
                style={{ ...S.actionBtn, background: "#f8f8fa", boxShadow: "none" }}
                title="Compare"
              >
                <IoGitCompareOutline size={15} />
              </button>
              <button
                className={`prod-action-btn ${isAddedInMyList ? "wishlist-active" : ""}`}
                style={{
                  ...S.actionBtn,
                  background: isAddedInMyList ? "#fff0f0" : "#f8f8fa",
                  boxShadow: "none",
                  color: isAddedInMyList ? "#e84040" : "#222",
                }}
                title={isAddedInMyList ? "In Wishlist" : "Add to Wishlist"}
                onClick={() => handleAddToMyList(props?.item)}
              >
                {isAddedInMyList
                  ? <IoMdHeart size={15} color="#e84040" />
                  : <FaRegHeart size={13} />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};