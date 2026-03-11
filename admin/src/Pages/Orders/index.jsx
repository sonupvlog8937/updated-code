import React, { useState, useEffect, useContext } from 'react';
import SearchBox from '../../Components/SearchBox';
import { deleteData, editData, fetchDataFromApi } from '../../utils/api';
import Pagination from "@mui/material/Pagination";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { MyContext } from "../../App.jsx";

/* ─────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

/* ── Root ── */
.ao { font-family: 'DM Sans', sans-serif; color: #111; }
.ao *, .ao *::before, .ao *::after { box-sizing: border-box; }

/* ── Page card ── */
.ao-page {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #eaebf2;
  box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  overflow: hidden;
  margin: 12px 0;
}

/* ── Top bar ── */
.ao-topbar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f7;
}
.ao-topbar-left { flex: 1; min-width: 0; }
.ao-topbar-title {
  font-family: 'Sora', sans-serif;
  font-size: 17px; font-weight: 800;
  color: #0c0c14; letter-spacing: -0.025em;
  margin: 0 0 2px;
}
.ao-topbar-sub { font-size: 12px; color: #9ca3af; font-weight: 500; margin: 0; }
.ao-search-wrap { flex: 1; max-width: 320px; min-width: 200px; }

/* ── Stats strip ── */
.ao-stats {
  display: flex; gap: 1px;
  background: #f0f0f7;
  border-bottom: 1px solid #f0f0f7;
}
.ao-stat {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; padding: 12px 8px; background: #fafafa;
}
.ao-stat-n { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; line-height: 1; }
.ao-stat-l { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #9ca3af; }

/* ── Table ── */
.ao-scroll { overflow-x: auto; }
.ao-tbl { width: 100%; border-collapse: collapse; }
.ao-tbl thead tr { background: #f7f7fb; }
.ao-tbl th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #6b7280;
  white-space: nowrap; border-bottom: 2px solid #eeeff8;
}
.ao-tbl td {
  padding: 12px 14px;
  border-bottom: 1px solid #f4f4f9;
  vertical-align: middle;
  font-size: 13px;
}
.ao-tbl tbody tr.ao-main-row { transition: background 0.12s; }
.ao-tbl tbody tr.ao-main-row:hover > td { background: #fafafd; }
.ao-tbl tbody tr.ao-main-row.expanded > td { background: #f7f7fb; }

/* Expand btn */
.ao-xbtn {
  width: 28px; height: 28px; border-radius: 8px;
  border: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  background: #f0f0f7; color: #6b7280;
  transition: all 0.15s; flex-shrink: 0;
}
.ao-xbtn:hover { background: #e4e4ef; }
.ao-xbtn.open { background: #111; color: #fff; }

/* ID */
.ao-oid { font-size: 11px; font-weight: 700; color: #6366f1; font-family: 'Sora', sans-serif; display: block; }
.ao-oid-full { font-size: 10px; color: #bbb; display: block; margin-top: 1px; white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis; }

/* Payment badges */
.ao-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 5px;
  white-space: nowrap; letter-spacing: 0.03em;
}
.ao-badge-cod    { background: #fef3c7; color: #92400e; }
.ao-badge-online { background: #d1fae5; color: #065f46; }
.ao-badge-pid    { font-size: 10px; color: #9ca3af; display: block; margin-top: 2px; }

/* Customer cell */
.ao-cust-name  { font-weight: 600; color: #111; font-size: 13px; white-space: nowrap; }
.ao-cust-email { font-size: 11px; color: #9ca3af; margin-top: 1px; }
.ao-cust-phone { font-size: 11px; color: #6b7280; margin-top: 1px; }

/* Address cell */
.ao-addr-type { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; padding: 2px 6px; border-radius: 3px; background: #f0f0f7; color: #374151; margin-bottom: 3px; }
.ao-addr-text { font-size: 12px; color: #374151; max-width: 160px; line-height: 1.4; }
.ao-addr-pin  { font-size: 11px; color: #9ca3af; margin-top: 1px; }

/* Amount */
.ao-amt { font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 800; color: #0c0c14; }

/* Delete btn */
.ao-del {
  display: inline-flex; align-items: center; gap: 4px;
  background: #fff0f0; color: #dc2626; border: 1px solid #fecaca;
  font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 7px;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all 0.15s; white-space: nowrap;
}
.ao-del:hover { background: #fee2e2; border-color: #fca5a5; }

/* ── Expanded products panel ── */
.ao-panel-row > td {
  padding: 0 !important;
  border-bottom: 2px solid #e8e8f2 !important;
}
.ao-panel {
  background: #f7f7fb;
  padding: 16px 20px 20px 24px;
  animation: panelOpen 0.2s ease both;
}
@keyframes panelOpen {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ao-panel-hdr {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.ao-panel-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; }
.ao-panel-count { font-size: 10px; font-weight: 700; background: #e4e4ef; color: #374151; padding: 2px 8px; border-radius: 20px; }
.ao-panel-hint  { font-size: 11px; color: #aaa; margin-bottom: 12px; }

/* Product cards */
.ao-prod-list { display: flex; flex-direction: column; gap: 7px; }
.ao-prod-card {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1.5px solid #eaebf2; border-radius: 12px;
  padding: 10px 14px; cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
}
.ao-prod-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 18px rgba(99,102,241,0.1);
  transform: translateX(4px);
}
.ao-prod-card::after {
  content: '↗';
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  font-size: 13px; color: #c7c7d6;
  transition: color 0.15s;
}
.ao-prod-card:hover::after { color: #6366f1; }
.ao-prod-img {
  width: 52px; height: 52px; border-radius: 10px;
  object-fit: cover; flex-shrink: 0;
  border: 1px solid #eaebf2;
}
.ao-prod-noimg {
  width: 52px; height: 52px; border-radius: 10px; flex-shrink: 0;
  background: #f0f0f7; display: flex; align-items: center; justify-content: center;
  color: #bbb; font-size: 20px;
}
.ao-prod-info { flex: 1; min-width: 0; }
.ao-prod-name { font-size: 13px; font-weight: 600; color: #111; margin-bottom: 5px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 260px; }
.ao-prod-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.ao-prod-tag  { font-size: 10px; font-weight: 600; background: #f0f0f7; color: #6b7280; padding: 2px 7px; border-radius: 4px; }
.ao-prod-right { text-align: right; flex-shrink: 0; margin-right: 20px; }
.ao-prod-subtotal { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 800; color: #111; }
.ao-prod-unit     { font-size: 10px; color: #9ca3af; margin-top: 1px; }

/* Order total row inside panel */
.ao-panel-total {
  display: flex; align-items: center; justify-content: flex-end; gap: 12px;
  padding-top: 12px; border-top: 2px solid #e8e8f2; margin-top: 10px;
}
.ao-panel-total-lbl { font-size: 12px; font-weight: 600; color: #6b7280; }
.ao-panel-total-amt { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 800; color: #0c0c14; }

/* ─────────────────────────────────────────
   PRODUCT DETAIL MODAL
───────────────────────────────────────── */
.ao-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(8, 8, 20, 0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: overlayIn 0.18s ease both;
}
@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

.ao-modal {
  background: #fff; border-radius: 24px;
  width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 40px 100px rgba(0,0,0,0.22);
  animation: modalIn 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  outline: none;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.85) translateY(24px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}

/* Modal image area */
.ao-modal-imgbox {
  position: relative; height: 230px;
  background: #f0f0f7; border-radius: 24px 24px 0 0; overflow: hidden;
}
.ao-modal-imgbox img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.4s ease;
}
.ao-modal-imgbox:hover img { transform: scale(1.04); }
.ao-modal-noimg {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 56px; color: #ddd;
}
.ao-modal-close {
  position: absolute; top: 12px; right: 12px;
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(0,0,0,0.45); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px;
  transition: background 0.15s;
}
.ao-modal-close:hover { background: rgba(0,0,0,0.7); }

/* Subtotal chip over image */
.ao-modal-chip {
  position: absolute; bottom: 12px; left: 12px;
  background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
  color: #fff; font-family: 'Sora', sans-serif;
  font-size: 15px; font-weight: 800;
  padding: 6px 14px; border-radius: 20px;
}

/* Modal body */
.ao-modal-body { padding: 22px 24px 28px; }
.ao-modal-name {
  font-family: 'Sora', sans-serif;
  font-size: 18px; font-weight: 800; color: #0c0c14;
  letter-spacing: -0.025em; margin: 0 0 4px; line-height: 1.3;
}
.ao-modal-pid { font-size: 11px; color: #9ca3af; font-weight: 500; margin: 0 0 18px; font-family: 'DM Sans', sans-serif; }

/* Price row */
.ao-modal-pricerow { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
.ao-modal-price { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 800; color: #0c0c14; }
.ao-modal-per   { font-size: 12px; color: #9ca3af; }

/* Qty × price math */
.ao-modal-math {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
  padding: 5px 12px; margin-bottom: 20px;
  font-size: 12px; font-weight: 600; color: #065f46;
}

.ao-modal-divider { height: 1px; background: #f0f0f7; margin: 18px 0; }

/* Attributes grid */
.ao-modal-attrs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.ao-modal-attr { background: #f7f7fb; border-radius: 10px; padding: 10px 14px; }
.ao-modal-attr-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #9ca3af; margin-bottom: 4px; }
.ao-modal-attr-val { font-size: 13px; font-weight: 600; color: #111; display: flex; align-items: center; gap: 6px; }
.ao-modal-color-dot { width: 13px; height: 13px; border-radius: 50%; border: 1px solid #e5e7eb; flex-shrink: 0; }

/* Footer buttons */
.ao-modal-footer { display: flex; gap: 8px; }
.ao-modal-btn-p {
  flex: 1; height: 44px; border-radius: 12px;
  background: #0c0c14; color: #fff; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  text-decoration: none; transition: all 0.18s;
}
.ao-modal-btn-p:hover { background: #1f1f2e; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(12,12,20,0.2); }
.ao-modal-btn-s {
  height: 44px; padding: 0 18px; border-radius: 12px;
  background: #f0f0f7; color: #374151; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  transition: all 0.15s;
}
.ao-modal-btn-s:hover { background: #e4e4ef; }

/* ── Empty state ── */
.ao-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 56px 24px; gap: 8px; text-align: center;
}
.ao-empty-icon { font-size: 44px; margin-bottom: 4px; }
.ao-empty h3 { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #374151; margin: 0; }
.ao-empty p  { font-size: 12px; color: #9ca3af; margin: 0; }

/* ── Pagination ── */
.ao-page-footer { display: flex; justify-content: center; padding: 18px 24px 20px; }

/* ── Status select override ── */
.ao-status-sel .MuiOutlinedInput-root { border-radius: 8px !important; font-size: 12px !important; font-family: 'DM Sans', sans-serif !important; font-weight: 600 !important; }
.ao-status-sel .MuiSelect-select { padding: 6px 10px !important; font-size: 12px !important; font-weight: 600 !important; }
.ao-status-sel fieldset { border-color: #eaebf2 !important; }
`;

/* ── helpers ── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

/* ── Status badge ── */
const STATUS_COLORS = {
  pending:    { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  confirm:    { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  processing: { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6" },
  shipped:    { bg: "#e0f2fe", color: "#0369a1", dot: "#0ea5e9" },
  delivered:  { bg: "#d1fae5", color: "#065f46", dot: "#16a34a" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};
const getStatusStyle = (s = "") => STATUS_COLORS[s.toLowerCase()] || { bg: "#f0f0f7", color: "#374151", dot: "#9ca3af" };

/* ═══════════════════════════════════════════════════════
   PRODUCT DETAIL MODAL sonu
═══════════════════════════════════════════════════════ */
const ProductModal = ({ item, onClose }) => {
  // close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!item) return null;

  const subtotal = (item.price || 0) * (item.quantity || 1);
  const attrs = [
    item.quantity  && { label: "Quantity", value: `× ${item.quantity}` },
    item.color     && { label: "Color",    value: item.color, isColor: true },
    item.size      && { label: "Size",     value: item.size },
    item.weight    && { label: "Weight",   value: item.weight },
    item.ram       && { label: "RAM",      value: item.ram },
    item.brand     && { label: "Brand",    value: item.brand },
  ].filter(Boolean);

  return (
    <div className="ao-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ao-modal" role="dialog" aria-modal="true">
        {/* Image */}
        <div className="ao-modal-imgbox">
          {item.image
            ? <img src={item.image} alt={item.productTitle} />
            : <div className="ao-modal-noimg">🖼️</div>
          }
          <button className="ao-modal-close" onClick={onClose} aria-label="Close">✕</button>
          <div className="ao-modal-chip">{fmt(subtotal)}</div>
        </div>

        {/* Body */}
        <div className="ao-modal-body">
          <h3 className="ao-modal-name">{item.productTitle || "—"}</h3>
          <p className="ao-modal-pid">
            Product ID: {item.productId || item._id || "—"}
          </p>

          {/* Price */}
          <div className="ao-modal-pricerow">
            <span className="ao-modal-price">{fmt(item.price)}</span>
            <span className="ao-modal-per">per unit</span>
          </div>
          <div className="ao-modal-math">
            <span>{fmt(item.price)}</span>
            <span style={{ color: "#9ca3af" }}>×</span>
            <span>{item.quantity} qty</span>
            <span style={{ color: "#9ca3af", margin: "0 2px" }}>=</span>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 800 }}>{fmt(subtotal)}</span>
          </div>

          {/* Attributes */}
          {attrs.length > 0 && (
            <>
              <div className="ao-modal-divider" />
              <div className="ao-modal-attrs">
                {attrs.map((a, i) => (
                  <div className="ao-modal-attr" key={i}>
                    <div className="ao-modal-attr-lbl">{a.label}</div>
                    <div className="ao-modal-attr-val">
                      {a.isColor && (
                        <span className="ao-modal-color-dot" style={{ background: a.value }} />
                      )}
                      {a.value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="ao-modal-divider" />

          {/* Footer */}
          <div className="ao-modal-footer">
            <a
              href={`/product/${item.productId || item._id}`}
              target="_blank"
              rel="noreferrer"
              className="ao-modal-btn-p"
            >
              <span>↗</span> View Product Page
            </a>
            <button className="ao-modal-btn-s" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN ORDERS COMPONENT
═══════════════════════════════════════════════════════ */
const Orders = () => {
  const [openOrderId,      setOpenOrderId]       = useState(null);
  const [orderStatus,      setOrderStatus]        = useState("");
  const [ordersData,       setOrdersData]         = useState([]);
  const [orders,           setOrders]             = useState([]);
  const [pageOrder,        setPageOrder]          = useState(1);
  const [searchQuery,      setSearchQuery]        = useState("");
  const [totalOrdersData,  setTotalOrdersData]    = useState({});
  const [selectedProduct,  setSelectedProduct]    = useState(null);

  const context = useContext(MyContext);
const isSellerView = context?.userData?.role === "SELLER";
  const ordersListEndpoint = isSellerView ? "/api/order/seller/orders" : "/api/order/order-list";
  /* toggle expand */
  const toggleOrder = (id) => setOpenOrderId((prev) => (prev === id ? null : id));

  /* status change */
  const handleChange = (e, id) => {
    const val = e.target.value;
    setOrderStatus(val);
    editData(`/api/order/order-status/${id}`, { id, order_status: val }).then((res) => {
      if (res?.data?.error === false) context.alertBox("success", res?.data?.message);
    });
  };

  /* delete */
  const deleteOrder = (id) => {
    if (context?.userData?.role !== "ADMIN") {
      context.alertBox("error", "Delete is allowed only for admin");
      return;
    }
    deleteData(`/api/order/deleteOrder/${id}`).then(() => {
      fetchDataFromApi(`${ordersListEndpoint}?page=${pageOrder}&limit=5`).then((res) => {
        if (res?.error === false) {
          setOrdersData(res?.data);
          context?.setProgress(100);
          context.alertBox("success", "Order deleted successfully!");
        }
      });
      fetchDataFromApi(`${ordersListEndpoint}`).then((res) => {
        if (res?.error === false) setTotalOrdersData(res);
      });
    });
  };

  /* fetch on page / status change */
  useEffect(() => {
    context?.setProgress(50);
    fetchDataFromApi(`${ordersListEndpoint}?page=${pageOrder}&limit=5`).then((res) => {
      if (res?.error === false) { setOrdersData(res?.data); setOrders(res); context?.setProgress(100); }
    });
    fetchDataFromApi(`${ordersListEndpoint}`).then((res) => {
      if (res?.error === false) setTotalOrdersData(res);
    });
  }, [orderStatus, pageOrder]);

  /* search filter */
  useEffect(() => {
    if (searchQuery !== "") {
      const q = searchQuery.toLowerCase();
      const filtered = (totalOrdersData?.data || []).filter((o) =>
        o._id?.toLowerCase().includes(q) ||
        o?.userId?.name?.toLowerCase().includes(q) ||
        o?.userId?.email?.toLowerCase().includes(q) ||
        o?.createdAt?.includes(q)
      );
      setOrdersData(filtered);
    } else {
      fetchDataFromApi(`${ordersListEndpoint}?page=${pageOrder}&limit=5`).then((res) => {
        if (res?.error === false) { setOrders(res); setOrdersData(res?.data); }
      });
    }
  }, [searchQuery]);

  /* stats */
  const allOrders   = totalOrdersData?.data || [];
  const totalCount  = allOrders.length;
  const pendingCnt  = allOrders.filter((o) => (o.order_status || "").toLowerCase() === "pending").length;
  const deliveredCnt= allOrders.filter((o) => (o.order_status || "").toLowerCase() === "delivered").length;
  const cancelledCnt= allOrders.filter((o) => (o.order_status || "").toLowerCase() === "cancelled").length;

  return (
    <div className="ao">
      <style>{STYLES}</style>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductModal item={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <div className="ao-page">

        {/* ── Top bar ── */}
        <div className="ao-topbar">
          <div className="ao-topbar-left">
           <h2 className="ao-topbar-title">{isSellerView ? "Store Orders" : "Orders"}</h2>
            <p className="ao-topbar-sub">{isSellerView ? "Track orders for your own products" : "Manage and track all customer orders"}</p>
          </div>
          <div className="ao-search-wrap">
            <SearchBox
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setPageOrder={setPageOrder}
            />
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="ao-stats">
          <div className="ao-stat">
            <span className="ao-stat-n" style={{ color: "#0c0c14" }}>{totalCount}</span>
            <span className="ao-stat-l">Total</span>
          </div>
          <div className="ao-stat">
            <span className="ao-stat-n" style={{ color: "#f59e0b" }}>{pendingCnt}</span>
            <span className="ao-stat-l">Pending</span>
          </div>
          <div className="ao-stat">
            <span className="ao-stat-n" style={{ color: "#16a34a" }}>{deliveredCnt}</span>
            <span className="ao-stat-l">Delivered</span>
          </div>
          <div className="ao-stat">
            <span className="ao-stat-n" style={{ color: "#ef4444" }}>{cancelledCnt}</span>
            <span className="ao-stat-l">Cancelled</span>
          </div>
        </div>

        {/* ── Empty ── */}
        {(!ordersData || ordersData.length === 0) && (
          <div className="ao-empty">
            <div className="ao-empty-icon">📦</div>
            <h3>No orders found</h3>
            <p>Try adjusting your search query</p>
          </div>
        )}

        {/* ── Table ── */}
        {ordersData?.length > 0 && (
          <div className="ao-scroll">
            <table className="ao-tbl">
              <thead>
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>Order ID</th>
                  <th>Payment</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.map((order) => {
                  const isOpen = openOrderId === order._id;
                  const addr   = order?.delivery_address || {};
                  const isCOD  = !order?.paymentId;
                  const sc     = getStatusStyle(order?.order_status);

                  return (
                    <React.Fragment key={order._id}>
                      {/* ── Main row ── */}
                      <tr className={`ao-main-row${isOpen ? " expanded" : ""}`}>

                        {/* Expand */}
                        <td>
                          <button
                            className={`ao-xbtn${isOpen ? " open" : ""}`}
                            onClick={() => toggleOrder(order._id)}
                            title={isOpen ? "Collapse" : "Show products"}
                          >
                            {isOpen ? "▲" : "▼"}
                          </button>
                        </td>

                        {/* Order ID */}
                        <td>
                          <span className="ao-oid">#{order._id?.slice(-8).toUpperCase()}</span>
                          <span className="ao-oid-full" title={order._id}>{order._id}</span>
                        </td>

                        {/* Payment */}
                        <td>
                          {isCOD ? (
                            <span className="ao-badge ao-badge-cod">💵 Cash on Delivery</span>
                          ) : (
                            <>
                              <span className="ao-badge ao-badge-online">✓ Online</span>
                              <span className="ao-badge-pid">{order.paymentId?.slice(-12)}</span>
                            </>
                          )}
                        </td>

                        {/* Customer */}
                        <td>
                          <div className="ao-cust-name">{order?.userId?.name}</div>
                          <div className="ao-cust-phone">📞 {addr?.mobile}</div>
                          <div className="ao-cust-email">✉ {order?.userId?.email?.substr(0, 5)}***</div>
                        </td>

                        {/* Address */}
                        <td>
                          {addr?.addressType && <span className="ao-addr-type">{addr.addressType}</span>}
                          <div className="ao-addr-text">
                            {[addr.city, addr.state].filter(Boolean).join(", ")}
                          </div>
                          <div className="ao-addr-pin">PIN {addr.pincode}</div>
                        </td>

                        {/* Amount */}
                        <td><span className="ao-amt">{fmt(order?.totalAmt)}</span></td>

                        {/* Status select */}
                        <td>
                          <Select
                            value={order?.order_status || "pending"}
                            size="small"
                            className="ao-status-sel"
                            onChange={(e) => handleChange(e, order._id)}
                            sx={{
                              minWidth: 120,
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 600,
                              background: sc.bg,
                              color: sc.color,
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0ef" },
                              "& .MuiSvgIcon-root": { color: sc.color },
                            }}
                          >
                            <MenuItem value="pending">⏳ Pending</MenuItem>
                            <MenuItem value="confirm">✅ Confirm</MenuItem>
                            <MenuItem value="processing">⚙️ Processing</MenuItem>
                            <MenuItem value="shipped">🚚 Shipped</MenuItem>
                            <MenuItem value="delivered">📬 Delivered</MenuItem>
                            <MenuItem value="cancelled">❌ Cancelled</MenuItem>
                          </Select>
                        </td>

                        {/* Date */}
                        <td style={{ whiteSpace: "nowrap", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                          📅 {fmtDate(order?.createdAt)}
                        </td>

                        {/* Delete */}
                        <td>
                          <button className="ao-del" onClick={() => deleteOrder(order._id)}>
                            🗑 Delete
                          </button>
                        </td>
                      </tr>

                      {/* ── Expanded products panel ── */}
                      {isOpen && (
                        <tr className="ao-panel-row">
                          <td colSpan={9}>
                            <div className="ao-panel">
                              <div className="ao-panel-hdr">
                                <span className="ao-panel-title">📦 Products in this order</span>
                                <span className="ao-panel-count">{order?.products?.length || 0} items</span>
                              </div>
                              <p className="ao-panel-hint">
                                Click any product card to see full details
                              </p>
                              <div className="ao-prod-list">
                                {(order?.products || []).map((item, i) => (
                                  <div
                                    className="ao-prod-card"
                                    key={i}
                                    onClick={() => setSelectedProduct(item)}
                                    title="Click to view product details"
                                  >
                                    {/* Image */}
                                    {item.image
                                      ? <img src={item.image} alt={item.productTitle} className="ao-prod-img" />
                                      : <div className="ao-prod-noimg">🖼️</div>
                                    }

                                    {/* Info */}
                                    <div className="ao-prod-info">
                                      <div className="ao-prod-name">{item.productTitle}</div>
                                      <div className="ao-prod-tags">
                                        {item.color  && <span className="ao-prod-tag">🎨 {item.color}</span>}
                                        {item.size   && <span className="ao-prod-tag">📐 {item.size}</span>}
                                        {item.weight && <span className="ao-prod-tag">⚖️ {item.weight}</span>}
                                        {item.ram    && <span className="ao-prod-tag">💾 {item.ram}</span>}
                                        <span className="ao-prod-tag">Qty {item.quantity}</span>
                                      </div>
                                    </div>

                                    {/* Price */}
                                    <div className="ao-prod-right">
                                      <div className="ao-prod-subtotal">{fmt(item.price * item.quantity)}</div>
                                      <div className="ao-prod-unit">{fmt(item.price)} × {item.quantity}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Total footer */}
                              <div className="ao-panel-total">
                                <span className="ao-panel-total-lbl">Order Total</span>
                                <span className="ao-panel-total-amt">{fmt(order?.totalAmt)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {orders?.totalPages > 1 && (
          <div className="ao-page-footer">
            <Pagination
              showFirstButton
              showLastButton
              count={orders?.totalPages}
              page={pageOrder}
              onChange={(_, v) => setPageOrder(v)}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  borderRadius: "8px",
                },
                "& .Mui-selected": {
                  background: "#0c0c14 !important",
                  color: "#fff !important",
                },
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export { Orders };
export default Orders;