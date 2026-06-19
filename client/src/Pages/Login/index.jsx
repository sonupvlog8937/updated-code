import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";

// ─── Floating Label Input ─────────────────────────────────────────────────────
const FloatingInput = ({ label, type, name, value, onChange, disabled }) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value?.length > 0;

  return (
    <div className="login-input-wrap">
      <div className={`login-input-inner ${focused ? "focused" : ""} ${disabled ? "disabled" : ""}`}>
        <label className={`login-float-label ${active ? "active" : ""}`}>{label}</label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="login-input"
          autoComplete={name === "email" ? "email" : "off"}
        />
      </div>
    </div>
  );
};

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login = () => {
  // Step management: "email" | "otp" | "name"
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const context = useAppContext();
  const history = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const token = localStorage.getItem("accessToken");
    if (token) history("/");
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Step 1: Send OTP to email (works for both new and existing users)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      context.alertBox("error", "❌ Please enter a valid email address");
      triggerShake();
      return;
    }

    setIsLoading(true);
    context.setGlobalLoading(true);

    try {
      // Try existing user login OTP first
      const res = await postData("/api/user/send-login-otp", { email: email.trim() });

      if (res?.error === false) {
        // User exists and is active
        setIsNewUser(false);
        setStep("otp");
        context.alertBox("success", "✅ OTP sent to your email!");
      } else if (
        res?.message?.toLowerCase().includes("not found") ||
        res?.message?.toLowerCase().includes("not registered")
      ) {
        // New user - send registration OTP with temporary name
        const registerRes = await postData("/api/user/send-register-otp", {
          email: email.trim(),
          name: "User", // Temporary name, will be updated after OTP verification
        });

        if (registerRes?.error === false) {
          setIsNewUser(true);
          setStep("otp");
          context.alertBox("success", "✅ OTP sent to your email!");
        } else {
          context.alertBox("error", `❌ ${registerRes?.message || "Failed to send OTP"}`);
          triggerShake();
        }
      } else {
        context.alertBox("error", `❌ ${res?.message || "Failed to send OTP"}`);
        triggerShake();
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      context.alertBox("error", "❌ Network error. Please check your connection.");
      triggerShake();
    } finally {
      setIsLoading(false);
      context.setGlobalLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 4) {
      context.alertBox("error", "❌ Please enter valid OTP");
      triggerShake();
      return;
    }

    setIsLoading(true);
    context.setGlobalLoading(true);

    try {
      if (isNewUser) {
        // New user - just verify OTP is correct, then ask for name
        setStep("name");
        context.alertBox("success", "✅ OTP verified! Please enter your name");
        setIsLoading(false);
        context.setGlobalLoading(false);
      } else {
        // Existing user - login directly
        const res = await postData("/api/user/verify-login-otp", {
          email,
          otp: otp.trim(),
        }, { withCredentials: true });

        if (res?.error === false) {
          localStorage.setItem("accessToken", res?.data?.accesstoken);
          localStorage.setItem("refreshToken", res?.data?.refreshToken);
          localStorage.setItem("userEmail", email);
          context.setIsLogin(true);

          context.alertBox("success", "✅ Welcome back!");

          // Reset form
          setEmail("");
          setOtp("");
          setName("");
          setStep("email");

          setTimeout(() => {
            history("/");
          }, 800);
        } else {
          context.alertBox("error", `❌ ${res?.message || "Invalid OTP"}`);
          triggerShake();
        }
        setIsLoading(false);
        context.setGlobalLoading(false);
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      context.alertBox("error", "❌ Network error. Please check your connection.");
      triggerShake();
      setIsLoading(false);
      context.setGlobalLoading(false);
    }
  };

  // Step 3: Complete registration with name (for new users)
  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      context.alertBox("error", "❌ Please enter your name (minimum 2 characters)");
      triggerShake();
      return;
    }

    setIsLoading(true);
    context.setGlobalLoading(true);

    try {
      // Re-verify with actual name to complete registration
      const res = await postData("/api/user/verify-register-otp", {
        email,
        otp: otp.trim(),
        name: name.trim(),
      }, { withCredentials: true });

      if (res?.error === false) {
        localStorage.setItem("accessToken", res?.data?.accesstoken);
        localStorage.setItem("refreshToken", res?.data?.refreshToken);
        localStorage.setItem("userEmail", email);
        context.setIsLogin(true);

        context.alertBox("success", `🎉 Welcome ${name.trim()}!`);

        // Reset form
        setEmail("");
        setOtp("");
        setName("");
        setStep("email");

        setTimeout(() => {
          history("/");
        }, 800);
      } else {
        context.alertBox("error", `❌ ${res?.message || "Failed to complete registration"}`);
        triggerShake();
      }
    } catch (err) {
      console.error("Complete registration error:", err);
      context.alertBox("error", "❌ Network error. Please check your connection.");
      triggerShake();
    } finally {
      setIsLoading(false);
      context.setGlobalLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("email");
      setOtp("");
    } else if (step === "name") {
      setStep("otp");
      setName("");
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    context.setGlobalLoading(true);
    
    try {
      const endpoint = isNewUser ? "/api/user/send-register-otp" : "/api/user/send-login-otp";
      const payload = isNewUser
        ? { email: email.trim(), name: "User" }
        : { email: email.trim() };

      const res = await postData(endpoint, payload);
      if (res?.error === false) {
        context.alertBox("success", "✅ OTP resent to your email!");
      } else {
        context.alertBox("error", `❌ ${res?.message || "Failed to resend OTP"}`);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      context.alertBox("error", "❌ Network error. Please try again.");
    } finally {
      setIsLoading(false);
      context.setGlobalLoading(false);
    }
  };

  // Heading based on step
  const getHeaderContent = () => {
    switch (step) {
      case "email":
        return {
          title: "Welcome back",
          subtitle: "Enter your email to get started",
        };
      case "otp":
        return {
          title: "Verify OTP 🔐",
          subtitle: `We sent a code to ${email}`,
        };
      case "name":
        return {
          title: "Almost there! 👋",
          subtitle: "Please tell us your name",
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <>
      <style>{loginStyles}</style>
      <section className="login-section">
        {/* Decorative blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <div className="login-container">
          <div className={`login-card ${shake ? "shake" : ""}`}>
            {/* Header */}
            <div className="login-header">
              <div className="login-logo">
                <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
                  <rect width="40" height="40" rx="12" fill="url(#lg1)" />
                  <path d="M12 20 L20 12 L28 20 L20 28 Z" fill="white" opacity="0.9" />
                  <defs>
                    <linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40">
                      <stop stopColor="#FF6B00" />
                      <stop offset="1" stopColor="#FF9500" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h2 className="login-title">{headerContent.title}</h2>
              <p className="login-subtitle">{headerContent.subtitle}</p>
            </div>

            {/* EMAIL STEP */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="login-form" noValidate>
                <FloatingInput
                  label="Email address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <CircularProgress size={18} color="inherit" />
                      <span>Checking...</span>
                    </span>
                  ) : (
                    <span className="btn-content">
                      <span>Continue</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        className="w-4 h-4"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </button>

                <p className="login-footer-text">
                  Need help?{" "}
                  <Link to="/contact" className="auth-link">
                    Contact Support →
                  </Link>
                </p>
              </form>
            )}

            {/* OTP STEP */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="login-form" noValidate>
                <button
                  type="button"
                  className="back-btn"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="w-5 h-5"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <FloatingInput
                  label="Enter 6-digit OTP"
                  type="text"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading || !otp.trim()}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <CircularProgress size={18} color="inherit" />
                      <span>Verifying...</span>
                    </span>
                  ) : (
                    <span className="btn-content">
                      <span>Verify OTP</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        className="w-4 h-4"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </button>

                <p className="resend-text">
                  Didn't receive OTP?{" "}
                  <button
                    type="button"
                    className="resend-link"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Resend
                  </button>
                </p>
              </form>
            )}

            {/* NAME STEP */}
            {step === "name" && (
              <form onSubmit={handleNameSubmit} className="login-form" noValidate>
                <button
                  type="button"
                  className="back-btn"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="w-5 h-5"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <FloatingInput
                  label="Your full name"
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <CircularProgress size={18} color="inherit" />
                      <span>Completing...</span>
                    </span>
                  ) : (
                    <span className="btn-content">
                      <span>Complete Registration</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        className="w-4 h-4"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  .login-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafaf8;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow: hidden;
    padding: 2rem 1rem;
  }

  /* Decorative blobs */
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }
  .blob-1 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%);
    top: -100px; right: -100px;
    animation: blobFloat 8s ease-in-out infinite alternate;
  }
  .blob-2 {
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(255,149,0,0.1) 0%, transparent 70%);
    bottom: -80px; left: -80px;
    animation: blobFloat 10s ease-in-out infinite alternate-reverse;
  }
  @keyframes blobFloat {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(30px, 20px) scale(1.08); }
  }

  .login-container {
    width: 100%;
    max-width: 440px;
    position: relative;
    z-index: 1;
  }

  /* Card */
  .login-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 2.5rem 2.5rem 2rem;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.05),
      0 4px 6px rgba(0,0,0,0.04),
      0 20px 40px rgba(0,0,0,0.08),
      0 40px 80px rgba(255,107,0,0.06);
    animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Shake */
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-5px); }
    80%      { transform: translateX(5px); }
  }
  .shake { animation: shake 0.45s ease; }

  /* Header */
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  .login-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px; height: 56px;
    background: linear-gradient(135deg, #FF6B00, #FF9500);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(255,107,0,0.35);
    margin-bottom: 1rem;
    animation: logoBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both;
  }
  @keyframes logoBounce {
    from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  .login-title {
    font-size: 1.625rem;
    font-weight: 700;
    color: #0f0f0f;
    letter-spacing: -0.03em;
    margin: 0 0 0.25rem;
  }
  .login-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  /* Form */
  .login-form { display: flex; flex-direction: column; gap: 1rem; }

  /* Back button */
  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
    align-self: flex-start;
  }
  .back-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }
  .back-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Floating input */
  .login-input-wrap { position: relative; }
  .login-input-inner {
    position: relative;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    background: #fafafa;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    overflow: hidden;
  }
  .login-input-inner.focused {
    border-color: #FF6B00;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(255,107,0,0.12);
  }
  .login-input-inner.disabled { opacity: 0.6; pointer-events: none; }

  .login-float-label {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.9375rem;
    color: #9ca3af;
    pointer-events: none;
    transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
    background: transparent;
    padding: 0 2px;
    font-family: inherit;
  }
  .login-float-label.active {
    top: 10px;
    transform: translateY(0);
    font-size: 0.72rem;
    color: #FF6B00;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .login-input {
    width: 100%;
    padding: 24px 14px 8px;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.9375rem;
    color: #111827;
    font-family: inherit;
    font-weight: 500;
  }

  /* Resend OTP */
  .resend-text {
    text-align: center;
    font-size: 0.8375rem;
    color: #6b7280;
    margin: 0;
  }
  .resend-link {
    color: #FF6B00;
    font-weight: 700;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    text-decoration: underline;
    transition: opacity 0.15s;
  }
  .resend-link:hover:not(:disabled) { opacity: 0.75; }
  .resend-link:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Primary button */
  .btn-primary {
    width: 100%;
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, #FF6B00 0%, #FF9500 100%);
    color: #fff;
    font-family: inherit;
    font-size: 0.9375rem;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 14px rgba(255,107,0,0.4), 0 1px 3px rgba(255,107,0,0.2);
    margin-top: 0.25rem;
    letter-spacing: 0.01em;
  }
  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255,107,0,0.45), 0 2px 8px rgba(255,107,0,0.25);
  }
  .btn-primary:hover:not(:disabled)::before { opacity: 1; }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
  .btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  /* Footer text */
  .login-footer-text {
    text-align: center;
    font-size: 0.8375rem;
    color: #6b7280;
    margin: 0.25rem 0 0;
  }
  .auth-link {
    color: #FF6B00;
    font-weight: 700;
    text-decoration: none;
    transition: opacity 0.15s;
  }
  .auth-link:hover { opacity: 0.75; }

  @media (max-width: 480px) {
    .login-card { padding: 2rem 1.5rem 1.75rem; border-radius: 20px; }
  }
`;

export default Login;
