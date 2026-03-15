import React, { useEffect, useRef, useState } from 'react';
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/InnerImageZoom/styles.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { useParams, Link } from 'react-router-dom';
import { fetchDataFromApi } from '../../utils/api';
import { MdBrandingWatermark, MdFilterVintage, MdRateReview, MdArrowBack, MdCalendarToday, MdCheck } from 'react-icons/md';
import { BiSolidCategoryAlt } from 'react-icons/bi';
import { BsPatchCheckFill } from 'react-icons/bs';
import { TbListDetails } from 'react-icons/tb';
import { FaTag } from 'react-icons/fa';
import Rating from '@mui/material/Rating';
import CircularProgress from '@mui/material/CircularProgress';
import { Skeleton, Chip } from '@mui/material';

/* ─── Styles ─── */
const S = {
    page: { padding: '4px 0', maxWidth: 1100 },
    badge: (bg, color) => ({
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        background: bg, color,
    }),
    infoRow: {
        display: 'flex', alignItems: 'flex-start', padding: '10px 0',
        borderBottom: '1px solid #f3f4f6', gap: 10,
    },
    infoLabel: {
        minWidth: 130, display: 'flex', alignItems: 'center', gap: 7,
        fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0,
    },
    infoValue: { fontSize: 13, color: '#111827' },
    card: {
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
    },
    sectionHead: {
        padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa',
    },
    sectionIcon: (bg, color) => ({
        width: 30, height: 30, borderRadius: 8, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, fontSize: 15, flexShrink: 0,
    }),
};

const InfoRow = ({ icon, label, children }) => (
    <div style={S.infoRow}>
        <span style={S.infoLabel}>{icon}{label}</span>
        <div style={S.infoValue}>{children}</div>
    </div>
);

const SpecBadge = ({ text }) => (
    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 8, background: '#f3f4f6', fontSize: 12, fontWeight: 600, color: '#374151', border: '1px solid #e5e7eb' }}>
        {text}
    </span>
);

