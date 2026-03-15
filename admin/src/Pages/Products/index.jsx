import React, { useContext, useEffect, useState } from 'react';
import {
    Button, Checkbox, CircularProgress, MenuItem, Select,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination, TableRow, Chip, Tooltip, IconButton,
    Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, Fade,
} from '@mui/material';
import { IoMdAdd } from 'react-icons/io';
import { AiOutlineEdit } from 'react-icons/ai';
import { FaRegEye, FaBoxOpen } from 'react-icons/fa6';
import { GoTrash } from 'react-icons/go';
import { MdDeleteOutline, MdFilterList, MdWarning, MdRefresh } from 'react-icons/md';
import { TbPackage } from 'react-icons/tb';
import Rating from '@mui/material/Rating';
import { Link } from 'react-router-dom';
import SearchBox from '../../Components/SearchBox';
import { MyContext } from '../../App';
import { fetchDataFromApi, deleteData, deleteMultipleData } from '../../utils/api';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const label = { inputProps: { 'aria-label': 'Checkbox demo' } };

const columns = [
    { id: 'product', label: 'PRODUCT', minWidth: 220 },
    { id: 'category', label: 'CATEGORY', minWidth: 110 },
    { id: 'subcategory', label: 'SUB CATEGORY', minWidth: 130 },
    { id: 'price', label: 'PRICE', minWidth: 120 },
    { id: 'sales', label: 'SALES', minWidth: 80 },
    { id: 'stock', label: 'STOCK', minWidth: 90 },
    { id: 'rating', label: 'RATING', minWidth: 110 },
    { id: 'action', label: 'ACTION', minWidth: 110 },
];

/* ─── small reusable stat card ─── */
const StatCard = ({ label: lbl, value, color, bg, icon }) => (
    <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
        <div style={{
            width: 40, height: 40, borderRadius: 10, background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, fontSize: 18, flexShrink: 0,
        }}>{icon}</div>
        <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {value ?? <Skeleton width={36} height={24} />}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginTop: 2 }}>{lbl}</div>
        </div>
    </div>
);

