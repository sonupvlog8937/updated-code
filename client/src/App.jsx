import { useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import "./App.css";
import "./responsive.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./Pages/Home";
import ProductListing from "./Pages/ProductListing";
import { ProductDetails } from "./Pages/ProductDetails";
import StorePage from "./Pages/Store";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import CartPage from "./Pages/Cart";
import Verify from "./Pages/Verify";
import ForgotPassword from "./Pages/ForgotPassword";
import Checkout from "./Pages/Checkout";
import MyAccount from "./Pages/MyAccount";
import MyList from "./Pages/MyList";
import Orders from "./Pages/Orders";

import { Toaster } from "react-hot-toast";
import Address from "./Pages/MyAccount/address";
import { OrderSuccess } from "./Pages/Orders/success";
import { OrderFailed } from "./Pages/Orders/failed";
import SearchPage from "./Pages/Search";
import Blog from "./Pages/Blog";
import BlogDetails from "./Pages/BlogDetails";
import CategoriesPage from "./Pages/Categories";
import SettingsPage from "./Pages/Settings";
import OffersPage from "./Pages/Offers";
import NotificationsPage from "./Pages/Notifications";
import BecomeSeller from "./Pages/Becomeseller";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchCartItems,
  fetchCategories,
  fetchMyListData,
  fetchUserDetails,
  setAddressMode,
  setGlobalLoading,
  setIsLogin,
  setWindowWidth,
} from "./store/appSlice";
import NotificationSettings from "./Pages/NotificationSettings";
import ScrollToTop from "./components/ScrollToTop";
import { goBack } from "./utils/goBack";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import {
  GoMarketHome,
  GoMarketMarket,
  GoMarketRestaurantDetails,
  GoMarketShopDetails,
  GoMarketProduct,
  GoMarketShopSearch,
} from "./Pages/GoMarket";
// import Settings from "./Pages/Settings";

/* ─────────────────────────────────────────
   GLOBAL LOADER
───────────────────────────────────────── */
const GlobalLoader = () => {
  const isLoading = useSelector((state) => state.app.globalLoading);

  return (
    <>
      {isLoading && (
        <div className="gl-bar-wrap" aria-hidden="true">
          <div className="gl-bar-inner" />
        </div>
      )}
      {isLoading && (
        <div
          className="gl-overlay"
          role="status"
          aria-live="polite"
          aria-label="Loading page"
        >
          <div className="gl-dots" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="gl-dot" />
            ))}
          </div>
          <span className="gl-label">Loading</span>
        </div>
      )}
    </>
  );
};

/* ─────────────────────────────────────────
   GLOBAL BACK BUTTON
───────────────────────────────────────── */
const GlobalBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = (e) => {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "gb-ripple";
    Object.assign(ripple.style, {
      width:  `${size}px`,
      height: `${size}px`,
      left:   `${x - size / 2}px`,
      top:    `${y - size / 2}px`,
    });
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
    goBack(navigate, location.pathname);
  };

  if (location.pathname === "/") return null;

  return (
    <>
      <div className="gb-glow" aria-hidden="true" />
      {/* <button
        className="gb-btn"
        onClick={handleGoBack}
        aria-label="Go back to previous page"
        type="button"
      >
        <span className="gb-inner">
          <span className="gb-icon-wrap" aria-hidden="true">
            <IoArrowBack size={14} color="#fff" />
          </span>
          <span className="gb-label">Back</span>
        </span>
      </button> */}
    </>
  );
};

