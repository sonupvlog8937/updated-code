import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { RiProductHuntLine, RiNewspaperLine } from "react-icons/ri";
import { TbCategory } from "react-icons/tb";
import {
  IoBagCheckOutline,
  IoStorefrontOutline,
  IoWalletOutline,
  IoImageOutline,
} from "react-icons/io5";
// import { MdOutlineRateReview } from "react-icons/md";
import { IoMdLogOut } from "react-icons/io";
import { FiUsers, FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  MdOutlineRateReview,
  MdOutlineViewCarousel,
  MdOutlinePermMedia,
  MdOutlineArticle,
  MdLocalOffer,
} from "react-icons/md";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";

const Sidebar = () => {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = context?.userData?.role || "USER";
  const isAdmin = userRole === "ADMIN";
  const isSeller = userRole === "SELLER";

  const [openGroups, setOpenGroups] = useState({ catalog: false, media: false, banners: false });
  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const closeSidebar = () => {
    if (context?.windowWidth < 992) context?.setisSidebarOpen(false);
  };

  const logout = () => {
    fetchDataFromApi(`/api/user/logout?token=${localStorage.getItem("accessToken")}`).then((res) => {
      if (res?.error === false) {
        context.setIsLogin(false);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
      }
    });
  };

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const GroupLabel = ({ label }) => (
    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-[600] px-3 pt-4 pb-1 select-none">
      {label}
    </p>
  );

  const NavItem = ({ to, icon: Icon, label, badge }) => {
    const active = isActive(to);
    return (
      <li>
        <Link to={to} onClick={closeSidebar}>
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-[500] transition-all cursor-pointer
            ${active ? "bg-[#2874f0] text-white shadow-sm" : "text-[rgba(0,0,0,0.72)] hover:bg-[#f1f5ff] hover:text-[#2874f0]"}`}>
            {Icon && <Icon className={`text-[18px] flex-shrink-0 ${active ? "text-white" : ""}`} />}
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {badge}
              </span>
            )}
            {active && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 flex-shrink-0" />}
          </div>
        </Link>
      </li>
    );
  };

  const CollapseGroup = ({ groupKey, icon: Icon, label, children }) => {
    const open = openGroups[groupKey];
    return (
      <li>
        <div onClick={() => toggleGroup(groupKey)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-[500] cursor-pointer transition-all text-[rgba(0,0,0,0.72)] hover:bg-[#f1f5ff] hover:text-[#2874f0]">
          {Icon && <Icon className="text-[18px] flex-shrink-0" />}
          <span className="flex-1">{label}</span>
          <span className="text-gray-400">{open ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}</span>
        </div>
        {open && (
          <ul className="ml-4 pl-3 border-l-2 border-dashed border-blue-100 mt-0.5 space-y-0.5">
            {children}
          </ul>
        )}
      </li>
    );
  };

  const SubItem = ({ to, label }) => {
    const active = isActive(to);
    return (
      <li>
        <Link to={to} onClick={closeSidebar}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-[500] transition-all
            ${active ? "text-[#2874f0] bg-blue-50 font-semibold" : "text-gray-500 hover:text-[#2874f0] hover:bg-[#f1f5ff]"}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? "bg-[#2874f0]" : "bg-gray-300"}`} />
            {label}
          </div>
        </Link>
      </li>
    );
  };

  return (
    <>
      <div className={`sidebar fixed top-0 left-0 z-[52] bg-white h-full border-r border-[rgba(0,0,0,0.07)] flex flex-col w-[${
        context.isSidebarOpen === true ? `${20}%` : "0px"
      }]`}>

        {/* Logo */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0" onClick={closeSidebar}>
          <Link to="/"><img src={localStorage.getItem("logo")} className="w-[150px] md:min-w-[170px]" alt="logo" /></Link>
        </div>

        {/* Role Badge */}
        <Link to="/profile">
          <div className="mx-3 my-2 px-3 py-2.5 bg-gradient-to-r from-[#eef2ff] to-[#f0f9ff] rounded-xl border border-[#e0e7ff] hover:shadow-sm transition-all flex-shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-[#6366f1] font-[600]">Signed in as</p>
            <p className="text-[13px] font-[700] text-[#1e293b] mt-0.5">
              {isAdmin ? "🛡️ Admin Panel" : isSeller ? "🏪 Seller Panel" : "👤 Control Panel"}
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <ul className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
          <GroupLabel label="Main" />
          <NavItem to="/" icon={RxDashboard} label="Dashboard" />
          <NavItem to="/products" icon={RiProductHuntLine} label={isSeller ? "My Products" : "Products"} />
          <NavItem to="/orders" icon={IoBagCheckOutline} label={isSeller ? "My Orders" : "All Orders"} />
          {isAdmin && <NavItem to="/reviews" icon={MdOutlineRateReview} label="All Reviews" />}
          {isSeller && <NavItem to="/reviews" icon={MdOutlineRateReview} label="My Reviews" />}

          {isAdmin && (
            <>
              <GroupLabel label="Management" />
              <NavItem to="/users" icon={FiUsers} label="Users & Sellers" />
              <NavItem to="/coupons" icon={MdLocalOffer} label="Coupons" />

              <CollapseGroup groupKey="catalog" icon={TbCategory} label="Catalog">
                <SubItem to="/category/list" label="Categories" />
                <SubItem to="/subCategory/list" label="Sub Categories" />
              </CollapseGroup>

              <GroupLabel label="Content" />
              <NavItem to="/blog/list" icon={MdOutlineArticle} label="Blog Posts" />
              <NavItem to="/manageLogo" icon={IoImageOutline} label="Manage Logo" />

              <GroupLabel label="Banners & Sliders" />
              <CollapseGroup groupKey="banners" icon={MdOutlinePermMedia} label="Banners">
                <SubItem to="/banners/management" label="Banners Management" />
                <SubItem to="/bannerlist2/List" label="Home Banners V2" />
                <SubItem to="/banners/sidebar" label="Sidebar Banners" />
                <SubItem to="/banners/category" label="Category Banners" />
                <SubItem to="/banners/offer" label="Offer Banners" />
                <SubItem to="/banners/footer" label="Footer Banners" />
              </CollapseGroup>

              <CollapseGroup groupKey="media" icon={MdOutlineViewCarousel} label="Sliders">
                <SubItem to="/homeSlider/list" label="Home Slider" />
                <SubItem to="/slider/deals" label="Deals Slider" />
                <SubItem to="/slider/featured" label="Featured Slider" />
              </CollapseGroup>

              <GroupLabel label="Finance" />
              <NavItem to="/wallet/transactions" icon={IoWalletOutline} label="Wallet Requests" />
            </>
          )}

          {isSeller && (
            <>
              <GroupLabel label="My Store" />
              <NavItem to="/seller/store-profile" icon={IoStorefrontOutline} label="Store Profile" />
              <NavItem to="/wallet/transactions" icon={IoWalletOutline} label="Wallet & Transactions" />
            </>
          )}
        </ul>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-[500] text-red-500 hover:bg-red-50 transition-all">
            <IoMdLogOut className="text-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {context?.windowWidth < 920 && context?.isSidebarOpen === true && (
        <div className="sidebarOverlay fixed top-0 left-0 bg-[rgba(0,0,0,0.4)] w-full h-full z-[51]" onClick={closeSidebar} />
      )}
    </>
  );
};

export default Sidebar;