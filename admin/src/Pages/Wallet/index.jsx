import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi, postData } from "../../utils/api";
import { FiClock, FiRefreshCw, FiFilter, FiChevronRight, FiFileText, FiUsers } from "react-icons/fi";
import { MdTrendingUp, MdOutlinePercent, MdOutlineWallet } from "react-icons/md";
import { BsArrowDownCircle, BsArrowUpCircle, BsCheckCircle, BsXCircle, BsExclamationCircle } from "react-icons/bs";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";

const StatusBadge = ({ status }) => {
  const map = {
    PENDING: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: <BsExclamationCircle size={11} /> },
    APPROVED: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <BsCheckCircle size={11} /> },
    REJECTED: { color: "bg-red-100 text-red-600 border-red-200", icon: <BsXCircle size={11} /> },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.color}`}>
      {s.icon} {status}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const isDeposit = type === "DEPOSIT";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${isDeposit ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
      {isDeposit ? <BsArrowDownCircle size={11} /> : <BsArrowUpCircle size={11} />}
      {type}
    </span>
  );
};

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className={`relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${color}`} />
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${color} bg-opacity-10`}>
      <span className={`${color.replace("bg-", "text-")}`}>{icon}</span>
    </div>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-0.5">
      <RiMoneyRupeeCircleLine size={18} className="text-gray-500" strokeWidth={2.5} />
      {(value || 0).toLocaleString("en-IN")}
    </h3>
    {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
  </div>
);

