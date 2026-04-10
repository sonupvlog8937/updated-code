import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Ye line page ko top par push kar degi
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // "smooth" bhi use kar sakte hain, par instant production ke liye better hai
    });
  }, [pathname]); // Jab bhi pathname badlega, ye trigger hoga

  return null;
};

export default ScrollToTop;