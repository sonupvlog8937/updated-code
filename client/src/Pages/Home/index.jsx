import React, { useEffect, useMemo, useState, useCallback, lazy, Suspense } from "react";
import { LiaShippingFastSolid } from "react-icons/lia";
import { fetchDataFromApi } from "../../utils/api";
import { useAppContext } from "../../hooks/useAppContext";
import ProductLoading from "../../components/ProductLoading";
import BannerLoading from "../../components/LoadingSkeleton/bannerLoading";
import { MdArrowRightAlt } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { FaBolt, FaRegCopy, FaStar } from "react-icons/fa";
import "./style.css";

// ✅ FIX 1: Heavy components — lazy load karo
// Ye sab pehle initial bundle mein the. Ab sirf viewport mein aane pe load honge.
// Initial JS parse time kaafi kam ho jaayega.
const HomeSlider        = lazy(() => import("../../components/HomeSlider"));
const HomeCatSlider     = lazy(() => import("../../components/HomeCatSlider"));
const AdsBannerSlider   = lazy(() => import("../../components/AdsBannerSlider"));
const AdsBannerSliderV2 = lazy(() => import("../../components/AdsBannerSliderV2"));
const ProductItem       = lazy(() => import("../../components/ProductItem"));
const BlogItem          = lazy(() => import("../../components/BlogItem"));
const HomeBannerV2      = lazy(() => import("../../components/HomeSliderV2"));
const BannerBoxV2       = lazy(() => import("../../components/bannerBoxV2"));
// const ProductItem       = lazy(() => import("../../components/ProductItem"));

// ✅ FIX 2: Swiper — sirf modules import karo jo chahiye, poora swiper nahi
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import { Navigation, FreeMode, Autoplay, Pagination } from "swiper/modules";
// EffectFade remove kiya — use nahi ho raha tha, extra KB load ho raha tha


const FAQS = [
  { q: "How fast is shipping?", a: "Metro cities: 1-2 days, others: 3-5 days with live tracking via SMS & email." },
  { q: "Do you offer cash on delivery?", a: "Yes, COD is available on most pin codes with a nominal handling fee." },
  { q: "Can I return a product?", a: "Yes, easy 7-day returns on eligible products. Start from My Orders page." },
  { q: "Are my payments secure?", a: "100%. We use industry-standard SSL encryption and trusted payment gateways." },
];

const TIMER_LABELS = ["HRS", "MIN", "SEC"];
const REVIEWS = [
  { text: "Amazing quality and super fast delivery. Will definitely order again!", author: "Priya S.", location: "Mumbai", avatar: "P", rating: 5 },
  { text: "Packaging was premium and product exactly as shown. No surprises at all!", author: "Rahul M.", location: "Delhi", avatar: "R", rating: 5 },
  { text: "Customer support resolved my issue in under 10 minutes. Absolutely 5 stars!", author: "Anita K.", location: "Bangalore", avatar: "A", rating: 5 },
];

// ─── All Products Section ─────────────────────────────────────────────────────
const PRODUCTS_PER_PAGE = 10;

