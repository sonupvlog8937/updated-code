import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerAPI, verifyOtpAPI, registerSellerAPI } from '../services/api';
import { useAuth } from '../context/Authcontext';
import toast from 'react-hot-toast';
import { MdStorefront, MdEmail, MdLock, MdPerson, MdStore, MdArrowForward, MdArrowBack } from 'react-icons/md';

const steps = ['Create Account', 'Verify Email', 'Setup Store'];

export default function Register() {
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail]   = useState('');
  const { refreshUser }     = useAuth();
  const navigate            = useNavigate();

  // Step 0 form
  const { register: r0, handleSubmit: hs0, formState: { errors: e0 } } = useForm();
  // Step 1 OTP form
  const { register: r1, handleSubmit: hs1, formState: { errors: e1 } } = useForm();
  // Step 2 store form
  const { register: r2, handleSubmit: hs2, formState: { errors: e2 } } = useForm();

  // STEP 0 — Register user
  const onRegister = async (data) => {
    setLoading(true);
    try {
      const res = await registerAPI(data);
      if (res.data.success) {
        setEmail(data.email);
        toast.success('OTP sent to your email!');
        setStep(1);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  // STEP 1 — Verify OTP
  const onVerifyOtp = async (data) => {
    setLoading(true);
    try {
      const res = await verifyOtpAPI({ email, otp: data.otp });
      if (res.data.success) {
        const token = res.data.data?.accesstoken;
        if (token) localStorage.setItem('sellerToken', token);
        toast.success('Email verified!');
        setStep(2);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  // STEP 2 — Register seller store
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-green mb-4">
            <MdStorefront className="text-white text-3xl" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Start Selling</h1>
          <p className="text-gray-500 text-sm mt-1">Join Zeedaddy marketplace</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
                ${i < step ? 'bg-primary-500 text-white' : i === step ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-primary-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          {/* STEP 0 */}
          {step === 0 && (
            <form onSubmit={hs0(onRegister)} className="space-y-4">
              <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Create Account</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input {...r0('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' } })}
                    placeholder="Your full name" className={`input pl-10 ${e0.name ? 'border-red-400' : ''}`} />
                </div>
                {e0.name && <p className="text-red-500 text-xs mt-1">{e0.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input {...r0('email', { required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                    type="email" placeholder="you@example.com" className={`input pl-10 ${e0.email ? 'border-red-400' : ''}`} />
                </div>
                {e0.email && <p className="text-red-500 text-xs mt-1">{e0.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input {...r0('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 chars' } })}
                    type="password" placeholder="Min 6 characters" className={`input pl-10 ${e0.password ? 'border-red-400' : ''}`} />
                </div>
                {e0.password && <p className="text-red-500 text-xs mt-1">{e0.password.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MdArrowForward />}
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </form>
          )}

          {/* STEP 1 - OTP */}
          {step === 1 && (
            <form onSubmit={hs1(onVerifyOtp)} className="space-y-4">
              <h2 className="font-display font-bold text-lg text-gray-900 mb-1">Verify Email</h2>
              <p className="text-sm text-gray-500 mb-4">We sent a 6-digit OTP to <span className="font-semibold text-gray-700">{email}</span></p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter OTP</label>
                <input {...r1('otp', { required: 'OTP required', minLength: { value: 6, message: '6 digits' }, maxLength: { value: 6, message: '6 digits' } })}
                  placeholder="123456" maxLength={6}
                  className={`input text-center text-2xl tracking-widest font-bold ${e1.otp ? 'border-red-400' : ''}`} />
                {e1.otp && <p className="text-red-500 text-xs mt-1">{e1.otp.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => setStep(0)} className="btn-ghost w-full flex items-center justify-center gap-1 text-sm">
                <MdArrowBack className="text-sm" /> Back
              </button>
            </form>
          )}

          {/* STEP 2 - Store Setup */}
          {step === 2 && (
            <form onSubmit={hs2(onRegisterStore)} className="space-y-4">
              <h2 className="font-display font-bold text-lg text-gray-900 mb-1">Setup Your Store</h2>
              <p className="text-sm text-gray-500 mb-4">Tell customers about your store</p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Name *</label>
                <div className="relative">
                  <MdStore className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input {...r2('storeName', { required: 'Store name required', minLength: { value: 3, message: 'Min 3 chars' } })}
                    placeholder="Your Store Name" className={`input pl-10 ${e2.storeName ? 'border-red-400' : ''}`} />
                </div>
                {e2.storeName && <p className="text-red-500 text-xs mt-1">{e2.storeName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Description</label>
                <textarea {...r2('storeDescription')} rows={3} placeholder="What do you sell? Tell customers about your store..."
                  className="input resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <input {...r2('mobile')} placeholder="10-digit mobile number" className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MdArrowForward />}
                {loading ? 'Registering...' : 'Register Store'}
              </button>
            </form>
          )}

          {step === 0 && (
            <p className="text-center text-sm text-gray-500 mt-5">
              Already a seller? <Link to="/login" className="text-primary-600 font-semibold">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}