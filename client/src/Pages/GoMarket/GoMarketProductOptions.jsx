import React from "react";
const toCleanString = (value) => String(value ?? "").trim();

const uniqueValues = (values = []) =>
  [...new Set((Array.isArray(values) ? values : []).map(toCleanString).filter(Boolean))];

export const normalizeProductOptions = (options = []) =>
  (Array.isArray(options) ? options : [])
    .map((opt) => {
      const key = toCleanString(opt?.name || opt?.label);
      const values = uniqueValues(opt?.values);
      if (!key || values.length === 0) return null;
      return {
        ...opt,
        name: toCleanString(opt?.name) || key,
        label: toCleanString(opt?.label) || key,
        values,
      };
    })
    .filter(Boolean);

const interactiveOptions = (options = []) =>
  normalizeProductOptions(options).filter((opt) => (opt.values || []).length > 1);

export const GoMarketProductOptions = ({ options = [], selected = {}, onSelect }) => {
  const optionsToRender = interactiveOptions(options);
  if (!optionsToRender.length) return null;

  return (
    <div style={{ marginTop: 16, marginBottom: 8 }}>
      {optionsToRender.map((opt) => {
        const key = opt.name || opt.label;
        const values = opt.values || [];
        return (
          <div key={key} className="gmp-option-group">
            <div className="gmp-option-label">
              {key}
              <span style={{ color: "#dc2626", marginLeft: 4 }}>*</span>
            </div>
            <div className="gmp-option-chips">
              {values.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`gmp-option-chip${selected[key] === val ? " active" : ""}`}
                  onClick={() => onSelect(key, val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const allOptionsSelected = (options, selected) => {
  const requiredOptions = interactiveOptions(options);
  if (!requiredOptions.length) return true;
  return requiredOptions.every((opt) => {
    const key = opt.name || opt.label;
    return toCleanString(selected?.[key]);
  });
};

export default GoMarketProductOptions;
