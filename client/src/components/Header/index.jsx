import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import Search from "../Search";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa6";
import Tooltip from "@mui/material/Tooltip";
import { useAppContext } from "../../hooks/useAppContext";
import { Button } from "@mui/material";
import { IoSearch } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { IoBagCheckOutline } from "react-icons/io5";
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import { fetchDataFromApi } from "../../utils/api";
import { LuMapPin } from "react-icons/lu";
import { HiOutlineMenu } from "react-icons/hi";
import "./Navigation/style.css";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navigation = lazy(() => import("./Navigation"));

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -3, top: 13,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: "0 4px",
  },
}));

/* ─────────────────────────────────────────
   QUICK MENU STYLES
───────────────────────────────────────── */
const QM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .qm-trigger {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px;
    border-radius: 50%;
    border: 1.5px solid rgba(0,0,0,0.11);
    background: #fff;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
    flex-shrink: 0;
    outline: none;
  }
  .qm-trigger:hover { background: #f5f5f5; border-color: rgba(0,0,0,0.2); transform: scale(1.06); }
  .qm-trigger.qm-open { background: #111; border-color: #111; }
  .qm-trigger.qm-open .qm-dot { background: #fff; }

  .qm-dots { display: flex; flex-direction: column; gap: 3.5px; align-items: center; }
  .qm-dot { width: 4px; height: 4px; border-radius: 50%; background: #222; transition: background 0.15s; }

  .qm-notif-pip {
    position: absolute; top: 4px; right: 4px;
    width: 8px; height: 8px; border-radius: 50%;
    background: #ef4444; border: 1.5px solid #fff;
    animation: qmPulse 2.2s ease-in-out infinite;
  }
  @keyframes qmPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
    50%      { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
  }

  .qm-backdrop {
    position: fixed; inset: 0; z-index: 1200;
    background: rgba(0,0,0,0.04);
    backdrop-filter: blur(0px);
    animation: qmBdIn 0.15s ease both;
  }
  @keyframes qmBdIn { from{opacity:0} to{opacity:1} }

  .qm-panel {
    position: fixed;
    top: 66px; right: 16px;
    z-index: 1201;
    width: 296px;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.07);
    overflow: hidden;
    transform-origin: top right;
    animation: qmIn 0.22s cubic-bezier(0.34,1.4,0.64,1) both;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  @keyframes qmIn {
    from { opacity: 0; transform: scale(0.86) translateY(-10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .qm-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px 12px;
    border-bottom: 1px solid #f1f3f5;
  }
  .qm-head-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.10em; text-transform: uppercase;
    color: rgba(0,0,0,0.32);
  }
  .qm-head-close {
    width: 24px; height: 24px; border-radius: 50%;
    border: none; background: #f3f4f6;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 13px; font-weight: 700; color: #555;
    transition: background 0.14s; padding: 0; line-height: 1;
  }
  .qm-head-close:hover { background: #e5e7eb; color: #111; }

  .qm-list { padding: 6px 0; }

  .qm-row {
    display: flex; align-items: center; gap: 13px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.11s;
    text-decoration: none; color: inherit;
    border: none; background: none;
    width: 100%; text-align: left;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
  }
  .qm-row:hover { background: #f8f9fa; }
  .qm-row:hover .qm-icon { transform: scale(1.1) rotate(-3deg); }
  .qm-row:active { background: #f1f3f5; }

  .qm-icon {
    width: 42px; height: 42px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center;
    font-size: 19px; flex-shrink: 0;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }

  .qm-text { flex: 1; min-width: 0; }
  .qm-name {
    font-size: 13.5px; font-weight: 650; color: #111;
    display: block; line-height: 1.3;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .qm-desc {
    font-size: 11px; color: rgba(0,0,0,0.4);
    display: block; margin-top: 1px; line-height: 1.3;
  }

  .qm-badge {
    font-size: 10px; font-weight: 700;
    padding: 2px 7px; border-radius: 99px;
    background: #ef4444; color: #fff;
    flex-shrink: 0;
    animation: qmBadge 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes qmBadge { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }

  .qm-chev { color: rgba(0,0,0,0.18); font-size: 17px; transition: transform 0.14s, color 0.14s; flex-shrink: 0; }
  .qm-row:hover .qm-chev { transform: translateX(3px); color: rgba(0,0,0,0.4); }

  .qm-sep { height: 1px; background: #f1f3f5; margin: 5px 0; }

  /* Icon backgrounds */
  .ic-seller   { background: linear-gradient(135deg,#f093fb,#f5576c); }
  .ic-app      { background: linear-gradient(135deg,#667eea,#764ba2); }
  .ic-offers   { background: linear-gradient(135deg,#4facfe,#00f2fe); }
  .ic-notif    { background: linear-gradient(135deg,#43e97b,#38f9d7); }
  .ic-settings { background: linear-gradient(135deg,#fa709a,#fee140); }

  .qm-foot {
    padding: 11px 16px 13px;
    border-top: 1px solid #f1f3f5;
    display: flex; align-items: center; gap: 8px;
  }
  .qm-foot-ver { font-size: 10.5px; color: rgba(0,0,0,0.28); flex: 1; font-family: 'Plus Jakarta Sans', sans-serif; }
  .qm-dl-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px; border-radius: 99px;
    background: #f3f4f6; font-size: 11px; font-weight: 600;
    color: #555; text-decoration: none;
    transition: background 0.14s, color 0.14s;
  }
  .qm-dl-chip:hover { background: #e5e7eb; color: #111; }

  @media (max-width: 600px) {
    .qm-panel { right: 8px; left: 8px; width: auto; top: 58px; border-radius: 16px; }
  }
`;

/* ─────────────────────────────────────────
   QUICK MENU PANEL
───────────────────────────────────────── */
const QuickMenu = ({ onClose, notifCount }) => {
  const nav = useNavigate();

  const go = (path) => { nav(path); onClose(); };

  const items = [
    {
      key: "seller",
      label: "Become a Seller",
      desc: "List & sell your products",
      icon: "🏪",
      ic: "ic-seller",
      action: () => go("/become-seller"),
    },
    {
      key: "app",
      label: "Download App",
      desc: "Faster mobile experience",
      icon: "📲",
      ic: "ic-app",
      href: "/699b044d39ee2939e558446e.apk",
      download: true,
    },
    {
      key: "offers",
      label: "View Offers",
      desc: "Deals, coupons & flash sales",
      icon: "🎁",
      ic: "ic-offers",
      action: () => go("/offers"),
    },
    {
      key: "notif",
      label: "Notifications",
      desc: notifCount > 0 ? `${notifCount} new` : "Stay updated",
      icon: "🔔",
      ic: "ic-notif",
      badge: notifCount > 0 ? notifCount : null,
      action: () => go("/notifications"),
    },
    {
      key: "settings",
      label: "Settings",
      desc: "Account & preferences",
      icon: "⚙️",
      ic: "ic-settings",
      action: () => go("/settings"),
    },
  ];

  return (
    <>
      <div className="qm-backdrop" onClick={onClose} />
      <div className="qm-panel" role="dialog" aria-modal="true" aria-label="Quick menu">

        <div className="qm-head">
          <span className="qm-head-label">Quick Actions</span>
          <button className="qm-head-close" onClick={onClose} aria-label="Close">&#x2715;</button>
        </div>

        <div className="qm-list">
          {items.map((item, idx) => {
            const inner = (
              <>
                <div className={`qm-icon ${item.ic}`}>{item.icon}</div>
                <div className="qm-text">
                  <span className="qm-name">{item.label}</span>
                  <span className="qm-desc">{item.desc}</span>
                </div>
                {item.badge && <span className="qm-badge">{item.badge}</span>}
                <span className="qm-chev">&#xBB;</span>
              </>
            );

            return (
              <React.Fragment key={item.key}>
                {item.key === "settings" && <div className="qm-sep" />}
                {item.href ? (
                  <a href={item.href} download={item.download} className="qm-row" onClick={onClose}>
                    {inner}
                  </a>
                ) : (
                  <button className="qm-row" onClick={item.action}>
                    {inner}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="qm-foot">
          <span className="qm-foot-ver">Zeedaddy v2.0 &middot; &#169; 2026</span>
          <a href="/699b044d39ee2939e558446e.apk" download className="qm-dl-chip">
            &#x1F4F2; Get App
          </a>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────
   HEADER
───────────────────────────────────────── */
const Header = () => {
  const [anchorEl, setAnchorEl]             = useState(null);
  const [isOpenCatPanel, setIsOpenCatPanel] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen]   = useState(false);

  const context  = useAppContext();
  const location = useLocation();
  const history  = useNavigate();

  // Replace with real count from context / API
  const notifCount = 3;

  const open               = Boolean(anchorEl);
  const hideNavigationOnPage = [""].includes(location.pathname);
  const isDesktop          = context?.windowWidth > 992;

  const handleClose     = useCallback(() => setAnchorEl(null), []);
  const handleUserClick = useCallback((e) => setAnchorEl(e.currentTarget), []);

  useEffect(() => {
    if (localStorage.getItem("logo")) return;
    fetchDataFromApi("/api/logo").then((res) => {
      if (res?.logo?.[0]?.logo) localStorage.setItem("logo", res.logo[0].logo);
    });
  }, []);

  const logout = useCallback(() => {
    setAnchorEl(null);
    fetchDataFromApi(
      `/api/user/logout?token=${localStorage.getItem("accessToken")}`,
      { withCredentials: true }
    ).then((res) => {
      if (res?.error === false) {
        context.setIsLogin(false);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        context.setUserData(null);
        context?.setCartData([]);
        context?.setMyListData([]);
        history("/");
      }
    });
  }, [context, history]);

  return (
    <>
      <style>{QM_STYLES}</style>

      <header className="bg-white fixed lg:sticky left-0 w-full top-0 lg:-top-[47px] z-[101]">

        {/* Top strip */}
        <div className="top-strip hidden lg:block py-2 border-t-[1px] border-gray-250 border-b-[1px]">
          <div className="container">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-[500] mt-0 mb-0 col1 w-[50%] hidden lg:block">
                Get up to 50% off new season styles, limited time only
              </p>
              <div className="col2 flex items-center justify-between w-full lg:w-[50%] lg:justify-end">
                <ul className="flex items-center gap-3 w-full justify-between lg:w-[200px]">
                  <li className="list-none">
                    <Link to="/help-center" className="text-[11px] lg:text-[13px] link font-[500] transition">Help Center</Link>
                  </li>
                  <li className="list-none">
                    <Link to="/order-tracking" className="text-[11px] lg:text-[13px] link font-[500] transition">Order Tracking</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Main bar */}
        <div className="header py-2 lg:py-4 border-b-[1px] border-gray-250">
          <div className="container flex items-center justify-between">

            {!isDesktop && (
              <Button className="!w-[35px] !min-w-[35px] !h-[35px] !rounded-full !text-gray-800" onClick={() => setIsOpenCatPanel(true)}>
                <HiOutlineMenu size={22} />
              </Button>
            )}

            <div className="col1 w-[40%] lg:w-[25%] item-center" style={{ marginRight: "135px"}}>
              <Link to="/">
                <img src={localStorage.getItem("logo")} className="max-w-[140px] lg:max-w-[200px]"
                  loading="eager" width="200" height="50" alt="Zeedaddy" />
              </Link>
            </div>

            <div className={`col2 fixed top-0 left-0 w-full h-full lg:w-[40%] lg:static p-2 lg:p-0 bg-white z-50 ${isDesktop ? "!block" : ""} ${context?.openSearchPanel === true ? "block" : "hidden"}`}>
              <Search />
            </div>

            <div className="col3 w-[10%] lg:w-[30%] flex items-center pl-7">
              <ul className="flex items-center justify-end gap-0 lg:gap-3 w-full">

                {/* Login/Register */}
                {!context.isLogin && isDesktop && (
                  <li className="list-none">
                    <Link to="/login" className="link transition text-[15px] font-[500]">Login</Link>
                    {" "}|{" "}
                    <Link to="/register" className="link transition text-[15px] font-[500]">Register</Link>
                  </li>
                )}

                {/* Account */}
                {context.isLogin && isDesktop && (
                  <li>
                    <Button className="!text-[#000] myAccountWrap flex items-center gap-3 cursor-pointer" onClick={handleUserClick}>
                      <Button className="!w-[40px] !h-[40px] !min-w-[40px] !rounded-full !bg-gray-200">
                        <FaRegUser className="text-[17px] text-[rgba(0,0,0,0.7)]" />
                      </Button>
                      <div className="info flex flex-col">
                        <h4 className="leading-3 text-[14px] text-[rgba(0,0,0,0.6)] font-[500] mb-0 capitalize text-left">{context?.userData?.name}</h4>
                        <span className="text-[13px] text-[rgba(0,0,0,0.6)] font-[400] capitalize text-left">{context?.userData?.email}</span>
                      </div>
                    </Button>
                    <Menu anchorEl={anchorEl} id="account-menu" open={open} onClose={handleClose} onClick={handleClose}
                      slotProps={{ paper: { elevation: 0, sx: { overflow:"visible", filter:"drop-shadow(0px 2px 8px rgba(0,0,0,0.32))", mt:1.5, "& .MuiAvatar-root":{width:32,height:32,ml:-0.5,mr:1}, "&::before":{content:'""',display:"block",position:"absolute",top:0,right:14,width:10,height:10,bgcolor:"background.paper",transform:"translateY(-50%) rotate(45deg)",zIndex:0} } } }}
                      transformOrigin={{ horizontal:"right", vertical:"top" }}
                      anchorOrigin={{ horizontal:"right", vertical:"bottom" }}>
                      <Link to="/my-account" className="w-full block"><MenuItem onClick={handleClose} className="flex gap-2 !py-2"><FaRegUser className="text-[18px]"/><span className="text-[14px]">My Account</span></MenuItem></Link>
                      <Link to="/address" className="w-full block"><MenuItem onClick={handleClose} className="flex gap-2 !py-2"><LuMapPin className="text-[18px]"/><span className="text-[14px]">Address</span></MenuItem></Link>
                      <Link to="/my-orders" className="w-full block"><MenuItem onClick={handleClose} className="flex gap-2 !py-2"><IoBagCheckOutline className="text-[18px]"/><span className="text-[14px]">Orders</span></MenuItem></Link>
                      <Link to="/my-list" className="w-full block"><MenuItem onClick={handleClose} className="flex gap-2 !py-2"><IoMdHeartEmpty className="text-[18px]"/><span className="text-[14px]">My List</span></MenuItem></Link>
                      <MenuItem onClick={logout} className="flex gap-2 !py-2"><IoIosLogOut className="text-[18px]"/><span className="text-[14px]">Logout</span></MenuItem>
                    </Menu>
                  </li>
                )}

                {/* Wishlist */}
                {isDesktop && (
                  <li>
                    <Tooltip title="Wishlist">
                      <Link to="/my-list">
                        <IconButton aria-label="wishlist">
                          <StyledBadge badgeContent={context?.myListData?.length || 0} color="secondary"><FaRegHeart /></StyledBadge>
                        </IconButton>
                      </Link>
                    </Tooltip>
                  </li>
                )}

                {/* Cart */}
                {isDesktop && (
                  <li>
                    <Tooltip title="Cart">
                      <Link to="/cart">
                        <IconButton aria-label="cart">
                          <StyledBadge badgeContent={context?.cartData?.length || 0} color="secondary"><MdOutlineShoppingCart /></StyledBadge>
                        </IconButton>
                      </Link>
                    </Tooltip>
                  </li>
                )}

                {/* Search */}
                <li style={{ marginRight: "10px", listStyle: "none" }}>
  <Tooltip title="Search Products" arrow>
    <IconButton
      aria-label="search"
      onClick={() => context?.setOpenSearchPanel(true)}
      sx={{
        backgroundColor: "#f5f5f5",
        width: "40px",
        height: "40px",
        transition: "all 0.3s ease",
        "&:hover": {
          backgroundColor: "#1976d2",
          color: "#fff",
          transform: "scale(1.1)"
        }
      }}
    >
      <IoSearch />
    </IconButton>
  </Tooltip>
</li>

                {/* Three-dot Quick Menu */}
                <li style={{ position: "relative" }}>
                  <Tooltip title="More">
                    <button
                      className={`qm-trigger${quickMenuOpen ? " qm-open" : ""}`}
                      onClick={() => setQuickMenuOpen(p => !p)}
                      aria-label="More options"
                      aria-expanded={quickMenuOpen}
                      aria-haspopup="dialog"
                    >
                      <span className="qm-dots">
                        <span className="qm-dot" />
                        <span className="qm-dot" />
                        <span className="qm-dot" />
                      </span>
                      {notifCount > 0 && !quickMenuOpen && <span className="qm-notif-pip" />}
                    </button>
                  </Tooltip>
                </li>

              </ul>
            </div>
          </div>
        </div>

        {(!hideNavigationOnPage || isOpenCatPanel) && (
          <Suspense fallback={null}>
            <Navigation isOpenCatPanel={isOpenCatPanel} setIsOpenCatPanel={setIsOpenCatPanel} />
          </Suspense>
        )}
      </header>

      {/* Quick menu — outside header for correct z-index */}
      {quickMenuOpen && (
        <QuickMenu onClose={() => setQuickMenuOpen(false)} notifCount={notifCount} />
      )}

      <div className="afterHeader mt-[65px] lg:mt-0" />
    </>
  );
};

export default Header;