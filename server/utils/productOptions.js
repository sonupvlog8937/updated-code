import { normalizeSpecifications } from "./productSpecs.js";

const OPTION_KEY_HINTS = [
  "weight",
  "size",
  "ram",
  "age",
  "color",
  "colour",
  "unit",
  "volume",
  "capacity",
  "storage",
  "flavour",
  "flavor",
  "pack",
];

const splitValues = (value) =>
  String(value || "")
    .split(/[,|/]/)
    .map((v) => v.trim())
    .filter(Boolean);

export const buildProductOptionsFromSpecs = (specifications = []) => {
  const rows = normalizeSpecifications(specifications);
  const productOptions = [];
  const displaySpecs = [];

  for (const row of rows) {
    const keyLower = row.key.toLowerCase();
    const values = splitValues(row.value);
    const isOptionKey = OPTION_KEY_HINTS.some((h) => keyLower.includes(h));
    if (isOptionKey || values.length > 1) {
      productOptions.push({
        label: row.key,
        name: row.key,
        values: values.length ? values : [row.value],
      });
    } else {
      displaySpecs.push(row);
    }
  }

  return { productOptions, displaySpecs };
};

export const allOptionsSelected = (productOptions, selected) => {
  if (!productOptions?.length) return true;
  return productOptions.every((opt) => {
    const key = opt.name || opt.label;
    return trimSelected(selected?.[key]);
  });
};

const trimSelected = (v) => String(v || "").trim();
