import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BannerItem, DualBannerData, RootStackParamList } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 12 * 3) / 2;

interface BannerCardProps {
  banner: BannerItem;
  position: 'left' | 'right';
}

const BannerCard: React.FC<BannerCardProps> = ({ banner, position }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  if (!banner) return null;

  const handlePress = () => {
    navigation.navigate('products' as any, { catId: banner?.catId });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={handlePress}
    >
      <Image
        source={{ uri: banner?.images?.[0] || banner?.image }}
        style={styles.img}
        resizeMode="cover"
        defaultSource={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80' }}
      />
      {/* Gradient overlay */}
      <View style={[styles.overlay, position === 'left' ? styles.overlayLeft : styles.overlayRight]} />

      {/* Content */}
      <View style={[styles.content, position === 'right' && styles.contentRight]}>
        {banner?.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{banner.badge}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>{banner?.title || 'Special Offer'}</Text>
        {banner?.subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>{banner.subtitle}</Text>
        )}
        <View style={styles.ctaBtn}>
          <Text style={styles.ctaText}>{banner?.ctaText || 'Explore'} →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface Props {
  leftBanner: BannerItem;
  rightBanner: BannerItem;
}

const DualBanner: React.FC<Props> = ({ leftBanner, rightBanner }) => {
  if (!leftBanner && !rightBanner) return null;

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        {leftBanner && <BannerCard banner={leftBanner} position="left" />}
        {rightBanner && <BannerCard banner={rightBanner} position="right" />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    width: CARD_W,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayLeft: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayRight: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  contentRight: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#FF6B2B',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginBottom: 8,
  },
  ctaBtn: {
    backgroundColor: 'rgba(255,107,43,0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});

export default DualBanner;
