import React, { useContext, useEffect, useState, useRef } from "react";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi, postData } from "../../utils/api";
import {
  FiRefreshCw, FiTrendingUp, FiTrendingDown, FiFilter,
  FiDownload, FiSearch, FiChevronDown, FiInfo, FiClock,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiArrowUpRight,
  FiArrowDownLeft, FiActivity, FiUsers, FiDollarSign,
  FiEye, FiEyeOff, FiCopy, FiCheck
} from "react-icons/fi";
import {
  MdOutlineWallet, MdOutlinePercent, MdSwapHoriz,
  MdOutlineAccountBalance, MdOutlineShield
} from "react-icons/md";
import { RiMoneyRupeeCircleLine, RiVipCrownLine } from "react-icons/ri";
import { BsGraphUp, BsLightningCharge } from "react-icons/bs";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => (v || 0).toLocaleString("en-IN");
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimCounter({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    const dur = 900;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.floor(ease * target));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <>{fmt(display)}</>;
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data = [], color = "#10b981", height = 36 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const areaD = `M0,${h} L${data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" L")} L${w},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#g${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} style={S.iconBtn} title="Copy">
      {copied ? <FiCheck size={12} color="#10b981" /> : <FiCopy size={12} color="#94A3B8" />}
    </button>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    PENDING:  { bg: "rgba(251,191,36,0.1)",  color: "#D97706", icon: <FiClock size={10} />,       label: "Pending"  },
    APPROVED: { bg: "rgba(16,185,129,0.1)",  color: "#059669", icon: <FiCheckCircle size={10} />, label: "Approved" },
    REJECTED: { bg: "rgba(239,68,68,0.1)",   color: "#DC2626", icon: <FiXCircle size={10} />,     label: "Rejected" },
  };
  const c = cfg[status] || cfg.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, fontFamily: "'DM Mono', monospace",
    }}>{c.icon} {c.label}</span>
  );
}

// ─── Type Pill ────────────────────────────────────────────────────────────────
function TypePill({ type }) {
  const isD = type === "DEPOSIT";
  const isC = type === "COMMISSION";
  const c = isC ? { bg: "rgba(139,92,246,0.1)", color: "#7C3AED", icon: <BsGraphUp size={10} /> }
    : isD ? { bg: "rgba(59,130,246,0.1)", color: "#2563EB", icon: <FiArrowDownLeft size={10} /> }
    : { bg: "rgba(234,88,12,0.1)", color: "#EA580C", icon: <FiArrowUpRight size={10} /> };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color
    }}>{c.icon} {type}</span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub, trend, sparkData, delay = 0 }) {
  return (
    <div style={{ ...S.card, animationDelay: `${delay}ms`, animation: "fadeUp 0.5s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${color}28`, color, flexShrink: 0
        }}>{icon}</div>
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <RiMoneyRupeeCircleLine size={16} color="#94A3B8" />
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
            <AnimCounter value={value} />
          </span>
        </div>
        {(sub || trend !== undefined) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            {trend !== undefined && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 11, fontWeight: 600,
                color: trend >= 0 ? "#059669" : "#DC2626"
              }}>
                {trend >= 0 ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                {Math.abs(trend)}%
              </span>
            )}
            {sub && <span style={{ fontSize: 11, color: "#94A3B8" }}>{sub}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 16, padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  iconBtn: {
    width: 28, height: 28, borderRadius: 8,
    background: "#F1F5F9", border: "1px solid #E2E8F0",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.15s", flexShrink: 0
  },
  input: {
    width: "100%", height: 44, background: "#F8FAFC",
    border: "1px solid #E2E8F0", borderRadius: 10,
    padding: "0 14px", fontSize: 14, color: "#0F172A", outline: "none",
    fontFamily: "'Outfit', sans-serif", boxSizing: "border-box", transition: "all 0.2s"
  },
  label: {
    fontSize: 11, fontWeight: 600, color: "#64748B",
    fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em",
    textTransform: "uppercase", display: "block", marginBottom: 7
  },
  tab: (active) => ({
    padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
    cursor: "pointer", border: "none", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
    background: active ? "#FF6B2B" : "transparent",
    color: active ? "#fff" : "#64748B",
  }),
  filterChip: (active, color = "#2563EB") => ({
    padding: "5px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: `1px solid ${active ? color + "50" : "#E2E8F0"}`,
    background: active ? color + "12" : "#F8FAFC",
    color: active ? color : "#64748B",
    transition: "all 0.2s", fontFamily: "'DM Mono', monospace"
  }),
  primaryBtn: {
    height: 44, borderRadius: 10, border: "none", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    transition: "all 0.2s",
  },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const WalletPage = () => {
  const context = useContext(MyContext);
  const isAdmin = context?.userData?.role === "ADMIN";
  const sellerName = context?.userData?.name || "Seller";
  const sellerStore = context?.userData?.storeProfile?.storeName || "";

  const [overview, setOverview] = useState({ wallet: {}, transactions: [] });
  const [allSellers, setAllSellers] = useState([]);
  const [amount, setAmount] = useState("");
  const [reqType, setReqType] = useState("DEPOSIT");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchSeller, setSearchSeller] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [adminTab, setAdminTab] = useState("pending");
  const [expandedSeller, setExpandedSeller] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [res, usersRes] = await Promise.all([
        fetchDataFromApi("/api/user/wallet/overview"),
        isAdmin ? fetchDataFromApi("/api/user/getAllUsers?page=1&limit=500") : Promise.resolve(null),
      ]);
      if (res?.success) setOverview(res);
      if (isAdmin && usersRes?.success)
        setAllSellers((usersRes.users || []).filter((u) => u.role === "SELLER"));
    } catch {
      // silent fail
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [isAdmin]);

  const txns = overview?.transactions || [];
  const totalIn  = txns.filter(t => t.type === "DEPOSIT"  && t.status === "APPROVED").reduce((a, t) => a + t.amount, 0);
  const totalOut = txns.filter(t => t.type === "WITHDRAW" && t.status === "APPROVED").reduce((a, t) => a + t.amount, 0);
  const pendingAmt = txns.filter(t => t.status === "PENDING").reduce((a, t) => a + t.amount, 0);

  const sparkDeposit  = txns.filter(t => t.type === "DEPOSIT"  && t.status === "APPROVED").slice(-7).map(t => t.amount);
  const sparkWithdraw = txns.filter(t => t.type === "WITHDRAW" && t.status === "APPROVED").slice(-7).map(t => t.amount);

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0)
      return context?.alertBox("error", "Enter a valid amount");
    if (reqType === "WITHDRAW" && Number(amount) > (overview?.wallet?.availableBalance || 0))
      return context?.alertBox("error", "Amount exceeds available balance");
    setIsSubmitting(true);
    try {
      const res = await postData("/api/user/wallet/request", { type: reqType, amount: Number(amount), note });
      if (res?.success) {
        context?.alertBox("success", "Request submitted successfully!");
        setAmount(""); setNote("");
        await loadData();
      } else {
        context?.alertBox("error", res?.message || "Request failed");
      }
    } catch {
      context?.alertBox("error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmAction = (sellerId, trxId, status) => setConfirming({ sellerId, trxId, status });

  const executeAction = async () => {
    if (!confirming) return;
    const { sellerId, trxId, status } = confirming;
    setConfirming(null);
    const res = await editData("/api/user/wallet/request/approve", { sellerId, transactionId: trxId, status });
    if (res?.success) {
      context?.alertBox("success", `Transaction ${status.toLowerCase()}`);
      loadData();
    } else {
      context?.alertBox("error", res?.message || "Action failed");
    }
  };

  const filteredTxns = txns.filter(t =>
    (filterStatus === "ALL" || t.status === filterStatus) &&
    (filterType === "ALL" || t.type === filterType)
  );

  const pendingCount = allSellers.reduce((a, s) =>
    a + (s.walletTransactions || []).filter(t => t.status === "PENDING").length, 0);

  const filteredSellers = allSellers.filter(s =>
    s.name?.toLowerCase().includes(searchSeller.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchSeller.toLowerCase())
  );

  const displayedSellers = adminTab === "pending"
    ? filteredSellers.filter(s => (s.walletTransactions || []).some(t => t.status === "PENDING"))
    : filteredSellers;

  const exportCSV = () => {
    const rows = [["Date", "Type", "Amount", "Status", "Note"]];
    txns.forEach(t => rows.push([fmtDate(t.createdAt), t.type, t.amount, t.status, t.note || ""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "wallet_transactions.csv";
    a.click();
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Outfit', sans-serif", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px);} to {opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #CBD5E1; }
        input:focus, textarea:focus, select:focus { border-color: #FF6B2B !important; box-shadow: 0 0 0 3px rgba(255,107,43,0.1); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
        .card-hover:hover { border-color: #CBD5E1 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
        .btn-ghost:hover { background: #F1F5F9 !important; }
        .seller-row:hover { background: #F8FAFC !important; }
        .txn-row:hover { background: #F8FAFC !important; }
        .quick-chip:hover { border-color: #FF6B2B !important; color: #FF6B2B !important; background: rgba(255,107,43,0.06) !important; }
        .refresh-spin { animation: spin 1s linear infinite; }
        select option { background: #fff; color: #0F172A; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12, animation: "fadeUp 0.4s ease both" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MdOutlineWallet size={18} color="#FF6B2B" />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                  {isAdmin ? "Wallet Management" : "My Wallet"}
                </h1>
                {!isAdmin && sellerStore && (
                  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{sellerStore}</p>
                )}
              </div>
            </div>
            {isAdmin && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{allSellers.length} sellers registered</span>
                {pendingCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                    background: "rgba(217,119,6,0.1)", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)",
                    animation: "pulse 2s ease infinite" }}>
                    {pendingCount} pending
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!isAdmin && (
              <button onClick={exportCSV} style={{
                ...S.primaryBtn, padding: "0 16px", background: "#F1F5F9",
                color: "#64748B", border: "1px solid #E2E8F0", fontSize: 13
              }} className="btn-ghost">
                <FiDownload size={14} /> Export
              </button>
            )}
            <button onClick={loadData} disabled={isRefreshing} style={{
              ...S.primaryBtn, padding: "0 16px",
              background: isRefreshing ? "rgba(255,107,43,0.08)" : "rgba(255,107,43,0.1)",
              color: "#FF6B2B", border: "1px solid rgba(255,107,43,0.2)", fontSize: 13
            }}>
              <FiRefreshCw size={13} className={isRefreshing ? "refresh-spin" : ""} />
              {isRefreshing ? "Syncing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* ── SELLER VIEW ──────────────────────────────────────────────────── */}
        {!isAdmin && (
          <>
            {/* Balance Hero Card */}
            <div style={{ ...S.card,
              background: "linear-gradient(135deg, #FF6B2B 0%, #FF8C55 60%, #FFB347 100%)",
              border: "none", marginBottom: 20, position: "relative", overflow: "hidden",
              animation: "fadeUp 0.4s ease both", boxShadow: "0 8px 32px rgba(255,107,43,0.3)" }}>
              {/* Decorative */}
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200,
                borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ position: "absolute", bottom: -40, left: "40%", width: 140, height: 140,
                borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)",
                    fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Available Balance
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setShowBalance(!showBalance)}
                      style={{ ...S.iconBtn, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
                      className="btn-ghost">
                      {showBalance
                        ? <FiEye size={13} color="rgba(255,255,255,0.9)" />
                        : <FiEyeOff size={13} color="rgba(255,255,255,0.9)" />}
                    </button>
                    <div style={{ ...S.iconBtn, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                      <MdOutlineShield size={13} color="rgba(255,255,255,0.9)" />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <RiMoneyRupeeCircleLine size={24} color="rgba(255,255,255,0.85)" />
                  <span style={{ fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {showBalance ? <AnimCounter value={overview?.wallet?.availableBalance} /> : "••••••"}
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 20, paddingTop: 20,
                  borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                  {[
                    { label: "Total Deposited", val: overview?.wallet?.totalDeposited,       color: "rgba(255,255,255,0.9)", icon: <FiArrowDownLeft size={12} /> },
                    { label: "Total Withdrawn",  val: overview?.wallet?.totalWithdrawn,       color: "rgba(255,255,255,0.9)", icon: <FiArrowUpRight size={12} /> },
                    { label: "Commission Paid",  val: overview?.wallet?.totalCommissionPaid,  color: "rgba(255,255,255,0.9)", icon: <MdOutlinePercent size={12} /> },
                    { label: "Pending",          val: pendingAmt,                             color: "rgba(255,255,255,0.9)", icon: <FiClock size={12} /> },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.icon}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Mono', monospace" }}>
                          {item.label}
                        </span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                        ₹{showBalance ? fmt(item.val) : "•••"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stat Cards Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
              <StatCard icon={<FiArrowDownLeft size={18} />} label="Total In" value={totalIn}
                color="#2563EB" sub="Approved deposits" trend={2.4} sparkData={sparkDeposit} delay={0} />
              <StatCard icon={<FiArrowUpRight size={18} />} label="Total Out" value={totalOut}
                color="#EA580C" sub="Approved withdrawals" sparkData={sparkWithdraw} delay={80} />
              <StatCard icon={<FiClock size={18} />} label="Pending" value={pendingAmt}
                color="#D97706" sub="Awaiting approval" delay={160} />
              <StatCard icon={<BsGraphUp size={18} />} label="Commission" value={overview?.wallet?.pendingCommission}
                color="#7C3AED" sub="Under review" delay={240} />
            </div>

            {/* Tab Nav */}
            <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "#F1F5F9",
              border: "1px solid #E2E8F0", borderRadius: 12, padding: 4, width: "fit-content" }}>
              {[["overview", "Overview"], ["transactions", "History"], ["request", "New Request"]].map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)} style={S.tab(activeTab === k)}>{l}</button>
              ))}
            </div>

            {/* ── Overview Tab ─────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.3s ease both" }}>
                <div style={{ ...S.card, gridColumn: "1 / -1" }} className="card-hover">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                      <FiActivity size={14} color="#FF6B2B" /> Recent Activity
                    </h3>
                    <button onClick={() => setActiveTab("transactions")} style={{
                      fontSize: 12, color: "#FF6B2B", background: "none", border: "none", cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif", fontWeight: 600
                    }}>View All →</button>
                  </div>
                  {txns.slice(0, 5).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#CBD5E1" }}>
                      <MdOutlineWallet size={36} style={{ marginBottom: 8, opacity: 0.4 }} />
                      <p style={{ fontSize: 13 }}>No transactions yet</p>
                    </div>
                  ) : (
                    <div>
                      {txns.slice(0, 5).map((t) => (
                        <div key={t._id} className="txn-row" style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 8px", borderRadius: 10, transition: "background 0.15s"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                              background: t.type === "DEPOSIT" ? "rgba(37,99,235,0.08)" : t.type === "COMMISSION" ? "rgba(124,58,237,0.08)" : "rgba(234,88,12,0.08)",
                            }}>
                              {t.type === "DEPOSIT" ? <FiArrowDownLeft size={16} color="#2563EB" />
                                : t.type === "COMMISSION" ? <BsGraphUp size={15} color="#7C3AED" />
                                : <FiArrowUpRight size={16} color="#EA580C" />}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                {t.type === "DEPOSIT" ? "Money Deposited" : t.type === "COMMISSION" ? "Commission" : "Withdrawal"}
                              </p>
                              <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                                {fmtDate(t.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 14, fontWeight: 700,
                              color: t.type === "WITHDRAW" ? "#EA580C" : t.type === "COMMISSION" ? "#7C3AED" : "#059669" }}>
                              {t.type === "WITHDRAW" ? "-" : "+"}₹{fmt(t.amount)}
                            </p>
                            <div style={{ marginTop: 4 }}><StatusBadge status={t.status} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Transactions Tab ──────────────────────────────────────── */}
            {activeTab === "transactions" && (
              <div style={{ ...S.card, animation: "fadeUp 0.3s ease both" }} className="card-hover">
                {/* Filters */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Mono', monospace" }}>STATUS</span>
                    {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)}
                        style={S.filterChip(filterStatus === s, s === "APPROVED" ? "#059669" : s === "REJECTED" ? "#DC2626" : s === "PENDING" ? "#D97706" : "#2563EB")}>
                        {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Mono', monospace" }}>TYPE</span>
                    {["ALL", "DEPOSIT", "WITHDRAW", "COMMISSION"].map(t => (
                      <button key={t} onClick={() => setFilterType(t)}
                        style={S.filterChip(filterType === t, t === "DEPOSIT" ? "#2563EB" : t === "WITHDRAW" ? "#EA580C" : "#7C3AED")}>
                        {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                  <button onClick={exportCSV} style={{
                    ...S.primaryBtn, padding: "0 14px", height: 36, fontSize: 12,
                    background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0"
                  }} className="btn-ghost">
                    <FiDownload size={12} /> CSV
                  </button>
                </div>

                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
                  {filteredTxns.length} transaction{filteredTxns.length !== 1 ? "s" : ""}
                </div>

                {filteredTxns.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#CBD5E1" }}>
                    <FiFilter size={32} style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>No matching transactions</p>
                  </div>
                ) : (
                  <div>
                    {filteredTxns.map((t, i) => (
                      <div key={t._id} className="txn-row" style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 10px", borderRadius: 10, transition: "background 0.15s",
                        borderBottom: i < filteredTxns.length - 1 ? "1px solid #F1F5F9" : "none"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                            background: t.type === "DEPOSIT" ? "rgba(37,99,235,0.08)" : t.type === "COMMISSION" ? "rgba(124,58,237,0.08)" : "rgba(234,88,12,0.08)"
                          }}>
                            {t.type === "DEPOSIT" ? <FiArrowDownLeft size={17} color="#2563EB" />
                              : t.type === "COMMISSION" ? <BsGraphUp size={15} color="#7C3AED" />
                              : <FiArrowUpRight size={17} color="#EA580C" />}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                {t.type === "DEPOSIT" ? "Deposit" : t.type === "COMMISSION" ? "Commission Earned" : "Withdrawal"}
                              </p>
                              <TypePill type={t.type} />
                            </div>
                            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
                              {fmtDate(t.createdAt)}{t.note ? ` · ${t.note}` : ""}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 800,
                            color: t.type === "WITHDRAW" ? "#EA580C" : t.type === "COMMISSION" ? "#7C3AED" : "#059669" }}>
                            {t.type === "WITHDRAW" ? "−" : "+"}₹{fmt(t.amount)}
                          </p>
                          <div style={{ marginTop: 5 }}><StatusBadge status={t.status} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── New Request Tab ───────────────────────────────────────── */}
            {activeTab === "request" && (
              <div style={{ maxWidth: 520, animation: "fadeUp 0.3s ease both" }}>
                <div style={{ ...S.card }} className="card-hover">
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
                    New Wallet Request
                  </h3>
                  <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 24 }}>
                    Submit a deposit or withdrawal request
                  </p>

                  {/* Type Toggle */}
                  <div style={{ marginBottom: 20 }}>
                    <span style={S.label}>Request Type</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { k: "DEPOSIT",  label: "Deposit",    icon: <FiArrowDownLeft size={16} />, color: "#2563EB" },
                        { k: "WITHDRAW", label: "Withdrawal", icon: <FiArrowUpRight  size={16} />, color: "#EA580C" },
                      ].map(({ k, label, icon, color }) => (
                        <button key={k} type="button" onClick={() => setReqType(k)} style={{
                          height: 56, borderRadius: 12,
                          border: `1.5px solid ${reqType === k ? color : "#E2E8F0"}`,
                          background: reqType === k ? `${color}08` : "#F8FAFC",
                          color: reqType === k ? color : "#94A3B8",
                          cursor: "pointer", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
                          fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                        }}>
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={submitRequest}>
                    {/* Amount */}
                    <div style={{ marginBottom: 16 }}>
                      <span style={S.label}>Amount (₹)</span>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                          color: "#94A3B8", fontSize: 16 }}>₹</span>
                        <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                          placeholder="0.00" style={{ ...S.input, paddingLeft: 32, fontSize: 20, fontWeight: 700, height: 52 }} />
                      </div>

                      {reqType === "WITHDRAW" && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>Available</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>
                            ₹{fmt(overview?.wallet?.availableBalance)}
                          </span>
                        </div>
                      )}

                      {/* Quick amounts */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                        <span style={{ fontSize: 11, color: "#CBD5E1", alignSelf: "center" }}>Quick:</span>
                        {[500, 1000, 2000, 5000, 10000, 25000].map(q => (
                          <button key={q} type="button" className="quick-chip" onClick={() => setAmount(q.toString())} style={{
                            fontSize: 12, padding: "4px 12px", borderRadius: 100,
                            border: `1px solid ${amount == q ? "rgba(255,107,43,0.4)" : "#E2E8F0"}`,
                            background: amount == q ? "rgba(255,107,43,0.08)" : "#F8FAFC",
                            color: amount == q ? "#FF6B2B" : "#64748B",
                            cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Mono', monospace"
                          }}>₹{q.toLocaleString("en-IN")}</button>
                        ))}
                      </div>
                    </div>

                    {/* Note */}
                    <div style={{ marginBottom: 24 }}>
                      <span style={S.label}>Note (optional)</span>
                      <textarea value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Add a note for this request…"
                        style={{ ...S.input, height: 80, padding: "12px 14px", resize: "none", lineHeight: 1.5 }} />
                    </div>

                    {/* Info box */}
                    <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10,
                      background: "rgba(255,107,43,0.05)", border: "1px solid rgba(255,107,43,0.15)", marginBottom: 20 }}>
                      <FiInfo size={14} color="#FF6B2B" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                        Requests are reviewed within 24–48 hours. You'll be notified once processed.
                      </p>
                    </div>

                    <button type="submit" disabled={isSubmitting} style={{
                      ...S.primaryBtn, width: "100%",
                      background: isSubmitting
                        ? "#F1F5F9"
                        : reqType === "DEPOSIT"
                          ? "linear-gradient(135deg, #2563EB, #3B82F6)"
                          : "linear-gradient(135deg, #EA580C, #FB923C)",
                      color: isSubmitting ? "#94A3B8" : "#fff",
                      fontSize: 15, height: 50
                    }}>
                      {isSubmitting ? "Submitting…" : reqType === "DEPOSIT" ? "Submit Deposit Request" : "Submit Withdrawal Request"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ADMIN VIEW ───────────────────────────────────────────────────── */}
        {isAdmin && (
          <>
            {/* Admin stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { icon: <FiUsers size={18}/>, label: "Total Sellers",      value: allSellers.length,   color: "#2563EB", isCurrency: false },
                { icon: <FiAlertCircle size={18}/>, label: "Pending Requests", value: pendingCount,    color: "#D97706", isCurrency: false },
                { icon: <MdOutlineAccountBalance size={18}/>, label: "Total Balance", color: "#059669",
                  value: allSellers.reduce((a,s) => a + (s.wallet?.availableBalance||0), 0) },
                { icon: <BsLightningCharge size={18}/>, label: "Pending Amount", color: "#7C3AED",
                  value: allSellers.reduce((a,s) => a + (s.walletTransactions||[]).filter(t=>t.status==="PENDING").reduce((b,t)=>b+t.amount,0), 0) },
              ].map((c, i) => (
                <div key={c.label} style={{ ...S.card, animationDelay: `${i*60}ms`, animation: "fadeUp 0.5s ease both" }}
                  className="card-hover">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color}12`,
                    border: `1px solid ${c.color}25`, display: "flex", alignItems: "center", justifyContent: "center",
                    color: c.color, marginBottom: 14 }}>{c.icon}</div>
                  <p style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
                    {c.isCurrency === false ? c.value : `₹${fmt(c.value)}`}
                  </p>
                </div>
              ))}
            </div>

            {/* Search + Tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ position: "relative", flex: "1 1 240px" }}>
                <FiSearch size={14} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={searchSeller} onChange={e => setSearchSeller(e.target.value)}
                  placeholder="Search sellers…" style={{ ...S.input, paddingLeft: 36 }} />
              </div>
              <div style={{ display: "flex", gap: 4, background: "#F1F5F9",
                border: "1px solid #E2E8F0", borderRadius: 10, padding: 4 }}>
                {[["pending", "Pending"], ["all", "All Sellers"]].map(([k, l]) => (
                  <button key={k} onClick={() => setAdminTab(k)} style={S.tab(adminTab === k)}>{l}</button>
                ))}
              </div>
            </div>

            {/* Sellers List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeUp 0.4s ease both" }}>
              {displayedSellers.length === 0 && (
                <div style={{ ...S.card, textAlign: "center", padding: "48px 20px" }}>
                  <FiUsers size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: "#94A3B8", fontWeight: 500 }}>
                    {adminTab === "pending" ? "No pending requests 🎉" : "No sellers found"}
                  </p>
                </div>
              )}
              {displayedSellers.map(seller => {
                const pendingTxns = (seller.walletTransactions || []).filter(t => t.status === "PENDING");
                const allTxns    = seller.walletTransactions || [];
                const isExp = expandedSeller === seller._id;
                return (
                  <div key={seller._id} style={{ ...S.card, padding: 0, overflow: "hidden" }} className="card-hover">
                    {/* Seller Header */}
                    <button onClick={() => setExpandedSeller(isExp ? null : seller._id)} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
                      background: "none", border: "none", cursor: "pointer", textAlign: "left"
                    }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                        background: `hsl(${seller.name?.charCodeAt(0) * 15}, 55%, 55%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: "#fff" }}>
                        {seller.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{seller.name}</span>
                          {seller.storeProfile?.storeName && (
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100,
                              background: "rgba(255,107,43,0.08)", color: "#FF6B2B",
                              fontFamily: "'DM Mono', monospace" }}>
                              {seller.storeProfile.storeName}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{seller.email}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>
                            ₹{fmt(seller.wallet?.availableBalance)}
                          </p>
                          <p style={{ fontSize: 11, color: "#94A3B8" }}>balance</p>
                        </div>
                        {pendingTxns.length > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                            background: "rgba(217,119,6,0.1)", color: "#D97706",
                            border: "1px solid rgba(217,119,6,0.2)" }}>
                            {pendingTxns.length} pending
                          </span>
                        )}
                        <FiChevronDown size={16} color="#CBD5E1"
                          style={{ transition: "transform 0.2s", transform: isExp ? "rotate(180deg)" : "rotate(0)" }} />
                      </div>
                    </button>

                    {/* Expanded Transactions */}
                    {isExp && (
                      <div style={{ borderTop: "1px solid #F1F5F9", padding: "0 20px 16px" }}>
                        {/* Mini stats */}
                        <div style={{ display: "flex", gap: 24, padding: "14px 0 14px",
                          borderBottom: "1px solid #F8FAFC", flexWrap: "wrap" }}>
                          {[
                            ["Deposited", seller.wallet?.totalDeposited, "#2563EB"],
                            ["Withdrawn", seller.wallet?.totalWithdrawn, "#EA580C"],
                            ["Commission", seller.wallet?.totalCommissionPaid, "#7C3AED"],
                            ["Txns", allTxns.length, "#D97706"],
                          ].map(([l, v, c]) => (
                            <div key={l}>
                              <p style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'DM Mono', monospace",
                                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{l}</p>
                              <p style={{ fontSize: 14, fontWeight: 700, color: c }}>
                                {l === "Txns" ? v : `₹${fmt(v)}`}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Transactions */}
                        {allTxns.length === 0 ? (
                          <p style={{ fontSize: 13, color: "#CBD5E1", textAlign: "center", padding: "20px 0" }}>
                            No transactions
                          </p>
                        ) : (
                          <div style={{ marginTop: 12 }}>
                            {allTxns.slice().reverse().map(t => (
                              <div key={t._id} className="seller-row" style={{
                                display: "flex", flexWrap: "wrap", alignItems: "center",
                                justifyContent: "space-between", padding: "10px 8px", borderRadius: 10,
                                gap: 10, transition: "background 0.15s"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <TypePill type={t.type} />
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                                    ₹{fmt(t.amount)}
                                  </span>
                                  {t.note && <span style={{ fontSize: 12, color: "#94A3B8" }}>— {t.note}</span>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{fmtDate(t.createdAt)}</span>
                                  <StatusBadge status={t.status} />
                                  {t.status === "PENDING" && (
                                    <>
                                      <button onClick={() => confirmAction(seller._id, t._id, "APPROVED")} style={{
                                        ...S.primaryBtn, height: 30, padding: "0 12px", fontSize: 12,
                                        background: "rgba(5,150,105,0.08)", color: "#059669",
                                        border: "1px solid rgba(5,150,105,0.2)"
                                      }} className="btn-ghost">
                                        <FiCheckCircle size={11} /> Approve
                                      </button>
                                      <button onClick={() => confirmAction(seller._id, t._id, "REJECTED")} style={{
                                        ...S.primaryBtn, height: 30, padding: "0 12px", fontSize: 12,
                                        background: "rgba(220,38,38,0.06)", color: "#DC2626",
                                        border: "1px solid rgba(220,38,38,0.15)"
                                      }} className="btn-ghost">
                                        <FiXCircle size={11} /> Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Confirm Modal ─────────────────────────────────────────────────── */}
      {confirming && (
        <div onClick={() => setConfirming(null)} style={{
          position: "fixed", inset: 0, zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)"
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            ...S.card, maxWidth: 380, width: "90%", padding: 28,
            border: `1.5px solid ${confirming.status === "APPROVED" ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            animation: "fadeUp 0.25s ease both"
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center",
              background: confirming.status === "APPROVED" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.08)",
              color: confirming.status === "APPROVED" ? "#059669" : "#DC2626" }}>
              {confirming.status === "APPROVED" ? <FiCheckCircle size={24} /> : <FiXCircle size={24} />}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
              {confirming.status === "APPROVED" ? "Approve Transaction?" : "Reject Transaction?"}
            </h3>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginBottom: 24 }}>
              {confirming.status === "APPROVED"
                ? "This will approve the transaction and update the seller's wallet balance."
                : "This will reject the transaction. This action cannot be undone."}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirming(null)} style={{
                ...S.primaryBtn, flex: 1, height: 42, fontSize: 13,
                background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0"
              }} className="btn-ghost">Cancel</button>
              <button onClick={executeAction} style={{
                ...S.primaryBtn, flex: 2, height: 42, fontSize: 13,
                background: confirming.status === "APPROVED"
                  ? "linear-gradient(135deg, #059669, #10b981)"
                  : "linear-gradient(135deg, #DC2626, #EF4444)",
                color: "#fff"
              }}>
                {confirming.status === "APPROVED" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;