import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';

import { fetchDataFromApi } from '../../utils/api';
import ProductItem from '../ProductItem';
import { Product, RootStackParamList } from '../../types';

const PRODUCTS_PER_PAGE = 20;
const { width } = Dimensions.get('window');
const IS_SMALL_SCREEN = width < 375;
const CARD_GAP = 8;
const HORIZONTAL_PAD = 12;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Shimmer Loading Skeleton ───────────────────────────────────
const ShimmerCard = ({ index }: { index: number }) => {
  const shimmerX = useSharedValue(-width);

  useEffect(() => {
    shimmerX.value = withDelay(
      index * 120,
      withRepeat(
        withTiming(width, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      ),
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(400).springify()}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImage}>
        <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonLine, { width: '90%', height: 8 }]} />
        <View style={[styles.skeletonLine, { width: '45%', height: 14, marginTop: 4 }]} />
      </View>
    </Animated.View>
  );
};

const LoadingSkeleton = () => (
  <View style={styles.skeletonGrid}>
    {[0, 1, 2, 3, 4, 5].map(i => (
      <ShimmerCard key={i} index={i} />
    ))}
  </View>
);

// ─── Animated Product Card Wrapper ──────────────────────────────
const AnimatedProductCard = React.memo(({ item, isNew, localIndex }: { item: Product; isNew: boolean; localIndex: number }) => {
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={isNew ? FadeInUp.delay(Math.min(localIndex * 60, 300)).duration(450).springify().damping(14) : undefined}
      style={[{ width: '48.5%' }, cardStyle]}
    >
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        }}
        style={{ flex: 1 }}
      >
        <ProductItem item={item} variant="grid" />
      </AnimatedPressable>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Prevent re-render when only animation props change
  return prevProps.item._id === nextProps.item._id && 
         prevProps.isNew === nextProps.isNew;
});

// ─── Pulsing Dots Loader ────────────────────────────────────────
const PulsingDots = () => {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
      ),
      -1,
    );
    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
      ),
    );
    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
      ),
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
    transform: [{ scale: interpolate(dot1.value, [0.3, 1], [0.8, 1.2]) }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
    transform: [{ scale: interpolate(dot2.value, [0.3, 1], [0.8, 1.2]) }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3.value,
    transform: [{ scale: interpolate(dot3.value, [0.3, 1], [0.8, 1.2]) }],
  }));

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
};

// ─── Section Header ─────────────────────────────────────────────
const SectionHeaderBlock = ({
  total,
  count,
  onViewAll,
}: {
  total: number;
  count: number;
  onViewAll: () => void;
}) => {
  const underlineWidth = useSharedValue(0);

  useEffect(() => {
    underlineWidth.value = withDelay(300, withSpring(1, { damping: 14, stiffness: 80 }));
  }, []);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: underlineWidth.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={styles.header}
    >
      <View style={styles.headerLeft}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconWrap}>
            <Feather name="shopping-bag" size={14} color="#FF6B2B" />
          </View>
          <Text style={styles.heading}>All Products</Text>
        </View>
        <Animated.View style={[styles.headerUnderline, underlineStyle]} />
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing {count} of {total}
          </Text>
          {total > 0 && (
            <View style={styles.totalBadge}>
              <Feather name="trending-up" size={10} color="#10B981" />
              <Text style={styles.totalBadgeText}>Best Selling</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={onViewAll}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF6B2B', '#FF8F5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.viewAllGradient}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Feather name="arrow-right" size={11} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Component ─────────────────────────────────────────────
const AllProductsSection: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Track how many items existed before last load — only new items animate
  const prevCountRef = useRef(0);

  useEffect(() => {
    fetchDataFromApi(`/api/product/getAllProducts?page=1&limit=${PRODUCTS_PER_PAGE}`)
      .then(res => {
        const prods = res?.products || [];
        const tot = res?.totalProducts ?? res?.total ?? 0;
        prevCountRef.current = 0;
        setProducts(prods);
        setTotal(tot);
        setHasMore(prods.length < tot);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    fetchDataFromApi(`/api/product/getAllProducts?page=${nextPage}&limit=${PRODUCTS_PER_PAGE}`)
      .then(res => {
        const newProds = res?.products || [];
        const tot = res?.totalProducts ?? res?.total ?? total;
        setProducts(prev => {
          prevCountRef.current = prev.length; // remember old count before appending
          const updated = [...prev, ...newProds];
          setHasMore(updated.length < tot);
          return updated;
        });
        setTotal(tot);
        setPage(nextPage);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  }, [page, loadingMore, hasMore, total]);

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      const isNew = index >= prevCountRef.current;
      const localIndex = isNew ? index - prevCountRef.current : index;
      return (
        <AnimatedProductCard
          item={item}
          isNew={isNew}
          localIndex={localIndex}
        />
      );
    },
    [prevCountRef.current],
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={styles.footer}
        >
          <PulsingDots />
          <Text style={styles.footerText}>Loading more products...</Text>
        </Animated.View>
      );
    }
    if (!hasMore && total > 0) {
      return (
        <Animated.View
          entering={FadeInUp.duration(500).springify()}
          style={styles.endBox}
        >
          <LinearGradient
            colors={['#FFF7ED', '#FFF1E6', '#FFEDD5']}
            style={styles.endGradient}
          >
            <Animated.Text
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.endEmoji}
            >
              🎉
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.endTitle}
            >
              You've explored all products!
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(400).duration(400)}
              style={styles.endSub}
            >
              Discover more in our categories
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('products' as any, {})}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FF6B2B', '#FF8F5E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.browseBtnGradient}
                >
                  <Feather name="grid" size={13} color="#fff" />
                  <Text style={styles.browseBtnText}>Browse Categories</Text>
                  <Feather name="arrow-right" size={13} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SectionHeaderBlock total={0} count={0} onViewAll={() => {}} />
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeaderBlock
        total={total}
        count={products.length}
        onViewAll={() => navigation.navigate('products' as any, {})}
      />

      {/* Divider line */}
      <View style={styles.sectionDivider} />

      <FlatList
        data={products}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        scrollEnabled={false}
        nestedScrollEnabled={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={30}
        windowSize={21}
        removeClippedSubviews={false}
      />
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FAFAFA',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,43,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: IS_SMALL_SCREEN ? 18 : 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerUnderline: {
    height: 3,
    width: 48,
    backgroundColor: '#FF6B2B',
    borderRadius: 2,
    marginTop: 6,
    marginLeft: 36,
    transformOrigin: 'left',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginLeft: 36,
  },
  countText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  totalBadgeText: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── View All Button ──
  viewAllBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#FF6B2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Section Divider ──
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginBottom: 10,
  },

  // ── Grid Row ──
  row: {
    justifyContent: 'space-between',
    gap: CARD_GAP,
    marginBottom: 4,
  },

  // ── Best Seller Badge ──
  bestSellerBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bestSellerIcon: {
    fontSize: 10,
  },
  bestSellerText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Loading Skeleton ──
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: '48.5%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F3F5',
    marginBottom: 4,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    width: 80,
    height: '100%',
    position: 'absolute',
  },
  skeletonBody: {
    padding: 10,
    gap: 6,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
  },

  // ── Footer: Loading More ──
  footer: {
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B2B',
  },
  footerText: {
    fontSize: 12,
    color: '#FF6B2B',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Footer: End of List ──
  endBox: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6B2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  endGradient: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,43,0.08)',
  },
  endEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  endTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  endSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  browseBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF6B2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  browseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default AllProductsSection;