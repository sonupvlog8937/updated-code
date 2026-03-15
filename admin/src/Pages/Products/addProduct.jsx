import React, { useContext, useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Rating from '@mui/material/Rating';
import UploadBox from '../../Components/UploadBox';
import { IoMdClose } from 'react-icons/io';
import { Button, Switch, Tooltip, Chip } from '@mui/material';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { MdImage, MdInfo, MdLocalOffer, MdCategory, MdSell } from 'react-icons/md';
import { TbColorFilter, TbListDetails } from 'react-icons/tb';
import { MyContext } from '../../App';
import { deleteImages, fetchDataFromApi, postData } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

const switchLabel = { inputProps: { 'aria-label': 'Switch demo' } };

/* ─── Reusable styled components ─── */
const inp = {
    width: '100%', height: 40, border: '1px solid #d1d5db', borderRadius: 8,
    padding: '0 12px', fontSize: 13, color: '#111827', outline: 'none',
    background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
};
const inpFocus = { borderColor: '#6366f1' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, letterSpacing: '0.02em' };
const sectionCard = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
    overflow: 'hidden', marginBottom: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};
const sectionHead = (color) => ({
    padding: '13px 18px', borderBottom: '1px solid #f3f4f6',
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#fafafa',
});
const sectionIcon = (bg, color) => ({
    width: 30, height: 30, borderRadius: 8, background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 15, flexShrink: 0,
});
const sectionBody = { padding: '18px 18px 20px' };
const g2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 };
const g3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 };

const SectionCard = ({ icon, iconBg, iconColor, title, subtitle, children }) => (
    <div style={sectionCard}>
        <div style={sectionHead()}>
            <div style={sectionIcon(iconBg, iconColor)}>{icon}</div>
            <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</div>
                {subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{subtitle}</div>}
            </div>
        </div>
        <div style={sectionBody}>{children}</div>
    </div>
);

const Field = ({ label: lbText, children, span }) => (
    <div style={span ? { gridColumn: '1 / -1' } : {}}>
        <label style={lbl}>{lbText}</label>
        {children}
    </div>
);

