import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDataFromApi } from '../../utils/api';
import { CircularProgress, Skeleton } from '@mui/material';
import { MdArrowBack } from 'react-icons/md';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';

const ProductViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const endpoints = [
          `/api/product/${id}`,
          `/api/go-market/products/${id}`,
          `/api/go-market/items/${id}`
        ];

        let foundProduct = null;

        for (const endpoint of endpoints) {
          const res = await fetchDataFromApi(endpoint);
          
          let p = res?.data || res?.product || res;
          if (p?.data && typeof p.data === 'object' && !Array.isArray(p.data)) {
            p = p.data;
          }
          
          if (p && !(p instanceof Error) && p.name !== 'AxiosError' && p.error !== true) {
            foundProduct = p;
            break; // Stop searching once we find it
          }
        }

        setProduct(foundProduct);
      } catch (err) {
        console.error("Error loading product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', minHeight: '80vh' }}>
        <CircularProgress size={50} style={{ color: '#059669' }} />
        <p style={{ marginTop: 16, color: '#6b7280' }}>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Product not found</h2>
        <button onClick={() => navigate(-1)} style={{ marginTop: 20, padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : product.image ? [product.image] : [];
  const specs = Array.isArray(product.specifications) ? product.specifications : [];
  const options = Array.isArray(product.productOptions) ? product.productOptions : [];
  const discount = product.oldPrice && product.price 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: 24, 
            color: '#111827',
            padding: 0
          }}
        >
          <MdArrowBack />
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Product Preview</h1>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
        
        {/* Images */}
        <div>
          {images.length > 0 ? (
            <>
              <div style={{ 
                borderRadius: 12, 
                overflow: 'hidden', 
                marginBottom: 12,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                height: 400
              }}>
                <img 
                  src={images[slideIndex]} 
                  alt="Product" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} 
                />
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSlideIndex(idx)}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 8,
                        border: slideIndex === idx ? '3px solid #059669' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        padding: 0,
                        background: 'none'
                      }}
                    >
                      <img 
                        src={img} 
                        alt={`Thumb ${idx}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{
              width: '100%',
              height: 400,
              background: '#f9fafb',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af'
            }}>
              No images available
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12, lineHeight: 1.3 }}>
            {product.name}
          </h2>

          {product.title && product.title !== product.name && (
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
              {product.title}
            </p>
          )}

          {/* Pricing */}
          <div style={{ 
            background: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            borderRadius: 10, 
            padding: 16, 
            marginBottom: 20 
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <>
                  <span style={{ fontSize: 16, color: '#9ca3af', textDecoration: 'line-through' }}>
                    ₹{product.oldPrice?.toLocaleString('en-IN')}
                  </span>
                  {discount > 0 && (
                    <span style={{ 
                      background: '#dcfce7', 
                      color: '#15803d', 
                      padding: '4px 12px', 
                      borderRadius: 20, 
                      fontSize: 13, 
                      fontWeight: 700 
                    }}>
                      -{discount}%
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div style={{ marginBottom: 20 }}>
            {product.countInStock !== undefined ? (
              <div style={{
                display: 'inline-block',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                background: product.countInStock > 0 ? '#dcfce7' : '#fee2e2',
                color: product.countInStock > 0 ? '#15803d' : '#991b1b'
              }}>
                {product.countInStock > 0 
                  ? `${product.countInStock} in stock` 
                  : 'Out of stock'}
              </div>
            ) : (
              <div style={{
                display: 'inline-block',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                background: product.isAvailable === false ? '#fee2e2' : '#dcfce7',
                color: product.isAvailable === false ? '#991b1b' : '#15803d'
              }}>
                {product.isAvailable === false ? 'Unavailable' : 'Available'}
              </div>
            )}
            {product.isFeatured && (
              <div style={{
                display: 'inline-block',
                marginLeft: 12,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                background: '#fef3c7',
                color: '#92400e'
              }}>
                ⭐ Featured
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Description</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Category */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Category</h3>
            <div style={{ fontSize: 14, color: '#111827' }}>
              {product.categoryId?.name || product.goMarketCategoryId?.name || 'N/A'}
              {(product.subCategoryId?.name || product.goMarketSubCategoryId?.name) && (
                <> → {product.subCategoryId?.name || product.goMarketSubCategoryId?.name}</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {specs.length > 0 && specs.some(s => s.key && s.value) && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>📋 Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
            {specs.map((spec, idx) => (
              spec.key && spec.value && (
                <div 
                  key={idx} 
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    gap: 10
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', minWidth: 100 }}>
                    {spec.key}:
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                    {spec.value}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Product Options */}
      {options.length > 0 && options.some(o => o.name) && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>⚙️ Product Options</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {options.map((option, idx) => (
              option.name && (
                <div key={idx} style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 12
                }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10, margin: 0 }}>
                    {option.label || option.name}
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(option.values || []).map((val, vidx) => (
                      <span
                        key={vidx}
                        style={{
                          background: '#fff',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#374151'
                        }}
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductViewer;
