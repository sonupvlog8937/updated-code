import React, { useContext, useEffect, useMemo, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import { IoMdClose } from 'react-icons/io';
import {
  FaLeaf, FaStore, FaImage, FaRupeeSign, FaBoxes, FaTag,
  FaSave, FaCheckCircle, FaExclamationCircle,
} from 'react-icons/fa';
import { MdCategory, MdInfo } from 'react-icons/md';
import { MyContext } from '../../App';
import { deleteImages, editData, fetchDataFromApi } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../../Components/UploadBox';
import ProductSpecsEditor from '../../Components/ProductSpecsEditor';
import ProductOptionsEditor, { normalizeProductOptionsForSubmit } from '../../Components/ProductOptionsEditor';

const UNITS = [
  { value: 'piece', label: 'Per Piece' },
  { value: 'kg', label: 'Per Kg' },
  { value: 'g', label: 'Per Gram' },
  { value: 'L', label: 'Per Litre' },
  { value: 'ml', label: 'Per ml' },
  { value: 'dozen', label: 'Per Dozen' },
  { value: 'pack', label: 'Per Pack' },
  { value: 'bundle', label: 'Per Bundle' },
];

const GroceryEditProduct = () => {
  const context = useContext(MyContext);
  const history = useNavigate();
  const productId = context?.isOpenFullScreenPanel?.id;

  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    price: '',
    oldPrice: '',
    countInStock: '',
    unit: 'piece',
    isFeatured: 'no',
  });
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [productOptions, setProductOptions] = useState([{ name: '', label: '', values: [] }]);

  useEffect(() => {
    if (!productId) return;

    Promise.all([
      fetchDataFromApi('/api/go-market/grocery-shops?limit=1'),
      fetchDataFromApi('/api/go-market/categories?type=grocery&limit=100&status=active'),
      fetchDataFromApi(`/api/go-market/products/${productId}`).catch(() => 
        fetchDataFromApi(`/api/product/${productId}`)
      ),
    ]).then(([shopRes, catRes, prodRes]) => {
      setShop(shopRes?.data?.[0] || null);
      setCategories(catRes?.data || []);

      // Handle different API response structures
      let p = prodRes;
      
      // Check various nesting levels
      if (prodRes?.data) {
        if (Array.isArray(prodRes.data)) {
          p = prodRes.data[0]; // If data is array, take first item
        } else if (typeof prodRes.data === 'object') {
          p = prodRes.data; // If data is object, use it
        }
      } else if (prodRes?.product) {
        p = prodRes.product;
      }

      console.log('Grocery Edit - Product data loaded:', p);

      if (p && typeof p === 'object') {
        const specs = p.specifications || p.specs || [];
        const unitSpec = specs.find(s => s.key === 'Unit');
        let unitValue = 'piece';
        if (unitSpec) {
          const found = UNITS.find(u => u.label.includes(unitSpec.value) || u.value === unitSpec.value);
          if (found) unitValue = found.value;
        }

        setForm({
          name: p.name || '',
          title: p.title || '',
          description: p.description || '',
          price: String(p.price || p.discountPrice || ''),
          oldPrice: String(p.oldPrice || p.price || p.discountPrice || ''),
          countInStock: String(p.countInStock ?? p.stock ?? 0),
          unit: unitValue,
          isFeatured: p.isFeatured ? 'yes' : 'no',
        });

        setCategoryId(p.categoryId || p.goMarketCategoryId || '');
        setSubCategoryId(p.subCategoryId || p.goMarketSubCategoryId || '');

        if (Array.isArray(specs) && specs.length > 0) {
          const filteredSpecs = specs.filter(s => s.key !== 'Unit');
          setSpecifications(filteredSpecs.length > 0 ? filteredSpecs : [{ key: '', value: '' }]);
        }

        const opts = p.productOptions || p.options || [];
        if (Array.isArray(opts) && opts.length > 0) {
          setProductOptions(opts);
        }

        let imgs = [];
        if (Array.isArray(p.images)) {
          imgs = p.images;
        } else if (p.image && typeof p.image === 'string') {
          imgs = [p.image];
        }
        if (imgs.length > 0) {
          setPreviews(imgs);
        }
      } else {
        console.error('Grocery Edit - Invalid product data structure:', prodRes);
      }

      setLoadingMeta(false);
    }).catch((err) => {
      console.error('Error loading product:', err);
      context.alertBox('error', 'Could not load product details');
      setLoadingMeta(false);
    });
  }, [productId]);

  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      setSubCategoryId('');
      return;
    }
    fetchDataFromApi(`/api/go-market/subcategories?parentId=${categoryId}&limit=100&status=active`).then((res) => {
      setSubCategories(res?.data || []);
    });
  }, [categoryId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setPreviewsFun = (arr) => {
    const combined = [...previews, ...arr];
    setPreviews(combined);
  };

  const removeImg = (image, index) => {
    deleteImages(`/api/category/deteleImage?img=${image}`).then(() => {
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    });
  };

  const discountPercent = useMemo(() => {
    const mrp = Number(form.price);
    const sell = Number(form.oldPrice);
    if (!mrp || !sell || sell >= mrp) return 0;
    return Math.round(((mrp - sell) / mrp) * 100);
  }, [form.price, form.oldPrice]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const checks = [
      [!shop, 'Your grocery shop is not set up. Please contact support or complete registration.'],
      [!form.name.trim(), 'Enter product name'],
      [!form.description.trim(), 'Enter product description'],
      [!categoryId, 'Select a category'],
      [!form.price, 'Enter MRP / price'],
      [!form.countInStock, 'Enter stock quantity'],
      [previews.length === 0, 'Upload at least one product image'],
    ];
    for (const [fail, msg] of checks) {
      if (fail) {
        context.alertBox('error', msg);
        return;
      }
    }

    const sellingPrice = form.oldPrice || form.price;
    const unitLabel = UNITS.find((u) => u.value === form.unit)?.label?.replace('Per ', '') || form.unit;
    const specRows = specifications.filter((s) => s.key?.trim() && s.value?.trim());
    if (unitLabel) specRows.push({ key: 'Unit', value: unitLabel });
    
    const payload = {
      name: form.name.trim(),
      title: (form.title || form.name).trim(),
      description: form.description.trim(),
      specifications: specRows,
      productOptions: normalizeProductOptionsForSubmit(productOptions),
      price: Number(form.price),
      discountPrice: Number(sellingPrice),
      oldPrice: Number(form.oldPrice || form.price),
      stock: Number(form.countInStock),
      countInStock: Number(form.countInStock),
      image: previews[0],
      images: previews,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      goMarketCategoryId: categoryId || undefined,
      goMarketSubCategoryId: subCategoryId || undefined,
      isFeatured: form.isFeatured === 'yes',
    };

    setIsLoading(true);
    editData(`/api/go-market/products/${productId}`, payload)
      .then((res) => {
        if (res?.error === false || res?.success === true) {
          context.alertBox('success', res?.message || 'Product updated successfully!');
          setTimeout(() => {
            context.setIsOpenFullScreenPanel({ open: false });
          }, 1000);
        } else {
          throw new Error(res?.message || 'Update failed');
        }
      })
      .catch((err) => {
        console.error('Update error:', err);
        editData(`/api/product/updateProduct/${productId}`, payload)
          .then((res) => {
            if (res?.data?.error === false) {
              context.alertBox('success', res?.data?.message || 'Product updated successfully!');
              setTimeout(() => {
                context.setIsOpenFullScreenPanel({ open: false });
              }, 1000);
            } else {
              context.alertBox('error', res?.data?.message || 'Could not update product');
            }
          })
          .catch(() => context.alertBox('error', 'Could not update product. Please try again.'))
          .finally(() => setIsLoading(false));
      })
      .finally(() => setIsLoading(false));
  };

  const selectSx = {
    width: '100%',
    fontSize: 13,
    background: '#fff',
    borderRadius: '10px',
    '& .MuiOutlinedInput-root': { borderRadius: '10px', minHeight: 44 },
  };

  const inputStyle = {
    width: '100%',
    height: 44,
    border: '1px solid #d1fae5',
    borderRadius: 10,
    padding: '0 14px',
    fontSize: 14,
    color: '#064e3b',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#047857',
    marginBottom: 6,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  };

  return (
    <section className="grocery-add-product">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .grocery-add-product {
          min-height: 100vh;
          background: linear-gradient(160deg, #ecfdf5 0%, #f0fdf4 40%, #f8fafc 100%);
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
        }
        .grocery-add-product input:focus,
        .grocery-add-product textarea:focus,
        .grocery-add-product select:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        .grocery-card {
          background: #fff;
          border: 1px solid #d1fae5;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(16, 185, 129, 0.08);
        }
        .grocery-preview-card {
          position: sticky;
          top: 24px;
        }
        @media (max-width: 960px) {
          .grocery-layout { grid-template-columns: 1fr !important; }
          .grocery-preview-card { position: static; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            background: '#d1fae5', color: '#047857', borderRadius: 999, fontSize: 11, fontWeight: 700,
          }}>
            <FaLeaf size={10} /> GROCERY SELLER
          </span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#064e3b', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Edit Grocery Product
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0, maxWidth: 560 }}>
          Update product details — changes will be reflected in your Go Market grocery shop.
        </p>
      </div>

      {loadingMeta ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <CircularProgress sx={{ color: '#10b981' }} />
        </div>
      ) : !shop ? (
        <div className="grocery-card" style={{ padding: 32, textAlign: 'center' }}>
          <FaExclamationCircle size={40} color="#f59e0b" style={{ marginBottom: 12 }} />
          <h3 style={{ color: '#111827', margin: '0 0 8px' }}>Grocery shop not found</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Complete seller registration with a market to create your shop first.</p>
        </div>
      ) : (
        <div className="grocery-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Shop banner */}
            <div className="grocery-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22,
              }}>
                <FaStore />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Updating product in</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{shop.shopName || 'My Grocery Shop'}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{shop.address || 'Go Market store'}</div>
              </div>
            </div>

            <div className="grocery-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdInfo size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Product details</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Name, description & unit</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Product name *</label>
                  <input style={inputStyle} name="name" value={form.name} onChange={onChange} placeholder="e.g. Fresh Tomatoes, Amul Milk 1L" />
                </div>
                <div>
                  <label style={labelStyle}>Display title (product page)</label>
                  <input style={inputStyle} name="title" value={form.title} onChange={onChange} placeholder="Leave blank to use product name" />
                </div>
                <div>
                  <label style={labelStyle}>Featured product</label>
                  <Select size="small" sx={selectSx} name="isFeatured" value={form.isFeatured} onChange={onChange}>
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                  </Select>
                </div>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    placeholder="Freshness, origin, storage tips…"
                    style={{ ...inputStyle, height: 100, padding: '12px 14px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Sold as *</label>
                  <Select size="small" sx={selectSx} name="unit" value={form.unit} onChange={onChange}>
                    {UNITS.map((u) => (
                      <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
                    ))}
                  </Select>
                </div>
                <ProductSpecsEditor value={specifications} onChange={setSpecifications} accent="#059669" />
                <div style={{ marginTop: 16 }}>
                  <ProductOptionsEditor value={productOptions} onChange={setProductOptions} accent="#059669" />
                </div>
              </div>
            </div>

            <div className="grocery-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdCategory size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Category</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Go Market grocery categories</div>
                </div>
              </div>

              {categories.length === 0 ? (
                <div style={{ padding: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
                  No categories available yet. Please ask the <strong>admin</strong> to add grocery categories — you can then select them here.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <Select size="small" sx={selectSx} value={categoryId} displayEmpty
                      onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(''); }}>
                      <MenuItem value="" disabled>Select category</MenuItem>
                      {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                    </Select>
                  </div>
                  <div>
                    <label style={labelStyle}>Sub category</label>
                    <Select size="small" sx={selectSx} value={subCategoryId} displayEmpty disabled={!categoryId}
                      onChange={(e) => setSubCategoryId(e.target.value)}>
                      <MenuItem value="">Optional</MenuItem>
                      {subCategories.map((sc) => <MenuItem key={sc._id} value={sc._id}>{sc.name}</MenuItem>)}
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="grocery-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaRupeeSign size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Price & stock</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>MRP, selling price and availability</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                <div>
                  <label style={labelStyle}>MRP (₹) *</label>
                  <input style={inputStyle} type="number" name="price" value={form.price} onChange={onChange} placeholder="100" min="0" />
                </div>
                <div>
                  <label style={labelStyle}>Selling price (₹)</label>
                  <input style={inputStyle} type="number" name="oldPrice" value={form.oldPrice} onChange={onChange} placeholder="Same as MRP" min="0" />
                </div>
                <div>
                  <label style={labelStyle}>Stock qty *</label>
                  <input style={inputStyle} type="number" name="countInStock" value={form.countInStock} onChange={onChange} placeholder="50" min="0" />
                </div>
              </div>
              {discountPercent > 0 && (
                <div style={{ marginTop: 12, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                  <FaTag size={12} style={{ marginRight: 6 }} />
                  {discountPercent}% off for customers
                </div>
              )}
            </div>

            <div className="grocery-card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaImage size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Product photo *</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Clear image helps sales</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                {previews.map((image, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <button type="button" onClick={() => removeImg(image, index)}
                      style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#dc2626', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IoMdClose size={14} />
                    </button>
                    <div style={{ borderRadius: 12, overflow: 'hidden', height: 110, border: '2px solid #d1fae5' }}>
                      <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                ))}
                <UploadBox multiple name="images" url="/api/product/uploadImages" setPreviewsFun={setPreviewsFun} />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              style={{
                width: '100%', height: 52, border: 'none', borderRadius: 12, cursor: 'pointer',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)', opacity: isLoading ? 0.75 : 1,
              }}>
              {isLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : (
                <><FaSave size={18} /> Save Changes</>
              )}
            </button>
          </form>

          {/* Preview */}
          <aside className="grocery-preview-card">
            <div className="grocery-card" style={{ padding: 20, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.06em' }}>
                Live preview
              </div>
              <div style={{
                borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb',
                background: '#f9fafb', marginBottom: 16,
              }}>
                <div style={{ height: 180, background: previews[0] ? `url(${previews[0]}) center/cover` : 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!previews[0] && <FaBoxes size={48} color="#6ee7b7" style={{ opacity: 0.6 }} />}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                    {form.name || 'Product name'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.5, minHeight: 36 }}>
                    {form.description ? form.description.slice(0, 80) + (form.description.length > 80 ? '…' : '') : 'Description appears here'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>
                      ₹{form.oldPrice || form.price || '—'}
                    </span>
                    {form.oldPrice && form.price && Number(form.oldPrice) < Number(form.price) && (
                      <span style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>₹{form.price}</span>
                    )}
                    <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 6 }}>
                      / {UNITS.find((u) => u.value === form.unit)?.label?.replace('Per ', '') || 'unit'}
                    </span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: form.countInStock > 0 ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                    {form.countInStock ? `${form.countInStock} in stock` : 'Out of stock'}
                  </div>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: '#4b5563' }}>
                {[
                  [FaCheckCircle, categoryId ? categories.find((c) => c._id === categoryId)?.name : 'Select category', !!categoryId],
                  [FaCheckCircle, previews.length ? 'Photo added' : 'Add photo', previews.length > 0],
                  [FaCheckCircle, form.price ? 'Price set' : 'Set price', !!form.price],
                  [FaCheckCircle, form.countInStock ? 'Stock set' : 'Set stock', !!form.countInStock],
                ].map(([Icon, text, done], i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: done ? '#059669' : '#9ca3af' }}>
                    <Icon size={14} /> {text}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default GroceryEditProduct;