const AllProductsSection = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [page, setPage]               = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Page 1 — initial load
  useEffect(() => {
    fetchDataFromApi(`/api/product/getAllProducts?page=1&limit=${PRODUCTS_PER_PAGE}`)
      .then(res => {
        setAllProducts(res?.products || []);
        setTotalProducts(res?.totalProducts ?? res?.total ?? 0);
        setLoading(false);
      });
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchDataFromApi(`/api/product/getAllProducts?page=${nextPage}&limit=${PRODUCTS_PER_PAGE}`)
      .then(res => {
        const newProducts = res?.products || [];
        setAllProducts(prev => [...prev, ...newProducts]);
        setTotalProducts(res?.totalProducts ?? res?.total ?? totalProducts);
        setPage(nextPage);
        setLoadingMore(false);
      });
  };

  const hasMore = allProducts.length < totalProducts;

  return (
    <section className="py-6 bg-white" style={{ borderTop: "1.5px solid #F1F3F5" }}>
      <div className="container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-heading text-[22px] font-[800] text-gray-900 mb-0"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>All Products</h2>
            {!loading && (
              <p className="text-[13px] text-gray-400 mt-0.5 mb-0">
                Showing {allProducts.length} of {totalProducts} products
              </p>
            )}
          </div>
          <Link to="/products">
            <button className="cta-orange group flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-[700] text-white">
              View All <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}><MdArrowRightAlt size={15} /></span>
            </button>
          </Link>
        </div>

        {loading ? (
          <ProductLoading />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {allProducts.map((item, index) => (
                <Suspense key={item?._id || index} fallback={null}>
                  <ProductItem item={item} />
                </Suspense>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-[700] text-[14px] transition-all active:scale-95"
                  style={{
                    background: loadingMore ? "#F5F5F5" : "linear-gradient(135deg, #FF6B2B, #FF9A5C)",
                    color: loadingMore ? "#9CA3AF" : "#fff",
                    boxShadow: loadingMore ? "none" : "0 6px 20px rgba(255,107,43,0.3)",
                    border: "none",
                    cursor: loadingMore ? "not-allowed" : "pointer",
                  }}>
                  {loadingMore ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Load More <MdArrowRightAlt size={18} /></>
                  )}
                </button>
              </div>
            )}

            {!hasMore && totalProducts > 0 && (
              <p className="text-center text-[13px] text-gray-400 mt-6 mb-0">
                🎉 Saare products dekh liye! <Link to="/products" style={{ color: "#FF6B2B", fontWeight: 700 }}>Browse categories</Link>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const Home = () => {
  const [value, setValue]                       = useState(0);
  const [homeSlidesData, setHomeSlidesData]     = useState([]);
  const [popularProductsData, setPopularProductsData] = useState([]);
  const [productsData, setAllProductsData]      = useState([]);
  const [productsBanners, setProductsBanners]   = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bannerV1Data, setBannerV1Data]         = useState([]);
  const [bannerList2Data, setBannerList2Data]   = useState([]);
  const [blogData, setBlogData]                 = useState([]);
  const [randomCatProducts, setRandomCatProducts] = useState([]);
  const [newsletterEmail, setNewsletterEmail]   = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [couponMessage, setCouponMessage]       = useState("");
  const [activeFaq, setActiveFaq]               = useState(0);
  const [timeLeft, setTimeLeft]                 = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [activeSlide, setActiveSlide]           = useState(0);

  const context  = useAppContext();
  const navigate = useNavigate();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // Countdown timer
  useEffect(() => {
    const nextMidnight = new Date();
    nextMidnight.setHours(23, 59, 59, 999);
    const timer = setInterval(() => {
      const diff = nextMidnight - new Date();
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0 }); clearInterval(timer); return; }
      setTimeLeft({
        hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".scroll-reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ✅ FIX 4: Main data fetch — getAllProducts ek baar call ho raha tha?
  // NAHI — pehle SAME API /getAllProducts DO baar call ho rahi thi!
  // Ek page=1&limit=12 ke liye, ek bannerProducts ke liye — same data!
  // Ab sirf ek call, dono ke liye same data use karo
  useEffect(() => {
    let isMounted = true;
    window.scrollTo(0, 0);
    Promise.all([
      fetchDataFromApi("/api/homeSlides"),
      fetchDataFromApi("/api/product/getAllProducts?page=1&limit=12"), // ✅ ek hi call
      fetchDataFromApi("/api/product/getAllFeaturedProducts"),
      fetchDataFromApi("/api/bannerV1"),
      fetchDataFromApi("/api/bannerList2"),
      fetchDataFromApi("/api/blog"),
    ]).then(([slides, products, featured, bannerV1, bannerList2, blogs]) => {
      if (!isMounted) return;
      setHomeSlidesData(slides?.data || []);
      setAllProductsData(products?.products || []);
      setProductsBanners(products?.products || []); // ✅ same data reuse — duplicate call hata diya
      setFeaturedProducts(featured?.products || []);
      setBannerV1Data(bannerV1?.data || []);
      setBannerList2Data(bannerList2?.data || []);
      setBlogData(blogs?.blogs || []);
    });
    return () => { isMounted = false; };
  }, []);

  // Login popup
  useEffect(() => {
    if (context?.isLogin === false) {
      const t = setTimeout(() => setShowLoginPopup(true), 900);
      return () => clearTimeout(t);
    }
    setShowLoginPopup(false);
  }, [context?.isLogin]);

  // Popular products by first category
  useEffect(() => {
    if (!context?.catData?.length) return;
    fetchDataFromApi(`/api/product/getAllProductsByCatId/${context.catData[0]?._id}`)
      .then((res) => { if (res?.error === false) setPopularProductsData(res?.products); });

    // ✅ FIX 5: getRandomProducts — pehle har fetch pe setRandomCatProducts([...filterData])
    // call hoti thi — matlab 4 alag state updates, 4 re-renders.
    // Ab Promise.all se sab ek saath, sirf 1 re-render
    const catIds = context.catData
      .map((_, i) => i).filter(i => i !== 0)
      .sort(() => Math.random() - 0.5).slice(0, 4);

    Promise.all(
      catIds.map(i =>
        fetchDataFromApi(`/api/product/getAllProductsByCatId/${context.catData[i]?._id}`)
          .then(res => ({ catName: context.catData[i]?.name, data: res?.products || [] }))
      )
    ).then(results => setRandomCatProducts(results.filter(r => r.data.length > 0)));
  }, [context?.catData]);

  const handleChange = useCallback((_, newValue) => setValue(newValue), []);

  const filterByCatId = useCallback((id) => {
    setPopularProductsData([]);
    fetchDataFromApi(`/api/product/getAllProductsByCatId/${id}`)
      .then((res) => { if (res?.error === false) setPopularProductsData(res?.products); });
  }, []);

  // ✅ FIX 6: searchTerm — remove kiya, pehle filteredProducts bana raha tha
  // lekin koi search input is component mein nahi tha — dead code tha
  const filteredProducts = useMemo(() => productsData, [productsData]);


  const copyCouponCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("SAVE20");
      setCouponMessage("✓ Copied: SAVE20");
      setTimeout(() => setCouponMessage(""), 2500);
    } catch {
      setCouponMessage("Copy manually: SAVE20");
    }
  }, []);

  const subscribeNewsletter = useCallback((e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      setNewsletterMessage("Please enter a valid email address."); return;
    }
    setNewsletterMessage("🎉 You're subscribed! Check your inbox for exclusive deals.");
    setNewsletterEmail("");
  }, [newsletterEmail]);

  return (
    <div className="home-root" style={{ background: "#ffffff" }}>

      {/* ─── Login Popup ─────────────────────────────────────────────────── */}
      {showLoginPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          <div className="popup-card w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative overflow-hidden p-7" style={{ background: "linear-gradient(135deg, #FF6B2B 0%, #FF9A5C 100%)" }}>
              <div className="float-1 absolute top-3 right-6 w-20 h-20 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.4)" }} />
              <div className="float-2 absolute bottom-2 right-16 w-10 h-10 rounded-full opacity-15" style={{ background: "rgba(255,255,255,0.3)" }} />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10" style={{ background: "white" }} />
              <span className="inline-block text-[11px] uppercase tracking-[0.18em] px-3 py-1 rounded-full mb-4 text-white font-[600]" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>Welcome</span>
              <h3 className="text-[26px] font-[800] text-white leading-tight mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Exclusive access<br/>awaits you ✨</h3>
              <p className="text-[14px] mb-0" style={{ color: "rgba(255,255,255,0.85)" }}>Login for faster checkout, wishlist sync, premium offers & smart order tracking.</p>
            </div>
            <div className="p-6 bg-white">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                <button className="h-[46px] rounded-xl font-[700] text-[14px] text-white transition-all cta-orange"
                  onClick={() => { setShowLoginPopup(false); navigate("/login"); }}>Login Now</button>
                <button className="h-[46px] rounded-xl font-[700] text-[14px] transition-all cta-outline"
                  onClick={() => { setShowLoginPopup(false); navigate("/register"); }}>Register</button>
              </div>
              <button className="w-full text-[13px] py-1 transition-colors text-gray-400 hover:text-gray-600"
                onClick={() => setShowLoginPopup(false)}>Canel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HERO BANNER ─────────────────────────────────────────────────── */}
      <section className="hero-bg relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FFF8F4 0%, #FFF4EE 100%)" }}>
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center py-2 lg:py-4">

            {/* Right: Slider — ✅ FIX 7: first image eager load, baaki lazy */}
            <div className="lg:col-span-12 anim-slide-right">
              <Swiper loop spaceBetween={0} modules={[Autoplay, Pagination]}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                pagination={{ clickable: true }} className="hero-swiper"
                style={{ borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 60px rgba(255,107,43,0.15)" }}
                onSlideChange={(s) => setActiveSlide(s.realIndex)}>
                {
                        homeSlidesData?.length !== 0 && <HomeSlider data={homeSlidesData} />
                      }
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Slider ─────────────────────────────────────────────── */}
      {context?.catData?.length !== 0 && (
        <div style={{ background: "#FAFAFA", borderTop: "1.5px solid #F1F3F5", borderBottom: "1.5px solid #F1F3F5" }}>
          <Suspense fallback={null}>
            <HomeCatSlider data={context?.catData} />
          </Suspense>
        </div>
      )}

      {/* ─── Popular Products ────────────────────────────────────────────── */}
      <section className="bg-white py-6">
        <div className="container">
          <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
            <h2 className="section-heading text-[22px] font-[800] text-gray-900 flex-shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Popular Products</h2>
            <Link to="/products" className="flex-shrink-0">
              <button className="cta-orange group flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-[700] text-white">
                View All <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}><MdArrowRightAlt size={15} /></span>
              </button>
            </Link>
            {/* ✅ FIX 8: Tabs — MUI Tabs import hata diya, native buttons use karo
                MUI Tabs bohot heavy hain sirf category filter ke liye */}
            <div className="w-full flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {context?.catData?.map((cat, index) => (
                <button key={index}
                  onClick={() => { setValue(index); filterByCatId(cat?._id); }}
                  className="flex-shrink-0 text-[13px] px-4 py-1.5 rounded-full transition-all font-[500]"
                  style={{
                    background: value === index ? "#FF6B2B" : "#F5F5F5",
                    color:      value === index ? "#fff"    : "#374151",
                    fontWeight: value === index ? 700       : 500,
                    border: "none", cursor: "pointer",
                  }}>
                  {cat?.name}
                </button>
              ))}
            </div>
          </div>
          {popularProductsData?.length === 0
            ? <ProductLoading />
            : (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {popularProductsData.slice(0, 8).map((item, index) => (
                  <Suspense key={item?._id || index} fallback={null}>
                    <ProductItem item={item} />
                  </Suspense>
                ))}
              </div>
            )
          }
        </div>
      </section>

      {/* ─── Flash Sale Banner ───────────────────────────────────────────── */}
      <section className="py-4 bg-white">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 flex-wrap"
            style={{ background: "linear-gradient(135deg, #FF6B2B 0%, #FF8C55 50%, #FFB347 100%)", boxShadow: "0 12px 40px rgba(255,107,43,0.3)" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: "white", transform: "translate(30%, -30%)" }} />
            <div className="dot-pattern absolute inset-0 opacity-30 pointer-events-none rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <FaBolt className="text-yellow-200 text-[14px]" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/80 font-[600]">Limited time</span>
              </div>
              <h3 className="text-[24px] font-[800] text-white mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Flash Sale ends tonight 🔥</h3>
              <p className="text-[13px] text-white/80 mb-0">Hurry up — prices reset at midnight!</p>
            </div>
            <div className="relative z-10 flex items-center gap-3">
              {[{ val: timeLeft.hours, label: TIMER_LABELS[0] }, { val: timeLeft.minutes, label: TIMER_LABELS[1] }, { val: timeLeft.seconds, label: TIMER_LABELS[2] }]
                .map((t, idx) => (
                  <React.Fragment key={idx}>
                    {idx !== 0 && <span className="text-white/50 text-[20px] font-light mb-3">:</span>}
                    <div className="flex flex-col items-center gap-1">
                      <div className="timer-digit w-14 h-14 rounded-xl flex items-center justify-center text-[22px]"
                        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
                        {String(t.val).padStart(2, "0")}
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-white/70">{t.label}</span>
                    </div>
                  </React.Fragment>
                ))}
            </div>
            <div className="relative z-10">
              <button onClick={copyCouponCode} className="flex items-center gap-2 px-5 py-3 rounded-xl font-[700] text-[14px] transition-all hover:scale-105 active:scale-95"
                style={{ background: "white", color: "#FF6B2B", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
                Copy SAVE20 <FaRegCopy />
              </button>
              {couponMessage && <p className="text-[12px] text-white/90 mt-1.5 mb-0 font-[600]">{couponMessage}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Product Banner V2 + Side Banners ───────────────────────────── */}
      <section className="py-4 pt-0 bg-white">
        <div className="container flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-[70%]">
            {productsBanners?.length > 0 && (
              <Suspense fallback={null}><HomeBannerV2 data={productsBanners} /></Suspense>
            )}
          </div>
          <div className="w-full lg:w-[30%] flex items-center gap-4 justify-between flex-row lg:flex-col">
            {bannerV1Data?.length > 1 ? (
              <Suspense fallback={null}>
                <BannerBoxV2 image={bannerV1Data[bannerV1Data.length - 1]?.images[0]} item={bannerV1Data[bannerV1Data.length - 1]} />
                <BannerBoxV2 image={bannerV1Data[bannerV1Data.length - 2]?.images[0]} item={bannerV1Data[bannerV1Data.length - 2]} />
              </Suspense>
            ) : <BannerLoading />}
          </div>
        </div>
      </section>

      {/* ─── Shipping Banner ─────────────────────────────────────────────── */}
      <section className="py-4 pt-0 bg-white">
        <div className="container">
          <div className="shipping-banner relative overflow-hidden rounded-2xl" style={{ minHeight: "280px" }}>
            {/* ✅ FIX 9: Unsplash image — loading lazy + width/height for CLS */}
            <img src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=1200&auto=format&fit=crop"
              alt="Fast delivery" loading="lazy" width="1200" height="280"
              className="shipping-banner-img absolute inset-0 w-full h-full object-cover scale-[1.02]"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(20,10,5,0.88) 0%, rgba(20,10,5,0.6) 55%, rgba(20,10,5,0.18) 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 h-1 opacity-60" style={{ background: "linear-gradient(90deg, #FF6B2B, transparent)" }} />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-7 md:px-14 py-10 text-white">
              <div className="flex items-start gap-5 max-w-[560px]">
                <div className="pulse-ring flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#FF6B2B" }}>
                  <LiaShippingFastSolid className="text-[28px]" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-2 block">Delivery promise</span>
                  <h2 className="text-[24px] md:text-[36px] font-[800] leading-tight mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Free & Fast<br />Shipping</h2>
                  <p className="text-[14px] md:text-[15px] leading-relaxed mb-0" style={{ color: "rgba(255,255,255,0.6)" }}>
                    First order & all orders above ₹200 — safe packaging, fast dispatch & trusted delivery partners.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end gap-4 flex-shrink-0">
                <div className="text-center md:text-right">
                  <span className="block text-[11px] uppercase tracking-widest text-white/40 mb-1">starting from</span>
                  <p className="text-[38px] md:text-[52px] font-[900] leading-none mb-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#FF8C55" }}>₹200*</p>
                </div>
                <Link to="/products">
                  <button className="cta-orange h-[46px] px-8 rounded-xl font-[700] text-[14px] text-white">Shop Now</button>
                </Link>
              </div>
            </div>
          </div>
          {bannerV1Data?.length !== 0 && (
            <div className="mt-4">
              <Suspense fallback={null}><AdsBannerSliderV2 items={4} data={bannerV1Data} /></Suspense>
            </div>
          )}
        </div>
      </section>

      {/* ─── Latest Products ─────────────────────────────────────────────── */}
      <section className="py-5 pt-0 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading text-[22px] font-[800] text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Latest Products</h2>
            <Link to="/products">
              <button className="flex items-center gap-1.5 text-[13px] font-[600] px-4 py-2.5 rounded-xl transition-all"
                style={{ color: "#FF6B2B", border: "1.5px solid rgba(255,107,43,0.2)", background: "rgba(255,107,43,0.04)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,43,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,107,43,0.04)"; }}>
                View All <MdArrowRightAlt size={18} />
              </button>
            </Link>
          </div>
          {filteredProducts?.length === 0
            ? <ProductLoading />
            : (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {filteredProducts.slice(0, 8).map((item, index) => (
                  <Suspense key={item?._id || index} fallback={null}>
                    <ProductItem item={item} />
                  </Suspense>
                ))}
              </div>
            )
          }
        </div>
      </section>

      {/* ─── Featured Products ───────────────────────────────────────────── */}
      <section className="py-2 pb-5 bg-white">
        <div className="container">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <h2 className="section-heading text-[22px] font-[800] text-gray-900 flex-shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Featured Products</h2>
            <Link to="/products" className="flex-shrink-0">
              <button className="cta-orange group flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-[700] text-white">
                View All <span className="inline-flex items-center justify-center w-5 h-5 rounded-full group-hover:translate-x-0.5 transition-transform" style={{ background: "rgba(255,255,255,0.2)" }}><MdArrowRightAlt size={15} /></span>
              </button>
            </Link>
          </div>
          {featuredProducts?.length === 0
            ? <ProductLoading />
            : (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {featuredProducts.slice(0, 8).map((item, index) => (
                  <Suspense key={item?._id || index} fallback={null}>
                    <ProductItem item={item} />
                  </Suspense>
                ))}
              </div>
            )
          }
          {bannerList2Data?.length !== 0 && (
            <div className="mt-5">
              <Suspense fallback={null}><AdsBannerSlider items={4} data={bannerList2Data} /></Suspense>
            </div>
          )}
        </div>
      </section>

      {/* ─── Random Category Products ────────────────────────────────────── */}
      {randomCatProducts?.map((productRow, index) => {
        if (!productRow?.catName || !productRow?.data?.length) return null;
        return (
          <section className="py-3 pt-0 bg-white" key={index}>
            <div className="container">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-heading text-[20px] font-[800] text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{productRow.catName}</h2>
                {productRow.data.length > 6 && (
                  <Link to={`products?catId=${productRow.data[0]?.catId}`}>
                    <button className="flex items-center gap-1.5 text-[13px] font-[600] px-4 py-2 rounded-xl transition-all"
                      style={{ color: "#FF6B2B", border: "1.5px solid rgba(255,107,43,0.2)", background: "rgba(255,107,43,0.04)" }}>
                      View All <MdArrowRightAlt size={18} />
                    </button>
                  </Link>
                )}
              </div>
              <Suspense fallback={<ProductLoading />}>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {productRow.data.slice(0, 8).map((item, idx) => (
                    <Suspense key={item?._id || idx} fallback={null}>
                      <ProductItem item={item} />
                    </Suspense>
                  ))}
                </div>
              </Suspense>
            </div>
          </section>
        );
      })}

      {/* ─── All Products ────────────────────────────────────────────────── */}
      <AllProductsSection />

      {/* ─── Reviews ─────────────────────────────────────────────────────── */}
      <section className="py-6 bg-white scroll-reveal">
        <div className="container">
          <div className="rounded-2xl p-6 lg:p-8" style={{ background: "linear-gradient(135deg, #FFF8F4 0%, #FFF4EE 100%)", border: "1.5px solid rgba(255,107,43,0.12)" }}>
            <div className="flex items-center gap-3 mb-6">
              <h3 className="section-heading text-[22px] font-[800] text-gray-900 mb-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>What Our Customers Say</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {REVIEWS.map((review, index) => (
                <div key={index} className="review-card bg-white rounded-2xl p-5" style={{ border: "1.5px solid rgba(255,107,43,0.1)", boxShadow: "0 4px 16px rgba(255,107,43,0.06)" }}>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(review.rating)].map((_, i) => <FaStar key={i} className="text-[13px]" style={{ color: "#f59e0b" }} />)}
                  </div>
                  <p className="text-[14px] text-gray-700 leading-relaxed mb-4">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-[800] text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #FF6B2B, #FF9A5C)" }}>{review.avatar}</div>
                    <div>
                      <span className="text-[13px] font-[700] text-gray-800 block">{review.author}</span>
                      <span className="text-[11px] text-gray-400">{review.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Newsletter ──────────────────────────────────────────────────── */}
      <section className="py-4 bg-white">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl p-6 lg:p-10" style={{ background: "linear-gradient(135deg, #FF6B2B 0%, #FF9A5C 60%, #FFB347 100%)", boxShadow: "0 16px 48px rgba(255,107,43,0.3)" }}>
            <div className="float-1 absolute top-0 right-10 w-56 h-56 rounded-full opacity-15 pointer-events-none" style={{ background: "white", filter: "blur(30px)" }} />
            <div className="dot-pattern absolute inset-0 opacity-20 pointer-events-none rounded-2xl" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <span className="inline-block text-[10px] uppercase tracking-[0.22em] mb-3 px-3 py-1 rounded-full text-white font-[600]"
                  style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>Stay updated</span>
                <h3 className="text-[24px] lg:text-[28px] font-[800] text-white mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Exclusive deals, just for you 🎁</h3>
                <p className="text-[14px] mb-0" style={{ color: "rgba(255,255,255,0.85)" }}>Join our newsletter and never miss a flash sale or drop.</p>
              </div>
              <div className="w-full lg:w-[440px]">
                <form onSubmit={subscribeNewsletter} className="flex gap-2">
                  <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address" className="newsletter-input flex-1 rounded-xl px-4 py-3 text-[14px] text-gray-800 bg-white"
                    style={{ border: "2px solid rgba(255,255,255,0.5)", outline: "none" }} />
                  <button type="submit" className="px-5 py-3 rounded-xl font-[700] text-[14px] flex-shrink-0 transition-all hover:scale-105"
                    style={{ background: "white", color: "#FF6B2B", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>Subscribe</button>
                </form>
                {newsletterMessage && <p className="text-[12px] mt-2 mb-0 text-white font-[600]">{newsletterMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-6 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-7">
              <h3 className="text-[24px] font-[800] text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Frequently Asked Questions</h3>
              <p className="text-[14px] text-gray-500 mt-1">Everything you need to know about shopping with us.</p>
            </div>
            <div className="space-y-3">
              {FAQS.map((item, index) => (
                <div key={index} className="rounded-2xl overflow-hidden transition-all"
                  style={{ border: `1.5px solid ${activeFaq === index ? "rgba(255,107,43,0.3)" : "#F1F3F5"}`, background: activeFaq === index ? "rgba(255,107,43,0.02)" : "#FAFAFA", boxShadow: activeFaq === index ? "0 4px 20px rgba(255,107,43,0.08)" : "none" }}>
                  <button onClick={() => setActiveFaq(activeFaq === index ? -1 : index)}
                    className="w-full text-left font-[700] text-[14px] text-gray-800 flex justify-between items-center px-5 py-4 transition-all"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.q}
                    <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[18px] font-[400] transition-all"
                      style={{ background: activeFaq === index ? "#FF6B2B" : "#F1F3F5", color: activeFaq === index ? "white" : "#9CA3AF", transform: activeFaq === index ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                  </button>
                  <div className={`faq-answer ${activeFaq === index ? "open" : ""}`}>
                    <p className="text-[14px] text-gray-500 px-5 pb-5 mb-0 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Blog ────────────────────────────────────────────────────────── */}
      {blogData?.length !== 0 && (
        <section className="py-6 pb-10 bg-white blogSection" style={{ borderTop: "1.5px solid #F1F3F5" }}>
          <div className="container">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-heading text-[22px] font-[800] text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>From The Blog</h2>
            </div>
            <Swiper slidesPerView={4} spaceBetween={20} navigation={context?.windowWidth < 992 ? false : true}
              modules={[Navigation, FreeMode]} freeMode
              breakpoints={{ 250: { slidesPerView: 1, spaceBetween: 12 }, 500: { slidesPerView: 2, spaceBetween: 16 }, 700: { slidesPerView: 3, spaceBetween: 18 }, 1100: { slidesPerView: 4, spaceBetween: 20 } }}
              className="blogSlider">
              {blogData.slice().reverse().map((item, index) => (
                <SwiperSlide key={index}>
                  <Suspense fallback={null}><BlogItem item={item} /></Suspense>
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