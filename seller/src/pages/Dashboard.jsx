import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../context/Useauth';
import { getSellerEarningsAPI, getSellerOrdersAPI, getSellerProductsAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MdTrendingUp, MdShoppingBag, MdInventory2, MdAccountBalanceWallet,
         MdArrowForward, MdInfo, MdPendingActions } from 'react-icons/md';

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
  <Link to={to || '#'} className="card hover:shadow-card-hover transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="text-xl text-white" />
      </div>
      <MdArrowForward className="text-gray-300 group-hover:text-primary-400 transition-colors text-lg" />
    </div>
    <p className="text-2xl font-display font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </Link>
);

export default function Dashboard() {
  const { user, seller } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState({ total: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [e, o, p] = await Promise.allSettled([
          getSellerEarningsAPI(),
          getSellerOrdersAPI({ page: 1, limit: 5 }),
          getSellerProductsAPI({ page: 1, limit: 1 }),
        ]);
        if (e.status === 'fulfilled') setEarnings(e.value.data.data);
        if (o.status === 'fulfilled') setOrders(o.value.data.data || []);
        if (p.status === 'fulfilled') setProducts({ total: p.value.data.total || 0 });
      } catch {}
      setLoading(false);
    }
    if (seller?.status === 'approved') load();
    else setLoading(false);
  }, [seller]);

  // Pending approval state
  if (seller?.status === 'pending') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center">
        <MdPendingActions className="text-4xl text-amber-500" />
      </div>
      <h2 className="font-display font-bold text-xl text-gray-900">Approval Pending</h2>
      <p className="text-gray-500 max-w-sm text-sm">
        Your seller account is under review. Admin will approve it within 24 hours.
      </p>
      <div className="badge-pending text-sm px-4 py-2">⏳ Pending Review</div>
    </div>
  );

  // Not registered state
  if (!seller) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center">
        <MdInfo className="text-4xl text-primary-500" />
      </div>
      <h2 className="font-display font-bold text-xl text-gray-900">Setup Your Store</h2>
      <p className="text-gray-500 max-w-sm text-sm">You haven't registered as a seller yet.</p>
      <Link to="/register" className="btn-primary">Register as Seller</Link>
    </div>
  );

  const stats = [
    { icon: MdAccountBalanceWallet, label: 'Total Earnings',  value: `₹${(earnings?.totalEarnings || 0).toLocaleString()}`,  sub: 'Lifetime',        color: 'bg-primary-500', to: '/earnings' },
    { icon: MdTrendingUp,           label: 'Pending Payout',  value: `₹${(earnings?.pendingPayout  || 0).toLocaleString()}`,  sub: 'Withdrawable',    color: 'bg-blue-500',    to: '/earnings' },
    { icon: MdShoppingBag,          label: 'Total Orders',    value: earnings?.totalOrders || 0,                               sub: 'All time',        color: 'bg-purple-500',  to: '/orders'   },
    { icon: MdInventory2,           label: 'Products',        value: products.total,                                           sub: 'Listed products', color: 'bg-orange-500',  to: '/products' },
  ];

  // Mock chart data - replace with real monthly data
  const chartData = [
    { month: 'Jan', earnings: 0 }, { month: 'Feb', earnings: 0 },
    { month: 'Mar', earnings: 0 }, { month: 'Apr', earnings: 0 },
    { month: 'May', earnings: 0 }, { month: 'Jun', earnings: 0 },
    { month: 'Jul', earnings: 0 }, { month: 'Aug', earnings: 0 },
    { month: 'Sep', earnings: 0 }, { month: 'Oct', earnings: 0 },
    { month: 'Nov', earnings: 0 }, { month: 'Dec', earnings: earnings?.totalEarnings || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's what's happening with your store today.</p>
        </div>
        <Link to="/products/add" className="btn-primary hidden sm:flex items-center gap-2">
          + Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-11 h-11 bg-gray-200 rounded-xl mb-3" />
              <div className="h-7 w-24 bg-gray-200 rounded mb-1" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      )}

      {/* Chart + Recent Orders */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900">Earnings Overview</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">This Year</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${v}`, 'Earnings']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="earnings" stroke="#4CAF50" strokeWidth={2.5} fill="url(#colorEarnings)" dot={false} activeDot={{ r: 5, fill: '#4CAF50' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-primary-600 font-semibold hover:text-primary-700">View all</Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <MdShoppingBag className="text-4xl text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 4).map((order) => (
                <div key={order._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                    <MdShoppingBag className="text-primary-600 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">#{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">₹{order.myEarning?.toFixed(0)}</p>
                  </div>
                  <span className={`badge-${order.order_status === 'delivered' ? 'approved' : order.order_status === 'cancelled' ? 'rejected' : 'pending'}`}>
                    {order.order_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commission info */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center gap-3">
        <MdInfo className="text-primary-500 text-xl shrink-0" />
        <p className="text-sm text-primary-700">
          Your current commission rate is <strong>{earnings?.commission || 10}%</strong>. 
          You earn <strong>{100 - (earnings?.commission || 10)}%</strong> of each sale.
        </p>
      </div>
    </div>
  );
}