import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CgLogIn } from "react-icons/cg";
import {
  FaRegEye, FaEyeSlash, FaCheckCircle, FaUser, FaStore,
  FaUniversity, FaArrowRight, FaArrowLeft, FaShieldAlt,
  FaPhone, FaMapMarkerAlt, FaFileAlt, FaLock, FaEnvelope, FaImage, FaMotorcycle
} from "react-icons/fa";
import CircularProgress from "@mui/material/CircularProgress";
import { fetchDataFromApi, postData } from "../../utils/api.js";
import { MyContext } from "../../App.jsx";

// ─── Step Config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Personal",  icon: FaUser,      color: "#6ee7b7" },
  { id: 2, label: "Profile",   icon: FaStore,     color: "#93c5fd" },
  { id: 3, label: "Bank",      icon: FaUniversity,color: "#fbbf24" },
  { id: 4, label: "Review",    icon: FaShieldAlt, color: "#f9a8d4" },
];

const ROLE_OPTIONS = [
  { value: "SELLER", label: "Seller", tone: "#2874f0", description: "General marketplace seller with complete catalog controls." },
  { value: "GROCERY_SELLER", label: "Grocery Seller", tone: "#10b981", description: "Creates a grocery shop in your selected Go Market instantly." },
  { value: "RESTAURANT_SELLER", label: "Restaurant Seller", tone: "#f97316", description: "Creates a restaurant in your selected Go Market instantly." },
  { value: "DELIVERY_RIDER", label: "Delivery Rider", tone: "#8b5cf6", description: "Join as a delivery partner to pick up and deliver orders." },
];

const COMMON_FEATURES = ["All Products", "Add Product", "All Orders", "Manage Orders", "All Reviews", "Store Information", "Wallet Transactions", "More Features"];
const ROLE_FEATURES = {
  SELLER: COMMON_FEATURES,
  GROCERY_SELLER: ["Quick Commerce Dashboard", "Store Operations", "Inventory", "Live Orders", "Wallet"],
  RESTAURANT_SELLER: ["Quick Commerce Dashboard", "Kitchen Operations", "Menu Items", "Live Orders", "Wallet"],
  DELIVERY_RIDER: ["Delivery Dashboard", "Available Orders", "My Deliveries", "Earnings", "Route Navigation", "Performance Stats"],
};

const getRoleMeta = (role) => ROLE_OPTIONS.find((item) => item.value === role) || ROLE_OPTIONS[0];

