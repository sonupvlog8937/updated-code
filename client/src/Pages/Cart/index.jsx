// import React, { useEffect, useMemo, useState } from "react";

// import Button from "@mui/material/Button";
// import { BsFillBagCheckFill } from "react-icons/bs";
// import TextField from "@mui/material/TextField";
// import CartItems from "./cartItems";
// import { useAppContext } from "../../hooks/useAppContext";
// import { fetchDataFromApi } from "../../utils/api";
// import { Link } from "react-router-dom";

// const COUPON_CONFIG = {
//   SAVE10: { type: "percentage", value: 10, minAmount: 1000 },
//   FLAT200: { type: "fixed", value: 200, minAmount: 1500 },
//   FREESHIP: { type: "fixed", value: 0, minAmount: 0 },
// };

// const CartPage = () => {

//   const [productSizeData, setProductSizeData] = useState([]);
//   const [productRamsData, setProductRamsData] = useState([]);
//   const [productWeightData, setProductWeightData] = useState([]);
//   const [couponInput, setCouponInput] = useState(localStorage.getItem("couponCode") || "");
//   const [couponMessage, setCouponMessage] = useState("");
//   const context = useAppContext();

//   useEffect(() => {

//     window.scrollTo(0, 0);

//     fetchDataFromApi("/api/product/productSize/get").then((res) => {
//       if (res?.error === false) {
//         setProductSizeData(res?.data);
//       }
//     });

//     fetchDataFromApi("/api/product/productRAMS/get").then((res) => {
//       if (res?.error === false) {
//         setProductRamsData(res?.data);
//       }
//     });

//     fetchDataFromApi("/api/product/productWeight/get").then((res) => {
//       if (res?.error === false) {
//         setProductWeightData(res?.data);
//       }
//     });
//   }, []);

//   const cartSubTotal = useMemo(
//     () =>
//       context.cartData?.length !== 0
//         ? context.cartData?.map((item) => parseInt(item.price) * item.quantity).reduce((total, value) => total + value, 0)
//         : 0,
//     [context.cartData]
//   );

//   const couponSummary = useMemo(() => {
//     const code = (localStorage.getItem("couponCode") || "").trim().toUpperCase();

//     if (!code) {
//       return { code: "", discountAmount: 0, isValid: false, message: "" };
//     }

//     const coupon = COUPON_CONFIG[code];

//     if (!coupon) {
//       return { code, discountAmount: 0, isValid: false, message: "Invalid coupon code" };
//     }

//     if (cartSubTotal < coupon.minAmount) {
//       return {
//         code,
//         discountAmount: 0,
//         isValid: false,
//         message: `Coupon requires minimum order of ${coupon.minAmount.toLocaleString("en-US", { style: "currency", currency: "INR" })}`,
//       };
//     }

//     const discountAmount = coupon.type === "percentage" ? Math.round((cartSubTotal * coupon.value) / 100) : coupon.value;

//     return {
//       code,
//       discountAmount,
//       isValid: true,
//       message: `${code} applied successfully`,
//     };
//   }, [cartSubTotal]);

//   useEffect(() => {
//     if (!couponSummary.code) {
//       localStorage.removeItem("couponDiscount");
//       localStorage.removeItem("couponFinalTotal");
//       return;
//     }

//     if (couponSummary.isValid) {
//       localStorage.setItem("couponDiscount", String(couponSummary.discountAmount));
//       localStorage.setItem("couponFinalTotal", String(Math.max(cartSubTotal - couponSummary.discountAmount, 0)));
//       return;
//     }

//     localStorage.removeItem("couponDiscount");
//     localStorage.removeItem("couponFinalTotal");
//   }, [couponSummary, cartSubTotal]);

//   const applyCoupon = () => {
//     const code = couponInput.trim().toUpperCase();

//     if (!code) {
//       setCouponMessage("Please enter a coupon code");
//       return;
//     }

//     localStorage.setItem("couponCode", code);
//     setCouponInput(code);
//     setCouponMessage("");
//   };

//   const removeCoupon = () => {
//     localStorage.removeItem("couponCode");
//     localStorage.removeItem("couponDiscount");
//     localStorage.removeItem("couponFinalTotal");
//     setCouponInput("");
//     setCouponMessage("Coupon removed");
//   };


//   const selectedSize = (item) => {
//     if (item?.size !== "") {
//       return item?.size;
//     }

//     if (item?.weight !== "") {
//       return item?.weight;
//     }

//     if (item?.ram !== "") {
//       return item?.ram;
//     }

//   };

//   const totalAfterDiscount = Math.max(cartSubTotal - (couponSummary?.discountAmount || 0), 0);

