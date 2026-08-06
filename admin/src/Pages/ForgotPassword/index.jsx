import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CgLogIn } from "react-icons/cg";
import { FaRegUser } from "react-icons/fa6";
import { postData } from "../../utils/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await postData("/api/user/forgot-password", { email });
      
      if (response.success || response.error === false) {
        setSuccess("OTP sent to your email successfully!");
        setTimeout(() => {
          setStep(2);
          setSuccess("");
        }, 1500);
      } else {
        setError(response.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      const response = await postData("/api/user/verify-otp", { email, otp });
      
      if (response.success || response.error === false) {
        setSuccess("OTP verified successfully!");
        setTimeout(() => {
          setStep(3);
          setSuccess("");
        }, 1500);
      } else {
        setError(response.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please enter both password fields");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await postData("/api/user/reset-password", { 
        email, 
        otp, 
        newPassword 
      });
      
      if (response.success || response.error === false) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.message || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      const response = await postData("/api/user/forgot-password", { email });
      
      if (response.success || response.error === false) {
        setSuccess("OTP resent to your email!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white w-full h-[100vh]">
      <header className="w-full fixed top-0 left-0  px-4 py-3 flex items-center justify-between z-50">
        <Link to="/">
          <img
            src="https://isomorphic-furyroad.vercel.app/_next/static/media/logo.a795e14a.svg"
            className="w-[200px]"
          />
        </Link>

        <div className="flex items-center gap-0">
          <NavLink to="/login" exact={true} activeClassName="isActive">
            <Button className="!rounded-full !text-[rgba(0,0,0,0.8)] !px-5 flex gap-1">
              <CgLogIn className="text-[18px]" /> Login
            </Button>
          </NavLink>

          <NavLink to="/sign-up" exact={true} activeClassName="isActive">
            <Button className="!rounded-full !text-[rgba(0,0,0,0.8)] !px-5 flex gap-1">
              <FaRegUser className="text-[15px]" /> Sign Up
            </Button>
          </NavLink>
        </div>
      </header>
      <img src="/patern.webp" className="w-full fixed top-0 left-0 opacity-5" />

      <div className="loginBox card w-[600px] h-[auto] pb-20 mx-auto pt-20 relative z-50">
        <div className="text-center">
          <img src="/icon.svg" className="m-auto" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mt-6 mb-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="text-sm font-semibold">Email</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <span className="text-sm font-semibold">OTP</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              3
            </div>
            <span className="text-sm font-semibold">Reset</span>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mx-8 mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            ✓ {success}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <>
            <h1 className="text-center text-[35px] font-[800] mt-4">
              Having trouble to sign in?<br />
              Reset your password.
            </h1>

            <form className="w-full px-8 mt-6" onSubmit={handleSendOTP}>
              <div className="form-group mb-4 w-full">
                <h4 className="text-[14px] font-[500] mb-1">Email</h4>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3 disabled:bg-gray-100"
                />
              </div>

              <Button 
                type="submit" 
                className="btn-blue btn-lg w-full" 
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Send OTP"}
              </Button>

              <br/><br/>
              <div className="text-center flex items-center justify-center gap-4">
                <span>Remember your password? </span>
                <Link
                  to="/login"
                  className="text-primary font-[700] text-[15px] hover:underline hover:text-gray-700"
                >
                  Sign In
                </Link>
              </div>
            </form>
          </>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <>
            <h1 className="text-center text-[35px] font-[800] mt-4">
              Enter OTP
            </h1>
            <p className="text-center text-gray-600 mt-2 px-8">
              We've sent a 6-digit code to<br />
              <strong>{email}</strong>
            </p>

            <form className="w-full px-8 mt-6" onSubmit={handleVerifyOTP}>
              <div className="form-group mb-4 w-full">
                <h4 className="text-[14px] font-[500] mb-1">OTP Code</h4>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  maxLength={6}
                  className="w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3 text-center text-2xl tracking-widest font-bold disabled:bg-gray-100"
                />
              </div>

              <Button 
                type="submit" 
                className="btn-blue btn-lg w-full" 
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Verify OTP"}
              </Button>

              <br/><br/>
              <div className="text-center flex flex-col items-center justify-center gap-2">
                <span>Didn't receive the code? </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-primary font-[700] text-[15px] hover:underline hover:text-gray-700 disabled:opacity-50"
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(""); }}
                  className="text-gray-600 text-[14px] hover:underline mt-2"
                >
                  ← Change Email
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <>
            <h1 className="text-center text-[35px] font-[800] mt-4">
              Create New Password
            </h1>
            <p className="text-center text-gray-600 mt-2 px-8">
              Please enter your new password
            </p>

            <form className="w-full px-8 mt-6" onSubmit={handleResetPassword}>
              <div className="form-group mb-4 w-full">
                <h4 className="text-[14px] font-[500] mb-1">New Password</h4>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3 disabled:bg-gray-100"
                />
              </div>

              <div className="form-group mb-4 w-full">
                <h4 className="text-[14px] font-[500] mb-1">Confirm Password</h4>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3 disabled:bg-gray-100"
                />
              </div>

              <Button 
                type="submit" 
                className="btn-blue btn-lg w-full" 
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
              </Button>

              <br/><br/>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-primary font-[700] text-[15px] hover:underline hover:text-gray-700"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export default ForgotPassword;
