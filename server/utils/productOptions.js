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

const clean = (value) => String(value ?? "").trim();

const splitValues = (value) =>
  String(value || "")
    .split(/[,|/]/)
    .map((v) => v.trim())
    .filter(Boolean);

const unique = (values = []) => [...new Set(values.map(clean).filter(Boolean))];

export const normalizeProductOptions = (options = []) =>
  (Array.isArray(options) ? options : [])
    .map((opt) => {
      const key = clean(opt?.name || opt?.label);
      const values = unique(Array.isArray(opt?.values) ? opt.values : splitValues(opt?.values));
      if (!key || values.length === 0) return null;
      return {
        name: clean(opt?.name) || key,
        label: clean(opt?.label) || key,
        values,
      };
    })
    .filter(Boolean);

export const buildProductOptionsFromSpecs = (specifications = [], explicitOptions = []) => {
  const rows = normalizeSpecifications(specifications);
  const productOptions = normalizeProductOptions(explicitOptions);
  const optionKeys = new Set(productOptions.map((opt) => clean(opt.name || opt.label).toLowerCase()));
  const displaySpecs = [];

  for (const row of rows) {
    const keyLower = row.key.toLowerCase();
    const values = splitValues(row.value);
    const isOptionKey = OPTION_KEY_HINTS.some((h) => keyLower.includes(h));
    if ((isOptionKey || values.length > 1) && !optionKeys.has(keyLower)) {
      productOptions.push({
        label: row.key,
        name: row.key,
        values: values.length ? values : [row.value],
      });
      optionKeys.add(keyLower);
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
    return clean(selected?.[key]);
  });
};

