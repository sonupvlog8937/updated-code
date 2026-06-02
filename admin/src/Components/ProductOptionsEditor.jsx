import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const cleanRows = (rows = []) =>
  rows.map((row) => ({
    name: String(row?.name || row?.label || '').trim(),
    label: String(row?.label || row?.name || '').trim(),
    values: Array.isArray(row?.values) ? row.values : String(row?.values || '').split(','),
  }));

export const normalizeProductOptionsForSubmit = (rows = []) =>
  cleanRows(rows)
    .map((row) => ({
      name: row.name,
      label: row.label || row.name,
      values: [...new Set(row.values.map((v) => String(v || '').trim()).filter(Boolean))],
    }))
    .filter((row) => row.name && row.values.length > 0);

const ProductOptionsEditor = ({ value = [], onChange, accent = '#111827' }) => {
  const rows = cleanRows(value.length ? value : [{ name: '', label: '', values: [] }]);

  const setRow = (index, patch) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const inputStyle = {
    width: '100%',
    height: 42,
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '0 12px',
    fontSize: 13,
    outline: 'none',
    background: '#fff',
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Product options (optional)</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Add selectable choices like Weight: 500g, 1kg or Spice: Mild, Medium.</div>
        </div>
        <button
          type="button"
          onClick={() => onChange([...rows, { name: '', label: '', values: [] }])}
          style={{ border: 'none', borderRadius: 10, background: accent, color: '#fff', padding: '9px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FiPlus /> Add option
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map((row, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, .8fr) minmax(220px, 1.5fr) 36px', gap: 10, alignItems: 'center' }}>
            <input
              style={inputStyle}
              value={row.name}
              onChange={(e) => setRow(index, { name: e.target.value, label: e.target.value })}
              placeholder="Option name e.g. Weight"
            />
            <input
              style={inputStyle}
              value={(row.values || []).join(', ')}
              onChange={(e) => setRow(index, { values: e.target.value.split(',') })}
              placeholder="Values e.g. 500g, 1kg, 5kg"
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fee2e2', color: '#dc2626', background: '#fff', cursor: 'pointer' }}
              title="Remove option"
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductOptionsEditor;
