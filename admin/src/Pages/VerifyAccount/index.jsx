import React, { useState, useEffect, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CgLogIn } from "react-icons/cg";
import { FaRegUser } from "react-icons/fa";
import { MyContext } from "../../App";
import { fetchDataFromApi, postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import OtpBox from "../../Components/OtpBox";

const VerifyAccount = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const context = useContext(MyContext);
  const history = useNavigate();
  const userEmail = localStorage.getItem("userEmail") || "";

  useEffect(() => {
    fetchDataFromApi("/api/logo").then((res) => {
      localStorage.setItem("logo", res?.logo?.[0]?.logo || "");
    });
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (value) => setOtp(value);

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      return context.alertBox("error", "Please enter the complete 6-digit OTP");
    }
    setIsLoading(true);
    try {
      const actionType = localStorage.getItem("actionType");
      // ✅ FIX: Route was /verifyEmail (wrong) → correct is /verify-email
      const endpoint =
        actionType !== "forgot-password"
          ? "/api/user/verify-email"
          : "/api/user/verify-forgot-password-otp";

      const res = await postData(endpoint, { email: userEmail, otp });

      if (res?.error === false) {
        context.alertBox("success", res?.message);
        if (actionType !== "forgot-password") {
          localStorage.removeItem("userEmail");
          history("/login");
        } else {
          history("/change-password");
        }
      } else {
        context.alertBox("error", res?.message || "Verification failed. Please try again.");
      }
    } catch {
      context.alertBox("error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false); // ✅ FIX: was missing → loading state was stuck
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const res = await postData("/api/user/resend-otp", { email: userEmail });
      if (res?.error !== true) {
        context.alertBox("success", res?.message || "OTP resent successfully!");
        setOtp("");
        setCountdown(60);
      } else {
        context.alertBox("error", res?.message || "Failed to resend OTP.");
      }
    } catch {
      context.alertBox("error", "Something went wrong. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const maskedEmail = userEmail
    ? userEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 6)) + c)
    : "";

  return (
    <section className="verify-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        .verify-page { min-height:100vh; background:#0a0a0f; font-family:'Sora',sans-serif; display:flex; flex-direction:column; position:relative; overflow-x:hidden; }
        .bg-grid { position:fixed; inset:0; background-image:linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px); background-size:48px 48px; pointer-events:none; z-index:0; }
        .bg-glow { position:fixed; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%); top:-100px; right:-100px; pointer-events:none; z-index:0; }
        .bg-glow-2 { position:fixed; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%); bottom:-100px; left:-100px; pointer-events:none; z-index:0; }
        .verify-header { position:fixed; top:0; left:0; right:0; padding:16px 32px; display:flex; align-items:center; justify-content:space-between; z-index:50; background:rgba(10,10,15,0.8); backdrop-filter:blur(16px); border-bottom:1px solid rgba(99,102,241,0.1); }
        .verify-header img { height:36px; object-fit:contain; }
        .header-nav { display:flex; gap:4px; }
        .nav-btn { display:flex; align-items:center; gap:6px; padding:8px 18px; border-radius:100px; font-family:'Sora',sans-serif; font-size:14px; font-weight:500; color:rgba(255,255,255,0.7); background:transparent; border:1px solid transparent; cursor:pointer; transition:all 0.2s; text-decoration:none; }
        .nav-btn:hover { color:#fff; background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); }
        .verify-container { position:relative; z-index:10; width:100%; max-width:480px; margin:0 auto; padding:120px 24px 60px; }
        .verify-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:52px 40px; backdrop-filter:blur(20px); box-shadow:0 0 0 1px rgba(99,102,241,0.05),0 32px 64px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05); text-align:center; }
        .verify-icon-wrapper { position:relative; width:80px; height:80px; margin:0 auto 28px; }
        .verify-icon-ring { position:absolute; inset:0; border-radius:50%; border:2px solid rgba(99,102,241,0.3); animation:pulse-ring 2s ease-out infinite; }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6;} 100%{transform:scale(1.4);opacity:0;} }
        .verify-icon { width:80px; height:80px; background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 32px rgba(99,102,241,0.4); position:relative; z-index:1; }
        .verify-title { font-size:26px; font-weight:800; color:#fff; margin:0 0 8px; letter-spacing:-0.5px; }
        .verify-subtitle { font-size:14px; color:rgba(255,255,255,0.4); margin:0 0 6px; }
        .email-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:100px; padding:4px 14px; font-size:13px; font-weight:600; color:#a5b4fc; font-family:'JetBrains Mono',monospace; margin-bottom:32px; margin-top:10px; }
        .otp-section { display:flex; flex-direction:column; align-items:center; gap:28px; }
        .otp-section input { background:rgba(255,255,255,0.05) !important; border:1px solid rgba(255,255,255,0.1) !important; border-radius:12px !important; color:#fff !important; font-family:'JetBrains Mono',monospace !important; font-size:20px !important; font-weight:600 !important; transition:all 0.2s !important; }
        .otp-section input:focus { border-color:rgba(99,102,241,0.6) !important; background:rgba(99,102,241,0.08) !important; box-shadow:0 0 0 4px rgba(99,102,241,0.12) !important; outline:none !important; }
        .verify-btn { width:100%; height:52px; background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%); border:none; border-radius:12px; font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#fff; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; letter-spacing:0.3px; box-shadow:0 8px 24px rgba(99,102,241,0.35); }
        .verify-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 32px rgba(99,102,241,0.5); }
        .verify-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }
        .resend-section { margin-top:20px; font-size:13px; color:rgba(255,255,255,0.4); }
        .resend-btn { background:none; border:none; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:color 0.2s; padding:0; margin-left:4px; }
        .resend-btn:disabled { color:rgba(255,255,255,0.25); cursor:not-allowed; }
        .resend-btn:not(:disabled) { color:#818cf8; }
        .resend-btn:not(:disabled):hover { color:#a5b4fc; text-decoration:underline; }
        .countdown-badge { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:rgba(99,102,241,0.15); border-radius:6px; font-size:11px; font-weight:700; color:#818cf8; font-family:'JetBrains Mono',monospace; margin-left:4px; vertical-align:middle; }
        .expiry-note { font-size:12px; color:rgba(255,255,255,0.25); margin-top:8px; font-family:'JetBrains Mono',monospace; }
        @media(max-width:600px){ .verify-header{padding:14px 20px;} .header-nav{display:none;} .verify-card{padding:40px 24px;border-radius:20px;} .verify-title{font-size:22px;} }
      `}</style>

      <div className="bg-grid" />
      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <header className="verify-header">
        <Link to="/"><img src={localStorage.getItem("logo") || "/icon.svg"} alt="Logo" /></Link>
        <nav className="header-nav">
          <NavLink to="/login" className="nav-btn"><CgLogIn size={16} /> Login</NavLink>
          <NavLink to="/sign-up" className="nav-btn"><FaRegUser size={14} /> Sign Up</NavLink>
        </nav>
      </header>

      <div className="verify-container">
        <div className="verify-card">
          <div className="verify-icon-wrapper">
            <div className="verify-icon-ring" />
            <div className="verify-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>

          <h1 className="verify-title">Check your email</h1>
          <p className="verify-subtitle">We sent a 6-digit verification code to</p>
          <div className="email-badge">✉ {maskedEmail || "your email"}</div>

          <form onSubmit={verifyOTP}>
            <div className="otp-section">
              <OtpBox length={6} onChange={handleOtpChange} />
              <button type="submit" className="verify-btn" disabled={!otp || otp.length < 6 || isLoading}>
                {isLoading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Verify & Continue"}
              </button>
            </div>
          </form>

          <div className="resend-section">
            Didn't receive the code?
            <button className="resend-btn" onClick={handleResendOtp} disabled={countdown > 0 || resendLoading} type="button">
              {resendLoading ? <CircularProgress size={12} sx={{ color: "#818cf8" }} /> : "Resend OTP"}
            </button>
            {countdown > 0 && <span className="countdown-badge">{countdown}</span>}
          </div>

          <p className="expiry-note">⏱ OTP expires in 10 minutes</p>
        </div>
      </div>
    </section>
  );
};

export default VerifyAccount;