//   return (
//     <section className="section py-4 lg:py-8 pb-10">
//       <div className="container w-[80%] max-w-[80%] flex gap-5 flex-col lg:flex-row">
//         <div className="leftPart w-full lg:w-[70%]">
//           <div className="shadow-md rounded-md bg-white">
//             <div className="py-5 px-3 border-b border-[rgba(0,0,0,0.1)]">
//               <h2>Your Cart</h2>
//               <p className="mt-0 mb-0">
//                 There are <span className="font-bold text-primary">{context?.cartData?.length}</span>{" "}
//                 products in your cart
//               </p>
//             </div>

          

//              {context?.cartData?.length !== 0 ? (
//               context?.cartData?.map((item, index) => {
//                 return (
//                  <CartItems
//                     selected={() => selectedSize(item)}
//                     qty={item?.quantity}
//                     item={item}
//                     key={index}
//                     productSizeData={productSizeData}
//                     productRamsData={productRamsData}
//                     productWeightData={productWeightData}
//                   />
//                 );
//               })

//                  ) : (
//               <div className="flex items-center justify-center flex-col py-10 gap-5">
//                 <img src="/empty-cart.png" className="w-[150px]" />
//                 <h4>Your Cart is currently empty</h4>
//                 <Link to="/">
//                   <Button className="btn-org">Continue Shopping</Button>
//                 </Link>
//               </div>
//             )}

//           </div>
//         </div>

//         <div className="rightPart w-full lg:w-[30%]">
//           <div className="shadow-md rounded-md bg-white p-5 sticky top-[155px] z-[90]">
//             <h3 className="pb-3">Cart Totals</h3>
//             <hr />

//              <div className="mb-3 mt-4">
//               <p className="text-[14px] font-[500] mb-2">Apply Coupon</p>
//               <div className="flex gap-2">
//                 <TextField
//                   size="small"
//                   placeholder="Enter code"
//                   value={couponInput}
//                   onChange={(e) => setCouponInput(e.target.value)}
//                   className="w-full"
//                 />
//                 <Button type="button" variant="outlined" onClick={applyCoupon}>Apply</Button>
//               </div>

//               {(couponSummary.message || couponMessage) && (
//                 <p className={`text-[12px] mt-2 ${couponSummary.isValid ? "text-green-600" : "text-red-500"}`}>
//                   {couponSummary.message || couponMessage}
//                 </p>
//               )}

//               {couponSummary.code && (
//                 <Button type="button" size="small" onClick={removeCoupon} className="!mt-1 !p-0 !min-w-0">
//                   Remove coupon
//                 </Button>
//               )}
//             </div>

//             <p className="flex items-center justify-between">
//               <span className="text-[14px] font-[500]">Subtotal</span>
//               <span className="text-primary font-bold">
//                   {cartSubTotal?.toLocaleString("en-US", { style: "currency", currency: "INR" })}
//               </span>
//             </p>

//             <p className="flex items-center justify-between">
//               <span className="text-[14px] font-[500]">Shipping</span>
//               <span className="font-bold">Free</span>
//             </p>

//               <p className="flex items-center justify-between">
//               <span className="text-[14px] font-[500]">Coupon Discount</span>
//               <span className="font-bold text-green-600">
//                 -{(couponSummary?.discountAmount || 0).toLocaleString("en-US", { style: "currency", currency: "INR" })}
//               </span>
//             </p>

//             <p className="flex items-center justify-between">
//               <span className="text-[14px] font-[500]">Estimate for</span>
//               <span className="font-bold"><span className="font-bold">{context?.userData?.address_details[0]?.country}</span></span>
//             </p>

//             <p className="flex items-center justify-between">
//               <span className="text-[14px] font-[500]">Total</span>
//               <span className="text-primary font-bold">
//                   {totalAfterDiscount?.toLocaleString("en-US", { style: "currency", currency: "INR" })}
//               </span>
//             </p>

//             <br />

//             <Link to="/checkout">
//               <Button className="btn-org btn-lg w-full flex gap-2">
//                 <BsFillBagCheckFill className="text-[20px]" /> Checkout
//               </Button>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default CartPage;


