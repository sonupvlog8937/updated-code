import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  SafeAreaView,
  Dimensions,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
  runOnJS,
  FadeInDown,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import {
  useAppDispatch,
  useAppSelector,
  fetchHomepageData,
  fetchCategories,
  fetchCartItems,
  fetchMyListData,
  initAuthFromStorage,
} from '@/src/store';
import HomeSlider from '@/src/components/HomeSlider';
import HomeCatSlider from '@/src/components/HomeCatSlider';
import DualBanner from '@/src/components/DualBanner';
import BannerGrid from '@/src/components/BannerGrid';
import ProductItem from '@/src/components/ProductItem';
import AllProductsSection, { AllProductsSectionHandle } from '@/src/components/AllProductsSection';
import GoMarketPromoCard from "@/src/components/GoMarketPromoCard";
import Footer from '@/src/components/Footer';

import {
  Product,
  BannerItem,
  DualBannerData,
  DealData,
  RootStackParamList,
} from '@/src/types';

const { width, height } = Dimensions.get('window');
const IS_SMALL_SCREEN = width < 375;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Design Tokens ────────────────────────────────────────────────
const BRAND = {
  primary:   '#FF6B2B',
  secondary: '#FF4500',
  accent:    '#FF8F5E',
  light:     '#FFF3EE',
  dark:      '#1A1A2E',
  text:      '#111827',
  muted:     '#6B7280',
  surface:   '#FAFAFA',
  border:    'rgba(255,107,43,0.12)',
  shadow:    'rgba(255,107,43,0.18)',
};

// ─── Shimmer Skeleton (lightweight) ──────────────────────────────
function ShimmerCard({ width: w, height: h, radius = 12 }: {
  width: number | string; height: number; radius?: number;
}) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);

  const shimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.8, 0.4]),
  }));

  return (
    <Animated.View
      style={[
        shimStyle,
        { borderRadius: radius, backgroundColor: '#E9ECF0' } as any,
        { width: w as any, height: h },
      ]}
    />
  );
}

// ─── Section Header (no entering animation) ──────────────────────
interface SectionHeaderProps { title: string; onViewAll?: () => void; icon?: keyof typeof Feather.glyphMap; }

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onViewAll, icon }) => {
  const resolvedIcon = icon ?? (title.toLowerCase().includes('featured') ? 'star' : title.toLowerCase().includes('popular') ? 'trending-up' : 'clock');
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionTitleRow}>
        <LinearGradient
          colors={[BRAND.light, 'rgba(255,107,43,0.06)']}
          style={s.sectionIconWrap}
        >
          <Feather name={resolvedIcon as any} size={13} color={BRAND.primary} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle} numberOfLines={1}>{title}</Text>
          <View style={s.sectionUnderline} />
        </View>
      </View>
      {onViewAll && (
        <TouchableOpacity style={s.viewAllBtn} onPress={onViewAll} activeOpacity={0.75}>
          <LinearGradient
            colors={[BRAND.primary, BRAND.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.viewAllGradient}
          >
            <Text style={s.viewAllText}>View All</Text>
            <Feather name="chevron-right" size={11} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Product Grid Card (no entering animation) ──────────────────
const GridCard = ({ item }: { item: Product }) => {
  return (
    <View style={{ width: '48.5%' }}>
      <ProductItem item={item} variant="grid" />
    </View>
  );
};

// ─── Product Row (max 10 items) ──────────────────────────────────
const ProductRow: React.FC<{ products: Product[]; isLoading: boolean }> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <View style={s.skeletonRow}>
        {[0, 1].map(i => (
          <ShimmerCard key={i} width="48.5%" height={IS_SMALL_SCREEN ? 165 : 185} />
        ))}
      </View>
    );
  }
  return (
    <View style={s.productGrid}>
      {products.slice(0, 10).map((item, index) => (
        <GridCard key={item._id || index} item={item} />
      ))}
    </View>
  );
};

// ─── Slider Skeleton (shown only until slider data arrives) ─────
const SliderSkeleton: React.FC = () => (
  <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
    <ShimmerCard width="100%" height={IS_SMALL_SCREEN ? 145 : 165} radius={14} />
  </View>
);

