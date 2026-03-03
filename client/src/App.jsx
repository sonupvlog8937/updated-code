import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import "./responsive.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./Pages/Home";
import ProductListing from "./Pages/ProductListing";
import { ProductDetails } from "./Pages/ProductDetails";

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
import DiscoverRestaurant from "./Pages/Restaurant/Discover";
import RestaurantMyOrders from "./Pages/Restaurant/MyOrders";
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

const GlobalLoader = () => {
  const isLoading = useSelector((state) => state.app.globalLoading);

  if (!isLoading) return null;

  return (
    <div className="global-loader-overlay" role="status" aria-live="polite" aria-label="Loading">
      <div className="global-loader-spinner" />
      <p>Loading...</p>
    </div>
  );
};

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
      <Header />
      <Routes>
        <Route path="/" exact={true} element={<Home />} />
        <Route path="/products" exact={true} element={<ProductListing />} />
        <Route path="/product/:id" exact={true} element={<ProductDetails />} />
        <Route path="/login" exact={true} element={<Login />} />
        <Route path="/register" exact={true} element={<Register />} />
        <Route path="/cart" exact={true} element={<CartPage />} />
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
        <Route path={"/restaurant"} exact={true} element={<DiscoverRestaurant />} />
        <Route path={"/restaurant/my-orders"} exact={true} element={<RestaurantMyOrders />} />
      </Routes>
      <Footer />
    </>
  );
};

function App() {
  const dispatch = useDispatch();
  const isLogin = useSelector((state) => state.app.isLogin);

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





      <Toaster />


    </>
  );
}

export default App;
