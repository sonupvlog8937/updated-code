import React, { useEffect, useRef, useState } from "react";
import InnerImageZoom from "react-inner-image-zoom";
import "react-inner-image-zoom/lib/InnerImageZoom/styles.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { useAppContext } from "../../hooks/useAppContext";
import CircularProgress from "@mui/material/CircularProgress";

export const ProductZoom = (props) => {

  const [slideIndex, setSlideIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const zoomSliderBig = useRef();
  const zoomSliderSml = useRef();

   const context = useAppContext();

  const handleImageChange = (index) => {
    if (slideIndex === index) return;

    setIsImageLoading(true);
    setSlideIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      setIsImageLoading(false);
    }, 700);
  };

  const goto = (index) => {
    if (slideIndex === index) return;

    zoomSliderSml.current?.swiper?.slideTo(index);
    zoomSliderBig.current?.swiper?.slideTo(index);
    handleImageChange(index);
  };

  useEffect(() => {
    setSlideIndex(0);
    if (zoomSliderSml?.current?.swiper) {
      zoomSliderSml.current.swiper.slideTo(0);
    }
    if (zoomSliderBig?.current?.swiper) {
      zoomSliderBig.current.swiper.slideTo(0);
    }
  }, [props?.images]);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="slider w-full lg:w-[15%] order-2 lg:order-1">
          <Swiper
            ref={zoomSliderSml}
            direction={context?.windowWidth < 992 ? "horizontal" : "vertical"}
            slidesPerView={5}
            spaceBetween={10}
            navigation={context?.windowWidth < 992 ? false : true}
            modules={[Navigation]}
            className={`zoomProductSliderThumbs h-auto lg:h-[500px] overflow-hidden ${props?.images?.length > 5 && 'space'}`}
          >
            {
              props?.images?.map((item, index) => {
                return (
                  <SwiperSlide key={index}>
                    <div className={`item rounded-md overflow-hidden cursor-pointer group h-[100%] ${slideIndex === index ? 'opacity-1' : 'opacity-30'}`} onClick={() => goto(index)}>
                      <img
                        src={item}
                      />
                    </div>
                  </SwiperSlide>
                )
              })
            }

          </Swiper>
        </div>

        <div className="zoomContainer relative w-full lg:w-[85%] h-auto lg:h-[500px] overflow-hidden rounded-md  order-1 lg:order-2">
          {
            isImageLoading === true &&
            <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center pointer-events-none">
              <CircularProgress size={30} />
            </div>
          }
          <Swiper
            ref={zoomSliderBig}
            slidesPerView={1}
            spaceBetween={0}
            navigation={false}
            onSlideChange={(swiper) => {
              handleImageChange(swiper.activeIndex);
              zoomSliderSml.current?.swiper?.slideTo(swiper.activeIndex);
            }}
          >
            {
              props?.images?.map((item, index) => {
                return (
                  <SwiperSlide key={index}>
                    <InnerImageZoom
                      zoomType="hover"
                      zoomScale={1}
                      src={item}
                    />
                  </SwiperSlide>
                )
              })
            }



          </Swiper>
        </div>
      </div>
    </>
  );
};
