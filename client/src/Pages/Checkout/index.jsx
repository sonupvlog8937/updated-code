import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import { BsFillBagCheckFill } from "react-icons/bs";
import { useAppContext } from "../../hooks/useAppContext";
import { FaPlus } from "react-icons/fa6";
import Radio from '@mui/material/Radio';
import { deleteData, postData } from "../../utils/api";
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
  const totalAmount = Math.max(cartSubTotal - discountAmount, 0);

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
    const user = context?.userData;

    const info = {
      userId: user?._id,
      products: checkoutItems,
      payment_status: "COMPLETE",
      delivery_address: selectedAddress,
      ouponCode,
      discountAmount,
      totalAmount,
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
    }

  };



  const cashOnDelivery = () => {

    const user = context?.userData;
    setIsloading(true);

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
              setIsloading(false);
            });
          } else {
            setIsloading(false);
          }
        } else {
          context.alertBox("error", res?.message);
          setIsloading(false);
        }
        history("/order/success");
      });
    } else {
      context.alertBox("error", "Please add address");
      setIsloading(false);
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
