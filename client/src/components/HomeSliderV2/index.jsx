import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { EffectFade, Navigation, Pagination, Autoplay } from "swiper/modules";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";

const HomeBannerV2 = ({ data }) => {
  const context = useAppContext();

  return (
    <Swiper
      loop
      slidesPerView={1}
      effect="fade"
      navigation={context?.windowWidth >= 992}
      pagination={{ clickable: true }}
      autoplay={{ delay: 3500, disableOnInteraction: false }}
      modules={[EffectFade, Navigation, Pagination, Autoplay]}
      className="homeSliderV2"
    >
      {data?.map((item, index) => {
        if (item?.isDisplayOnHomeBanner && item?.bannerimages?.length) {
          return (
            <SwiperSlide key={index}>
              
              {/* Dynamic Height Section */}
              <div className="relative w-full h-[65vh] sm:h-[75vh] lg:h-[85vh] min-h-[400px] overflow-hidden">

                {/* Background Image */}
                <img
                  src={item?.bannerimages[0]}
                  alt={item?.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                {/* Content Section */}
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-6 lg:px-16">

                    <div className="max-w-[550px] text-white space-y-4">

                      <h4 className="text-sm md:text-lg font-medium uppercase tracking-wide text-gray-200">
                        {item?.name}
                      </h4>

                      <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                        {item?.brand}
                      </h2>

                      <p className="text-sm md:text-base text-gray-200">
                        Starting at only
                      </p>

                      <h3 className="text-2xl md:text-3xl font-bold text-primary">
                        {item?.price?.toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                        })}
                      </h3>

                      <Link to={`/product/${item?._id}`}>
                        <Button
                          variant="contained"
                          className="!bg-primary hover:!bg-black !text-white !px-6 !py-2 !mt-3"
                        >
                          SHOP NOW
                        </Button>
                      </Link>

                    </div>

                  </div>
                </div>

              </div>
            </SwiperSlide>
          );
        }
        return null;
      })}
    </Swiper>
  );
};

export default HomeBannerV2;