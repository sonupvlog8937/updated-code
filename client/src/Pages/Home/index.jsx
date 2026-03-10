import React, { useEffect, useMemo, useState, useRef } from "react";
import HomeSlider from "../../components/HomeSlider";
import HomeCatSlider from "../../components/HomeCatSlider";
import { LiaShippingFastSolid } from "react-icons/lia";
import AdsBannerSlider from "../../components/AdsBannerSlider";
import AdsBannerSliderV2 from "../../components/AdsBannerSliderV2";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ProductsSlider from "../../components/ProductsSlider";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import { Navigation, FreeMode, Autoplay, Pagination, EffectFade } from "swiper/modules";
import BlogItem from "../../components/BlogItem";
import HomeBannerV2 from "../../components/HomeSliderV2";
import BannerBoxV2 from "../../components/bannerBoxV2";
import { fetchDataFromApi } from "../../utils/api";
import { useAppContext } from "../../hooks/useAppContext";
import ProductLoading from "../../components/ProductLoading";
import BannerLoading from "../../components/LoadingSkeleton/bannerLoading";
import { Button } from "@mui/material";
import { MdArrowRightAlt } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { FiRefreshCcw } from "react-icons/fi";
import { IoHeadsetOutline } from "react-icons/io5";
import { FaBolt, FaGift, FaRegCopy, FaStar, FaArrowRight, FaTruck, FaLock } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { RiSparklingLine } from "react-icons/ri";

/* ─── Inline CSS Animations ──────────────────────────────────────────────── */
const inlineStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --red: #E8362A;
    --red-dark: #c22c21;
    --dark: #0a0a0f;
    --dark2: #13131a;
    --surface: #1a1a24;
    --surface2: #22222e;
    --text-muted: #8b8b9e;
    --border: rgba(255,255,255,0.07);
    --gold: #f5c842;
  }

  .home-root * { font-family: 'DM Sans', sans-serif; }
  .home-root h1, .home-root h2, .home-root h3 { font-family: 'Syne', sans-serif; }

  /* ── Ticker ── */
  @keyframes ticker-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .ticker-track { animation: ticker-scroll 18s linear infinite; }
  .ticker-track:hover { animation-play-state: paused; }

  /* ── Fade up on mount ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-fadeup { animation: fadeUp 0.65s cubic-bezier(.22,.61,.36,1) both; }
  .anim-delay-1 { animation-delay: 0.1s; }
  .anim-delay-2 { animation-delay: 0.22s; }
  .anim-delay-3 { animation-delay: 0.34s; }
  .anim-delay-4 { animation-delay: 0.46s; }
  .anim-delay-5 { animation-delay: 0.58s; }

  /* ── Shimmer badge ── */
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .shimmer-badge {
    background: linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%);
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
  }

  /* ── Pulse ring on icon ── */
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(232,54,42,0.55); }
    70%  { box-shadow: 0 0 0 14px rgba(232,54,42,0); }
    100% { box-shadow: 0 0 0 0 rgba(232,54,42,0); }
  }
  .pulse-ring { animation: pulseRing 2.2s ease-out infinite; }

  /* ── Counter flip ── */
  @keyframes countFlip {
    0%   { transform: rotateX(0deg); }
    50%  { transform: rotateX(-90deg); }
    100% { transform: rotateX(0deg); }
  }
  .count-flip { animation: countFlip 0.45s ease; }

  /* ── Hero image slide in ── */
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(40px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  .anim-slide-right { animation: slideInRight 0.7s cubic-bezier(.22,.61,.36,1) both; }

  /* ── Floating dots background ── */
  @keyframes floatDot {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  .float-dot-1 { animation: floatDot 4s ease-in-out infinite; }
  .float-dot-2 { animation: floatDot 5.5s ease-in-out infinite 0.8s; }
  .float-dot-3 { animation: floatDot 3.8s ease-in-out infinite 1.6s; }

  /* ── Hero gradient mesh background ── */
  .hero-mesh {
    background:
      radial-gradient(ellipse 55% 45% at 70% 60%, rgba(232,54,42,0.18) 0%, transparent 70%),
      radial-gradient(ellipse 40% 35% at 20% 30%, rgba(99,60,255,0.12) 0%, transparent 65%),
      #0a0a0f;
  }

  /* ── Swiper dots (custom) ── */
  .hero-swiper .swiper-pagination-bullet {
    width: 8px; height: 8px;
    background: rgba(255,255,255,0.35);
    opacity: 1;
    transition: all 0.3s;
  }
  .hero-swiper .swiper-pagination-bullet-active {
    width: 28px;
    border-radius: 4px;
    background: #E8362A;
  }

  /* ── Benefit card hover ── */
  .benefit-card {
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .benefit-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.12);
    border-color: rgba(232,54,42,0.3) !important;
  }

  /* ── Section heading underline ── */
  .section-title::after {
    content: '';
    display: block;
    width: 42px;
    height: 3px;
    background: #E8362A;
    border-radius: 2px;
    margin-top: 7px;
  }

  /* ── FAQ accordion ── */
  .faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.35s cubic-bezier(.22,.61,.36,1), opacity 0.3s;
    opacity: 0;
  }
  .faq-answer.open {
    max-height: 120px;
    opacity: 1;
  }

  /* ── Shipping banner parallax-ish hover ── */
  .shipping-banner-img {
    transition: transform 6s ease;
  }
  .shipping-banner:hover .shipping-banner-img {
    transform: scale(1.06);
  }

  /* ── Timer digit ── */
  .timer-digit {
    background: white;
    color: #E8362A;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    letter-spacing: -0.03em;
    perspective: 200px;
  }

  /* ── Review card hover ── */
  .review-card {
    transition: transform 0.22s ease, box-shadow 0.22s ease;
  }
  .review-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.1);
  }

  /* ── Login popup animation ── */
  @keyframes popupIn {
    from { opacity: 0; transform: scale(0.94) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .popup-card { animation: popupIn 0.35s cubic-bezier(.22,.61,.36,1) both; }

  /* ── Gradient text ── */
  .gradient-text {
    background: linear-gradient(135deg, #fff 30%, #ff9e9e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Noise overlay ── */
  .noise::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    border-radius: inherit;
  }

  /* ── Newsletter input focus ── */
  .newsletter-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(232,54,42,0.45);
  }

  /* ── Shop now CTA hover ── */
  .cta-primary {
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .cta-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.15);
    transform: translateX(-100%);
    transition: transform 0.35s ease;
  }
  .cta-primary:hover::before { transform: translateX(0); }
  .cta-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,54,42,0.4); }

  .cta-secondary {
    transition: background 0.2s ease, transform 0.2s ease;
  }
  .cta-secondary:hover {
    background: rgba(255,255,255,0.12) !important;
    transform: translateY(-1px);
  }
