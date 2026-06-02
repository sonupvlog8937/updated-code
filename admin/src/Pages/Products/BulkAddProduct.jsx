import React, { useContext, useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import { FaLeaf, FaStore, FaImage, FaRupeeSign, FaBoxes, FaTag, FaCloudUploadAlt, FaCheckCircle, FaTrash } from 'react-icons/fa';
import { MdCategory, MdInfo } from 'react-icons/md';
import { MyContext } from '../../App';
import { deleteImages, fetchDataFromApi, postData } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../../Components/UploadBox';
import ProductSpecsEditor from '../../Components/ProductSpecsEditor';
import ProductOptionsEditor, { normalizeProductOptionsForSubmit } from '../../Components/ProductOptionsEditor';
import { Button } from '@mui/material';

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

const BulkAddProduct = () => {
  const context = useContext(MyContext);
  const history = useNavigate();

  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Multiple products state
  const [products, setProducts] = useState([
    {
      id: 1,
      name: '',
      title: '',
      description: '',
      price: '',
      oldPrice: '',
      countInStock: '',
      unit: 'piece',
      categoryId: '',
      subCategoryId: '',
      isFeatured: 'no',
      previews: [],
      specifications: [{ key: '', value: '' }],
      productOptions: [{ name: '', label: '', values: [] }],
    }
  ]);

  const [subCategoriesMap, setSubCategoriesMap] = useState({});

  useEffect(() => {
    Promise.all([
      fetchDataFromApi('/api/go-market/grocery-shops?limit=1'),
      fetchDataFromApi('/api/go-market/categories?type=grocery&limit=100&status=active'),
    ]).then(([shopRes, catRes]) => {
      setShop(shopRes?.data?.[0] || null);
      setCategories(catRes?.data || []);
      setLoadingMeta(false);
    });
  }, []);

  // Load subcategories when category changes
  const loadSubCategories = async (catId) => {
    if (!catId || subCategoriesMap[catId]) return;
    const res = await fetchDataFromApi(`/api/go-market/subcategories?parentId=${catId}&limit=100&status=active`);
    setSubCategoriesMap(prev => ({ ...prev, [catId]: res?.data || [] }));
  };

  const addProduct = () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts([...products, {
      id: newId,
      name: '',
      title: '',
      description: '',
      price: '',
      oldPrice: '',
      countInStock: '',
      unit: 'piece',
      categoryId: '',
      subCategoryId: '',
      isFeatured: 'no',
      previews: [],
      specifications: [{ key: '', value: '' }],
      productOptions: [{ name: '', label: '', values: [] }],
    }]);
  };

  const removeProduct = (productId) => {
    if (products.length === 1) {
      context.alertBox('error', 'You must have at least one product');
      return;
    }
    setProducts(products.filter(p => p.id !== productId));
  };

  const updateProduct = (productId, field, value) => {
    setProducts(products.map(p => p.id === productId ? { ...p, [field]: value } : p));
  };

  const updateNestedProduct = (productId, field, value) => {
    setProducts(products.map(p => p.id === productId ? { ...p, [field]: value } : p));
  };

  const setProductPreviews = (productId, arr) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, previews: [...p.previews, ...arr] } : p
    ));
  };

  const removeProductImage = (productId, image, index) => {
    deleteImages(`/api/category/deteleImage?img=${image}`).then(() => {
      setProducts(products.map(p =>
        p.id === productId ? { ...p, previews: p.previews.filter((_, i) => i !== index) } : p
      ));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const checks = [
      [!shop, 'Your grocery shop is not set up. Please contact support.'],
    ];
    
    for (const [fail, msg] of checks) {
      if (fail) {
        context.alertBox('error', msg);
        return;
      }
    }

    // Validate all products
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const errors = [];
      if (!p.name.trim()) errors.push('Product name');
      if (!p.description.trim()) errors.push('Product description');
      if (!p.categoryId) errors.push('Category');
      if (!p.price) errors.push('Price');
      if (!p.countInStock) errors.push('Stock');
      if (p.previews.length === 0) errors.push('Images');

      if (errors.length > 0) {
        context.alertBox('error', `Product ${i + 1}: Please fill in ${errors.join(', ')}`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = products.map(p => {
        const sellingPrice = p.oldPrice || p.price;
        const unitLabel = UNITS.find((u) => u.value === p.unit)?.label?.replace('Per ', '') || p.unit;
        const specRows = p.specifications.filter((s) => s.key?.trim() && s.value?.trim());
        if (unitLabel) specRows.push({ key: 'Unit', value: unitLabel });

        return {
          shopId: shop._id,
          name: p.name.trim(),
          title: (p.title || p.name).trim(),
          description: p.description.trim(),
          specifications: specRows,
          productOptions: normalizeProductOptionsForSubmit(p.productOptions),
          price: Number(p.price),
          discountPrice: Number(sellingPrice),
          stock: Number(p.countInStock),
          image: p.previews[0],
          images: p.previews,
          categoryId: p.categoryId || undefined,
          subCategoryId: p.subCategoryId || undefined,
          isFeatured: p.isFeatured === 'yes',
        };
      });

      const res = await postData('/api/go-market/products/bulk', payload);
      
      setIsLoading(false);
      if (res?.error === false || res?.success === true) {
        context.alertBox('success', `${products.length} products added successfully!`);
        context.setIsOpenFullScreenPanel({ open: false });
        history('/products');
      } else {
        context.alertBox('error', res?.message || 'Could not add products');
      }
    } catch (err) {
      setIsLoading(false);
      context.alertBox('error', 'Error adding products. Please try again.');
    }
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
        .product-item {
          background: #f0fdf4;
          border: 2px solid #d1fae5;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          position: relative;
        }
        .product-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #d1fae5;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            background: '#d1fae5', color: '#047857', borderRadius: 999, fontSize: 11, fontWeight: 700,
          }}>
            <FaLeaf size={10} /> BULK ADD GROCERY PRODUCTS
          </span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#064e3b', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Add Multiple Products
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0, maxWidth: 560 }}>
          Add multiple grocery products at once to your Go Market shop. Each product can have different specifications, options, prices, and images.
        </p>
      </div>

      {loadingMeta ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <CircularProgress sx={{ color: '#10b981' }} />
        </div>
      ) : !shop ? (
        <div className="grocery-card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
          <h3 style={{ color: '#111827', margin: '0 0 8px' }}>Grocery shop not found</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Complete seller registration first.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Shop info */}
          <div className="grocery-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22,
            }}>
              <FaStore />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Listing in shop</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{shop.shopName}</div>
            </div>
          </div>

          {/* Products list */}
          {products.map((product, idx) => (
            <div key={product.id} className="product-item">
              <div className="product-item-header">
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#064e3b' }}>
                  Product {idx + 1}
                </h3>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#fee2e2',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Product name *</label>
                  <input
                    style={inputStyle}
                    value={product.name}
                    onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                    placeholder="e.g. Fresh Tomatoes"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Display title</label>
                  <input
                    style={inputStyle}
                    value={product.title}
                    onChange={(e) => updateProduct(product.id, 'title', e.target.value)}
                    placeholder="Leave blank to use product name"
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Description *</label>
                <textarea
                  value={product.description}
                  onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                  placeholder="Freshness, origin, storage tips…"
                  style={{ ...inputStyle, height: 80, padding: '12px 14px', resize: 'vertical' }}
                />
              </div>

              {/* Category & Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <Select
                    size="small"
                    sx={selectSx}
                    value={product.categoryId}
                    onChange={(e) => {
                      const catId = e.target.value;
                      loadSubCategories(catId);
                      updateProduct(product.id, 'categoryId', catId);
                      updateProduct(product.id, 'subCategoryId', '');
                    }}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label style={labelStyle}>Unit *</label>
                  <Select
                    size="small"
                    sx={selectSx}
                    value={product.unit}
                    onChange={(e) => updateProduct(product.id, 'unit', e.target.value)}
                  >
                    {UNITS.map((u) => (
                      <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label style={labelStyle}>Featured</label>
                  <Select
                    size="small"
                    sx={selectSx}
                    value={product.isFeatured}
                    onChange={(e) => updateProduct(product.id, 'isFeatured', e.target.value)}
                  >
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                  </Select>
                </div>
              </div>

              {/* Price & Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>MRP (₹) *</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={product.price}
                    onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                    placeholder="100"
                    min="0"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Selling price (₹)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={product.oldPrice}
                    onChange={(e) => updateProduct(product.id, 'oldPrice', e.target.value)}
                    placeholder="Same as MRP"
                    min="0"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Stock qty *</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={product.countInStock}
                    onChange={(e) => updateProduct(product.id, 'countInStock', e.target.value)}
                    placeholder="50"
                    min="0"
                  />
                </div>
              </div>

              {/* Product Options & Specs (collapsed) */}
              <details style={{ marginBottom: 16, borderTop: '1px solid #d1fae5', paddingTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                  + Advanced options (specifications, sizes, colors, etc.)
                </summary>
                <div style={{ marginTop: 12 }}>
                  <ProductSpecsEditor
                    value={product.specifications}
                    onChange={(specs) => updateNestedProduct(product.id, 'specifications', specs)}
                    accent="#059669"
                  />
                  <div style={{ marginTop: 16 }}>
                    <ProductOptionsEditor
                      value={product.productOptions}
                      onChange={(opts) => updateNestedProduct(product.id, 'productOptions', opts)}
                      accent="#059669"
                    />
                  </div>
                </div>
              </details>

              {/* Images */}
              <div>
                <label style={labelStyle}>Product photos *</label>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 12px', fontStyle: 'italic' }}>
                  Upload at least one image
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                  {product.previews.map((image, imgIdx) => (
                    <div key={imgIdx} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => removeProductImage(product.id, image, imgIdx)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#dc2626',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                      <div style={{ borderRadius: 12, overflow: 'hidden', height: 110, border: '2px solid #d1fae5' }}>
                        <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                  ))}
                  <UploadBox
                    multiple
                    name="images"
                    url="/api/product/uploadImages"
                    setPreviewsFun={(arr) => setProductPreviews(product.id, arr)}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add product button */}
          <div style={{ marginBottom: 24 }}>
            <Button
              type="button"
              onClick={addProduct}
              variant="outlined"
              fullWidth
              sx={{
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 700,
                color: '#047857',
                borderColor: '#d1fae5',
                textTransform: 'none',
                '&:hover': { borderColor: '#047857', background: '#f0fdf4' },
              }}
            >
              + Add Another Product
            </Button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              height: 52,
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
              opacity: isLoading ? 0.75 : 1,
            }}
          >
            {isLoading ? (
              <CircularProgress size={22} sx={{ color: '#fff' }} />
            ) : (
              <>
                <FaCloudUploadAlt size={18} /> Add {products.length} Product{products.length !== 1 ? 's' : ''} to My Shop
              </>
            )}
          </button>
        </form>
      )}
    </section>
  );
};

export default BulkAddProduct;
