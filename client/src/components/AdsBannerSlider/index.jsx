import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

import { Navigation, FreeMode, Autoplay } from "swiper/modules";
import { useAppContext } from "../../hooks/useAppContext";
import { Link } from "react-router-dom";

const AdsBannerSlider = ({ data }) => {
  const context = useAppContext();

  return (
    <section className="w-full py-8 bg-gray-50">

      <Swiper
        spaceBetween={20}
        navigation={context?.windowWidth >= 992}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        modules={[Navigation, FreeMode, Autoplay]}
        breakpoints={{
          0: { slidesPerView: 1 },
          480: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1200: { slidesPerView: 4 },
        }}
        className="w-full px-4 lg:px-12"
      >
        {data?.map((item, index) => (
          <SwiperSlide key={index}>
            <Link
              to={`/products?catId=${item?.catId}`}
              className="block group"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500">

                {/* Aspect Ratio Box */}
                <div className="relative w-full aspect-[4/4]">

                  <img
                    src={item?.images?.[0]}
                    alt={item?.bannerTitle || "banner"}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                  {/* Text Content */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-lg md:text-xl font-bold leading-snug line-clamp-2">
                      {item?.bannerTitle || "Special Offer"}
                    </h3>

                    {item?.subTitle && (
                      <p className="text-sm opacity-90 mt-1 line-clamp-1">
                        {item?.subTitle}
                      </p>
                    )}

                    <span className="inline-block mt-3 px-4 py-1 bg-white text-black text-xs font-semibold rounded-full group-hover:bg-[#ff5252] group-hover:text-white transition-all duration-300">
                      Explore Now
                    </span>
                  </div>

                </div>

              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

    </section>
  );
};

export default AdsBannerSlider;