/* ─────────────────────────────────────────
   APP CONTENT
───────────────────────────────────────── */
const AppContent = () => {
  const dispatch  = useDispatch();
  const location  = useLocation();
  const timerRef  = useRef(null);
  const prevPath  = useRef(location.pathname);

  useEffect(() => {
    const isProductPage = location.pathname.startsWith("/product/");
    const wasProductPage = prevPath.current.startsWith("/product/");
    prevPath.current = location.pathname;

    // ✅ FIX: Product details page pe loading turant show karo
    // aur band MAT karo — ProductDetails khud band karega jab data aa jaaye
    // Baaki pages pe pehle jaisi 350ms loading rehti hai
    if (isProductPage && !wasProductPage) {
      // Sirf show karo — band karna ProductDetails ka kaam hai
      dispatch(setGlobalLoading(true));
      return;
    }

    // Same product ID pe dobara navigate ho (e.g. related product click)
    if (isProductPage && wasProductPage) {
      dispatch(setGlobalLoading(true));
      return;
    }

    // Baaki saare pages — 350ms fixed delay (pehle jaisa)
    clearTimeout(timerRef.current);
    dispatch(setGlobalLoading(true));
    timerRef.current = setTimeout(() => {
      dispatch(setGlobalLoading(false));
    }, 350);

    return () => clearTimeout(timerRef.current);
  }, [location.pathname, dispatch]);

  return (
    <>
      <GlobalLoader />
      <GlobalBackButton />
      <Header />
      <Routes>
        <Route path="/"                exact={true} element={<Home />} />
        <Route path="/products"        exact={true} element={<ProductListing />} />
        <Route path="/product/:id"     exact={true} element={<ProductDetails />} />
        <Route path="/login"           exact={true} element={<Login />} />
        <Route path="/register"        exact={true} element={<Register />} />
        <Route path="/cart"            exact={true} element={<CartPage />} />
        <Route path="/verify"          exact={true} element={<Verify />} />
        <Route path="/forgot-password" exact={true} element={<ForgotPassword />} />
        <Route path="/checkout"        exact={true} element={<Checkout />} />
        <Route path="/my-account"      exact={true} element={<MyAccount />} />
        <Route path="/my-list"         exact={true} element={<MyList />} />
        <Route path="/my-orders"       exact={true} element={<Orders />} />
        <Route path="/order/success"   exact={true} element={<OrderSuccess />} />
        <Route path="/order/failed"    exact={true} element={<OrderFailed />} />
        <Route path="/address"         exact={true} element={<Address />} />
        <Route path="/search"          exact={true} element={<SearchPage />} />
        <Route path="/blog"            exact={true} element={<Blog />} />
        <Route path="/blog/:id"        exact={true} element={<BlogDetails />} />
        <Route path="/categories"      exact={true} element={<CategoriesPage />} />
        <Route path="/offers"          exact={true} element={<OffersPage />} />
        <Route path="/settings" exact={true} element={<SettingsPage />} />
        <Route path="/notification-settings" exact={true} element={<NotificationSettings />} />
        <Route path="/notifications" exact={true} element={<NotificationsPage />} />
        <Route path="/become-seller" exact={true} element={<BecomeSeller />} />
        <Route path="/privacy-policy" exact={true} element={<PrivacyPolicy />} />
        <Route path="/go-market" exact={true} element={<GoMarketHome />} />
        <Route path="/go-market/market/:marketId" exact={true} element={<GoMarketMarket />} />
        <Route path="/go-market/shop/:id" exact={true} element={<GoMarketShopDetails />} />
        <Route path="/go-market/shop/:id/search" exact={true} element={<GoMarketShopSearch />} />
        <Route path="/go-market/restaurant/:id" exact={true} element={<GoMarketRestaurantDetails />} />
        <Route path="/go-market/restaurant/:id/search" exact={true} element={<GoMarketRestaurantDetails />} />
        <Route path="/go-market/product/:kind/:id" exact={true} element={<GoMarketProduct />} />
       {/* <Route path="/settings" exact={true} element={<Settings />} /> */}
        <Route path="/store/:sellerId" exact={true} element={<StorePage />} />
      </Routes>
      <Footer />
    </>
  );
};

/* ─────────────────────────────────────────
   ROOT APP
───────────────────────────────────────── */
function App() {
  const dispatch = useDispatch();
  const isLogin  = useSelector((state) => state.app.isLogin);

  useEffect(() => {
    localStorage.removeItem("userEmail");
    const token = localStorage.getItem("accessToken");
    if (token !== undefined && token !== null && token !== "") {
      dispatch(setIsLogin(true));
      dispatch(fetchCartItems());
      dispatch(fetchMyListData());
      dispatch(fetchUserDetails());
    } else {
      dispatch(setIsLogin(false));
    }
  }, [dispatch, isLogin]);

  useEffect(() => {
    dispatch(fetchCategories());
    const handleResize = () => dispatch(setWindowWidth(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      dispatch(setAddressMode("add"));
    };
  }, [dispatch]);

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            fontFamily: "'Outfit', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.08)",
            padding: "14px 16px",
            color: "#111",
            background: "#fff",
            backdropFilter: "blur(8px)",
          },
          success: { 
            style: {
              background: "#F0FDF4",
              border: "1px solid #86EFAC",
              color: "#166534",
            },
            iconTheme: { primary: "#16a34a", secondary: "#F0FDF4" } 
          },
          error: { 
            style: {
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#7F1D1D",
            },
            iconTheme: { primary: "#dc2626", secondary: "#FEF2F2" } 
          },
          loading: {
            style: {
              background: "#F0F9FF",
              border: "1px solid #93C5FD",
              color: "#1E3A8A",
            },
          },
        }}
      />
    </>
  );
}

export default App;