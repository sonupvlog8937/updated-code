import React, { useEffect, useMemo, useState } from "react";
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
import { Navigation, FreeMode, Autoplay } from "swiper/modules";
import BlogItem from "../../components/BlogItem";
import HomeBannerV2 from "../../components/HomeSliderV2";
import BannerBoxV2 from "../../components/bannerBoxV2";
import { fetchDataFromApi } from "../../utils/api";
import { useAppContext } from "../../hooks/useAppContext";
import ProductLoading from "../../components/ProductLoading";
import BannerLoading from "../../components/LoadingSkeleton/bannerLoading";
import { Button } from "@mui/material";
import { MdArrowRightAlt } from "react-icons/md";
import { Link } from "react-router-dom";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { FiRefreshCcw } from "react-icons/fi";
import { IoHeadsetOutline } from "react-icons/io5";
import { FaBolt, FaGift, FaRegCopy, FaStar } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";

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

  const context = useAppContext();

  const sliderImages = [
    "https://res.cloudinary.com/dn7ko6gut/image/upload/v1771620709/1771620706193_Untitled_design_53_1.png",
    "https://res.cloudinary.com/dn7ko6gut/image/upload/v1771620690/1771620686726_Untitled_design_52_1.png",
    "https://res.cloudinary.com/dn7ko6gut/image/upload/v1771620663/1771620660334_Untitled_design_51_1.png"
  ];

  useEffect(() => {
    const nextMidnight = new Date();
    nextMidnight.setHours(23, 59, 59, 999);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextMidnight - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
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

    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    if (context?.catData?.length !== 0) {

      fetchDataFromApi(`/api/product/getAllProductsByCatId/${context?.catData[0]?._id}`).then((res) => {
        if (res?.error === false) {
          setPopularProductsData(res?.products)
        }

      })
    }

    const categoryIndexes = context?.catData
      ?.map((_, index) => index)
      ?.filter((index) => index !== 0)
      ?.sort(() => Math.random() - 0.5)
      ?.slice(0, 4);

    getRandomProducts(categoryIndexes || [], context?.catData);
  }, [context?.catData]);



  const getRandomProducts = (arr, catArr) => {

    const filterData = [];

    for (let i = 0; i < arr.length; i++) {
      const catId = catArr[arr[i]]?._id;

      if (!catId) {
        continue;
      }

      fetchDataFromApi(`/api/product/getAllProductsByCatId/${catId}`).then((res) => {
        filterData.push({
          catName: catArr[arr[i]]?.name,
          data: res?.products
        })

        setRandomCatProducts([...filterData])
      })

    }



  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const filterByCatId = (id) => {
    setPopularProductsData([])
    fetchDataFromApi(`/api/product/getAllProductsByCatId/${id}`).then((res) => {
      if (res?.error === false) {
        setPopularProductsData(res?.products)
      }

    })
  }

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return productsData;
    return productsData.filter((item) =>
      (item?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productsData, searchTerm]);

  const flashSaleProducts = useMemo(() => featuredProducts.slice(0, 6), [featuredProducts]);

  const quickBenefits = [
    { title: "Same Day Dispatch", desc: "Before 4PM orders are dispatched same day.", icon: <FaBolt className="text-orange-500" /> },
    { title: "Rewards Club", desc: "Earn coins on every order and redeem on next checkout.", icon: <FaGift className="text-pink-500" /> },
    { title: "4.8/5 Rated", desc: "Trusted by thousands of happy customers.", icon: <FaStar className="text-yellow-500" /> },
  ];

  const faqs = [
    { q: "How fast is shipping?", a: "Metro cities: 1-2 days, others: 3-5 days with live tracking." },
    { q: "Do you offer cash on delivery?", a: "Yes, COD is available on most pin codes with a small handling fee." },
    { q: "Can I return a product?", a: "Yes, easy 7-day return on eligible products from My Orders page." },
  ];

  const copyCouponCode = async () => {
    try {
      await navigator.clipboard.writeText("SAVE20");
      setCouponMessage("Coupon copied: SAVE20");
      setTimeout(() => setCouponMessage(""), 2000);
    } catch (error) {
      setCouponMessage("Unable to copy right now.");
    }
  };

  const subscribeNewsletter = (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      setNewsletterMessage("Please enter a valid email address.");
      return;
    }
    setNewsletterMessage("Thanks! You are subscribed for premium offers.");
    setNewsletterEmail("");
  };

  return (
    <>
      <section className="bg-gradient-to-r from-slate-950 to-slate-800 text-white py-2 pt-4 text-center text-sm font-medium">
        🎁 Use code <strong>SAVE20</strong> for extra 20% off
      </section>
      {/* {homeSlidesData?.length !== 0 && <HomeSlider data={homeSlidesData} />} */}
      <div className="homeSlider pb-3 pt-3 lg:pb-5 lg:pt-5 relative z-[99]">
        <div className="container">
          <div className="rounded-[14px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center p-5 lg:p-8">
              <div className="lg:col-span-4">
                <span className="inline-block text-[11px] uppercase tracking-widest bg-white/15 rounded-full px-3 py-1 mb-4">Top deals</span>
                <h1 className="text-[22px] lg:text-[34px] font-bold leading-tight">Premium products, better prices.</h1>
                <p className="text-[14px] text-slate-200 mt-3">Explore handpicked collections with fast delivery, easy returns, and trusted quality.</p>
                <div className="mt-5 flex gap-3">
                  <Link to="/products" className="inline-flex items-center justify-center h-[42px] px-5 rounded-md bg-[#ff5252] text-white text-[14px] font-semibold hover:bg-[#eb3f3f] transition-colors">Shop Now</Link>
                  <Link to="/categories" className="inline-flex items-center justify-center h-[42px] px-5 rounded-md border border-white/40 text-white text-[14px] font-semibold hover:bg-white/10 transition-colors">View catalog</Link>
                </div>
              </div>


              <div className="lg:col-span-8">
                <Swiper
                  loop={true}
                  spaceBetween={10}
                  navigation={context?.windowWidth < 992 ? false : true}
                  modules={[Navigation, Autoplay]}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  className="sliderHome"
                >
                  {
                    sliderImages.map((image, index) => {
                      return (
                        <SwiperSlide key={index}>
                          <div className="item rounded-[12px] overflow-hidden border border-white/10 shadow-2xl">
                            <img
                              src={image}
                              alt={`Home banner ${index + 1}`}
                              className="w-full h-[180px] sm:h-[260px] lg:h-[360px] object-cover"
                            />
                          </div>
                        </SwiperSlide>
                      )
                    })
                  }
                </Swiper>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <section className="py-4 bg-white">
        <div className="container">
          <div className="rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Smart Product Search</h3>
              <p className="text-sm text-slate-500 m-0">Find products instantly by name.</p>
            </div>
            <div className="relative w-full lg:w-[420px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full border border-slate-300 rounded-xl py-2.5 pl-11 pr-3 outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>
      </section> */}
      <section className="pb-3 lg:pb-6 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="rounded-md border border-slate-200 p-4 bg-slate-50">
              <p className="text-[12px] uppercase text-slate-500 mb-1">Daily deals</p>
              <h3 className="text-[18px] font-semibold">Upto 60% Off</h3>
              <p className="text-[13px] text-slate-600 mb-0">Curated offers across top categories.</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4 bg-slate-50 flex gap-2">
              <HiOutlineShieldCheck className="text-[24px] text-emerald-600 mt-1" />
              <div>
                <h3 className="text-[16px] font-semibold mb-1">Secure Payments</h3>
                <p className="text-[13px] text-slate-600 mb-0">Encrypted checkout with trusted gateways.</p>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-4 bg-slate-50 flex gap-2">
              <FiRefreshCcw className="text-[22px] text-blue-600 mt-1" />
              <div>
                <h3 className="text-[16px] font-semibold mb-1">Easy Returns</h3>
                <p className="text-[13px] text-slate-600 mb-0">Simple return policy for worry-free shopping.</p>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-4 bg-slate-50 flex gap-2">
              <IoHeadsetOutline className="text-[24px] text-purple-600 mt-1" />
              <div>
                <h3 className="text-[16px] font-semibold mb-1">24/7 Support</h3>
                <p className="text-[13px] text-slate-600 mb-0">Our team is always here to help you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* {
        homeSlidesData?.lengtn !== 0 && <HomeSlider data={homeSlidesData} />
      } */}

      {
        context?.catData?.length !== 0 && <HomeCatSlider data={context?.catData} />
      }

      <section className="py-3 bg-white">
        <div className="container grid grid-cols-1 lg:grid-cols-3 gap-4">
          {quickBenefits.map((benefit, index) => (
            <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
              <span className="text-2xl">{benefit.icon}</span>
              <div>
                <h4 className="text-base font-semibold m-0">{benefit.title}</h4>
                <p className="text-sm text-slate-600 m-0">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>



      <section className="bg-white py-3 lg:py-8">
        <div className="container">
          <div className="flex items-center justify-between flex-col lg:flex-row">
            <div className="leftSec w-full lg:w-[40%]">
              <h2 className="text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] font-[600]">Popular Products</h2>
              <p className="text-[12px] sm:text-[14px] md:text-[13px] lg:text-[14px] font-[400] mt-0 mb-0">
                Do not miss the current offers until the end of March.
              </p>
            </div>

            <div className="rightSec w-full lg:w-[60%]">

              <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="scrollable auto tabs example">
                {context?.catData?.length !== 0 &&
                  context?.catData?.map((cat, index) => <Tab label={cat?.name} key={index} onClick={() => filterByCatId(cat?._id)} />)}
              </Tabs>
            </div>
          </div>
          <div className="min-h-max lg:min-h-[60vh]">{popularProductsData?.length === 0 ? <ProductLoading /> : <ProductsSlider items={6} data={popularProductsData} />}</div>
        </div>
      </section>

      <section className="py-2 bg-white">
        <div className="container">
          <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-4 text-white flex flex-col lg:flex-row justify-between gap-3 lg:items-center">
            <div>
              <h3 className="m-0 font-bold text-xl">Flash Sale ends today</h3>
              <p className="m-0 text-sm opacity-90">Hurry up! prices will reset at midnight.</p>
            </div>
            <div className="flex gap-3 text-center">
              {[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((time, idx) => (
                <div key={idx} className="bg-white text-red-600 min-w-16 rounded-xl px-2 py-2 font-bold text-lg">
                  {String(time).padStart(2, "0")}
                </div>
              ))}
            </div>
            <Button onClick={copyCouponCode} className="!bg-white !text-red-600 !font-bold !rounded-full !px-4 !py-2 !normal-case">
              Copy SAVE20 <FaRegCopy className="ml-2" />
            </Button>
          </div>
          {couponMessage && <p className="text-sm text-emerald-700 mt-2 mb-0">{couponMessage}</p>}
          {flashSaleProducts?.length !== 0 && <ProductsSlider items={6} data={flashSaleProducts} />}
        </div>
      </section>



      <section className="py-6 pt-0 bg-white">
        <div className="container flex flex-col lg:flex-row gap-5">
          <div className="part1 w-full lg:w-[70%]">

            {
              productsBanners?.length > 0 && <HomeBannerV2 data={productsBanners} />
            }


          </div>

          <div className="part2 scrollableBox w-full lg:w-[30%] flex items-center gap-5 justify-between flex-row lg:flex-col">
            {
              bannerV1Data?.length > 1 ? (
                <>
                  <BannerBoxV2 image={bannerV1Data[bannerV1Data?.length - 1]?.images[0]} item={bannerV1Data[bannerV1Data?.length - 1]} />
                  <BannerBoxV2 image={bannerV1Data[bannerV1Data?.length - 2]?.images[0]} item={bannerV1Data[bannerV1Data?.length - 2]} />
                </>
              ) : (
                <BannerLoading />
              )
            }
          </div>

        </div>
      </section>





      <section className="py-0 lg:py-4 pt-0 lg:pt-8 pb-0 bg-white">
        <div className="container">
          <div className="w-full relative overflow-hidden">
            <div className="relative w-full min-h-[300px] md:min-h-[380px] overflow-hidden rounded-3xl">
              <img
                src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2000&auto=format&fit=crop"
                alt="Fast ecommerce delivery"
                className="absolute inset-0 w-full h-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30"></div>
              <div className="absolute inset-0 backdrop-blur-[2px]"></div>

              <div className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-12 flex flex-col md:flex-row items-center justify-between gap-10 text-white">
                <div className="flex items-start gap-5 max-w-[650px]">
                  <span className="bg-[#ff5252] text-white rounded-full p-4 shadow-2xl ring-4 ring-white/20">
                    <LiaShippingFastSolid className="text-[32px] md:text-[40px]" />
                  </span>

                  <div>
                    <h2 className="text-[26px] md:text-[42px] font-extrabold uppercase tracking-wide leading-tight">Free & Fast Shipping</h2>

                    <p className="text-[15px] md:text-[18px] text-gray-200 mt-3 leading-relaxed">
                      First order aur ₹200 se upar ki shopping par delivery bilkul free. Safe packaging, fast dispatch & trusted delivery partners.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-end gap-5">
                  <p className="text-[#ff5252] text-[30px] md:text-[44px] font-black drop-shadow-lg">Only ₹200*</p>

                  <Link to="/products">
                    <button className="px-10 py-3 bg-[#ff5252] text-white rounded-full font-bold shadow-xl hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105">
                      Shop Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {
            bannerV1Data?.length !== 0 && <AdsBannerSliderV2 items={4} data={bannerV1Data} />
          }


        </div>
      </section>

      <section className="py-3 lg:py-2 pt-0 bg-white">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-[600]">Latest Products</h2>
            <Link to="/products">
              <Button className="!bg-gray-100 hover:!bg-gray-200 !text-gray-800 !capitalize !px-3 !border !border-[rgba(0,0,0,0.4)]" size="small">
                View All <MdArrowRightAlt size={25} />
              </Button>
            </Link>
          </div>

          {filteredProducts?.length === 0 ? <ProductLoading /> : <ProductsSlider items={6} data={filteredProducts} />}


        </div>
      </section>
      <section className="py-2 lg:py-0 pt-0 bg-white">
        <div className="container">
          <h2 className="text-[20px] font-[600]">Featured Products</h2>

          {featuredProducts?.length === 0 ? <ProductLoading /> : <ProductsSlider items={6} data={featuredProducts} />}

          {bannerList2Data?.length !== 0 && <AdsBannerSlider items={4} data={bannerList2Data} />}

        </div>
      </section>



      {randomCatProducts?.length !== 0 &&
        randomCatProducts?.map((productRow, index) => {
          if (productRow?.catName !== undefined && productRow?.data?.length !== 0)
            return (
              <section className="py-5 pt-0 bg-white" key={index}>
                <div className="container">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-[600]">{productRow?.catName}</h2>
                    {productRow?.data?.length > 6 && (
                      <Link to={`products?catId=${productRow?.data[0]?.catId}`}>
                        <Button className="!bg-gray-100 hover:!bg-gray-200 !text-gray-800 !capitalize !px-3 !border !border-[rgba(0,0,0,0.4)]" size="small">
                          View All <MdArrowRightAlt size={25} />
                        </Button>
                      </Link>
                    )}

                  </div>




                  {productRow?.data?.length === 0 ? <ProductLoading /> : <ProductsSlider items={6} data={productRow?.data} />}



                </div>
              </section>
            );
          return null;
        })}

      <section className="py-2 bg-white">
        <div className="container rounded-2xl border border-slate-200 p-4 lg:p-6 bg-slate-50">
          <h3 className="text-xl font-bold mb-3">Top Customer Reviews</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {["Amazing quality and super fast delivery.", "Packaging was premium and product exactly as shown.", "Customer support resolved my issue in 10 mins."].map((review, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-yellow-500 mb-2">★★★★★</p>
                <p className="text-sm text-slate-700 mb-0">{review}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-2 bg-white">
        <div className="container rounded-2xl bg-slate-900 text-white p-5 lg:p-7">
          <h3 className="text-xl font-bold">Join newsletter for exclusive deals</h3>
          <form onSubmit={subscribeNewsletter} className="flex flex-col sm:flex-row gap-3 mt-3">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter email"
              className="flex-1 rounded-xl px-4 py-3 text-slate-900 outline-none"
            />
            <button className="bg-[#ff5252] rounded-xl px-5 py-3 font-semibold">Subscribe</button>
          </form>
          {newsletterMessage && <p className="text-sm text-emerald-300 mt-2 mb-0">{newsletterMessage}</p>}
        </div>
      </section>
      <section className="py-4 bg-white">
        <div className="container">
          <h3 className="text-xl font-bold mb-3">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-xl p-4">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? -1 : index)}
                  className="w-full text-left font-semibold flex justify-between items-center"
                >
                  {item.q}
                  <span>{activeFaq === index ? "−" : "+"}</span>
                </button>
                {activeFaq === index && <p className="text-sm text-slate-600 mt-2 mb-0">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {blogData?.length !== 0 && (
        <section className="py-5 pb-8 pt-0 bg-white blogSection">
          <div className="container">
            <h2 className="text-[20px] font-[600] mb-4">From The Blog</h2>
            <Swiper
              slidesPerView={4}
              spaceBetween={30}
              navigation={context?.windowWidth < 992 ? false : true}
              modules={[Navigation, FreeMode]}
              freeMode={true}
              breakpoints={{
                250: { slidesPerView: 1, spaceBetween: 10 },
                330: { slidesPerView: 1, spaceBetween: 10 },
                500: { slidesPerView: 2, spaceBetween: 20 },
                700: { slidesPerView: 3, spaceBetween: 20 },
                1100: { slidesPerView: 4, spaceBetween: 30 },
              }}
              className="blogSlider"
            >
              {blogData
                ?.slice()
                ?.reverse()
                ?.map((item, index) => (
                  <SwiperSlide key={index}>
                    <BlogItem item={item} />
                  </SwiperSlide>
                ))}



            </Swiper>
          </div>
        </section>
      )}



    </>
  );
};

export default Home;