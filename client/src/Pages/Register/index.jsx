import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { MdMarkEmailRead } from "react-icons/md";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useAppContext } from "../../hooks/useAppContext";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();


// ─── OTP Verification Screen ──────────────────────────────────────────────────
const OtpVerify = ({ email, onSuccess }) => {
  const [otp, setOtp]           = useState("");
  const [isLoading, setLoading] = useState(false);
  const [resendTimer, setTimer] = useState(60);
  const context                 = useAppContext();

  // countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      context.alertBox("error", "Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);

    // ✅ Correct route — backend me yahi handle karta hai
    const res = await postData("/api/user/verify-email", { email, otp });
    setLoading(false);

    if (res?.error === false) {
      context.alertBox("success", res?.message);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("accessToken", res?.data?.accesstoken);
      localStorage.setItem("refreshToken", res?.data?.refreshToken);
      context.setIsLogin(true);
      onSuccess();
    } else {
      context.alertBox("error", res?.message || "OTP verification failed");
    }
  };

  const handleResend = async () => {
    const res = await postData("/api/user/resend-otp", { email });
    if (res?.error === false) {
      context.alertBox("success", "New OTP sent to your email!");
      setTimer(60);
    } else {
      context.alertBox("error", res?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="card shadow-md w-full sm:w-[400px] m-auto rounded-md bg-white p-5 px-10">
      {/* Icon */}
      <div className="flex justify-center mb-3">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <MdMarkEmailRead className="text-blue-500 text-3xl" />
        </div>
      </div>

      <h3 className="text-center text-[18px] font-semibold text-black mb-1">
        Verify your email
      </h3>
      <p className="text-center text-sm text-gray-500 mb-6">
        We sent a 6-digit OTP to<br />
        <strong className="text-gray-700">{email}</strong>
      </p>

      {/* OTP Input */}
      <div className="form-group w-full mb-4">
        <TextField
          type="text"
          inputProps={{
            maxLength: 6,
            style: {
              textAlign: "center",
              letterSpacing: "8px",
              fontSize: "22px",
              fontWeight: "700"
            }
          }}
          label="Enter OTP"
          variant="outlined"
          className="w-full"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
        />
      </div>

      {/* Verify Button */}
      <Button
        fullWidth
        variant="contained"
        disabled={isLoading || otp.length !== 6}
        onClick={handleVerify}
        className="!mb-4 !py-3"
      >
        {isLoading ? <CircularProgress color="inherit" size={22} /> : "Verify Email"}
      </Button>

      {/* Resend */}
      <p className="text-center text-sm text-gray-500">
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
  );
};


// ─── Main Register Component ──────────────────────────────────────────────────
const Register = () => {
  const [isLoading, setIsLoading]           = useState(false);
  const [isPasswordShow, setIsPasswordShow] = useState(false);
  const [showOtp, setShowOtp]               = useState(false);
  const [formFields, setFormFields]         = useState({ name: "", email: "", password: "" });

  const context = useAppContext();
  const history = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const valideValue = Object.values(formFields).every((el) => el);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formFields.name)     return context.alertBox("error", "Please enter full name");
    if (!formFields.email)    return context.alertBox("error", "Please enter email id");
    if (!formFields.password) return context.alertBox("error", "Please enter password");

    setIsLoading(true);
    const res = await postData("/api/user/register", formFields);
    setIsLoading(false);

    if (res?.error === false) {
      context.alertBox("success", res?.message);
      setShowOtp(true);   // OTP screen dikhao
    } else {
      context.alertBox("error", res?.message || "Registration failed");
    }
  };

  const authWithGoogle = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        const user = result.user;
        const fields = {
          name:   user.providerData[0].displayName,
          email:  user.providerData[0].email,
          password: null,
          avatar: user.providerData[0].photoURL,
          mobile: user.providerData[0].phoneNumber,
          role:   "USER",
        };

        postData("/api/user/authWithGoogle", fields).then((res) => {
          if (res?.error === false) {
            context.alertBox("success", res?.message);
            localStorage.setItem("userEmail", fields.email);
            localStorage.setItem("accessToken", res?.data?.accesstoken);
            localStorage.setItem("refreshToken", res?.data?.refreshToken);
            context.setIsLogin(true);
            history("/");
          } else {
            context.alertBox("error", res?.message);
          }
          setIsLoading(false);
        });
      })
      .catch((error) => {
        console.error("Google sign-in error:", error.message);
      });
  };

  // OTP screen show karo registration ke baad
  if (showOtp) {
    return (
      <section className="section py-5 sm:py-10">
        <div className="container">
          <OtpVerify
            email={formFields.email}
            onSuccess={() => history("/")}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="section py-5 sm:py-10">
      <div className="container">
        <div className="card shadow-md w-full sm:w-[400px] m-auto rounded-md bg-white p-5 px-10">
          <h3 className="text-center text-[18px] text-black">
            Register with a new account
          </h3>

          <form className="w-full mt-5" onSubmit={handleSubmit}>
            <div className="form-group w-full mb-5">
              <TextField
                type="text"
                id="name"
                name="name"
                value={formFields.name}
                disabled={isLoading}
                label="Full Name"
                variant="outlined"
                className="w-full"
                onChange={onChangeInput}
              />
            </div>

            <div className="form-group w-full mb-5">
              <TextField
                type="email"
                id="email"
                name="email"
                label="Email Id"
                value={formFields.email}
                disabled={isLoading}
                variant="outlined"
                className="w-full"
                onChange={onChangeInput}
              />
            </div>

            <div className="form-group w-full mb-5 relative">
              <TextField
                type={isPasswordShow ? "text" : "password"}
                id="password"
                name="password"
                label="Password"
                variant="outlined"
                className="w-full"
                value={formFields.password}
                disabled={isLoading}
                onChange={onChangeInput}
              />
              <Button
                className="!absolute top-[10px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-black"
                onClick={() => setIsPasswordShow(!isPasswordShow)}
              >
                {isPasswordShow
                  ? <IoMdEyeOff className="text-[20px] opacity-75" />
                  : <IoMdEye   className="text-[20px] opacity-75" />}
              </Button>
            </div>

            <div className="flex items-center w-full mt-3 mb-3">
              <Button
                type="submit"
                disabled={!valideValue || isLoading}
                className="!bg-[#f1f1f1] btn-lg w-full flex gap-3"
              >
                {isLoading ? <CircularProgress color="inherit" /> : "Register"}
              </Button>
            </div>

            <p className="text-center">
              Already have an account?{" "}
              <Link className="link text-[14px] font-[600] text-primary" to="/login">
                Login
              </Link>
            </p>

            <p className="text-center font-[500]">Or continue with social account</p>

            <Button
              className="flex gap-3 w-full btn-org btn-lg !text-black"
              onClick={authWithGoogle}
            >
              <FcGoogle className="text-[20px]" /> Sign Up with Google
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Register;