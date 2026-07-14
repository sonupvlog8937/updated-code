const toNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const isValidCoordPair = (lat: unknown, lng: unknown): boolean => {
  const la = toNumber(lat);
  const ln = toNumber(lng);
  if (la == null || ln == null || la === 0 || ln === 0) return false;
  return Math.abs(la) <= 90 && Math.abs(ln) <= 180;
};

export const fixSwappedIndianCoords = (lat: unknown, lng: unknown) => {
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

export const resolveShopCoords = (shopLat: unknown, shopLng: unknown) => {
  const shop = fixSwappedIndianCoords(shopLat, shopLng);
  if (isValidCoordPair(shop.lat, shop.lng)) {
    return { lat: shop.lat as number, lng: shop.lng as number };
  }
  return { lat: null, lng: null };
};

export const resolveCoordPair = (
  shopLat: unknown,
  shopLng: unknown,
  marketLat: unknown,
  marketLng: unknown,
) => {
  const shop = fixSwappedIndianCoords(shopLat, shopLng);
  if (isValidCoordPair(shop.lat, shop.lng)) {
    return { lat: shop.lat as number, lng: shop.lng as number };
  }

  const market = fixSwappedIndianCoords(marketLat, marketLng);
  if (isValidCoordPair(market.lat, market.lng)) {
    return { lat: market.lat as number, lng: market.lng as number };
  }

  return { lat: null, lng: null };
};

export const haversineKm = (
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined,
): number | null => {
  const a = fixSwappedIndianCoords(lat1, lng1);
  const b = fixSwappedIndianCoords(lat2, lng2);
  if (!isValidCoordPair(a.lat, a.lng) || !isValidCoordPair(b.lat, b.lng)) return null;

  const R = 6371;
  const dLat = ((b.lat! - a.lat!) * Math.PI) / 180;
  const dLng = ((b.lng! - a.lng!) * Math.PI) / 180;
  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLng = Math.sin(dLng / 2);
  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos((a.lat! * Math.PI) / 180) *
      Math.cos((b.lat! * Math.PI) / 180) *
      sinHalfDLng * sinHalfDLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const formatDistanceKm = (distanceKm: number | null): string | null => {
  if (distanceKm == null) return null;
  if (distanceKm < 0.05) return "Nearby";
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`;
};

export const estimateDeliveryMinutes = (distanceKm: number | null, deliveryMinutes = 10): number | null => {
  if (distanceKm == null) return null;
  const base = deliveryMinutes ?? 10;
  if (distanceKm < 0.05) return base;
  // travel time (~6 min/km) + base prep/delivery minutes
  const travelMinutes = Math.round(distanceKm * 6);
  return travelMinutes + base;
};

export const getOutletBaseMinutes = (outletType?: string) =>
  outletType === "restaurant" ? 10 : 0;

export const getOutletDistanceEta = ({
  userLat,
  userLng,
  shopLat,
  shopLng,
  marketLat,
  marketLng,
  baseMinutes = 10,
}: {
  userLat?: number | null;
  userLng?: number | null;
  shopLat?: unknown;
  shopLng?: unknown;
  marketLat?: unknown;
  marketLng?: unknown;
  baseMinutes?: number;
} = {}) => {
  if (!isValidCoordPair(userLat, userLng)) {
    return { distanceDisplay: null, estimatedTime: null };
  }

  const shopCoords = resolveCoordPair(shopLat, shopLng, marketLat, marketLng);
  const distKm = haversineKm(userLat, userLng, shopCoords.lat, shopCoords.lng);
  if (distKm == null) return { distanceDisplay: null, estimatedTime: null };

  const distanceDisplay = formatDistanceKm(distKm);
  const estimatedTime = estimateDeliveryMinutes(distKm, baseMinutes);

  if (!distanceDisplay) return { distanceDisplay: null, estimatedTime: null };
  return { distanceDisplay, estimatedTime };
};
