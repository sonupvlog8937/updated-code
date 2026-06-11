import { QtyBox } from "@/src/components/QtyBox";
import { Rating } from "@/src/components/Rating";
import { AppDispatch, RootState } from "@/src/store";
import { fetchCartItems, fetchMyListData } from "@/src/store/appSlice";
import { useToast } from "@/src/context/ToastContext";
import { postData } from "@/src/utils/api";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

/* ── Divider ── */
const Divider = () => (
  <View
    style={{
      height: 1,
      backgroundColor: "rgba(0,0,0,0.07)",
      marginVertical: 18,
    }}
  />
);

interface ProductDetailsComponentProps {
  item: any;
  reviewsCount?: number;
  gotoReviews?: () => void;
  gotoSpecs?: () => void;
  onColorChange?: (images: string[]) => void;
  onColorSelectScrollToTop?: () => void;
  showInlineFooterActions?: boolean;
  onFooterActionStateChange?: (state: ProductFooterActionState) => void;
}
export interface ProductFooterActionState {
  isAdded: boolean;
  isLoading: boolean;
  isBuyingNow: boolean;
  isOutOfStock: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export const ProductDetailsComponent: React.FC<
  ProductDetailsComponentProps
> = ({
  item,
  reviewsCount = 0,
  gotoReviews,
  gotoSpecs,
  onColorChange,
  onColorSelectScrollToTop,
  showInlineFooterActions = true,
  onFooterActionStateChange,
}) => {
  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const { userData, cartData, myListData } = useSelector(
    (state: RootState) => state.app,
  );
  const router = useRouter();
  const { showToast } = useToast();

  // ── Local state ──
  const [productActionIndex, setProductActionIndex] = React.useState<
    number | null
  >(null);
  const [quantity, setQuantity] = React.useState<number>(1);
  const [selectedTabName, setSelectedTabName] = React.useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isVariantLoading, setIsVariantLoading] =
    React.useState<boolean>(false);
  const [tabError, setTabError] = React.useState<boolean>(false);
  const [isAdded, setIsAdded] = React.useState<boolean>(false);
  const [isAddedInMyList, setIsAddedInMyList] = React.useState<boolean>(false);
  const [selectedColorIndex, setSelectedColorIndex] = React.useState<number>(0);
  const [selectedStyleIndex, setSelectedStyleIndex] = React.useState<number>(0);
  const [showSizeChart, setShowSizeChart] = React.useState<boolean>(false);
  const [pinCode, setPinCode] = React.useState<string>("");
  const [deliveryMessage, setDeliveryMessage] = React.useState<string>("");
  const [isCheckingPinCode, setIsCheckingPinCode] =
    React.useState<boolean>(false);
  const [isBuyingNow, setIsBuyingNow] = React.useState<boolean>(false);
  const [isWishlistLoading, setIsWishlistLoading] =
    React.useState<boolean>(false);

  // ── Selected variants ──
  const selectedColor = item?.colorOptions?.[selectedColorIndex] || null;
  const selectedStyle = item?.styleOptions?.[selectedStyleIndex] || null;

  const selectedVariantImages = useMemo(() => {
    if (selectedColor?.images?.length) return selectedColor.images;
    if (selectedStyle?.images?.length) return selectedStyle.images;
    return item?.images || [];
  }, [selectedStyle, selectedColor, item?.images]);

  React.useEffect(() => {
    onColorChange?.(selectedVariantImages);
  }, [onColorChange, selectedVariantImages]);

