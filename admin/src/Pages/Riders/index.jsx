import React, { useEffect, useState } from 'react';
import { fetchDataFromApi, postData } from '../../utils/api';
import toast from 'react-hot-toast';

export default function RidersPage() {
  const [riders, setRiders] = useState([]);
  const [amounts, setAmounts] = useState({});

  const load = () => fetchDataFromApi('/api/order/delivery-riders').then((res) => setRiders(res?.riders || res?.data || []));
  useEffect(() => { load(); }, []);

  const pay = async (riderId) => {
    const amount = Number(amounts[riderId] || 0);
    if (amount <= 0) return toast.error('Enter payout amount');
    const res = await postData('/api/order/admin/rider-payout', { riderId, amount });
    if (res?.success || res?.error === false) {
      toast.success(res.message || 'Payout recorded');
      setAmounts((p) => ({ ...p, [riderId]: '' }));
      load();
    } else toast.error(res?.message || 'Payout failed');
  };

  return (
    <div className="p-4">
      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <h2 className="text-xl font-bold mb-1">Delivery Rider Management</h2>
        <p className="text-sm text-gray-500 mb-5">Manage rider wallets, market assignment and delivery earnings.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-left">Rider</th><th className="p-3 text-left">Market</th><th className="p-3 text-left">Delivered</th><th className="p-3 text-left">Wallet</th><th className="p-3 text-left">Payout</th></tr></thead>
            <tbody>
              {riders.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-3"><b>{r.name}</b><div className="text-xs text-gray-500">{r.email} · {r.mobile || 'No phone'}</div></td>
                  <td className="p-3">{r.riderProfile?.marketId?.name || 'Not set'}</td>
                  <td className="p-3">{r.riderProfile?.totalDelivered || 0}</td>
                  <td className="p-3 font-bold">₹{Number(r.wallet?.availableBalance || 0).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex gap-2"><input className="border rounded px-2 py-1 w-24" type="number" placeholder="₹" value={amounts[r._id] || ''} onChange={(e) => setAmounts((p) => ({ ...p, [r._id]: e.target.value }))} /><button className="bg-black text-white rounded px-3 py-1" onClick={() => pay(r._id)}>Pay</button></div>
                  </td>
                </tr>
              ))}
              {riders.length === 0 && <tr><td className="p-6 text-center text-gray-500" colSpan="5">No delivery riders found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
