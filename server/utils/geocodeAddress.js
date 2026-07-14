const cache = new Map();

/**
 * Best-effort geocoding for shop addresses (used when coords still match market center).
 * Results are cached in memory for the process lifetime.
 */
export const geocodeAddress = async (address) => {
  const query = String(address || "").trim();
  if (!query || query.length < 5) return null;
  if (cache.has(query)) return cache.get(query);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ZeeDaddy-GoMarket/1.0 (support@zeedaddy.com)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const rows = await res.json();
    const hit = rows?.[0];
    if (!hit) {
      cache.set(query, null);
      return null;
    }

    const result = {
      lat: Number(hit.lat),
      lng: Number(hit.lon),
    };
    cache.set(query, result);
    return result;
  } catch {
    cache.set(query, null);
    return null;
  }
};