// ─── Categories Skeleton (shown only until category data arrives) ─
const CategoriesSkeleton: React.FC = () => (
  <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
    {[0, 1, 2, 3, 4].map(i => (
      <ShimmerCard key={i} width={70} height={70} radius={35} />
    ))}
  </View>
);

// ─── Countdown Timer (lightweight) ───────────────────────────────
const CountdownTimer = React.memo(() => {
  const [cd, setCd] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const now      = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const ms = endOfDay.getTime() - now.getTime();
      const newH = Math.floor((ms / 3_600_000) % 24);
      const newM = Math.floor((ms /    60_000) % 60);
      const newS = Math.floor((ms /     1_000) % 60);
      setCd({ h: newH, m: newM, s: newS });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={s.cdWrapper}>
      <View style={s.cdAmbient} />
      <View style={s.cdLabelCol}>
        <View style={s.cdFireBadge}>
          <Text style={s.cdFireText}>🔥</Text>
        </View>
        <Text style={s.cdLeftTitle}>{'Deals\nEnd In'}</Text>
      </View>

      <View style={s.cdDividerVert} />

      <View style={s.cdDigitsRow}>
        {[
          { val: cd.h, label: 'HRS' },
          { val: cd.m, label: 'MIN' },
          { val: cd.s, label: 'SEC' },
        ].map(({ val, label }, idx) => (
          <React.Fragment key={label}>
            {idx > 0 && <Text style={s.cdColon}>:</Text>}
            <View style={s.cdBlock}>
              <LinearGradient
                colors={['#FF6B2B', '#FF3D00']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.cdDigitBox}
              >
                <Text style={s.cdDigit}>{pad(val)}</Text>
              </LinearGradient>
              <Text style={s.cdUnit}>{label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={s.cdRightTag}>
        <Text style={s.cdRightTagText}>{'LIMITED\nOFFER'}</Text>
      </View>
    </View>
  );
});

// ─── Deal of the Day Card (lightweight) ──────────────────────────
interface DealCardProps { deal: DealData; onPress?: () => void; }

const DealOfDayCard = React.memo(({ deal, onPress }: DealCardProps) => {
  return (
    <View style={s.dealCard}>
      {/* Header band */}
      <LinearGradient
        colors={['#0D0D0D', '#1A1A1A']}
        style={s.dealTopBand}
      >
        <View style={s.dealTopLeft}>
          <View style={s.dealFlashPill}>
            <Text style={s.dealFlashEmoji}>⚡</Text>
            <Text style={s.dealFlashLabel}>{deal.badge}</Text>
          </View>
          <Text style={s.dealTopSub}>Today only — don't miss it!</Text>
        </View>
        <View style={s.dealDiscBubble}>
          <LinearGradient
            colors={['#FF6B2B', '#FF3D00']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 30, padding: 10, alignItems: 'center', justifyContent: 'center', minWidth: 58, minHeight: 58 }}
          >
            <Text style={s.dealDiscNum}>{deal.discount}%</Text>
            <Text style={s.dealDiscOff}>OFF</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Main body */}
      <LinearGradient
        colors={['#160800', '#2C1500', '#3D1E00']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.dealBody}
      >
        <View style={[s.dealGlow, { top: -70, right: -50, width: 200, height: 200 }]} />
        <View style={[s.dealGlow, { bottom: -40, left: -30, width: 120, height: 120, opacity: 0.04 }]} />

        <View style={s.dealBodyRow}>
          {/* Info column */}
          <View style={s.dealInfoCol}>
            <Text style={s.dealTitle} numberOfLines={2}>{deal.title}</Text>
            <Text style={s.dealSubtitle} numberOfLines={2}>{deal.subtitle}</Text>

            <View style={s.dealRatingRow}>
              <Text style={s.dealStars}>★★★★★</Text>
              <Text style={s.dealReviews}>4.8 · 2.4k</Text>
            </View>

            <View style={s.dealTagsRow}>
              <View style={s.dealTag}><Text style={s.dealTagText}>Premium</Text></View>
              <View style={[s.dealTag, s.dealTagGreen]}>
                <Text style={[s.dealTagText, s.dealTagGreenText]}>In Stock</Text>
              </View>
            </View>

            <Pressable onPress={onPress} style={s.dealCtaBtn}>
              <LinearGradient
                colors={[BRAND.primary, BRAND.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.dealCtaGradient}
              >
                <Text style={s.dealCtaText}>{deal.ctaText}</Text>
                <Feather name="arrow-right" size={14} color="#fff" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Image column */}
          <View style={s.dealImgCol}>
            <Pressable style={s.dealImgWrap}>
              <Image
                source={{ uri: deal.image }}
                style={s.dealImg}
                resizeMode="cover"
              />
              <Pressable style={s.dealWish}>
                <Feather name="heart" size={15} color={BRAND.primary} />
              </Pressable>
              <LinearGradient
                colors={['#FF4500', '#FF6B2B']}
                style={s.dealImgTag}
              >
                <Text style={s.dealImgTagText}>{deal.discount}% OFF</Text>
              </LinearGradient>
            </Pressable>

            {/* Sold progress */}
            <View style={s.dealSoldRow}>
              <Text style={s.dealSoldLabel}>68% sold</Text>
              <View style={s.dealSoldBar}>
                <View style={[s.dealSoldFill, { width: '68%' }]} />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

// ─── Login Modal ──────────────────────────────────────────────────
function LoginModal({ visible, onClose, onLogin, onRegister }: {
  visible: boolean; onClose: () => void; onLogin: () => void; onRegister: () => void;
}) {
  const backdropOpacity = useSharedValue(0);
  const cardScale       = useSharedValue(0.82);
  const cardOpacity     = useSharedValue(0);
  const cardTranslateY  = useSharedValue(50);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      backdropOpacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.ease) });
      cardOpacity.value     = withDelay(80, withTiming(1, { duration: 300 }));
      cardScale.value       = withDelay(80, withSpring(1, { damping: 13, stiffness: 110 }));
      cardTranslateY.value  = withDelay(80, withSpring(0, { damping: 15, stiffness: 100 }));
    } else if (isRendered) {
      cardScale.value      = withTiming(0.92, { duration: 220, easing: Easing.in(Easing.ease) });
      cardOpacity.value    = withTiming(0,    { duration: 220 });
      cardTranslateY.value = withTiming(28,   { duration: 220 });
      backdropOpacity.value = withTiming(0,   { duration: 320, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(setIsRendered)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle     = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }, { translateY: cardTranslateY.value }],
  }));

  if (!isRendered) return null;

  return (
    <Modal transparent visible={isRendered} statusBarTranslucent onRequestClose={onClose}>
      <View style={ms.modalRoot}>
        <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]}>
          <Pressable style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[ms.cardWrapper, cardStyle]}>
          <View style={ms.card}>
            {/* Close */}
            <Pressable style={ms.closeBtn} onPress={onClose} hitSlop={14}>
              <Feather name="x" size={17} color="rgba(255,255,255,0.85)" />
            </Pressable>

            {/* Header gradient */}
            <LinearGradient
              colors={['#FF6B2B', '#FF5722', '#FF8F5E']}
              start={{ x: 0, y: 0 }} end={{ x: 1.2, y: 1 }}
              style={ms.header}
            >
              <View style={[ms.headerCircle, { width: 110, height: 110, top: -35, right: -25, opacity: 0.09 }]} />
              <View style={[ms.headerCircle, { width: 65,  height: 65,  bottom: -12, left: 22,  opacity: 0.07 }]} />

              <View style={ms.iconBadge}>
                <Feather name="shopping-bag" size={22} color={BRAND.primary} />
              </View>
              <Text style={ms.tagText}>Welcome</Text>
              <Text style={ms.titleText}>{'Exclusive access\nawaits you ✨'}</Text>
              <Text style={ms.subText}>Login for faster checkout, wishlist sync, premium offers & order tracking.</Text>
            </LinearGradient>

            {/* Body */}
            <View style={ms.body}>
              <View style={ms.benefitsRow}>
                {([
                  { icon: 'zap'   as const, label: 'Fast Checkout' },
                  { icon: 'heart' as const, label: 'Wishlist Sync' },
                  { icon: 'gift'  as const, label: 'Premium Offers' },
                ] as const).map((item, i) => (
                  <View key={i} style={ms.benefitItem}>
                    <LinearGradient
                      colors={[BRAND.light, 'rgba(255,107,43,0.06)']}
                      style={ms.benefitIcon}
                    >
                      <Feather name={item.icon} size={14} color={BRAND.primary} />
                    </LinearGradient>
                    <Text style={ms.benefitLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={ms.divider}>
                <View style={ms.dividerLine} />
              </View>

              <Pressable onPress={onLogin} style={ms.loginBtn}>
                <LinearGradient
                  colors={['#FF6B2B', '#FF5722', '#FF8F5E']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={ms.loginBtnGradient}
                >
                  <Feather name="log-in" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={ms.loginBtnText}>Login Now</Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={onClose} style={ms.skipBtn}>
                <Text style={ms.skipText}>Maybe later</Text>
                <Feather name="chevron-right" size={13} color="#B0B7C3" />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Promo Strip (lightweight) ───────────────────────────────────
const PromoStrip: React.FC = () => {
  const translateX = useSharedValue(0);

  const items = [
    '🚚  Free delivery on orders above ₹499',
    '🎁  Grocery and Restaurant in GoMarket',
    '⭐  Grocery and Restaurant in minutes Deliveries',
    '🔄  Successful deliveries every time',
  ];
  const fullText = items.join('     •     ');

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-width * 2, { duration: 18000, easing: Easing.linear }),
      -1, false
    );
  }, []);

  const tickerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <View style={s.promoStrip}>
      <Animated.Text style={[s.promoText, tickerStyle]} numberOfLines={1}>
        {fullText}{'     •     '}{fullText}
      </Animated.Text>
    </View>
  );
};

