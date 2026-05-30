import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from './Starrating';

interface Product {
  _id?: string;
  name?: string;
  images?: string[];
  price?: number;
  oldPrice?: number;
  discount?: number;
  brand?: string;
  rating?: number;
  numReviews?: number;
  countInStock?: number;
  soldCount?: number;
  totalSales?: number;
}

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
  onWishlistPress?: () => void;
  isWishlisted?: boolean;
}

/* ── Tag logic ── */
const getProductTag = (product: Product) => {
  const stock = Number(product?.countInStock || 0);
  const sold  = Number(product?.soldCount || product?.totalSales || 0);
  if (stock <= 0)         return { label: 'Out of Stock', color: '#6b7280', bg: '#f3f4f6' };
  if (stock <= 5)         return { label: `Only ${stock} Left`, color: '#b45309', bg: '#fef3c7' };
  if (stock <= 10)        return { label: `${stock} Available`,  color: '#0369a1', bg: '#e0f2fe' };
  if (sold >= 10)         return { label: 'Best Seller',          color: '#7c3aed', bg: '#ede9fe' };
  if (Number(product?.rating || 0) >= 4.2) return { label: 'Top Rated', color: '#065f46', bg: '#d1fae5' };
  if (Number(product?.discount || 0) >= 25) return { label: 'Trending', color: '#be123c', bg: '#ffe4e6' };
  return { label: 'Featured', color: '#1d4ed8', bg: '#dbeafe' };
};

const fmt = (n?: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* ── MAIN COMPONENT ── */
const ProductCard: React.FC<ProductCardProps> = ({ item, onPress, onWishlistPress, isWishlisted = false }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const tag         = getProductTag(item);
  const isOutOfStock = tag.label === 'Out of Stock';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => {
          console.log('=== ProductCard TouchableOpacity pressed ===');
          console.log('Item ID:', item._id);
          console.log('Item Name:', item.name);
          console.log('onPress function exists:', !!onPress);
          
          if (onPress) {
            console.log('Calling onPress...');
            onPress();
          } else {
            console.warn('onPress is undefined!');
          }
        }}
        activeOpacity={0.9}
        style={styles.touchableArea}
      >
        {/* ── Image ── */}
        <View style={styles.imgWrap}>
          <Image
            source={{ uri: item?.images?.[imgIdx] || item?.images?.[0] }}
            style={styles.img}
            resizeMode="cover"
          />

          {/* Discount badge */}
          {item?.discount && item.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>−{item.discount}%</Text>
            </View>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <View style={styles.oosOverlay}>
              <View style={styles.oosTag}>
                <Text style={styles.oosText}>OUT OF STOCK</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Info ── */}
        <View style={styles.info}>
          {/* Tag + Brand row */}
          <View style={styles.tagRow}>
            <View style={[styles.tagPill, { backgroundColor: tag.bg }]}>
              <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
            </View>
            {item?.brand ? (
              <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
            ) : null}
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>{item?.name}</Text>

          {/* Rating */}
          <StarRating value={Number(item?.rating || 0)} size={11} count={item?.numReviews} />

          <View style={styles.divider} />

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{fmt(item?.price)}</Text>
            {item?.oldPrice ? (
              <Text style={styles.oldPrice}>{fmt(item?.oldPrice)}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Wishlist button — top-left (outside TouchableOpacity) */}
      <TouchableOpacity
        style={[styles.wishBtn, isWishlisted && styles.wishBtnActive]}
        onPress={(e) => {
          e?.stopPropagation?.();
          onWishlistPress?.();
        }}
        hitSlop={8}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isWishlisted ? 'heart' : 'heart-outline'}
          size={15}
          color={isWishlisted ? '#e84040' : '#6b7280'}
        />
      </TouchableOpacity>

      {/* Image dots (if multiple images) - outside TouchableOpacity */}
      {item?.images?.length && item.images.length > 1 && (
        <View style={styles.imgDots}>
          {item.images.slice(0, 3).map((_: any, i: number) => (
            <TouchableOpacity
              key={i}
              onPress={(e) => {
                e?.stopPropagation?.();
                setImgIdx(i);
              }}
              style={[styles.dot, imgIdx === i && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

/* ── Styles ── */
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
    position: 'relative',
  },
  touchableArea: {
    flex: 1,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },

  /* image */
  imgWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8f8fa',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },

  discountBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#e84040',
    borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3,
    zIndex: 5,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  oosOverlay: {
    position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center', zIndex: 6,
  },
  oosTag: {
    backgroundColor: '#6b7280',
    borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4,
  },
  oosText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  wishBtn: {
    position: 'absolute', top: 8, left: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
    zIndex: 5,
  },
  wishBtnActive: { backgroundColor: '#fff0f0' },

  imgDots: {
    position: 'absolute', bottom: 6, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 4, zIndex: 4,
  },
  dot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: { backgroundColor: '#fff', width: 12 },

  /* info */
  info: { padding: 10, gap: 4 },

  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 },
  tagPill: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  brand: { fontSize: 10, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },

  title: { fontSize: 12.5, fontWeight: '600', color: '#111827', lineHeight: 18 },

  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price:    { fontSize: 14, fontWeight: '700', color: '#e84040' },
  oldPrice: { fontSize: 11, color: '#d1d5db', textDecorationLine: 'line-through', fontWeight: '500' },
});

export default ProductCard;
