import React, { useEffect, useState } from "react";
import { fetchDataFromApi, editData } from "../../utils/api";
import { Button, MenuItem, Select } from "@mui/material";
import toast from "react-hot-toast";

const statusColors = {
  approved: "text-green-600",
  pending: "text-amber-600",
  rejected: "text-red-500",
  blocked: "text-gray-500",
};

export default function Sellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadSellers = async () => {
    setLoading(true);
    const query = statusFilter === "all" ? "" : `?status=${statusFilter}`;
    const res = await fetchDataFromApi(`/api/admin/sellers${query}`);
    setSellers(res?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSellers();
  }, [statusFilter]);

  const handleAction = async (id, action, body = {}) => {
    const res = await editData(`/api/admin/sellers/${id}/${action}`, body);
    if (res?.data?.success) {
      toast.success(res?.data?.message || "Updated");
      loadSellers();
    } else {
      toast.error(res?.data?.message || "Update failed");
    }
  };

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[20px] font-[700]">Seller Management</h2>
          <p className="text-[13px] text-[rgba(0,0,0,0.6)]">Approve, reject, block and configure seller commission.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter:</span>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small">
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="blocked">Blocked</MenuItem>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f8f9fb]">
              <th className="text-left p-3 text-xs uppercase">Store</th>
              <th className="text-left p-3 text-xs uppercase">Owner</th>
              <th className="text-left p-3 text-xs uppercase">Commission</th>
              <th className="text-left p-3 text-xs uppercase">Status</th>
              <th className="text-right p-3 text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan="5">Loading sellers...</td></tr>
            ) : sellers.length === 0 ? (
              <tr><td className="p-4" colSpan="5">No sellers found.</td></tr>
            ) : sellers.map((seller) => (
              <tr className="border-b" key={seller._id}>
                <td className="p-3">
                  <p className="font-[600]">{seller.storeName}</p>
                  <p className="text-xs text-gray-500">/{seller.storeSlug}</p>
                </td>
                <td className="p-3">
                  <p>{seller?.userId?.name || "-"}</p>
                  <p className="text-xs text-gray-500">{seller?.userId?.email || "-"}</p>
                </td>
                <td className="p-3">{seller.commission || 0}%</td>
                <td className={`p-3 font-[600] capitalize ${statusColors[seller.status] || "text-gray-700"}`}>{seller.status}</td>
                <td className="p-3">
                  <div className="flex justify-end flex-wrap gap-2">
                    <Button variant="outlined" size="small" onClick={() => handleAction(seller._id, "approve")}>Approve</Button>
                    <Button color="warning" variant="outlined" size="small" onClick={() => handleAction(seller._id, "reject", { reason: "Policy validation failed" })}>Reject</Button>
                    <Button color="error" variant="outlined" size="small" onClick={() => handleAction(seller._id, "block")}>Block</Button>
                    <Button color="success" variant="outlined" size="small" onClick={() => handleAction(seller._id, "unblock")}>Unblock</Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        const next = prompt("Set commission % (0-100)", String(seller.commission || 0));
                        if (next === null) return;
                        const commission = Number(next);
                        if (Number.isNaN(commission) || commission < 0 || commission > 100) {
                          toast.error("Please enter valid commission between 0 and 100");
                          return;
                        }
                        handleAction(seller._id, "commission", { commission });
                      }}
                    >
                      Commission
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}