// ─── Section types for lazy FlatList ──────────────────────────────
type SectionItem =
  | { type: 'promo' }
  | { type: 'slider' }
  | { type: 'categories' }
  | { type: 'featured' }
  | { type: 'popular' }
  | { type: 'goMarketPromo' }
  | { type: 'countdown' }
  | { type: 'latest' }
  | { type: 'dealOfDay' }
  | { type: 'dualBanner' }
  | { type: 'bannerGrid' }
  | { type: 'allProducts' };

// ─── HomeScreen ───────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch   = useAppDispatch();

  const homePageLoading  = useAppSelector(s => s.app.homePageLoading);
  const catData          = useAppSelector(s => s.app.catData);
  const homepageSlides   = useAppSelector(s => s.app.homepageSlides);
  const homepageFeatured = useAppSelector(s => s.app.homepageFeatured);
  const homepagePopular  = useAppSelector(s => (s.app as any).homepagePopular || []);
  const homepageLatest   = useAppSelector(s => s.app.homepageLatest);
  const isLoggedIn       = useAppSelector(s => s.app.isLogin);

  const [refreshing,     setRefreshing]     = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dualBannerData, setDualBannerData] = useState<DualBannerData | null>(null);
  const [bannerGridData, setBannerGridData] = useState<BannerItem[]>([]);
  const [dealOfDayData,  setDealOfDayData]  = useState<DealData | null>(null);

  // Ref into AllProductsSection so the OUTER (real) scroll can drive its pagination
  const allProductsRef = useRef<AllProductsSectionHandle>(null);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token && !isLoggedIn) setTimeout(() => setShowLoginModal(true), 1000);
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    dispatch(fetchHomepageData()   as any);
    dispatch(fetchCategories()     as any);
    dispatch(initAuthFromStorage() as any);
  }, [dispatch]);

  useEffect(() => {
    if (catData.length === 0) return; // Wait for data before setting static content

    setDualBannerData({
      leftBanner: {
        title: "Men's Collection",
        subtitle: 'Shirts, Jeans, T-Shirts & Formal Wear',
        image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&q=80'],
        badge: 'NEW ARRIVALS',
        ctaText: "Shop Men's",
        catId: catData.find(c => c.name?.toLowerCase().includes('men'))?._id || 'mens',
      },
      rightBanner: {
        title: "Women's Fashion",
        subtitle: 'Kurtis, Sarees, Lehengas & Casual Wear',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'],
        badge: 'TRENDING',
        ctaText: "Shop Women's",
        catId: catData.find(c => c.name?.toLowerCase().includes('women'))?._id || 'womens',
      },
    });

    setBannerGridData([
      {
        _id: 'g1', title: 'Shirts & T-Shirts', subtitle: 'Casual & Formal',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
        images: [], badge: '30% OFF',
        catId: catData.find(c => c.name?.toLowerCase().includes('shirt'))?._id || 'shirts',
      },
      {
        _id: 'g2', title: 'Jeans & Pants', subtitle: 'Trending styles',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
        images: [], badge: 'SALE',
        catId: catData.find(c => c.name?.toLowerCase().includes('jean') || c.name?.toLowerCase().includes('pant'))?._id || 'jeans',
      },
      {
        _id: 'g3', title: 'Kurtas & Kurtis', subtitle: 'Ethnic collection',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
        images: [], badge: 'NEW',
        catId: catData.find(c => c.name?.toLowerCase().includes('kurta') || c.name?.toLowerCase().includes('kurti'))?._id || 'kurtas',
      },
    ]);

    setDealOfDayData({
      title: 'Elegant Red Kurti Collection',
      subtitle: 'Discover timeless style with beautifully crafted red kurti suits, perfect for every occasion',
      image: 'https://res.cloudinary.com/dn7ko6gut/image/upload/v1781047013/ChatGPT_Image_Jun_10_2026_04_46_30_AM_ln6uad.png',
      badge: 'Deal of the Day',
      discount: 50,
      endTime: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      ctaText: 'Grab Deal Now',
    });
  }, [catData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchHomepageData() as any);
    if (isLoggedIn) {
      await Promise.all([
        dispatch(fetchCartItems()  as any),
        dispatch(fetchMyListData() as any),
      ]);
    }
    setRefreshing(false);
  }, [dispatch, isLoggedIn]);

  const navigate = (screen: string, params?: any) =>
    navigation.navigate(screen as any, params);

  // Fired when the real (outer) scroll reaches near the bottom — drives AllProductsSection's pagination
  const handleEndReached = useCallback(() => {
    allProductsRef.current?.loadMore();
  }, []);

  // ── Progressive section list ──────────────────────────────────
  // Har section apna data mil jaane par turant render hota hai, poore
  // page ke liye ek single loader ka wait nahi karna padta. Jab tak
  // us particular section ka data nahi aaya (aur homePageLoading abhi
  // bhi true hai), sirf uska apna shimmer/skeleton dikhta hai.
  // Jaise hi homePageLoading false ho jaata hai aur data khaali hai,
  // wo section poori tarah hide ho jaata hai (jaisa pehle tha).
  const showSlider     = homePageLoading || homepageSlides.length   > 0;
  const showCategories = homePageLoading || catData.length          > 0;
  const showFeatured   = homePageLoading || homepageFeatured.length > 0;
  const showPopular    = homePageLoading || homepagePopular.length  > 0;
  const showLatest     = homePageLoading || homepageLatest.length   > 0;

  const sections: SectionItem[] = useMemo(() => {
    const items: SectionItem[] = [];
    items.push({ type: 'promo' });
    if (showSlider) items.push({ type: 'slider' });
    if (showCategories) items.push({ type: 'categories' });
    if (showFeatured) items.push({ type: 'featured' });
    if (showPopular) items.push({ type: 'popular' });
    items.push({ type: 'goMarketPromo' });
    items.push({ type: 'countdown' });
    if (showLatest) items.push({ type: 'latest' });
    if (dealOfDayData) items.push({ type: 'dealOfDay' });
    if (dualBannerData) items.push({ type: 'dualBanner' });
    if (bannerGridData.length > 0) items.push({ type: 'bannerGrid' });
    items.push({ type: 'allProducts' });
    return items;
  }, [showSlider, showCategories, showFeatured, showPopular, showLatest, dealOfDayData, dualBannerData, bannerGridData]);

  const renderSection = useCallback(({ item }: { item: SectionItem }) => {
    switch (item.type) {
      case 'promo':
        return <PromoStrip />;
      case 'slider':
        return homepageSlides.length > 0
          ? <HomeSlider data={homepageSlides} />
          : <SliderSkeleton />;
      case 'categories':
        return catData.length > 0
          ? <HomeCatSlider data={catData} />
          : <CategoriesSkeleton />;
      case 'featured':
        return (
          <View style={s.section}>
            <SectionHeader
              title="Featured Products"
              icon="star"
              onViewAll={() => navigate('products', { filterType: 'featured', categoryName: 'Featured Products' })}
            />
            <ProductRow products={homepageFeatured} isLoading={homepageFeatured.length === 0} />
          </View>
        );
      case 'popular':
        return (
          <View style={s.section}>
            <SectionHeader
              title="Popular Products"
              icon="trending-up"
              onViewAll={() => navigate('products', { filterType: 'popular', categoryName: 'Popular Products' })}
            />
            <ProductRow products={homepagePopular} isLoading={homepagePopular.length === 0} />
          </View>
        );
      // case 'goMarketPromo':
      //   return <GoMarketPromoCard />;
      // case 'countdown':
      //   return <CountdownTimer />;
      case 'latest':
        return (
          <View style={s.section}>
            <SectionHeader
              title="Latest Products"
              icon="clock"
              onViewAll={() => navigate('products', { filterType: 'latest', categoryName: 'Latest Products' })}
            />
            <ProductRow products={homepageLatest} isLoading={homepageLatest.length === 0} />
          </View>
        );
      case 'dealOfDay':
        return dealOfDayData ? (
          <DealOfDayCard
            deal={dealOfDayData}
            onPress={() => navigate('products', { filterType: 'deal', categoryName: 'Deal of the Day' })}
          />
        ) : null;
      case 'dualBanner':
        return dualBannerData ? (
          <DualBanner leftBanner={dualBannerData.leftBanner} rightBanner={dualBannerData.rightBanner} />
        ) : null;
      case 'bannerGrid':
        return <BannerGrid banners={bannerGridData} columns={3} />;
      case 'allProducts':
        return <AllProductsSection ref={allProductsRef} />;
      default:
        return null;
    }
  }, [homepageSlides, catData, homepageFeatured, homepagePopular, homepageLatest, dealOfDayData, dualBannerData, bannerGridData]);

  const keyExtractor = useCallback((item: SectionItem, index: number) => `${item.type}-${index}`, []);

  return (
    <SafeAreaView style={s.safeArea}>
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => { setShowLoginModal(false); navigate('login'); }}
        onRegister={() => { setShowLoginModal(false); navigate('register'); }}
      />

      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={keyExtractor}
        // ListFooterComponent={() => <Footer />}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND.primary}
            colors={[BRAND.primary]}
          />
        }
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        windowSize={7}
        maxToRenderPerBatch={5}
        initialNumToRender={sections.length}
        overScrollMode="never"
      />
    </SafeAreaView>
  );
};

