const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const isValidCoord = (value) => {
  const n = toNumber(value);
  return n != null && n !== 0;
};

export const isValidCoordPair = (lat, lng) => {
  const la = toNumber(lat);
  const ln = toNumber(lng);
  if (la == null || ln == null || la === 0 || ln === 0) return false;
  return Math.abs(la) <= 90 && Math.abs(ln) <= 180;
};

/** Detect lat/lng stored in the wrong field (common in India: lat ~6–37, lng ~68–97). */
export const fixSwappedIndianCoords = (lat, lng) => {
  const la = toNumber(lat);
  const ln = toNumber(lng);
  if (la == null || ln == null) return { lat: la, lng: ln };

  const latLooksLikeLng = la >= 68 && la <= 97;
  const lngLooksLikeLat = ln >= 6 && ln <= 37;
  if (latLooksLikeLng && lngLooksLikeLat) {
    return { lat: ln, lng: la };
  }
  return { lat: la, lng: ln };
};

/** Shop coordinates only — never fall back to market location. */
export const resolveShopCoords = (shopLat, shopLng) => {
  const shop = fixSwappedIndianCoords(shopLat, shopLng);
  if (isValidCoordPair(shop.lat, shop.lng)) {
    return { lat: shop.lat, lng: shop.lng, source: "shop" };
  }
  return { lat: null, lng: null, source: null };
};

/** Use shop coords only when both are valid; never mix shop lat with market lng. */
export const resolveCoordPair = (shopLat, shopLng, marketLat, marketLng) => {
  const shop = fixSwappedIndianCoords(shopLat, shopLng);
  if (isValidCoordPair(shop.lat, shop.lng)) {
    return { lat: shop.lat, lng: shop.lng, source: "shop" };
  }

  const market = fixSwappedIndianCoords(marketLat, marketLng);
  if (isValidCoordPair(market.lat, market.lng)) {
    return { lat: market.lat, lng: market.lng, source: "market" };
  }

  return { lat: null, lng: null, source: null };
};

export const coordsNearlyEqual = (lat1, lng1, lat2, lng2, epsilon = 0.0001) => {
  const a = fixSwappedIndianCoords(lat1, lng1);
  const b = fixSwappedIndianCoords(lat2, lng2);
  if (!isValidCoordPair(a.lat, a.lng) || !isValidCoordPair(b.lat, b.lng)) return false;
  return Math.abs(a.lat - b.lat) <= epsilon && Math.abs(a.lng - b.lng) <= epsilon;
};

export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const a = fixSwappedIndianCoords(lat1, lng1);
  const b = fixSwappedIndianCoords(lat2, lng2);
  if (!isValidCoordPair(a.lat, a.lng) || !isValidCoordPair(b.lat, b.lng)) return null;

  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLng = Math.sin(dLng / 2);
  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinHalfDLng * sinHalfDLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const formatDistanceKm = (distanceKm) => {
  if (distanceKm == null) return null;
  if (distanceKm > 5) return null;
  if (distanceKm < 0.05) return "Nearby";
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`;
};

export const estimateDeliveryMinutes = (distanceKm, deliveryMinutes = 10) => {
  if (distanceKm == null) return null;
  if (distanceKm > 5) return null;
  const base = deliveryMinutes || 10;
  if (distanceKm < 0.05) return base;
  // travel time (~6 min/km) + base prep/delivery minutes (default 10)
  const travelMinutes = Math.round(distanceKm * 6);
  return travelMinutes + base;
};
