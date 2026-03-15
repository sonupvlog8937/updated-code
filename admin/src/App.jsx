import "./App.css";
import "./responsive.css";
import React, { createContext, useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Pages
import Dashboard from "./Pages/Dashboard";
import Header from "./Components/Header";
import Sidebar from "./Components/Sidebar";
import Login from "./Pages/Login";
import SignUp from "./Pages/SignUp";
import Products from "./Pages/Products";
import StoreProfile from "./Pages/StoreProfile";
import WalletPage from "./Pages/Wallet";
import HomeSliderBanners from "./Pages/HomeSliderBanners";
import CategoryList from "./Pages/Categegory";
import SubCategoryList from "./Pages/Categegory/subCatList";
import Users from "./Pages/Users";
import Orders from "./Pages/Orders";
import ForgotPassword from "./Pages/ForgotPassword";
import VerifyAccount from "./Pages/VerifyAccount";
import ChangePassword from "./Pages/ChangePassword";
import Reviewpage from "./Pages/ReviewsPage";
import ManageLogo from "./Pages/ManageLogo";
import AddBlog from "./Pages/Blog/addBlog";
import toast, { Toaster } from 'react-hot-toast';
import { fetchDataFromApi } from "./utils/api";
import Profile from "./Pages/Profile";
import ProductDetails from "./Pages/Products/productDetails";
import AddRAMS from "./Pages/Products/addRAMS";
import AddWeight from "./Pages/Products/addWeight";
import AddSize from "./Pages/Products/addSize";
import BannerV1List from "./Pages/Banners/bannerV1List";
import { BannerList2 } from "./Pages/Banners/bannerList2";
import { BlogList } from "./Pages/Blog";
import LoadingBar from "react-top-loading-bar";
import BannersHub from "./Pages/BannersHub";

const MyContext = createContext();

/* ══════════════════════════════════════════
   GLOBAL LOADER — shown while user data loads
══════════════════════════════════════════ */
const GlobalLoader = () => (
  <div style={{
    position: 'fixed', inset: 0, background: '#fff',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
  }}>
    {/* Animated logo mark */}
    <div style={{ marginBottom: 32, position: 'relative' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(17,24,39,0.18)',
        animation: 'pulseScale 1.6s ease-in-out infinite',
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M6 8h20M6 16h14M6 24h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="25" cy="24" r="5" fill="#6366f1"/>
        </svg>
      </div>
      {/* Ripple ring */}
      <div style={{
        position: 'absolute', inset: -8, borderRadius: 26,
        border: '2px solid #e5e7eb',
        animation: 'ripple 1.6s ease-in-out infinite',
      }} />
    </div>

    {/* Spinner bar */}
    <div style={{
      width: 180, height: 3, background: '#f3f4f6',
      borderRadius: 99, overflow: 'hidden', marginBottom: 20,
    }}>
      <div style={{
        height: '100%', borderRadius: 99,
        background: 'linear-gradient(90deg, #6366f1, #111827)',
        animation: 'loadBar 1.4s ease-in-out infinite',
      }} />
    </div>

    <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, margin: 0 }}>
      Loading dashboard…
    </p>

    <style>{`
      @keyframes pulseScale {
        0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(17,24,39,0.18); }
        50% { transform: scale(1.06); box-shadow: 0 12px 40px rgba(17,24,39,0.28); }
      }
      @keyframes ripple {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.5); }
      }
      @keyframes loadBar {
        0% { width: 0%; margin-left: 0%; }
        50% { width: 70%; margin-left: 15%; }
        100% { width: 0%; margin-left: 100%; }
      }
    `}</style>
  </div>
);

/* ══════════════════════════════════════════
   SELLER PENDING SCREEN
   Shown when a user signed up but admin hasn't
   granted SELLER role yet.
══════════════════════════════════════════ */
const SellerPendingScreen = ({ userData }) => {
  const initials = userData?.name
    ? userData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
        padding: '48px 40px', maxWidth: 460, width: '100%', textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, color: '#fff',
          margin: '0 auto 20px',
          boxShadow: '0 4px 18px rgba(99,102,241,0.35)',
        }}>
          {initials}
        </div>

        {/* Pending badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#fef3c7', color: '#92400e',
          padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          border: '1px solid #fde68a', marginBottom: 20,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#f59e0b',
            display: 'inline-block',
            animation: 'blink 1.2s ease-in-out infinite',
          }} />
          Awaiting Approval
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>
          Account Under Review
        </h1>

        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: '0 0 28px' }}>
          Hi <strong style={{ color: '#111827' }}>{userData?.name || 'there'}</strong>! Your seller account has been created successfully.
          Our admin team is reviewing your application and will grant access soon.
        </p>

        {/* Steps */}
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: '16px 20px',
          marginBottom: 28, textAlign: 'left',
        }}>
          {[
            { done: true, label: 'Account created', sub: 'Your account is registered' },
            { done: true, label: 'Email verified', sub: 'Identity confirmed' },
            { done: false, label: 'Admin approval', sub: 'Waiting for role assignment', active: true },
            { done: false, label: 'Full dashboard access', sub: 'Products, orders, wallet & more' },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              paddingBottom: i < 3 ? 14 : 0,
              borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none',
              marginBottom: i < 3 ? 14 : 0,
            }}>
              {/* Step icon */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step.done ? '#dcfce7' : step.active ? '#fef3c7' : '#f3f4f6',
                fontSize: 13,
              }}>
                {step.done ? '✓' : step.active ? '⏳' : '○'}
              </div>
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: step.done ? '#15803d' : step.active ? '#92400e' : '#9ca3af',
                }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Email info */}
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 10, padding: '12px 16px',
          fontSize: 13, color: '#1e40af',
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 16 }}>📧</span>
          <span>
            We'll notify you at <strong>{userData?.email}</strong> once approved.
          </span>
        </div>

        {/* Logout button */}
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }}
          style={{
            width: '100%', background: '#111827', color: '#fff',
            border: 'none', borderRadius: 10, padding: '12px 24px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Sign out
        </button>

        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 14 }}>
          Need help? Contact support or reach out to your admin directly.
        </p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