// ─── Strength Meter ───────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : "rgba(0,0,0,0.08)",
            transition: "background 0.3s"
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[score], fontFamily: "'Space Mono', monospace" }}>
        {labels[score]}
      </span>
    </div>
  );
}

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({ label, icon: Icon, error, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.5)",
        marginBottom: 7, letterSpacing: "0.08em", textTransform: "uppercase",
        fontFamily: "'Space Mono', monospace"
      }}>
        {Icon && <Icon size={10} />} {label}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SellerSignUp = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [animDir, setAnimDir] = useState("forward");
  const formRef = useRef(null);

  const [formFields, setFormFields] = useState({
    name: "", email: "", mobile: "", password: "", confirmPassword: "", role: "SELLER",
    storeName: "", storeLocation: "", storeContact: "", storeDescription: "", shopBanner: "", marketId: "", drivingLicense: "",
    accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "",
    agreeTerms: false
  });

  const [markets, setMarkets] = useState([]);
  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    fetchDataFromApi("/api/logo").then((res) => {
      localStorage.setItem("logo", res?.logo?.[0]?.logo || "");
    });
    fetchDataFromApi("/api/go-market/markets?limit=100&status=active").then((res) => {
      setMarkets(res?.data || []);
    });
  }, []);

  const onChangeInput = (e) => {
    const { name, value, type, checked } = e.target;
     setFormFields(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const onBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!formFields.name.trim()) e.name = "Full name is required";
      else if (formFields.name.trim().length < 3) e.name = "Name must be at least 3 characters";
      if (!formFields.email.trim()) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formFields.email)) e.email = "Enter a valid email address";
      if (formFields.mobile && !/^\d{10}$/.test(formFields.mobile)) e.mobile = "Enter a valid 10-digit number";
      if (!formFields.password) e.password = "Password is required";
      else if (formFields.password.length < 8) e.password = "Minimum 8 characters required";
      if (!formFields.confirmPassword) e.confirmPassword = "Please confirm your password";
      else if (formFields.password !== formFields.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    if (s === 2) {
      if (!formFields.marketId) e.marketId = "Please select a Go Market";
      if (formFields.role !== "DELIVERY_RIDER") {
        if (!formFields.storeName.trim()) e.storeName = "Store name is required";
        if (!(formFields.storeContact || formFields.mobile)) e.storeContact = "Store contact or mobile number is required";
      }
    }
    if (s === 4) {
      if (!formFields.agreeTerms) e.agreeTerms = "You must agree to the terms";
    }
    return e;
  };

  const goNext = () => {
    const e = validate(step);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      const allTouched = {};
      Object.keys(e).forEach(k => (allTouched[k] = true));
      setTouched(allTouched);
      return;
    }
    setAnimDir("forward");
    setStep(s => s + 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setAnimDir("back");
    setStep(s => s - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e4 = validate(4);
    if (Object.keys(e4).length > 0) { setErrors(e4); return; }

    setIsLoading(true);
    try {
      const payload = {
        name: formFields.name,
        email: formFields.email,
        password: formFields.password,
        mobile: formFields.mobile,
        role: formFields.role,
        storeName: formFields.storeName,
        storeLocation: formFields.storeLocation,
        storeContact: formFields.storeContact || formFields.mobile,
        storeDescription: formFields.storeDescription,
        shopBanner: formFields.shopBanner,
        marketId: formFields.marketId,
        drivingLicense: formFields.drivingLicense,
        accountHolderName: formFields.accountHolderName,
        bankName: formFields.bankName,
        accountNumber: formFields.accountNumber,
        ifscCode: formFields.ifscCode,
      };
      const res = await postData("/api/user/register-seller", payload);
      if (res?.error !== true) {
        context.alertBox("success", res?.message || "Registered! Please verify your email OTP.");
        localStorage.setItem("userEmail", formFields.email);
        localStorage.setItem("actionType", "seller-signup");
        history("/verify-account");
      } else {
        context.alertBox("error", res?.message);
      }
    } catch {
      context.alertBox("error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Input Style ─────────────────────────────────────────────────────────────
  const inputStyle = (name) => ({
    width: "100%", height: 48,
    background: errors[name] && touched[name] ? "rgba(239,68,68,0.05)" : "#f9fafb",
    border: `1px solid ${errors[name] && touched[name] ? "rgba(239,68,68,0.5)" : "rgba(0,0,0,0.1)"}`,
    borderRadius: 10, padding: "0 14px",
    fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "#111827", outline: "none",
    boxSizing: "border-box", transition: "all 0.2s",
  });

  const textareaStyle = (name) => ({
    ...inputStyle(name), height: 90, padding: "12px 14px", resize: "vertical", lineHeight: 1.5
  });

  const selectStyle = (name) => ({
    ...inputStyle(name), appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23000000aa' strokeWidth='1.5' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 14px) center", paddingRight: 38,
    cursor: "pointer"
  });

  const selectedRole = getRoleMeta(formFields.role);
  const isRiderSignup = formFields.role === "DELIVERY_RIDER";

  // ─── Review row ──────────────────────────────────────────────────────────────
  const ReviewRow = ({ label, value }) => value ? (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", fontFamily: "'Space Mono', monospace" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{value}</span>
    </div>
  ) : null;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <section style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "'Outfit', sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(0,0,0,0.25); }
        input:focus, textarea:focus, select:focus { border-color: rgba(249,115,22,0.5) !important; background: rgba(249,115,22,0.03) !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.08); }
        select option { background: #ffffff; color: #111827; }
        .next-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(249,115,22,0.25) !important; }
        .back-btn:hover { background: rgba(0,0,0,0.06) !important; }
        .step-card { animation: slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes slideIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.35); border-radius: 2px; }
        .field-input-focus { border-color: rgba(110, 231, 183, 0.5) !important; }
      `}</style>

      {/* Ambient Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 20%, rgba(249,115,22,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(249,115,22,0.04) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.05) 0%, transparent 60%)" }} />
      </div>

      {/* Header */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)"
      }}>
        <Link to="/">
          <img src={localStorage.getItem("logo") || "/icon.svg"} alt="Logo" style={{ height: 32, objectFit: "contain" }} />
        </Link>
        <NavLink to="/login" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
          borderRadius: 100, fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.55)",
          textDecoration: "none", border: "1px solid rgba(0,0,0,0.12)", transition: "all 0.2s"
        }}>
          <CgLogIn size={15} /> Sign In
        </NavLink>
      </header>

      {/* Main */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: 580, margin: "0 auto", padding: "100px 20px 60px" }}>

        {/* Hero text */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px",
            background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
            borderRadius: 100, fontSize: 12, color: "#f97316", fontFamily: "'Space Mono', monospace",
            marginBottom: 16
          }}>
            <FaStore size={10} /> SELLER REGISTRATION
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Start Selling Today
          </h1>
          <p style={{ fontSize: 14, color: "rgba(0,0,0,0.45)", margin: 0 }}>
            Join thousands of sellers. Set up your store in minutes.
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 28 }}>
          {/* Steps */}
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: 16 }}>
            {/* Connector line */}
            <div style={{ position: "absolute", top: 19, left: "8%", right: "8%", height: 1, background: "rgba(0,0,0,0.08)", zIndex: 0 }} />
            <div style={{ position: "absolute", top: 19, left: "8%", height: 1, zIndex: 1, background: "linear-gradient(90deg, #f97316, #fb923c)", transition: "width 0.5s ease", width: `${((step - 1) / 3) * 84}%` }} />

            {STEPS.map(s => (
              <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2, background: "transparent" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: step > s.id ? "#10b981" : step === s.id ? s.color : "rgba(0,0,0,0.05)",
                  border: `2px solid ${step >= s.id ? (step > s.id ? "#10b981" : s.color) : "rgba(0,0,0,0.12)"}`,
                  transition: "all 0.4s", fontSize: 14, color: step >= s.id ? "#000" : "rgba(0,0,0,0.3)",
                  boxShadow: step === s.id ? `0 0 20px ${s.color}60` : "none"
                }}>
                  {step > s.id ? <FaCheckCircle size={14} /> : <s.icon size={14} />}
                </div>
                <span style={{
                  fontSize: 11, fontFamily: "'Space Mono', monospace",
                  color: step === s.id ? s.color : "rgba(0,0,0,0.4)",
                  fontWeight: step === s.id ? 700 : 400, transition: "color 0.3s"
                }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", fontFamily: "'Space Mono', monospace" }}>
              Step {step} of {STEPS.length}
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {STEPS.map(s => (
                <div key={s.id} style={{
                  width: step === s.id ? 20 : 6, height: 4, borderRadius: 2,
                  background: step > s.id ? "#10b981" : step === s.id ? STEPS[step-1].color : "rgba(0,0,0,0.1)",
                  transition: "all 0.4s"
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="step-card" key={step} style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 20, padding: "32px 32px 28px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)"
        }}>

          {/* Step Header */}
          <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `${STEPS[step-1].color}15`,
                border: `1px solid ${STEPS[step-1].color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: STEPS[step-1].color
              }}>
                {React.createElement(STEPS[step-1].icon, { size: 18 })}
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>
                  {step === 1 ? "Personal Information" : step === 2 ? (isRiderSignup ? "Delivery Rider Details" : "Store Details") : step === 3 ? "Bank Details" : "Review & Submit"}
                </h2>
                <p style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", margin: 0 }}>
                  {step === 1 ? "Your account credentials & contact info"
                  : step === 2 ? (isRiderSignup ? "Choose your service market and optional licence" : "Tell customers about your store")
                  : step === 3 ? "For receiving payouts (optional)"
                  : "Verify all details before submitting"}
                </p>
              </div>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit}>

            {/* ── STEP 1: PERSONAL ─────────────────────────────────────── */}
            {step === 1 && (
              <>
                 <Field label="Account Role" icon={FaShieldAlt} error={touched.role && errors.role} hint={selectedRole.description}>
                  <select name="role" value={formFields.role}
                    onChange={onChangeInput} onBlur={onBlur} style={selectStyle("role")}>
                    {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </Field>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "-4px 0 18px" }}>
                  {(ROLE_FEATURES[formFields.role] || COMMON_FEATURES).map(feature => (
                    <span key={feature} style={{
                      fontSize: 11, fontWeight: 700, color: selectedRole.tone,
                      background: `${selectedRole.tone}12`, border: `1px solid ${selectedRole.tone}25`,
                      borderRadius: 999, padding: "5px 9px", fontFamily: "'Space Mono', monospace"
                    }}>{feature}</span>
                  ))}
                </div>
                <Field label="Full Name" icon={FaUser} error={touched.name && errors.name}>
                  <input type="text" name="name" placeholder="John Doe" value={formFields.name}
                    onChange={onChangeInput} onBlur={onBlur} style={inputStyle("name")} />
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Email Address" icon={FaEnvelope} error={touched.email && errors.email}>
                    <input type="email" name="email" placeholder="you@example.com" value={formFields.email}
                      onChange={onChangeInput} onBlur={onBlur} style={inputStyle("email")} />
                  </Field>
                  <Field label="Mobile Number" icon={FaPhone} error={touched.mobile && errors.mobile} hint="10-digit number">
                    <input type="tel" name="mobile" placeholder="9876543210" value={formFields.mobile}
                      onChange={onChangeInput} onBlur={onBlur} style={inputStyle("mobile")} />
                  </Field>
                </div>

                <Field label="Password" icon={FaLock} error={touched.password && errors.password}>
                  <div style={{ position: "relative" }}>
                    <input type={showPass ? "text" : "password"} name="password"
                      placeholder="Min. 8 characters" value={formFields.password}
                      onChange={onChangeInput} onBlur={onBlur} style={{ ...inputStyle("password"), paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                      position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)",
                      background: "none", border: "none", color: "rgba(0,0,0,0.35)", cursor: "pointer"
                    }}>
                      {showPass ? <FaEyeSlash size={15} /> : <FaRegEye size={15} />}
                    </button>
                  </div>
                  <PasswordStrength password={formFields.password} />
                </Field>

                <Field label="Confirm Password" icon={FaLock} error={touched.confirmPassword && errors.confirmPassword}>
                  <div style={{ position: "relative" }}>
                    <input type={showConfirmPass ? "text" : "password"} name="confirmPassword"
                      placeholder="Re-enter password" value={formFields.confirmPassword}
                      onChange={onChangeInput} onBlur={onBlur} style={{ ...inputStyle("confirmPassword"), paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{
                      position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)",
                      background: "none", border: "none", color: "rgba(0,0,0,0.35)", cursor: "pointer"
                    }}>
                      {showConfirmPass ? <FaEyeSlash size={15} /> : <FaRegEye size={15} />}
                    </button>
                  </div>
                </Field>
              </>
            )}

            {/* ── STEP 2: STORE ─────────────────────────────────────────── */}
            {step === 2 && (
              <>
                {!isRiderSignup && (
                  <Field label="Store Name" icon={FaStore} error={touched.storeName && errors.storeName}>
                    <input type="text" name="storeName" placeholder="My Awesome Store" value={formFields.storeName}
                      onChange={onChangeInput} onBlur={onBlur} style={inputStyle("storeName")} />
                  </Field>
                )}

                <Field label={isRiderSignup ? "Delivery Market" : "Go Market"} icon={FaMapMarkerAlt} error={touched.marketId && errors.marketId} hint={isRiderSignup ? "Only orders from this selected market will be assigned to you." : "Your shop will be created inside this market instantly."}>
                  <select name="marketId" value={formFields.marketId}
                    onChange={onChangeInput} onBlur={onBlur} style={selectStyle("marketId")}>
                    <option value="">Select market…</option>
                    {markets.map((market) => (
                      <option key={market._id} value={market._id}>
                        {market.name} — {market.city}, {market.state}
                      </option>
                    ))}
                  </select>
                </Field>

                {isRiderSignup ? (
                  <Field label="Driving Licence (Optional)" icon={FaMotorcycle} hint="You can add or update licence details later from your profile.">
                    <input type="text" name="drivingLicense" placeholder="DL number (optional)" value={formFields.drivingLicense}
                      onChange={onChangeInput} onBlur={onBlur} style={inputStyle("drivingLicense")} />
                  </Field>
                
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Field label="Store Contact" icon={FaPhone} error={touched.storeContact && errors.storeContact}>
                        <input type="tel" name="storeContact" placeholder="Business Phone" value={formFields.storeContact}
                          onChange={onChangeInput} onBlur={onBlur} style={inputStyle("storeContact")} />
                      </Field>
                      <Field label="City / Location" icon={FaMapMarkerAlt}>
                        <input type="text" name="storeLocation" placeholder="e.g. Mumbai" value={formFields.storeLocation}
                          onChange={onChangeInput} onBlur={onBlur} style={inputStyle("storeLocation")} />
                      </Field>
                    </div>

                <Field label="Store Description" icon={FaFileAlt} hint="What do you sell? (optional)">
                      <textarea name="storeDescription" placeholder="Describe your store and what you sell..."
                        value={formFields.storeDescription} onChange={onChangeInput} onBlur={onBlur}
                        style={textareaStyle("storeDescription")} />
                    </Field>
                    <Field label="Shop Banner URL" icon={FaImage} error={touched.shopBanner && errors.shopBanner} hint="Paste a wide banner image URL that will appear on your shop page.">
                      <input type="url" name="shopBanner" placeholder="https://example.com/banner.jpg" value={formFields.shopBanner}
                        onChange={onChangeInput} onBlur={onBlur} style={inputStyle("shopBanner")} />
                    </Field>
                  </>
                )}
              </>
            )}

            {/* ── STEP 3: BANK ──────────────────────────────────────────── */}
            {step === 3 && (
              <>
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                  background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                  borderRadius: 10, marginBottom: 22
                }}>
                  <FaShieldAlt size={14} color="#fbbf24" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", margin: 0, lineHeight: 1.5 }}>
                    Bank details are encrypted and used only for payment processing. All fields are optional at this stage.
                  </p>
                </div>

                <Field label="Account Holder Name" icon={FaUser}>
                  <input type="text" name="accountHolderName" placeholder="As per bank records"
                    value={formFields.accountHolderName} onChange={onChangeInput} style={inputStyle("accountHolderName")} />
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Bank Name" icon={FaUniversity}>
                    <input type="text" name="bankName" placeholder="e.g. HDFC Bank"
                      value={formFields.bankName} onChange={onChangeInput} style={inputStyle("bankName")} />
                  </Field>
                  <Field label="IFSC / Routing Code" icon={FaFileAlt}>
                    <input type="text" name="ifscCode" placeholder="HDFC0001234"
                      value={formFields.ifscCode} onChange={onChangeInput} style={inputStyle("ifscCode")} />
                  </Field>
                </div>

                <Field label="Account Number" icon={FaLock}>
                  <input type="text" name="accountNumber" placeholder="XXXX-XXXX-XXXX"
                    value={formFields.accountNumber} onChange={onChangeInput} style={inputStyle("accountNumber")} />
                </Field>
              </>
            )}

            {/* ── STEP 4: REVIEW ────────────────────────────────────────── */}
            {step === 4 && (
              <>
                {/* Personal */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <FaUser size={12} color="#6ee7b7" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em" }}>PERSONAL</span>
                  </div>
                  <div style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: "0 14px" }}>
                    <ReviewRow label="Role" value={selectedRole.label} />
                    <ReviewRow label="Name" value={formFields.name} />
                    <ReviewRow label="Email" value={formFields.email} />
                    <ReviewRow label="Mobile" value={formFields.mobile || "—"} />
                  </div>
                </div>

                {/* Store */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <FaStore size={12} color="#93c5fd" />
                     <span style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em" }}>{isRiderSignup ? "DELIVERY" : "STORE"}</span>
                  </div>
                  <div style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: "0 14px" }}>
                     {!isRiderSignup && <ReviewRow label="Store Name" value={formFields.storeName} />}
                    {!isRiderSignup && <ReviewRow label="Shop Banner" value={formFields.shopBanner || "—"} />}
                    <ReviewRow label="Market" value={markets.find((market) => market._id === formFields.marketId)?.name || "—"} />
                    {isRiderSignup && <ReviewRow label="Driving Licence" value={formFields.drivingLicense || "Optional / not added"} />}
                    {!isRiderSignup && <ReviewRow label="Location" value={formFields.storeLocation || "—"} />}
                    {!isRiderSignup && <ReviewRow label="Contact" value={formFields.storeContact || "—"} />}
                    <ReviewRow label="Enabled Features" value={(ROLE_FEATURES[formFields.role] || COMMON_FEATURES).join(", ")} />
                    {!isRiderSignup && formFields.storeDescription && <ReviewRow label="Description" value={formFields.storeDescription} />}
                  </div>
                </div>

                {/* Bank */}
                {(formFields.bankName || formFields.accountNumber) && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <FaUniversity size={12} color="#fbbf24" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em" }}>BANK</span>
                    </div>
                    <div style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: "0 14px" }}>
                      <ReviewRow label="Bank" value={formFields.bankName} />
                      <ReviewRow label="Account No." value={formFields.accountNumber ? `****${formFields.accountNumber.slice(-4)}` : "—"} />
                      <ReviewRow label="IFSC" value={formFields.ifscCode || "—"} />
                    </div>
                  </div>
                )}

                {/* Terms */}
                <label style={{ display: "flex", gap: 12, cursor: "pointer", padding: "14px", background: "rgba(110,231,183,0.04)", border: `1px solid ${errors.agreeTerms ? "rgba(239,68,68,0.4)" : "rgba(110,231,183,0.15)"}`, borderRadius: 10, marginTop: 12 }}>
                  <input type="checkbox" name="agreeTerms" checked={formFields.agreeTerms} onChange={onChangeInput}
                    style={{ marginTop: 3, accentColor: "#6ee7b7", width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>
                    I agree to the{" "}
                    <Link to="/terms" style={{ color: "#f97316", textDecoration: "none" }}>Terms of Service</Link>{" "}
                    and{" "}
                    <Link to="/privacy" style={{ color: "#f97316", textDecoration: "none" }}>Privacy Policy</Link>.
                  </span>
                </label>
                {errors.agreeTerms && <p style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>{errors.agreeTerms}</p>}
              </>
            )}

            {/* ── Navigation Buttons ───────────────────────────────────── */}
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              {step > 1 && (
                <button type="button" className="back-btn" onClick={goPrev} style={{
                  flex: "0 0 auto", height: 50, padding: "0 20px",
                  background: "#f3f4f6", border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 12, color: "rgba(0,0,0,0.6)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500,
                  transition: "background 0.2s", fontFamily: "'Outfit', sans-serif"
                }}>
                  <FaArrowLeft size={12} /> Back
                </button>
              )}

              {step < 4 ? (
                <button type="button" className="next-btn" onClick={goNext} style={{
                  flex: 1, height: 50,
                  background: `linear-gradient(135deg, ${STEPS[step-1].color} 0%, ${STEPS[step].color} 100%)`,
                  border: "none", borderRadius: 12, color: "#000",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s", fontFamily: "'Outfit', sans-serif"
                }}>
                  {step === 1 ? (isRiderSignup ? "Continue to Rider Details" : "Continue to Store Details") : step === 2 ? "Continue to Bank Details" : "Review & Submit"}
                  <FaArrowRight size={12} />
                </button>
              ) : (
                <button type="submit" disabled={isLoading} style={{
                  flex: 1, height: 50,
                  background: isLoading ? "rgba(110,231,183,0.3)" : "linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)",
                  border: "none", borderRadius: 12, color: "#000",
                  fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s", fontFamily: "'Outfit', sans-serif"
                }}>
                  {isLoading ? <CircularProgress size={20} sx={{ color: "#000" }} /> : (
                    <><FaCheckCircle size={14} /> Complete Registration</>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(0,0,0,0.4)", marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Sign In</Link>
        </p>
      </main>
    </section>
  );
};

export default SellerSignUp;