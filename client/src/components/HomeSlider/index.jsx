import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Link } from "react-router-dom";

import { Navigation, Autoplay } from "swiper/modules";
import { useAppContext } from "../../hooks/useAppContext";

const HomeSlider = (props) => {

  const context = useAppContext();

  return (
    <div className="homeSlider pb-3 pt-3 lg:pb-5 lg:pt-5 relative z-[99]">
      <div className="container">
        <div className="rounded-[14px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center p-5 lg:p-8">
            <div className="lg:col-span-4">
              <span className="inline-block text-[11px] uppercase tracking-widest bg-white/15 rounded-full px-3 py-1 mb-4">Top deals</span>
              <h1 className="text-[22px] lg:text-[34px] font-bold leading-tight">Premium products, better prices.</h1>
              <p className="text-[14px] text-slate-200 mt-3">Explore handpicked collections with fast delivery, easy returns, and trusted quality.</p>
              <div className="mt-5 flex gap-3">
                <Link to="/products" className="inline-flex items-center justify-center h-[42px] px-5 rounded-md bg-[#ff5252] text-white text-[14px] font-semibold hover:bg-[#eb3f3f] transition-colors">Shop now</Link>
                <Link to="/products" className="inline-flex items-center justify-center h-[42px] px-5 rounded-md border border-white/40 text-white text-[14px] font-semibold hover:bg-white/10 transition-colors">View catalog</Link>
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
                  props?.data?.length !== 0 && props?.data?.slice()?.reverse()?.map((item, index) => {
                    return (
                      <SwiperSlide key={index}>
                        <div className="item rounded-[12px] overflow-hidden border border-white/10 shadow-2xl">
                          <img
                            src={item?.images[0]}
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
  );
};

export default HomeSlider;