  const activePrice = useMemo(() => {
    const variantPrice = selectedStyle?.price ?? selectedColor?.price;
    if (
      variantPrice !== undefined &&
      variantPrice !== null &&
      Number(variantPrice) > 0
    )
      return Number(variantPrice);
    if (selectedTabName && item?.sizePriceMap?.[selectedTabName]?.price)
      return Number(item.sizePriceMap[selectedTabName].price);
    if (selectedTabName && Array.isArray(item?.priceVariants)) {
      const match = item.priceVariants.find(
        (v: any) =>
          v?.size === selectedTabName ||
          v?.label === selectedTabName ||
          v?.name === selectedTabName,
      );
      if (match?.price) return Number(match.price);
    }
    return Number(item?.price ?? 0);
  }, [selectedStyle, selectedColor, selectedTabName, item]);

  const activeOldPrice = useMemo(() => {
    const variantOldPrice = selectedStyle?.oldPrice ?? selectedColor?.oldPrice;
    if (
      variantOldPrice !== undefined &&
      variantOldPrice !== null &&
      Number(variantOldPrice) > 0
    )
      return Number(variantOldPrice);
    if (selectedTabName && item?.sizePriceMap?.[selectedTabName]?.oldPrice)
      return Number(item.sizePriceMap[selectedTabName].oldPrice);
    if (selectedTabName && Array.isArray(item?.priceVariants)) {
      const match = item.priceVariants.find(
        (v: any) =>
          v?.size === selectedTabName ||
          v?.label === selectedTabName ||
          v?.name === selectedTabName,
      );
      if (match?.oldPrice) return Number(match.oldPrice);
    }
    return Number(item?.oldPrice ?? 0);
  }, [selectedStyle, selectedColor, selectedTabName, item]);

  const activeDiscount = useMemo(() => {
    if (activeOldPrice > activePrice && activeOldPrice > 0)
      return Math.round(
        ((activeOldPrice - activePrice) / activeOldPrice) * 100,
      );
    return item?.discount || 0;
  }, [activeOldPrice, activePrice, item?.discount]);

  // ── Sync cart status ──
  React.useEffect(() => {
    const found = cartData?.some((c) => c.productId.includes(item?._id));
    setIsAdded(!!found);
  }, [cartData, item?._id]);

  // ── Sync wishlist status ──
  React.useEffect(() => {
    const found = myListData?.some((m) => m.productId.includes(item?._id));
    setIsAddedInMyList(!!found);
  }, [myListData, item?._id]);

  // ── Reset on product change ──
  React.useEffect(() => {
    setSelectedColorIndex(0);
    setSelectedStyleIndex(0);
    setShowSizeChart(false);
    setPinCode("");
    setDeliveryMessage("");
    setProductActionIndex(null);
    setSelectedTabName(null);
    setTabError(false);
  }, [item?._id]);

  // ── Handlers ──
  const handleClickActiveTab = (index: number, name: string): void => {
    if (productActionIndex === index) return;
    setIsVariantLoading(true);
    setTabError(false);
    setProductActionIndex(index);
    setSelectedTabName(name);
    setTimeout(() => setIsVariantLoading(false), 450);
  };

  const validateVariantSelection = React.useCallback((): boolean => {
    if (
      item?.size?.length ||
      item?.productWeight?.length ||
      item?.productRam?.length ||
      item?.productAge?.length
    ) {
      if (selectedTabName === null) {
        setTabError(true);
        showToast("Please select product options first", "error");
        return false;
      }
    }
    return true;
  }, [
    item?.productAge?.length,
    item?.productRam?.length,
    item?.productWeight?.length,
    item?.size?.length,
    selectedTabName,
    showToast,
  ]);