const WalletPage = () => {
  const context = useContext(MyContext);
  const isAdmin = context?.userData?.role === "ADMIN";
  const [overview, setOverview] = useState({ wallet: {}, transactions: [] });
  const [allSellers, setAllSellers] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("DEPOSIT");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");

  const loadData = async () => {
    setIsRefreshing(true);
    fetchDataFromApi("/api/user/wallet/overview").then((res) => {
      if (res?.success) setOverview(res);
      setIsRefreshing(false);
    });
    if (isAdmin) {
      fetchDataFromApi("/api/user/getAllUsers?page=1&limit=200").then((res) => {
        if (res?.success) {
          setAllSellers((res?.users || []).filter((u) => u.role === "SELLER"));
        }
      });
    }
  };

  useEffect(() => { loadData(); }, [isAdmin]);

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return context?.openAlertBox("error", "Please enter a valid amount");
    setIsSubmitting(true);
    const res = await postData("/api/user/wallet/request", { type, amount: Number(amount), note });
    if (res?.success) {
      context?.openAlertBox("success", "Wallet request sent successfully!");
      setAmount(""); setNote("");
      loadData();
    } else {
      context?.openAlertBox("error", res?.message || "Request failed");
    }
    setIsSubmitting(false);
  };

  const updateRequest = async (sellerId, transactionId, status) => {
    const res = await editData("/api/user/wallet/request/approve", { sellerId, transactionId, status });
    if (res?.success) {
      context?.openAlertBox("success", `Transaction ${status.toLowerCase()} successfully`);
      loadData();
    } else {
      context?.openAlertBox("error", res?.message || "Action failed");
    }
  };

  const filteredTransactions = (overview?.transactions || []).filter(
    (t) => filterStatus === "ALL" || t.status === filterStatus
  );

  const pendingCount = allSellers.reduce((acc, s) =>
    acc + (s.walletTransactions || []).filter((t) => t.status === "PENDING").length, 0
  );

  return (
    <section className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MdOutlineWallet size={24} className="text-[#2874f0]" />
            {isAdmin ? "Wallet Management" : "My Wallet"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin ? "Manage seller wallet requests" : "Track your earnings & transactions"}
          </p>
        </div>
        <button
          onClick={loadData}
          className={`flex items-center gap-2 text-sm text-[#2874f0] bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-all font-medium ${isRefreshing ? "opacity-60" : ""}`}
        >
          <FiRefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<MdOutlineWallet size={20} />} label="Available Balance" value={overview?.wallet?.availableBalance} color="bg-blue-500" sub="Ready to withdraw" />
        <StatCard icon={<FiClock size={20} />} label="Pending Commission" value={overview?.wallet?.pendingCommission} color="bg-amber-500" sub="Under review" />
        <StatCard icon={<MdOutlinePercent size={20} />} label="Total Commission Paid" value={overview?.wallet?.totalCommissionPaid} color="bg-emerald-500" sub="10% platform fee" />
      </div>

      {/* Seller: Request Form */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiFileText size={16} className="text-[#2874f0]" /> New Wallet Request
          </h2>
          <form onSubmit={submitRequest} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Type */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Transaction Type</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {["DEPOSIT", "WITHDRAW"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      type === t
                        ? t === "DEPOSIT"
                          ? "bg-blue-600 text-white"
                          : "bg-purple-600 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {t === "DEPOSIT" ? <BsArrowDownCircle size={14} /> : <BsArrowUpCircle size={14} />}
                    {t === "DEPOSIT" ? "Deposit" : "Withdraw"}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  required
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#2874f0] hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" /> Submitting...</>
                ) : (
                  <>Submit Request <FiChevronRight size={14} /></>
                )}
              </button>
            </div>
          </form>

          {/* Quick Amount Chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 mt-1">Quick:</span>
            {[500, 1000, 2000, 5000, 10000].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(q.toString())}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                ₹{q.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admin View */}
      {isAdmin ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FiUsers size={16} className="text-[#2874f0]" /> Seller Wallet Requests
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
              )}
            </h2>
          </div>

          <div className="space-y-4">
            {allSellers.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <FiUsers size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sellers found</p>
              </div>
            )}
            {allSellers.map((seller) => {
              const pending = (seller.walletTransactions || []).filter((t) => t.status === "PENDING");
              if (pending.length === 0) return null;
              return (
                <div key={seller._id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2874f0] text-white flex items-center justify-center text-sm font-bold">
                      {seller.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{seller.name}</p>
                      <p className="text-xs text-gray-400">{seller.email}</p>
                    </div>
                    <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{pending.length} pending</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {pending.map((t) => (
                      <div key={t._id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <TypeBadge type={t.type} />
                          <span className="font-bold text-gray-800">₹{(t.amount || 0).toLocaleString("en-IN")}</span>
                          {t.note && <span className="text-xs text-gray-400 hidden sm:inline">— {t.note}</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateRequest(seller._id, t._id, "APPROVED")}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          >
                            <BsCheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => updateRequest(seller._id, t._id, "REJECTED")}
                            className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          >
                            <BsXCircle size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {allSellers.every((s) => (s.walletTransactions || []).filter((t) => t.status === "PENDING").length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <BsCheckCircle size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No pending transactions</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Seller Transaction History */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <MdTrendingUp size={16} className="text-[#2874f0]" /> Transaction History
            </h2>
            <div className="flex items-center gap-2">
              <FiFilter size={14} className="text-gray-400" />
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-xs font-medium px-3 py-1.5 transition-all ${
                      filterStatus === s ? "bg-[#2874f0] text-white" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MdOutlineWallet size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No transactions found</p>
              <p className="text-xs">Submit a request to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((trx) => (
                <div key={trx._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${trx.type === "DEPOSIT" ? "bg-blue-50" : "bg-purple-50"}`}>
                      {trx.type === "DEPOSIT"
                        ? <BsArrowDownCircle size={18} className="text-blue-600" />
                        : <BsArrowUpCircle size={18} className="text-purple-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {trx.type === "DEPOSIT" ? "Money Added" : "Withdrawal"}
                      </p>
                      <p className="text-xs text-gray-400">{trx.note || "No note provided"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${trx.type === "DEPOSIT" ? "text-emerald-600" : "text-red-500"}`}>
                      {trx.type === "DEPOSIT" ? "+" : "-"}₹{(trx.amount || 0).toLocaleString("en-IN")}
                    </p>
                    <div className="mt-0.5 flex justify-end">
                      <StatusBadge status={trx.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default WalletPage;