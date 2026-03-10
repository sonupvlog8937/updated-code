import { useState, useEffect } from 'react';
import { getSellerEarningsAPI, requestPayoutAPI, getPayoutHistoryAPI } from '../services/api';
import { useAuth } from '../context/Authcontext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdAccountBalanceWallet, MdTrendingUp, MdArrowUpward, MdHistory, MdInfo } from 'react-icons/md';
import { format } from 'date-fns';

const statusColor = (s) => ({ pending: 'badge-pending', approved: 'badge-approved', paid: 'badge-approved', rejected: 'badge-rejected' })[s] || 'badge-pending';

export default function Earnings() {
  const { seller } = useAuth();
  const [earnings, setEarnings]   = useState(null);
  const [payouts, setPayouts]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    async function load() {
      try {
        const [e, p] = await Promise.allSettled([getSellerEarningsAPI(), getPayoutHistoryAPI({ page: 1, limit: 10 })]);
        if (e.status === 'fulfilled') setEarnings(e.value.data.data);
        if (p.status === 'fulfilled') setPayouts(p.value.data.data || []);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const onRequestPayout = async (data) => {
    setRequesting(true);
    try {
      await requestPayoutAPI({ amount: Number(data.amount), paymentMethod: data.paymentMethod });
      toast.success('Payout request submitted!');
      setShowModal(false);
      reset();
      // Reload
      const [e, p] = await Promise.all([getSellerEarningsAPI(), getPayoutHistoryAPI({ page: 1, limit: 10 })]);
      setEarnings(e.data.data);
      setPayouts(p.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally { setRequesting(false); }
  };

  if (loading) return (
    <div className="space-y-5">
      {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Earnings & Payouts</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track your revenue and withdraw earnings</p>
        </div>
        <button onClick={() => setShowModal(true)}
          disabled={!earnings?.pendingPayout || earnings.pendingPayout < 100}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <MdArrowUpward /> Withdraw
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card border-l-4 border-primary-500">
          <div className="flex items-center gap-3 mb-2">
            <MdTrendingUp className="text-primary-500 text-xl" />
            <span className="text-sm font-semibold text-gray-500">Total Earnings</span>
          </div>
          <p className="font-display font-bold text-3xl text-gray-900">₹{(earnings?.totalEarnings || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">From {earnings?.totalOrders || 0} orders</p>
        </div>
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <MdAccountBalanceWallet className="text-blue-500 text-xl" />
            <span className="text-sm font-semibold text-gray-500">Pending Payout</span>
          </div>
          <p className="font-display font-bold text-3xl text-gray-900">₹{(earnings?.pendingPayout || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Available for withdrawal</p>
        </div>
        <div className="card border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-2">
            <MdArrowUpward className="text-green-500 text-xl" />
            <span className="text-sm font-semibold text-gray-500">Total Paid Out</span>
          </div>
          <p className="font-display font-bold text-3xl text-gray-900">₹{(earnings?.totalPaidOut || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Already withdrawn</p>
        </div>
      </div>

      {/* Commission info */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3">
        <MdInfo className="text-primary-500 text-xl shrink-0 mt-0.5" />
        <div className="text-sm text-primary-700">
          <p>Commission: <strong>{earnings?.commission || 10}%</strong> — You earn <strong>{100 - (earnings?.commission || 10)}%</strong> of each sale.</p>
          <p className="text-xs mt-0.5 text-primary-600">Minimum withdrawal amount: ₹100</p>
        </div>
      </div>

      {/* Payout History */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MdHistory className="text-gray-400 text-xl" />
          <h2 className="font-display font-semibold text-gray-900">Payout History</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="text-center py-10">
            <MdAccountBalanceWallet className="text-4xl text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No payout requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Method</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Txn ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map(p => (
                  <tr key={p._id}>
                    <td className="py-3 text-sm text-gray-600">{format(new Date(p.createdAt), 'dd MMM yyyy')}</td>
                    <td className="py-3 text-sm font-bold text-gray-900">₹{p.amount.toLocaleString()}</td>
                    <td className="py-3 text-sm text-gray-600 capitalize">{p.paymentMethod}</td>
                    <td className="py-3"><span className={statusColor(p.status)}>{p.status}</span></td>
                    <td className="py-3 text-xs text-gray-400">{p.transactionId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-display font-bold text-xl text-gray-900 mb-1">Request Withdrawal</h2>
            <p className="text-sm text-gray-500 mb-5">Available: <span className="font-bold text-primary-600">₹{earnings?.pendingPayout?.toLocaleString()}</span></p>
            <form onSubmit={handleSubmit(onRequestPayout)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (₹) *</label>
                <input {...register('amount', {
                  required: 'Amount required',
                  min: { value: 100, message: 'Minimum ₹100' },
                  max: { value: earnings?.pendingPayout, message: `Max ₹${earnings?.pendingPayout}` }
                })} type="number" placeholder="Enter amount" className={`input ${errors.amount ? 'border-red-400' : ''}`} />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Method</label>
                <select {...register('paymentMethod')} className="input">
                  <option value="bank">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ Make sure your bank/UPI details are updated in Store Profile before requesting.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={requesting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {requesting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {requesting ? 'Requesting...' : 'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}