import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";
import { MdMarkEmailRead } from "react-icons/md";

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ─── Shared Icons ─────────────────────────────────────────────────────────────
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
    <div className="reg-input-inner" style={{ borderColor: focused ? '#FF6B00' : undefined, boxShadow: focused ? '0 0 0 3px rgba(255,107,0,0.12)' : undefined, background: focused ? '#fff' : undefined }}>
      <label className={`reg-float-label${active ? ' active' : ''}`}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="reg-input"
        autoComplete={name === 'password' ? 'new-password' : name === 'email' ? 'email' : 'name'}
      />
      {rightSlot && <div className="reg-input-right">{rightSlot}</div>}
    </div>
  );
};

// ─── Password Strength Meter ──────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const score = checks.filter((r) => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  const hints = ['Use 8+ characters', 'Add uppercase letter', 'Add a number', 'Add special character'];
  const missing = hints.filter((_, i) => !checks[i].test(password));

  return (
    <div className="pw-strength">
      <div className="pw-bars">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="pw-bar" style={{ background: i <= score ? colors[score] : '#e5e7eb', transition: 'background 0.3s' }} />
        ))}
      </div>
      <span className="pw-label" style={{ color: colors[score] || '#9ca3af' }}>
        {score === 0 ? 'Enter password' : labels[score]}
      </span>
      {score < 4 && missing[0] && (
        <p className="pw-hint">💡 {missing[0]}</p>
      )}
    </div>
  );
};

// ─── OTP Verification Component ───────────────────────────────────────────────
const OtpVerify = ({ email, onSuccess }) => {
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [isLoading, setLoading] = useState(false);
  const [resendTimer, setTimer] = useState(60);
  const [verified, setVerified] = useState(false);
  const context                 = useAppContext();
  const inputsRef               = React.useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputsRef.current[5]?.focus();
    }
  };

  const fullOtp = otp.join('');

  const handleVerify = async () => {
    if (fullOtp.length !== 6) { context.alertBox('error', 'Please enter the 6-digit OTP'); return; }
    setLoading(true);
    const res = await postData('/api/user/verify-email', { email, otp: fullOtp });
    setLoading(false);
    if (res?.error === false) {
      setVerified(true);
      context.alertBox('success', res?.message);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('accessToken', res?.data?.accesstoken);
      localStorage.setItem('refreshToken', res?.data?.refreshToken);
      context.setIsLogin(true);
      setTimeout(onSuccess, 1200);
    } else {
      context.alertBox('error', res?.message || 'OTP verification failed');
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    const res = await postData('/api/user/resend-otp', { email });
    if (res?.error === false) {
      context.alertBox('success', 'New OTP sent!');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } else {
      context.alertBox('error', res?.message || 'Failed to resend');
    }
  };

  return (
    <div className="reg-card otp-card">
      {verified ? (
        <div className="verified-success">
          <div className="success-ring">
            <svg viewBox="0 0 52 52" fill="none" className="w-10 h-10">
              <circle cx="26" cy="26" r="24" stroke="#22c55e" strokeWidth="3" />
              <path d="M14 26l8 8 16-16" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="reg-title" style={{ color: '#22c55e' }}>Verified!</h3>
          <p className="reg-subtitle">Redirecting you…</p>
        </div>
      ) : (
        <>
          <div className="otp-icon-wrap">
            <MdMarkEmailRead className="otp-icon" />
          </div>
          <h3 className="reg-title">Check your email</h3>
          <p className="reg-subtitle">
            We sent a 6-digit code to<br />
            <strong className="otp-email">{email}</strong>
          </p>

          {/* 6 Box OTP */}
          <div className="otp-boxes" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleOtpKeyDown(e, i)}
                className={`otp-box ${digit ? 'filled' : ''}`}
              />
            ))}
          </div>

          <button
            className="btn-primary"
            disabled={isLoading || fullOtp.length !== 6}
            onClick={handleVerify}
          >
            {isLoading ? (
              <span className="flex items-center gap-2 justify-center">
                <CircularProgress size={18} color="inherit" />
                <span>Verifying…</span>
              </span>
            ) : 'Verify & Continue'}
          </button>

          <p className="otp-resend-text">
            Didn't get it?{' '}
            {resendTimer > 0 ? (
              <span className="otp-timer">Resend in {resendTimer}s</span>
            ) : (
              <button type="button" className="resend-btn" onClick={handleResend}>
                Resend code
              </button>
            )}
          </p>
        </>
      )}
    </div>
  );
};

