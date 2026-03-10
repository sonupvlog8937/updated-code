import { useEffect } from "react";
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

/* ─────────────────────────────────────────
   GLOBAL LOADER
   Cinematic top-bar + centered logo pulse
───────────────────────────────────────── */
const GlobalLoader = () => {
  const isLoading = useSelector((state) => state.app.globalLoading);

  return (
    <>
      {/* Injected styles – no extra CSS file needed */}
      

      {/* Top progress bar – always rendered, only animates when loading */}
      {isLoading && (
        <div className="gl-bar-wrap" aria-hidden="true">
          <div className="gl-bar-inner" />
        </div>
      )}

      {/* Full overlay */}
      {isLoading && (
        <div
          className="gl-overlay"
          role="status"
          aria-live="polite"
          aria-label="Loading page"
        >
          <div className="gl-dots" aria-hidden="true">
            {[0,1,2,3].map(i => <span key={i} className="gl-dot" />)}
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
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleGoBack = (e) => {
    /* Ripple effect */
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

    window.history.length > 1 ? navigate(-1) : navigate("/");
  };

  if (location.pathname === "/") return null;

  return (
    <>
      {/* ambient glow */}
      <div className="gb-glow" aria-hidden="true" />

      <button
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
      </button>
    </>
  );
};


/* ─────────────────────────────────────────
   APP CONTENT
───────────────────────────────────────── */
const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(setGlobalLoading(true));
    const timer = setTimeout(() => {
      dispatch(setGlobalLoading(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [location.pathname, dispatch]);

  return (
    <>
      <GlobalLoader />
      <GlobalBackButton />
      <Header />
      <Routes>
        <Route path="/" exact={true} element={<Home />} />
        <Route path="/products" exact={true} element={<ProductListing />} />
        <Route path="/product/:id" exact={true} element={<ProductDetails />} />
        <Route path="/login" exact={true} element={<Login />} />
        <Route path="/register" exact={true} element={<Register />} />
        <Route path="/cart" exact={true} element={<CartPage />} />
        <Route path="/store/:storeSlug" exact={true} element={<StorePage />} />
        <Route path="/verify" exact={true} element={<Verify />} />
        <Route path="/forgot-password" exact={true} element={<ForgotPassword />} />
        <Route path="/checkout" exact={true} element={<Checkout />} />
        <Route path="/my-account" exact={true} element={<MyAccount />} />
        <Route path="/my-list" exact={true} element={<MyList />} />
        <Route path="/my-orders" exact={true} element={<Orders />} />
        <Route path="/order/success" exact={true} element={<OrderSuccess />} />
        <Route path="/order/failed" exact={true} element={<OrderFailed />} />
        <Route path="/address" exact={true} element={<Address />} />
        <Route path="/search" exact={true} element={<SearchPage />} />
        <Route path={"/blog"} exact={true} element={<Blog />} />
        <Route path={"/blog/:id"} exact={true} element={<BlogDetails />} />
        <Route path={"/categories"} exact={true} element={<CategoriesPage />} />
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

    const handleResize = () => {
      dispatch(setWindowWidth(window.innerWidth));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      dispatch(setAddressMode("add"));
    };
  }, [dispatch]);

  return (
    <>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            fontFamily: "'Outfit', sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)",
            padding: "12px 16px",
            color: "#111",
            background: "#fff",
          },
          success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
        }}
      />
    </>
  );
}

export default App;