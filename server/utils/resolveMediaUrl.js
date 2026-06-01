const trim = (v) => String(v || "").trim();

/**
 * Turn stored image paths into browser-loadable URLs.
 * Handles Cloudinary URLs, absolute http(s), and /uploads relative paths.
 */
export const resolveMediaUrl = (src, baseUrl = "") => {
  const raw = trim(src);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  const base = trim(baseUrl || process.env.API_PUBLIC_URL || process.env.SERVER_URL || "");
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return base ? `${base.replace(/\/$/, "")}${raw}` : raw;
  if (raw.startsWith("uploads/")) return base ? `${base.replace(/\/$/, "")}/${raw}` : `/${raw}`;
  return raw;
};

export const resolveMediaFields = (obj, fields, baseUrl) => {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  for (const field of fields) {
    if (out[field]) out[field] = resolveMediaUrl(out[field], baseUrl);
  }
  return out;
};

export const apiBaseFromRequest = (req) => {
  const env = trim(process.env.API_PUBLIC_URL || process.env.SERVER_URL);
  if (env) return env.replace(/\/$/, "");
  const proto = req?.headers?.["x-forwarded-proto"] || req?.protocol || "http";
  const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
  return host ? `${proto}://${host}`.replace(/\/$/, "") : "";
};
