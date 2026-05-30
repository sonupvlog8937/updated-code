import React from 'react';
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
  description?: string;
}

interface ProductCardListProps {
  item: Product;
  onPress?: () => void;
  onWishlistPress?: () => void;
  isWishlisted?: boolean;
}

const getProductTag = (product: Product) => {
  const stock = Number(product?.countInStock || 0);
  const sold  = Number(product?.soldCount || product?.totalSales || 0);
  if (stock <= 0)  return { label: 'Out of Stock', color: '#6b7280', bg: '#f3f4f6' };
  if (stock <= 5)  return { label: `Only ${stock} Left`, color: '#b45309', bg: '#fef3c7' };
  if (stock <= 10) return { label: `${stock} Available`, color: '#0369a1', bg: '#e0f2fe' };
  if (sold >= 10)  return { label: 'Best Seller', color: '#7c3aed', bg: '#ede9fe' };
  if (Number(product?.rating || 0) >= 4.2) return { label: 'Top Rated', color: '#065f46', bg: '#d1fae5' };
  if (Number(product?.discount || 0) >= 25) return { label: 'Trending', color: '#be123c', bg: '#ffe4e6' };
  return { label: 'Featured', color: '#1d4ed8', bg: '#dbeafe' };
};

const fmt = (n?: number): string => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const ProductCardList: React.FC<ProductCardListProps> = ({ 
  item, 
  onPress, 
  onWishlistPress, 
  isWishlisted = false 
}) => {
  const tag = getProductTag(item);
  const isOutOfStock = tag.label === 'Out of Stock';

  return (
    <TouchableOpacity
      onPress={() => {
        console.log('ProductCardList pressed!');
        if (onPress) {
          onPress();
        }
      }}
      activeOpacity={0.9}
      style={styles.card}
    >
      {/* ── Image ── */}
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: item?.images?.[0] || '' }}
          style={styles.img}
          resizeMode="cover"
        />
        {item?.discount && item.discount > 0 && (
          <View style={styles.discBadge}>
            <Text style={styles.discText}>−{item.discount}%</Text>
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.oosOverlay}>
            <Text style={styles.oosText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      {/* ── Info ── */}
      <View style={styles.info}>
        <View style={styles.tagRow}>
          <View style={[styles.tagPill, { backgroundColor: tag.bg }]}>
            <Text style={[styles.tagLabel, { color: tag.color }]}>{tag.label}</Text>
          </View>
          {item?.brand ? <Text style={styles.brand}>{item.brand}</Text> : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>{item?.name || 'Product'}</Text>

        <StarRating 
          value={Number(item?.rating || 0)} 
          size={12} 
          count={item?.numReviews || null} 
        />

        <View style={styles.priceRow}>
          <Text style={styles.price}>{fmt(item?.price)}</Text>
          {item?.oldPrice ? <Text style={styles.oldPrice}>{fmt(item?.oldPrice)}</Text> : null}
        </View>

        {/* Short description or stock count */}
        {item?.description ? (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>

      {/* Wishlist */}
      <TouchableOpacity
        style={[styles.wishBtn, isWishlisted && styles.wishActive]}
        onPress={(e) => {
          e?.stopPropagation?.();
          onWishlistPress?.();
        }}
        hitSlop={8}
      >
        <Ionicons
          name={isWishlisted ? 'heart' : 'heart-outline'}
          size={16}
          color={isWishlisted ? '#e84040' : '#9ca3af'}
        />
      </TouchableOpacity>
      </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1, 
    borderColor: '#f0f0f2',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, 
    shadowRadius: 6, 
    elevation: 2,
    marginBottom: 10,
  },
  pressed: { opacity: 0.92 },

  imgWrap: {
    width: 110, 
    height: 110,
    backgroundColor: '#f8f8fa', 
    flexShrink: 0,
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },

  discBadge: {
    position: 'absolute', 
    top: 6, 
    left: 6,
    backgroundColor: '#e84040', 
    borderRadius: 5,
    paddingHorizontal: 5, 
    paddingVertical: 2,
  },
  discText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  oosOverlay: {
    position: 'absolute', 
    inset: 0, 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  oosText: { 
    color: '#6b7280', 
    fontSize: 9, 
    fontWeight: '700', 
    letterSpacing: 0.5 
  },

  info: { 
    flex: 1, 
    padding: 10, 
    paddingRight: 36, 
    gap: 4, 
    justifyContent: 'center' 
  },

  tagRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5 
  },
  tagPill: { 
    borderRadius: 20, 
    paddingHorizontal: 6, 
    paddingVertical: 2 
  },
  tagLabel: { 
    fontSize: 9, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 0.3 
  },
  brand: { 
    fontSize: 9.5, 
    color: '#9ca3af', 
    fontWeight: '600', 
    textTransform: 'uppercase' 
  },

  title: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#111827', 
    lineHeight: 18 
  },

  priceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 2 
  },
  price: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#e84040' 
  },
  oldPrice: { 
    fontSize: 11, 
    color: '#d1d5db', 
    textDecorationLine: 'line-through' 
  },

  desc: { 
    fontSize: 11, 
    color: '#9ca3af', 
    lineHeight: 15, 
    marginTop: 2 
  },

  wishBtn: {
    position: 'absolute', 
    top: 10, 
    right: 10,
    width: 30, 
    height: 30, 
    borderRadius: 15,
    backgroundColor: '#f8f8fb',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  wishActive: { backgroundColor: '#fff0f0' },
});

export default ProductCardList;
