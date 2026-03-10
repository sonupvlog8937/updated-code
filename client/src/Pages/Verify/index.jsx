import React, { useEffect, useState } from "react";
import OtpBox from "../../components/OtpBox";
import Button from "@mui/material/Button";
import { postData } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";

const Verify = () => {
  const [otp, setOtp]           = useState("");
  const [isLoading, setLoading] = useState(false);
  const [resendTimer, setTimer] = useState(60);

  const history = useNavigate();
  const context = useAppContext();

  const email      = localStorage.getItem("userEmail");
  const actionType = localStorage.getItem("actionType");

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const verifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      context.alertBox("error", "Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);

    if (actionType === "forgot-password") {
      // ✅ Forgot password OTP verify
      const res = await postData("/api/user/verify-forgot-password-otp", { email, otp });
      setLoading(false);

      if (res?.error === false) {
        context.alertBox("success", res?.message);
        localStorage.removeItem("actionType");
        history("/forgot-password");
      } else {
        context.alertBox("error", res?.message || "Invalid OTP");
      }

    } else {
      // ✅ Email verification OTP (register ke baad)
      const res = await postData("/api/user/verify-email", { email, otp });
      setLoading(false);

      if (res?.error === false) {
        context.alertBox("success", res?.message);
        localStorage.setItem("accessToken", res?.data?.accesstoken);
        localStorage.setItem("refreshToken", res?.data?.refreshToken);
        localStorage.removeItem("userEmail");
        context.setIsLogin(true);
        history("/");
      } else {
        context.alertBox("error", res?.message || "Invalid OTP");
      }
    }
  };

  const handleResend = async () => {
    if (actionType === "forgot-password") {
      const res = await postData("/api/user/forgot-password", { email });
      if (res?.error === false) {
        context.alertBox("success", "New OTP sent!");
        setTimer(60);
      } else {
        context.alertBox("error", res?.message);
      }
    } else {
      const res = await postData("/api/user/resend-otp", { email });
      if (res?.error === false) {
        context.alertBox("success", "New OTP sent to your email!");
        setTimer(60);
      } else {
        context.alertBox("error", res?.message);
      }
    }
  };

  return (
    <section className="section py-5 lg:py-10">
      <div className="container">
        <div className="card shadow-md w-full sm:w-[400px] m-auto rounded-md bg-white p-5 px-10">
          <div className="text-center flex items-center justify-center">
            <img src="/verify3.png" width="80" alt="verify" />
          </div>

          <h3 className="text-center text-[18px] text-black mt-4 mb-1">
            Verify OTP
          </h3>

          <p className="text-center mt-0 mb-4">
            OTP sent to{" "}
            <span className="text-primary font-bold">{email}</span>
          </p>

          <form onSubmit={verifyOTP}>
            <OtpBox length={6} onChange={(value) => setOtp(value)} />

            <div className="flex items-center justify-center mt-5 px-3">
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full btn-org btn-lg"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </form>

          {/* Resend OTP */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Didn't receive it?{" "}
            {resendTimer > 0 ? (
              <span className="text-gray-400">Resend in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-blue-600 font-semibold hover:underline"
              >
                Resend OTP
              </button>
            )}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Verify;