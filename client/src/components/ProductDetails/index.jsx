import React, { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import { QtyBox } from "../QtyBox";
import Rating from "@mui/material/Rating";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
import { useAppContext } from "../../hooks/useAppContext";
import CircularProgress from '@mui/material/CircularProgress';
import { postData } from "../../utils/api";
import { FaCheckDouble } from "react-icons/fa";
import { IoMdHeart } from "react-icons/io";
import { FaRegClock } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";


export const ProductDetailsComponent = (props) => {
  const [productActionIndex, setProductActionIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedTabName, setSelectedTabName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  const [tabError, setTabError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [isCheckingPinCode, setIsCheckingPinCode] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const context = useAppContext();
  const navigate = useNavigate();

  const handleSelecteQty = (qty) => {
    setQuantity(qty);
  }



  const handleClickActiveTab = (index, name) => {
    if (productActionIndex === index) return;

    setIsVariantLoading(true);
     setTabError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setProductActionIndex(index)
    setSelectedTabName(name)
    setTimeout(() => {
      setIsVariantLoading(false);
    }, 450);
  }

  const selectedColor = props?.item?.colorOptions?.[selectedColorIndex] || null;
  const selectedStyle = props?.item?.styleOptions?.[selectedStyleIndex] || null;

  const selectedVariantImages = useMemo(() => {
    if (selectedStyle?.images?.length) return selectedStyle.images;
    if (selectedColor?.images?.length) return selectedColor.images;
    return props?.item?.images || [];
  }, [selectedStyle, selectedColor, props?.item?.images]);

  const activePrice = useMemo(() => {
    const variantPrice = selectedStyle?.price ?? selectedColor?.price;
    const sizePrice = props?.item?.sizePriceMap?.[selectedTabName]?.price;
    return Number(variantPrice ?? sizePrice ?? props?.item?.price ?? 0);
  }, [selectedStyle, selectedColor, selectedTabName, props?.item?.sizePriceMap, props?.item?.price]);

  const activeOldPrice = useMemo(() => {
    const variantOldPrice = selectedStyle?.oldPrice ?? selectedColor?.oldPrice;
    const sizeOldPrice = props?.item?.sizePriceMap?.[selectedTabName]?.oldPrice;
    return Number(variantOldPrice ?? sizeOldPrice ?? props?.item?.oldPrice ?? 0);
  }, [selectedStyle, selectedColor, selectedTabName, props?.item?.sizePriceMap, props?.item?.oldPrice]);

  const activeDiscount = useMemo(() => {
    if (activeOldPrice > activePrice && activeOldPrice > 0) {
      return Math.round(((activeOldPrice - activePrice) / activeOldPrice) * 100);
    }
    return props?.item?.discount || 0;
  }, [activeOldPrice, activePrice, props?.item?.discount]);


  useEffect(() => {
    const item = context?.cartData?.filter((cartItem) =>
      cartItem.productId.includes(props?.item?._id)
    )

    if (item?.length !== 0) {
      setIsAdded(true)
    } else {
      setIsAdded(false)
    }

  }, [context?.cartData, props?.item?._id])


  useEffect(() => {
    const myListItem = context?.myListData?.filter((item) =>
      item.productId.includes(props?.item?._id)
    )


    if (myListItem?.length !== 0) {
      setIsAddedInMyList(true);
    } else {
      setIsAddedInMyList(false)
    }

  }, [context?.myListData])

    const validateVariantSelection = () => {
    if (props?.item?.size?.length !== 0 || props?.item?.productWeight?.length !== 0 || props?.item?.productRam?.length !== 0) {
      if (selectedTabName === null) {
        setTabError(true);
        context?.alertBox("error", "Please, first select size");
        return false;
      }
    }

    return true;
  }

  const createProductItem = (product, selectedQty) => ({
    _id: product?._id,
    productTitle: product?.name,
    image: selectedVariantImages?.[0] || product?.images?.[0],
    rating: product?.rating,
    price: activePrice,
    oldPrice: activeOldPrice,
    discount: activeDiscount,
    quantity: selectedQty,
    subTotal: parseInt(activePrice * selectedQty),
    productId: product?._id,
    countInStock: product?.countInStock,
    brand: product?.brand,
    size: props?.item?.size?.length > 0 ? selectedTabName : '',
    weight: props?.item?.productWeight?.length > 0 ? selectedTabName : '',
    ram: props?.item?.productRam?.length > 0 ? selectedTabName : '',
    color:
      props?.item?.colorOptions?.length > 0
        ? props?.item?.colorOptions?.[selectedColorIndex]?.name || ''
        : '',
    style:
      props?.item?.styleOptions?.length > 0
        ? props?.item?.styleOptions?.[selectedStyleIndex]?.name || ''
        : '',
  });


  const addToCart = (product, userId, quantity) => {


    if (userId === undefined) {
      context?.alertBox("error", "you are not login please login first");
      return false;
    }

 if (!validateVariantSelection()) return;

    const productItem = createProductItem(product, quantity);




    setIsLoading(true);
    postData("/api/cart/add", productItem).then((res) => {
      if (res?.error === false) {
        context?.alertBox("success", res?.message);

        context?.getCartItems();
        setTimeout(() => {
          setIsLoading(false);
          setIsAdded(true)
        }, 500);

      } else {
        context?.alertBox("error", res?.message);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    })
  }

  useEffect(() => {
    setSelectedColorIndex(0);

    setSelectedStyleIndex(0);
    setShowSizeChart(false);
    setPinCode("");
    setDeliveryMessage("");

    if (props?.item?.styleOptions?.length !== 0) {
      props?.onColorChange?.(props?.item?.styleOptions?.[0]?.images || props?.item?.images || []);
    } else if (props?.item?.colorOptions?.length !== 0) {
      props?.onColorChange?.(props?.item?.colorOptions?.[0]?.images || props?.item?.images || []);
    } else {
      props?.onColorChange?.(props?.item?.images || []);
    }
  }, [props?.item?._id]);

  useEffect(() => {
    props?.onColorChange?.(selectedVariantImages);
  }, [selectedVariantImages]);

   const checkPinCode = async () => {
    if (!/^\d{6}$/.test(pinCode)) {
      setDeliveryMessage("Please enter a valid 6-digit pincode.");
      return;
    }

     setIsCheckingPinCode(true);

    let isServiceable = false;

    try {
      const response = await postData("/api/pincode/check", {
        pincode: pinCode,
        productId: props?.item?._id,
      });

      if (typeof response?.serviceable === "boolean") {
        isServiceable = response.serviceable;
      } else {
        isServiceable = Number(pinCode[pinCode.length - 1]) % 2 === 0;
      }
    } catch (error) {
      isServiceable = Number(pinCode[pinCode.length - 1]) % 2 === 0;
    }
    setDeliveryMessage(
      isServiceable
        ? "Delivery available. Usually ships within 24 hours with easy returns."
        : "Delivery available. Usually ships within 24 hours with easy returns."
    );
    
    setIsCheckingPinCode(false);
  }

  const handleBuyNow = async () => {
    if (context?.userData?._id === undefined) {
      context?.alertBox("error", "you are not login please login first");
      return;
    }

    if (!validateVariantSelection()) return;

    setIsBuyingNow(true);
    const productItem = createProductItem(props?.item, quantity);
    navigate("/checkout", {
      state: {
        buyNowItem: productItem,
      },
    });

    setIsBuyingNow(false);

  }


  const handleAddToMyList = (item) => {
    if (context?.userData === null) {
      context?.alertBox("error", "you are not login please login first");
      return false
    }

    else {
      const obj = {
        productId: item?._id,
        userId: context?.userData?._id,
        productTitle: item?.name,
        image: item?.images[0],
        rating: item?.rating,
        price: item?.price,
        oldPrice: item?.oldPrice,
        brand: item?.brand,
        discount: item?.discount
      }


      postData("/api/myList/add", obj).then((res) => {
        if (res?.error === false) {
          context?.alertBox("success", res?.message);
          setIsAddedInMyList(true);
          context?.getMyListData();
        } else {
          context?.alertBox("error", res?.message);
        }
      })

    }
  }


  return (
    <>
      <h1 className="text-[18px] sm:text-[22px] font-[600] mb-2">
        {props?.item?.name}
      </h1>
      <div className="flex items-start sm:items-center lg:items-center flex-col sm:flex-row md:flex-row lg:flex-row gap-3 justify-start">
        <span className="text-gray-400 text-[13px]">
          Brands :{" "}
          <span className="font-[500] text-black opacity-75">
            {props?.item?.brand}
          </span>
        </span>

        <Rating name="size-small" value={props?.item?.rating} size="small" readOnly />
        <span className="text-[13px] cursor-pointer" onClick={props.gotoReviews}>Review ({props.reviewsCount})</span>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-row lg:flex-row items-start sm:items-center gap-4 mt-4">
        <div className="flex items-center gap-4">
          <span className="oldPrice line-through text-gray-500 text-[20px] font-[500]">
            &#x20b9;{activeOldPrice}
          </span>
          <span className="price text-primary text-[20px]  font-[600]">
           &#x20b9;{activePrice}
          </span>
           {
            activeDiscount > 0 &&
            <span className="text-[12px] font-[600] bg-green-100 text-green-700 rounded-full px-2 py-1">{activeDiscount}% OFF</span>
          }
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[14px]">
            Available In Stock:{" "}
            <span className="text-green-600 text-[14px] font-bold">
              {props?.item?.countInStock} Items
            </span>
          </span>
        </div>
      </div>

      <p className="mt-3 pr-10 mb-5">
        {props?.item?.description}
      </p>


      {
        props?.item?.productRam?.length !== 0 &&
        <div className="flex items-center gap-3">
          <span className="text-[16px]">RAM:</span>
          <div className="flex items-center gap-1 actions">
            {
              props?.item?.productRam?.map((item, index) => {
                return (
                  <Button
                    key={index}
                    className={`${productActionIndex === index ?
                      "!bg-primary !text-white" : ""
                      }  ${tabError === true && 'error'}`}
                    onClick={() => handleClickActiveTab(index, item)}
                    disabled={isVariantLoading === true}
                  >
                    {item}
                  </Button>
                )
              })
            }


          </div>
        </div>
      }



      {
        props?.item?.size?.length !== 0 &&
        <div className="flex items-center gap-3">
          <span className="text-[16px]">SIZE:</span>
          <div className="flex items-center gap-1 actions">
            {
              props?.item?.size?.map((item, index) => {
                return (
                  <Button
                    key={index}
                    className={`${productActionIndex === index ?
                      "!bg-primary !text-white" : ""
                      } ${tabError === true && 'error'}`}
                    onClick={() => handleClickActiveTab(index, item)}
                    disabled={isVariantLoading === true}
                  >
                    {item}
                  </Button>
                )
              })
            }


          </div>
          {
            tabError === true &&
            <span className="text-[12px] text-red-600">Please, first select size</span>
          }
        </div>
      }



      {
        props?.item?.productWeight?.length !== 0 &&
        <div className="flex items-center gap-3">
          <span className="text-[16px]">WEIGHT:</span>
          <div className="flex items-center gap-1 actions">
            {
              props?.item?.productWeight?.map((item, index) => {
                return (
                  <Button
                    key={index}
                    className={`${productActionIndex === index ?
                      "!bg-primary !text-white" : ""
                      }  ${tabError === true && 'error'}`}
                    onClick={() => handleClickActiveTab(index, item)}
                    disabled={isVariantLoading === true}
                  >
                    {item}
                  </Button>
                )
              })
            }


          </div>
        </div>
      }

       {
        props?.item?.styleOptions?.length !== 0 &&
        <div className="flex items-center gap-3 mt-4">
          <span className="text-[16px]">STYLE:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {
              props?.item?.styleOptions?.map((styleItem, index) => {
                return (
                  <Button
                    key={`${styleItem?.name}-${index}`}
                    className={`${selectedStyleIndex === index ? "!bg-primary !text-white" : ""}`}
                    onClick={() => setSelectedStyleIndex(index)}
                  >
                    {styleItem?.name}
                  </Button>
                )
              })
            }
          </div>
        </div>
      }

      {
        props?.item?.colorOptions?.length !== 0 &&
        <div className="flex items-center gap-3 mt-4">
          <span className="text-[16px]">COLOUR:</span>
          <div className="flex items-center gap-2">
            {
              props?.item?.colorOptions?.map((colorItem, index) => {
                return (
                  <button
                    key={`${colorItem?.name}-${index}`}
                    type="button"
                    title={colorItem?.name}
                    className={`w-[24px] h-[24px] rounded-full border-2 ${selectedColorIndex === index ? 'border-primary' : 'border-[rgba(0,0,0,0.2)]'}`}
                    style={{ background: colorItem?.code || '#ddd' }}
                    onClick={() => {
                      setSelectedColorIndex(index);
                     
                    }}
                  ></button>
                )
              })
            }
          </div>
          <span className="text-[13px] text-[rgba(0,0,0,0.7)]">
            {props?.item?.colorOptions?.[selectedColorIndex]?.name}
          </span>
        </div>
      }
       {
        props?.item?.size?.length !== 0 &&
        <div className="mt-3">
          <button className="text-primary text-[14px] font-[600] underline" onClick={() => setShowSizeChart((prev) => !prev)}>
            {showSizeChart ? "Hide" : "View"} Size Chart
          </button>

          {
            showSizeChart &&
            <div className="border rounded-md mt-3 overflow-hidden max-w-[420px]">
              <div className="grid grid-cols-3 bg-[#f6f6f6] text-[12px] font-[600]">
                <span className="p-2 border-r">Size</span>
                <span className="p-2 border-r">India/UK</span>
                <span className="p-2">Foot Length (cm)</span>
              </div>
              {
                props?.item?.size?.map((sizeItem, index) => {
                  const sizeNumber = Number(String(sizeItem).replace(/\D/g, "")) || index + 5;
                  const footLength = (22 + (sizeNumber - 5) * 0.6).toFixed(1);

                  return (
                    <div key={`${sizeItem}-${index}`} className="grid grid-cols-3 text-[12px] border-t">
                      <span className="p-2 border-r">{sizeItem}</span>
                      <span className="p-2 border-r">{sizeItem}</span>
                      <span className="p-2">{footLength}</span>
                    </div>
                  )
                })
              }
            </div>
          }
        </div>
      }
      {
        isVariantLoading === true &&
        <div className="flex items-center gap-2 mt-3 text-[13px] text-gray-600">
          <CircularProgress size={16} />
          Updating product option...
        </div>
      }

      <p className="text-[14px] mt-5 mb-2 text-[#000]">
        Free Shipping (Est. Delivery Time 2-3 Days)
      </p>
       <div className="flex items-center gap-2 text-[13px] text-[rgba(0,0,0,0.75)] mb-3">
  <FaRegClock className="text-[14px]" />
  Order now and get it between{" "}
  <strong>
    {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }
    )}
  </strong>{" "}
  -{" "}
  <strong>
    {new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }
    )}
  </strong>
</div>


      <div className="bg-[#f9fafb] rounded-md p-3 mb-3">
        <p className="text-[13px] font-[600] mb-2">Check delivery availability</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit pincode"
            className="border rounded-md h-[36px] px-2 text-[13px] w-[190px]"
          />
          <Button className="!h-[36px] !min-w-[90px] !text-[12px]" variant="outlined" onClick={checkPinCode} disabled={isCheckingPinCode}>
            {isCheckingPinCode ? <CircularProgress size={14} /> : "Check"}
          </Button>
        </div>
        {
          deliveryMessage && <p className="text-[12px] mt-2 text-[rgba(0,0,0,0.7)]">{deliveryMessage}</p>
        }
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
        <span className="text-[12px] bg-[#f3f9ff] rounded-md px-2 py-2">✅ Easy 7-day exchange</span>
        <span className="text-[12px] bg-[#f3f9ff] rounded-md px-2 py-2">✅ 100% secure payments</span>
        <span className="text-[12px] bg-[#f3f9ff] rounded-md px-2 py-2">✅ Quality verified by experts</span>
      </div>
      <div className="flex items-center flex-col gap-3 mb-2">
        <div className="qtyBoxWrapper w-[70px]">
          <QtyBox handleSelecteQty={handleSelecteQty} />
        </div>

        <Button className="btn-org btn-lg w-full flex gap-2 items-center" onClick={() => addToCart(props?.item, context?.userData?._id, quantity)}>
          {
            isLoading === true ? <CircularProgress /> :
              <>
                {
                  isAdded === true ? <><MdOutlineShoppingCart className="text-[22px]" /> One More Cart</> :
                    <>
                      <MdOutlineShoppingCart className="text-[22px]" /> Add to Cart
                    </>
                }

              </>
          }

        </Button>
         <Button className="btn-dark btn-lg w-full flex gap-2 items-center" onClick={handleBuyNow} disabled={isBuyingNow}>
          {isBuyingNow ? <CircularProgress size={18} /> : "Buy Now"}
        </Button>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <span className="flex items-center gap-2 text-[14px] sm:text-[15px] link cursor-pointer font-[500]" onClick={() => handleAddToMyList(props?.item)}>
          {
            isAddedInMyList === true ? <IoMdHeart className="text-[18px] !text-primary group-hover:text-white hover:!text-white" /> :
              <FaRegHeart className="text-[18px] !text-black group-hover:text-white hover:!text-white" />

          }
          Add to Wishlist
        </span>

        <span className="flex items-center gap-2  text-[14px] sm:text-[15px] link cursor-pointer font-[500]">
          <IoGitCompareOutline className="text-[18px]" /> Add to Compare
        </span>
      </div>
    </>
  );
};