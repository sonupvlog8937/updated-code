import { Button } from "@mui/material";
import React, { useState, useEffect, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import LoadingButton from "@mui/lab/LoadingButton";
import { FcGoogle } from "react-icons/fc";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { FaRegEye, FaEyeSlash } from "react-icons/fa";
import { MdOutlineEmail, MdLockOutline } from "react-icons/md";
import { HiArrowRight } from "react-icons/hi";
import { fetchDataFromApi, postData } from "../../utils/api";
import { MyContext } from "../../App.jsx";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

/* ─── tiny keyframe injector ─── */
const injectStyles = () => {
  if (document.getElementById("login-styles")) return;
  const el = document.createElement("style");
  el.id = "login-styles";
  el.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    .login-root * { box-sizing: border-box; margin: 0; padding: 0; }

    .login-root {
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      background: #0c0e13;
    }

    /* ── LEFT PANEL ── */
    .lp-left {
      width: 42%;
      min-height: 100vh;
      background: linear-gradient(145deg, #0f1117 0%, #1a1f2e 60%, #111827 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 44px 48px;
      position: relative;
      overflow: hidden;
    }
    @media (max-width: 900px) { .lp-left { display: none; } }

    .lp-left::before {
      content: '';
      position: absolute;
      top: -120px; right: -120px;
      width: 420px; height: 420px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
      pointer-events: none;
    }
    .lp-left::after {
      content: '';
      position: absolute;
      bottom: -80px; left: -80px;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    /* grid lines decoration */
    .lp-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
    }

    .lp-logo {
      position: relative; z-index: 2;
    }
    .lp-logo img { height: 36px; object-fit: contain; }

    .lp-center { position: relative; z-index: 2; }

    .lp-headline {
      font-family: 'Syne', sans-serif;
      font-size: 42px;
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
      letter-spacing: -1px;
      margin-bottom: 20px;
    }
    .lp-headline span {
      background: linear-gradient(90deg, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .lp-sub {
      font-size: 15px;
      color: rgba(255,255,255,0.45);
      line-height: 1.7;
      max-width: 300px;
      margin-bottom: 36px;
    }

    /* stats pills */
    .lp-stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .lp-stat-pill {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 40px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(8px);
    }
    .lp-stat-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 6px #4ade80;
      animation: livePulse 1.8s ease-in-out infinite;
    }
    @keyframes livePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }
    .lp-stat-text { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.65); }
    .lp-stat-val { font-size: 12px; font-weight: 700; color: #fff; }

    /* testimonial card */
    .lp-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 20px 22px;
      backdrop-filter: blur(12px);
      position: relative; z-index: 2;
    }
    .lp-card-quote {
      font-size: 13px;
      color: rgba(255,255,255,0.65);
      line-height: 1.7;
      margin-bottom: 14px;
      font-style: italic;
    }
    .lp-card-author {
      display: flex; align-items: center; gap: 10px;
    }
    .lp-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .lp-author-name { font-size: 13px; font-weight: 700; color: #fff; }
    .lp-author-role { font-size: 11px; color: rgba(255,255,255,0.4); }

    /* ── RIGHT PANEL ── */
    .lp-right {
      flex: 1;
      min-height: 100vh;
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
      position: relative;
    }

    .lp-right-inner {
      width: 100%;
      max-width: 400px;
      animation: fadeUp 0.5s ease both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* mobile logo */
    .lp-mobile-logo {
      display: none;
      margin-bottom: 28px;
    }
    @media (max-width: 900px) {
      .lp-mobile-logo { display: flex; justify-content: center; }
    }

    .lp-welcome { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .lp-welcome-sub { font-size: 14px; color: #64748b; margin-bottom: 32px; }

    /* google btn */
    .google-btn {
      width: 100%;
      height: 48px;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      cursor: pointer;
      transition: all 0.18s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .google-btn:hover { border-color: #cbd5e1; background: #f8fafc; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.08); }
    .google-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .divider {
      display: flex; align-items: center; gap: 12px;
      margin: 22px 0;
      color: #94a3b8; font-size: 12px; font-weight: 500;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; height: 1px; background: #e2e8f0;
    }

    /* input group */
    .inp-group { margin-bottom: 18px; }
    .inp-label { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 6px; letter-spacing: 0.04em; text-transform: uppercase; }

    .inp-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .inp-icon {
      position: absolute;
      left: 14px;
      color: #94a3b8;
      font-size: 17px;
      pointer-events: none;
      transition: color 0.2s;
    }
    .inp-field {
      width: 100%;
      height: 50px;
      padding: 0 44px;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      color: #0f172a;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .inp-field:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .inp-field:focus + .inp-focus-border { opacity: 1; }
    .inp-field::placeholder { color: #cbd5e1; }
    .inp-field:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

    .inp-wrap:focus-within .inp-icon { color: #6366f1; }

    .inp-eye {
      position: absolute; right: 12px;
      background: none; border: none; cursor: pointer;
      color: #94a3b8; font-size: 16px;
      padding: 6px; border-radius: 6px;
      transition: color 0.2s, background 0.2s;
      display: flex; align-items: center;
    }
    .inp-eye:hover { color: #6366f1; background: rgba(99,102,241,0.08); }

    /* submit btn */
    .submit-btn {
      width: 100%;
      height: 50px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(99,102,241,0.35);
      letter-spacing: 0.01em;
      margin-top: 6px;
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.45); }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

    /* spinner */
    .spin {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* row */
    .row-between { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }

    .forgot-link {
      font-size: 13px; font-weight: 700; color: #6366f1;
      text-decoration: none;
      transition: color 0.15s;
      background: none; border: none; cursor: pointer;
      font-family: 'DM Sans', sans-serif;
    }
    .forgot-link:hover { color: #4f46e5; text-decoration: underline; }

    .signup-row {
      text-align: center; margin-top: 24px;
      font-size: 13px; color: #64748b;
    }
    .signup-row a { color: #6366f1; font-weight: 700; text-decoration: none; }
    .signup-row a:hover { text-decoration: underline; }

    /* security badge */
    .security-badge {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin-top: 28px;
      font-size: 11px; color: #94a3b8; font-weight: 500;
    }
    .security-badge svg { color: #4ade80; }

    /* checkbox tweak */
    .MuiFormControlLabel-label { font-size: 13px !important; color: #64748b !important; font-family: 'DM Sans', sans-serif !important; }
  `;
  document.head.appendChild(el);
};

const Login = () => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordShow, setisPasswordShow] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formFields, setFormsFields] = useState({ email: "", password: "" });
  const [inputFocus, setInputFocus] = useState(null);

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    injectStyles();
    fetchDataFromApi("/api/logo").then((res) => {
      localStorage.setItem("logo", res?.logo?.[0]?.logo);
    });
  }, []);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormsFields((p) => ({ ...p, [name]: value }));
  };

  const valideValue = formFields.email !== "" && formFields.password !== "";

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
        history("/verify-account");
      } else {
        context.alertBox("error", res?.message);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formFields.email) { context.alertBox("error", "Please enter email id"); return; }
    if (!formFields.password) { context.alertBox("error", "Please enter password"); return; }

    setIsLoading(true);
    postData("/api/user/login", formFields, { withCredentials: true }).then((res) => {
      if (res?.error !== true) {
        setIsLoading(false);
        context.alertBox("success", res?.message);
        localStorage.setItem("accessToken", res?.data?.accesstoken);
        localStorage.setItem("refreshToken", res?.data?.refreshToken);
        setFormsFields({ email: "", password: "" });
        context.setIsLogin(true);
        history("/");
      } else {
        context.alertBox("error", res?.message);
        setIsLoading(false);
      }
    });
  };

  const authWithGoogle = () => {
    setLoadingGoogle(true);
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
            setLoadingGoogle(false);
            context.alertBox("success", res?.message);
            localStorage.setItem("userEmail", fields.email);
            localStorage.setItem("accessToken", res?.data?.accesstoken);
            localStorage.setItem("refreshToken", res?.data?.refreshToken);
            context.setIsLogin(true);
            history("/");
          } else {
            context.alertBox("error", res?.message);
            setLoadingGoogle(false);
          }
        });
      })
      .catch(() => { setLoadingGoogle(false); });
  };

  const logo = localStorage.getItem("logo");

  return (
    <div className="login-root">

      {/* ══════ LEFT PANEL ══════ */}
      <div className="lp-left">
        <div className="lp-grid" />

        {/* Logo */}
        <div className="lp-logo">
          {logo
            ? <img src={logo} alt="Logo" />
            : <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Dashboard</div>
          }
        </div>

        {/* Center copy */}
        <div className="lp-center">
          <h1 className="lp-headline">
            Manage your<br />
            store <span>smarter.</span>
          </h1>
          <p className="lp-sub">
            Your all-in-one admin dashboard for products, orders, analytics, and seller management.
          </p>

          {/* Live stats */}
          <div className="lp-stats">
            {[
              { label: "Live Orders", val: "247" },
              { label: "Sellers", val: "1.2K" },
              { label: "Uptime", val: "99.9%" },
            ].map((s) => (
              <div className="lp-stat-pill" key={s.label}>
                <div className="lp-stat-dot" />
                <span className="lp-stat-text">{s.label}</span>
                <span className="lp-stat-val">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="lp-card">
          <p className="lp-card-quote">
            "This dashboard transformed how we manage our store. Everything is in one place and the UI is incredibly intuitive."
          </p>
          <div className="lp-card-author">
            <div className="lp-avatar">ZD</div>
            <div>
              <div className="lp-author-name">Zeedaddy</div>
              <div className="lp-author-role">Store Owner, Online Shopping App</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ RIGHT PANEL ══════ */}
      <div className="lp-right">
        <div className="lp-right-inner">

          {/* Mobile logo */}
          <div className="lp-mobile-logo">
            {logo && <img src={logo} alt="Logo" style={{ height: 32 }} />}
          </div>

          <h1 className="lp-welcome">Welcome back 👋</h1>
          <p className="lp-welcome-sub">Sign in to your admin account to continue.</p>

          {/* Google */}
          {/* <button
            className="google-btn"
            onClick={authWithGoogle}
            disabled={loadingGoogle || isLoading}
            type="button"
          >
            {loadingGoogle
              ? <div className="spin" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#6366f1' }} />
              : <FcGoogle size={20} />
            }
            {loadingGoogle ? "Connecting to Google…" : "Continue with Google"}
          </button>

          <div className="divider">or sign in with email</div> */}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="inp-group">
              <label className="inp-label">Email Address</label>
              <div className="inp-wrap">
                <MdOutlineEmail className="inp-icon" />
                <input
                  className="inp-field"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formFields.email}
                  onChange={onChangeInput}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="inp-group">
              <label className="inp-label">Password</label>
              <div className="inp-wrap">
                <MdLockOutline className="inp-icon" />
                <input
                  className="inp-field"
                  type={isPasswordShow ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formFields.password}
                  onChange={onChangeInput}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="inp-eye"
                  onClick={() => setisPasswordShow((p) => !p)}
                  tabIndex={-1}
                >
                  {isPasswordShow ? <FaEyeSlash /> : <FaRegEye />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="row-between">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#6366f1' }, padding: '4px 8px' }}
                  />
                }
                label="Remember me"
              />
              <button type="button" className="forgot-link" onClick={forgotPassword}>
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={!valideValue || isLoading || loadingGoogle}
            >
              {isLoading
                ? <><div className="spin" />Signing in…</>
                : <>Sign In <HiArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Sign up link */}
          <div className="signup-row">
            Don't have an account?{" "}
            <Link to="/sign-up">Create one →</Link>
          </div>

          {/* Security note */}
          <div className="security-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secured with 256-bit SSL encryption
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;