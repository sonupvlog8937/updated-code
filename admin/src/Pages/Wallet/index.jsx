import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi, postData } from "../../utils/api";

const WalletPage = () => {
  const context = useContext(MyContext);
  const isAdmin = context?.userData?.role === "ADMIN";
  const [overview, setOverview] = useState({ wallet: {}, transactions: [] });
  const [allSellers, setAllSellers] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("DEPOSIT");
  const [note, setNote] = useState("");

  const loadData = () => {
    fetchDataFromApi("/api/user/wallet/overview").then((res) => {
      if (res?.success) setOverview(res);
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
    const res = await postData("/api/user/wallet/request", { type, amount: Number(amount), note });
    if (res?.success) {
      context?.openAlertBox("success", "Wallet request sent");
      setAmount("");
      setNote("");
      loadData();
    } else {
      context?.openAlertBox("error", res?.message || "Request failed");
    }
  };

  const updateRequest = async (sellerId, transactionId, status) => {
    const res = await editData("/api/user/wallet/request/approve", { sellerId, transactionId, status });
    if (res?.success) {
      context?.openAlertBox("success", `Transaction ${status.toLowerCase()}`);
      loadData();
    } else {
      context?.openAlertBox("error", res?.message || "Action failed");
    }
  };

  return (
    <section className="p-3 md:p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border rounded-md p-4"><p className="text-xs text-gray-500">Available Balance</p><h3 className="text-xl font-bold">₹{overview?.wallet?.availableBalance || 0}</h3></div>
        <div className="bg-white border rounded-md p-4"><p className="text-xs text-gray-500">Pending Commission</p><h3 className="text-xl font-bold">₹{overview?.wallet?.pendingCommission || 0}</h3></div>
        <div className="bg-white border rounded-md p-4"><p className="text-xs text-gray-500">Total Commission (10%)</p><h3 className="text-xl font-bold">₹{overview?.wallet?.totalCommissionPaid || 0}</h3></div>
      </div>

      {!isAdmin && (
        <form onSubmit={submitRequest} className="bg-white border rounded-md p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded px-3 py-2"><option value="DEPOSIT">Deposit</option><option value="WITHDRAW">Withdraw</option></select>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="border rounded px-3 py-2" required />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="border rounded px-3 py-2" />
          <Button type="submit" className="btn-blue">Submit Request</Button>
        </form>
      )}

      {isAdmin ? (
        <div className="bg-white border rounded-md p-4">
          <h3 className="font-bold mb-3">Pending Seller Transactions</h3>
          {allSellers.map((seller) => (
            <div key={seller._id} className="border rounded p-3 mb-3">
              <p className="font-semibold mb-2">{seller.name} ({seller.email})</p>
              {(seller.walletTransactions || []).filter((t) => t.status === "PENDING").map((t) => (
                <div key={t._id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-t pt-2 mt-2">
                  <p>{t.type} ₹{t.amount} - {t.note || "No note"}</p>
                  <div className="flex gap-2">
                    <Button onClick={() => updateRequest(seller._id, t._id, "APPROVED")} className="!bg-green-600 !text-white !px-3 !py-1 !text-xs">Approve</Button>
                    <Button onClick={() => updateRequest(seller._id, t._id, "REJECTED")} className="!bg-red-600 !text-white !px-3 !py-1 !text-xs">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-md p-4">
          <h3 className="font-bold mb-3">My Wallet Transactions</h3>
          {(overview?.transactions || []).map((trx) => (
            <div key={trx._id} className="flex items-center justify-between border-b py-2 text-sm">
              <p>{trx.type} • ₹{trx.amount} • {trx.note || "-"}</p>
              <span className="font-semibold">{trx.status}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default WalletPage;