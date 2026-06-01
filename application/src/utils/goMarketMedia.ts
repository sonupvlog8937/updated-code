import { API_URL } from "./api";

const API_BASE = (API_URL || "").replace(/\/$/, "");

export const GO_MARKET_FALLBACK =
  "https://placehold.co/800x420/FFF3ED/FF6B2C?text=Shop";
export const GO_MARKET_LOGO_FALLBACK =
  "https://placehold.co/120x120/f1f5f9/64748b?text=Logo";

export const resolveMediaUrl = (src?: string | null): string => {
  const raw = String(src || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (!API_BASE) return raw;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
  return raw;
};

export const gmImg = (src?: string | null, fallback = GO_MARKET_FALLBACK) =>
  resolveMediaUrl(src) || fallback;
