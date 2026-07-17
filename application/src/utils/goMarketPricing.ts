export const isGoMarketItem = (item: any): boolean => {
  if (!item) return false;

  const source = String(item?.source || item?.goMarketSource || "").toLowerCase();
  const brand = String(item?.brand || "").toLowerCase();
  const sellerProfile = item?.sellerId?.storeProfile || item?.sellerProfile || {};
  const hasGoMarketSeller = Boolean(sellerProfile?.marketId || sellerProfile?.goMarketOwnerId);
  const identityFields = [
    item?.goMarketKind,
    item?.shopId,
    item?.restaurantId,
    item?.marketId,
    sellerProfile?.marketId,
    sellerProfile?.goMarketOwnerId,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return (
    source.includes("gomarket") ||
    source.includes("go-market") ||
    brand.includes("gomarket") ||
    brand.includes("go-market") ||
    hasGoMarketSeller ||
    identityFields.some(
      (value) =>
        value.includes("gomarket") ||
        value.includes("go_market") ||
        value.includes("market") ||
        value.includes("restaurant") ||
        value.includes("shop"),
    )
  );
};