// ─── Modal Styles ─────────────────────────────────────────────────
const ms = StyleSheet.create({
  modalRoot:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrapper:{
    width: '100%', paddingHorizontal: IS_SMALL_SCREEN ? 16 : 22,
    maxWidth: Math.min(width - 32, 410),
  },
  card: {
    borderRadius: 26, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 36,
    elevation: 18,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  header: {
    paddingTop: IS_SMALL_SCREEN ? 30 : 38,
    paddingBottom: IS_SMALL_SCREEN ? 24 : 30,
    paddingHorizontal: IS_SMALL_SCREEN ? 20 : 24,
    position: 'relative', overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', borderRadius: 999, backgroundColor: '#fff',
  },
  iconBadge: {
    width: 50, height: 50, borderRadius: 17, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
  },
  tagText: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)',
    color: '#fff', fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.8,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    marginBottom: 10, overflow: 'hidden',
  },
  titleText: {
    color: '#fff', fontSize: IS_SMALL_SCREEN ? 22 : 26,
    fontWeight: '800', lineHeight: IS_SMALL_SCREEN ? 28 : 33, marginBottom: 8,
    letterSpacing: -0.5,
  },
  subText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: IS_SMALL_SCREEN ? 12 : 13.5, lineHeight: IS_SMALL_SCREEN ? 17 : 19.5,
    fontWeight: '400',
  },
  body: {
    backgroundColor: '#fff',
    paddingHorizontal: IS_SMALL_SCREEN ? 18 : 22,
    paddingTop: IS_SMALL_SCREEN ? 18 : 22,
    paddingBottom: IS_SMALL_SCREEN ? 18 : 22,
    gap: 12,
  },
  benefitsRow:  { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  benefitItem:  { alignItems: 'center', gap: 6 },
  benefitIcon:  {
    width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
  },
  benefitLabel: { fontSize: 10.5, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  divider:      { paddingVertical: 2 },
  dividerLine:  { height: 1, backgroundColor: '#F0F2F5' },
  loginBtn: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  loginBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: IS_SMALL_SCREEN ? 14 : 16, borderRadius: 16, overflow: 'hidden',
  },
  loginBtnText: {
    color: '#fff', fontWeight: '800',
    fontSize: IS_SMALL_SCREEN ? 14.5 : 15.5, letterSpacing: 0.2,
  },
  registerBtn: {
    borderWidth: 1.5, borderColor: BRAND.primary, borderRadius: 16, overflow: 'hidden',
  },
  registerBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: IS_SMALL_SCREEN ? 13 : 15,
  },
  registerBtnText: {
    color: BRAND.primary, fontWeight: '700',
    fontSize: IS_SMALL_SCREEN ? 14.5 : 15.5, letterSpacing: 0.2,
  },
  skipBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 4 },
  skipText: { textAlign: 'center', color: '#B0B7C3', fontSize: 13, fontWeight: '500' },
});

