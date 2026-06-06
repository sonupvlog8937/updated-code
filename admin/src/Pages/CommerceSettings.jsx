import React, { useEffect, useState } from "react";
import { fetchDataFromApi, editData } from "../utils/api";

const row = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 };
export default function CommerceSettings() {
  const [form, setForm] = useState({ shippingFee: 0, deliveryFee: 0, freeShippingAbove: 0, collections: [] });
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetchDataFromApi("/api/settings/commerce").then((res) => res?.data && setForm({ ...res.data, collections: res.data.collections || [] })); }, []);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const updateCollection = (index, patch) => setForm((f) => ({ ...f, collections: f.collections.map((c, i) => i === index ? { ...c, ...patch } : c) }));
  const save = async (e) => { e.preventDefault(); setSaving(true); await editData("/api/settings/commerce", form); setSaving(false); };
  return <div className="p-4"><div style={{ background: "#fff", borderRadius: 18, padding: 22, boxShadow: "0 10px 30px rgba(15,23,42,.08)" }}>
    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Commerce settings</h2><p style={{ color: "#64748b", marginBottom: 20 }}>Manage website/app shipping, delivery fees, and dynamic collection sections.</p>
    <form onSubmit={save} style={{ display: "grid", gap: 20 }}>
      <div style={row}><label>Shipping fee ₹<input type="number" value={form.shippingFee} onChange={(e) => set("shippingFee", e.target.value)} className="form-control" /></label><label>Delivery fee ₹<input type="number" value={form.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} className="form-control" /></label><label>Free above ₹<input type="number" value={form.freeShippingAbove} onChange={(e) => set("freeShippingAbove", e.target.value)} className="form-control" /></label></div>
      <div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><h3 style={{ fontWeight: 900 }}>Dynamic collections</h3><button type="button" className="btn-blue" onClick={() => set("collections", [...form.collections, { title: "", type: "mixed", categoryId: "", image: "", isActive: true }])}>+ Add collection</button></div>
        <div style={{ display: "grid", gap: 10 }}>{form.collections.map((c, i) => <div key={i} style={{ ...row, border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}><input placeholder="Title" value={c.title} onChange={(e) => updateCollection(i, { title: e.target.value })} className="form-control" /><select value={c.type} onChange={(e) => updateCollection(i, { type: e.target.value })} className="form-control"><option value="mixed">Mixed</option><option value="grocery">Grocery</option><option value="restaurant">Restaurant</option></select><input placeholder="Category ID (optional)" value={c.categoryId} onChange={(e) => updateCollection(i, { categoryId: e.target.value })} className="form-control" /><input placeholder="Image URL" value={c.image} onChange={(e) => updateCollection(i, { image: e.target.value })} className="form-control" /><button type="button" className="btn-red" onClick={() => set("collections", form.collections.filter((_, idx) => idx !== i))}>Remove</button></div>)}</div>
      </div>
      <button type="submit" className="btn-blue" disabled={saving}>{saving ? "Saving..." : "Save settings"}</button>
    </form>
  </div></div>;
}
