import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button, CircularProgress } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiCheckCircle, FiExternalLink, FiMessageSquare, FiTrash2, FiSearch, FiX, FiArrowLeft } from "react-icons/fi";
import { deleteData, editData, fetchDataFromApi } from "../../utils/api";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const timeAgo = (d) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const groupLabel = (d) => {
  if (!d) return "Earlier";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  const days = Math.floor(diff / 86400000);
  if (days < 7) return "This Week";
  return "Earlier";
};

const FILTER_TABS = [
  { label: "All", emoji: "🔔" },
  { label: "Orders", emoji: "🛍" },
  { label: "Offers", emoji: "🎁" },
  { label: "Shipping", emoji: "🚚" },
  { label: "System", emoji: "⚙️" },
];

/* ─── Component ────────────────────────────────────────────────────────────── */
const NotificationsPage = () => {
  const nav = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [reviewProducts, setReviewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  
  // Search & Filter State
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((item) => item?.unread).length,
    [notifications]
  );

  const loadNotifications = async () => {
    setLoading(true);
    const [notificationRes, ordersRes] = await Promise.all([
      fetchDataFromApi("/api/notifications"),
      fetchDataFromApi("/api/order/order-list/orders?page=1&limit=20"),
    ]);

    if (notificationRes?.success) {
      // Ensure each notification has a default category if missing from API
      const mappedNotifs = (notificationRes.data || []).map(n => ({
        ...n,
        category: n.category || "System" 
      }));
      setNotifications(mappedNotifs);
    }

    if (ordersRes?.success) {
      const products = (ordersRes?.data || [])
        .filter((order) => ["confirm", "delivered", "shipped"].includes(String(order?.order_status || "").toLowerCase()))
        .flatMap((order) =>
          (order?.products || []).map((product) => ({
            productId: product?.productId,
            productTitle: product?.productTitle,
            image: product?.image,
            orderId: order?._id,
          }))
        )
        .filter((item) => item?.productId);

      const seen = new Set();
      const deduped = products.filter((item) => {
        if (seen.has(item.productId)) return false;
        seen.add(item.productId);
        return true;
      });

      setReviewProducts(deduped.slice(0, 6));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  /* ─── API Actions ─── */
  const markAllRead = async () => {
    setBusyId("all");
    const res = await editData("/api/notifications/read-all", {});
    setBusyId("");
    if (res?.data?.success) loadNotifications();
  };

  const markRead = async (id) => {
    setBusyId(id);
    await editData(`/api/notifications/${id}/read`, {});
    setBusyId("");
    // Optimistic UI update for immediate feedback
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, unread: false } : n));
  };

  const dismissNotification = async (id) => {
    setBusyId(`delete-${id}`);
    await deleteData(`/api/notifications/${id}`);
    setBusyId("");
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  /* ─── Filter & Search Logic ─── */
  const countByCategory = (cat) => notifications.filter(n => (n.category || "System") === cat && n.unread).length;

  const filtered = notifications.filter(n => {
    const matchFilter = filter === "All" || (n.category || "System") === filter;
    const matchSearch = !search || 
      n.title?.toLowerCase().includes(search.toLowerCase()) || 
      n.message?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const groups = [...new Set(filtered.map(n => groupLabel(n.createdAt || n.time)))];

  return (
    <section className="py-3 lg:py-8 w-full bg-[#f6f8fc] min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="container mx-auto px-4 max-w-[1000px] space-y-5">
        
        {/* Top Header Navigation (Mobile Friendly) */}
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => nav(-1)} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
            <FiArrowLeft size={18} />
          </button>
          <h1 className="text-[20px] font-[800] text-slate-800 tracking-tight">Notification Center</h1>
        </div>

        {/* Hero Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#F4611A] to-[#FF8C38] p-6 text-white shadow-lg shadow-orange-500/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/80">Account Alerts</p>
              <h1 className="text-[26px] font-[800] mt-1 tracking-tight">Stay updated with your orders</h1>
              <p className="text-[14px] text-white/90 mt-2">Track shipments, offers, and alerts in one place.</p>
            </div>
            <div className="bg-white/20 border border-white/30 rounded-xl px-5 py-4 min-w-[140px] backdrop-blur-sm text-center">
              <p className="text-[12px] text-white/80 font-medium">Unread</p>
              <p className="text-[32px] font-[800] leading-none mt-1">{unreadCount}</p>
            </div>
          </div>
        </div>

        {/* Notifications Main Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          
          {/* Header & Mark All Read */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-[18px] font-[700] text-slate-800 flex items-center gap-2">
              <FiBell className="text-[#F4611A]" /> Recent Notifications
            </h2>
            {unreadCount > 0 && (
               <Button 
                 variant="contained" 
                 onClick={markAllRead} 
                 disabled={busyId === "all"}
                 sx={{ backgroundColor: "#1e293b", textTransform: "none", borderRadius: "8px" }}
               >
                 {busyId === "all" ? <CircularProgress size={16} color="inherit" /> : "Mark all as read"}
               </Button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-6">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-[#F4611A] focus-within:ring-2 focus-within:ring-[#F4611A]/10 transition-all">
              <FiSearch className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search notifications..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="flex-1 bg-transparent outline-none text-[14px] text-slate-700 placeholder:text-slate-400"
              />
              {search && <button onClick={() => setSearch("")}><FiX className="text-slate-400 hover:text-slate-700" /></button>}
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {FILTER_TABS.map(t => {
                const cnt = t.label === "All" ? unreadCount : countByCategory(t.label);
                const isActive = filter === t.label;
                return (
                  <button 
                    key={t.label} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-[600] border transition-all whitespace-nowrap
                      ${isActive ? "bg-[#F4611A] border-[#F4611A] text-white shadow-md shadow-orange-500/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    onClick={() => setFilter(t.label)}
                  >
                    <span>{t.emoji}</span> {t.label}
                    {cnt > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-[800] ${isActive ? "bg-white/20 text-white" : "bg-orange-100 text-[#F4611A]"}`}>
                        {cnt}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List Area */}
          {loading ? (
            <div className="py-12 text-center flex justify-center"><CircularProgress sx={{ color: "#F4611A" }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 border border-dashed rounded-xl border-slate-200 bg-slate-50">
              <div className="text-4xl mb-3">{search ? "🔍" : "🎉"}</div>
              <p className="text-[16px] font-[700] text-slate-700">{search ? "No results found" : "You're all caught up!"}</p>
              <p className="text-[13px] text-slate-500 mt-1">{search ? `No matches for "${search}"` : "We'll show your important updates here."}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map(group => (
                <div key={group}>
                  {/* Group Label (Today, Yesterday, etc.) */}
                  <div className="flex items-center gap-3 text-[11px] font-[800] tracking-widest uppercase text-slate-400 mb-3">
                    {group}
                    <div className="flex-1 h-px bg-slate-100"></div>
                  </div>

                  {/* Group Items */}
                  <div className="space-y-3">
                    {filtered.filter(n => groupLabel(n.createdAt || n.time) === group).map((item) => (
                      <div
                        key={item._id}
                        className={`relative rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 
                          ${item.unread ? "border-orange-200 bg-orange-50/40" : "border-slate-100 bg-white"}`}
                      >
                        {item.unread && <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#F4611A] ring-4 ring-[#F4611A]/10"></div>}
                        
                        <div className="flex flex-col md:flex-row md:items-start gap-3 md:justify-between pr-4">
                          <div>
                            <span className="inline-block text-[10px] font-[800] tracking-wider uppercase text-[#F4611A] bg-orange-100 px-2 py-0.5 rounded-md mb-2">
                              {item.category || "System"}
                            </span>
                            <h3 className="text-[15px] font-[700] text-slate-800 leading-tight">{item.title}</h3>
                            <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{item.message || item.desc}</p>
                            
                            <div className="text-[11.5px] text-slate-400 mt-3 font-medium flex items-center gap-2">
                              {timeAgo(item.createdAt || item.time)}
                            </div>

                            {item?.actionUrl && (
                              <Link
                                to={item.actionUrl}
                                className="inline-flex items-center gap-1.5 text-[12.5px] text-[#F4611A] font-[700] mt-3 hover:underline"
                              >
                                View Details <FiExternalLink size={14} />
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-3 md:mt-0">
                            {item.unread && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<FiCheckCircle />}
                                onClick={() => markRead(item._id)}
                                disabled={busyId === item._id}
                                sx={{ color: "#10b981", borderColor: "#10b981", textTransform: "none", borderRadius: "8px" }}
                              >
                                Read
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<FiTrash2 />}
                              onClick={() => dismissNotification(item._id)}
                              disabled={busyId === `delete-${item._id}`}
                              sx={{ color: "#ef4444", textTransform: "none", borderRadius: "8px" }}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Products Section */}
        {reviewProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[18px] font-[700] text-slate-800 flex items-center gap-2">
                  <FiMessageSquare className="text-blue-600" /> Review recent purchases
                </h2>
                <p className="text-[13px] text-slate-500 mt-0.5">Help others by sharing your experience</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {reviewProducts.map((item) => (
                <div key={item.productId} className="border border-slate-100 rounded-xl p-3 hover:shadow-md transition-all group">
                  <div className="w-full h-[140px] rounded-lg bg-slate-50 overflow-hidden mb-3 border border-slate-50 relative">
                    <img
                      src={item?.image || "/homeBannerPlaceholder.jpg"}
                      alt={item?.productTitle || "Product"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[13px] font-[600] text-slate-800 line-clamp-2 min-h-[38px] leading-snug">{item.productTitle || "Product"}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium tracking-wide">ORDER #{String(item.orderId || "").slice(-6).toUpperCase()}</p>
                  <Link to={`/product/${item.productId}#reviews`}>
                    <Button 
                      fullWidth 
                      size="small" 
                      variant="contained" 
                      sx={{ mt: 1.5, backgroundColor: "#1d4ed8", textTransform: "none", fontWeight: 600, borderRadius: "8px", boxShadow: "none" }}
                    >
                      Write a review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default NotificationsPage;