  const createProductItem = React.useCallback(
    (product: any, qty: number): any => ({
      _id: product?._id,
      productTitle: product?.name,
      image: selectedVariantImages?.[0] || product?.images?.[0],
      rating: product?.rating,
      price: activePrice,
      oldPrice: activeOldPrice,
      discount: activeDiscount,
      quantity: qty,
      subTotal: parseInt(String(activePrice * qty)),
      productId: product?._id,
      countInStock: product?.countInStock,
      brand: product?.brand,
      size: item?.size?.length > 0 ? selectedTabName : "",
      weight: item?.productWeight?.length > 0 ? selectedTabName : "",
      ram: item?.productRam?.length > 0 ? selectedTabName : "",
      age: item?.productAge?.length > 0 ? selectedTabName : "",
      color:
        item?.colorOptions?.length > 0
          ? item?.colorOptions?.[selectedColorIndex]?.name || ""
          : "",
      style:
        item?.styleOptions?.length > 0
          ? item?.styleOptions?.[selectedStyleIndex]?.name || ""
          : "",
    }),
    [
      activeDiscount,
      activeOldPrice,
      activePrice,
      item?.colorOptions,
      item?.productAge,
      item?.productRam,
      item?.productWeight,
      item?.size,
      item?.styleOptions,
      selectedColorIndex,
      selectedStyleIndex,
      selectedTabName,
      selectedVariantImages,
    ],
  );

  const addToCart = React.useCallback(async () => {
    if (!userData?._id) {
      showToast("You are not logged in. Please login first", "error");
      return;
    }
    if (!validateVariantSelection()) return;

    const productItem = createProductItem(item, quantity);
    setIsLoading(true);

    try {
      const res: any = await postData("/api/cart/add", productItem);
      if (res?.error === false) {
        showToast(res?.message || "Added to cart", "success");
        dispatch(fetchCartItems());
        setTimeout(() => {
          setIsLoading(false);
          setIsAdded(true);
        }, 500);
      } else {
        showToast(res?.message || "Failed to add", "error");
        setTimeout(() => setIsLoading(false), 500);
      }
    } catch (error: any) {
      showToast(error?.message || "Failed to add to cart", "error");
      setIsLoading(false);
    }
  }, [
    createProductItem,
    dispatch,
    item,
    quantity,
    showToast,
    userData?._id,
    validateVariantSelection,
  ]);

  const handleBuyNow = React.useCallback(async () => {
    if (!userData?._id) {
      showToast("You are not logged in. Please login first", "error");
      return;
    }
    if (!validateVariantSelection()) return;

    setIsBuyingNow(true);

    try {
      const productItem = createProductItem(item, quantity);

      // Navigate directly to checkout with Buy Now product
      // This ensures only this product is checked out, not the entire cart
      router.push({
        pathname: "/checkout",
        params: {
          buyNowItem: JSON.stringify(productItem),
          isBuyNow: "true",
        },
      } as never);
    } catch (error: any) {
      showToast(error?.message || "Failed to proceed to checkout", "error");
    } finally {
      setIsBuyingNow(false);
    }
  }, [
    createProductItem,
    item,
    quantity,
    router,
    showToast,
    userData?._id,
    validateVariantSelection,
  ]);

  const handleAddToMyList = async () => {
    if (!userData) {
      showToast("You are not logged in. Please login first", "error");
      return;
    }

    const obj = {
      productId: item?._id,
      userId: userData?._id,
      productTitle: item?.name,
      image: item?.images?.[0],
      rating: item?.rating,
      price: item?.price,
      oldPrice: item?.oldPrice,
      brand: item?.brand,
      discount: item?.discount,
    };

    setIsWishlistLoading(true);

    try {
      const res: any = await postData("/api/myList/add", obj);
      if (res?.error === false) {
        showToast(res?.message || "Added to wishlist", "success");
        setIsAddedInMyList(true);
        dispatch(fetchMyListData());
      } else {
        showToast(res?.message || "Failed to add", "error");
      }
      setIsWishlistLoading(false);
    } catch (error: any) {
      showToast(error?.message || "Failed to add to wishlist", "error");
      setIsWishlistLoading(false);
    }
  };