// ─── Main Register Component ──────────────────────────────────────────────────
const Register = () => {
  const [isLoading, setIsLoading]           = useState(false);
  const [isPasswordShow, setIsPasswordShow] = useState(false);
  const [showOtp, setShowOtp]               = useState(false);
  const [step, setStep]                     = useState(1); // 1 = form, 2 = otp
  const [formFields, setFormFields]         = useState({ name: '', email: '', password: '' });
  const [agreedToTerms, setAgreedToTerms]   = useState(false);

  const context = useAppContext();
  const history = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const valideValue = Object.values(formFields).every((el) => el) && agreedToTerms;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formFields.name)     return context.alertBox('error', 'Please enter full name');
    if (!formFields.email)    return context.alertBox('error', 'Please enter email');
    if (!formFields.password) return context.alertBox('error', 'Please enter password');
    if (!agreedToTerms)       return context.alertBox('error', 'Please agree to terms');

    setIsLoading(true);
    const res = await postData('/api/user/register', formFields);
    setIsLoading(false);

    if (res?.error === false) {
      context.alertBox('success', res?.message);
      setShowOtp(true);
    } else {
      context.alertBox('error', res?.message || 'Registration failed');
    }
  };

  const authWithGoogle = () => {
    setIsLoading(true);
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        const user = result.user;
        const fields = {
          name:     user.providerData[0].displayName,
          email:    user.providerData[0].email,
          password: null,
          avatar:   user.providerData[0].photoURL,
          mobile:   user.providerData[0].phoneNumber,
          role:     'USER',
        };
        postData('/api/user/authWithGoogle', fields).then((res) => {
          if (res?.error === false) {
            localStorage.setItem('userEmail', fields.email);
            localStorage.setItem('accessToken', res?.data?.accesstoken);
            localStorage.setItem('refreshToken', res?.data?.refreshToken);
            context.setIsLogin(true);
            context.alertBox('success', res?.message);
            history('/');
          } else {
            context.alertBox('error', res?.message);
          }
          setIsLoading(false);
        });
      })
      .catch((err) => { console.error(err); setIsLoading(false); });
  };

  if (showOtp) {
    return (
      <>
        <style>{registerStyles}</style>
        <section className="reg-section">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="reg-container">
            <OtpVerify email={formFields.email} onSuccess={() => history('/')} />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <style>{registerStyles}</style>
      <section className="reg-section">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="reg-container">
          <div className="reg-card">
            {/* Header */}
            <div className="reg-header">
              <div className="reg-logo">
                <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
                  <rect width="40" height="40" rx="12" fill="url(#rg1)" />
                  <path d="M13 20 Q20 10 27 20 Q20 30 13 20Z" fill="white" opacity="0.9" />
                  <defs>
                    <linearGradient id="rg1" x1="0" y1="0" x2="40" y2="40">
                      <stop stopColor="#FF6B00" />
                      <stop offset="1" stopColor="#FF9500" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h2 className="reg-title">Create account</h2>
              <p className="reg-subtitle">Join us — it's completely free</p>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <FloatingInput
                label="Full Name"
                type="text"
                name="name"
                value={formFields.name}
                onChange={onChangeInput}
                disabled={isLoading}
              />

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
              <div>
                <FloatingInput
                  label="Password"
                  type={isPasswordShow ? 'text' : 'password'}
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
                <PasswordStrength password={formFields.password} />
              </div>

              {/* Terms */}
              <label className="terms-label">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="terms-checkbox"
                />
                <span className="terms-custom" />
                <span className="terms-text">
                  I agree to the{' '}
                  <a href="/terms" className="terms-link">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="terms-link">Privacy Policy</a>
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={!valideValue || isLoading} className="btn-primary">
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <CircularProgress size={18} color="inherit" />
                    <span>Creating account…</span>
                  </span>
                ) : (
                  <span className="btn-content">
                    <span>Create Account</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Divider */}
              {/* <div className="divider">
                <span className="divider-line" />
                <span className="divider-text">or sign up with</span>
                <span className="divider-line" />
              </div> */}

              {/* Google */}
              {/* <button type="button" className="btn-google" onClick={authWithGoogle} disabled={isLoading}>
                <GoogleIcon />
                <span>Continue with Google</span>
              </button> */}

              {/* Login link */}
              <p className="reg-footer-text">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">Sign in →</Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const registerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  .reg-section {
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
    to   { transform: translate(30px,20px) scale(1.08); }
  }

  .reg-container {
    width: 100%;
    max-width: 440px;
    position: relative;
    z-index: 1;
  }

  .reg-card {
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

  .otp-card { text-align: center; }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Header */
  .reg-header { text-align: center; margin-bottom: 2rem; }
  .reg-logo {
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
  .reg-title {
    font-size: 1.625rem;
    font-weight: 700;
    color: #0f0f0f;
    letter-spacing: -0.03em;
    margin: 0 0 0.25rem;
  }
  .reg-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  /* Floating Input */
  .reg-input-inner {
    position: relative;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    background: #fafafa;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    overflow: hidden;
  }
  .reg-float-label {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.9375rem;
    color: #9ca3af;
    pointer-events: none;
    transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
    font-family: inherit;
  }
  .reg-float-label.active {
    top: 10px;
    transform: translateY(0);
    font-size: 0.72rem;
    color: #FF6B00;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .reg-input {
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
  .reg-input-right {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  .eye-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
  }
  .eye-btn:hover { color: #FF6B00; background: rgba(255,107,0,0.08); }

  /* Password strength */
  .pw-strength { padding: 8px 2px 2px; }
  .pw-bars { display: flex; gap: 5px; margin-bottom: 4px; }
  .pw-bar { flex: 1; height: 4px; border-radius: 99px; background: #e5e7eb; }
  .pw-label { font-size: 0.75rem; font-weight: 600; }
  .pw-hint { font-size: 0.72rem; color: #9ca3af; margin: 3px 0 0; }

  /* Terms */
  .terms-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    user-select: none;
  }
  .terms-checkbox { display: none; }
  .terms-custom {
    width: 18px; height: 18px;
    border: 1.5px solid #d1d5db;
    border-radius: 5px;
    display: flex; flex-shrink: 0;
    align-items: center; justify-content: center;
    margin-top: 1px;
    transition: all 0.15s;
  }
  .terms-checkbox:checked + .terms-custom {
    background: linear-gradient(135deg, #FF6B00, #FF9500);
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(255,107,0,0.3);
  }
  .terms-checkbox:checked + .terms-custom::after {
    content: '';
    display: block;
    width: 5px; height: 9px;
    border: 2px solid #fff;
    border-top: none; border-left: none;
    transform: rotate(45deg) translateY(-1px);
  }
  .terms-text { font-size: 0.8125rem; color: #6b7280; line-height: 1.5; }
  .terms-link { color: #FF6B00; font-weight: 600; text-decoration: none; }
  .terms-link:hover { text-decoration: underline; }

  /* Primary Button */
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
    letter-spacing: 0.01em;
    margin-top: 0.25rem;
  }
  .btn-primary::before {
    content: '';
    position: absolute; inset: 0;
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
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
  .btn-content { display: flex; align-items: center; justify-content: center; gap: 8px; }

  /* Divider */
  .divider { display: flex; align-items: center; gap: 10px; margin: 0.5rem 0 0; }
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
    align-items: center; justify-content: center;
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
  .btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Footer */
  .reg-footer-text { text-align: center; font-size: 0.8375rem; color: #6b7280; margin: 0.25rem 0 0; }
  .auth-link { color: #FF6B00; font-weight: 700; text-decoration: none; }
  .auth-link:hover { opacity: 0.75; }

  /* OTP boxes */
  .otp-icon-wrap {
    display: inline-flex;
    width: 64px; height: 64px;
    background: linear-gradient(135deg, rgba(255,107,0,0.1), rgba(255,149,0,0.15));
    border-radius: 50%;
    align-items: center; justify-content: center;
    margin-bottom: 1rem;
  }
  .otp-icon { font-size: 2rem; color: #FF6B00; }
  .otp-email { color: #111827; font-weight: 700; }
  .otp-boxes {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin: 1.5rem 0 1.25rem;
  }
  .otp-box {
    width: 44px; height: 52px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    background: #fafafa;
    text-align: center;
    font-size: 1.375rem;
    font-weight: 700;
    color: #111827;
    font-family: inherit;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    caret-color: #FF6B00;
  }
  .otp-box:focus {
    border-color: #FF6B00;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(255,107,0,0.12);
  }
  .otp-box.filled {
    border-color: #FF9500;
    background: #fff9f5;
    color: #FF6B00;
  }
  .otp-resend-text { font-size: 0.8125rem; color: #6b7280; margin-top: 1rem; }
  .otp-timer { color: #9ca3af; font-weight: 500; }
  .resend-btn {
    background: none; border: none;
    color: #FF6B00; font-weight: 700;
    cursor: pointer; font-family: inherit;
    font-size: inherit;
    transition: opacity 0.15s;
  }
  .resend-btn:hover { opacity: 0.75; }

  /* Verified success */
  .verified-success { padding: 1rem 0 0.5rem; }
  .success-ring {
    display: inline-flex;
    margin-bottom: 1rem;
    animation: successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes successPop {
    from { opacity: 0; transform: scale(0.4); }
    to   { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 480px) {
    .reg-card { padding: 2rem 1.5rem 1.75rem; border-radius: 20px; }
    .otp-box { width: 38px; height: 46px; font-size: 1.2rem; }
  }
`;

export default Register;