/* ══════════════════════════════════════════
   PAGE WRAPPER — removes ~500 lines of repeated layout
══════════════════════════════════════════ */
const PageWrapper = ({ children, isSidebarOpen, windowWidth, sidebarWidth }) => (
  <section className="main">
    <Header />
    <div className="contentMain flex">
      <div className={`overflow-hidden sidebarWrapper ${
        isSidebarOpen
          ? windowWidth < 992
            ? `w-[${sidebarWidth / 1.5}%]`
            : 'w-[20%]'
          : 'w-[0px] opacity-0 invisible'
      } transition-all`}>
        <Sidebar />
      </div>
      <div
        className={`contentRight overflow-hidden py-4 px-5 ${
          isSidebarOpen && windowWidth < 992 ? 'opacity-0' : ''
        } transition-all`}
        style={{ width: isSidebarOpen ? '80%' : '100%' }}
      >
        {children}
      </div>
    </div>
  </section>
);

/* ══════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════ */
function App() {
  const [isSidebarOpen, setisSidebarOpen] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [address, setAddress] = useState([]);
  const [catData, setCatData] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sidebarWidth, setSidebarWidth] = useState(18);
  const [progress, setProgress] = useState(0);
  const [isAppLoading, setIsAppLoading] = useState(true); // ← global loader state

  const [isOpenFullScreenPanel, setIsOpenFullScreenPanel] = useState({
    open: false,
    id: '',
  });

  /* ── Window resize ── */
  useEffect(() => {
    localStorage.removeItem('userEmail');
    if (windowWidth < 992) {
      setisSidebarOpen(false);
      setSidebarWidth(100);
    } else {
      setSidebarWidth(18);
    }
  }, [windowWidth]);

  /* ── Disable right-click for non-admins ── */
  useEffect(() => {
    if (userData?.role !== 'ADMIN') {
      const handler = (e) => e.preventDefault();
      document.addEventListener('contextmenu', handler);
      return () => document.removeEventListener('contextmenu', handler);
    }
  }, [userData]);

  /* ── Toast helper ── */
  const alertBox = (type, msg) => {
    if (type === 'success') toast.success(msg);
    if (type === 'error') toast.error(msg);
  };

  /* ── Auth check + user fetch ── */
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLogin(true);
      fetchDataFromApi('/api/user/user-details').then((res) => {
        setUserData(res.data);
        setIsAppLoading(false); // ← hide loader after user data arrives
        if (res?.response?.data?.message === 'You have not login') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLogin(false);
          alertBox('error', 'Your session has expired. Please login again.');
        }
      });
    } else {
      setIsLogin(false);
      setIsAppLoading(false); // ← no token → hide loader immediately
    }
  }, [isLogin]);

  /* ── Category fetch + resize listener ── */
  useEffect(() => {
    getCat();
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCat = () => {
    fetchDataFromApi('/api/category').then((res) => setCatData(res?.data));
  };

  /* ── Context values ── */
  const values = {
    isSidebarOpen, setisSidebarOpen,
    isLogin, setIsLogin,
    isOpenFullScreenPanel, setIsOpenFullScreenPanel,
    alertBox,
    setUserData, userData,
    setAddress, address,
    catData, setCatData, getCat,
    windowWidth,
    setSidebarWidth, sidebarWidth,
    setProgress, progress,
  };

  /* ── Shared layout props ── */
  const wp = { isSidebarOpen, windowWidth, sidebarWidth };

  /* ── Routes that DON'T need seller/admin role check ── */
  const publicRoutes = ['/login', '/sign-up', '/forgot-password', '/verify-account', '/change-password'];

  /* ── Seller guard: user signed up but not yet given SELLER role ── */
  // A user is "pending seller" when they are logged in, role is NOT ADMIN, NOT SELLER
  // i.e. they used the sign-up flow but admin hasn't approved them yet.
  // We only show the pending screen on protected (dashboard) routes.
  const isSellerPending = (
    userData !== null &&
    userData?.role !== 'ADMIN' &&
    userData?.role !== 'SELLER'
  );

  /* ── Router ── */
  const router = createBrowserRouter([
    // ── Public / auth routes ──
    { path: '/login', element: <Login /> },
    { path: '/sign-up', element: <SignUp /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/verify-account', element: <VerifyAccount /> },
    { path: '/change-password', element: <ChangePassword /> },

    // ── Protected routes — wrapped in PageWrapper ──
    // Dashboard (accessible to all roles that pass the guard)
    {
      path: '/',
      element: (
        <PageWrapper {...wp}>
          <Dashboard />
        </PageWrapper>
      ),
    },

    // Products — SELLER & ADMIN
    {
      path: '/products',
      element: (
        <PageWrapper {...wp}>
          <Products />
        </PageWrapper>
      ),
    },
    {
      path: '/product/:id',
      element: (
        <PageWrapper {...wp}>
          <ProductDetails />
        </PageWrapper>
      ),
    },
    {
      path: '/product/addRams',
      element: (
        <PageWrapper {...wp}>
          <AddRAMS />
        </PageWrapper>
      ),
    },
    {
      path: '/product/addWeight',
      element: (
        <PageWrapper {...wp}>
          <AddWeight />
        </PageWrapper>
      ),
    },
    {
      path: '/product/addSize',
      element: (
        <PageWrapper {...wp}>
          <AddSize />
        </PageWrapper>
      ),
    },

    // Orders — SELLER & ADMIN
    {
      path: '/orders',
      element: (
        <PageWrapper {...wp}>
          <Orders />
        </PageWrapper>
      ),
    },

    // Users — ADMIN only (the Users component itself handles the guard internally)
    {
      path: '/users',
      element: (
        <PageWrapper {...wp}>
          <Users />
        </PageWrapper>
      ),
    },

    // Reviews
    {
      path: '/reviews',
      element: (
        <PageWrapper {...wp}>
          <Reviewpage />
        </PageWrapper>
      ),
    },

    // Categories
    {
      path: '/category/list',
      element: (
        <PageWrapper {...wp}>
          <CategoryList />
        </PageWrapper>
      ),
    },
    {
      path: '/subCategory/list',
      element: (
        <PageWrapper {...wp}>
          <SubCategoryList />
        </PageWrapper>
      ),
    },

    // Banners
    {
      path: '/homeSlider/list',
      element: (
        <PageWrapper {...wp}>
          <HomeSliderBanners />
        </PageWrapper>
      ),
    },
    {
      path: '/bannerV1/list',
      element: (
        <PageWrapper {...wp}>
          <BannerV1List />
        </PageWrapper>
      ),
    },
    {
      path: '/bannerlist2/List',
      element: (
        <PageWrapper {...wp}>
          <BannerList2 />
        </PageWrapper>
      ),
    },
    {
      path: '/banners/management',
      element: (
        <PageWrapper {...wp}>
          <BannersHub />
        </PageWrapper>
      ),
    },

    // Seller specific
    {
      path: '/seller/store-profile',
      element: (
        <PageWrapper {...wp}>
          <StoreProfile />
        </PageWrapper>
      ),
    },
    {
      path: '/wallet/transactions',
      element: (
        <PageWrapper {...wp}>
          <WalletPage />
        </PageWrapper>
      ),
    },

    // Blog
    {
      path: '/blog/list',
      element: (
        <PageWrapper {...wp}>
          <AddBlog />
        </PageWrapper>
      ),
    },
    {
      path: '/blog/List',
      element: (
        <PageWrapper {...wp}>
          <BlogList />
        </PageWrapper>
      ),
    },

    // Profile
    {
      path: '/profile',
      element: (
        <PageWrapper {...wp}>
          <Profile />
        </PageWrapper>
      ),
    },

    // Logo / Manage
    {
      path: '/manageLogo',
      element: (
        <PageWrapper {...wp}>
          <ManageLogo />
        </PageWrapper>
      ),
    },
    {
      path: '/logo/manage',
      element: (
        <PageWrapper {...wp}>
          <ManageLogo />
        </PageWrapper>
      ),
    },
  ]);

  /* ── Render ── */
  return (
    <MyContext.Provider value={values}>

      {/* ── 1. Global App Loader ── */}
      {isAppLoading && <GlobalLoader />}

      {/* ── 2. Seller Pending Guard ── */}
      {!isAppLoading && isSellerPending && isLogin && (
        <SellerPendingScreen userData={userData} />
      )}

      {/* ── 3. Normal App ── */}
      {!isAppLoading && (!isLogin || !isSellerPending) && (
        <RouterProvider router={router} />
      )}

      <LoadingBar
        color="#6366f1"
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
        className="topLoadingBar"
        height={3}
      />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        }}
      />
    </MyContext.Provider>
  );
}

export default App;
export { MyContext };