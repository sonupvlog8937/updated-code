import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Rating from "@mui/material/Rating";
import Button from "@mui/material/Button";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
import { MdZoomOutMap } from "react-icons/md";
import { useAppContext } from "../../hooks/useAppContext";
import { postData } from "../../utils/api";
import { IoMdHeart } from "react-icons/io";

/* ─────────────────────────────────────────────────────
   Inline styles (no Tailwind compiler needed)
───────────────────────────────────────────────────── */
const S = {
  card: {
    position: "relative",
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    transition: "box-shadow 0.25s ease, transform 0.25s ease",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  cardHover: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
    transform: "translateY(-3px)",
  },
  imgWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    background: "#f7f7f9",
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.45s ease",
  },
  imgHover: {
    transform: "scale(1.06)",
  },
  tagBadge: {
    position: "absolute",
    bottom: "12px",
    left: "12px",
    background: "#111",
    color: "#fff",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    borderRadius: "6px",
    padding: "4px 9px",
    zIndex: 5,
  },
  discountBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "#e84040",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "8px",
    padding: "4px 8px",
    zIndex: 5,
  },
  actions: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    opacity: 0,
    transform: "translateX(10px)",
    transition: "opacity 0.2s ease, transform 0.2s ease",
    zIndex: 6,
  },
  actionsVisible: {
    opacity: 1,
    transform: "translateX(0)",
  },
  actionBtn: {
    width: "34px",
    height: "34px",
    minWidth: "34px",
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.18s, color 0.18s",
    color: "#222",
  },
  info: {
    padding: "14px 16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  brand: {
    fontSize: "11px",
    color: "#888",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  title: {
    fontSize: "13.5px",
    fontWeight: 600,
    color: "#1a1a1a",
    lineHeight: "1.4",
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
    marginTop: "6px",
  },
  price: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#e84040",
  },
  oldPrice: {
    fontSize: "12px",
    color: "#aaa",
    textDecoration: "line-through",
    fontWeight: 500,
  },
};

/* ─────────────────────────────────────────────────────
   Tag logic (unchanged)
───────────────────────────────────────────────────── */
const getProductTag = (product) => {
  const stockCount = Number(product?.countInStock || 0);
  const soldCount = Number(
    product?.soldCount || product?.totalSales || product?.sales || product?.sold || 0,
  );
  if (stockCount <= 0) return "Out of Stock";
  if (stockCount <= 5) return `${stockCount} Left`;
  if (stockCount <= 10) return `${stockCount} Available`;
  if (soldCount >= 10) return "Best Seller";
  if (Number(product?.rating || 0) >= 4.2) return "Top Rated";
  if (Number(product?.discount || 0) >= 25) return "Trending";
  return "Featured";
};

/* ─────────────────────────────────────────────────────
   Grid Card Component
───────────────────────────────────────────────────── */
const ProductItem = (props) => {
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [hovered, setHovered] = useState(false);

  const context = useAppContext();
  const location = useLocation();

  const productDetailsUrl = `/product/${props?.item?._id}${
    location.pathname === "/search" ? location.search : ""
  }`;

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
  const isOutOfStock = tag === "Out of Stock";

  return (
    <>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <div
        style={{ ...S.card, ...(hovered ? S.cardHover : {}) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div style={S.imgWrapper}>
          <Link to={productDetailsUrl}>
            <img
              src={props?.item?.images[0]}
              alt={props?.item?.name}
              style={{ ...S.img, ...(hovered ? S.imgHover : {}) }}
            />
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

          {/* Badges */}
          <span style={S.tagBadge}>{tag}</span>
          {props?.item?.discount > 0 && (
            <span style={S.discountBadge}>−{props?.item?.discount}%</span>
          )}

          {/* Hover actions */}
          <div style={{ ...S.actions, ...(hovered ? S.actionsVisible : {}) }}>
            <button
              style={S.actionBtn}
              title="Quick View"
              onClick={() => context.handleOpenProductDetailsModal(true, props?.item)}
            >
              <MdZoomOutMap size={16} />
            </button>
            <button style={S.actionBtn} title="Compare">
              <IoGitCompareOutline size={16} />
            </button>
            <button
              style={{
                ...S.actionBtn,
                background: isAddedInMyList ? "#fff0f0" : "#fff",
                color: isAddedInMyList ? "#e84040" : "#222",
              }}
              title={isAddedInMyList ? "In Wishlist" : "Add to Wishlist"}
              onClick={() => handleAddToMyList(props?.item)}
            >
              {isAddedInMyList ? (
                <IoMdHeart size={16} color="#e84040" />
              ) : (
                <FaRegHeart size={14} />
              )}
            </button>
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(2px)",
              }}
            >
              
            </div>
          )}
        </div>

        {/* Info */}
        <div style={S.info}>
          <span style={S.brand}>{props?.item?.brand}</span>

          <Link to={productDetailsUrl} style={S.title}>
            {props?.item?.name}
          </Link>

          <Rating
            value={Number(props?.item?.rating || 0)}
            size="small"
            precision={0.5}
            readOnly
            sx={{ fontSize: "13px", mt: "2px" }}
          />

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
   Usage: import ProductItem, { ProductItemList } from './index'
