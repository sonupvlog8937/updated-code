import { Button } from '@mui/material'
import Badge from "@mui/material/Badge";
import React, { useEffect, useRef, useState } from 'react';
import { IoHomeOutline } from "react-icons/io5";
import { IoSearch } from "react-icons/io5";
import { LuHeart } from "react-icons/lu";
import { BsBagCheck } from "react-icons/bs";
import { MdOutlineShoppingCart, MdOutlineFilterAlt } from "react-icons/md";
import { FiUser } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../../../hooks/useAppContext";
import { useLocation } from "react-router-dom";

const SCROLL_DELTA = 8;
const TOP_SAFE_ZONE = 80;

const MobileNav = () => {

    const context = useAppContext();
    const location = useLocation();
    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);

    const isFilterPage = location.pathname === "" || location.pathname === "";

    useEffect(() => {
        context?.setisFilterBtnShow(isFilterPage);
    }, [context, isFilterPage]);

     useEffect(() => {
        setIsNavVisible(true);
        lastScrollY.current = window.scrollY;
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            const diff = currentY - lastScrollY.current;

            if (currentY <= TOP_SAFE_ZONE) {
                setIsNavVisible(true);
                lastScrollY.current = currentY;
                return;
            }

            if (Math.abs(diff) >= SCROLL_DELTA) {
                setIsNavVisible(diff < 0);
                lastScrollY.current = currentY;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const openFilters = () => {
        context?.setOpenFilter(true);
        context?.setOpenSearchPanel(false);
    };

    const shouldKeepNavVisible = isFilterPage || isNavVisible;

    const hideNavClass = shouldKeepNavVisible
        ? "translate-y-0 opacity-100"
        : "translate-y-[120%] opacity-0 pointer-events-none";

    const navLinkClass = ({ isActive }) => (isActive ? "active" : "");

    return (
        <>
            {isFilterPage && (
                <div
                    className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-[52] transition-all duration-300 ease-out ${isNavVisible ? "bottom-[72px] opacity-100" : "bottom-[48px] opacity-0 pointer-events-none"
                        }`}
                >
                    <Button
                        onClick={openFilters}
                        className="!bg-black !text-white !capitalize !font-semibold !rounded-full !px-5 !py-2 !shadow-lg hover:!bg-neutral-800"
                    >
                        <span className="flex items-center gap-2 text-[13px]">
                            <MdOutlineFilterAlt size={16} />
                            Filter
                        </span>
                    </Button>
                </div>
            )}

            <div
                className={`mobileNav bg-white p-1 px-3 w-full flex items-center justify-between fixed bottom-0 left-0 gap-0 z-[51] border-t border-gray-200 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out ${hideNavClass}`}
            >
                <NavLink to="/" end className={navLinkClass} onClick={() => context?.setOpenSearchPanel(false)}>
                    <Button className="flex-col !w-[44px] !min-w-[44px] !capitalize !text-gray-700">
                        <IoHomeOutline size={18} />
                        <span className='text-[12px]'>Home</span>
                    </Button>
                </NavLink>

                <NavLink to="/cart" end className={navLinkClass} onClick={() => context?.setOpenSearchPanel(false)}>
                    <Button className="flex-col !w-[44px] !min-w-[44px] !capitalize !text-gray-700">
                        <Badge badgeContent={context?.cartData?.length || 0} color="secondary">
                            <MdOutlineShoppingCart size={18} />
                        </Badge>
                        <span className='text-[12px]'>Cart</span>
                    </Button>
                </NavLink>

                <NavLink to="/my-list" end className={navLinkClass} onClick={() => context?.setOpenSearchPanel(false)}>
                    <Button className="flex-col !w-[44px] !min-w-[44px] !capitalize !text-gray-700">
                        <LuHeart size={18} />
                        <span className='text-[12px]'>Wishlist</span>
                    </Button>
                </NavLink>

                <NavLink to="/my-orders" end className={navLinkClass} onClick={() => context?.setOpenSearchPanel(false)}>
                    <Button className="flex-col !w-[44px] !min-w-[44px] !capitalize !text-gray-700">
                        <BsBagCheck size={18} />
                        <span className='text-[12px]'>Orders</span>
                    </Button>
                </NavLink>

                <NavLink to="/my-account" end className={navLinkClass} onClick={() => context?.setOpenSearchPanel(false)}>
                    <Button className="flex-col !w-[44px] !min-w-[44px] !capitalize !text-gray-700">
                        <FiUser size={18} />
                        <span className='text-[12px]'>Account</span>
                    </Button>
                </NavLink>
            </div>
        </>
    );
};

export default MobileNav