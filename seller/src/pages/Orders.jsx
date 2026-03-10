import { useState, useEffect, useCallback } from 'react';
import { getSellerOrdersAPI, updateItemStatusAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdShoppingBag, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['confirm', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColor = (s) => ({
  confirm: 'badge-pending', processing: 'badge-pending',
  shipped: 'badge-approved', delivered: 'badge-approved', cancelled: 'badge-rejected'
})[s] || 'badge-pending';

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [expanded, setExpanded] = useState(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerOrdersAPI({ page, limit });
      setOrders(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId, productId, status) => {
    try {
      await updateItemStatusAPI(orderId, productId, { status });
      toast.success('Status updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-0.5">{total} total orders</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-32" />
                <div className="h-5 bg-gray-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-16">
          <MdShoppingBag className="text-5xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No orders yet</p>
          <p className="text-gray-300 text-sm">Orders will appear here when customers buy your products</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order._id} className="card p-0 overflow-hidden">
              {/* Order Header */}
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                    <MdShoppingBag className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a') : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-gray-900 text-sm">₹{order.myEarning?.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">your earning</p>
                  </div>
                  <span className={statusColor(order.order_status)}>{order.order_status}</span>
                  {expanded === order._id ? <MdExpandLess className="text-gray-400" /> : <MdExpandMore className="text-gray-400" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === order._id && (
                <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50/30">
                  {/* Customer */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</p>
                    <p className="font-semibold text-gray-900 text-sm">{order.userId?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{order.userId?.email}</p>
                  </div>

                  {/* Products */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Products in this Order</p>
                    <div className="space-y-3">
                      {order.products?.map((item, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
                          <img src={item.image} alt={item.productTitle}
                            className="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{item.productTitle}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity} × ₹{item.price} = ₹{item.subTotal}</p>
                            <p className="text-xs text-primary-600 font-semibold">Your earning: ₹{item.sellerEarning?.toFixed(0)}</p>
                          </div>
                          {/* Status update */}
                          <select
                            value={item.item_status || 'confirm'}
                            onChange={e => updateStatus(order._id, item.productId, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s} className="capitalize">{s}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Earnings from Order</span>
                    <span className="text-sm font-bold text-primary-700">₹{order.myEarning?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:border-primary-400 disabled:opacity-40">Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:border-primary-400 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}