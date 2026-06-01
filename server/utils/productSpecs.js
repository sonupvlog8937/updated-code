export const normalizeSpecifications = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      key: String(row?.key || "").trim(),
      value: String(row?.value || "").trim(),
    }))
    .filter((row) => row.key && row.value);

export const mergeSpecifications = (sellerSpecs, autoSpecs = []) => {
  const merged = normalizeSpecifications(sellerSpecs);
  const keys = new Set(merged.map((s) => s.key.toLowerCase()));
  for (const row of autoSpecs) {
    if (!row?.key || !row?.value) continue;
    const key = String(row.key).trim();
    const value = String(row.value).trim();
    if (!key || !value) continue;
    if (keys.has(key.toLowerCase())) continue;
    merged.push({ key, value });
    keys.add(key.toLowerCase());
  }
  return merged;
};

export const displayProductTitle = (entity, fallbackName = "") =>
  String(entity?.title || "").trim() || String(fallbackName || entity?.name || entity?.itemName || "").trim();
