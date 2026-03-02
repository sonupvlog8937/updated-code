import React, { useEffect, useRef, useState } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link, useParams } from "react-router-dom";
import { ProductZoom } from "../../components/ProductZoom";
import ProductsSlider from '../../components/ProductsSlider';
import { ProductDetailsComponent } from "../../components/ProductDetails";

import { fetchDataFromApi } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { Reviews } from "./reviews";

export const ProductDetails = () => {

  const [activeTab, setActiveTab] = useState(0);
  const [productData, setProductData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [relatedProductData, setRelatedProductData] = useState([]);
  const [activeImages, setActiveImages] = useState([]);
  const [visibleSpecifications, setVisibleSpecifications] = useState(5);

  const { id } = useParams();

  const reviewSec = useRef();

  useEffect(() => {
    fetchDataFromApi(`/api/user/getReviews?productId=${id}`).then((res) => {
      if (res?.error === false) {
        setReviewsCount(res.reviews.length)
      }
    })

  }, [reviewsCount])

  useEffect(() => {
    setIsLoading(true);
    fetchDataFromApi(`/api/product/${id}`).then((res) => {
      if (res?.error === false) {
        setProductData(res?.product);
        setActiveImages(res?.product?.images || []);
        setVisibleSpecifications(5);
        fetchDataFromApi(`/api/product/getAllProductsBySubCatId/${res?.product?.subCatId}`).then((res) => {
          if (res?.error === false) {
           const filteredData = res?.products?.filter((item) => item._id !== id);
            setRelatedProductData(filteredData)
          }
        })

        setTimeout(() => {
          setIsLoading(false);
        }, 700);
      }
    })


    window.scrollTo(0, 0)
  }, [id])


  const gotoReviews = () => {
    window.scrollTo({
      top: reviewSec?.current.offsetTop - 170,
      behavior: 'smooth',
    })

    setActiveTab(1)

  }

  return (
    <>
      <div className="py-5 hidden">
        <div className="container">
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              underline="hover"
              color="inherit"
              to="/"
              className="link transition !text-[14px]"
            >
              Home
            </Link>
            <Link
              underline="hover"
              color="inherit"
              to="/"
              className="link transition !text-[14px]"
            >
              Fashion
            </Link>

            <Link
              underline="hover"
              color="inherit"
              className="link transition !text-[14px]"
            >
              Cropped Satin Bomber Jacket
            </Link>
          </Breadcrumbs>
        </div>
      </div>



      <section className="bg-white py-5">
        {
          isLoading === true ?
            <div className="flex items-center justify-center min-h-[300px]">
              <CircularProgress />
            </div>


            :


            <>
              <div className="container flex gap-8 flex-col lg:flex-row items-start lg:items-center">
                <div className="productZoomContainer w-full lg:w-[40%]">
                  <ProductZoom images={activeImages?.length !== 0 ? activeImages : productData?.images} />
                </div>

                <div className="productContent w-full lg:w-[60%] pr-2 pl-2 lg:pr-10 lg:pl-10">
                  <ProductDetailsComponent
                    item={productData}
                    reviewsCount={reviewsCount}
                    gotoReviews={gotoReviews}
                    onColorChange={(images) => setActiveImages(images?.length !== 0 ? images : productData?.images || [])}
                  />
                </div>
              </div>

              <div className="container pt-10">
                {/* <div className="flex items-center gap-8 mb-5">
                  <span
                    className={`link text-[17px] cursor-pointer font-[500] ${activeTab === 0 && "text-primary"
                      }`}
                    onClick={() => setActiveTab(0)}
                  >
                    Specifications
                  </span>


                  <span
                    className={`link text-[17px] cursor-pointer font-[500] ${activeTab === 1 && "text-primary"
                      }`}
                    onClick={() => setActiveTab(1)}
                    ref={reviewSec}
                  >
                    Reviews ({reviewsCount})
                  </span>
                </div> */}

                


                {/* {activeTab === 1 && (
                  <div className="shadow-none lg:shadow-md w-full sm:w-[80%] py-0  lg:py-5 px-0 lg:px-8 rounded-md">
                    {
                      productData?.length !== 0 && <Reviews productId={productData?._id} setReviewsCount={setReviewsCount} />
                    }

                  </div>
                )} */}
                <div>
                  <h6 className="text-[16px] font-[600] mb-3 py-2">Product Details</h6>
                  <div className="shadow-md w-full py-5 px-8 rounded-md text-[14px] my-5">
                    {/* <p>{productData?.description}</p> */}
                    {
                        productData?.specifications?.length !== 0 &&
                      <div className="pt-5">
                        <h3 className="text-[16px] font-[600] mb-3">Specifications</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {
                            productData?.specifications?.slice(0, visibleSpecifications)?.map((spec, index) => {
                              return (
                                <div key={`${spec?.key}-${index}`} className="bg-[#f8f8f8] px-3 rounded-md">
                                  <p className="text-[12px] text-[rgba(0,0,0,0.6)] uppercase">{spec?.key}</p>
                                  <p className="text-[14px] font-[500]">{spec?.value}</p>
                                </div>
                              )
                            })
                          }
                        </div>
                        {
                          productData?.specifications?.length > visibleSpecifications &&
                          <button
                            type="button"
                            className="btn-org rounded-md mt-4 text-primary font-[500]"
                            onClick={() => setVisibleSpecifications((prev) => prev + 5)}
                          >
                            See More
                          </button>
                        }

                        {
                          visibleSpecifications > 5 && productData?.specifications?.length <= visibleSpecifications &&
                          <button
                            type="button"
                            className="btn-org rounded-md mt-4 text-primary font-[500]"
                            onClick={() => setVisibleSpecifications(5)}
                          >
                            See Less
                          </button>
                        }
                      </div>
                    }
                  </div>
                  <div className="shadow-none lg:shadow-md w-full sm:w-[80%] py-0  lg:py-5 px-0 lg:px-8 rounded-md">
                    {
                      productData?.length !== 0 && <Reviews productId={productData?._id} setReviewsCount={setReviewsCount} />
                    }

                  </div>
                </div>
              </div>

              {
                relatedProductData?.length !== 0 &&
                <div className="container pt-8">
                  <h2 className="text-[20px] font-[600] pb-0">Related Products</h2>
                  <ProductsSlider items={6} data={relatedProductData}/>
                </div>
              }


            </>

        }




      </section>
    </>
  );
};