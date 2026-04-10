import React, { useEffect, useState } from "react";
import AccountSidebar from "../../components/AccountSidebar";
import { fetchDataFromApi, postData } from "../../utils/api";
import Pagination from "@mui/material/Pagination";
import {
  MdOutlineShoppingBag, MdLocalShipping, MdCheckCircle,
  MdPending, MdCancel, MdKeyboardArrowDown, MdKeyboardArrowUp,
  MdLocationOn, MdPhone, MdEmail, MdCalendarToday, MdReceipt,
} from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa6";

/* ─── CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .ord-root * { box-sizing: border-box; }
  .ord-root { font-family: 'DM Sans', sans-serif; }

  .ord-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 28px 20px; border-bottom: 1px solid #f0f0f5;
  }
  .ord-header-left h2 {
    font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800;
    color: #0a0a0f; margin: 0 0 2px; letter-spacing: -0.02em;
  }
  .ord-header-left p { font-size: 13px; color: #9ca3af; margin: 0; font-weight: 500; }
  .ord-header-left span { color: #E8362A; font-weight: 700; }

  .ord-card {
    background: #fff; border: 1px solid #eef0f6; border-radius: 16px;
    margin: 16px 20px; overflow: hidden; transition: box-shadow 0.2s ease;
  }
  .ord-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.07); }

  .ord-card-top {
    display: flex; align-items: center; gap: 14px; padding: 16px 20px;
    cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;
    transition: background 0.15s;
  }
  .ord-card-top:hover { background: #fafafa; }

  .ord-index {
    width: 36px; height: 36px; border-radius: 10px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #374151; flex-shrink: 0;
    font-family: 'Sora', sans-serif;
  }

  .ord-summary { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 8px 20px; align-items: center; }

  .ord-id-block { display: flex; flex-direction: column; gap: 1px; min-width: 100px; }
  .ord-id-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.07em; }
  .ord-id-value { font-size: 12px; font-weight: 700; color: #6366f1; font-family: 'Sora', sans-serif; }

  .ord-date { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #6b7280; font-weight: 500; }
  .ord-amt { font-size: 15px; font-weight: 800; color: #0a0a0f; font-family: 'Sora', sans-serif; white-space: nowrap; }

  .ord-chevron {
    width: 32px; height: 32px; border-radius: 8px; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    color: #6b7280; transition: all 0.2s; flex-shrink: 0;
  }
  .ord-chevron.open { background: #0a0a0f; color: #fff; }

  .ord-panel { border-top: 1px solid #f0f0f5; animation: ord-open 0.22s ease both; }
  @keyframes ord-open { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }

  /* Timeline */
  .ord-track { padding: 20px 24px; background: #fafafa; border-bottom: 1px solid #f0f0f5; }
  .ord-track-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 18px; }
  .ord-timeline { display: flex; align-items: flex-start; position: relative; }
  .ord-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 7px; position: relative; }
  .ord-step:not(:last-child)::after {
    content: ''; position: absolute; top: 15px; left: 55%; width: 90%; height: 2px;
    background: #e5e7eb; z-index: 0;
  }
  .ord-step.done:not(:last-child)::after { background: #16a34a; }
  .ord-step.active:not(:last-child)::after { background: linear-gradient(90deg,#16a34a,#e5e7eb); }
  .ord-step-icon {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: #e5e7eb; color: #9ca3af; z-index: 1; position: relative; transition: all 0.2s;
  }
  .ord-step.done .ord-step-icon { background: #dcfce7; color: #16a34a; }
  .ord-step.active .ord-step-icon { background: #0a0a0f; color: #fff; box-shadow: 0 0 0 4px rgba(10,10,15,0.1); }
  .ord-step.cancelled .ord-step-icon { background: #fee2e2; color: #dc2626; }
  .ord-step-label { font-size: 10px; font-weight: 600; color: #9ca3af; text-align: center; line-height: 1.3; }
  .ord-step.done .ord-step-label { color: #16a34a; }
  .ord-step.active .ord-step-label { color: #0a0a0f; font-weight: 700; }
  .ord-step.cancelled .ord-step-label { color: #dc2626; }

  /* Info */
  .ord-info-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #f0f0f5; }
  @media(max-width:640px){ .ord-info-grid { grid-template-columns: 1fr; } }
  .ord-info-block { padding: 16px 24px; border-right: 1px solid #f0f0f5; display: flex; flex-direction: column; gap: 3px; }
  .ord-info-block:last-child { border-right: none; }
  .ord-info-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 5px; margin-bottom: 3px; }
  .ord-info-val { font-size: 13px; font-weight: 600; color: #1a1a1a; line-height: 1.5; }
  .ord-info-val.sm { font-size: 12px; color: #6b7280; font-weight: 500; }
  .ord-badge-cod { display: inline-flex; align-items: center; gap: 4px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; }
  .ord-badge-paid { display: inline-flex; align-items: center; gap: 4px; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; }

  /* Products */
  .ord-products { padding: 20px 24px; }
  .ord-products-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
  .ord-products-count { background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }

  .ord-product-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f7f7fb; }
  .ord-product-item:last-child { border-bottom: none; padding-bottom: 0; }
  .ord-product-img { width: 58px; height: 58px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1px solid #eef0f6; }
  .ord-product-placeholder { width: 58px; height: 58px; border-radius: 10px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #9ca3af; }
  .ord-product-info { flex: 1; min-width: 0; }
  .ord-product-name { font-size: 13px; font-weight: 600; color: #1a1a1a; line-height: 1.4; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .ord-meta-row { display: flex; flex-wrap: wrap; gap: 5px; }
  .ord-meta-pill { font-size: 10.5px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 5px; }
  .ord-product-right { text-align: right; flex-shrink: 0; }
  .ord-product-total { font-size: 14px; font-weight: 800; color: #0a0a0f; font-family: 'Sora', sans-serif; }
  .ord-product-unit { font-size: 11px; color: #9ca3af; font-weight: 500; margin-top: 2px; }

  /* Empty */
  .ord-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; text-align: center; gap: 10px; }
  .ord-empty h3 { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: #374151; margin: 0; }
  .ord-empty p { font-size: 13px; color: #9ca3af; margin: 0; }

  .ord-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:14px; flex-wrap:wrap; }
  .ord-action-btn { border:none; border-radius:10px; padding:9px 14px; font-size:12px; font-weight:700; cursor:pointer; }
  .ord-action-btn.return { background:#111827; color:#fff; }
  .ord-action-btn.return:hover { background:#1f2937; }
  .ord-action-btn.disabled { background:#e5e7eb; color:#6b7280; cursor:not-allowed; }
  .ord-return-note { font-size:11px; color:#6b7280; margin-top:10px; text-align:right; }

  .ord-pagination { display: flex; justify-content: center; padding: 20px 24px 24px; }
`;

/* ── Status ── */
const STATUS_MAP = {
  pending:            { color:"#92400e", bg:"#fef3c7", dot:"#f59e0b" },
  confirmed:          { color:"#1d4ed8", bg:"#dbeafe", dot:"#3b82f6" },
  processing:         { color:"#6d28d9", bg:"#ede9fe", dot:"#8b5cf6" },
  shipped:            { color:"#0369a1", bg:"#e0f2fe", dot:"#0ea5e9" },
  "out for delivery": { color:"#0369a1", bg:"#e0f2fe", dot:"#0ea5e9" },
  delivered:          { color:"#065f46", bg:"#d1fae5", dot:"#16a34a" },
  refunded:           { color:"#0f766e", bg:"#ccfbf1", dot:"#14b8a6" },
  cancelled:          { color:"#991b1b", bg:"#fee2e2", dot:"#ef4444" },
};
const getStatus = (s) => STATUS_MAP[(s||"").toLowerCase()] || { color:"#374151", bg:"#f3f4f6", dot:"#9ca3af" };

const StatusBadge = ({ status }) => {
  const c = getStatus(status);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      background:c.bg, color:c.color, fontSize:11, fontWeight:700,
      padding:"4px 10px", borderRadius:20, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, flexShrink:0 }}/>
      {status || "Unknown"}
    </span>
  );
};

/* ── Timeline ── */
const STEPS = ["pending","confirmed","processing","shipped","delivered"];
const STEP_LABELS = { pending:"Pending", confirmed:"Confirmed", processing:"Processing", shipped:"Shipped", delivered:"Delivered" };
const STEP_ICONS_MAP = {
  pending:    <MdPending size={13}/>,
  confirmed:  <MdCheckCircle size={13}/>,
  processing: <MdOutlineShoppingBag size={13}/>,
  shipped:    <MdLocalShipping size={13}/>,
  delivered:  <MdCheckCircle size={13}/>,
};

const getStepState = (orderStatus, step) => {
  const s = (orderStatus || "").toLowerCase();
  if (s === "cancelled") return step === "pending" ? "cancelled" : "idle";
  const si = STEPS.indexOf(s);
  const ti = STEPS.indexOf(step);
  if (si === -1) return "idle";
  if (ti < si) return "done";
  if (ti === si) return "active";
  return "idle";
};

/* ═══════════════════════════
   ORDERS COMPONENT
═══════════════════════════ */
const Orders = () => {
  const [openOrder, setOpenOrder] = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    fetchDataFromApi(`/api/order/order-list/orders?page=${page}&limit=5`).then((res) => {
      if (res?.error === false) setOrders(res);
    });
  }, [page]);

  const [loadingReturnId, setLoadingReturnId] = useState("");

  const toggle  = (id) => setOpenOrder(p => p === id ? null : id);
  const fmt     = (n)  => Number(n||0).toLocaleString("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 });
  const fmtDate = (d)  => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

  const requestReturn = async (orderId) => {
    const reason = window.prompt("Return reason likhiye (optional):", "Product issue / size issue");
    setLoadingReturnId(orderId);
    const res = await postData(`/api/order/return-request/${orderId}`, { reason: reason || "Customer requested return" });
    if (res?.success) {
      const refreshed = await fetchDataFromApi(`/api/order/order-list/orders?page=${page}&limit=5`);
      if (refreshed?.error === false) setOrders(refreshed);
    } else {
      window.alert(res?.message || "Return request failed");
    }
    setLoadingReturnId("");
  };

  return (
    <section className="ord-root py-5 lg:py-10 w-full">
      <style>{CSS}</style>

      <div className="container flex flex-col lg:flex-row gap-5">
        <div className="col1 w-[20%] hidden lg:block">
          <AccountSidebar />
        </div>

        <div className="col2 w-full lg:w-[80%]">
          <div style={{ background:"#fff", borderRadius:18, border:"1px solid #eef0f6",
            overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,0.05)" }}>

            {/* ── Header ── */}
            <div className="ord-header">
              <div className="ord-header-left">
                <h2>My Orders</h2>
                <p><span>{orders?.data?.length || 0}</span> orders found</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:7,
                background:"#f8f8fb", border:"1px solid #eef0f6",
                borderRadius:10, padding:"8px 14px" }}>
                <MdOutlineShoppingBag size={15} color="#9ca3af"/>
                <span style={{ fontSize:12, fontWeight:600, color:"#6b7280" }}>Order History</span>
              </div>
            </div>

            {/* ── Empty ── */}
            {(!orders?.data || orders.data.length === 0) && (
              <div className="ord-empty">
                <FaBoxOpen size={44} color="#e5e7eb"/>
                <h3>No orders yet</h3>
                <p>Your order history will appear here once you place an order.</p>
              </div>
            )}

            {/* ── Order cards ── */}
            {orders?.data?.map((order, idx) => {
              const isOpen = openOrder === order._id;
              const status = order?.order_status || "pending";
              const addr   = order?.delivery_address || {};
              const isCOD  = !order?.paymentId || order?.paymentId === "";

              return (
                <div className="ord-card" key={order._id}
                  style={{ animationDelay:`${idx*0.05}s` }}>

                  {/* Top row */}
                  <div className="ord-card-top" onClick={() => toggle(order._id)}>
                    <div className="ord-index">#{idx + 1}</div>

                    <div className="ord-summary">
                      <div className="ord-id-block">
                        <span className="ord-id-label">Order ID</span>
                        <span className="ord-id-value" title={order._id}>
                          {order._id?.slice(-10).toUpperCase()}
                        </span>
                      </div>
                      <span className="ord-date">
                        <MdCalendarToday size={11}/> {fmtDate(order?.createdAt)}
                      </span>
                      <span style={{ fontSize:12, color:"#6b7280", fontWeight:500 }}>
                        {order?.products?.length || 0} item{order?.products?.length !== 1 ? "s" : ""}
                      </span>
                      <span className="ord-amt">{fmt(order?.totalAmt)}</span>
                      <StatusBadge status={status}/>
                    </div>

                    <div className={`ord-chevron${isOpen ? " open" : ""}`}>
                      {isOpen ? <MdKeyboardArrowUp size={18}/> : <MdKeyboardArrowDown size={18}/>}
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="ord-panel">

                      {/* Timeline */}
                      <div className="ord-track">
                        <div className="ord-track-title">📦 Order Tracking</div>
                        <div className="ord-timeline">
                          {STEPS.map(step => {
                            const state = getStepState(status, step);
                            return (
                              <div key={step} className={`ord-step ${state}`}>
                                <div className="ord-step-icon">{STEP_ICONS_MAP[step]}</div>
                                <span className="ord-step-label">{STEP_LABELS[step]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="ord-info-grid">
                        <div className="ord-info-block">
                          <div className="ord-info-label"><MdLocationOn size={11}/> Delivery Address</div>
                          <div className="ord-info-val">{addr?.address_line1}</div>
                          <div className="ord-info-val sm">
                            {[addr?.city, addr?.state, addr?.country].filter(Boolean).join(", ")}
                          </div>
                          {addr?.landmark && <div className="ord-info-val sm">Near: {addr.landmark}</div>}
                          {addr?.pincode  && <div className="ord-info-val sm">PIN: {addr.pincode}</div>}
                          {addr?.addressType && (
                            <span style={{ display:"inline-flex", marginTop:6, background:"#f3f4f6",
                              color:"#374151", fontSize:10, fontWeight:700, padding:"2px 8px",
                              borderRadius:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                              {addr.addressType}
                            </span>
                          )}
                        </div>

                        <div className="ord-info-block">
                          <div className="ord-info-label"><MdPhone size={11}/> Contact</div>
                          <div className="ord-info-val">{order?.userId?.name}</div>
                          <div className="ord-info-val sm" style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <MdPhone size={11}/> {addr?.mobile}
                          </div>
                          <div className="ord-info-val sm" style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
                            <MdEmail size={11}/> {order?.userId?.email}
                          </div>
                          <div style={{ marginTop:12 }}>
                            <div className="ord-info-label"><MdReceipt size={11}/> Payment</div>
                            {isCOD
                              ? <span className="ord-badge-cod">💵 Cash on Delivery</span>
                              : <div>
                                  <span className="ord-badge-paid">✓ Paid Online</span>
                                  <div className="ord-info-val sm" style={{ marginTop:5, fontSize:11 }}>
                                    ID: {order.paymentId}
                                  </div>
                                </div>
                            }
                          </div>
                        </div>
                      </div>

                      {/* Products */}
                      <div className="ord-products">
                        <div className="ord-products-title">
                          Products Ordered
                          <span className="ord-products-count">{order?.products?.length} items</span>
                        </div>

                        {order?.products?.map((item, i) => (
                          <div className="ord-product-item" key={i}>
                            {item?.image
                              ? <img src={item.image} alt={item.productTitle} className="ord-product-img"/>
                              : <div className="ord-product-placeholder"><FaBoxOpen size={20}/></div>
                            }
                            <div className="ord-product-info">
                              <div className="ord-product-name">{item?.productTitle}</div>
                              <div className="ord-meta-row">
                                {item?.color  && <span className="ord-meta-pill">🎨 {item.color}</span>}
                                {item?.size   && <span className="ord-meta-pill">📐 {item.size}</span>}
                                {item?.weight && <span className="ord-meta-pill">⚖️ {item.weight}</span>}
                                {item?.ram    && <span className="ord-meta-pill">💾 {item.ram}</span>}
                                <span className="ord-meta-pill">Qty: {item?.quantity}</span>
                              </div>
                            </div>
                            <div className="ord-product-right">
                              <div className="ord-product-total">{fmt(item?.price * item?.quantity)}</div>
                              <div className="ord-product-unit">{fmt(item?.price)} × {item?.quantity}</div>
                            </div>
                          </div>
                        ))}

                         <div className="ord-actions">
                          {status === "delivered" && !order?.returnRequest?.requested ? (
                            <button
                              className="ord-action-btn return"
                              onClick={() => requestReturn(order._id)}
                              disabled={loadingReturnId === order._id}
                            >
                              {loadingReturnId === order._id ? "Requesting..." : "Request Return & Refund"}
                            </button>
                          ) : (
                            <button className="ord-action-btn disabled" disabled>
                              {order?.refund?.status === "processed" ? "Refund Processed" : order?.returnRequest?.requested ? `Return ${order?.returnRequest?.status || "requested"}` : "Return available after delivery"}
                            </button>
                          )}
                        </div>
                        {(order?.returnRequest?.requested || order?.refund?.status === "processed") && (
                          <div className="ord-return-note">
                            Return: {order?.returnRequest?.status || "none"} • Refund: {order?.refund?.status || "none"}
                          </div>
                        )}

                        {/* Grand total */}
                        <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center",
                          gap:12, paddingTop:14, borderTop:"2px solid #f0f0f5", marginTop:6 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:"#6b7280" }}>Order Total</span>
                          <span style={{ fontSize:18, fontWeight:800, color:"#0a0a0f", fontFamily:"'Sora',sans-serif" }}>
                            {fmt(order?.totalAmt)}
                          </span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {orders?.totalPages > 1 && (
              <div className="ord-pagination">
                <Pagination
                  showFirstButton showLastButton
                  count={orders?.totalPages}
                  page={page}
                  onChange={(e, v) => setPage(v)}
                  sx={{
                    "& .MuiPaginationItem-root": { fontFamily:"'DM Sans',sans-serif", fontWeight:600 },
                    "& .Mui-selected": { background:"#0a0a0f !important", color:"#fff" },
                  }}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};

export default Orders;