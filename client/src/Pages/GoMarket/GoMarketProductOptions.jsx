import React from "react";
const toCleanString = (value) => String(value ?? "").trim();

const normalizeValue = (value, index = 0) => {
  if (value && typeof value === "object") {
    const label = toCleanString(value.label || value.value || value.name);
    if (!label) return null;
    return { ...value, label, value: toCleanString(value.value) || label, price: Math.max(0, Number(value.price) || 0), oldPrice: Math.max(0, Number(value.oldPrice) || 0), isDefault: Boolean(value.isDefault) || index === 0 };
  }
  const label = toCleanString(value);
  return label ? { label, value: label, price: 0, oldPrice: 0, isDefault: index === 0 } : null;
};
const uniqueValues = (values = []) => {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).map(normalizeValue).filter(Boolean).filter((v) => {
    const key = v.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
export const normalizeProductOptions = (options = []) => (Array.isArray(options) ? options : []).map((opt) => {
  const key = toCleanString(opt?.name || opt?.label);
  const values = uniqueValues(opt?.values);
  if (!key || values.length === 0) return null;
  return { ...opt, name: toCleanString(opt?.name) || key, label: toCleanString(opt?.label) || key, values };
}).filter(Boolean);
const interactiveOptions = (options = []) => normalizeProductOptions(options).filter((opt) => (opt.values || []).length > 0);
export const selectedOptionPrice = (options, selected) => interactiveOptions(options).reduce((price, opt) => {
  const key = opt.name || opt.label;
  const match = (opt.values || []).find((v) => v.label === selected?.[key] || v.value === selected?.[key]);
  return Number(match?.price) > 0 ? Number(match.price) : price;
}, 0);

export const GoMarketProductOptions = ({ options = [], selected = {}, onSelect }) => {
  const optionsToRender = interactiveOptions(options);
  if (!optionsToRender.length) return null;


  return <div style={{ marginTop: 16, marginBottom: 8 }}>{optionsToRender.map((opt) => {
    const key = opt.name || opt.label;
    return <div key={key} className="gmp-option-group"><div className="gmp-option-label">{key}<span style={{ color: "#dc2626", marginLeft: 4 }}>*</span></div><div className="gmp-option-chips">{(opt.values || []).map((val) => <button key={val.value || val.label} type="button" className={`gmp-option-chip${selected[key] === val.label ? " active" : ""}`} onClick={() => onSelect(key, val.label, val)}>{val.label}{val.price > 0 ? ` · ₹${val.price}` : ""}</button>)}</div></div>;
  })}</div>;
};
export const allOptionsSelected = (options, selected) => interactiveOptions(options).every((opt) => toCleanString(selected?.[opt.name || opt.label]));

export default GoMarketProductOptions;
