import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi } from "../../utils/api";

const StoreOperations = () => {
  const context = useContext(MyContext);
  const role = context?.userData?.role;
  const isGrocery = role === "GROCERY_SELLER";
  const theme = isGrocery
    ? { primary: "#059669", bg: "#ecfdf5", title: "Grocery store operations" }
    : { primary: "#ea580c", bg: "#fff7ed", title: "Restaurant kitchen operations" };

  const [outlet, setOutlet] = useState(null);
  const [kind, setKind] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    isOpen: true,
    deliveryMinutes: 15,
    minOrderValue: 99,
    avgPrepMinutes: 25,
  });

  const load = () => {
    setLoading(true);
    fetchDataFromApi("/api/user/seller/quick-commerce/outlet")
      .then((res) => {
        if (res?.outlet) {
          setOutlet(res.outlet);
          setKind(res.kind);
          setForm({
            isOpen: res.outlet.isOpen !== false,
            deliveryMinutes: res.outlet.deliveryMinutes ?? (isGrocery ? 15 : 30),
            minOrderValue: res.outlet.minOrderValue ?? (isGrocery ? 99 : 149),
            avgPrepMinutes: res.outlet.avgPrepMinutes ?? 25,
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [isGrocery]);

  const save = () => {
    setSaving(true);
    const payload = {
      isOpen: form.isOpen,
      deliveryMinutes: Number(form.deliveryMinutes),
      minOrderValue: Number(form.minOrderValue),
    };
    if (!isGrocery) payload.avgPrepMinutes = Number(form.avgPrepMinutes);

    editData("/api/user/seller/quick-commerce/outlet", payload).then((res) => {
      const body = res?.data || res;
      if (body?.success || body?.error === false) {
        context.alertBox("success", body.message || "Settings saved");
        load();
      } else {
        context.alertBox("error", body?.message || "Could not save");
      }
    }).finally(() => setSaving(false));
  };

  const toggleOpen = () => {
    const next = !form.isOpen;
    setForm((f) => ({ ...f, isOpen: next }));
    setSaving(true);
    editData("/api/user/seller/quick-commerce/outlet", { isOpen: next }).then((res) => {
      const body = res?.data || res;
      if (body?.success || body?.error === false) {
        context.alertBox("success", body.message || (next ? "Now accepting orders" : "Store paused"));
        load();
      }
    }).finally(() => setSaving(false));
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading store settings…</div>;
  }

  return (
    <>
      <style>{`
        .ops-head { margin-bottom: 20px; }
        .ops-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
        .ops-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
        .ops-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .ops-toggle { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px; border-radius: 14px; background: ${theme.bg}; border: 1px solid ${theme.primary}33; }
        .ops-toggle-title { font-size: 16px; font-weight: 700; color: #0f172a; }
        .ops-toggle-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
        .ops-switch { width: 52px; height: 30px; border-radius: 999px; border: none; cursor: pointer; position: relative; transition: background .2s; }
        .ops-switch.on { background: ${theme.primary}; }
        .ops-switch.off { background: #cbd5e1; }
        .ops-switch-knob { position: absolute; top: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
        .ops-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-top: 16px; }
        .ops-field label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
        .ops-field input { width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 14px; }
        .ops-save { margin-top: 18px; background: ${theme.primary}; color: #fff; border: none; border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .ops-save:disabled { opacity: .6; cursor: not-allowed; }
        .ops-info { font-size: 12px; color: #64748b; line-height: 1.6; margin-top: 12px; }
        .ops-back { font-size: 12px; font-weight: 600; color: ${theme.primary}; text-decoration: none; }
      `}</style>

      <div className="ops-head">
        <Link to="/" className="ops-back">← Back to dashboard</Link>
        <h1 className="ops-title" style={{ marginTop: 10 }}>{theme.title}</h1>
        <p className="ops-sub">{outlet?.name} · {kind === "grocery" ? "Dark store" : "Kitchen"} settings for quick delivery</p>
      </div>

      <div className="ops-card">
        <div className="ops-toggle">
          <div>
            <div className="ops-toggle-title">{form.isOpen ? "Accepting orders" : "Paused"}</div>
            <div className="ops-toggle-sub">
              {form.isOpen
                ? "Customers can place orders on the app right now."
                : "Your outlet is hidden from new orders until you resume."}
            </div>
          </div>
          <button
            type="button"
            className={`ops-switch ${form.isOpen ? "on" : "off"}`}
            onClick={toggleOpen}
            disabled={saving}
            aria-label="Toggle store open"
          >
            <span className="ops-switch-knob" style={{ left: form.isOpen ? 25 : 3 }} />
          </button>
        </div>

        <div className="ops-grid">
          <div className="ops-field">
            <label>Delivery promise (minutes)</label>
            <input
              type="number"
              min={5}
              max={120}
              value={form.deliveryMinutes}
              onChange={(e) => setForm((f) => ({ ...f, deliveryMinutes: e.target.value }))}
            />
          </div>
          <div className="ops-field">
            <label>Minimum order (₹)</label>
            <input
              type="number"
              min={0}
              value={form.minOrderValue}
              onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
            />
          </div>
          {!isGrocery && (
            <div className="ops-field">
              <label>Average prep time (minutes)</label>
              <input
                type="number"
                min={5}
                max={90}
                value={form.avgPrepMinutes}
                onChange={(e) => setForm((f) => ({ ...f, avgPrepMinutes: e.target.value }))}
              />
            </div>
          )}
        </div>

        <p className="ops-info">
          Tip: Keep delivery promise realistic — customers see this on checkout, similar to quick-commerce apps like Blinkit or Flipkart Minutes.
        </p>

        <button type="button" className="ops-save" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save delivery settings"}
        </button>
      </div>

      <div className="ops-card">
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Outlet details</div>
        <div style={{ fontSize: 13, color: "#475569" }}><strong>Address:</strong> {outlet?.address || "—"}</div>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>
          <strong>Catalog:</strong> {isGrocery ? `${outlet?.totalProducts || 0} products` : `${outlet?.totalItems || 0} menu items`}
        </div>
      </div>
    </>
  );
};

export default StoreOperations;