export const Products = () => {
    const [productCat, setProductCat] = React.useState('');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(50);
    const [productData, setProductData] = useState([]);
    const [productTotalData, setProductTotalData] = useState([]);
    const [productSubCat, setProductSubCat] = React.useState('');
    const [productThirdLavelCat, setProductThirdLavelCat] = useState('');
    const [sortedIds, setSortedIds] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageOrder, setPageOrder] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [photos, setPhotos] = useState([]);
    const [open, setOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '', multiple: false });
    const [filtersOpen, setFiltersOpen] = useState(false);

    const context = useContext(MyContext);

    useEffect(() => { getProducts(page, rowsPerPage); }, [context?.isOpenFullScreenPanel, page, rowsPerPage]);

    useEffect(() => {
        if (searchQuery !== '') {
            const src = productTotalData?.totalProducts || productTotalData?.products || [];
            const filtered = src.filter((p) =>
                p._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p?.catName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p?.subCat?.includes(searchQuery)
            );
            setProductData({
                error: false, success: true, products: filtered,
                total: filtered.length, page: parseInt(page),
                totalPages: Math.ceil(filtered.length / rowsPerPage),
                totalCount: productData?.totalCount,
            });
        } else {
            getProducts(page, rowsPerPage);
        }
    }, [searchQuery]);

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        const updatedItems = productData?.products?.map((item) => ({ ...item, checked: isChecked }));
        setProductData({ ...productData, products: updatedItems });
        setSortedIds(isChecked ? updatedItems.map((i) => i._id) : []);
    };

    const handleCheckboxChange = (e, id) => {
        const updatedItems = productData?.products?.map((item) =>
            item._id === id ? { ...item, checked: !item.checked } : item
        );
        setProductData({ ...productData, products: updatedItems });
        setSortedIds(updatedItems.filter((i) => i.checked).map((i) => i._id));
    };

    const getProducts = async (pg, limit) => {
        setIsLoading(true);
        const endpoint = context?.userData?.role === 'SELLER'
            ? `/api/product/seller/products?page=${pg + 1}&limit=${limit}`
            : `/api/product/getAllProducts?page=${pg + 1}&limit=${limit}`;
        fetchDataFromApi(endpoint).then((res) => {
            setProductData(res);
            setProductTotalData(res);
            setIsLoading(false);
            setPhotos((res?.products || []).map((p) => ({ src: p.images?.[0] })));
        });
    };

    const handleChangeProductCat = (event) => {
        const val = event.target.value;
        setProductCat(val);
        setProductSubCat('');
        setProductThirdLavelCat('');
        if (!val) { getProducts(0, rowsPerPage); return; }
        setIsLoading(true);
        fetchDataFromApi(`/api/product/getAllProductsByCatId/${val}`).then((res) => {
            if (res?.error === false) {
                setProductData({ error: false, success: true, products: res?.products, totalPages: Math.ceil(res?.products?.length / rowsPerPage), totalCount: res?.products?.length });
                setIsLoading(false);
            }
        });
    };

    const handleChangeProductSubCat = (event) => {
        const val = event.target.value;
        setProductSubCat(val);
        setProductCat('');
        setProductThirdLavelCat('');
        if (!val) { getProducts(0, rowsPerPage); return; }
        setIsLoading(true);
        fetchDataFromApi(`/api/product/getAllProductsBySubCatId/${val}`).then((res) => {
            if (res?.error === false) {
                setProductData({ error: false, success: true, products: res?.products, totalPages: Math.ceil(res?.products?.length / rowsPerPage) });
                setIsLoading(false);
            }
        });
    };

    const handleChangeProductThirdLavelCat = (event) => {
        const val = event.target.value;
        setProductThirdLavelCat(val);
        setProductCat('');
        setProductSubCat('');
        if (!val) { getProducts(0, rowsPerPage); return; }
        setIsLoading(true);
        fetchDataFromApi(`/api/product/getAllProductsByThirdLavelCat/${val}`).then((res) => {
            if (res?.error === false) {
                setProductData({ error: false, success: true, products: res?.products, totalPages: Math.ceil(res?.products?.length / rowsPerPage) });
                setIsLoading(false);
            }
        });
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        getProducts(newPage, rowsPerPage);
    };

    const confirmDelete = (id, name, multiple = false) => setDeleteDialog({ open: true, id, name, multiple });

    const handleConfirmedDelete = () => {
        if (deleteDialog.multiple) {
            deleteMultipleData('/api/product/deleteMultiple', { data: { ids: sortedIds } }).then(() => {
                context.alertBox('success', `${sortedIds.length} products deleted`);
                setSortedIds([]);
                getProducts(page, rowsPerPage);
            });
        } else {
            if (!['ADMIN', 'SELLER'].includes(context?.userData?.role)) {
                context.alertBox('error', 'Only admin or seller can delete product');
                return;
            }
            deleteData(`/api/product/${deleteDialog.id}`).then(() => {
                context.alertBox('success', 'Product deleted');
                getProducts(page, rowsPerPage);
            });
        }
        setDeleteDialog({ open: false, id: null, name: '', multiple: false });
    };

    // Stats
    const allProds = productTotalData?.products || [];
    const totalCount = productData?.totalCount || (productData?.totalPages * rowsPerPage) || 0;
    const outOfStock = allProds.filter((p) => p.countInStock === 0).length;
    const featuredCount = allProds.filter((p) => p.isFeatured).length;

    const stockColor = (stock) => {
        if (stock === 0) return { color: '#991b1b', bg: '#fee2e2', label: 'Out' };
        if (stock < 10) return { color: '#92400e', bg: '#fef3c7', label: stock };
        return { color: '#15803d', bg: '#dcfce7', label: stock };
    };

    return (
        <>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Products</h1>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
                        Manage your product catalogue
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Tooltip title="Refresh"><IconButton size="small" onClick={() => getProducts(page, rowsPerPage)}
                        style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151' }}>
                        <MdRefresh size={18} />
                    </IconButton></Tooltip>
                    <Button variant="contained" startIcon={<IoMdAdd size={16} />}
                        onClick={() => context.setIsOpenFullScreenPanel({ open: true, model: 'Add Product' })}
                        style={{ background: '#111827', borderRadius: 8, textTransform: 'none', fontWeight: 600, fontSize: 13, boxShadow: 'none' }}>
                        Add Product
                    </Button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
                <StatCard lbl="Total Products" value={totalCount || '--'} color="#7c3aed" bg="#ede9fe" icon={<TbPackage />} label="Total Products" />
                <StatCard lbl="Out of Stock" value={outOfStock || 0} color="#dc2626" bg="#fee2e2" icon={<FaBoxOpen />} label="Out of Stock" />
                <StatCard lbl="Featured" value={featuredCount || 0} color="#0369a1" bg="#e0f2fe" icon={<IoMdAdd />} label="Featured" />
            </div>

            {/* ── Main Card ── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>

                {/* Filter Bar */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => setFiltersOpen((p) => !p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: filtersOpen ? '#111827' : '#fff', color: filtersOpen ? '#fff' : '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <MdFilterList size={16} /> Filters {(productCat || productSubCat || productThirdLavelCat) ? '●' : ''}
                    </button>

                    {sortedIds.length > 0 && (
                        <Fade in>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Chip label={`${sortedIds.length} selected`} size="small"
                                    style={{ background: '#ede9fe', color: '#7c3aed', fontWeight: 600, fontSize: 12 }} />
                                <Button variant="outlined" color="error" size="small"
                                    startIcon={<MdDeleteOutline size={15} />}
                                    onClick={() => confirmDelete(null, null, true)}
                                    style={{ textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 7 }}>
                                    Delete Selected
                                </Button>
                            </div>
                        </Fade>
                    )}

                    <div style={{ marginLeft: 'auto' }}>
                        <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} setPageOrder={setPageOrder} />
                    </div>
                </div>

                {/* Collapsible Filters */}
                {filtersOpen && (
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                        {[
                            { label: 'Category', value: productCat, onChange: handleChangeProductCat, items: context?.catData?.map((c) => ({ id: c._id, name: c.name })) },
                            { label: 'Sub Category', value: productSubCat, onChange: handleChangeProductSubCat, items: context?.catData?.flatMap((c) => c.children || []).map((c) => ({ id: c._id, name: c.name })) },
                            { label: 'Third Level', value: productThirdLavelCat, onChange: handleChangeProductThirdLavelCat, items: context?.catData?.flatMap((c) => (c.children || []).flatMap((sc) => sc.children || [])).map((c) => ({ id: c._id, name: c.name })) },
                        ].map((f) => (
                            <div key={f.label}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: '0.05em' }}>{f.label.toUpperCase()}</label>
                                <Select size="small" value={f.value} onChange={f.onChange} displayEmpty
                                    sx={{ width: '100%', fontSize: 13, background: '#fff', borderRadius: 2 }}>
                                    <MenuItem value=''>All</MenuItem>
                                    {f.items?.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                </Select>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table */}
                <TableContainer sx={{ maxHeight: 520 }}>
                    <Table stickyHeader size="small" aria-label="products table">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', pl: 2 }}>
                                    <Checkbox {...label} size="small" onChange={handleSelectAll}
                                        checked={productData?.products?.length > 0 ? productData?.products?.every((i) => i.checked) : false}
                                        indeterminate={sortedIds.length > 0 && sortedIds.length < (productData?.products?.length || 0)} />
                                </TableCell>
                                {columns.map((col) => (
                                    <TableCell key={col.id} sx={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', minWidth: col.minWidth, py: 1.5 }}>
                                        {col.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell padding="checkbox" sx={{ pl: 2 }}><Skeleton variant="rectangular" width={16} height={16} sx={{ borderRadius: 1 }} /></TableCell>
                                        {columns.map((col) => <TableCell key={col.id}><Skeleton variant="text" width="80%" height={20} /></TableCell>)}
                                    </TableRow>
                                ))
                            ) : productData?.products?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9}>
                                        <div style={{ textAlign: 'center', padding: '56px 0', color: '#9ca3af' }}>
                                            <TbPackage size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>No products found</div>
                                            <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting the filters or search query</div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                productData?.products?.map((product, index) => {
                                    const sc = stockColor(product.countInStock);
                                    return (
                                        <TableRow key={product._id || index} hover
                                            sx={{
                                                background: product.checked ? '#f5f3ff !important' : 'inherit',
                                                borderLeft: product.checked ? '3px solid #7c3aed' : '3px solid transparent',
                                                transition: 'background 0.15s',
                                            }}>
                                            <TableCell padding="checkbox" sx={{ pl: 2 }}>
                                                <Checkbox {...label} size="small" checked={!!product.checked}
                                                    onChange={(e) => handleCheckboxChange(e, product._id)} />
                                            </TableCell>

                                            {/* Product */}
                                            <TableCell>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#f9fafb' }}
                                                        onClick={() => { setLightboxIdx(index); setOpen(true); }}>
                                                        <LazyLoadImage alt="product" effect="blur" src={product?.images?.[0]}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ maxWidth: 180 }}>
                                                        <Link to={`/product/${product._id}`}>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                                {product?.name}
                                                            </div>
                                                        </Link>
                                                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{product?.brand}</div>
                                                        {product?.isFeatured && (
                                                            <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: 10, display: 'inline-block', marginTop: 3 }}>
                                                                ★ Featured
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Category */}
                                            <TableCell><span style={{ fontSize: 12, color: '#374151' }}>{product?.catName}</span></TableCell>

                                            {/* SubCat */}
                                            <TableCell><span style={{ fontSize: 12, color: '#374151' }}>{product?.subCat || '—'}</span></TableCell>

                                            {/* Price */}
                                            <TableCell>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                                                        {product?.oldPrice?.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>
                                                        {product?.price?.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                                                    </div>
                                                    {product?.discount > 0 && (
                                                        <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 10 }}>
                                                            -{product.discount}%
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Sales */}
                                            <TableCell>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{product?.sale}</span>
                                            </TableCell>

                                            {/* Stock */}
                                            <TableCell>
                                                <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, padding: '3px 9px', borderRadius: 20, display: 'inline-block' }}>
                                                    {sc.label === 'Out' ? 'Out of stock' : sc.label}
                                                </span>
                                            </TableCell>

                                            {/* Rating */}
                                            <TableCell>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Rating value={product?.rating} readOnly size="small" precision={0.5} />
                                                    <span style={{ fontSize: 11, color: '#6b7280' }}>{product?.rating?.toFixed(1)}</span>
                                                </div>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <Tooltip title="Edit" arrow>
                                                        <IconButton size="small"
                                                            onClick={() => context.setIsOpenFullScreenPanel({ open: true, model: 'Edit Product', id: product._id })}
                                                            sx={{ background: '#f3f4f6', borderRadius: 1.5, width: 30, height: 30, '&:hover': { background: '#e5e7eb' } }}>
                                                            <AiOutlineEdit size={15} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="View" arrow>
                                                        <Link to={`/product/${product._id}`}>
                                                            <IconButton size="small"
                                                                sx={{ background: '#eff6ff', color: '#2563eb', borderRadius: 1.5, width: 30, height: 30, '&:hover': { background: '#dbeafe' } }}>
                                                                <FaRegEye size={13} />
                                                            </IconButton>
                                                        </Link>
                                                    </Tooltip>
                                                    <Tooltip title="Delete" arrow>
                                                        <IconButton size="small"
                                                            onClick={() => confirmDelete(product._id, product.name)}
                                                            sx={{ background: '#fee2e2', color: '#ef4444', borderRadius: 1.5, width: 30, height: 30, '&:hover': { background: '#fecaca' } }}>
                                                            <GoTrash size={13} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[50, 100, 150, 200]}
                    component="div"
                    count={(productData?.totalPages || 0) * rowsPerPage}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ borderTop: '1px solid #f3f4f6' }}
                />
            </div>

            {/* ── Delete Dialog ── */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
                maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: 14 } }}>
                <DialogTitle sx={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                        <MdWarning size={17} />
                    </span>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
                        {deleteDialog.multiple
                            ? `Delete ${sortedIds.length} selected products? This cannot be undone.`
                            : `Delete "${deleteDialog.name}"? This cannot be undone.`}
                    </p>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button variant="outlined" onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleConfirmedDelete}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, boxShadow: 'none' }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* ── Lightbox ── */}
            <Lightbox open={open} close={() => setOpen(false)} slides={photos} index={lightboxIdx} />
        </>
    );
};

export default Products;