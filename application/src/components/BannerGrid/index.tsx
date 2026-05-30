import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BannerItem, RootStackParamList } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  banners: BannerItem[];
  columns?: number;
}

const BannerGrid: React.FC<Props> = ({ banners = [], columns = 3 }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  if (!banners || banners.length === 0) return null;

  // Calculate item width to fit exactly 3 items in one row with proper spacing
  const horizontalPadding = 12 * 2; // 12px padding on each side
  const gapBetweenItems = 8 * 2; // 8px gap between 3 items (2 gaps)
  const ITEM_W = (SCREEN_W - horizontalPadding - gapBetweenItems) / 3;
  const ITEM_H = ITEM_W * 1.3; // Slightly taller ratio for better appearance

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Shop by Category</Text>
        <Text style={styles.subheading}>Explore our trending fashion collections</Text>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={banner?._id || index}
            style={[styles.item, { width: ITEM_W, height: ITEM_H }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('products' as any, { catId: banner?.catId })}
          >
            <Image
              source={{ uri: banner?.images?.[0] || banner?.image }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              defaultSource={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80' }}
            />
            {/* Overlay */}
            <View style={styles.overlay} />

            {/* Badge */}
            {banner?.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{banner.badge}</Text>
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>{banner.title}</Text>
              {banner?.subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>{banner.subtitle}</Text>
              )}
              <View style={styles.cta}>
                <Text style={styles.ctaText}>Explore Now →</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  subheading: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'nowrap', // Prevent wrapping to keep all items in one row
    gap: 8,
    justifyContent: 'space-between',
  },
  item: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B2B',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 6,
  },
  cta: {
    backgroundColor: 'rgba(255,107,43,0.9)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default BannerGrid;
