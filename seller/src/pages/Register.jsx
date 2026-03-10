import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerAPI, verifyOtpAPI, registerSellerAPI } from '../services/api';
import useAuth from '../context/Useauth';
import toast from 'react-hot-toast';
import {
  MdStorefront, MdEmail, MdLock, MdPerson, MdStore,
  MdArrowForward, MdArrowBack, MdCheck
} from 'react-icons/md';

const STEPS = ['Create Account', 'Verify Email', 'Setup Store'];

export default function Register() {
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [email,   setEmail]   = useState('');
  const { refreshUser }       = useAuth();
  const navigate              = useNavigate();

  const { register: r0, handleSubmit: hs0, formState: { errors: e0 } } = useForm();
  const { register: r1, handleSubmit: hs1, formState: { errors: e1 } } = useForm();
  const { register: r2, handleSubmit: hs2, formState: { errors: e2 } } = useForm();

  const onRegister = async (data) => {
    setLoading(true);
    try {
      const res = await registerAPI(data);
      if (res.data.success) {
        setEmail(data.email);
        toast.success('OTP sent! Check your inbox.');
        setStep(1);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const onVerifyOtp = async (data) => {
    setLoading(true);
    try {
      const res = await verifyOtpAPI({ email, otp: String(data.otp) });
      if (res.data.success) {
        const token = res.data.data?.accesstoken;
        if (token) localStorage.setItem('sellerToken', token);
        toast.success('Email verified! ✓');
        setStep(2);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const onRegisterStore = async (data) => {
    setLoading(true);
    try {
      const res = await registerSellerAPI(data);
      if (res.data.success) {
        await refreshUser();
        toast.success('Store registered! Awaiting admin approval.');
        navigate('/dashboard');
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Store registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f6faf6] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-green-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2e7d32)' }}>
            <MdStorefront className="text-white text-2xl" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Start Selling</h1>
          <p className="text-gray-500 text-sm mt-1">Join Zeedaddy marketplace</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6 gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${i < step  ? 'bg-green-500 text-white shadow-[0_0_0_3px_#dcfce7]'
                  : i === step ? 'bg-green-500 text-white shadow-[0_0_0_4px_#bbf7d0]'
                  : 'bg-gray-200 text-gray-400'}`}>
                  {i < step ? <MdCheck className="text-sm" /> : i + 1}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block tracking-wide
                  ${i === step ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.toUpperCase()}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-1 mb-4 transition-all duration-500 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">

          {/* STEP 0 — Create Account */}
          {step === 0 && (
            <form onSubmit={hs0(onRegister)} className="space-y-4">
              <div className="mb-5">
                <h2 className="font-display font-bold text-lg text-gray-900">Create your account</h2>
                <p className="text-sm text-gray-500 mt-0.5">Free to join. Start selling in minutes.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <div className="relative">
                  <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input {...r0('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' } })}
                    placeholder="Your full name"
                    className={`input pl-10 ${e0.name ? 'border-red-400' : ''}`} />
                </div>
                {e0.name && <p className="text-red-500 text-xs">⚠ {e0.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <div className="relative">
                  <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input {...r0('email', {
                    required: 'Email required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
                  })}
                    type="email" placeholder="you@example.com"
                    className={`input pl-10 ${e0.email ? 'border-red-400' : ''}`} />
                </div>
                {e0.email && <p className="text-red-500 text-xs">⚠ {e0.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input {...r0('password', {
                    required: 'Password required',
                    minLength: { value: 6, message: 'Min 6 characters' }
                  })}
                    type="password" placeholder="Min 6 characters"
                    className={`input pl-10 ${e0.password ? 'border-red-400' : ''}`} />
                </div>
                {e0.password && <p className="text-red-500 text-xs">⚠ {e0.password.message}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <MdArrowForward />}
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </form>
          )}

          {/* STEP 1 — Verify OTP */}
          {step === 1 && (
            <form onSubmit={hs1(onVerifyOtp)} className="space-y-4">
              <div className="mb-5">
                <h2 className="font-display font-bold text-lg text-gray-900">Verify your email</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-gray-700">{email}</span>
                </p>
              </div>

              {/* OTP visual input */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Enter OTP</label>
                <input {...r1('otp', {
                  required: 'OTP required',
                  minLength: { value: 6, message: '6 digits required' },
                  maxLength: { value: 6, message: '6 digits only' }
                })}
                  placeholder="• • • • • •"
                  maxLength={6}
                  inputMode="numeric"
                  className={`input text-center text-3xl tracking-[0.5em] font-bold py-4 ${e1.otp ? 'border-red-400' : ''}`} />
                {e1.otp && <p className="text-red-500 text-xs">⚠ {e1.otp.message}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <MdCheck />}
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button type="button" onClick={() => setStep(0)}
                className="btn-ghost w-full flex items-center justify-center gap-1.5 text-sm">
                <MdArrowBack className="text-sm" /> Back to registration
              </button>
            </form>
          )}

          {/* STEP 2 — Setup Store */}
          {step === 2 && (
            <form onSubmit={hs2(onRegisterStore)} className="space-y-4">
              <div className="mb-5">
                <h2 className="font-display font-bold text-lg text-gray-900">Setup your store</h2>
                <p className="text-sm text-gray-500 mt-0.5">Almost done! Tell customers about your store.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Store Name *</label>
                <div className="relative">
                  <MdStore className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input {...r2('storeName', {
                    required: 'Store name required',
                    minLength: { value: 3, message: 'Min 3 characters' }
                  })}
                    placeholder="Your Store Name"
                    className={`input pl-10 ${e2.storeName ? 'border-red-400' : ''}`} />
                </div>
                {e2.storeName && <p className="text-red-500 text-xs">⚠ {e2.storeName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Store Description</label>
                <textarea {...r2('storeDescription')} rows={3}
                  placeholder="What do you sell? Briefly describe your store..."
                  className="input resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
                <input {...r2('mobile')} placeholder="10-digit mobile number" className="input" />
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <MdCheck />}
                {loading ? 'Registering store...' : 'Register Store'}
              </button>
            </form>
          )}

          {step === 0 && (
            <p className="text-center text-sm text-gray-500 mt-5">
              Already a seller?{' '}
              <Link to="/login" className="text-green-600 font-semibold hover:text-green-700">Sign in</Link>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Zeedaddy. All rights reserved.
        </p>
      </div>
    </div>
  );
}