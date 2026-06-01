const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Default fallbacks for GoMarket
export const GO_MARKET_FALLBACK =
  "https://placehold.co/800x420/f3f4f6/111827?text=Go+Market";
export const GO_MARKET_LOGO_FALLBACK =
  "https://placehold.co/120x120/f1f5f9/64748b?text=Logo";

// Shop-specific fallbacks
export const GROCERY_BANNER_FALLBACK =
  "https://placehold.co/800x160/e8f5e9/2e7d32?text=Grocery+Shop";
export const RESTAURANT_BANNER_FALLBACK =
  "https://placehold.co/800x160/fff3e0/e65100?text=Restaurant";
export const SHOP_LOGO_FALLBACK =
  "https://placehold.co/120x120/f5f5f5/9e9e9e?text=Store+Logo";

export const resolveMediaUrl = (src) => {
  const raw = String(src || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (!API_BASE) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return raw;
};

export const img = (src, fallback = GO_MARKET_FALLBACK) =>
  resolveMediaUrl(src) || fallback;
