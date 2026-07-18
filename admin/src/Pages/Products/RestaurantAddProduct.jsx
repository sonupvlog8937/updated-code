import React, { useContext, useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import { IoMdClose } from 'react-icons/io';
import {
  FaUtensils, FaStore, FaImage, FaRupeeSign,
  FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle,
} from 'react-icons/fa';
import { MdCategory, MdInfo, MdRestaurantMenu } from 'react-icons/md';
import { MyContext } from '../../App';
import { deleteImages, fetchDataFromApi, postData } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../../Components/UploadBox';
import ProductSpecsEditor from '../../Components/ProductSpecsEditor';
import ProductOptionsEditor, { normalizeProductOptionsForSubmit } from '../../Components/ProductOptionsEditor';

const FOOD_TYPES = [
  { value: '', label: 'Not specified' },
  { value: 'Veg', label: 'Vegetarian' },
  { value: 'Non-Veg', label: 'Non-Vegetarian' },
  { value: 'Egg', label: 'Contains Egg' },
];

const RestaurantAddProduct = () => {
  const context = useContext(MyContext);
  const history = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menus, setMenus] = useState([]);
  const [menuId, setMenuId] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subSubCategoryId, setSubSubCategoryId] = useState('');
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    isFeatured: 'no',
    price: '',
    oldPrice: '',
    foodType: '',
    keywords: '',
    tags: '',
    searchKeywords: '',
    seoDescription: '',
    attributes: '',
    productType: '',
  });
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [productOptions, setProductOptions] = useState([{ name: '', label: '', values: [] }]);

  useEffect(() => {
    Promise.all([
      fetchDataFromApi('/api/go-market/restaurants?limit=1'),
      fetchDataFromApi('/api/go-market/categories?type=restaurant&limit=100&status=active'),
    ]).then(([restaurantRes, catRes]) => {
      const rest = restaurantRes?.data?.[0] || null;
      setRestaurant(rest);
      setCategories(catRes?.data || []);
      if (rest?._id) {
        fetchDataFromApi(`/api/go-market/menus/restaurant/${rest._id}?limit=50`).then((menuRes) => {
          const list = menuRes?.data || [];
          setMenus(list);
          if (list[0]?._id) setMenuId(list[0]._id);
          setLoadingMeta(false);
        });
      } else {
        setLoadingMeta(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      setSubCategoryId('');
      setSubSubCategories([]);
      setSubSubCategoryId('');
      return;
    }
    fetchDataFromApi(`/api/go-market/subcategories?parentId=${categoryId}&limit=100&status=active`).then((res) => {
      setSubCategories(res?.data || []);
    });
  }, [categoryId]);

  useEffect(() => {
    if (!subCategoryId) {
      setSubSubCategories([]);
      setSubSubCategoryId('');
      return;
    }
    fetchDataFromApi(`/api/go-market/subcategories?parentId=${subCategoryId}&limit=100&status=active`).then((res) => {
      setSubSubCategories(res?.data || []);
    });
  }, [subCategoryId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setPreviewsFun = (arr) => {
    setPreviews((prev) => [...prev, ...arr]);
  };

  const removeImg = (image, index) => {
    deleteImages(`/api/category/deteleImage?img=${image}`).then(() => {
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const checks = [
      [!restaurant, 'Your restaurant is not set up. Please complete registration with a market first.'],
      [!form.name.trim(), 'Enter dish / item name'],
      [!form.description.trim(), 'Enter item description'],
      [!categoryId, 'Select a category'],
      [!form.price, 'Enter price'],
      [previews.length === 0, 'Upload at least one food image'],
    ];
    for (const [fail, msg] of checks) {
      if (fail) {
        context.alertBox('error', msg);
        return;
      }
    }

    const specRows = specifications.filter((s) => s.key?.trim() && s.value?.trim());
    if (form.foodType) specRows.push({ key: 'Food type', value: form.foodType });
    const payload = {
      restaurantId: restaurant._id,
      menuId: menuId || undefined,
      itemName: form.name.trim(),
      title: (form.title || form.name).trim(),
      description: form.description.trim(),
      specifications: specRows,
      productOptions: normalizeProductOptionsForSubmit(productOptions),
      price: Number(form.price),
      discountPrice: form.oldPrice ? Number(form.oldPrice) : 0,
      image: previews[0],
      images: previews,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      subSubCategoryId: subSubCategoryId || undefined,
      isFeatured: form.isFeatured === 'yes',
      keywords: form.keywords.trim(),
      tags: form.tags.trim(),
      searchKeywords: form.searchKeywords.trim(),
      seoDescription: form.seoDescription.trim(),
      attributes: form.attributes.trim(),
      productType: form.productType.trim(),
      foodType: form.foodType,
    };

    setIsLoading(true);
    postData('/api/go-market/items', payload)
      .then((res) => {
        setIsLoading(false);
        if (res?.error === false || res?.success === true) {
          context.alertBox('success', res?.message || 'Menu item added to your restaurant!');
          context.setIsOpenFullScreenPanel({ open: false });
          history('/products');
        } else {
          context.alertBox('error', res?.message || 'Could not add menu item');
        }
      })
      .catch(() => {
        setIsLoading(false);
        context.alertBox('error', 'Could not add item. Please try again.');
      });
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
    border: '1px solid #fed7aa',
    borderRadius: 10,
    padding: '0 14px',
    fontSize: 14,
    color: '#7c2d12',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#c2410c',
    marginBottom: 6,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  };

  return (
    <section className="restaurant-add-product">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .restaurant-add-product {
          min-height: 100vh;
          background: linear-gradient(160deg, #fff7ed 0%, #ffedd5 40%, #f8fafc 100%);
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
        }
        .restaurant-add-product input:focus,
        .restaurant-add-product textarea:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
        }
        .restaurant-card {
          background: #fff;
          border: 1px solid #fed7aa;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(249, 115, 22, 0.1);
        }
        .restaurant-preview-card { position: sticky; top: 24px; }
        @media (max-width: 960px) {
          .restaurant-layout { grid-template-columns: 1fr !important; }
          .restaurant-preview-card { position: static; }
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
          background: '#ffedd5', color: '#c2410c', borderRadius: 999, fontSize: 11, fontWeight: 700,
          marginBottom: 8,
        }}>
          <FaUtensils size={10} /> RESTAURANT SELLER
        </span>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#7c2d12', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Add Menu Item
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0, maxWidth: 560 }}>
          Dish will appear on your Go Market restaurant menu for customers to order.
        </p>
      </div>

      {loadingMeta ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <CircularProgress sx={{ color: '#f97316' }} />
        </div>
      ) : !restaurant ? (
        <div className="restaurant-card" style={{ padding: 32, textAlign: 'center' }}>
          <FaExclamationCircle size={40} color="#f59e0b" style={{ marginBottom: 12 }} />
          <h3 style={{ color: '#111827', margin: '0 0 8px' }}>Restaurant not found</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Complete seller registration with a market to create your restaurant first.</p>
        </div>
      ) : (
        <div className="restaurant-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          <form onSubmit={handleSubmit}>
            <div className="restaurant-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22,
              }}>
                <FaStore />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Your restaurant</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{restaurant.restaurantName || 'My Restaurant'}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{restaurant.address || 'Go Market'}</div>
              </div>
            </div>

            <div className="restaurant-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdInfo size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Item details</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Name, description & food type</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Dish name *</label>
                  <input style={inputStyle} name="name" value={form.name} onChange={onChange} placeholder="e.g. Butter Chicken, Margherita Pizza" />
                </div>
                <div>
                  <label style={labelStyle}>Display title (product page)</label>
                  <input style={inputStyle} name="title" value={form.title} onChange={onChange} placeholder="Leave blank to use dish name" />
                </div>
                 <div>
                  <label style={labelStyle}>Featured dish</label>
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
                    placeholder="Ingredients, spice level, serving size…"
                    style={{ ...inputStyle, height: 100, padding: '12px 14px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Food type</label>
                  <Select size="small" sx={selectSx} name="foodType" value={form.foodType} onChange={onChange}>
                    {FOOD_TYPES.map((t) => (
                      <MenuItem key={t.value || 'none'} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label style={labelStyle}>Product type</label>
                  <input
                    style={inputStyle}
                    name="productType"
                    value={form.productType}
                    onChange={onChange}
                    placeholder="e.g. Main Course, Appetizer, Dessert"
                  />
                </div>
                <ProductSpecsEditor value={specifications} onChange={setSpecifications} accent="#ea580c" />
                <div style={{ marginTop: 16 }}>
                  <ProductOptionsEditor value={productOptions} onChange={setProductOptions} accent="#ea580c" />
                </div>
              </div>
            </div>

            <div className="restaurant-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdInfo size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>SEO & Search Optimization</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Help customers find your dish easily</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Search keywords</label>
                  <input
                    style={inputStyle}
                    name="searchKeywords"
                    value={form.searchKeywords}
                    onChange={onChange}
                    placeholder="e.g. butter chicken, chicken curry, mughlai (comma separated)"
                  />
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    Words users might search for to find this dish
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Product tags</label>
                  <input
                    style={inputStyle}
                    name="tags"
                    value={form.tags}
                    onChange={onChange}
                    placeholder="e.g. spicy, authentic, north indian (comma separated)"
                  />
                </div>
                <div>
                  <label style={labelStyle}>SEO keywords</label>
                  <input
                    style={inputStyle}
                    name="keywords"
                    value={form.keywords}
                    onChange={onChange}
                    placeholder="e.g. restaurant, food, delivery (comma separated)"
                  />
                </div>
                <div>
                  <label style={labelStyle}>SEO description</label>
                  <textarea
                    name="seoDescription"
                    value={form.seoDescription}
                    onChange={onChange}
                    placeholder="Short description for search engines (150-160 characters recommended)"
                    style={{ ...inputStyle, height: 80, padding: '12px 14px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Product attributes</label>
                  <textarea
                    name="attributes"
                    value={form.attributes}
                    onChange={onChange}
                    placeholder="e.g. cuisine: North Indian, spice level: Medium, serves: 2 (key: value format, one per line)"
                    style={{ ...inputStyle, height: 80, padding: '12px 14px', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            <div className="restaurant-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdRestaurantMenu size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Menu</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Which menu this item belongs to</div>
                </div>
              </div>
              {menus.length === 0 ? (
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  No menu yet — a default &quot;Main Menu&quot; will be created automatically when you save.
                </p>
              ) : (
                <div>
                  <label style={labelStyle}>Select menu</label>
                  <Select size="small" sx={selectSx} value={menuId} displayEmpty onChange={(e) => setMenuId(e.target.value)}>
                    <MenuItem value="" disabled>Select menu</MenuItem>
                    {menus.map((m) => (
                      <MenuItem key={m._id} value={m._id}>{m.menuName}</MenuItem>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <div className="restaurant-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdCategory size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Category</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Admin-created restaurant categories</div>
                </div>
              </div>
              {categories.length === 0 ? (
                <div style={{ padding: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
                  No categories yet. Ask <strong>admin</strong> to add restaurant categories first.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <Select size="small" sx={selectSx} value={categoryId} displayEmpty
                      onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(''); setSubSubCategoryId(''); }}>
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
              {subCategories.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Sub-sub category</label>
                  <Select size="small" sx={selectSx} value={subSubCategoryId} displayEmpty disabled={!subCategoryId}
                    onChange={(e) => setSubSubCategoryId(e.target.value)}>
                    <MenuItem value="">Optional</MenuItem>
                    {subSubCategories.map((ssc) => <MenuItem key={ssc._id} value={ssc._id}>{ssc.name}</MenuItem>)}
                  </Select>
                </div>
              )}
            </div>

            <div className="restaurant-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaRupeeSign size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Price</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Selling price for this dish</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(160px, 220px))', gap: 14 }}>
                <div>
                  <label style={labelStyle}>MRP / Base price (₹) *</label>
                  <input style={inputStyle} type="number" name="price" value={form.price} onChange={onChange} placeholder="199" min="0" />
                </div>
                <div>
                  <label style={labelStyle}>Offer price (₹)</label>
                  <input style={inputStyle} type="number" name="oldPrice" value={form.oldPrice} onChange={onChange} placeholder="Optional discount price" min="0" />
                </div>
              </div>
            </div>

            <div className="restaurant-card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fce7f3', color: '#be185d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaImage size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Food photo *</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Appetizing image increases orders</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                {previews.map((image, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <button type="button" onClick={() => removeImg(image, index)}
                      style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#dc2626', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 2 }}>
                      <IoMdClose size={14} />
                    </button>
                    <div style={{ borderRadius: 12, overflow: 'hidden', height: 110, border: '2px solid #fed7aa' }}>
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
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)', opacity: isLoading ? 0.75 : 1,
              }}>
              {isLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : (
                <><FaCloudUploadAlt size={18} /> Publish to my restaurant menu</>
              )}
            </button>
          </form>

          <aside className="restaurant-preview-card">
            <div className="restaurant-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 14 }}>Live preview</div>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <div style={{
                  height: 180,
                  background: previews[0] ? `url(${previews[0]}) center/cover` : 'linear-gradient(135deg, #ffedd5, #fdba74)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!previews[0] && <FaUtensils size={48} color="#fb923c" style={{ opacity: 0.6 }} />}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                    {form.name || 'Dish name'}
                    {form.foodType && (
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: form.foodType === 'Veg' ? '#dcfce7' : '#fee2e2', color: form.foodType === 'Veg' ? '#166534' : '#991b1b' }}>
                        {form.foodType}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                    {form.description ? `${form.description.slice(0, 80)}${form.description.length > 80 ? '…' : ''}` : 'Description'}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#ea580c' }}>₹{form.price || '—'}</div>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', fontSize: 13, color: '#4b5563' }}>
                {[
                  [categoryId, 'Category selected'],
                  [previews.length, 'Photo added'],
                  [form.price, 'Price set'],
                  [form.name.trim(), 'Name entered'],
                ].map(([ok, text], i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: ok ? '#ea580c' : '#9ca3af' }}>
                    <FaCheckCircle size={14} /> {text}
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

export default RestaurantAddProduct;