const roundCurrency = (value) => Number((value || 0).toFixed(2));

export const isGoMarketOrder = (products = []) => {
  if (!Array.isArray(products)) return false;
  return products.some((product) => {
    const source = String(product?.source || product?.goMarketSource || "").toLowerCase();
    const brand = String(product?.brand || "").toLowerCase();
    const sellerProfile = product?.sellerId?.storeProfile || product?.sellerProfile || {};
    const sellerMeta = `${sellerProfile?.marketId || ""} ${sellerProfile?.goMarketOwnerId || ""}`.toLowerCase();
    const hasGoMarketSeller = Boolean(sellerProfile?.marketId || sellerProfile?.goMarketOwnerId);
    const identityFields = [
      product?.shopId,
      product?.restaurantId,
      product?.marketId,
      product?.sellerId,
      product?.goMarketKind,
      sellerMeta,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return (
      source.includes("gomarket") ||
      brand.includes("gomarket") ||
      hasGoMarketSeller ||
      identityFields.some((value) => value.includes("gomarket") || value.includes("market") || value.includes("restaurant") || value.includes("shop"))
    );
  });
};

export const calculateGoMarketFees = ({ settings = {}, subtotal = 0, distanceKm = 0, isFirstOrder = false } = {}) => {
  const shippingFee = Number(settings.goMarketShippingFee || 0);
  const perKmFee = Number(settings.goMarketDeliveryFeePerKm || 0);
  const threshold = Number(settings.freeShippingAbove || 0);
  const freeByRule = threshold > 0 && Number(subtotal || 0) >= threshold;

  if (isFirstOrder || freeByRule) {
    return {
      shippingFee: 0,
      deliveryFee: 0,
      total: roundCurrency(Number(subtotal || 0)),
    };
  }

  const deliveryFee = roundCurrency(Math.max(0, Number(distanceKm || 0)) * perKmFee);

  return {
    shippingFee: roundCurrency(shippingFee),
    deliveryFee,
    total: roundCurrency(Number(subtotal || 0) + shippingFee + deliveryFee),
  };
};
