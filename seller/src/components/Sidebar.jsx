import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../context/Useauth';
import {
  MdDashboard, MdInventory2, MdShoppingBag, MdAccountBalanceWallet,
  MdStorefront, MdSettings, MdLogout, MdMenu, MdClose, MdNotifications,
  MdTrendingUp, MdSupportAgent
} from 'react-icons/md';

const navItems = [
  { to: '/dashboard',  icon: MdDashboard,             label: 'Dashboard'  },
  { to: '/products',   icon: MdInventory2,             label: 'Products'   },
  { to: '/orders',     icon: MdShoppingBag,            label: 'Orders'     },
  { to: '/earnings',   icon: MdAccountBalanceWallet,   label: 'Earnings'   },
  { to: '/store',      icon: MdStorefront,             label: 'My Store'   },
  { to: '/analytics',  icon: MdTrendingUp,             label: 'Analytics'  },
  { to: '/support',    icon: MdSupportAgent,           label: 'Support'    },
  { to: '/settings',   icon: MdSettings,               label: 'Settings'   },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, seller, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-green">
            <MdStorefront className="text-white text-xl" />
          </div>
          <div>
            <p className="font-display font-bold text-gray-900 text-base leading-tight">Zeedaddy</p>
            <p className="text-xs text-primary-600 font-semibold">Seller Portal</p>
          </div>
        </div>
      </div>

      {/* Seller Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-primary-50 rounded-xl p-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {seller?.storeName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {seller?.storeName || user?.name || 'My Store'}
            </p>
            <span className={`text-xs font-semibold ${
              seller?.status === 'approved' ? 'text-green-600' :
              seller?.status === 'pending'  ? 'text-amber-600' : 'text-red-500'
            }`}>
              {seller?.status ? `● ${seller.status}` : '● Not Registered'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
               ${isActive
                 ? 'bg-primary-500 text-white shadow-green'
                 : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`text-xl shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 pt-2 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <MdLogout className="text-xl text-gray-400 group-hover:text-red-500" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <MdStorefront className="text-white text-lg" />
          </div>
          <span className="font-display font-bold text-gray-900">Zeedaddy Seller</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100">
          <MdMenu className="text-xl text-gray-700" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100">
              <MdClose className="text-xl" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}