───────────────────────────────────────────────────── */
export const ProductItemList = (props) => {
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [hovered, setHovered] = useState(false);

  const context = useAppContext();
  const location = useLocation();

  const productDetailsUrl = `/product/${props?.item?._id}${
    location.pathname === "/search" ? location.search : ""
  }`;

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
  const isOutOfStock = tag === "Out of Stock";

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          flexDirection: "row",
          background: "#fff",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: hovered
            ? "0 8px 32px rgba(0,0,0,0.11)"
            : "0 2px 10px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.25s ease, transform 0.25s ease",
          transform: hovered ? "translateY(-2px)" : "none",
          gap: 0,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div
          style={{
            position: "relative",
            width: "180px",
            minWidth: "180px",
            overflow: "hidden",
            background: "#f7f7f9",
          }}
        >
          <Link to={productDetailsUrl}>
            <img
              src={props?.item?.images[0]}
              alt={props?.item?.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.4s ease",
                transform: hovered ? "scale(1.05)" : "scale(1)",
              }}
            />
          </Link>
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  background: "#111",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Unavailable
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div
          style={{
            flex: 1,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                {props?.item?.brand}
              </span>
              <span
                style={{
                  background: "#f3f4f6",
                  color: "#111",
                  fontSize: "10px",
                  fontWeight: 700,
                  borderRadius: "5px",
                  padding: "3px 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {tag}
              </span>
            </div>

            <Link
              to={productDetailsUrl}
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#1a1a1a",
                textDecoration: "none",
                lineHeight: "1.45",
                display: "block",
                marginBottom: "6px",
              }}
            >
              {props?.item?.name}
            </Link>

            <p
              style={{
                fontSize: "13px",
                color: "#666",
                lineHeight: "1.5",
                marginBottom: "10px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {props?.item?.description}
            </p>

            <Rating
              value={Number(props?.item?.rating || 0)}
              size="small"
              precision={0.5}
              readOnly
              sx={{ fontSize: "13px" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                style={{ fontSize: "17px", fontWeight: 700, color: "#e84040" }}
              >
                {props?.item?.price?.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </span>
              {props?.item?.oldPrice && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "#aaa",
                    textDecoration: "line-through",
                    fontWeight: 500,
                  }}
                >
                  {props?.item?.oldPrice?.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              )}
            </div>

            {/* Action row */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                style={{
                  ...S.actionBtn,
                  background: "#f7f7f9",
                  boxShadow: "none",
                }}
                title="Quick View"
                onClick={() =>
                  context.handleOpenProductDetailsModal(true, props?.item)
                }
              >
                <MdZoomOutMap size={16} />
              </button>
              <button
                style={{
                  ...S.actionBtn,
                  background: "#f7f7f9",
                  boxShadow: "none",
                }}
                title="Compare"
              >
                <IoGitCompareOutline size={16} />
              </button>
              <button
                style={{
                  ...S.actionBtn,
                  background: isAddedInMyList ? "#fff0f0" : "#f7f7f9",
                  boxShadow: "none",
                  color: isAddedInMyList ? "#e84040" : "#222",
                }}
                title={isAddedInMyList ? "In Wishlist" : "Add to Wishlist"}
                onClick={() => handleAddToMyList(props?.item)}
              >
                {isAddedInMyList ? (
                  <IoMdHeart size={16} color="#e84040" />
                ) : (
                  <FaRegHeart size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};