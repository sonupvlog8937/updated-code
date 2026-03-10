import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createProductAPI, updateProductAPI, getSellerProductsAPI, uploadProductImagesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdArrowBack, MdCloudUpload, MdClose } from 'react-icons/md';

export default function ProductForm() {
  const { id } = useParams();
  const isEdit  = !!id;
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages]     = useState([]);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (isEdit) {
      // Load existing product data
      getSellerProductsAPI({ page: 1, limit: 100 }).then(res => {
        const product = res.data.data?.find(p => p._id === id);
        if (product) {
          Object.keys(product).forEach(key => setValue(key, product[key]));
          setImages(product.images || []);
        }
      });
    }
  }, [id, isEdit, setValue]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const res = await uploadProductImagesAPI(formData);
      const newImages = res.data.images || [];
      setImages(prev => [...prev, ...newImages]);
      toast.success(`${newImages.length} image(s) uploaded`);
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const onSubmit = async (data) => {
    if (images.length === 0) { toast.error('Add at least one product image'); return; }
    setLoading(true);
    try {
      const payload = { ...data, images, bannerimages: images };
      if (isEdit) {
        await updateProductAPI(id, payload);
        toast.success('Product updated! Sent for re-review.');
      } else {
        await createProductAPI(payload);
        toast.success('Product submitted for admin review!');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <MdArrowBack className="text-xl text-gray-600" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="text-sm text-gray-500">{isEdit ? 'Update your product details' : 'Fill in product details for admin review'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Images */}
        <div className="card">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Product Images</h2>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <MdClose className="text-xs" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-lg">Main</span>}
              </div>
            ))}
            <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
              ${uploading ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'}`}>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              {uploading
                ? <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
                : <><MdCloudUpload className="text-2xl text-gray-400 mb-1" /><span className="text-xs text-gray-400">Upload</span></>
              }
            </label>
          </div>
          <p className="text-xs text-gray-400">First image will be the main product image. Max 5MB each.</p>
        </div>

        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="font-display font-semibold text-gray-900">Basic Information</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
            <input {...register('name', { required: 'Product name is required' })}
              placeholder="Enter product name" className={`input ${errors.name ? 'border-red-400' : ''}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea {...register('description', { required: 'Description is required' })} rows={4}
              placeholder="Describe your product in detail..." className={`input resize-none ${errors.description ? 'border-red-400' : ''}`} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand</label>
              <input {...register('brand')} placeholder="Brand name" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
              <input {...register('catName')} placeholder="e.g. Electronics" className="input" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card space-y-4">
          <h2 className="font-display font-semibold text-gray-900">Pricing & Inventory</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Selling Price (₹) *</label>
              <input {...register('price', { required: 'Price required', min: { value: 1, message: 'Min ₹1' } })}
                type="number" placeholder="0" className={`input ${errors.price ? 'border-red-400' : ''}`} />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Original Price (₹)</label>
              <input {...register('oldPrice')} type="number" placeholder="0" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Quantity *</label>
              <input {...register('countInStock', { required: 'Stock required', min: { value: 0, message: 'Min 0' } })}
                type="number" placeholder="0" className={`input ${errors.countInStock ? 'border-red-400' : ''}`} />
              {errors.countInStock && <p className="text-red-500 text-xs mt-1">{errors.countInStock.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount (%)</label>
              <input {...register('discount', { required: 'Required', min: 0, max: 100 })}
                type="number" placeholder="0" defaultValue={0} className="input" />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="card space-y-4">
          <h2 className="font-display font-semibold text-gray-900">Variants (Optional)</h2>
          <p className="text-xs text-gray-400 -mt-2">Comma-separated values e.g. S, M, L, XL</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sizes</label>
              <input {...register('size')} placeholder="S, M, L, XL" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">RAM Options</label>
              <input {...register('productRam')} placeholder="4GB, 8GB, 16GB" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Weight</label>
              <input {...register('productWeight')} placeholder="100g, 250g, 500g" className="input" />
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ⚠️ Your product will be reviewed by admin before going live. This usually takes a few hours.
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/products')} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}