import { Button } from "@mui/material";
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { RiProductHuntLine } from "react-icons/ri";
import { TbCategory } from "react-icons/tb";
import { IoBagCheckOutline, IoStorefrontOutline } from "react-icons/io5";
import { IoMdLogOut } from "react-icons/io";
import { FiUsers } from "react-icons/fi";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";

const menuBtnClass =
  "w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]";

const Sidebar = () => {
  

  const context = useContext(MyContext);
  const navigate = useNavigate();

  const userRole = context?.userData?.role || "USER";
  const isAdmin = userRole === "ADMIN";
  const isSeller = userRole === "SELLER";


  const closeSidebar = () => {
    if (context?.windowWidth < 992) {
      context?.setisSidebarOpen(false);
    }
  };

  const logout = () => {
    fetchDataFromApi(`/api/user/logout?token=${localStorage.getItem("accessToken")}`).then(
      (res) => {
        if (res?.error === false) {
          context.setIsLogin(false);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          navigate("/login");
        }
      },
    );
  };


  return (
    <>
      <div
        className={`sidebar fixed top-0 left-0 z-[52] bg-[#fff] h-full border-r border-[rgba(0,0,0,0.1)] py-2 px-4 w-[${
          context.isSidebarOpen === true ? `${20}%` : "0px"
        }]`}
      >
        <div className="py-2 w-full" onClick={closeSidebar}>
          <Link to="/">
             <img src={localStorage.getItem("logo")} className="w-[170px] md:min-w-[200px]" />
          </Link>
        </div>

        <Link to='/profile'>
          <div className="px-2 py-2 mb-2 bg-[#f6f8fc] rounded-md border border-[#e5e7eb]">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Signed in as</p>
          <p className="text-[13px] font-[700] text-[#1e293b]">{isAdmin ? "Admin Panel" : isSeller ? "Seller Panel" : "Control Panel"}</p>
        </div>
          </Link>

        <ul className="mt-2 overflow-y-scroll max-h-[78vh]">
          <li>
             <Link to="/" onClick={closeSidebar}>
              <Button className={menuBtnClass}>
                <RxDashboard className="text-[18px]" /> <span>Dashboard</span>
              </Button>
            </Link>
          </li>

          <li>
            <Link to="/products" onClick={closeSidebar}>
              <Button className={menuBtnClass}>
                <RiProductHuntLine className="text-[18px]" />
                <span>{isSeller ? "My Products" : "Products"}</span>
              </Button>
            </Link>
          </li>


          <li>
            <Link to="/orders" onClick={closeSidebar}>
              <Button className={menuBtnClass}>
                <IoBagCheckOutline className="text-[18px]" />
                <span>{isSeller ? "My Store Orders" : "All Orders"}</span>
              </Button>
            </Link>
          </li>



{isAdmin && (
            <>
              <li>
                <Link to="/users" onClick={closeSidebar}>
                  <Button className={menuBtnClass}>
                    <FiUsers className="text-[18px]" /> <span>Users & Sellers</span>
                           </Button>
               </Link>
              </li>
              <li>
                <Link to="/category/list" onClick={closeSidebar}>
                  <Button className={menuBtnClass}>
                    <TbCategory className="text-[18px]" /> <span>Categories</span>
                  </Button>
                </Link>
              </li>
            </>
          )}

          {isSeller && (
            <li>
              <Button className={menuBtnClass} disabled>
                <IoStorefrontOutline className="text-[18px]" /> <span>Seller workspace active</span>
              </Button>
             </li>
          )}

          <li>
           <Button className={menuBtnClass} onClick={logout}>
              <IoMdLogOut className="text-[20px]" /> <span>Logout</span>
            </Button>
          </li>
        </ul>



      </div>


       {context?.windowWidth < 920 && context?.isSidebarOpen === true && (
        <div
          className="sidebarOverlay pointer-events-none fixed top-0 left-0 bg-[rgba(0,0,0,0.5)] w-full h-full z-[51]"
          onClick={closeSidebar}
        ></div>
      )}



    </>
  );
};

export default Sidebar;
