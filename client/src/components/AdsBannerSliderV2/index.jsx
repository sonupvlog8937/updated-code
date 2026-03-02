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
    <section className="w-full py-6 md:py-10 bg-gradient-to-b from-gray-50 to-white">

      <div className="w-full lg:max-w-[1600px] lg:mx-auto px-0 lg:px-10">

        <Swiper
          spaceBetween={20}
          navigation={context?.windowWidth >= 992}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          modules={[Navigation, FreeMode, Autoplay]}
          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 0 },
            480: { slidesPerView: 2, spaceBetween: 10 },
            768: { slidesPerView: 3, spaceBetween: 15 },
            1200: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="adsBannerSlider"
        >
          {data?.map((item, index) => (
            <SwiperSlide key={index}>
              <Link
                to={`/products?catId=${item?.catId}`}
                className="block group"
              >
                <div className="relative overflow-hidden rounded-none lg:rounded-2xl shadow-md lg:shadow-lg transition-all duration-500">

                  {/* Aspect Ratio Container */}
                  <div className="relative w-full aspect-[4/3]">

                    <img
                      src={item?.images?.[0]}
                      alt={item?.bannerTitle || "banner"}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    {/* Text */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-lg md:text-xl font-semibold leading-snug line-clamp-2">
                        {item?.bannerTitle}
                      </h3>

                      {item?.subTitle && (
                        <p className="text-sm opacity-90 mt-1">
                          {item?.subTitle}
                        </p>
                      )}
                    </div>

                  </div>

                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

      </div>
    </section>
  );
};

export default AdsBannerSlider;