`;

const Home = () => {
  const [value, setValue] = useState(0);
  const [homeSlidesData, setHomeSlidesData] = useState([]);
  const [popularProductsData, setPopularProductsData] = useState([]);
  const [productsData, setAllProductsData] = useState([]);
  const [productsBanners, setProductsBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bannerV1Data, setBannerV1Data] = useState([]);
  const [bannerList2Data, setBannerList2Data] = useState([]);
  const [blogData, setBlogData] = useState([]);
  const [randomCatProducts, setRandomCatProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [activeFaq, setActiveFaq] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [activeSlide, setActiveSlide] = useState(0);

  const context = useAppContext();
  const navigate = useNavigate();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const sliderImages = [
    "https://res.cloudinary.com/dn7ko6gut/image/upload/v1771620709/1771620706193_Untitled_design_53_1.png",
    "https://res.cloudinary.com/dn7ko6gut/image/upload/v1771620690/1771620686726_Untitled_design_52_1.png",
    "https://res.cloudinary.com/dn7ko6gut/image/upload/v1771620663/1771620660334_Untitled_design_51_1.png"
  ];

  const sliderHeadlines = [
    { tag: "New Arrivals", title: "Premium products,", titleAccent: "better prices.", sub: "Handpicked collections — fast delivery, easy returns, trusted quality." },
    { tag: "Top Deals", title: "Upto 60% off on", titleAccent: "top categories.", sub: "Limited time offers across electronics, fashion, home & more." },
    { tag: "Flash Sale", title: "Today only —", titleAccent: "don't miss out.", sub: "Shop before midnight and save big on our bestsellers." },
  ];

  useEffect(() => {
    const nextMidnight = new Date();
    nextMidnight.setHours(23, 59, 59, 999);
    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextMidnight - now;
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0 }); clearInterval(timer); return; }
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo(0, 0);
    Promise.all([
      fetchDataFromApi("/api/homeSlides"),
      fetchDataFromApi("/api/product/getAllProducts?page=1&limit=12"),
      fetchDataFromApi("/api/product/getAllProducts"),
      fetchDataFromApi("/api/product/getAllFeaturedProducts"),
      fetchDataFromApi("/api/bannerV1"),
      fetchDataFromApi("/api/bannerList2"),
      fetchDataFromApi("/api/blog"),
    ]).then(([slides, products, bannerProducts, featured, bannerV1, bannerList2, blogs]) => {
      if (!isMounted) return;
      setHomeSlidesData(slides?.data || []);
      setAllProductsData(products?.products || []);
      setProductsBanners(bannerProducts?.products || []);
      setFeaturedProducts(featured?.products || []);
      setBannerV1Data(bannerV1?.data || []);
      setBannerList2Data(bannerList2?.data || []);
      setBlogData(blogs?.blogs || []);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (context?.isLogin === false) {
      const popupTimer = setTimeout(() => setShowLoginPopup(true), 800);
      return () => clearTimeout(popupTimer);
    }
    setShowLoginPopup(false);
  }, [context?.isLogin]);

  useEffect(() => {
    if (context?.catData?.length !== 0) {
      fetchDataFromApi(`/api/product/getAllProductsByCatId/${context?.catData[0]?._id}`).then((res) => {
        if (res?.error === false) setPopularProductsData(res?.products);
      });
    }
    const categoryIndexes = context?.catData?.map((_, index) => index)?.filter((index) => index !== 0)?.sort(() => Math.random() - 0.5)?.slice(0, 4);
    getRandomProducts(categoryIndexes || [], context?.catData);
  }, [context?.catData]);

  const getRandomProducts = (arr, catArr) => {
    const filterData = [];
    for (let i = 0; i < arr.length; i++) {
      const catId = catArr[arr[i]]?._id;
      if (!catId) continue;
      fetchDataFromApi(`/api/product/getAllProductsByCatId/${catId}`).then((res) => {
        filterData.push({ catName: catArr[arr[i]]?.name, data: res?.products });
        setRandomCatProducts([...filterData]);
      });
    }
  };

  const handleChange = (event, newValue) => setValue(newValue);

  const filterByCatId = (id) => {
    setPopularProductsData([]);
    fetchDataFromApi(`/api/product/getAllProductsByCatId/${id}`).then((res) => {
      if (res?.error === false) setPopularProductsData(res?.products);
    });
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return productsData;
    return productsData.filter((item) => (item?.name || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [productsData, searchTerm]);

  const flashSaleProducts = useMemo(() => featuredProducts.slice(0, 6), [featuredProducts]);

  const quickBenefits = [
    { title: "Same Day Dispatch", desc: "Before 4PM orders are dispatched same day.", icon: <FaBolt />, color: "#f97316", bg: "rgba(249,115,22,0.1)" },
    { title: "Rewards Club", desc: "Earn coins on every order and redeem on next checkout.", icon: <FaGift />, color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
    { title: "4.8/5 Rated", desc: "Trusted by thousands of happy customers.", icon: <FaStar />, color: "#eab308", bg: "rgba(234,179,8,0.1)" },
  ];

  const faqs = [
    { q: "How fast is shipping?", a: "Metro cities: 1-2 days, others: 3-5 days with live tracking." },
    { q: "Do you offer cash on delivery?", a: "Yes, COD is available on most pin codes with a small handling fee." },
    { q: "Can I return a product?", a: "Yes, easy 7-day return on eligible products from My Orders page." },
  ];

  const copyCouponCode = async () => {
    try {
      await navigator.clipboard.writeText("SAVE20");
      setCouponMessage("✓ Coupon copied: SAVE20");
      setTimeout(() => setCouponMessage(""), 2500);
    } catch {
      setCouponMessage("Unable to copy right now.");
    }
  };

  const subscribeNewsletter = (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      setNewsletterMessage("Please enter a valid email address.");
      return;
    }
    setNewsletterMessage("🎉 You're in! Check your inbox for exclusive deals.");
    setNewsletterEmail("");
  };

  const timerLabels = ["HRS", "MIN", "SEC"];

  return (
    <div className="home-root">
      <style>{inlineStyles}</style>

      {/* ─── Login Popup ───────────────────────────────────────────────────── */}
      {showLoginPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-4" style={{ background: "rgba(10,10,15,0.72)", backdropFilter: "blur(6px)" }}>
          <div className="popup-card w-full max-w-[440px] rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.35)" }}>
            <div className="relative noise overflow-hidden p-7" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a24 60%, #2a1a28 100%)" }}>
              {/* Decorative dots */}
              <div className="float-dot-1 absolute top-4 right-8 w-16 h-16 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #E8362A, transparent)" }} />
              <div className="float-dot-2 absolute bottom-3 right-20 w-8 h-8 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #6b3cf0, transparent)" }} />
              <span className="inline-block text-[10px] uppercase tracking-[0.18em] px-3 py-1 rounded-full mb-4 shimmer-badge" style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>Welcome back</span>
              <h3 className="text-[26px] font-[800] text-white leading-tight mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Exclusive access<br />awaits you</h3>
              <p className="text-[14px] mb-0" style={{ color: "rgba(255,255,255,0.55)" }}>Login for faster checkout, wishlist sync, premium offers & smart order tracking.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  className="h-[46px] rounded-xl font-[600] text-[14px] text-white transition-all cta-primary"
                  style={{ background: "#0a0a0f" }}
                  onClick={() => { setShowLoginPopup(false); navigate('/login'); }}
                >
                  Login Now
                </button>
                <button
                  className="h-[46px] rounded-xl font-[600] text-[14px] transition-all"
                  style={{ border: "1.5px solid #0a0a0f", color: "#0a0a0f", background: "white" }}
                  onClick={() => { setShowLoginPopup(false); navigate('/register'); }}
                >
                  Create Account
                </button>
              </div>
              <button className="w-full text-[13px] transition-colors" style={{ color: "#9ca3af" }} onClick={() => setShowLoginPopup(false)}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Top Announcement Ticker ───────────────────────────────────────── */}
      <div className="overflow-hidden py-2.5" style={{ background: "#E8362A" }}>
        <div className="ticker-track flex gap-0 whitespace-nowrap" style={{ width: "max-content" }}>
          {[...Array(6)].map((_, i) => (
            <span key={i} className="flex items-center gap-8 px-8 text-white text-[12px] font-[500] tracking-wide">
              <span>🎁 Use code <strong>SAVE20</strong> for 20% off</span>
              <span className="opacity-50">•</span>
              <span>🚀 Free delivery on orders above ₹200</span>
              <span className="opacity-50">•</span>
              <span>⭐ 4.8/5 rated by 10,000+ customers</span>
              <span className="opacity-50">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── HERO BANNER ───────────────────────────────────────────────────── */}
      <section className="hero-mesh relative overflow-hidden noise" style={{ minHeight: "500px" }}>
        {/* Abstract floating orbs */}
        <div className="float-dot-1 absolute top-12 left-[8%] w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(232,54,42,0.12), transparent)", filter: "blur(32px)" }} />
        <div className="float-dot-2 absolute bottom-8 left-[30%] w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(107,60,240,0.1), transparent)", filter: "blur(24px)" }} />
        <div className="float-dot-3 absolute top-6 right-[10%] w-32 h-32 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,200,80,0.07), transparent)", filter: "blur(20px)" }} />

        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-10 lg:py-14">

            {/* Left: Text content */}
            <div className="lg:col-span-5 text-white">
              <span className="anim-fadeup anim-delay-1 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full mb-5 shimmer-badge" style={{ border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)" }}>
                <RiSparklingLine className="text-[#f5c842]" />
                {sliderHeadlines[activeSlide]?.tag}
              </span>

              <h1 className="anim-fadeup anim-delay-2 text-[30px] sm:text-[38px] lg:text-[48px] font-[800] leading-[1.1] mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                <span style={{ color: "rgba(255,255,255,0.92)" }}>{sliderHeadlines[activeSlide]?.title}</span>
                <br />
                <span className="gradient-text">{sliderHeadlines[activeSlide]?.titleAccent}</span>
              </h1>

              <p className="anim-fadeup anim-delay-3 text-[15px] leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.5)" }}>
                {sliderHeadlines[activeSlide]?.sub}
              </p>

              <div className="anim-fadeup anim-delay-4 flex flex-wrap gap-3">
                <Link to="/products">
                  <button className="cta-primary inline-flex items-center gap-2 h-[46px] px-6 rounded-xl font-[600] text-[14px] text-white"
                    style={{ background: "#E8362A" }}>
                    Shop Now <FaArrowRight className="text-[12px]" />
                  </button>
                </Link>
                <Link to="/categories">
                  <button className="cta-secondary inline-flex items-center h-[46px] px-6 rounded-xl font-[600] text-[14px] text-white"
                    style={{ border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)" }}>
                    View Categories
                  </button>
                </Link>
              </div>

              {/* Trust mini-badges */}
              <div className="anim-fadeup anim-delay-5 flex flex-wrap gap-4 mt-8">
                {[
                  { icon: <FaTruck />, label: "Free Shipping" },
                  { icon: <FaLock />, label: "Secure Pay" },
                  { icon: <FiRefreshCcw />, label: "Easy Returns" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Slider */}
            <div className="lg:col-span-7 anim-slide-right">
              <Swiper
                loop={true}
                spaceBetween={0}
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                className="hero-swiper"
                style={{ borderRadius: "18px", overflow: "hidden" }}
                onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
              >
                {sliderImages.map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative overflow-hidden" style={{ borderRadius: "18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <img
                        src={image}
                        alt={`Banner ${index + 1}`}
                        className="w-full object-cover"
                        style={{ height: "clamp(200px, 38vw, 420px)", display: "block" }}
                      />
                      {/* Subtle vignette */}
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(10,10,15,0.35) 0%, transparent 50%)", borderRadius: "18px" }} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust / Benefit Cards ─────────────────────────────────────────── */}
      <section className="bg-white py-6">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <FaTruck className="text-[18px]" />, color: "#E8362A", bg: "rgba(232,54,42,0.08)", title: "Daily Deals", sub: "Upto 60% off curated offers" },
              { icon: <HiOutlineShieldCheck className="text-[20px]" />, color: "#10b981", bg: "rgba(16,185,129,0.08)", title: "Secure Payments", sub: "Encrypted & trusted gateways" },
              { icon: <FiRefreshCcw className="text-[18px]" />, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", title: "Easy Returns", sub: "Simple 7-day return policy" },
              { icon: <IoHeadsetOutline className="text-[20px]" />, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", title: "24/7 Support", sub: "Always here to help you" },
            ].map((card, i) => (
              <div key={i} className="benefit-card rounded-xl p-4 flex gap-3 items-start" style={{ border: "1.5px solid #f1f5f9", background: "#fafbfc" }}>
                <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-[14px] font-[600] text-slate-800 mb-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>{card.title}</p>
                  <p className="text-[12px] text-slate-500 mb-0 leading-snug">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Category Slider ───────────────────────────────────────────────── */}
      {context?.catData?.length !== 0 && <HomeCatSlider data={context?.catData} />}

      {/* ─── Quick Benefits ────────────────────────────────────────────────── */}
      <section className="bg-white pb-4 pt-2">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickBenefits.map((benefit, index) => (
              <div key={index} className="benefit-card rounded-xl p-4 flex items-center gap-4" style={{ border: "1.5px solid #f1f5f9", background: "#fafbfc" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0" style={{ background: benefit.bg, color: benefit.color }}>
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="text-[14px] font-[700] text-slate-800 mb-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>{benefit.title}</h4>
                  <p className="text-[12px] text-slate-500 mb-0 leading-snug">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Popular Products ──────────────────────────────────────────────── */}
      <section className="bg-white py-6">
        <div className="container">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            {/* Left: Title + Subtitle */}
            <div className="flex-shrink-0">
              <h2 className="section-title text-[20px] font-[700] text-slate-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Popular Products</h2>

            </div>
            <Link to="/products" className="flex-shrink-0">
                <button
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-[600] transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #E8362A 0%, #ff5c4d 100%)",
                    color: "white",
                    boxShadow: "0 4px 14px rgba(232,54,42,0.3)",
                    fontFamily: "'Syne', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  View All
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    <MdArrowRightAlt size={15} />
                  </span>
                </button>
              </Link>

            {/* Right: Tabs + View All */}
            <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap w-full lg:w-auto">
              <div className="flex-1 lg:flex-none overflow-hidden">
                <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="category tabs"
                  sx={{ '& .MuiTab-root': { fontSize: '13px', fontWeight: 500, textTransform: 'none', minWidth: 'auto', padding: '6px 14px' }, '& .Mui-selected': { color: '#E8362A !important' }, '& .MuiTabs-indicator': { backgroundColor: '#E8362A' } }}>
                  {context?.catData?.length !== 0 && context?.catData?.map((cat, index) => (
                    <Tab label={cat?.name} key={index} onClick={() => filterByCatId(cat?._id)} />
                  ))}
                </Tabs>
              </div>              
            </div>
          </div>
          <div className="min-h-[300px]">
            {popularProductsData?.length === 0 ? <ProductLoading /> : <ProductsSlider items={6} data={popularProductsData} />}
          </div>
        </div>
      </section>

      {/* ─── Flash Sale Banner ─────────────────────────────────────────────── */}
      <section className="py-3 bg-white">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl noise p-5 lg:p-6 flex flex-col lg:flex-row justify-between gap-4 lg:items-center"
            style={{ background: "linear-gradient(135deg, #c2180d 0%, #E8362A 45%, #ff6b35 100%)" }}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: "white", transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-10 pointer-events-none" style={{ background: "white", transform: "translateY(40%)" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <FaBolt className="text-yellow-300 text-[14px]" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/70 font-[500]">Limited time</span>
              </div>
              <h3 className="text-[22px] font-[800] text-white mb-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>Flash Sale ends tonight</h3>
              <p className="text-[13px] text-white/70 mb-0">Hurry up — prices reset at midnight!</p>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              {[
                { val: timeLeft.hours, label: timerLabels[0] },
                { val: timeLeft.minutes, label: timerLabels[1] },
                { val: timeLeft.seconds, label: timerLabels[2] },
              ].map((t, idx) => (
                <React.Fragment key={idx}>
                  {idx !== 0 && <span className="text-white/40 text-[20px] font-light mb-3">:</span>}
                  <div className="flex flex-col items-center gap-1">
                    <div className="timer-digit w-14 h-14 rounded-xl flex items-center justify-center text-[22px]" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                      {String(t.val).padStart(2, "0")}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-white/55">{t.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="relative z-10">
              <button
                onClick={copyCouponCode}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-[700] text-[14px] transition-all hover:scale-105"
                style={{ background: "white", color: "#E8362A", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                Copy SAVE20 <FaRegCopy />
              </button>
              {couponMessage && <p className="text-[12px] text-white/80 mt-1.5 mb-0">{couponMessage}</p>}
            </div>
          </div>
          {flashSaleProducts?.length !== 0 && <div className="mt-4"><ProductsSlider items={6} data={flashSaleProducts} /></div>}
        </div>
      </section>

      {/* ─── Product Banner V2 + Side Banners ─────────────────────────────── */}
      <section className="py-4 pt-0 bg-white">
        <div className="container flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-[70%]">
            {productsBanners?.length > 0 && <HomeBannerV2 data={productsBanners} />}
          </div>
          <div className="w-full lg:w-[30%] flex items-center gap-4 justify-between flex-row lg:flex-col">
            {bannerV1Data?.length > 1 ? (
              <>
                <BannerBoxV2 image={bannerV1Data[bannerV1Data?.length - 1]?.images[0]} item={bannerV1Data[bannerV1Data?.length - 1]} />
                <BannerBoxV2 image={bannerV1Data[bannerV1Data?.length - 2]?.images[0]} item={bannerV1Data[bannerV1Data?.length - 2]} />
              </>
            ) : <BannerLoading />}
          </div>
        </div>
      </section>

      {/* ─── Shipping Banner ───────────────────────────────────────────────── */}
      <section className="py-4 pt-0 bg-white">
        <div className="container">
          <div className="shipping-banner relative overflow-hidden rounded-2xl" style={{ minHeight: "280px" }}>
            <img
              src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2000&auto=format&fit=crop"
              alt="Fast delivery"
              className="shipping-banner-img absolute inset-0 w-full h-full object-cover scale-[1.02]"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(10,10,15,0.88) 0%, rgba(10,10,15,0.6) 55%, rgba(10,10,15,0.2) 100%)" }} />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-7 md:px-14 py-10 text-white">
              <div className="flex items-start gap-5 max-w-[560px]">
                <div className="pulse-ring flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#E8362A" }}>
                  <LiaShippingFastSolid className="text-[28px]" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-2 block">Delivery promise</span>
                  <h2 className="text-[24px] md:text-[34px] font-[800] leading-tight mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Free & Fast<br />Shipping
                  </h2>
                  <p className="text-[14px] md:text-[15px] leading-relaxed mb-0" style={{ color: "rgba(255,255,255,0.55)" }}>
                    First order & all orders above ₹200 — safe packaging, fast dispatch & trusted delivery partners.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-4 flex-shrink-0">
                <div>
                  <span className="block text-[11px] uppercase tracking-widest text-white/40 mb-1">starting from</span>
                  <p className="text-[36px] md:text-[50px] font-[900] leading-none mb-0" style={{ fontFamily: "'Syne', sans-serif", color: "#E8362A" }}>₹200*</p>
                </div>
                <Link to="/products">
                  <button className="cta-primary h-[44px] px-7 rounded-xl font-[600] text-[14px] text-white" style={{ background: "#E8362A" }}>
                    Shop Now
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {bannerV1Data?.length !== 0 && <div className="mt-4"><AdsBannerSliderV2 items={4} data={bannerV1Data} /></div>}
        </div>
      </section>

      {/* ─── Latest Products ───────────────────────────────────────────────── */}
      <section className="py-4 pt-0 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title text-[20px] font-[700] text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>Latest Products</h2>
            <Link to="/products">
              <button className="flex items-center gap-1.5 text-[13px] font-[500] px-4 py-2 rounded-lg transition-all hover:bg-slate-100" style={{ color: "#E8362A", border: "1.5px solid #f1f5f9" }}>
                View All <MdArrowRightAlt size={18} />
              </button>
            </Link>
          </div>
          {filteredProducts?.length === 0 ? <ProductLoading /> : <ProductsSlider items={6} data={filteredProducts} />}
        </div>
      </section>

      {/* ─── Featured Products ─────────────────────────────────────────────── */}
      <section className="py-2 pb-4 bg-white">
        <div className="container">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div className="flex-shrink-0">
              <h2 className="section-title text-[20px] font-[700] text-slate-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Featured Products</h2>

            </div>
          <Link to="/products" className="flex-shrink-0">
                <button
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-[600] transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #E8362A 0%, #ff5c4d 100%)",
                    color: "white",
                    boxShadow: "0 4px 14px rgba(232,54,42,0.3)",
                    fontFamily: "'Syne', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  View All
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    <MdArrowRightAlt size={15} />
                  </span>
                </button>
              </Link>
              </div>
          {featuredProducts?.length === 0 ? <ProductLoading /> : <ProductsSlider items={6} data={featuredProducts} />}
          {bannerList2Data?.length !== 0 && <div className="mt-4"><AdsBannerSlider items={4} data={bannerList2Data} /></div>}
        </div>
      </section>

      {/* ─── Random Category Products ──────────────────────────────────────── */}
      {randomCatProducts?.length !== 0 && randomCatProducts?.map((productRow, index) => {
        if (productRow?.catName !== undefined && productRow?.data?.length !== 0)
          return (
            <section className="py-3 pt-0 bg-white" key={index}>
              <div className="container">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="section-title text-[20px] font-[700] text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>{productRow?.catName}</h2>
                  {productRow?.data?.length > 6 && (
                    <Link to={`products?catId=${productRow?.data[0]?.catId}`}>
                      <button className="flex items-center gap-1.5 text-[13px] font-[500] px-4 py-2 rounded-lg transition-all hover:bg-slate-100" style={{ color: "#E8362A", border: "1.5px solid #f1f5f9" }}>
                        View All <MdArrowRightAlt size={18} />
                      </button>
                    </Link>
                  )}
                </div>
                {productRow?.data?.length === 0 ? <ProductLoading /> : <ProductsSlider items={6} data={productRow?.data} />}
              </div>
            </section>
          );
        return null;
      })}

      {/* ─── Reviews ───────────────────────────────────────────────────────── */}
      <section className="py-4 bg-white">
        <div className="container">
          <div className="rounded-2xl p-5 lg:p-7" style={{ background: "#fafbfc", border: "1.5px solid #f1f5f9" }}>
            <div className="flex items-center gap-3 mb-5">
              <h3 className="section-title text-[20px] font-[700] text-slate-900 mb-0" style={{ fontFamily: "'Syne', sans-serif" }}>Top Customer Reviews</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { text: "Amazing quality and super fast delivery. Will order again!", author: "Priya S.", avatar: "P" },
                { text: "Packaging was premium and product exactly as shown. No surprises!", author: "Rahul M.", avatar: "R" },
                { text: "Customer support resolved my issue in under 10 minutes. 5 stars!", author: "Anita K.", avatar: "A" },
              ].map((review, index) => (
                <div key={index} className="review-card bg-white rounded-xl p-5" style={{ border: "1.5px solid #f1f5f9" }}>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => <FaStar key={i} className="text-[12px]" style={{ color: "#f59e0b" }} />)}
                  </div>
                  <p className="text-[14px] text-slate-700 leading-relaxed mb-4">"{review.text}"</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-[700] text-white flex-shrink-0" style={{ background: "#E8362A" }}>
                      {review.avatar}
                    </div>
                    <span className="text-[13px] font-[600] text-slate-700">{review.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Newsletter ────────────────────────────────────────────────────── */}
      <section className="py-3 bg-white">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl noise p-6 lg:p-8" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)" }}>
            <div className="float-dot-1 absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #E8362A, transparent)", filter: "blur(30px)" }} />
            <div className="float-dot-3 absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #6b3cf0, transparent)", filter: "blur(24px)" }} />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] mb-2 block" style={{ color: "#E8362A" }}>Stay updated</span>
                <h3 className="text-[22px] font-[800] text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Exclusive deals, just for you</h3>
                <p className="text-[13px] mb-0" style={{ color: "rgba(255,255,255,0.45)" }}>Join our newsletter and never miss a flash sale or drop.</p>
              </div>
              <div className="w-full lg:w-[420px]">
                <form onSubmit={subscribeNewsletter} className="flex gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="newsletter-input flex-1 rounded-xl px-4 py-3 text-[14px] text-slate-800"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }}
                  />
                  <button type="submit" className="cta-primary px-5 py-3 rounded-xl font-[600] text-[14px] text-white flex-shrink-0" style={{ background: "#E8362A" }}>
                    Subscribe
                  </button>
                </form>
                {newsletterMessage && <p className="text-[12px] mt-2 mb-0" style={{ color: "#34d399" }}>{newsletterMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-4 bg-white">
        <div className="container">
          <h3 className="section-title text-[20px] font-[700] text-slate-900 mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>Frequently Asked Questions</h3>
          <div className="space-y-2.5">
            {faqs.map((item, index) => (
              <div key={index} className="rounded-xl overflow-hidden transition-all"
                style={{ border: `1.5px solid ${activeFaq === index ? "rgba(232,54,42,0.25)" : "#f1f5f9"}`, background: activeFaq === index ? "rgba(232,54,42,0.02)" : "#fafbfc" }}>
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? -1 : index)}
                  className="w-full text-left font-[600] text-[14px] text-slate-800 flex justify-between items-center px-5 py-4"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {item.q}
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[18px] font-light transition-all"
                    style={{ background: activeFaq === index ? "#E8362A" : "#f1f5f9", color: activeFaq === index ? "white" : "#64748b", transform: activeFaq === index ? "rotate(45deg)" : "rotate(0)" }}>
                    +
                  </span>
                </button>
                <div className={`faq-answer ${activeFaq === index ? "open" : ""}`}>
                  <p className="text-[13px] text-slate-500 px-5 pb-4 mb-0">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Blog ──────────────────────────────────────────────────────────── */}
      {blogData?.length !== 0 && (
        <section className="py-5 pb-10 bg-white blogSection">
          <div className="container">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title text-[20px] font-[700] text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>From The Blog</h2>
            </div>
            <Swiper
              slidesPerView={4}
              spaceBetween={24}
              navigation={context?.windowWidth < 992 ? false : true}
              modules={[Navigation, FreeMode]}
              freeMode={true}
              breakpoints={{
                250: { slidesPerView: 1, spaceBetween: 12 },
                500: { slidesPerView: 2, spaceBetween: 16 },
                700: { slidesPerView: 3, spaceBetween: 20 },
                1100: { slidesPerView: 4, spaceBetween: 24 },
              }}
              className="blogSlider"
            >
              {blogData?.slice()?.reverse()?.map((item, index) => (
                <SwiperSlide key={index}>
                  <BlogItem item={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;