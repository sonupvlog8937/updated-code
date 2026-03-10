import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../context/Useauth';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdStorefront, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdArrowForward } from 'react-icons/md';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await login(data.email, data.password);
      if (res.success) {
        toast.success('Welcome back! 👋');
        navigate('/dashboard');
      }
    } catch (err) {
      // Bug fixed: err was referenced in else block before, now properly in catch
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6faf6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-green-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4CAF50, #2e7d32)' }}>
            <MdStorefront className="text-white text-2xl" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Seller Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your store</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Email address</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' }
                  })}
                  type="email"
                  placeholder="you@example.com"
                  className={`input pl-10 ${errors.email ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-green-600 hover:text-green-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`input pl-10 pr-11 ${errors.password ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-1"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <MdArrowForward className="text-lg" />
              }
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">NEW HERE?</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <Link to="/register"
            className="block w-full text-center py-2.5 rounded-xl border-2 border-green-200 text-green-700 font-semibold text-sm hover:bg-green-50 transition-colors">
            Create Seller Account
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Zeedaddy. All rights reserved.
        </p>
      </div>
    </div>
  );
}