// ─── Screen Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  section: {
    backgroundColor: '#fff', paddingHorizontal: 12,
    paddingTop: 16, paddingBottom: 6,
  },

  // Promo strip
  promoStrip: {
    backgroundColor: BRAND.text, overflow: 'hidden',
    paddingVertical: 7,
  },
  promoText: {
    color: '#fff', fontSize: 11.5, fontWeight: '500',
    letterSpacing: 0.2, paddingHorizontal: 8,
    minWidth: width * 5,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, gap: 8,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: IS_SMALL_SCREEN ? 17 : 18.5, fontWeight: '800',
    color: BRAND.text, letterSpacing: -0.3,
  },
  sectionUnderline: {
    height: 2.5, width: 38, backgroundColor: BRAND.primary,
    borderRadius: 2, marginTop: 4,
  },
  viewAllBtn: {
    borderRadius: 10, overflow: 'hidden',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 5, elevation: 3,
  },
  viewAllGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  viewAllText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  // Product grid
  productGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingBottom: 4, justifyContent: 'space-between',
  },
  skeletonRow: { flexDirection: 'row', gap: 8, marginBottom: 4, justifyContent: 'space-between' },

  // Countdown
  cdWrapper: {
    marginHorizontal: 12, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111218', borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14,
    elevation: 7, gap: 10, overflow: 'hidden',
  },
  cdAmbient: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,107,43,0.06)', top: -50, right: -30,
  },
  cdLabelCol:    { alignItems: 'center', gap: 6 },
  cdFireBadge:   {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: 'rgba(255,107,43,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  cdFireText:    { fontSize: 17 },
  cdLeftTitle:   {
    fontSize: 10, fontWeight: '800', color: '#999',
    textAlign: 'center', letterSpacing: 0.4, lineHeight: 14,
  },
  cdDividerVert: { width: 1, height: 52, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 2 },
  cdDigitsRow:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  cdBlock:       { alignItems: 'center', gap: 5 },
  cdDigitBox:    {
    width: IS_SMALL_SCREEN ? 44 : 50, height: IS_SMALL_SCREEN ? 44 : 50,
    borderRadius: 13, alignItems: 'center', justifyContent: 'center',
  },
  cdDigit:       {
    fontSize: IS_SMALL_SCREEN ? 21 : 23, fontWeight: '900',
    color: '#fff', letterSpacing: -0.5,
  },
  cdUnit:        { fontSize: 9, fontWeight: '700', color: '#777', letterSpacing: 1 },
  cdColon:       {
    fontSize: 22, fontWeight: '900', color: BRAND.primary,
    marginBottom: 12, marginHorizontal: 1, opacity: 0.9,
  },
  cdRightTag:    {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,107,43,0.14)',
    paddingHorizontal: 9, paddingVertical: 9, borderRadius: 11,
  },
  cdRightTagText:{ fontSize: 9.5, fontWeight: '800', color: BRAND.primary, textAlign: 'center', letterSpacing: 0.5, lineHeight: 13.5 },

  // Deal of Day
  dealCard: {
    marginHorizontal: 12, marginBottom: 18,
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 18,
    elevation: 10,
  },
  dealTopBand: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
  },
  dealTopLeft:    { flex: 1, gap: 4 },
  dealFlashPill:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,107,43,0.18)',
    paddingHorizontal: 10, paddingVertical: 4.5, borderRadius: 20,
  },
  dealFlashEmoji: { fontSize: 12 },
  dealFlashLabel: { fontSize: 11.5, fontWeight: '800', color: BRAND.primary, letterSpacing: 0.4, textTransform: 'uppercase' },
  dealTopSub:     { fontSize: 11, color: '#777', fontWeight: '500', marginLeft: 2 },
  dealDiscBubble: {},
  dealDiscNum:    { fontSize: 19, fontWeight: '900', color: '#fff', lineHeight: 21 },
  dealDiscOff:    { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.6 },
  dealBody:       { padding: 14, position: 'relative', overflow: 'hidden' },
  dealGlow:       { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,107,43,0.07)' },
  dealBodyRow:    { flexDirection: 'row', gap: 12 },
  dealInfoCol:    { flex: 1, gap: 8 },
  dealTitle:      {
    fontSize: IS_SMALL_SCREEN ? 17 : 19, fontWeight: '800',
    color: '#fff', letterSpacing: -0.5, lineHeight: IS_SMALL_SCREEN ? 22 : 25,
  },
  dealSubtitle:   { fontSize: 12.5, fontWeight: '400', color: 'rgba(255,255,255,0.58)', lineHeight: 18 },
  dealRatingRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealStars:      { fontSize: 12, color: '#FFD700', letterSpacing: 1 },
  dealReviews:    { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  dealTagsRow:    { flexDirection: 'row', gap: 6 },
  dealTag:        { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 7 },
  dealTagText:    { fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.72)' },
  dealTagGreen:   { backgroundColor: 'rgba(134,239,172,0.14)' },
  dealTagGreenText:{ color: '#86EFAC' },
  dealCtaBtn:     { borderRadius: 13, overflow: 'hidden', marginTop: 4 },
  dealCtaGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  dealCtaText:    { fontSize: IS_SMALL_SCREEN ? 13.5 : 14.5, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  dealImgCol:     { gap: 9 },
  dealImgWrap:    { position: 'relative' },
  dealImg:        {
    width: IS_SMALL_SCREEN ? 102 : 115, height: IS_SMALL_SCREEN ? 102 : 115,
    borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dealWish: {
    position: 'absolute', top: 7, right: 7, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(22,8,0,0.75)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,107,43,0.28)',
  },
  dealImgTag: {
    position: 'absolute', bottom: 7, left: 7,
    paddingHorizontal: 7, paddingVertical: 3.5, borderRadius: 7,
  },
  dealImgTagText: { fontSize: 9.5, fontWeight: '900', color: '#fff', letterSpacing: 0.4 },
  dealSoldRow:    { gap: 5 },
  dealSoldLabel:  { fontSize: 9.5, fontWeight: '600', color: 'rgba(255,255,255,0.48)', textAlign: 'right' },
  dealSoldBar: {
    height: 4.5, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3, overflow: 'hidden',
    width: IS_SMALL_SCREEN ? 102 : 115,
  },
  dealSoldFill:   { height: 4.5, backgroundColor: BRAND.primary, borderRadius: 3 },
});

export default HomeScreen;