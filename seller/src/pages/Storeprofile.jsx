import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getSellerProfileAPI, updateSellerProfileAPI } from '../services/api';
import { useAuth } from '../context/Authcontext';
import toast from 'react-hot-toast';
import { MdStorefront, MdSave, MdContentCopy, MdOpenInNew } from 'react-icons/md';

export default function StoreProfile() {
  const { refreshUser } = useAuth();
  const [loading, setLoading]  = useState(false);
  const [saving, setSaving]    = useState(false);
  const [seller, setSeller]    = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getSellerProfileAPI();
        setSeller(res.data.data);
        reset(res.data.data);
      } catch {}
      setLoading(false);
    }
    load();
  }, [reset]);

  const onSave = async (data) => {
    setSaving(true);
    try {
      await updateSellerProfileAPI(data);
      await refreshUser();
      toast.success('Store profile updated!');
      const res = await getSellerProfileAPI();
      setSeller(res.data.data);
      reset(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const copyStoreLink = () => {
    const link = `https://zeedaddy.in/store/${seller?.storeSlug}`;
    navigator.clipboard.writeText(link);
    toast.success('Store link copied!');
  };

  if (loading) return (
    <div className="max-w-2xl space-y-5">
      {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-40" />)}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900">Store Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your store information and bank details</p>
      </div>

      {/* Store Link */}
      {seller?.storeSlug && (
        <div className="card bg-primary-50 border border-primary-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MdStorefront className="text-primary-500 text-xl shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary-700 mb-0.5">Your Store URL</p>
              <p className="text-sm text-primary-600 font-mono">zeedaddy.in/store/{seller.storeSlug}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyStoreLink} className="p-2 hover:bg-primary-100 rounded-lg transition-colors">
              <MdContentCopy className="text-primary-600 text-lg" />
            </button>
            <a href={`https://zeedaddy.in/store/${seller?.storeSlug}`} target="_blank" rel="noreferrer"
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors">
              <MdOpenInNew className="text-primary-600 text-lg" />
            </a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSave)} className="space-y-5">
        {/* Store Info */}
        <div className="card space-y-4">
          <h2 className="font-display font-semibold text-gray-900">Store Information</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Name *</label>
            <input {...register('storeName', { required: 'Store name required', minLength: { value: 3, message: 'Min 3 chars' } })}
              className={`input ${errors.storeName ? 'border-red-400' : ''}`} />
            {errors.storeName && <p className="text-red-500 text-xs mt-1">{errors.storeName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Description</label>
            <textarea {...register('storeDescription')} rows={3} className="input resize-none"
              placeholder="Tell customers what you sell..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile</label>
            <input {...register('mobile')} placeholder="10-digit number" className="input" />
          </div>
        </div>

        {/* Address */}
        <div className="card space-y-4">
          <h2 className="font-display font-semibold text-gray-900">Business Address</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street</label>
            <input {...register('address.street')} placeholder="Street address" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
              <input {...register('address.city')} placeholder="City" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
              <input {...register('address.state')} placeholder="State" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pincode</label>
            <input {...register('address.pincode')} placeholder="6-digit pincode" className="input w-40" />
          </div>
        </div>

        {/* Bank Details */}
        <div className="card space-y-4">
          <div>
            <h2 className="font-display font-semibold text-gray-900">Bank / Payout Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">Required for payout withdrawals</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Holder Name</label>
              <input {...register('bankDetails.accountHolderName')} placeholder="Full name" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Name</label>
              <input {...register('bankDetails.bankName')} placeholder="Bank name" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Number</label>
            <input {...register('bankDetails.accountNumber')} placeholder="Account number" className="input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">IFSC Code</label>
            <input {...register('bankDetails.ifscCode')} placeholder="e.g. SBIN0001234"
              className="input uppercase font-mono w-48" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">UPI ID (Optional)</label>
            <input {...register('bankDetails.upiId')} placeholder="yourname@upi" className="input" />
          </div>
        </div>

        <button type="submit" disabled={saving || !isDirty} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MdSave />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}