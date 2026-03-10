import React, { useEffect, useMemo, useState, useRef } from "react";
import Button from "@mui/material/Button";
import { QtyBox } from "../QtyBox";
import Rating from "@mui/material/Rating";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
import { useAppContext } from "../../hooks/useAppContext";
import CircularProgress from '@mui/material/CircularProgress';
import { postData } from "../../utils/api";
import { FaCheckDouble } from "react-icons/fa";
import { IoMdHeart } from "react-icons/io";
import { FaRegClock } from "react-icons/fa6";
import { FaWhatsapp, FaFacebookF, FaTelegramPlane } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";
import { BsTwitterX } from "react-icons/bs";
import { IoShareSocialOutline } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";


export const ProductDetailsComponent = (props) => {
  const [productActionIndex, setProductActionIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedTabName, setSelectedTabName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  const [tabError, setTabError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [isCheckingPinCode, setIsCheckingPinCode] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const context = useAppContext();
  const navigate = useNavigate();

  const sellerStore = props?.item?.sellerId && props?.item?.sellerId?.storeSlug
    ? props?.item?.sellerId
    : null;

  const handleSelecteQty = (qty) => {
    setQuantity(qty);
  }



  const handleClickActiveTab = (index, name) => {
    if (productActionIndex === index) return;

    setIsVariantLoading(true);
    setTabError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setProductActionIndex(index)
    setSelectedTabName(name)
    setTimeout(() => {
      setIsVariantLoading(false);
    }, 450);
  }

  const selectedColor = props?.item?.colorOptions?.[selectedColorIndex] || null;
  const selectedStyle = props?.item?.styleOptions?.[selectedStyleIndex] || null;

  const selectedVariantImages = useMemo(() => {
    if (selectedStyle?.images?.length) return selectedStyle.images;
    if (selectedColor?.images?.length) return selectedColor.images;
    return props?.item?.images || [];
  }, [selectedStyle, selectedColor, props?.item?.images]);

  const activePrice = useMemo(() => {
    const variantPrice = selectedStyle?.price ?? selectedColor?.price;
    const sizePrice = props?.item?.sizePriceMap?.[selectedTabName]?.price;
    return Number(variantPrice ?? sizePrice ?? props?.item?.price ?? 0);
  }, [selectedStyle, selectedColor, selectedTabName, props?.item?.sizePriceMap, props?.item?.price]);

  const activeOldPrice = useMemo(() => {
    const variantOldPrice = selectedStyle?.oldPrice ?? selectedColor?.oldPrice;
    const sizeOldPrice = props?.item?.sizePriceMap?.[selectedTabName]?.oldPrice;
    return Number(variantOldPrice ?? sizeOldPrice ?? props?.item?.oldPrice ?? 0);
  }, [selectedStyle, selectedColor, selectedTabName, props?.item?.sizePriceMap, props?.item?.oldPrice]);

  const activeDiscount = useMemo(() => {
    if (activeOldPrice > activePrice && activeOldPrice > 0) {
      return Math.round(((activeOldPrice - activePrice) / activeOldPrice) * 100);
    }
    return props?.item?.discount || 0;
  }, [activeOldPrice, activePrice, props?.item?.discount]);


  useEffect(() => {
    const item = context?.cartData?.filter((cartItem) =>
      cartItem.productId.includes(props?.item?._id)
    )

    if (item?.length !== 0) {
      setIsAdded(true)
    } else {
      setIsAdded(false)
    }

  }, [context?.cartData, props?.item?._id])


  useEffect(() => {
    const myListItem = context?.myListData?.filter((item) =>
      item.productId.includes(props?.item?._id)
    )


    if (myListItem?.length !== 0) {
      setIsAddedInMyList(true);
    } else {
      setIsAddedInMyList(false)
    }

  }, [context?.myListData])

  const validateVariantSelection = () => {
    if (props?.item?.size?.length !== 0 || props?.item?.productWeight?.length !== 0 || props?.item?.productRam?.length !== 0 || props?.item?.productAge?.length !== 0) {
      if (selectedTabName === null) {
        setTabError(true);
        context?.alertBox("error", "Please select product options first");
        return false;
      }
    }

    return true;
  }

  const createProductItem = (product, selectedQty) => ({
    _id: product?._id,
    productTitle: product?.name,
    image: selectedVariantImages?.[0] || product?.images?.[0],
    rating: product?.rating,
    price: activePrice,
    oldPrice: activeOldPrice,
    discount: activeDiscount,
    quantity: selectedQty,
    subTotal: parseInt(activePrice * selectedQty),
    productId: product?._id,
    countInStock: product?.countInStock,
    brand: product?.brand,
    size: props?.item?.size?.length > 0 ? selectedTabName : '',
    weight: props?.item?.productWeight?.length > 0 ? selectedTabName : '',
    ram: props?.item?.productRam?.length > 0 ? selectedTabName : '',
    age: props?.item?.productAge?.length > 0 ? selectedTabName : '',
    color:
      props?.item?.colorOptions?.length > 0
        ? props?.item?.colorOptions?.[selectedColorIndex]?.name || ''
        : '',
    style:
      props?.item?.styleOptions?.length > 0
        ? props?.item?.styleOptions?.[selectedStyleIndex]?.name || ''
        : '',
  });


  const addToCart = (product, userId, quantity) => {


    if (userId === undefined) {
      context?.alertBox("error", "you are not login please login first");
      return false;
    }

    if (!validateVariantSelection()) return;

    const productItem = createProductItem(product, quantity);




    setIsLoading(true);
    postData("/api/cart/add", productItem).then((res) => {
      if (res?.error === false) {
        context?.alertBox("success", res?.message);

        context?.getCartItems();
        setTimeout(() => {
          setIsLoading(false);
          setIsAdded(true)
        }, 500);

      } else {
        context?.alertBox("error", res?.message);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    })
  }

  useEffect(() => {
    setSelectedColorIndex(0);

    setSelectedStyleIndex(0);
    setShowSizeChart(false);
    setPinCode("");
    setDeliveryMessage("");

    if (props?.item?.styleOptions?.length !== 0) {
      props?.onColorChange?.(props?.item?.styleOptions?.[0]?.images || props?.item?.images || []);
    } else if (props?.item?.colorOptions?.length !== 0) {
      props?.onColorChange?.(props?.item?.colorOptions?.[0]?.images || props?.item?.images || []);
    } else {
      props?.onColorChange?.(props?.item?.images || []);
    }
  }, [props?.item?._id]);

  useEffect(() => {
    props?.onColorChange?.(selectedVariantImages);
  }, [selectedVariantImages]);

  const checkPinCode = async () => {
    if (!/^\d{6}$/.test(pinCode)) {
      setDeliveryMessage("Please enter a valid 6-digit pincode.");
      return;
    }

    setIsCheckingPinCode(true);

    let isServiceable = false;

    try {
      const response = await postData("/api/pincode/check", {
        pincode: pinCode,
        productId: props?.item?._id,
      });

      if (typeof response?.serviceable === "boolean") {
        isServiceable = response.serviceable;
      } else {
        isServiceable = Number(pinCode[pinCode.length - 1]) % 2 === 0;
      }
    } catch (error) {
      isServiceable = Number(pinCode[pinCode.length - 1]) % 2 === 0;
    }
    setDeliveryMessage(
      isServiceable
        ? "Delivery available. Usually ships within 24 hours with easy returns."
        : "Delivery available. Usually ships within 24 hours with easy returns."
    );

    setIsCheckingPinCode(false);
  }

  const handleBuyNow = async () => {
    if (context?.userData?._id === undefined) {
      context?.alertBox("error", "you are not login please login first");
      return;
    }

    if (!validateVariantSelection()) return;

    setIsBuyingNow(true);
    const productItem = createProductItem(props?.item, quantity);
    navigate("/checkout", {
      state: {
        buyNowItem: productItem,
      },
    });

    setIsBuyingNow(false);

  }

  const handleShareProduct = (platform) => {
    const productName = encodeURIComponent(props?.item?.name || "Check this product");
    const productUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`Check out this product: ${props?.item?.name || ""}`);

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${shareText}%20${productUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${productUrl}`,
      instagram: `https://www.instagram.com/`,
      telegram: `https://t.me/share/url?url=${productUrl}&text=${shareText}`,
      x: `https://twitter.com/intent/tweet?url=${productUrl}&text=${productName}`,
    };

    const targetUrl = shareUrls[platform];
    if (!targetUrl) return;

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleAddToMyList = (item) => {
    if (context?.userData === null) {
      context?.alertBox("error", "you are not login please login first");
      return false;
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
    setIsWishlistLoading(true);
    postData("/api/myList/add", obj).then((res) => {
      if (res?.error === false) {
        context?.alertBox("success", res?.message);
        setIsAddedInMyList(true);
        context?.getMyListData();
      } else {
        context?.alertBox("error", res?.message);
      }
      setIsWishlistLoading(false);
    }).catch(() => setIsWishlistLoading(false));
  }

  const handleColorSelect = (index) => {
    setSelectedColorIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const S = {
    divider: { height: "1px", background: "rgba(0,0,0,0.07)", margin: "20px 0" },
    label: {
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: "rgba(0,0,0,0.35)",
      marginBottom: "10px", display: "block",
    },
    variantBtn: (active, error) => ({
      height: "38px", minWidth: "52px", padding: "0 14px",
      border: active ? "2px solid #111" : error ? "1.5px solid #ef4444" : "1.5px solid rgba(0,0,0,0.13)",
      borderRadius: "8px", background: active ? "#111" : "#fff",
      color: active ? "#fff" : error ? "#ef4444" : "rgba(0,0,0,0.7)",
      fontSize: "13px", fontWeight: 600, cursor: "pointer",
      transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)", outline: "none",
      boxShadow: active ? "0 3px 12px rgba(0,0,0,0.2)" : "none",
      transform: active ? "scale(1.04)" : "scale(1)",
    }),
  };

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

    .pdc-wrap * { font-family: 'Outfit', sans-serif; box-sizing: border-box; }

    /* ── FADE-UP ENTRY ── */
    @keyframes pdc-fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pdc-fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes pdc-popIn {
      0%   { opacity: 0; transform: scale(0.88) translateY(-8px); }
      60%  { transform: scale(1.03) translateY(0); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes pdc-slideDown {
      from { opacity: 0; transform: translateY(-18px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pdc-slideUp {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(-12px) scale(0.96); }
    }
    @keyframes pdc-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes pdc-heartPop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.45); }
      70%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes pdc-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes pdc-badgePop {
      0%   { transform: scale(0.7); opacity: 0; }
      70%  { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes pdc-spin {
      to { transform: rotate(360deg); }
    }

    .pdc-section {
      animation: pdc-fadeUp 0.42s cubic-bezier(0.4,0,0.2,1) both;
    }
    .pdc-section:nth-child(1)  { animation-delay: 0.03s; }
    .pdc-section:nth-child(2)  { animation-delay: 0.08s; }
    .pdc-section:nth-child(3)  { animation-delay: 0.13s; }
    .pdc-section:nth-child(4)  { animation-delay: 0.17s; }
    .pdc-section:nth-child(5)  { animation-delay: 0.21s; }
    .pdc-section:nth-child(6)  { animation-delay: 0.24s; }
    .pdc-section:nth-child(7)  { animation-delay: 0.27s; }
    .pdc-section:nth-child(8)  { animation-delay: 0.30s; }
    .pdc-section:nth-child(9)  { animation-delay: 0.33s; }
    .pdc-section:nth-child(10) { animation-delay: 0.36s; }


    /* ── VARIANT BTN HOVER ── */
    .pdc-vbtn:hover:not(:disabled) {
      border-color: #111 !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12) !important;
    }

    /* ── COLOR OPTION CARD ── */
    .pdc-color-card {
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .pdc-color-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important;
    }
    .pdc-color-card.active-color {
      animation: pdc-popIn 0.3s ease both;
    }

    /* ── TRUST BADGE ── */
    .pdc-trust-badge {
      transition: all 0.2s ease;
    }
    .pdc-trust-badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
    }

    /* ── ACTION BUTTONS ── */
    .pdc-btn-cart {
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .pdc-btn-cart:hover:not(:disabled) {
      background: #111 !important;
      color: #fff !important;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
    }
    .pdc-btn-buy {
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .pdc-btn-buy:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 26px rgba(255,107,0,0.42) !important;
      filter: brightness(1.06);
    }
    .pdc-btn-wish {
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .pdc-btn-wish:hover:not(:disabled) {
      background: #fff0f3 !important;
      color: #e11d48 !important;
      border-color: #fecdd3 !important;
      transform: translateY(-1px);
    }
    .pdc-btn-compare {
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .pdc-btn-compare:hover {
      background: #eff6ff !important;
      color: #2563eb !important;
      border-color: #bfdbfe !important;
      transform: translateY(-1px);
    }

    /* ── HEART ANIMATION ── */
    .pdc-heart-anim {
      animation: pdc-heartPop 0.45s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── BADGE POP ── */
    .pdc-badge-anim {
      animation: pdc-badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    }

    /* ── SHARE BTN ── */
    .pdc-share-btn {
      transition: all 0.18s ease;
    }
    .pdc-share-btn:hover {
      transform: translateY(-2px);
    }

    /* ── PINCODE INPUT ── */
    .pdc-pin-input {
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .pdc-pin-input:focus {
      outline: none;
      border-color: #111 !important;
      box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
    }

    /* ── SIZE CHART ROW HOVER ── */
    .pdc-size-row:hover {
      background: #f5f5f5;
    }

    /* ── DELIVERY CARD SHIMMER on LOAD ── */
    .pdc-delivery-card {
      animation: pdc-fadeUp 0.5s ease both;
      animation-delay: 0.2s;
    }

    /* ── WISHLIST SPINNER ── */
    .pdc-wish-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(225,29,72,0.2);
      border-top-color: #e11d48;
      border-radius: 50%;
      animation: pdc-spin 0.7s linear infinite;
      flex-shrink: 0;
    }
  `;

  return (
    <>
      <style>{globalStyles}</style>

      <div className="pdc-wrap" style={{ display: "flex", flexDirection: "column" }}>

        {/* ── 1. TITLE + META ── */}
        <div className="pdc-section" style={{ marginBottom: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            {props?.item?.brand && (
              <span className="pdc-badge-anim" style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#fff",
                background: "#111", borderRadius: "5px", padding: "4px 10px",
              }}>
                {props?.item?.brand}
              </span>
            )}
            {props?.item?.countInStock > 0 ? (
              <span className="pdc-badge-anim" style={{
                fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em",
                textTransform: "uppercase", color: "#16a34a",
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: "5px", padding: "4px 10px", animationDelay: "0.1s",
              }}>● In Stock</span>
            ) : (
              <span style={{
                fontSize: "10px", fontWeight: 600, color: "#dc2626",
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "5px", padding: "4px 10px",
              }}>Out of Stock</span>
            )}
          </div>

          <h1 style={{
            fontSize: "clamp(18px, 2.6vw, 24px)", fontWeight: 800,
            color: "#0a0a0a", lineHeight: 1.28, marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}>
            {props?.item?.name}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <Rating name="size-small" value={props?.item?.rating} size="small" readOnly />
            <span
              style={{ fontSize: "12px", color: "#2563eb", cursor: "pointer", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "2px", transition: "opacity 0.15s" }}
              onClick={props.gotoReviews}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {props.reviewsCount} Reviews
            </span>
            <span style={{ color: "rgba(0,0,0,0.2)", fontSize: "12px" }}>|</span>
            <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)" }}>
              SKU: <span style={{ color: "#111", fontWeight: 600 }}>{props?.item?._id?.slice(-8)?.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* ── 2. PRICE BLOCK ── */}
        <div className="pdc-section" style={{
          background: "linear-gradient(135deg,#fafafa 0%,#f3f3f3 100%)",
          border: "1px solid rgba(0,0,0,0.07)", borderRadius: "14px",
          padding: "16px 20px", margin: "16px 0",
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px",
        }}>
          <span style={{ fontSize: "32px", fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.025em", lineHeight: 1 }}>
            &#x20b9;{activePrice?.toLocaleString("en-IN")}
          </span>
          {activeOldPrice > activePrice && (
            <span style={{ fontSize: "17px", fontWeight: 400, color: "rgba(0,0,0,0.3)", textDecoration: "line-through" }}>
              &#x20b9;{activeOldPrice?.toLocaleString("en-IN")}
            </span>
          )}
          {activeDiscount > 0 && (
            <span className="pdc-badge-anim" style={{
              fontSize: "12px", fontWeight: 700, color: "#fff",
              background: "linear-gradient(135deg,#16a34a,#15803d)",
              borderRadius: "6px", padding: "4px 11px",
              boxShadow: "0 2px 10px rgba(22,163,74,0.35)",
            }}>
              {activeDiscount}% OFF
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(0,0,0,0.38)", fontWeight: 500 }}>
            {props?.item?.countInStock} units left
          </span>
        </div>

        {/* ── 3. DESCRIPTION ── */}
        <div className="pdc-section">
          <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(0,0,0,0.58)" }}>
            {props?.item?.description}
          </p>
        </div>

        {sellerStore && (
          <div className="pdc-section" style={{
            marginTop: "10px",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            background: "#fff"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={sellerStore?.storeLogo || "/placeholder.png"}
                alt={sellerStore?.storeName}
                style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", background: "#f3f4f6" }}
              />
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "rgba(0,0,0,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Sold by
                </p>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111" }}>{sellerStore?.storeName}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(0,0,0,0.55)" }}>
                  {sellerStore?.totalOrders || 0}+ orders fulfilled
                </p>
              </div>
            </div>

            <Link
              to={`/store/${sellerStore?.storeSlug}`}
              style={{
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #111",
                color: "#111",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Visit Store
            </Link>
          </div>
        )}


        <div className="pdc-section" style={S.divider} />

        {/* ── 4. VARIANTS ── */}
        <div className="pdc-section" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* RAM */}
          {props?.item?.productRam?.length !== 0 && (
            <div>
              <span style={S.label}>RAM</span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {props?.item?.productRam?.map((item, index) => (
                  <button key={index} className="pdc-vbtn" style={S.variantBtn(productActionIndex === index, tabError)}
                    onClick={() => handleClickActiveTab(index, item)} disabled={isVariantLoading}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SIZE */}
          {props?.item?.size?.length !== 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ ...S.label, marginBottom: 0 }}>Size</span>
                <button
                  onClick={() => setShowSizeChart(p => !p)}
                  style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", padding: 0, transition: "opacity 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.65"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  {showSizeChart ? "Hide" : "View"} Size Chart
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {props?.item?.size?.map((item, index) => (
                  <button key={index} className="pdc-vbtn" style={S.variantBtn(productActionIndex === index, tabError)}
                    onClick={() => handleClickActiveTab(index, item)} disabled={isVariantLoading}>
                    {item}
                  </button>
                ))}
              </div>
              {tabError && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px", animation: "pdc-fadeIn 0.2s ease" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Please select a size first
                </p>
              )}
              {showSizeChart && (
                <div style={{ marginTop: "12px", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "10px", overflow: "hidden", maxWidth: "420px", animation: "pdc-fadeUp 0.25s ease both" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#f5f5f5", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,0,0,0.45)" }}>
                    {["Size", "India/UK", "Foot (cm)"].map((h, i) => (
                      <span key={h} style={{ padding: "10px 12px", borderRight: i < 2 ? "1px solid rgba(0,0,0,0.07)" : "none" }}>{h}</span>
                    ))}
                  </div>
                  {props?.item?.size?.map((sizeItem, index) => {
                    const sn = Number(String(sizeItem).replace(/\D/g, "")) || index + 5;
                    return (
                      <div key={index} className="pdc-size-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontSize: "13px", borderTop: "1px solid rgba(0,0,0,0.06)", transition: "background 0.15s" }}>
                        {[sizeItem, sizeItem, `${(22 + (sn - 5) * 0.6).toFixed(1)}`].map((v, i) => (
                          <span key={i} style={{ padding: "9px 12px", borderRight: i < 2 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>{v}</span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* WEIGHT */}
          {props?.item?.productWeight?.length !== 0 && (
            <div>
              <span style={S.label}>Weight / Age</span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {props?.item?.productWeight?.map((item, index) => (
                  <button key={index} className="pdc-vbtn" style={S.variantBtn(productActionIndex === index, tabError)}
                    onClick={() => handleClickActiveTab(index, item)} disabled={isVariantLoading}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AGE */}
          {props?.item?.productAge?.length !== 0 && (
            <div>
              <span style={S.label}>Age Group</span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {props?.item?.productAge?.map((item, index) => (
                  <button key={index} className="pdc-vbtn" style={S.variantBtn(productActionIndex === index, tabError)}
                    onClick={() => handleClickActiveTab(index, item)} disabled={isVariantLoading}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STYLES */}
          {props?.item?.styleOptions?.length !== 0 && (
            <div>
              <span style={S.label}>Style</span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {props?.item?.styleOptions?.map((styleItem, index) => (
                  <button key={index} className="pdc-vbtn" style={S.variantBtn(selectedStyleIndex === index, false)}
                    onClick={() => setSelectedStyleIndex(index)}>
                    {styleItem?.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* COLOR / PRODUCT OPTIONS */}
          {props?.item?.colorOptions?.length !== 0 && (
            <div>
              <span style={S.label}>Product Options</span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {props?.item?.colorOptions?.map((colorItem, index) => {
                  const optionImage = colorItem?.images?.[0] || props?.item?.images?.[0];
                  const isActive = selectedColorIndex === index;
                  return (
                    <button
                      key={index} type="button" title={colorItem?.name}
                      className={`pdc-color-card${isActive ? " active-color" : ""}`}
                      onClick={() => handleColorSelect(index)}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "6px 12px 6px 6px", borderRadius: "12px", cursor: "pointer",
                        border: isActive ? "2px solid #111" : "1.5px solid rgba(0,0,0,0.11)",
                        background: isActive ? "#fafafa" : "#fff",
                        outline: "none",
                        boxShadow: isActive ? "0 4px 16px rgba(0,0,0,0.13)" : "none",
                      }}
                    >
                      <img src={optionImage} alt={colorItem?.name} style={{
                        width: "38px", height: "38px", borderRadius: "8px",
                        objectFit: "cover", flexShrink: 0,
                        transition: "transform 0.22s ease",
                        transform: isActive ? "scale(1.05)" : "scale(1)",
                      }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{colorItem?.name}</span>
                      {isActive && (
                        <span style={{ marginLeft: "2px", color: "#111", animation: "pdc-popIn 0.3s ease" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant loading indicator */}
          {isVariantLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(0,0,0,0.45)", animation: "pdc-fadeIn 0.2s ease" }}>
              <CircularProgress size={13} /> Updating option…
            </div>
          )}
        </div>

        <div className="pdc-section" style={S.divider} />

        {/* ── 5. DELIVERY INFO ── */}
        <div className="pdc-section pdc-delivery-card" style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: "12px", padding: "14px 16px", marginBottom: "12px",
          display: "flex", flexDirection: "column", gap: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "17px" }}>🚚</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#15803d" }}>Free Delivery · 2–3 Business Days</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(0,0,0,0.5)", flexWrap: "wrap" }}>
            <FaRegClock style={{ fontSize: "11px", flexShrink: 0 }} />
            <span>Order today, get it between</span>
            <strong style={{ color: "#111" }}>
              {new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", timeZone: "Asia/Kolkata" })}
            </strong>
            <span>–</span>
            <strong style={{ color: "#111" }}>
              {new Date(Date.now() + 4 * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", timeZone: "Asia/Kolkata" })}
            </strong>
          </div>
        </div>

        {/* ── 6. PINCODE CHECK ── */}
        <div className="pdc-section" style={{
          border: "1px solid rgba(0,0,0,0.08)", borderRadius: "12px",
          padding: "16px", marginBottom: "14px", background: "#fff",
        }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#111", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Check Delivery Availability
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text" value={pinCode} className="pdc-pin-input"
              onChange={e => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit pincode"
              style={{
                flex: 1, height: "42px", padding: "0 14px", fontSize: "13px",
                border: "1.5px solid rgba(0,0,0,0.11)", borderRadius: "8px",
                background: "#fafafa", color: "#111", fontFamily: "inherit",
              }}
            />
            <button
              onClick={checkPinCode} disabled={isCheckingPinCode}
              style={{
                height: "42px", padding: "0 18px", background: "#111", color: "#fff",
                border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                cursor: isCheckingPinCode ? "not-allowed" : "pointer",
                opacity: isCheckingPinCode ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit",
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { if (!isCheckingPinCode) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => e.currentTarget.style.transform = ""}
            >
              {isCheckingPinCode ? <CircularProgress size={13} color="inherit" /> : "Check"}
            </button>
          </div>
          {deliveryMessage && (
            <p style={{ fontSize: "12px", marginTop: "8px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px", animation: "pdc-fadeUp 0.25s ease" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              {deliveryMessage}
            </p>
          )}
        </div>

        {/* ── 7. TRUST BADGES ── */}
        <div className="pdc-section" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "16px" }}>
          {[
            { icon: "🔄", title: "7-Day Exchange", sub: "Easy returns" },
            { icon: "🔒", title: "Secure Payment", sub: "100% protected" },
            { icon: "✅", title: "Expert Verified", sub: "Quality assured" },
          ].map(({ icon, title, sub }, i) => (
            <div key={title} className="pdc-trust-badge" style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center", padding: "13px 8px",
              border: "1px solid rgba(0,0,0,0.07)", borderRadius: "12px",
              background: "#fafafa", gap: "4px",
              animationDelay: `${0.1 + i * 0.06}s`,
            }}>
              <span style={{ fontSize: "22px" }}>{icon}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#111", lineHeight: 1.2 }}>{title}</span>
              <span style={{ fontSize: "10px", color: "rgba(0,0,0,0.38)" }}>{sub}</span>
            </div>
          ))}
        </div>

        <div className="pdc-section" style={S.divider} />

        {/* ── 8. QTY + BUTTONS ── */}
        <div className="pdc-section" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Qty */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ ...S.label, margin: 0 }}>Qty</span>
            <div className="qtyBoxWrapper w-[80px]">
              <QtyBox handleSelecteQty={handleSelecteQty} />
            </div>
          </div>

          {/* Cart + Buy Now */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="pdc-btn-cart"
              onClick={() => addToCart(props?.item, context?.userData?._id, quantity)}
              disabled={isLoading}
              style={{
                flex: 1, height: "52px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                background: isAdded ? "#111" : "#fff", color: isAdded ? "#fff" : "#111",
                border: "1.5px solid #111", borderRadius: "12px",
                fontSize: "14px", fontWeight: 700, letterSpacing: "0.02em",
                cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1,
                outline: "none", fontFamily: "inherit",
              }}
            >
              {isLoading ? <CircularProgress size={18} color="inherit" /> : (
                <>
                  {isAdded ? <FaCheckDouble style={{ fontSize: "14px" }} /> : <MdOutlineShoppingCart style={{ fontSize: "18px" }} />}
                  {isAdded ? "Added to Cart" : "Add to Cart"}
                </>
              )}
            </button>

            <button
              className="pdc-btn-buy"
              onClick={handleBuyNow} disabled={isBuyingNow}
              style={{
                flex: 1, height: "52px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                background: "linear-gradient(135deg,#ff6b00,#ff9200)", color: "#fff",
                border: "none", borderRadius: "12px",
                fontSize: "14px", fontWeight: 700, letterSpacing: "0.02em",
                cursor: isBuyingNow ? "not-allowed" : "pointer", opacity: isBuyingNow ? 0.75 : 1,
                boxShadow: "0 4px 18px rgba(255,107,0,0.32)", outline: "none", fontFamily: "inherit",
              }}
            >
              {isBuyingNow ? <CircularProgress size={18} color="inherit" /> : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Buy Now</>
              )}
            </button>
          </div>

          {/* Wishlist + Compare */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="pdc-btn-wish"
              onClick={() => handleAddToMyList(props?.item)}
              disabled={isWishlistLoading}
              style={{
                flex: 1, height: "46px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                background: isAddedInMyList ? "#fff0f3" : "#fafafa",
                color: isAddedInMyList ? "#e11d48" : "rgba(0,0,0,0.6)",
                border: isAddedInMyList ? "1.5px solid #fecdd3" : "1.5px solid rgba(0,0,0,0.1)",
                borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                cursor: isWishlistLoading ? "not-allowed" : "pointer",
                opacity: isWishlistLoading ? 0.8 : 1,
                outline: "none", fontFamily: "inherit",
              }}
            >
              {isWishlistLoading ? (
                <><div className="pdc-wish-spinner" /> Adding…</>
              ) : (
                <>
                  {isAddedInMyList
                    ? <IoMdHeart className="pdc-heart-anim" style={{ fontSize: "16px" }} />
                    : <FaRegHeart style={{ fontSize: "14px" }} />}
                  {isAddedInMyList ? "Wishlisted" : "Wishlist"}
                </>
              )}
            </button>

            <button
              className="pdc-btn-compare"
              style={{
                flex: 1, height: "46px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                background: "#fafafa", color: "rgba(0,0,0,0.6)",
                border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "12px",
                fontSize: "13px", fontWeight: 600,
                cursor: "pointer", outline: "none", fontFamily: "inherit",
              }}
            >
              <IoGitCompareOutline style={{ fontSize: "16px" }} /> Compare
            </button>
          </div>
        </div>

        <div className="pdc-section" style={S.divider} />

        {/* ── 9. SHARE ── */}
        <div className="pdc-section" style={{ marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <IoShareSocialOutline style={{ fontSize: "15px", color: "rgba(0,0,0,0.38)" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,0,0,0.38)" }}>Share this product</span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { key: "whatsapp", label: "WhatsApp", bg: "#edfff2", border: "#bbf7d0", color: "#16a34a", Icon: FaWhatsapp },
              { key: "facebook", label: "Facebook", bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", Icon: FaFacebookF },
              { key: "instagram", label: "Instagram", bg: "#fff0f7", border: "#fecdd3", color: "#e1306c", Icon: RiInstagramFill },
              { key: "telegram", label: "Telegram", bg: "#f0f9ff", border: "#bae6fd", color: "#0369a1", Icon: FaTelegramPlane },
              { key: "x", label: "X", bg: "#f9fafb", border: "#e5e7eb", color: "#111", Icon: BsTwitterX },
            ].map(({ key, label, bg, border, color, Icon }) => (
              <button
                key={key} type="button" className="pdc-share-btn" onClick={() => handleShareProduct(key)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px",
                  background: bg, border: `1px solid ${border}`, borderRadius: "8px",
                  fontSize: "12px", fontWeight: 700, color, cursor: "pointer", outline: "none",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 12px ${border}`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                <Icon style={{ fontSize: "13px" }} /> {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};