const AddProduct = () => {
    const [formFields, setFormFields] = useState({
        name: '', description: '', images: [], brand: '', keywords: '',
        price: '', oldPrice: '', category: '', catName: '', catId: '',
        subCatId: '', subCat: '', thirdsubCat: '', thirdsubCatId: '',
        countInStock: '', rating: '', isFeatured: false, discount: '', sale: 0,
        productRam: [], size: [], productWeight: [],
        colorOptions: [{ name: '', code: '', images: '' }],
        specifications: [{ key: '', value: '' }],
        bannerTitleName: '', bannerimages: [], isDisplayOnHomeBanner: false,
    });

    const [productCat, setProductCat] = useState('');
    const [productSubCat, setProductSubCat] = useState('');
    const [productFeatured, setProductFeatured] = useState('');
    const [productRams, setProductRams] = useState([]);
    const [productRamsData, setProductRamsData] = useState([]);
    const [productWeight, setProductWeight] = useState([]);
    const [productWeightData, setProductWeightData] = useState([]);
    const [productSize, setProductSize] = useState([]);
    const [productSizeData, setProductSizeData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [productThirdLavelCat, setProductThirdLavelCat] = useState('');
    const [previews, setPreviews] = useState([]);
    const [bannerPreviews, setBannerPreviews] = useState([]);
    const [checkedSwitch, setCheckedSwitch] = useState(false);

    const history = useNavigate();
    const context = useContext(MyContext);
    const selectedCategory = context?.catData?.find((cat) => cat?._id === productCat);
    const availableSubCategories = selectedCategory?.children || [];
    const selectedSubCategory = availableSubCategories?.find((sc) => sc?._id === productSubCat);
    const availableThirdLevelCategories = selectedSubCategory?.children || [];

    useEffect(() => {
        fetchDataFromApi('/api/product/productRAMS/get').then((res) => { if (res?.error === false) setProductRamsData(res?.data); });
        fetchDataFromApi('/api/product/productWeight/get').then((res) => { if (res?.error === false) setProductWeightData(res?.data); });
        fetchDataFromApi('/api/product/productSize/get').then((res) => { if (res?.error === false) setProductSizeData(res?.data); });
    }, []);

    const handleChangeProductCat = (e) => {
        const id = e.target.value;
        const cat = context?.catData?.find((c) => c?._id === id);
        setProductCat(id); setProductSubCat(''); setProductThirdLavelCat('');
        formFields.catId = id; formFields.category = id; formFields.catName = cat?.name || '';
        formFields.subCatId = ''; formFields.subCat = ''; formFields.thirdsubCatId = ''; formFields.thirdsubCat = '';
    };
    const handleChangeProductSubCat = (e) => {
        const id = e.target.value;
        const sc = availableSubCategories?.find((s) => s?._id === id);
        setProductSubCat(id); setProductThirdLavelCat('');
        formFields.subCatId = id; formFields.subCat = sc?.name || '';
        formFields.thirdsubCatId = ''; formFields.thirdsubCat = '';
    };
    const handleChangeProductThirdLavelCat = (e) => {
        const id = e.target.value;
        const tc = availableThirdLevelCategories?.find((t) => t?._id === id);
        setProductThirdLavelCat(id);
        formFields.thirdsubCatId = id; formFields.thirdsubCat = tc?.name || '';
    };
    const handleChangeProductFeatured = (e) => { setProductFeatured(e.target.value); formFields.isFeatured = e.target.value; };
    const handleChangeProductRams = (e) => { const v = e.target.value; setProductRams(typeof v === 'string' ? v.split(',') : v); formFields.productRam = v; };
    const handleChangeProductWeight = (e) => { const v = e.target.value; setProductWeight(typeof v === 'string' ? v.split(',') : v); formFields.productWeight = v; };
    const handleChangeProductSize = (e) => { const v = e.target.value; setProductSize(typeof v === 'string' ? v.split(',') : v); formFields.size = v; };
    const onChangeInput = (e) => { const { name, value } = e.target; setFormFields((p) => ({ ...p, [name]: value })); };
    const onChangeRating = (e) => { setFormFields((p) => ({ ...p, rating: e.target.value })); };
    const handleChangeSwitch = (e) => { setCheckedSwitch(e.target.checked); formFields.isDisplayOnHomeBanner = e.target.checked; };

    const handleColorOptionChange = (i, field, value) => {
        const arr = [...formFields.colorOptions]; arr[i] = { ...arr[i], [field]: value };
        setFormFields((p) => ({ ...p, colorOptions: arr }));
    };
    const addColorOption = () => setFormFields((p) => ({ ...p, colorOptions: [...p.colorOptions, { name: '', code: '', images: '' }] }));
    const removeColorOption = (i) => setFormFields((p) => ({ ...p, colorOptions: p.colorOptions.filter((_, idx) => idx !== i) }));

    const handleSpecificationChange = (i, field, value) => {
        const arr = [...formFields.specifications]; arr[i] = { ...arr[i], [field]: value };
        setFormFields((p) => ({ ...p, specifications: arr }));
    };
    const addSpecification = () => setFormFields((p) => ({ ...p, specifications: [...p.specifications, { key: '', value: '' }] }));
    const removeSpecification = (i) => setFormFields((p) => ({ ...p, specifications: p.specifications.filter((_, idx) => idx !== i) }));

    const setPreviewsFun = (arr) => {
        const combined = [...previews, ...arr];
        setPreviews([]); setTimeout(() => { setPreviews(combined); formFields.images = combined; }, 10);
    };
    const setBannerImagesFun = (arr) => {
        const combined = [...bannerPreviews, ...arr];
        setBannerPreviews([]); setTimeout(() => { setBannerPreviews(combined); formFields.bannerimages = combined; }, 10);
    };
    const removeImg = (image, index) => {
        deleteImages(`/api/category/deteleImage?img=${image}`).then(() => {
            const arr = previews.filter((_, i) => i !== index);
            setPreviews([]); setTimeout(() => { setPreviews(arr); formFields.images = arr; }, 100);
        });
    };
    const removeBannerImg = (image, index) => {
        deleteImages(`/api/category/deteleImage?img=${image}`).then(() => {
            const arr = bannerPreviews.filter((_, i) => i !== index);
            setBannerPreviews([]); setTimeout(() => { setBannerPreviews(arr); formFields.bannerimages = arr; }, 100);
        });
    };

    const handleSubmitg = (e) => {
        e.preventDefault();
        const checks = [
            [!formFields.name, 'Please enter product name'],
            [!formFields.description, 'Please enter product description'],
            [!formFields.catId, 'Please select product category'],
            [!formFields.price, 'Please enter product price'],
            [!formFields.oldPrice, 'Please enter product old price'],
            [!formFields.countInStock, 'Please enter product stock'],
            [!formFields.brand, 'Please enter product brand'],
            [!formFields.discount, 'Please enter product discount'],
            [!formFields.rating, 'Please enter product rating'],
            [previews.length === 0, 'Please add product images'],
        ];
        for (const [cond, msg] of checks) { if (cond) { context.alertBox('error', msg); return false; } }

        const payload = {
            ...formFields,
            colorOptions: (formFields.colorOptions || [])
                .map((item) => ({ ...item, images: item.images ? item.images.split(',').map((s) => s.trim()).filter(Boolean) : [] }))
                .filter((item) => item.name),
            specifications: (formFields.specifications || []).filter((item) => item.key && item.value),
            keywords: formFields.keywords ? formFields.keywords.split(',').map((s) => s.trim()).filter(Boolean) : [],
        };
        setIsLoading(true);
        postData('/api/product/create', payload).then((res) => {
            if (res?.error === false) {
                context.alertBox('success', res?.message);
                setTimeout(() => { setIsLoading(false); context.setIsOpenFullScreenPanel({ open: false }); history('/products'); }, 1000);
            } else { setIsLoading(false); context.alertBox('error', res?.message); }
        });
    };

    const selectSx = { width: '100%', fontSize: 13, background: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

    return (
        <section style={{ padding: '20px 20px', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Add New Product</h2>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Fill in the details below to publish a new product</p>
            </div>

            <form onSubmit={handleSubmitg}>
                <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>

                    {/* ── Basic Info ── */}
                    <SectionCard icon={<MdInfo size={15} />} iconBg="#ede9fe" iconColor="#7c3aed" title="Basic Information" subtitle="Product name, description and keywords">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <Field label="Product Name *">
                                <input style={inp} type="text" name="name" value={formFields.name} onChange={onChangeInput} placeholder="e.g. iPhone 15 Pro Max 256GB" />
                            </Field>
                            <Field label="Product Description *">
                                <textarea style={{ ...inp, height: 120, padding: '10px 12px', resize: 'vertical' }} name="description" value={formFields.description} onChange={onChangeInput} placeholder="Detailed product description…" />
                            </Field>
                            <Field label="Search Keywords (comma separated)">
                                <input style={inp} type="text" name="keywords" value={formFields.keywords} onChange={onChangeInput} placeholder="e.g. tshirt, cotton, summer wear" />
                            </Field>
                        </div>
                    </SectionCard>

                    {/* ── Category ── */}
                    <SectionCard icon={<MdCategory size={15} />} iconBg="#e0f2fe" iconColor="#0369a1" title="Category" subtitle="Assign product to categories">
                        <div style={g3}>
                            <Field label="Category *">
                                <Select size="small" sx={selectSx} value={productCat} onChange={handleChangeProductCat} displayEmpty>
                                    <MenuItem value="" disabled>Select category</MenuItem>
                                    {context?.catData?.map((cat) => <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>)}
                                </Select>
                            </Field>
                            <Field label="Sub Category">
                                <Select size="small" sx={selectSx} value={productSubCat} onChange={handleChangeProductSubCat} displayEmpty disabled={!productCat}>
                                    <MenuItem value="">Select sub category</MenuItem>
                                    {availableSubCategories.map((sc) => <MenuItem key={sc._id} value={sc._id}>{sc.name}</MenuItem>)}
                                </Select>
                            </Field>
                            <Field label="Third Level Category">
                                <Select size="small" sx={selectSx} value={productThirdLavelCat} onChange={handleChangeProductThirdLavelCat} displayEmpty disabled={!productSubCat}>
                                    <MenuItem value="">Select third level</MenuItem>
                                    {availableThirdLevelCategories.map((tc) => <MenuItem key={tc._id} value={tc._id}>{tc.name}</MenuItem>)}
                                </Select>
                            </Field>
                        </div>
                    </SectionCard>

                    {/* ── Pricing & Inventory ── */}
                    <SectionCard icon={<MdLocalOffer size={15} />} iconBg="#f0fdf4" iconColor="#15803d" title="Pricing & Inventory" subtitle="Set prices, stock and discount">
                        <div style={g3}>
                            <Field label="Price (Original) *"><input style={inp} type="number" name="price" value={formFields.price} onChange={onChangeInput} placeholder="0.00" /></Field>
                            <Field label="Sale Price *"><input style={inp} type="number" name="oldPrice" value={formFields.oldPrice} onChange={onChangeInput} placeholder="0.00" /></Field>
                            <Field label="Discount % *"><input style={inp} type="number" name="discount" value={formFields.discount} onChange={onChangeInput} placeholder="0" /></Field>
                            <Field label="Stock Count *"><input style={inp} type="number" name="countInStock" value={formFields.countInStock} onChange={onChangeInput} placeholder="0" /></Field>
                            <Field label="Sales Count"><input style={inp} type="number" name="sale" value={formFields.sale} onChange={onChangeInput} placeholder="0" /></Field>
                            <Field label="Brand *"><input style={inp} type="text" name="brand" value={formFields.brand} onChange={onChangeInput} placeholder="e.g. Apple" /></Field>
                            <Field label="Is Featured?">
                                <Select size="small" sx={selectSx} value={productFeatured} onChange={handleChangeProductFeatured} displayEmpty>
                                    <MenuItem value="">Select</MenuItem>
                                    <MenuItem value={true}>Yes — Featured</MenuItem>
                                    <MenuItem value={false}>No</MenuItem>
                                </Select>
                            </Field>
                        </div>
                    </SectionCard>

                    {/* ── Variants ── */}
                    <SectionCard icon={<MdSell size={15} />} iconBg="#fef3c7" iconColor="#92400e" title="Product Variants" subtitle="RAM, size, weight options">
                        <div style={g3}>
                            {productRamsData?.length > 0 && (
                                <Field label="RAM Options">
                                    <Select multiple size="small" sx={selectSx} value={productRams} onChange={handleChangeProductRams}
                                        renderValue={(selected) => (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {selected.map((v) => <Chip key={v} label={v} size="small" style={{ height: 20, fontSize: 11 }} />)}
                                            </div>
                                        )}>
                                        {productRamsData.map((item, i) => <MenuItem key={i} value={item.name}>{item.name}</MenuItem>)}
                                    </Select>
                                </Field>
                            )}
                            {productWeightData?.length > 0 && (
                                <Field label="Weight Options">
                                    <Select multiple size="small" sx={selectSx} value={productWeight} onChange={handleChangeProductWeight}
                                        renderValue={(selected) => (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {selected.map((v) => <Chip key={v} label={v} size="small" style={{ height: 20, fontSize: 11 }} />)}
                                            </div>
                                        )}>
                                        {productWeightData.map((item, i) => <MenuItem key={i} value={item.name}>{item.name}</MenuItem>)}
                                    </Select>
                                </Field>
                            )}
                            {productSizeData?.length > 0 && (
                                <Field label="Size Options">
                                    <Select multiple size="small" sx={selectSx} value={productSize} onChange={handleChangeProductSize}
                                        renderValue={(selected) => (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {selected.map((v) => <Chip key={v} label={v} size="small" style={{ height: 20, fontSize: 11 }} />)}
                                            </div>
                                        )}>
                                        {productSizeData.map((item, i) => <MenuItem key={i} value={item.name}>{item.name}</MenuItem>)}
                                    </Select>
                                </Field>
                            )}
                            <Field label="Product Rating *">
                                <div style={{ paddingTop: 6 }}><Rating name="rating" defaultValue={1} onChange={onChangeRating} /></div>
                            </Field>
                        </div>
                    </SectionCard>

                    {/* ── Colour Options ── */}
                    <SectionCard icon={<TbColorFilter size={15} />} iconBg="#fdf4ff" iconColor="#a21caf" title="Colour Options" subtitle="Add colour variants with images">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {formFields.colorOptions.map((colorItem, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 10, background: '#f9fafb', padding: '12px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                    <div>
                                        <label style={lbl}>Colour Name</label>
                                        <input style={inp} placeholder="Red" value={colorItem.name} onChange={(e) => handleColorOptionChange(index, 'name', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Colour Code</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <input type="color" value={colorItem.code || '#000000'} onChange={(e) => handleColorOptionChange(index, 'code', e.target.value)}
                                                style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', padding: 2 }} />
                                            <input style={{ ...inp, flex: 1 }} placeholder="#ff0000" value={colorItem.code} onChange={(e) => handleColorOptionChange(index, 'code', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={lbl}>Image URLs (comma separated)</label>
                                        <input style={inp} placeholder="https://…, https://…" value={colorItem.images} onChange={(e) => handleColorOptionChange(index, 'images', e.target.value)} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <button type="button" onClick={() => removeColorOption(index)}
                                            disabled={formFields.colorOptions.length === 1}
                                            style={{ width: 34, height: 34, borderRadius: 8, background: '#fee2e2', border: 'none', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: formFields.colorOptions.length === 1 ? 0.4 : 1 }}>
                                            <IoMdClose size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addColorOption}
                                style={{ alignSelf: 'flex-start', background: '#fdf4ff', color: '#a21caf', border: '1px dashed #d946ef', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                + Add Colour
                            </button>
                        </div>
                    </SectionCard>

                    {/* ── Specifications ── */}
                    <SectionCard icon={<TbListDetails size={15} />} iconBg="#f0fdf4" iconColor="#15803d" title="Specifications" subtitle="Technical specs like display size, battery etc.">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {formFields.specifications.map((specItem, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, background: '#f9fafb', padding: '12px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                    <div>
                                        <label style={lbl}>Spec Key</label>
                                        <input style={inp} placeholder="Display Size" value={specItem.key} onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Spec Value</label>
                                        <input style={inp} placeholder="6.7 inch OLED" value={specItem.value} onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <button type="button" onClick={() => removeSpecification(index)}
                                            disabled={formFields.specifications.length === 1}
                                            style={{ width: 34, height: 34, borderRadius: 8, background: '#fee2e2', border: 'none', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: formFields.specifications.length === 1 ? 0.4 : 1 }}>
                                            <IoMdClose size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addSpecification}
                                style={{ alignSelf: 'flex-start', background: '#f0fdf4', color: '#15803d', border: '1px dashed #86efac', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                + Add Specification
                            </button>
                        </div>
                    </SectionCard>

                    {/* ── Product Images ── */}
                    <SectionCard icon={<MdImage size={15} />} iconBg="#fff7ed" iconColor="#c2410c" title="Product Images *" subtitle="Upload high-quality product photos">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                            {previews.map((image, index) => (
                                <div key={index} style={{ position: 'relative' }}>
                                    <span onClick={() => removeImg(image, index)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                                        <IoMdClose style={{ color: '#fff', fontSize: 13 }} />
                                    </span>
                                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', height: 120, background: '#f9fafb' }}>
                                        <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </div>
                            ))}
                            <UploadBox multiple={true} name="images" url="/api/product/uploadImages" setPreviewsFun={setPreviewsFun} />
                        </div>
                    </SectionCard>

                    {/* ── Banner Images ── */}
                    <SectionCard icon={<MdImage size={15} />} iconBg="#eff6ff" iconColor="#2563eb" title="Banner Images" subtitle="Home banner display (optional)">
                        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Display on Home Banner</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Show this product on the home page banner slider</div>
                                </div>
                                <Switch {...switchLabel} onChange={handleChangeSwitch} checked={checkedSwitch} sx={{ marginLeft: 'auto' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
                                {bannerPreviews.map((image, index) => (
                                    <div key={index} style={{ position: 'relative' }}>
                                        <span onClick={() => removeBannerImg(image, index)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                                            <IoMdClose style={{ color: '#fff', fontSize: 13 }} />
                                        </span>
                                        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', height: 120, background: '#f9fafb' }}>
                                            <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </div>
                                ))}
                                <UploadBox multiple={true} name="bannerimages" url="/api/product/uploadBannerImages" setPreviewsFun={setBannerImagesFun} />
                            </div>

                            <label style={lbl}>Banner Title</label>
                            <input style={inp} type="text" name="bannerTitleName" value={formFields.bannerTitleName} onChange={onChangeInput} placeholder="e.g. New Arrivals — Summer Collection" />
                        </div>
                    </SectionCard>

                </div>

                {/* ── Submit ── */}
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                    <button type="submit" disabled={isLoading}
                        style={{ width: '100%', background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: isLoading ? 0.7 : 1 }}>
                        {isLoading
                            ? <><CircularProgress size={18} color="inherit" /> Publishing…</>
                            : <><FaCloudUploadAlt size={18} /> Publish Product</>}
                    </button>
                </div>
            </form>
        </section>
    );
};

export default AddProduct;