const ProductDetails = () => {
    const [slideIndex, setSlideIndex] = useState(0);
    const [product, setProduct] = useState(null);
    const [reviewsData, setReviewsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const zoomSliderBig = useRef();
    const zoomSliderSml = useRef();
    const { id } = useParams();

    useEffect(() => {
        fetchDataFromApi(`/api/user/getReviews?productId=${id}`).then((res) => {
            if (res?.error === false) setReviewsData(res.reviews);
        });
    }, []);

    useEffect(() => {
        fetchDataFromApi(`/api/product/${id}`).then((res) => {
            if (res?.error === false) {
                setTimeout(() => { setProduct(res?.product); setIsLoading(false); }, 500);
            }
        });
    }, []);

    const goto = (index) => {
        setSlideIndex(index);
        zoomSliderSml.current?.swiper?.slideTo(index);
        zoomSliderBig.current?.swiper?.slideTo(index);
    };

    const avgRating = reviewsData.length > 0
        ? (reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length).toFixed(1)
        : product?.rating?.toFixed(1) || '—';

    if (isLoading) {
        return (
            <div style={S.page}>
                {/* Skeleton */}
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                    <div style={{ width: '40%', minWidth: 280 }}>
                        <Skeleton variant="rectangular" height={380} sx={{ borderRadius: 2 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 260 }}>
                        <Skeleton variant="text" height={40} width="80%" />
                        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="text" height={24} sx={{ my: 0.5 }} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={S.page}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Product Details</h1>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>View full details and customer reviews</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {product?.isFeatured && <span style={S.badge('#fef3c7', '#92400e')}>★ Featured</span>}
                    <span style={S.badge(product?.countInStock > 0 ? '#dcfce7' : '#fee2e2', product?.countInStock > 0 ? '#15803d' : '#991b1b')}>
                        {product?.countInStock > 0 ? `${product.countInStock} in stock` : 'Out of stock'}
                    </span>
                </div>
            </div>

            {/* ── Main Product Card ── */}
            <div style={{ ...S.card, marginBottom: 20 }}>
                <div style={{ padding: '24px', display: 'flex', gap: 28, flexWrap: 'wrap' }}>

                    {/* ── Image Gallery ── */}
                    <div style={{ width: '38%', minWidth: 260, flexShrink: 0 }}>
                        {product?.images?.length > 0 && (
                            <div style={{ display: 'flex', gap: 10 }}>
                                {/* Thumbnails */}
                                <div style={{ width: 68, flexShrink: 0 }}>
                                    <Swiper
                                        ref={zoomSliderSml}
                                        direction="vertical"
                                        slidesPerView={5}
                                        spaceBetween={8}
                                        navigation={true}
                                        modules={[Navigation]}
                                        style={{ height: 400 }}
                                        className={product?.images?.length > 5 ? 'space' : ''}
                                    >
                                        {product.images.map((item, index) => (
                                            <SwiperSlide key={index}>
                                                <div onClick={() => goto(index)}
                                                    style={{
                                                        borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                                                        border: slideIndex === index ? '2px solid #7c3aed' : '2px solid transparent',
                                                        opacity: slideIndex === index ? 1 : 0.5,
                                                        transition: 'all 0.15s', height: 60, background: '#f9fafb',
                                                    }}>
                                                    <img src={item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>

                                {/* Main Image */}
                                <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                    <Swiper ref={zoomSliderBig} slidesPerView={1} spaceBetween={0} navigation={false}>
                                        {product.images.map((item, index) => (
                                            <SwiperSlide key={index}>
                                                <InnerImageZoom zoomType="hover" zoomScale={1.2} src={item} style={{ width: '100%' }} />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Product Info ── */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6, lineHeight: 1.3 }}>{product?.name}</h2>

                        {/* Rating summary */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, background: '#fafafa', padding: '10px 14px', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                            <Rating value={Number(avgRating)} readOnly precision={0.5} size="small" />
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{avgRating}</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>({reviewsData.length} review{reviewsData.length !== 1 ? 's' : ''})</span>
                        </div>

                        {/* Price */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                            <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>
                                {product?.oldPrice?.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                            </span>
                            {product?.price !== product?.oldPrice && (
                                <span style={{ fontSize: 15, color: '#9ca3af', textDecoration: 'line-through' }}>
                                    {product?.price?.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                                </span>
                            )}
                            {product?.discount > 0 && (
                                <span style={S.badge('#dcfce7', '#15803d')}>{product.discount}% off</span>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #f3f4f6' }}>
                            <InfoRow icon={<MdBrandingWatermark size={14} style={{ color: '#9ca3af' }} />} label="Brand">
                                <strong>{product?.brand}</strong>
                            </InfoRow>

                            <InfoRow icon={<BiSolidCategoryAlt size={14} style={{ color: '#9ca3af' }} />} label="Category">
                                {product?.catName}
                                {product?.subCat && <span style={{ color: '#9ca3af' }}> → {product.subCat}</span>}
                                {product?.thirdsubCat && <span style={{ color: '#9ca3af' }}> → {product.thirdsubCat}</span>}
                            </InfoRow>

                            {product?.productRam?.length > 0 && (
                                <InfoRow icon={<MdFilterVintage size={14} style={{ color: '#9ca3af' }} />} label="RAM">
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {product.productRam.map((ram, i) => <SpecBadge key={i} text={ram} />)}
                                    </div>
                                </InfoRow>
                            )}

                            {product?.size?.length > 0 && (
                                <InfoRow icon={<MdFilterVintage size={14} style={{ color: '#9ca3af' }} />} label="Size">
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {product.size.map((s, i) => <SpecBadge key={i} text={s} />)}
                                    </div>
                                </InfoRow>
                            )}

                            {product?.productWeight?.length > 0 && (
                                <InfoRow icon={<MdFilterVintage size={14} style={{ color: '#9ca3af' }} />} label="Weight">
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {product.productWeight.map((w, i) => <SpecBadge key={i} text={w} />)}
                                    </div>
                                </InfoRow>
                            )}

                            {product?.keywords?.length > 0 && (
                                <InfoRow icon={<FaTag size={12} style={{ color: '#9ca3af' }} />} label="Keywords">
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                        {product.keywords.map((kw, i) => (
                                            <Chip key={i} label={kw} size="small" style={{ fontSize: 11, height: 22, background: '#ede9fe', color: '#7c3aed' }} />
                                        ))}
                                    </div>
                                </InfoRow>
                            )}

                            <InfoRow icon={<MdCalendarToday size={13} style={{ color: '#9ca3af' }} />} label="Published">
                                {product?.createdAt?.split('T')[0]}
                            </InfoRow>
                        </div>
                    </div>
                </div>

                {/* ── Description ── */}
                {product?.description && (
                    <div style={{ borderTop: '1px solid #f3f4f6', padding: '20px 24px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Product Description</h3>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{product.description}</p>
                    </div>
                )}

                {/* ── Specifications ── */}
                {product?.specifications?.filter((s) => s.key && s.value).length > 0 && (
                    <div style={{ borderTop: '1px solid #f3f4f6', padding: '20px 24px' }}>
                        <div style={{ ...S.sectionHead, padding: 0, background: 'transparent', marginBottom: 14 }}>
                            <div style={S.sectionIcon('#f0fdf4', '#15803d')}><TbListDetails size={15} /></div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Specifications</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                            {product.specifications.filter((s) => s.key && s.value).map((spec, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', borderRadius: 8, padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                                    <MdCheck size={14} style={{ color: '#15803d', flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', minWidth: 90 }}>{spec.key}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Colour Options ── */}
                {product?.colorOptions?.filter((c) => c.name).length > 0 && (
                    <div style={{ borderTop: '1px solid #f3f4f6', padding: '20px 24px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Colour Options</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {product.colorOptions.filter((c) => c.name).map((color, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 10, padding: '8px 12px', border: '1px solid #e5e7eb' }}>
                                    {color.code && (
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: color.code, border: '2px solid #e5e7eb', flexShrink: 0 }} />
                                    )}
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{color.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Reviews ── */}
            {reviewsData.length > 0 && (
                <div style={S.card}>
                    <div style={S.sectionHead}>
                        <div style={S.sectionIcon('#ede9fe', '#7c3aed')}><MdRateReview size={15} /></div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Customer Reviews</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{reviewsData.length} review{reviewsData.length !== 1 ? 's' : ''} · Avg. {avgRating} ★</div>
                        </div>
                    </div>

                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {reviewsData.map((review, index) => (
                            <div key={index} style={{ display: 'flex', gap: 14, background: '#fafafa', borderRadius: 12, padding: '14px 16px', border: '1px solid #f3f4f6' }}>
                                {/* Avatar */}
                                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #e5e7eb', background: '#e5e7eb' }}>
                                    <img src={review?.image || '/user.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{review?.userName}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Rating value={review?.rating} readOnly size="small" precision={0.5} />
                                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{review?.createdAt?.split('T')[0]}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{review?.review}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;