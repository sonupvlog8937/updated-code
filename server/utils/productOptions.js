import { normalizeSpecifications } from "./productSpecs.js";

const OPTION_KEY_HINTS = ["weight", "size", "ram", "age", "color", "colour", "volume", "capacity", "storage", "flavour", "flavor", "pack"];
const clean = (value) => String(value ?? "").trim();

const toMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const splitValues = (value) => String(value || "").split(/[,|/]/).map((v) => v.trim()).filter(Boolean);
const normalizeValue = (value, index = 0) => {
  if (value && typeof value === "object") {
    const label = clean(value.label || value.value || value.name);
    if (!label) return null;
    return { label, value: clean(value.value) || label, price: toMoney(value.price), oldPrice: toMoney(value.oldPrice), isDefault: Boolean(value.isDefault) || index === 0 };
  }
  const label = clean(value);
  return label ? { label, value: label, price: 0, oldPrice: 0, isDefault: index === 0 } : null;
};
const uniqueByLabel = (values = []) => {
  const seen = new Set();
  return values.filter(Boolean).filter((v) => {
    const key = clean(v.label || v.value).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizeProductOptions = (options = []) =>
  (Array.isArray(options) ? options : [])
    .map((opt) => {
      const key = clean(opt?.name || opt?.label);
      const rawValues = Array.isArray(opt?.values) ? opt.values : splitValues(opt?.values);
      const values = uniqueByLabel(rawValues.map(normalizeValue));
      if (!key || values.length === 0) return null;
      return { name: clean(opt?.name) || key, label: clean(opt?.label) || key, values };
    })
    .filter(Boolean);

export const buildProductOptionsFromSpecs = (specifications = [], explicitOptions = []) => {
  const rows = normalizeSpecifications(specifications);
  const productOptions = normalizeProductOptions(explicitOptions);
  
  // Only use explicitly defined product options from seller
  // Do NOT auto-generate options from specifications
  const displaySpecs = rows;

  return { productOptions, displaySpecs };
};

export const allOptionsSelected = (productOptions, selected) => {
  if (!productOptions?.length) return true;
  return productOptions.every((opt) => clean(selected?.[opt.name || opt.label]));
};

