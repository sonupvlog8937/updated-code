import { useEffect, useState } from "react";
import { fetchDataFromApi, editData } from "../utils/api";

const CommerceSettings = () => {
  const [form, setForm] = useState({
    shippingFee: 0,
    deliveryFee: 0,
    freeShippingAbove: 0,
    goMarketShippingFee: 0,
    goMarketDeliveryFeePerKm: 0,
    goMarketRiderFeePerKm: 0,
    collections: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDataFromApi("/api/settings/commerce").then((res) => {
      if (res?.data) {
        setForm({
          ...res.data,
          collections: res.data.collections || [],
        });
      }
    });
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateCollection = (index, patch) =>
    setForm((f) => ({
      ...f,
      collections: f.collections.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    await editData("/api/settings/commerce", form);
    setSaving(false);
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    display: "block",
    marginBottom: 6,
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ ...cardStyle, padding: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
          💰 Commerce Settings
        </h2>
        <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>
          Manage shipping fees, delivery fees, and free shipping threshold for your store.
        </p>

        <form onSubmit={save}>
          {/* Shipping & Delivery Fees */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
              📦 Shipping & Delivery
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Shipping Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.shippingFee}
                  onChange={(e) => set("shippingFee", Number(e.target.value))}
                  placeholder="50"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Fee charged for shipping
                </p>
              </div>

              <div>
                <label style={labelStyle}>Delivery Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.deliveryFee}
                  onChange={(e) => set("deliveryFee", Number(e.target.value))}
                  placeholder="30"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Fee charged for delivery
                </p>
              </div>

              <div>
                <label style={labelStyle}>Free Shipping Above (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.freeShippingAbove}
                  onChange={(e) => set("freeShippingAbove", Number(e.target.value))}
                  placeholder="500"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Min order for FREE shipping
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <div>
                <label style={labelStyle}>Go Market Shipping Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.goMarketShippingFee}
                  onChange={(e) => set("goMarketShippingFee", Number(e.target.value))}
                  placeholder="25"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Flat shipping fee for Go Market orders
                </p>
              </div>

              <div>
                <label style={labelStyle}>Go Market Delivery Fee / km (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.goMarketDeliveryFeePerKm}
                  onChange={(e) => set("goMarketDeliveryFeePerKm", Number(e.target.value))}
                  placeholder="8"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Per-kilometer delivery fee used for Go Market
                </p>
              </div>
               <div>
                <label style={labelStyle}>Go Market Rider Fee / km (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.goMarketRiderFeePerKm}
                  onChange={(e) => set("goMarketRiderFeePerKm", Number(e.target.value))}
                  placeholder="6"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Per-kilometer rider earning for Go Market deliveries
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: "#eff6ff",
                borderRadius: 8,
                border: "1px solid #bfdbfe",
              }}
            >
              <p style={{ fontSize: 13, color: "#1e40af", margin: 0 }}>
                💡 <strong>Info:</strong> When order total ≥ "Free Shipping Above" amount, both
                shipping and delivery fees become FREE automatically.
              </p>
            </div>
          </div>

          {/* Dynamic Collections */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>🎯 Dynamic Collections</h3>
              <button
                type="button"
                className="btn-blue"
                onClick={() =>
                  set("collections", [
                    ...form.collections,
                    {
                      title: "",
                      type: "mixed",
                      categoryId: "",
                      image: "",
                      isActive: true,
                    },
                  ])
                }
              >
                + Add Collection
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {form.collections.map((c, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 14,
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1.5fr 2fr auto",
                    gap: 12,
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Title</label>
                    <input
                      placeholder="Collection name"
                      value={c.title}
                      onChange={(e) => updateCollection(i, { title: e.target.value })}
                      style={{ ...inputStyle, padding: "8px 10px" }}
                    />
                  </div>

                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Type</label>
                    <select
                      value={c.type}
                      onChange={(e) => updateCollection(i, { type: e.target.value })}
                      style={{ ...inputStyle, padding: "8px 10px" }}
                    >
                      <option value="mixed">Mixed</option>
                      <option value="grocery">Grocery</option>
                      <option value="restaurant">Restaurant</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Category ID</label>
                    <input
                      placeholder="Optional"
                      value={c.categoryId}
                      onChange={(e) => updateCollection(i, { categoryId: e.target.value })}
                      style={{ ...inputStyle, padding: "8px 10px" }}
                    />
                  </div>

                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Image URL</label>
                    <input
                      placeholder="https://..."
                      value={c.image}
                      onChange={(e) => updateCollection(i, { image: e.target.value })}
                      style={{ ...inputStyle, padding: "8px 10px" }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-red"
                    onClick={() =>
                      set(
                        "collections",
                        form.collections.filter((_, idx) => idx !== i)
                      )
                    }
                    style={{ padding: "8px 14px", fontSize: 12 }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {form.collections.length === 0 && (
                <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 20 }}>
                  No collections added yet. Click "Add Collection" to create one.
                </p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "14px 28px",
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              width: "100%",
            }}
          >
            {saving ? "Saving..." : "💾 Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommerceSettings;
