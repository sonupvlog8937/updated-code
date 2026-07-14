const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const isValidCoordPair = (lat, lng) => {
  const la = toNumber(lat);
  const ln = toNumber(lng);
  if (la == null || ln == null || la === 0 || ln === 0) return false;
  return Math.abs(la) <= 90 && Math.abs(ln) <= 180;
};

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

export const resolveShopCoords = (shopLat, shopLng) => {
  const shop = fixSwappedIndianCoords(shopLat, shopLng);
  if (isValidCoordPair(shop.lat, shop.lng)) {
    return { lat: shop.lat, lng: shop.lng };
  }
  return { lat: null, lng: null };
};

export const resolveCoordPair = (shopLat, shopLng, marketLat, marketLng) => {
  const shop = fixSwappedIndianCoords(shopLat, shopLng);
  if (isValidCoordPair(shop.lat, shop.lng)) {
    return { lat: shop.lat, lng: shop.lng };
  }

  const market = fixSwappedIndianCoords(marketLat, marketLng);
  if (isValidCoordPair(market.lat, market.lng)) {
    return { lat: market.lat, lng: market.lng };
  }

  return { lat: null, lng: null };
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
  // > 5 km: too far to be a nearby local market shop — hide it
  if (distanceKm > 5) return null;
  if (distanceKm < 0.05) return "Nearby";
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`;
};

export const estimateDeliveryMinutes = (distanceKm, deliveryMinutes = 10) => {
  if (distanceKm == null) return null;
  if (distanceKm > 5) return null;
  const base = deliveryMinutes ?? 10;
  if (distanceKm < 0.05) return base;
  // travel time (~6 min/km) + base prep/delivery minutes
  const travelMinutes = Math.round(distanceKm * 6);
  return travelMinutes + base;
};

export const getOutletBaseMinutes = (outletType) =>
  outletType === "restaurant" ? 10 : 0;

export const getOutletDistanceEta = ({
  userLat,
  userLng,
  shopLat,
  shopLng,
  marketLat,
  marketLng,
  baseMinutes = 10,
} = {}) => {
  if (!isValidCoordPair(userLat, userLng)) {
    return { distanceDisplay: null, estimatedTime: null };
  }

  // Prefer shop coords; market coords only when shop location is missing
  const shopCoords = resolveCoordPair(shopLat, shopLng, marketLat, marketLng);
  const distKm = haversineKm(userLat, userLng, shopCoords.lat, shopCoords.lng);
  if (distKm == null) return { distanceDisplay: null, estimatedTime: null };

  const distanceDisplay = formatDistanceKm(distKm);
  const estimatedTime = estimateDeliveryMinutes(distKm, baseMinutes);

  if (!distanceDisplay) return { distanceDisplay: null, estimatedTime: null };
  return { distanceDisplay, estimatedTime };
};
