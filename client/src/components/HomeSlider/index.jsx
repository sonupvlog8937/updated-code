import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";

/* ─── Skeleton Loader ─────────────────────────────────────── */
const SliderSkeleton = () => (
  <div className="w-full h-[200px] sm:h-[320px] lg:h-[460px] bg-gray-200 animate-pulse rounded-2xl overflow-hidden relative">
    <div className="absolute inset-0 animate-shimmer" />
  </div>
);

/* ─── Main Component ──────────────────────────────────────── */
const HomeSlider = (props) => {
  const context = useAppContext();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swiperRef = useRef(null);

  const slides = props?.data?.length ? [...props.data].reverse() : [];
  const isMobile = context?.windowWidth < 992;

  /**
   * Click pe navigate — but only if user ne swipe/drag nahi kiya.
   * Supported fields: item.link | item.url | item.redirectUrl | item.href
   * External URL → new tab, Internal route → react-router navigate
   */
  const handleSlideClick = (item) => {
    if (isDragging) return;

    const url = "/products" ||
      item?.link ||
      item?.url ||
      item?.redirectUrl ||
      item?.href ||
      null;

    if (!url) return;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      navigate(url);
    }
  };

  if (!slides.length) return <SliderSkeleton />;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1000px 100%;
          animation: shimmer 1.8s infinite;
        }
        .swiper-button-next,
        .swiper-button-prev { display: none !important; }
        .home-swiper .swiper-pagination-bullet {
          width: 8px; height: 8px;
          background: rgba(255,255,255,0.5);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .home-swiper .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 4px;
          background: #ffffff;
        }
        .home-swiper .swiper-pagination { bottom: 14px; }

        .slide-clickable img { transition: transform 0.5s ease; }
        .slide-clickable:hover img { transform: scale(1.02); }
      `}</style>

      <section className="homeSlider w-full py-3 lg:py-4">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">

          {/* ── Main Banner Swiper ── */}
          <div className="relative rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl group">

            <Swiper
              ref={swiperRef}
              loop={true}
              spaceBetween={0}
              slidesPerView={1}
              modules={[Navigation, Autoplay, Pagination]}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              onTouchStart={() => setIsDragging(false)}
              onTouchMove={() => setIsDragging(true)}
              onTouchEnd={() => setTimeout(() => setIsDragging(false), 100)}
              className="home-swiper w-full"
            >
              {slides.map((item, index) => {
                const hasLink = !!(item?.link || item?.url || item?.redirectUrl || item?.href);

                return (
                  <SwiperSlide key={index}>
                    <div
                      onClick={() => handleSlideClick(item)}
                      onKeyDown={(e) => e.key === "Enter" && handleSlideClick(item)}
                      role={hasLink ? "link" : undefined}
                      tabIndex={hasLink ? 0 : undefined}
                      aria-label={hasLink ? (item?.title || `Banner ${index + 1}`) : undefined}
                      className={`
                        relative w-full h-[200px] sm:h-[320px] lg:h-[460px] overflow-hidden
                        ${hasLink ? "slide-clickable cursor-pointer" : "cursor-default"}
                      `}
                    >
                      {/* Banner Image */}
                      <img
                        src={item?.images?.[0]}
                        alt={item?.title || `Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />

                      {/* Bottom gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                      {/* "Tap to explore" hint on mobile for clickable slides */}
                      {hasLink && isMobile && (
                        <div className="absolute bottom-8 right-3 z-10 pointer-events-none">
                          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                            Tap to explore
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      )}

                      {/* Optional text overlay */}
                      {(item?.title || item?.subtitle || item?.badge) && (
                        <div className="absolute bottom-10 left-5 sm:left-8 lg:left-12 max-w-xs sm:max-w-sm lg:max-w-md z-10 pointer-events-none">
                          {item?.badge && (
                            <span className="inline-block mb-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase bg-red-500 text-white shadow-lg">
                              {item.badge}
                            </span>
                          )}
                          {item?.title && (
                            <h2 className="text-white text-lg sm:text-2xl lg:text-4xl font-bold leading-tight drop-shadow-md">
                              {item.title}
                            </h2>
                          )}
                          {item?.subtitle && (
                            <p className="text-white/80 text-xs sm:text-sm mt-1 drop-shadow">
                              {item.subtitle}
                            </p>
                          )}
                          {hasLink && item?.cta && (
                            <span className="inline-block mt-3 px-4 sm:px-5 py-2 bg-white text-gray-900 text-xs sm:text-sm font-bold rounded-full shadow-lg">
                              {item.cta} →
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* ── Custom Arrow Buttons (desktop) ── */}
            {!isMobile && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); swiperRef.current?.swiper?.slidePrev(); }}
                  className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 z-20
                    w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center
                    bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-xl
                    border border-white/50 opacity-0 group-hover:opacity-100
                    transition-all duration-300 hover:scale-110 active:scale-95"
                  aria-label="Previous slide"
                >
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); swiperRef.current?.swiper?.slideNext(); }}
                  className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 z-20
                    w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center
                    bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-xl
                    border border-white/50 opacity-0 group-hover:opacity-100
                    transition-all duration-300 hover:scale-110 active:scale-95"
                  aria-label="Next slide"
                >
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* ── Slide Counter ── */}
            <div className="absolute top-3 right-3 z-20 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full pointer-events-none">
              {activeIndex + 1} / {slides.length}
            </div>

          </div>

          {/* ── Thumbnail Strip (desktop 3+ slides) ── */}
          {!isMobile && slides.length >= 3 && (
            <div className="hidden lg:flex gap-2 mt-3 justify-center">
              {slides.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    swiperRef.current?.swiper?.slideToLoop(index);
                    setActiveIndex(index);
                  }}
                  className={`
                    relative rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300
                    ${activeIndex === index
                      ? "w-20 h-12 ring-2 ring-blue-500 opacity-100 scale-105"
                      : "w-16 h-10 opacity-50 hover:opacity-80 hover:scale-105"}
                  `}
                >
                  <img src={item?.images?.[0]} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                  {activeIndex === index && <div className="absolute inset-0 bg-blue-500/10" />}
                </button>
              ))}
            </div>
          )}

        </div>
      </section>
    </>
  );
};

export default HomeSlider;