import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const asValueRows = (values = []) => (Array.isArray(values) ? values : String(values || '').split(','))
  .map((value, index) => {
    if (value && typeof value === 'object') {
      const label = String(value.label || value.value || value.name || '').trim();
      return { label, value: String(value.value || label).trim(), price: value.price ?? '', oldPrice: value.oldPrice ?? '', isDefault: Boolean(value.isDefault) || index === 0 };
    }
    const label = String(value || '').trim();
    return { label, value: label, price: '', oldPrice: '', isDefault: index === 0 };
  });

const cleanRows = (rows = []) => rows.map((row) => ({
  name: String(row?.name || row?.label || '').trim(),
  label: String(row?.label || row?.name || '').trim(),
  values: asValueRows(row?.values),
}));

export const normalizeProductOptionsForSubmit = (rows = []) =>
  cleanRows(rows).map((row) => ({
    name: row.name,
    label: row.label || row.name,
    values: row.values
      .map((v, index) => ({ label: String(v.label || v.value || '').trim(), value: String(v.value || v.label || '').trim(), price: Math.max(0, Number(v.price) || 0), oldPrice: Math.max(0, Number(v.oldPrice) || 0), isDefault: Boolean(v.isDefault) || index === 0 }))
      .filter((v) => v.label),
  })).filter((row) => row.name && row.values.length > 0);

const ProductOptionsEditor = ({ value = [], onChange, accent = '#111827' }) => {
  const rows = cleanRows(value.length ? value : [{ name: '', label: '', values: [] }]);

       const setRow = (index, patch) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const setValue = (rowIndex, valueIndex, patch) => setRow(rowIndex, { values: rows[rowIndex].values.map((v, i) => (i === valueIndex ? { ...v, ...patch } : v)) });
  const addValue = (rowIndex) => setRow(rowIndex, { values: [...rows[rowIndex].values, { label: '', value: '', price: '', oldPrice: '', isDefault: rows[rowIndex].values.length === 0 }] });
  const inputStyle = { width: '100%', height: 42, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none', background: '#fff' };
  return <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: '#fafafa' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
      <div><div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Product options with prices</div><div style={{ fontSize: 12, color: '#6b7280' }}>Example: Weight → 500g ₹500, 1000g ₹1200. Customer price changes dynamically.</div></div>
      <button type="button" onClick={() => onChange([...rows, { name: '', label: '', values: [] }])} style={{ border: 'none', borderRadius: 10, background: accent, color: '#fff', padding: '9px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FiPlus /> Add option</button>
    </div>
    <div style={{ display: 'grid', gap: 14 }}>
      {rows.map((row, rowIndex) => <div key={rowIndex} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1fr) 38px', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <input style={inputStyle} value={row.name} onChange={(e) => setRow(rowIndex, { name: e.target.value, label: e.target.value })} placeholder="Option name e.g. Weight" />
          <button type="button" onClick={() => onChange(rows.filter((_, i) => i !== rowIndex))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fee2e2', color: '#dc2626', background: '#fff', cursor: 'pointer' }} title="Remove option"><FiTrash2 /></button>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {row.values.map((v, valueIndex) => <div key={valueIndex} style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr .8fr 34px', gap: 8 }}>
            <input style={inputStyle} value={v.label} onChange={(e) => setValue(rowIndex, valueIndex, { label: e.target.value, value: e.target.value })} placeholder="500g" />
            <input style={inputStyle} type="number" value={v.price} onChange={(e) => setValue(rowIndex, valueIndex, { price: e.target.value })} placeholder="Price ₹" />
            <input style={inputStyle} type="number" value={v.oldPrice} onChange={(e) => setValue(rowIndex, valueIndex, { oldPrice: e.target.value })} placeholder="MRP ₹" />
            <button type="button" onClick={() => setRow(rowIndex, { values: row.values.filter((_, i) => i !== valueIndex) })} style={{ border: '1px solid #fee2e2', color: '#dc2626', background: '#fff', borderRadius: 10 }}><FiTrash2 /></button>
          </div>)}
          <button type="button" onClick={() => addValue(rowIndex)} style={{ border: '1px dashed #cbd5e1', borderRadius: 10, background: '#f8fafc', padding: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Add value and price</button>
        </div>
      </div>)}
    </div>
  </div>;
};

export default ProductOptionsEditor;
