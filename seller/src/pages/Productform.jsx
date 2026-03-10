import React, { useContext, useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Rating from '@mui/material/Rating';
import { IoMdClose } from 'react-icons/io';
import { Button } from '@mui/material';
import { FaCloudUploadAlt } from 'react-icons/fa';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import { FaRegImages } from 'react-icons/fa6';
import { useNavigate, useParams } from 'react-router-dom';

import useAuth from '../context/useAuth';
import {
  createProductAPI, updateProductAPI,
  uploadProductImagesAPI, getSellerProductsAPI,
} from '../services/api';

const label = { inputProps: { 'aria-label': 'Switch demo' } };

// ─── UploadBox ────────────────────────────────────────────────────────────────
// uploadFn : API function to call — MUST accept FormData
// fieldName: FormData key — must match multer's upload.array() on backend
const UploadBox = ({ fieldName = 'images', multiple = true, setPreviewsFun, uploadFn }) => {
  const [uploading, setUploading] = useState(false);

  const onChangeFile = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    const formdata = new FormData();

    for (let i = 0; i < files.length; i++) {
      if (!allowed.includes(files[i].type)) {
        alert('Please select a valid JPG, PNG or WEBP image.');
        return;
      }
      // fieldName must match what multer expects on the backend route
      formdata.append(fieldName, files[i]);
    }

    setUploading(true);
    try {
      const res = await uploadFn(formdata);
      const uploaded = res?.data?.images;
      if (uploaded && uploaded.length > 0) {
        setPreviewsFun(uploaded);
      } else {
        alert('Upload succeeded but no images returned. Check backend logs.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Upload failed';
      console.error('Upload error:', err?.response?.data || err);
      alert('Image upload failed: ' + msg);
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-selecting same file
    }
  };

  return (
    <div className="uploadBox p-3 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-full bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative">
      {uploading ? (
        <>
          <CircularProgress size={30} />
          <h4 className="text-center text-[13px] mt-2">Uploading...</h4>
        </>
      ) : (
        <>
          <FaRegImages className="text-[40px] opacity-35 pointer-events-none" />
          <h4 className="text-[14px] pointer-events-none">Image Upload</h4>
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
            onChange={onChangeFile}
            name={fieldName}
          />
        </>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AddProduct = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { catData, alertBox } = useAuth();   // same as admin's context.catData

  // ── Form state (mirrors admin exactly) ──────────────────────────────────────
  const [formFields, setFormFields] = useState({
    name: '',
    description: '',
    images: [],
    brand: '',
    keywords: '',
    price: '',
    oldPrice: '',
    category: '',
    catName: '',
    catId: '',
    subCatId: '',
    subCat: '',
    thirdsubCat: '',
    thirdsubCatId: '',
    countInStock: '',
    rating: 0,
    isFeatured: false,
    discount: '',
    sale: 0,
    productRam: [],
    size: [],
    productWeight: [],
    colorOptions: [{ name: '', code: '', images: '' }],
    specifications: [{ key: '', value: '' }],
    bannerTitleName: '',
    bannerimages: [],
    isDisplayOnHomeBanner: false,
  });

  // ── Category cascade state (mirrors admin exactly) ───────────────────────
  const [productCat, setProductCat] = useState('');
  const [productSubCat, setProductSubCat] = useState('');
  const [productThirdLevelCat, setProductThirdLevelCat] = useState('');

  // Derived subcategory options — same as admin
  const selectedCategory = catData?.find((cat) => cat?._id === productCat);
  const availableSubCategories = selectedCategory?.children || [];
  const selectedSubCategory = availableSubCategories?.find((s) => s?._id === productSubCat);
  const availableThirdLevelCategories = selectedSubCategory?.children || [];

  // ── Variant dropdowns ────────────────────────────────────────────────────
  const [productRams, setProductRams] = useState([]);
  const [productRamsData, setProductRamsData] = useState([]);
  const [productWeight, setProductWeight] = useState([]);
  const [productWeightData, setProductWeightData] = useState([]);
  const [productSize, setProductSize] = useState([]);
  const [productSizeData, setProductSizeData] = useState([]);
  const [productFeatured, setProductFeatured] = useState('');

  // ── Image previews ───────────────────────────────────────────────────────
  const [previews, setPreviews] = useState([]);
  const [bannerPreviews, setBannerPreviews] = useState([]);
  const [checkedSwitch, setCheckedSwitch] = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEdit);

  // ── Load variant options from backend ───────────────────────────────────
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'https://api.zeedaddy.in';
    const token = localStorage.getItem('sellerToken');
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${base}/api/product/productRAMS/get`, { headers })
      .then((r) => r.json())
      .then((res) => { if (res?.error === false) setProductRamsData(res?.data || []); })
      .catch(() => {});

    fetch(`${base}/api/product/productWeight/get`, { headers })
      .then((r) => r.json())
      .then((res) => { if (res?.error === false) setProductWeightData(res?.data || []); })
      .catch(() => {});

    fetch(`${base}/api/product/productSize/get`, { headers })
      .then((r) => r.json())
      .then((res) => { if (res?.error === false) setProductSizeData(res?.data || []); })
      .catch(() => {});
  }, []);

  // ── Load product for edit ────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    setFetchingProduct(true);

    getSellerProductsAPI({ page: 1, limit: 200 })
      .then((res) => {
        const products = res.data?.data || res.data?.products || [];
        const p = products.find((x) => x._id === id);
        if (!p) { alertBox?.('error', 'Product not found'); navigate('/products'); return; }

        // Restore form fields
        setFormFields((prev) => ({
          ...prev,
          name: p.name || '',
          description: p.description || '',
          images: p.images || [],
          brand: p.brand || '',
          keywords: Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords || ''),
          price: p.price || '',
          oldPrice: p.oldPrice || '',
          category: p.category || '',
          catName: p.catName || '',
          catId: p.catId || '',
          subCatId: p.subCatId || '',
          subCat: p.subCat || '',
          thirdsubCat: p.thirdsubCat || '',
          thirdsubCatId: p.thirdsubCatId || '',
          countInStock: p.countInStock || '',
          rating: p.rating || 0,
          isFeatured: p.isFeatured || false,
          discount: p.discount || '',
          sale: p.sale || 0,
          productRam: p.productRam || [],
          size: p.size || [],
          productWeight: p.productWeight || [],
          colorOptions: p.colorOptions?.length ? p.colorOptions.map(c => ({ ...c, images: Array.isArray(c.images) ? c.images.join(', ') : c.images })) : [{ name: '', code: '', images: '' }],
          specifications: p.specifications?.length ? p.specifications : [{ key: '', value: '' }],
          bannerTitleName: p.bannerTitleName || '',
          bannerimages: p.bannerimages || [],
          isDisplayOnHomeBanner: p.isDisplayOnHomeBanner || false,
        }));

        // Restore category selects
        setProductCat(p.catId || '');
        setProductSubCat(p.subCatId || '');
        setProductThirdLevelCat(p.thirdsubCatId || '');

        // Restore variant selects
        setProductRams(p.productRam || []);
        setProductWeight(p.productWeight || []);
        setProductSize(p.size || []);
        setProductFeatured(p.isFeatured ? true : false);

        // Restore previews
        setPreviews(p.images || []);
        setBannerPreviews(p.bannerimages || []);
        setCheckedSwitch(p.isDisplayOnHomeBanner || false);
      })
      .catch(() => { alertBox?.('error', 'Failed to load product'); navigate('/products'); })
      .finally(() => setFetchingProduct(false));
  }, [id, isEdit]);

  // ── Category change handlers (exact admin logic) ─────────────────────────
  const handleChangeProductCat = (event) => {
    const selectedCatId = event.target.value;
    const selectedCat = catData?.find((cat) => cat?._id === selectedCatId);
    setProductCat(selectedCatId);
    setProductSubCat('');
    setProductThirdLevelCat('');
    formFields.catId = selectedCatId;
    formFields.category = selectedCatId;
    formFields.catName = selectedCat?.name || '';
    formFields.subCatId = '';
    formFields.subCat = '';
    formFields.thirdsubCatId = '';
    formFields.thirdsubCat = '';
  };

  const handleChangeProductSubCat = (event) => {
    const selectedSubCatId = event.target.value;
    const selectedSubCat = availableSubCategories?.find((s) => s?._id === selectedSubCatId);
    setProductSubCat(selectedSubCatId);
    setProductThirdLevelCat('');
    formFields.subCatId = selectedSubCatId;
    formFields.subCat = selectedSubCat?.name || '';
    formFields.thirdsubCatId = '';
    formFields.thirdsubCat = '';
  };

  const handleChangeProductThirdLevelCat = (event) => {
    const selectedThirdCatId = event.target.value;
    const selectedThirdCat = availableThirdLevelCategories?.find((t) => t?._id === selectedThirdCatId);
    setProductThirdLevelCat(selectedThirdCatId);
    formFields.thirdsubCatId = selectedThirdCatId;
    formFields.thirdsubCat = selectedThirdCat?.name || '';
  };

  // ── Variant handlers (exact admin logic) ─────────────────────────────────
  const handleChangeProductFeatured = (event) => {
    setProductFeatured(event.target.value);
    formFields.isFeatured = event.target.value;
  };

  const handleChangeProductRams = (event) => {
    const { target: { value } } = event;
    const v = typeof value === 'string' ? value.split(',') : value;
    setProductRams(v);
    formFields.productRam = v;
  };

  const handleChangeProductWeight = (event) => {
    const { target: { value } } = event;
    const v = typeof value === 'string' ? value.split(',') : value;
    setProductWeight(v);
    formFields.productWeight = v;
  };

  const handleChangeProductSize = (event) => {
    const { target: { value } } = event;
    const v = typeof value === 'string' ? value.split(',') : value;
    setProductSize(v);
    formFields.size = v;
  };

  // ── Input handler ─────────────────────────────────────────────────────────
  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const onChangeRating = (e) => {
    setFormFields((prev) => ({ ...prev, rating: e.target.value }));
  };

  // ── Color option handlers ─────────────────────────────────────────────────
  const handleColorOptionChange = (index, field, value) => {
    const updated = [...formFields.colorOptions];
    updated[index] = { ...updated[index], [field]: value };
    setFormFields((prev) => ({ ...prev, colorOptions: updated }));
  };
  const addColorOption = () => {
    setFormFields((prev) => ({ ...prev, colorOptions: [...prev.colorOptions, { name: '', code: '', images: '' }] }));
  };
  const removeColorOption = (index) => {
    setFormFields((prev) => ({ ...prev, colorOptions: prev.colorOptions.filter((_, i) => i !== index) }));
  };

  // ── Specification handlers ────────────────────────────────────────────────
  const handleSpecificationChange = (index, field, value) => {
    const updated = [...formFields.specifications];
    updated[index] = { ...updated[index], [field]: value };
    setFormFields((prev) => ({ ...prev, specifications: updated }));
  };
  const addSpecification = () => {
    setFormFields((prev) => ({ ...prev, specifications: [...prev.specifications, { key: '', value: '' }] }));
  };
  const removeSpecification = (index) => {
    setFormFields((prev) => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== index) }));
  };

  // ── Image upload callbacks (exact admin setPreviewsFun logic) ─────────────
  const setPreviewsFun = (previewsArr) => {
    const imgArr = [...previews];
    previewsArr.forEach((img) => imgArr.push(img));
    setPreviews([]);
    setTimeout(() => {
      setPreviews(imgArr);
      formFields.images = imgArr;
    }, 10);
  };

  const setBannerImagesFun = (previewsArr) => {
    const imgArr = [...bannerPreviews];
    previewsArr.forEach((img) => imgArr.push(img));
    setBannerPreviews([]);
    setTimeout(() => {
      setBannerPreviews(imgArr);
      formFields.bannerimages = imgArr;
    }, 10);
  };

  const removeImg = (image, index) => {
    const imgArr = previews.filter((_, i) => i !== index);
    setPreviews(imgArr);
    formFields.images = imgArr;
  };

  const removeBannerImg = (image, index) => {
    const imgArr = bannerPreviews.filter((_, i) => i !== index);
    setBannerPreviews(imgArr);
    formFields.bannerimages = imgArr;
  };

  const handleChangeSwitch = (event) => {
    setCheckedSwitch(event.target.checked);
    formFields.isDisplayOnHomeBanner = event.target.checked;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formFields.name)         { alertBox?.('error', 'Please enter product name');       return; }
    if (!formFields.description)  { alertBox?.('error', 'Please enter product description'); return; }
    if (!formFields.catId)        { alertBox?.('error', 'Please select product category');   return; }
    if (!formFields.price)        { alertBox?.('error', 'Please enter product price');       return; }
    if (!formFields.oldPrice)     { alertBox?.('error', 'Please enter product old price');   return; }
    if (!formFields.countInStock) { alertBox?.('error', 'Please enter product stock');       return; }
    if (!formFields.brand)        { alertBox?.('error', 'Please enter product brand');       return; }
    if (!formFields.discount)     { alertBox?.('error', 'Please enter product discount');    return; }
    if (previews.length === 0)    { alertBox?.('error', 'Please upload at least one product image'); return; }

    const payload = {
      ...formFields,
      images: previews,
      bannerimages: bannerPreviews.length ? bannerPreviews : previews,
      colorOptions: (formFields.colorOptions || [])
        .map((item) => ({
          ...item,
          images: item.images ? item.images.split(',').map((img) => img.trim()).filter(Boolean) : [],
        }))
        .filter((item) => item.name),
      specifications: (formFields.specifications || []).filter((item) => item.key && item.value),
      keywords: formFields.keywords
        ? formFields.keywords.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
    };

    setIsLoading(true);
    try {
      if (isEdit) {
        await updateProductAPI(id, payload);
        alertBox?.('success', 'Product updated successfully!');
      } else {
        await createProductAPI(payload);
        alertBox?.('success', 'Product submitted for admin review!');
      }
      setTimeout(() => {
        setIsLoading(false);
        navigate('/products');
      }, 800);
    } catch (err) {
      setIsLoading(false);
      alertBox?.('error', err.response?.data?.message || 'Something went wrong');
    }
  };

  // ── Loading state for edit fetch ─────────────────────────────────────────
  if (fetchingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress />
          <p className="text-gray-500 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <section className="p-5 bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[22px] font-[700] text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {isEdit ? 'Update your product listing below' : 'Fill in all details carefully before submitting'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-md transition"
        >
          ← Back to Products
        </button>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-5">

          {/* ── Product Name ── */}
          <div className="grid grid-cols-1 mb-4">
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product Name <span className="text-red-500">*</span></h3>
              <input
                type="text"
                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                name="name"
                value={formFields.name}
                onChange={onChangeInput}
                placeholder="e.g. Premium Cotton T-Shirt"
              />
            </div>
          </div>

          {/* ── Description ── */}
          <div className="grid grid-cols-1 mb-4">
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product Description <span className="text-red-500">*</span></h3>
              <textarea
                className="w-full h-[140px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm resize-none"
                name="description"
                value={formFields.description}
                onChange={onChangeInput}
                placeholder="Describe your product in detail — material, features, dimensions, warranty..."
              />
            </div>
          </div>

          {/* ── Keywords ── */}
          <div className="grid grid-cols-1 mb-4">
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Search Keywords <span className="text-[12px] text-gray-400">(comma separated)</span></h3>
              <input
                type="text"
                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                name="keywords"
                value={formFields.keywords}
                onChange={onChangeInput}
                placeholder="e.g. tshirt, cotton, summer wear"
              />
            </div>
          </div>

          {/* ── Category / SubCat / Third Level / Price row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-4 gap-4">

            {/* Category */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product Category <span className="text-red-500">*</span></h3>
              {catData?.length > 0 ? (
                <Select
                  labelId="cat-select"
                  size="small"
                  className="w-full"
                  value={productCat}
                  onChange={handleChangeProductCat}
                  displayEmpty
                >
                  <MenuItem value="" disabled><em className="text-gray-400">Select Category</em></MenuItem>
                  {catData.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              ) : (
                <div className="h-[40px] flex items-center text-[13px] text-gray-400">Loading categories...</div>
              )}
            </div>

            {/* Sub Category — only shows children of selected category */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Sub Category</h3>
              <Select
                labelId="subcat-select"
                size="small"
                className="w-full"
                value={productSubCat}
                onChange={handleChangeProductSubCat}
                disabled={availableSubCategories.length === 0}
                displayEmpty
              >
                <MenuItem value="" disabled={false}>
                  {availableSubCategories.length === 0
                    ? <em className="text-gray-400">— select category first —</em>
                    : <em className="text-gray-400">Select Sub Category</em>}
                </MenuItem>
                {availableSubCategories.map((sub) => (
                  <MenuItem key={sub._id} value={sub._id}>{sub.name}</MenuItem>
                ))}
              </Select>
            </div>

            {/* Third Level Category */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Third Level Category</h3>
              <Select
                labelId="thirdcat-select"
                size="small"
                className="w-full"
                value={productThirdLevelCat}
                onChange={handleChangeProductThirdLevelCat}
                disabled={availableThirdLevelCategories.length === 0}
                displayEmpty
              >
                <MenuItem value="">
                  {availableThirdLevelCategories.length === 0
                    ? <em className="text-gray-400">— select sub cat first —</em>
                    : <em className="text-gray-400">Select Third Level</em>}
                </MenuItem>
                {availableThirdLevelCategories.map((t) => (
                  <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                ))}
              </Select>
            </div>

            {/* Price */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Selling Price (₹) <span className="text-red-500">*</span></h3>
              <input
                type="number"
                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                name="price"
                value={formFields.price}
                onChange={onChangeInput}
                placeholder="0"
              />
            </div>

            {/* Old Price */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Original / MRP (₹) <span className="text-red-500">*</span></h3>
              <input
                type="number"
                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                name="oldPrice"
                value={formFields.oldPrice}
                onChange={onChangeInput}
                placeholder="0"
              />
            </div>

            {/* Is Featured */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Is Featured?</h3>
              <Select
                size="small"
                className="w-full"
                value={productFeatured}
                onChange={handleChangeProductFeatured}
                displayEmpty
              >
                <MenuItem value="" disabled><em className="text-gray-400">Select</em></MenuItem>
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </div>

            {/* Stock */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product Stock <span className="text-red-500">*</span></h3>
              <input
                type="number"
                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                name="countInStock"
                value={formFields.countInStock}
                onChange={onChangeInput}
                placeholder="0"
              />
            </div>

            {/* Brand */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product Brand <span className="text-red-500">*</span></h3>
              <input
                type="text"
                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                name="brand"
                value={formFields.brand}
                onChange={onChangeInput}
                placeholder="e.g. Nike, Samsung"
              />
            </div>

            {/* Discount */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Discount (%) <span className="text-red-500">*</span></h3>
              <input
                type="number"
                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                name="discount"
                value={formFields.discount}
                onChange={onChangeInput}
                placeholder="0"
              />
            </div>

            {/* Sale */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Sale Count</h3>
              <input
                type="number"
                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                name="sale"
                value={formFields.sale}
                onChange={onChangeInput}
                placeholder="0"
              />
            </div>

            {/* RAM */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product RAM</h3>
              {productRamsData.length > 0 ? (
                <Select
                  multiple
                  size="small"
                  className="w-full"
                  value={productRams}
                  onChange={handleChangeProductRams}
                  displayEmpty
                  renderValue={(selected) => selected.length === 0 ? <em className="text-gray-400">Select RAM</em> : selected.join(', ')}
                >
                  {productRamsData.map((item, index) => (
                    <MenuItem key={index} value={item.name}>{item.name}</MenuItem>
                  ))}
                </Select>
              ) : (
                <div className="h-[40px] flex items-center text-[13px] text-gray-400">No RAM options</div>
              )}
            </div>

            {/* Weight */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product Weight</h3>
              {productWeightData.length > 0 ? (
                <Select
                  multiple
                  size="small"
                  className="w-full"
                  value={productWeight}
                  onChange={handleChangeProductWeight}
                  displayEmpty
                  renderValue={(selected) => selected.length === 0 ? <em className="text-gray-400">Select Weight</em> : selected.join(', ')}
                >
                  {productWeightData.map((item, index) => (
                    <MenuItem key={index} value={item.name}>{item.name}</MenuItem>
                  ))}
                </Select>
              ) : (
                <div className="h-[40px] flex items-center text-[13px] text-gray-400">No weight options</div>
              )}
            </div>

            {/* Size */}
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product Size</h3>
              {productSizeData.length > 0 ? (
                <Select
                  multiple
                  size="small"
                  className="w-full"
                  value={productSize}
                  onChange={handleChangeProductSize}
                  displayEmpty
                  renderValue={(selected) => selected.length === 0 ? <em className="text-gray-400">Select Size</em> : selected.join(', ')}
                >
                  {productSizeData.map((item, index) => (
                    <MenuItem key={index} value={item.name}>{item.name}</MenuItem>
                  ))}
                </Select>
              ) : (
                <div className="h-[40px] flex items-center text-[13px] text-gray-400">No size options</div>
              )}
            </div>

          </div>

          {/* ── Rating ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-4 gap-4">
            <div className="col">
              <h3 className="text-[14px] font-[500] mb-1 text-black">Product Rating</h3>
              <Rating name="half-rating" defaultValue={formFields.rating || 1} onChange={onChangeRating} />
            </div>
          </div>

          {/* ── Colour Options ── */}
          <div className="col w-full py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-[700] text-[16px]">Colour Options</h3>
              <Button type="button" size="small" variant="outlined" onClick={addColorOption}>+ Add Colour</Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {formFields.colorOptions.map((colorItem, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-sm border border-gray-200">
                  <input
                    type="text"
                    placeholder="Colour Name (e.g. Red)"
                    className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm"
                    value={colorItem.name}
                    onChange={(e) => handleColorOptionChange(index, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Colour Code (e.g. #ff0000)"
                    className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm"
                    value={colorItem.code}
                    onChange={(e) => handleColorOptionChange(index, 'code', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Image URLs (comma separated)"
                    className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm md:col-span-2"
                    value={colorItem.images}
                    onChange={(e) => handleColorOptionChange(index, 'images', e.target.value)}
                  />
                  <div className="md:col-span-4 flex justify-end">
                    <Button
                      type="button"
                      color="error"
                      size="small"
                      onClick={() => removeColorOption(index)}
                      disabled={formFields.colorOptions.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Specifications ── */}
          <div className="col w-full py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-[700] text-[16px]">Specifications</h3>
              <Button type="button" size="small" variant="outlined" onClick={addSpecification}>+ Add Specification</Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {formFields.specifications.map((specItem, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-sm border border-gray-200">
                  <input
                    type="text"
                    placeholder="Key (e.g. Display)"
                    className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm"
                    value={specItem.key}
                    onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 6.7 inch AMOLED)"
                    className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm"
                    value={specItem.value}
                    onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                  />
                  <Button
                    type="button"
                    color="error"
                    size="small"
                    onClick={() => removeSpecification(index)}
                    disabled={formFields.specifications.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Product Images ── */}
          <div className="col w-full py-4 border-t border-gray-100">
            <h3 className="font-[700] text-[16px] mb-3">
              Media &amp; Images <span className="text-red-500">*</span>
              <span className="text-[12px] font-[400] text-gray-400 ml-2">({previews.length} uploaded)</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              {previews.map((image, index) => (
                <div className="uploadBoxWrapper relative" key={index}>
                  <span
                    className="absolute w-[20px] h-[20px] rounded-full overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer"
                    onClick={() => removeImg(image, index)}
                  >
                    <IoMdClose className="text-white text-[17px]" />
                  </span>
                  <div className="uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-full bg-gray-100 flex items-center justify-center">
                    <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                </div>
              ))}
              <UploadBox
                fieldName="images"
                multiple={true}
                uploadFn={uploadProductImagesAPI}
                setPreviewsFun={setPreviewsFun}
              />
            </div>
          </div>

          {/* ── Banner Images ── */}
          <div className="col w-full py-4 border-t border-gray-100">
            <div className="bg-gray-50 border border-gray-200 p-4 w-full rounded-sm">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="font-[700] text-[16px]">Banner Images</h3>
                <Switch {...label} onChange={handleChangeSwitch} checked={checkedSwitch} />
                <span className="text-[12px] text-gray-400">
                  {checkedSwitch ? 'Will display on homepage banner' : 'Not on homepage banner'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                {bannerPreviews.map((image, index) => (
                  <div className="uploadBoxWrapper relative" key={index}>
                    <span
                      className="absolute w-[20px] h-[20px] rounded-full overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer"
                      onClick={() => removeBannerImg(image, index)}
                    >
                      <IoMdClose className="text-white text-[17px]" />
                    </span>
                    <div className="uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-full bg-gray-100 flex items-center justify-center">
                      <img src={image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  </div>
                ))}
                <UploadBox
                  fieldName="images"
                  multiple={true}
                  uploadFn={uploadProductImagesAPI}
                  setPreviewsFun={setBannerImagesFun}
                />
              </div>
              <div className="mt-4">
                <h3 className="font-[700] text-[14px] mb-2">Banner Title</h3>
                <input
                  type="text"
                  className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.5)] rounded-sm p-3 text-sm"
                  name="bannerTitleName"
                  value={formFields.bannerTitleName}
                  onChange={onChangeInput}
                  placeholder="Short catchy banner headline"
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── Info note for seller ── */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-[13px] text-blue-700 flex items-start gap-2">
          <span className="mt-0.5">ℹ️</span>
          <span>
            Your product will be submitted for <strong>admin review</strong> before going live on Zeedaddy.
            Make sure all details are accurate and images are clear.
          </span>
        </div>

        {/* ── Submit Button ── */}
        <hr />
        <br />
        <Button type="submit" className="btn-blue btn-lg w-full flex gap-2" disabled={isLoading}>
          {isLoading ? (
            <CircularProgress color="inherit" size={22} />
          ) : (
            <>
              <FaCloudUploadAlt className="text-[25px] text-white" />
              {isEdit ? 'Update Product' : 'Publish and Submit for Review'}
            </>
          )}
        </Button>

      </form>
    </section>
  );
};

export default AddProduct;