  const handleShareProduct = (platform: string): void => {
    const productUrl = `https://zeedaddy.in/product/${item?._id}`;
    const shareText = `Check out this product: ${item?.name || ""} ${productUrl}`;
    const urls: Record<string, string> = {
      whatsapp: `whatsapp://send?text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(item?.name || "")}`,
      x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(item?.name || "")}`,
    };
    const url = urls[platform];
    if (url) {
      Linking.openURL(url).catch(() =>
        showToast("Could not open app", "error"),
      );
    }
  };

  const checkPinCode = async () => {
    if (!/^\d{6}$/.test(pinCode)) {
      setDeliveryMessage("Please enter a valid 6-digit pincode.");
      return;
    }

    setIsCheckingPinCode(true);
    try {
      await postData("/api/pincode/check", {
        pincode: pinCode,
        productId: item?._id,
      });
      setDeliveryMessage(
        "Delivery available. Usually ships within 24 hours with easy returns.",
      );
    } catch {
      setDeliveryMessage(
        "Delivery available. Usually ships within 24 hours with easy returns.",
      );
    }
    setIsCheckingPinCode(false);
  };

  const handleColorSelect = (index: number): void => {
    if (index === selectedColorIndex) return;
    setSelectedColorIndex(index);
    requestAnimationFrame(() => {
      onColorSelectScrollToTop?.();
    });
  };

  // ── Delivery dates ──
  const deliveryFrom = new Date(Date.now() + 2 * 86400000).toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
    },
  );
  const deliveryTo = new Date(Date.now() + 4 * 86400000).toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
    },
  );

  const variantBtnStyle = (active: boolean, error: boolean): any => ({
    ...S.variantBtn,
    borderColor: active ? "#111" : error ? "#ef4444" : "rgba(0,0,0,0.13)",
    borderWidth: active ? 2 : 1.5,
    backgroundColor: active ? "#111" : "#fff",
  });

  const variantBtnTextStyle = (active: boolean, error: boolean): any => ({
    ...S.variantBtnText,
    color: active ? "#fff" : error ? "#ef4444" : "rgba(0,0,0,0.7)",
  });

  const isOutOfStock = item?.countInStock <= 0;

  React.useEffect(() => {
    onFooterActionStateChange?.({
      isAdded,
      isLoading,
      isBuyingNow,
      isOutOfStock,
      onAddToCart: addToCart,
      onBuyNow: handleBuyNow,
    });
  }, [
    addToCart,
    handleBuyNow,
    isAdded,
    isBuyingNow,
    isLoading,
    isOutOfStock,
    onFooterActionStateChange,
  ]);

  return (
    <View style={S.wrap}>
      {/* ── 1. TITLE + META ── */}
      <View style={S.section}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {item?.brand && (
            <View style={S.brandBadge}>
              <Text style={S.brandText}>{item?.brand}</Text>
            </View>
          )}
          {item?.countInStock > 0 ? (
            <View style={S.inStockBadge}>
              <Text style={S.inStockText}>● In Stock</Text>
            </View>
          ) : (
            <View style={S.outStockBadge}>
              <Text style={S.outStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <Text style={S.productName}>{item?.name}</Text>

        {/* Rating Section - Using Rating Component */}
        <View style={{ marginTop: 10, marginBottom: 4 }}>
          <Rating
            value={Number(item?.rating) || 0}
            size={18}
            showScore={true}
            showCount={true}
            reviewCount={reviewsCount}
            variant="detailed"
            onPress={gotoReviews}
          />
        </View>

        {/* Meta Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
            SKU:{" "}
            <Text style={{ color: "#111", fontWeight: "700" }}>
              {item?._id?.slice(-8)?.toUpperCase()}
            </Text>
          </Text>
        </View>
      </View>

      {/* ── 2. PRICE BLOCK ── */}
      <View style={S.priceBlock}>
        <Text style={S.price}>₹{activePrice?.toLocaleString("en-IN")}</Text>
        {activeOldPrice > activePrice && (
          <Text style={S.oldPrice}>
            ₹{activeOldPrice?.toLocaleString("en-IN")}
          </Text>
        )}
        {activeDiscount > 0 && (
          <View style={S.discountBadge}>
            <Text style={S.discountText}>{activeDiscount}% OFF</Text>
          </View>
        )}
        <Text style={S.unitsLeft}>{item?.countInStock} units left</Text>
      </View>

      {/* ── 3. DESCRIPTION ── */}
      <View style={S.section}>
        <Text style={S.description}>{item?.description}</Text>
      </View>

      <Divider />

      {/* ── 4. VARIANTS ── */}
      <View style={[S.section, { gap: 18 }]}>
        {item?.productRam?.length > 0 && (
          <View>
            <Text style={S.label}>RAM</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {item.productRam.map((ram: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={variantBtnStyle(
                    productActionIndex === index,
                    tabError,
                  )}
                  onPress={() => handleClickActiveTab(index, ram)}
                  disabled={isVariantLoading || isOutOfStock}
                >
                  <Text
                    style={variantBtnTextStyle(
                      productActionIndex === index,
                      tabError,
                    )}
                  >
                    {ram}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {item?.size?.length > 0 && (
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={[S.label, { marginBottom: 0 }]}>Size</Text>
              <TouchableOpacity onPress={() => setShowSizeChart((p) => !p)} disabled={isOutOfStock}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#2563eb",
                    textDecorationLine: "underline",
                    opacity: isOutOfStock ? 0.5 : 1,
                  }}
                >
                  {showSizeChart ? "Hide" : "View"} Size Chart
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {item.size.map((size: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={variantBtnStyle(
                    productActionIndex === index,
                    tabError,
                  )}
                  onPress={() => handleClickActiveTab(index, size)}
                  disabled={isVariantLoading || isOutOfStock}
                >
                  <Text
                    style={variantBtnTextStyle(
                      productActionIndex === index,
                      tabError,
                    )}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {tabError && (
              <Text style={S.errorText}>⚠ Please select a size first</Text>
            )}
          </View>
        )}

        {item?.productWeight?.length > 0 && (
          <View>
            <Text style={S.label}>Weight / Age</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {item.productWeight.map((w: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={variantBtnStyle(
                    productActionIndex === index,
                    tabError,
                  )}
                  onPress={() => handleClickActiveTab(index, w)}
                  disabled={isVariantLoading || isOutOfStock}
                >
                  <Text
                    style={variantBtnTextStyle(
                      productActionIndex === index,
                      tabError,
                    )}
                  >
                    {w}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {item?.colorOptions?.length > 0 && (
          <View>
            <Text style={S.label}>Product Options</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {item.colorOptions.map((colorItem: any, index: number) => {
                const optionImage = colorItem?.images?.[0] || item?.images?.[0];
                const isActive = selectedColorIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleColorSelect(index)}
                    disabled={isOutOfStock}
                    style={[
                      S.colorCard,
                      {
                        borderColor: isActive ? "#111" : "rgba(0,0,0,0.11)",
                        borderWidth: isActive ? 2 : 1.5,
                        backgroundColor: isActive ? "#fafafa" : "#fff",
                        opacity: isOutOfStock ? 0.5 : 1,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: optionImage }}
                      style={S.colorImg}
                      resizeMode="cover"
                    />
                    {isActive && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#111",
                          fontWeight: "700",
                          marginLeft: 2,
                        }}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {isVariantLoading && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator size="small" color="rgba(0,0,0,0.45)" />
            <Text style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
              Updating option…
            </Text>
          </View>
        )}
      </View>

      {/* ── QTY + CART + BUY NOW ── */}
      <View style={[S.section, { gap: 10 }]}>
        {!isOutOfStock && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={[S.label, { marginBottom: 0 }]}>Qty</Text>
            <QtyBox value={quantity} onChange={setQuantity} />
          </View>
        )}

        {isOutOfStock ? (
          <View
            style={[
              S.btnCart,
              {
                backgroundColor: "#e5e5e5",
                borderColor: "#cccccc",
                opacity: 1,
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>❌</Text>
            <Text style={[S.btnCartText, { color: "#999" }]}>
              Out of Stock
            </Text>
          </View>
        ) : showInlineFooterActions ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[S.btnCart, { backgroundColor: isAdded ? "#111" : "#fff" }]}
              onPress={addToCart}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isAdded ? "#fff" : "#111"}
                />
              ) : (
                <>
                  <Text style={{ fontSize: 16 }}>{isAdded ? "✓" : "🛒"}</Text>
                  <Text
                    style={[S.btnCartText, { color: isAdded ? "#fff" : "#111" }]}
                  >
                    {isAdded ? "Added to Cart" : "Add to Cart"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={S.btnBuy}
              onPress={handleBuyNow}
              disabled={isBuyingNow}
            >
              {isBuyingNow ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 14 }}>⚡</Text>
                  <Text style={S.btnBuyText}>Buy Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── SHARE ── */}
        <View style={{ marginTop: 4 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "rgba(0,0,0,0.38)",
                fontWeight: "700",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              🔗 Share this product
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              {
                key: "whatsapp",
                label: "WhatsApp",
                bg: "#edfff2",
                border: "#bbf7d0",
                color: "#16a34a",
              },
              {
                key: "facebook",
                label: "Facebook",
                bg: "#eff6ff",
                border: "#bfdbfe",
                color: "#1d4ed8",
              },
              {
                key: "telegram",
                label: "Telegram",
                bg: "#f0f9ff",
                border: "#bae6fd",
                color: "#0369a1",
              },
              {
                key: "x",
                label: "X / Twitter",
                bg: "#f9fafb",
                border: "#e5e7eb",
                color: "#111",
              },
            ].map(({ key, label, bg, border, color }) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleShareProduct(key)}
                style={[
                  S.shareBtn,
                  { backgroundColor: bg, borderColor: border },
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Divider />

      {/* ── 5. DELIVERY INFO - ONLY WHEN IN STOCK ── */}
      {!isOutOfStock && (
        <>
          <View style={S.deliveryCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 17 }}>🚚</Text>
              <Text style={S.deliveryTitle}>Free Delivery · 2–3 Business Days</Text>
            </View>
            <Text style={S.deliverySub}>
              Order today, get it between{" "}
              <Text style={{ color: "#111", fontWeight: "700" }}>
                {deliveryFrom}
              </Text>
              {" – "}
              <Text style={{ color: "#111", fontWeight: "700" }}>{deliveryTo}</Text>
            </Text>
          </View>

          {/* ── 6. PINCODE CHECK ── */}
          <View style={S.pinCard}>
            <Text style={S.pinTitle}>📍 Check Delivery Availability</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={S.pinInput}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor="rgba(0,0,0,0.4)"
                keyboardType="numeric"
                maxLength={6}
                value={pinCode}
                onChangeText={(t) => setPinCode(t.replace(/\D/g, "").slice(0, 6))}
              />
              <TouchableOpacity
                style={S.pinBtn}
                onPress={checkPinCode}
                disabled={isCheckingPinCode}
              >
                {isCheckingPinCode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={S.pinBtnText}>Check</Text>
                )}
              </TouchableOpacity>
            </View>
            {deliveryMessage ? (
              <Text style={S.pinSuccess}>✓ {deliveryMessage}</Text>
            ) : null}
          </View>
        </>
      )}

      {/* ── 7. TRUST BADGES ── */}
      <View style={S.trustRow}>
        {[
          { icon: "🔄", title: "7-Day Exchange", sub: "Easy returns" },
          { icon: "🔒", title: "Secure Payment", sub: "100% protected" },
          { icon: "✅", title: "Expert Verified", sub: "Quality assured" },
        ].map(({ icon, title, sub }) => (
          <View key={title} style={S.trustBadge}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
            <Text style={S.trustTitle}>{title}</Text>
            <Text style={S.trustSub}>{sub}</Text>
          </View>
        ))}
      </View>

      <Divider />

      {/* ── 8. WISHLIST + COMPARE ── */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          style={[
            S.btnWish,
            {
              backgroundColor: isAddedInMyList ? "#fff0f3" : "#fafafa",
              borderColor: isAddedInMyList ? "#fecdd3" : "rgba(0,0,0,0.1)",
            },
          ]}
          onPress={handleAddToMyList}
          disabled={isWishlistLoading}
        >
          {isWishlistLoading ? (
            <ActivityIndicator size="small" color="#e11d48" />
          ) : (
            <>
              <Text style={{ fontSize: 16 }}>
                {isAddedInMyList ? "❤️" : "🤍"}
              </Text>
              <Text
                style={[
                  S.btnWishText,
                  { color: isAddedInMyList ? "#e11d48" : "rgba(0,0,0,0.6)" },
                ]}
              >
                {isAddedInMyList ? "Wishlisted" : "Wishlist"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={S.btnCompare}>
          <Text style={{ fontSize: 16 }}>⚖️</Text>
          <Text style={S.btnCompareText}>Compare</Text>
        </TouchableOpacity>
      </View>

      <Divider />
    </View>
  );
};

/* ── Styles ── */
const S = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  section: { marginBottom: 4 },
  brandBadge: {
    backgroundColor: "#111",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  brandText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#fff",
  },
  inStockBadge: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inStockText: { fontSize: 10, fontWeight: "600", color: "#16a34a" },
  outStockBadge: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  outStockText: { fontSize: 10, fontWeight: "600", color: "#dc2626" },
  productName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0a0a0a",
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  reviewLink: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  priceBlock: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    borderRadius: 14,
    padding: 16,
    marginVertical: 14,
  },
  price: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0a0a0a",
    letterSpacing: -0.5,
  },
  oldPrice: {
    fontSize: 17,
    color: "rgba(0,0,0,0.3)",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#16a34a",
    borderRadius: 6,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  discountText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  unitsLeft: {
    fontSize: 12,
    color: "rgba(0,0,0,0.38)",
    fontWeight: "500",
    marginLeft: "auto",
  },
  description: { fontSize: 14, lineHeight: 24, color: "rgba(0,0,0,0.58)" },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(0,0,0,0.35)",
    marginBottom: 10,
  },
  variantBtn: {
    height: 38,
    minWidth: 52,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  variantBtnText: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 8 },
  colorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    paddingRight: 12,
    borderRadius: 12,
  },
  colorImg: { width: 38, height: 38, borderRadius: 8 },
  btnCart: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#111",
    borderRadius: 12,
  },
  btnCartText: { fontSize: 14, fontWeight: "700" },
  btnBuy: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff6b00",
    borderRadius: 12,
  },
  btnBuyText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
  },
  deliveryCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  deliveryTitle: { fontSize: 13, fontWeight: "700", color: "#15803d" },
  deliverySub: { fontSize: 12, color: "rgba(0,0,0,0.5)", lineHeight: 18 },
  pinCard: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  pinTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },
  pinInput: {
    flex: 1,
    height: 42,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.11)",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  pinBtn: {
    height: 42,
    paddingHorizontal: 18,
    backgroundColor: "#111",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  pinSuccess: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
    marginTop: 8,
  },
  trustRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  trustBadge: {
    flex: 1,
    alignItems: "center",
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    gap: 4,
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    lineHeight: 14,
  },
  trustSub: { fontSize: 10, color: "rgba(0,0,0,0.38)", textAlign: "center" },
  btnWish: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  btnWishText: { fontSize: 13, fontWeight: "600" },
  btnCompare: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  btnCompareText: { fontSize: 13, fontWeight: "600", color: "rgba(0,0,0,0.6)" },
});
