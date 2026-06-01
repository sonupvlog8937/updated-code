import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtR = (n) => `₹${fmt(n)}`;

const StatusPill = ({ status }) => {
  const map = {
    pending: { bg: "#fef3c7", color: "#92400e", label: "New" },
    confirmed: { bg: "#dbeafe", color: "#1e40af", label: "Preparing" },
    shipped: { bg: "#ede9fe", color: "#6b21a8", label: "Out for delivery" },
    delivered: { bg: "#dcfce7", color: "#166534", label: "Delivered" },
    cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  };
  const s = map[(status || "").toLowerCase()] || { bg: "#f1f5f9", color: "#475569", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100 }}>
      {s.label}
    </span>
  );
};

const QuickCommerceDashboard = () => {
  const context = useContext(MyContext);
  const role = context?.userData?.role;
  const isGrocery = role === "GROCERY_SELLER";
  const theme = isGrocery
    ? { primary: "#059669", dark: "#064e3b", light: "#ecfdf5", gradient: "linear-gradient(135deg, #059669 0%, #047857 55%, #065f46 100%)", tag: "Quick Grocery" }
    : { primary: "#ea580c", dark: "#7c2d12", light: "#fff7ed", gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 55%, #c2410c 100%)", tag: "Quick Restaurant" };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    fetchDataFromApi("/api/user/seller/quick-commerce/dashboard")
      .then((res) => {
        if (res?.success || res?.error === false) setData(res);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 45000);
    return () => clearInterval(id);
  }, [load]);

  const outlet = data?.outlet;
  const stats = data?.orderStats || {};
  const catalog = data?.catalog || {};
  const recentOrders = data?.recentOrders || [];

  const quickActions = [
    { to: "/seller/store-ops", label: isGrocery ? "Store controls" : "Kitchen controls", sub: "Open / pause · delivery SLA" },
    { to: "/products", label: isGrocery ? "Manage inventory" : "Manage menu", sub: `${catalog.totalItems || 0} items live` },
    { to: "/orders", label: "Live orders", sub: `${stats.activeOrders || 0} need attention`, highlight: (stats.pendingOrders || 0) > 0 },
    { to: "/wallet/transactions", label: "Earnings & wallet", sub: "Payouts & balance" },
  ];

  const statCards = isGrocery
    ? [
        { label: "Today's orders", value: stats.todayOrders, accent: theme.primary },
        { label: "Today's revenue", value: fmtR(stats.todayRevenue), accent: "#0ea5e9" },
        { label: "New orders", value: stats.pendingOrders, accent: "#f59e0b", alert: stats.pendingOrders > 0 },
        { label: "Low stock", value: catalog.lowStock, accent: "#d97706", alert: catalog.lowStock > 0 },
        { label: "Out of stock", value: catalog.outOfStock, accent: "#ef4444", alert: catalog.outOfStock > 0 },
        { label: "Delivered today", value: stats.deliveredToday, accent: "#6366f1" },
      ]
    : [
        { label: "Today's orders", value: stats.todayOrders, accent: theme.primary },
        { label: "Today's revenue", value: fmtR(stats.todayRevenue), accent: "#0ea5e9" },
        { label: "New orders", value: stats.pendingOrders, accent: "#f59e0b", alert: stats.pendingOrders > 0 },
        { label: "Preparing", value: stats.preparingOrders, accent: "#8b5cf6" },
        { label: "Unavailable dishes", value: catalog.unavailable, accent: "#ef4444", alert: catalog.unavailable > 0 },
        { label: "Menu items", value: catalog.totalItems, accent: "#6366f1" },
      ];

  return (
    <>
      <style>{`
        .qc-wrap { animation: qcFade .35s ease; }
        @keyframes qcFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .qc-hero { position: relative; overflow: hidden; border-radius: 20px; padding: 28px 30px; margin-bottom: 20px; color: #fff; background: ${theme.gradient}; }
        .qc-hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 85% 20%, rgba(255,255,255,.18), transparent 55%); pointer-events: none; }
        .qc-hero__grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; }
        .qc-tag { font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; opacity: .85; margin-bottom: 6px; }
        .qc-title { font-size: clamp(20px, 3vw, 28px); font-weight: 800; margin: 0 0 6px; }
        .qc-sub { font-size: 13px; opacity: .9; max-width: 520px; line-height: 1.5; }
        .qc-status { display: inline-flex; align-items: center; gap: 8px; margin-top: 14px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); font-size: 12px; font-weight: 700; }
        .qc-dot { width: 8px; height: 8px; border-radius: 50%; background: ${outlet?.isOpen === false ? "#fca5a5" : "#86efac"}; box-shadow: 0 0 8px currentColor; }
        .qc-hero-pills { display: flex; flex-direction: column; gap: 8px; }
        .qc-pill { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); border-radius: 12px; padding: 10px 14px; min-width: 130px; backdrop-filter: blur(8px); }
        .qc-pill-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: .75; }
        .qc-pill-val { font-size: 18px; font-weight: 800; margin-top: 2px; }
        .qc-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .qc-section { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #64748b; }
        .qc-refresh { border: 1px solid #e2e8f0; background: #fff; color: #334155; font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 9px; cursor: pointer; }
        .qc-refresh:disabled { opacity: .6; cursor: not-allowed; }
        .qc-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .qc-stat { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; position: relative; overflow: hidden; }
        .qc-stat.alert { border-color: #fecaca; background: #fffbfb; }
        .qc-stat-val { font-size: 22px; font-weight: 800; color: #0f172a; }
        .qc-stat-lbl { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 4px; }
        .qc-stat-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; }
        .qc-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .qc-action { display: block; text-decoration: none; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; transition: transform .15s, box-shadow .15s, border-color .15s; }
        .qc-action:hover { transform: translateY(-2px); box-shadow: 0 10px 24px -10px rgba(0,0,0,.12); border-color: ${theme.primary}; }
        .qc-action.highlight { border-color: #fcd34d; background: #fffbeb; }
        .qc-action-title { font-size: 14px; font-weight: 700; color: #0f172a; }
        .qc-action-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
        .qc-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
        .qc-panel-head { padding: 16px 18px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
        .qc-panel-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .qc-order { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px; border-bottom: 1px solid #f8fafc; }
        .qc-order:last-child { border-bottom: none; }
        .qc-order-id { font-family: monospace; font-size: 11px; color: ${theme.primary}; font-weight: 700; }
        .qc-order-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
        .qc-empty { text-align: center; padding: 32px; color: #94a3b8; font-size: 13px; }
        .qc-skel { height: 72px; border-radius: 14px; background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: qcShim 1.2s infinite; }
        @keyframes qcShim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 720px) { .qc-hero__grid { grid-template-columns: 1fr; } .qc-hero-pills { flex-direction: row; flex-wrap: wrap; } }
      `}</style>

      <div className="qc-wrap">
        <div className="qc-hero">
          <div className="qc-hero__grid">
            <div>
              <p className="qc-tag">{theme.tag} · Minutes delivery</p>
              <h1 className="qc-title">{greeting}, {context?.userData?.name?.split(" ")[0]} 👋</h1>
              <p className="qc-sub">
                {outlet?.name
                  ? `${outlet.name} — ${isGrocery ? "fresh groceries" : "hot meals"} delivered fast, like Flipkart Minutes.`
                  : "Your quick-commerce partner console"}
              </p>
              <div className="qc-status">
                <span className="qc-dot" />
                {loading ? "Syncing…" : outlet?.isOpen === false ? "Store paused — not accepting orders" : "Live · Accepting orders"}
              </div>
            </div>
            <div className="qc-hero-pills">
              <div className="qc-pill">
                <div className="qc-pill-lbl">Delivery promise</div>
                <div className="qc-pill-val">{outlet?.deliveryMinutes ?? "—"} min</div>
              </div>
              <div className="qc-pill">
                <div className="qc-pill-lbl">Min order</div>
                <div className="qc-pill-val">{fmtR(outlet?.minOrderValue)}</div>
              </div>
              {!isGrocery && (
                <div className="qc-pill">
                  <div className="qc-pill-lbl">Avg prep</div>
                  <div className="qc-pill-val">{outlet?.avgPrepMinutes ?? "—"} min</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="qc-toolbar">
          <span className="qc-section">Today at a glance</span>
          <button type="button" className="qc-refresh" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh live data"}
          </button>
        </div>

        {loading ? (
          <div className="qc-stats">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="qc-skel" />)}</div>
        ) : (
          <div className="qc-stats">
            {statCards.map((c) => (
              <div key={c.label} className={`qc-stat${c.alert ? " alert" : ""}`}>
                <div className="qc-stat-val">{c.value ?? 0}</div>
                <div className="qc-stat-lbl">{c.label}</div>
                <div className="qc-stat-bar" style={{ background: c.accent }} />
              </div>
            ))}
          </div>
        )}

        <div className="qc-toolbar">
          <span className="qc-section">Quick actions</span>
        </div>
        <div className="qc-actions">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className={`qc-action${a.highlight ? " highlight" : ""}`}>
              <div className="qc-action-title">{a.label}</div>
              <div className="qc-action-sub">{a.sub}</div>
            </Link>
          ))}
        </div>

        <div className="qc-panel">
          <div className="qc-panel-head">
            <span className="qc-panel-title">Recent live orders</span>
            <Link to="/orders" style={{ fontSize: 12, fontWeight: 700, color: theme.primary, textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: 16 }}><div className="qc-skel" /></div>
          ) : recentOrders.length === 0 ? (
            <div className="qc-empty">No orders yet. When customers order, they appear here in real time.</div>
          ) : (
            recentOrders.map((o) => (
              <div key={o._id} className="qc-order">
                <div>
                  <div className="qc-order-id">#{String(o._id).slice(-8)}</div>
                  <div className="qc-order-meta">{o.customerName} · {o.customerPhone || "—"}</div>
                  <div className="qc-order-meta">{o.address || "Delivery address"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{fmtR(o.totalAmt)}</div>
                  <div style={{ marginTop: 6 }}><StatusPill status={o.order_status} /></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default QuickCommerceDashboard;