import React, { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { BsFillBagCheckFill } from "react-icons/bs";
import TextField from "@mui/material/TextField";
import CartItems from "./cartItems";
import { useAppContext } from "../../hooks/useAppContext";
import { fetchDataFromApi } from "../../utils/api";
import { Link } from "react-router-dom";

const COUPON_CONFIG = {
  SAVE10: { type: "percentage", value: 10, minAmount: 1000 },
  FLAT200: { type: "fixed", value: 200, minAmount: 1500 },
  FREESHIP: { type: "fixed", value: 0, minAmount: 0 },
  WISDOM20: { type: "fixed", value: 20, minAmount: 0 },
  HOLI20: { type: "fixed", value: 20, minAmount: 0 },
};

const CartPage = () => {

  const [productSizeData, setProductSizeData] = useState([]);
  const [productRamsData, setProductRamsData] = useState([]);
  const [productWeightData, setProductWeightData] = useState([]);

  const [couponInput, setCouponInput] = useState(localStorage.getItem("couponCode") || "");
  const [appliedCoupon, setAppliedCoupon] = useState(localStorage.getItem("couponCode") || "");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const context = useAppContext();

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchDataFromApi("/api/product/productSize/get").then((res) => {
      if (!res?.error) setProductSizeData(res?.data);
    });

    fetchDataFromApi("/api/product/productRAMS/get").then((res) => {
      if (!res?.error) setProductRamsData(res?.data);
    });

    fetchDataFromApi("/api/product/productWeight/get").then((res) => {
      if (!res?.error) setProductWeightData(res?.data);
    });
  }, []);

  // ✅ Subtotal
  const cartSubTotal = useMemo(() => {
    if (!context?.cartData?.length) return 0;
    return context.cartData
      .map((item) => parseInt(item.price) * item.quantity)
      .reduce((total, value) => total + value, 0);
  }, [context?.cartData]);

  // ✅ Coupon Calculation
  const couponSummary = useMemo(() => {
    const code = appliedCoupon.trim().toUpperCase();
    if (!code) return { discountAmount: 0, isValid: false, message: "" };

    const coupon = COUPON_CONFIG[code];
    if (!coupon)
      return { discountAmount: 0, isValid: false, message: "Invalid coupon code" };

    if (cartSubTotal < coupon.minAmount)
      return {
        discountAmount: 0,
        isValid: false,
        message: `Minimum order ₹${coupon.minAmount} required`,
      };

    const discountAmount =
      coupon.type === "percentage"
        ? Math.round((cartSubTotal * coupon.value) / 100)
        : coupon.value;

    return {
      discountAmount,
      isValid: true,
      message: `${code} applied successfully`,
    };
  }, [appliedCoupon, cartSubTotal]);

  useEffect(() => {
    if (couponSummary.isValid) {
      localStorage.setItem("couponCode", appliedCoupon);
      localStorage.setItem("couponDiscount", couponSummary.discountAmount);
    } else {
      localStorage.removeItem("couponDiscount");
    }
  }, [couponSummary, appliedCoupon]);

  const applyCoupon = () => {
    if (!couponInput.trim()) {
      setCouponMessage("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);

    setTimeout(() => {
      setAppliedCoupon(couponInput.trim().toUpperCase());
      setCouponLoading(false);
    }, 800);
  };

  const removeCoupon = () => {
    setAppliedCoupon("");
    setCouponInput("");
    setCouponMessage("Coupon removed");

    localStorage.removeItem("couponCode");
    localStorage.removeItem("couponDiscount");
  };

  // ✅ SIZE SELECT FIX
  const selectedSize = (item) => {
    if (item?.size) return item.size;
    if (item?.weight) return item.weight;
    if (item?.ram) return item.ram;
    return "";
  };

  const totalAfterDiscount = Math.max(
    cartSubTotal - (couponSummary?.discountAmount || 0),
    0
  );

  return (
    <section className="section py-4 lg:py-8 pb-10">
      <div className="container w-[80%] flex gap-5 flex-col lg:flex-row">

        {/* LEFT SIDE */}
        <div className="leftPart w-full lg:w-[70%]">
          <div className="shadow-md rounded-md bg-white p-4">
            <h2>Your Cart</h2>

            {context?.cartData?.length ? (
              context.cartData.map((item, index) => (
                <CartItems
                  key={index}
                  item={item}
                  qty={item.quantity}
                  selected={() => selectedSize(item)}
                  productSizeData={productSizeData}
                  productRamsData={productRamsData}
                  productWeightData={productWeightData}
                />
              ))
            ) : (
              <div className="text-center py-10">
                <h4>Your Cart is empty</h4>
                <Link to="/">
                  <Button className="btn-org mt-3">Continue Shopping</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="rightPart w-full lg:w-[30%]">
          <div className="shadow-md rounded-md bg-white p-5 sticky top-[155px]">

            <h3>Cart Totals</h3>
            <hr />

            <div className="mt-4">
              <p className="mb-2 font-[500]">Apply Coupon</p>
              <div className="flex gap-2">
                <TextField
                  size="small"
                  placeholder="Enter code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="w-full"
                />
                <Button
                  variant="contained"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>

              {(couponSummary.message || couponMessage) && (
                <p className={`text-[13px] mt-2 ${couponSummary.isValid ? "text-green-600" : "text-red-500"}`}>
                  {couponSummary.message || couponMessage}
                </p>
              )}

              {appliedCoupon && (
                <Button size="small" onClick={removeCoupon}>
                  Remove coupon
                </Button>
              )}
            </div>

            <hr className="my-3" />

            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{cartSubTotal}</span>
            </p>

            <p className="flex justify-between">
              <span>Discount</span>
              <span className="text-green-600">
                -₹{couponSummary.discountAmount}
              </span>
            </p>

            <p className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{totalAfterDiscount}</span>
            </p>

            <br />

            <Link to="/checkout">
              <Button className="btn-org w-full flex gap-2">
                <BsFillBagCheckFill /> Checkout
              </Button>
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CartPage;