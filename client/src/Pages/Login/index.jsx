import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ─── Eye Icon SVG ─────────────────────────────────────────────────────────────
const EyeIcon = ({ open }) =>
  open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

// ─── Google SVG ───────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

// ─── Floating Label Input ─────────────────────────────────────────────────────
const FloatingInput = ({ label, type, name, value, onChange, disabled, rightSlot }) => {
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
          autoComplete={name === "password" ? "current-password" : "email"}
        />
        {rightSlot && <div className="login-input-right">{rightSlot}</div>}
      </div>
    </div>
  );
};

// ─── Strength Meter (for visual polish on password) ───────────────────────────
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];
  return (
    <div className="pw-strength">
      <div className="pw-bars">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="pw-bar" style={{ background: i <= score ? colors[score] : "#e5e7eb" }} />
        ))}
      </div>
      <span className="pw-label" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  );
};

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordShow, setIsPasswordShow] = useState(false);
  const [formFields, setFormFields] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [shake, setShake] = useState(false);

  const context = useAppContext();
  const history = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const token = localStorage.getItem("accessToken");
    if (token) history("/");

    // Pre-fill remembered email
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) setFormFields((p) => ({ ...p, email: saved }));
  }, []);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const forgotPassword = () => {
    if (!formFields.email) {
      context.alertBox("error", "Please enter your email first");
      return;
    }
    localStorage.setItem("userEmail", formFields.email);
    localStorage.setItem("actionType", "forgot-password");
    postData("/api/user/forgot-password", { email: formFields.email }).then((res) => {
      if (res?.error === false) {
        context.alertBox("success", res?.message);
        history("/verify");
      } else {
        context.alertBox("error", res?.message);
      }
    });
  };

  const valideValue = Object.values(formFields).every((el) => el);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formFields.email) { context.alertBox("error", "Please enter email"); triggerShake(); return; }
    if (!formFields.password) { context.alertBox("error", "Please enter password"); triggerShake(); return; }

    setIsLoading(true);
    context.setGlobalLoading(true);

    postData("/api/user/login", formFields, { withCredentials: true }).then((res) => {
      if (res?.error !== true) {
        if (rememberMe) localStorage.setItem("rememberedEmail", formFields.email);
        else localStorage.removeItem("rememberedEmail");

        localStorage.setItem("accessToken", res?.data?.accesstoken);
        localStorage.setItem("refreshToken", res?.data?.refreshToken);
        context.setIsLogin(true);
        context.alertBox("success", res?.message);
        setFormFields({ email: "", password: "" });
        history("/");
      } else {
        context.alertBox("error", res?.message);
        triggerShake();
      }
      setIsLoading(false);
      context.setGlobalLoading(false);
    });
  };

  const authWithGoogle = () => {
    setIsLoading(true);
    context.setGlobalLoading(true);
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        const user = result.user;
        const fields = {
          name: user.providerData[0].displayName,
          email: user.providerData[0].email,
          password: null,
          avatar: user.providerData[0].photoURL,
          mobile: user.providerData[0].phoneNumber,
          role: "USER",
        };
        postData("/api/user/authWithGoogle", fields).then((res) => {
          if (res?.error !== true) {
            localStorage.setItem("userEmail", fields.email);
            localStorage.setItem("accessToken", res?.data?.accesstoken);
            localStorage.setItem("refreshToken", res?.data?.refreshToken);
            context.setIsLogin(true);
            context.alertBox("success", res?.message);
            history("/");
          } else {
            context.alertBox("error", res?.message);
          }
          setIsLoading(false);
          context.setGlobalLoading(false);
        });
      })
      .catch(() => { setIsLoading(false); context.setGlobalLoading(false); });
  };

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
              <h2 className="login-title">Welcome back</h2>
              <p className="login-subtitle">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Email */}
              <FloatingInput
                label="Email address"
                type="email"
                name="email"
                value={formFields.email}
                onChange={onChangeInput}
                disabled={isLoading}
              />

              {/* Password */}
              <FloatingInput
                label="Password"
                type={isPasswordShow ? "text" : "password"}
                name="password"
                value={formFields.password}
                onChange={onChangeInput}
                disabled={isLoading}
                rightSlot={
                  <button type="button" className="eye-btn" onClick={() => setIsPasswordShow(!isPasswordShow)}>
                    <EyeIcon open={isPasswordShow} />
                  </button>
                }
              />
              

              {/* Remember + Forgot */}
              <div className="login-meta">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="remember-checkbox"
                  />
                  <span className="remember-custom" />
                  <span className="remember-text">Remember me</span>
                </label>
                <button type="button" className="forgot-btn" onClick={forgotPassword}>
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button type="submit" disabled={!valideValue || isLoading} className="btn-primary">
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <CircularProgress size={18} color="inherit" />
                    <span>Signing in…</span>
                  </span>
                ) : (
                  <span className="btn-content">
                    <span>Sign In</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Divider */}
              {/* <div className="divider">
                <span className="divider-line" />
                <span className="divider-text">or continue with</span>
                <span className="divider-line" />
              </div> */}

              {/* Google */}
              {/* <button type="button" className="btn-google" onClick={authWithGoogle} disabled={isLoading}>
                <GoogleIcon />
                <span>Continue with Google</span>
              </button> */}

              {/* Register link */}
              <p className="login-footer-text">
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Create one free →
                </Link>
              </p>
            </form>
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
  .login-input-right {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  .eye-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
  }
  .eye-btn:hover { color: #FF6B00; background: rgba(255,107,0,0.08); }

  /* Remember + Forgot */
  .login-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -0.25rem 0;
  }
  .remember-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }
  .remember-checkbox { display: none; }
  .remember-custom {
    width: 18px; height: 18px;
    border: 1.5px solid #d1d5db;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .remember-checkbox:checked + .remember-custom {
    background: linear-gradient(135deg, #FF6B00, #FF9500);
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(255,107,0,0.3);
  }
  .remember-checkbox:checked + .remember-custom::after {
    content: '';
    display: block;
    width: 5px; height: 9px;
    border: 2px solid #fff;
    border-top: none;
    border-left: none;
    transform: rotate(45deg) translateY(-1px);
  }
  .remember-text { font-size: 0.8125rem; color: #6b7280; font-weight: 500; }
  .forgot-btn {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #FF6B00;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: color 0.15s, opacity 0.15s;
  }
  .forgot-btn:hover { opacity: 0.75; }

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

  /* Ripple effect */
  .btn-primary::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.4s;
    transform: scale(0);
  }
  .btn-primary:active::after { opacity: 1; transform: scale(2); transition: none; }

  /* Divider */
  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0.5rem 0 0;
  }
  .divider-line { flex: 1; height: 1px; background: #e5e7eb; }
  .divider-text { font-size: 0.75rem; color: #9ca3af; font-weight: 500; white-space: nowrap; }

  /* Google button */
  .btn-google {
    width: 100%;
    padding: 0.8125rem 1.5rem;
    background: #fff;
    color: #374151;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.18s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .btn-google:hover:not(:disabled) {
    border-color: #d1d5db;
    background: #f9fafb;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }
  .btn-google:active:not(:disabled) { transform: translateY(0); }
  .btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

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