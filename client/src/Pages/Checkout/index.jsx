import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import { BsFillBagCheckFill } from "react-icons/bs";
import { useAppContext } from "../../hooks/useAppContext";
import { FaPlus } from "react-icons/fa6";
import Radio from '@mui/material/Radio';
import { deleteData, postData, fetchDataFromApi } from "../../utils/api";
import axios from 'axios';
import { useLocation, useNavigate } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';

const VITE_APP_RAZORPAY_KEY_ID = import.meta.env.VITE_APP_RAZORPAY_KEY_ID;
const VITE_APP_RAZORPAY_KEY_SECRET = import.meta.env.VITE_APP_RAZORPAY_KEY_SECRET;

const VITE_APP_PAYPAL_CLIENT_ID = import.meta.env.VITE_APP_PAYPAL_CLIENT_ID;
const VITE_API_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {

  const [userData, setUserData] = useState(null);
  const [isChecked, setIsChecked] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isLoading, setIsloading] = useState(false);
  const [commerceSettings, setCommerceSettings] = useState({ shippingFee: 0, deliveryFee: 0, freeShippingAbove: 0, goMarketShippingFee: 0, goMarketDeliveryFeePerKm: 0 });
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0); // Will be updated with actual distance
  const [distanceCalculated, setDistanceCalculated] = useState(false); // Track if calculation happened
  const context = useAppContext();

  const history = useNavigate();
  const location = useLocation();
  const buyNowItem = location?.state?.buyNowItem;
  const isBuyNowCheckout = Boolean(buyNowItem);
  const checkoutItems = isBuyNowCheckout ? [buyNowItem] : context?.cartData;

  const cartSubTotal = useMemo(
    () =>
      checkoutItems?.length !== 0
        ? checkoutItems?.map((item) => parseInt(item.price) * item.quantity).reduce((total, value) => total + value, 0)
        : 0,
    [checkoutItems]
  );

  const couponCode = !isBuyNowCheckout ? (localStorage.getItem("couponCode") || "") : "";
  const couponDiscount = !isBuyNowCheckout ? Number(localStorage.getItem("couponDiscount") || 0) : 0;
  const discountAmount = Math.min(couponDiscount, cartSubTotal);
  const baseAfterDiscount = Math.max(cartSubTotal - discountAmount, 0);
  
  // Separate Go Market and non-Go Market items
  const goMarketItems = checkoutItems?.filter((item) => {
    const source = String(item?.source || "").toLowerCase();
    const brand = String(item?.brand || "").toLowerCase();
    const isGoMarketSeller = item?.sellerId?.storeProfile?.marketId != null || 
                             item?.sellerId?.storeProfile?.goMarketOwnerId != null;
    return source.includes("gomarket") || brand.includes("gomarket") || isGoMarketSeller;
  }) || [];
  
  const nonGoMarketItems = checkoutItems?.filter((item) => {
    const source = String(item?.source || "").toLowerCase();
    const brand = String(item?.brand || "").toLowerCase();
    const isGoMarketSeller = item?.sellerId?.storeProfile?.marketId != null || 
                             item?.sellerId?.storeProfile?.goMarketOwnerId != null;
    return !source.includes("gomarket") && !brand.includes("gomarket") && !isGoMarketSeller;
  }) || [];
  
  const hasGoMarketItems = goMarketItems.length > 0;
  const hasNonGoMarketItems = nonGoMarketItems.length > 0;
  const isMixedCart = hasGoMarketItems && hasNonGoMarketItems;
  
  // Calculate subtotals for each type
  const goMarketSubtotal = goMarketItems.reduce((sum, item) => {
    return sum + (parseInt(item.price) * item.quantity);
  }, 0);
  
  const nonGoMarketSubtotal = nonGoMarketItems.reduce((sum, item) => {
    return sum + (parseInt(item.price) * item.quantity);
  }, 0);
  
  const freeByRule = commerceSettings.freeShippingAbove > 0 && baseAfterDiscount >= commerceSettings.freeShippingAbove;
  
  // Calculate Go Market fees (rounded). Shipping is a flat Go Market fee; delivery is per-km.
  const goMarketShipping = (hasGoMarketItems && !isFirstOrder && !freeByRule) 
    ? Math.round(Number(commerceSettings.goMarketShippingFee || 0))
    : 0;
  const goMarketDelivery = (hasGoMarketItems && !isFirstOrder && !freeByRule) 
    ? Math.round(Number((commerceSettings.goMarketDeliveryFeePerKm || 0) * distanceKm))
    : 0;
  
  // Calculate normal fees (rounded)
  const normalShipping = (hasNonGoMarketItems && !isFirstOrder && !freeByRule) 
    ? Math.round(Number(commerceSettings.shippingFee || 0))
    : 0;
  const normalDelivery = (hasNonGoMarketItems && !isFirstOrder && !freeByRule) 
    ? Math.round(Number(commerceSettings.deliveryFee || 0))
    : 0;
  
  // Total fees
  const totalShipping = goMarketShipping + normalShipping;
  const totalDelivery = goMarketDelivery + normalDelivery;
  const totalAmount = Math.max(baseAfterDiscount + totalShipping + totalDelivery, 0);

  useEffect(() => {
    fetchDataFromApi("/api/settings/commerce").then((res) => { if (res?.data) setCommerceSettings(res.data); });
  }, []);

  // Calculate dynamic Go Market distance on the server so old cart items can
  // fall back to seller/market coordinates instead of showing a static distance.
  useEffect(() => {    
    if (!hasGoMarketItems) {
      setDistanceKm(0);
      setDistanceCalculated(false);
      return;
    }
    
      const userLocation = userData?.goMarketLocation || null;
    if (!userLocation?.coordinates?.length) {
      setDistanceKm(0);
      setDistanceCalculated(false);
      return;
    }
    
    let cancelled = false;
    postData("/api/order/go-market-distance", {
      userId: userData?._id,
      products: goMarketItems,
      userLocation,
    }).then((res) => {
      if (cancelled) return;
      const nextDistance = Number(res?.data?.distanceKm || 0);
      setDistanceKm(Number.isFinite(nextDistance) ? nextDistance : 0);
      setDistanceCalculated(Boolean(nextDistance > 0));
    }).catch(() => {
      if (!cancelled) setDistanceCalculated(false);
    });

    return () => { cancelled = true; };
  }, [hasGoMarketItems, goMarketItems, userData?.goMarketLocation, userData?._id]);

  // Log fee calculation for debugging
  useEffect(() => {
    if (hasGoMarketItems || hasNonGoMarketItems) {
      console.log("💰 Fees Breakdown:", {
        cartType: isMixedCart ? "MIXED" : (hasGoMarketItems ? "GO_MARKET_ONLY" : "NORMAL_ONLY"),
        isFirstOrder,
        freeByRule,
        baseAfterDiscount: `₹${baseAfterDiscount}`,
        goMarketItems: goMarketItems.length,
        nonGoMarketItems: nonGoMarketItems.length,
        goMarketSubtotal: `₹${goMarketSubtotal}`,
        nonGoMarketSubtotal: `₹${nonGoMarketSubtotal}`,
        ...(hasGoMarketItems && {
          goMarket: {
            distanceKm: `${distanceKm.toFixed(2)} km`,
            shippingFee: `₹${goMarketShipping}`,
            deliveryFeePerKm: `₹${commerceSettings.goMarketDeliveryFeePerKm || 0}/km`,
            deliveryFeeTotal: `₹${goMarketDelivery}`,
          }
        }),
        ...(hasNonGoMarketItems && {
          normal: {
            shippingFee: `₹${normalShipping}`,
            deliveryFee: `₹${normalDelivery}`,
          }
        }),
        totalFees: `₹${totalShipping + totalDelivery}`,
        total: `₹${totalAmount}`
      });
    }
  }, [hasGoMarketItems, hasNonGoMarketItems, goMarketShipping, goMarketDelivery, normalShipping, normalDelivery, distanceKm, baseAfterDiscount, isFirstOrder, freeByRule]);

  useEffect(() => {
    // Check if user has any previous orders
    if (context?.userData?._id) {
      fetchDataFromApi(`/api/order/order-list/orders`)
        .then((res) => {
          console.log("✅ First Order Check - Response:", res);
          setIsFirstOrder(res?.total === 0 || res?.data?.length === 0);
        })
        .catch((err) => {
          console.error("❌ First Order Check Failed:", err);
          setIsFirstOrder(false);
        });
    }
  }, [context?.userData]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setUserData(context?.userData);
    setSelectedAddress(context?.userData?.address_details[0]?._id);
  }, [context?.userData]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${VITE_APP_PAYPAL_CLIENT_ID}&disable-funding=card`;
    script.async = true;
    script.onload = () => {
      if (!window.paypal) return;
      window.paypal
        .Buttons({
          createOrder: async () => {
            const resp = await fetch("https://v6.exchangerate-api.com/v6/8f85eea95dae9336b9ea3ce9/latest/INR");
            const respData = await resp.json();
            let convertedAmount = 0;

            if (respData.result === "success") {
              const usdToInrRate = respData.conversion_rates.USD;
              convertedAmount = (totalAmount * usdToInrRate).toFixed(2);
            }
            const headers = {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json',
            };

            const response = await axios.get(
              VITE_API_URL + `/api/order/create-order-paypal?userId=${context?.userData?._id}&totalAmount=${convertedAmount}`,
              { headers }
            );

            return response?.data?.id;
          },
          onApprove: async (data) => {
            onApprovePayment(data);
          },
          onError: (err) => {
            history("/order/failed");
            console.error("PayPal Checkout onError:", err);
          },
        })
        .render("#paypal-button-container");
    };
    document.body.appendChild(script);
  }, [context?.userData, selectedAddress, totalAmount]);

  const onApprovePayment = async (data) => {
    context.setGlobalLoading(true);
    const user = context?.userData;

    const info = {
      userId: user?._id,
      products: checkoutItems,
      payment_status: "COMPLETE",
      delivery_address: selectedAddress,
      couponCode,
      discountAmount,
      totalAmt: totalAmount,
      distanceKm: hasGoMarketItems ? distanceKm : 0,
      userLocation: hasGoMarketItems ? userData?.goMarketLocation : null,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    };



    const headers = {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    };

    const response = await axios.post(
      VITE_API_URL + "/api/order/capture-order-paypal",
      {
        ...info,
        paymentId: data.orderID,
      },
      { headers }
    );

    context.alertBox("success", response?.data?.message);
    history("/order/success");
    context.setGlobalLoading(false);

    if (!isBuyNowCheckout) {
      deleteData(`/api/cart/emptyCart/${context?.userData?._id}`).then(() => {
        context?.getCartItems();
        localStorage.removeItem("couponCode");
        localStorage.removeItem("couponDiscount");
        localStorage.removeItem("couponFinalTotal");
      });
    }

  };


  const editAddress = (id) => {
    context?.setOpenAddressPanel(true);
    context?.setAddressMode("edit");
    context?.setAddressId(id);
  };


  const handleChange = (e, index) => {
    if (e.target.checked) {
      setIsChecked(index);
      setSelectedAddress(e.target.value);
    }
  };



  const checkout = (e) => {
    e.preventDefault();
    context.setGlobalLoading(true);

    if (userData?.address_details?.length !== 0) {
      const options = {
        key: VITE_APP_RAZORPAY_KEY_ID,
        key_secret: VITE_APP_RAZORPAY_KEY_SECRET,
        amount: parseInt(totalAmount * 100),
        currency: "INR",
        order_receipt: context?.userData?.name,
        name: "Advanced UI Techniques",
        description: "for testing purpose",
        handler: function (response) {

          const paymentId = response.razorpay_payment_id;

          const user = context?.userData;

          const payLoad = {
            userId: user?._id,
            products: checkoutItems,
            paymentId,
            payment_status: "COMPLETED",
            delivery_address: selectedAddress,
            couponCode,
            discountAmount,
            totalAmt: totalAmount,
            distanceKm: hasGoMarketItems ? distanceKm : 0,
            userLocation: hasGoMarketItems ? userData?.goMarketLocation : null,
            date: new Date().toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
          };


          postData(`/api/order/create`, payLoad).then((res) => {
            context.alertBox("success", res?.message);
            if (res?.error === false) {
              if (!isBuyNowCheckout) {
                deleteData(`/api/cart/emptyCart/${user?._id}`).then(() => {
                  context?.getCartItems();
                  localStorage.removeItem("couponCode");
                  localStorage.removeItem("couponDiscount");
                  localStorage.removeItem("couponFinalTotal");
                });
              }
              history("/order/success");
            } else {
              history("/order/failed");
              context.alertBox("error", res?.message);
            }
            context.setGlobalLoading(false);
          });


        },

        theme: {
          color: "#ff5252",
        },
      };

      const pay = new window.Razorpay(options);
      pay.open();
    } else {
      context.alertBox("error", "Please add address");
      context.setGlobalLoading(false);
    }

  };



  const cashOnDelivery = () => {

    const user = context?.userData;
    setIsloading(true);
    context.setGlobalLoading(true);

    if (userData?.address_details?.length !== 0) {
      const payLoad = {
        userId: user?._id,
        products: checkoutItems,
        paymentId: '',
        payment_status: "CASH ON DELIVERY",
        delivery_address: selectedAddress,
        couponCode,
        discountAmount,
        totalAmt: totalAmount,
        distanceKm: hasGoMarketItems ? distanceKm : 0,
        userLocation: hasGoMarketItems ? userData?.goMarketLocation : null,
        date: new Date().toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
      };


      postData(`/api/order/create`, payLoad).then((res) => {
        if (res?.error === false) {
          context.alertBox("success", res?.message);
          if (!isBuyNowCheckout) {
            deleteData(`/api/cart/emptyCart/${user?._id}`).then(() => {
              context?.getCartItems();
              localStorage.removeItem("couponCode");
              localStorage.removeItem("couponDiscount");
              localStorage.removeItem("couponFinalTotal");
              setIsloading(false);
              context.setGlobalLoading(false);
            });
          } else {
            setIsloading(false);
            context.setGlobalLoading(false);
          }
          history("/order/success");
        } else {
          context.alertBox("error", res?.message);
          setIsloading(false);
          context.setGlobalLoading(false);
          history("/order/failed");
        }
      });
    } else {
      context.alertBox("error", "Please add address");
      setIsloading(false);
      context.setGlobalLoading(false);
    }
  };

  return (
    <section className="py-3 lg:py-10 px-3">
      <form onSubmit={checkout}>
        <div className="w-full lg:w-[70%] m-auto flex flex-col md:flex-row gap-5">
          <div className="leftCol w-full md:w-[60%]">
            <div className="card bg-white shadow-md p-5 rounded-md w-full">
              <div className="flex items-center justify-between">
                <h2>Select Delivery Address</h2>
                {userData?.address_details?.length !== 0 && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      context?.setOpenAddressPanel(true);
                      context?.setAddressMode("add");
                    }}
                    className="btn"
                  >
                    <FaPlus />
                    ADD {context?.windowWidth < 767 ? '' : 'NEW ADDRESS'}
                  </Button>
                )}

              </div>

              <br />

              <div className="flex flex-col gap-4">


                {userData?.address_details?.length !== 0 ? (
                  userData?.address_details?.map((address, index) => {

                    return (
                      <label
                        className={`flex gap-3 p-4 border border-[rgba(0,0,0,0.1)] rounded-md relative ${isChecked === index && 'bg-[#fff2f2]'}`}
                        key={index}
                      >
                        <div>
                          <Radio
                            size="small"
                            onChange={(e) => handleChange(e, index)}
                            checked={isChecked === index}
                            value={address?._id}
                          />
                        </div>
                        <div className="info">
                          <span className="inline-block text-[13px] font-[500] p-1 bg-[#f1f1f1] rounded-md">{address?.addressType}</span>
                          <h3>{userData?.name}</h3>
                          <p className="mt-0 mb-0">
                            {address?.address_line1 + " " + address?.city + " " + address?.country + " " + address?.state + " " + address?.landmark + ' ' + '+ ' + address?.mobile}
                          </p>


                          <p className="mb-0 font-[500]">{userData?.mobile !== null ? '+' + userData?.mobile : '+' + address?.mobile}</p>
                        </div>

                        <Button
                          variant="text"
                          className="!absolute top-[15px] right-[15px]"
                          size="small"
                          onClick={() => editAddress(address?._id)}
                        >EDIT</Button>

                      </label>
                    );
                  })

                ) : (
                  <div className="flex items-center mt-5 justify-between flex-col p-5">
                    <img src="/map.png" width="100" />
                    <h2 className="text-center">No Addresses found in your account!</h2>
                    <p className="mt-0">Add a delivery address.</p>
                    <Button
                      className="btn-org"
                      onClick={() => {
                        context?.setOpenAddressPanel(true);
                        context?.setAddressMode("add");
                      }}
                    >
                      ADD ADDRESS
                    </Button>
                  </div>
                )}

              </div>


            </div>
          </div>

          <div className="rightCol w-full  md:w-[40%]">
            <div className="card shadow-md bg-white p-5 rounded-md">
              <h2 className="mb-4">Your Order</h2>

              <div className="flex items-center justify-between py-3 border-t border-b border-[rgba(0,0,0,0.1)]">
                <span className="text-[14px] font-[600]">Product</span>
                <span className="text-[14px] font-[600]">Subtotal</span>
              </div>

              <div className="mb-5 scroll max-h-[250px] overflow-y-scroll overflow-x-hidden pr-2">

                {checkoutItems?.length !== 0 &&
                  checkoutItems?.map((item, index) => {
                    return (
                      <div className="flex items-center justify-between py-2" key={index}>
                        <div className="part1 flex items-center gap-3">
                          <div className="img w-[50px] h-[50px] object-cover overflow-hidden rounded-md group cursor-pointer">
                            <img src={item?.image} className="w-full transition-all group-hover:scale-105" />
                          </div>

                          <div className="info">
                            <h4 className="text-[14px]" title={item?.productTitle}>{item?.productTitle?.substr(0, 20) + '...'} </h4>
                            <span className="text-[13px]">Qty : {item?.quantity}</span>
                          </div>
                        </div>

                        <span className="text-[14px] font-[500]">
                          {(item?.quantity * item?.price)?.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {!!couponCode && (
                <div className="bg-[#f7f7f7] rounded-md p-3 mb-3">
                  <p className="text-[13px] mb-1">Coupon: <strong>{couponCode}</strong></p>
                  <p className="text-[13px] mb-0">Discount: -{discountAmount.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}</p>
                </div>
              )}

              {isFirstOrder && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md p-3 mb-3">
                  <p className="text-[14px] font-semibold text-green-700 mb-0 flex items-center gap-2">
                    🎉 First Order - FREE Shipping & Delivery!
                  </p>
                </div>
              )}

              {/* Go Market Fees */}
              {hasGoMarketItems && (
                <div className="bg-[#f7f7f7] rounded-md p-3 mb-3">
                  <p className="text-[13px] mb-1 font-semibold text-blue-700">Go Market Fees</p>
                 <p className="text-[13px] mb-1">Go Market Shipping: {goMarketShipping === 0 ? "FREE" : goMarketShipping.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}</p>
                  <p className="text-[13px] mb-0">Go Market Delivery ({distanceKm.toFixed(1)} km): {goMarketDelivery === 0 ? "FREE" : goMarketDelivery.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}</p>
                  {!isFirstOrder && !freeByRule && (goMarketShipping > 0 || goMarketDelivery > 0) && (
                    <p className="text-[11px] text-blue-600 mt-2 bg-blue-50 p-2 rounded whitespace-pre-line">
                      ℹ️ Distance-based fees:{'\n'}
                      Shipping: ₹{goMarketShipping}{'\n'}
                      Delivery: ₹{commerceSettings.goMarketDeliveryFeePerKm}/km × {distanceKm.toFixed(1)} km = ₹{goMarketDelivery}
                    </p>
                  )}
                </div>
              )}

              {/* Normal E-commerce Fees */}
              {hasNonGoMarketItems && (
                <div className="bg-[#f7f7f7] rounded-md p-3 mb-3">
                  <p className="text-[13px] mb-1 font-semibold text-gray-700">Standard Fees</p>
                  <p className="text-[13px] mb-1">Shipping: {normalShipping === 0 ? "FREE" : normalShipping.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}</p>
                  <p className="text-[13px] mb-0">Delivery fee: {normalDelivery === 0 ? "FREE" : normalDelivery.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}</p>
                </div>
              )}

              {/* Mixed Cart Badge */}
              {isMixedCart && !isFirstOrder && !freeByRule && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-yellow-300 rounded-md p-3 mb-3">
                  <p className="text-[13px] font-semibold text-amber-800 mb-1">📦 Mixed Cart: Go Market + Regular items</p>
                  <p className="text-[11px] text-amber-700 mb-0">{goMarketItems.length} Go Market item(s) · {nonGoMarketItems.length} Regular item(s)</p>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-3 mb-3">
                <span className="text-[14px] font-[600]">Payable Total</span>
                <span className="text-primary font-bold">
                  {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                </span>


              </div>

              <div className="flex items-center flex-col gap-3 mb-2">
                <Button type="submit" className="btn-org btn-lg w-full flex gap-2 items-center">
                  <BsFillBagCheckFill className="text-[20px]" /> Pay On Online
                </Button>

                <div id="paypal-button-container" className={`${userData?.address_details?.length === 0 ? 'pointer-events-none' : ''}`}></div>

                <Button type="button" className="btn-dark btn-lg w-full flex gap-2 items-center" onClick={cashOnDelivery}>
                  {isLoading === true ? (
                    <CircularProgress />
                  ) : (
                    <>
                      <BsFillBagCheckFill className="text-[20px]" />
                      Cash on Delivery
                    </>
                  )}
                </Button>
              </div>

            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default Checkout;