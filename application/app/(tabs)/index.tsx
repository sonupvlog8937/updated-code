import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppDispatch, useAppSelector, fetchHomepageData, fetchCategories, fetchCartItems, fetchMyListData, initAuthFromStorage } from '@/src/store';
import HomeSlider from '@/src/components/HomeSlider';
import HomeCatSlider from '@/src/components/HomeCatSlider';
import DualBanner from '@/src/components/DualBanner';
import BannerGrid from '@/src/components/BannerGrid';
import DealOfTheDay from '@/src/components/DealOfTheDay';
import FlashSaleBanner from '@/src/components/FlashSaleBanner';
import {
  BenefitsSection,
} from '@/src/components/HomeSections';
import ProductItem from '@/src/components/ProductItem';
import AllProductsSection from '@/src/components/AllProductsSection';

import {
  Product,
  BannerItem,
  DualBannerData,
  DealData,
  RootStackParamList,
} from '@/src/types';

const { width } = Dimensions.get('window');
const IS_SMALL_SCREEN = width < 375;

// Default banners fallback
const DEFAULT_BANNER_BOX = [
  { _id: '1', img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80', bannerTitle: 'Ethnic Wear', catId: 'ethnic' },
  { _id: '2', img: 'https://images.unsplash.com/photo-1539533057592-4d2b7d37f537?w=400&q=80', bannerTitle: 'Sports Wear', catId: 'sports' },
  { _id: '3', img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80', bannerTitle: 'Accessories', catId: 'accessories' },
];

const DEFAULT_BANNER_BOX_V2 = [
  { _id: '4', image: 'https://images.unsplash.com/photo-1595847368919-86d02d198b74?w=500&q=80', bannerTitle: 'Summer Collection', catId: 'summer', price: 2499 },
  { _id: '5', image: 'https://images.unsplash.com/photo-1611003228941-98852ba62227?w=500&q=80', bannerTitle: 'Winter Jackets', catId: 'winter', price: 3999 },
];

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onViewAll }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionTitle} numberOfLines={1}>{title}</Text>
    {onViewAll && (
      <TouchableOpacity style={s.viewAllBtn} onPress={onViewAll}>
        <Text style={s.viewAllText}>View All →</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface ProductRowProps {
  products: Product[];
  isLoading: boolean;
}

const ProductRow: React.FC<ProductRowProps> = ({ products, isLoading }) => {
  if (isLoading) return (
    <View style={s.skeletonRow}>
      {[1, 2].map(i => <View key={i} style={s.skeletonCard} />)}
    </View>
  );

  return (
    <View style={s.productGrid}>
      {products.slice(0, 8).map((item, index) => (
        <View key={item._id || index} style={{ width: '48.5%' }}>
          <ProductItem item={item} variant="grid" />
        </View>
      ))}
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const homePageLoading = useAppSelector(s => s.app.homePageLoading);
  const catData = useAppSelector(s => s.app.catData);
  const homepageSlides = useAppSelector(s => s.app.homepageSlides);
  const homepageFeatured = useAppSelector(s => s.app.homepageFeatured);
  const homepageLatest = useAppSelector(s => s.app.homepageLatest);
  const isLoggedIn = useAppSelector(s => s.app.isLogin);

  const [refreshing, setRefreshing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dualBannerData, setDualBannerData] = useState<DualBannerData | null>(null);
  const [bannerGridData, setBannerGridData] = useState<BannerItem[]>([]);
  const [dealOfDayData, setDealOfDayData] = useState<DealData | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token && !isLoggedIn) {
        setTimeout(() => setShowLoginModal(true), 900);
      }
    };
    checkLogin();
  }, [isLoggedIn]);

  useEffect(() => {
    dispatch(fetchHomepageData() as any);
    dispatch(fetchCategories() as any);
    dispatch(initAuthFromStorage() as any);
  }, [dispatch]);

  useEffect(() => {
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
      { _id: 'g1', title: 'Shirts & T-Shirts', subtitle: 'Casual & Formal', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80', images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80'], badge: '30% OFF', catId: catData.find(c => c.name?.toLowerCase().includes('shirt'))?._id || 'shirts' },
      { _id: 'g2', title: 'Jeans & Pants', subtitle: 'Trending styles', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80', images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80'], badge: 'SALE', catId: catData.find(c => c.name?.toLowerCase().includes('jean') || c.name?.toLowerCase().includes('pant'))?._id || 'jeans' },
      { _id: 'g3', title: 'Kurtas & Kurtis', subtitle: 'Ethnic collection', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80', images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80'], badge: 'NEW', catId: catData.find(c => c.name?.toLowerCase().includes('kurta') || c.name?.toLowerCase().includes('kurti'))?._id || 'kurtas' },
    ]);

    setDealOfDayData({
      title: 'Designer Kurta Set',
      subtitle: 'Premium cotton fabric with intricate embroidery',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
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
      await dispatch(fetchCartItems() as any);
      await dispatch(fetchMyListData() as any);
    }
    setRefreshing(false);
  }, [dispatch, isLoggedIn]);

  const renderLoginModal = () => (
    <Modal
      visible={showLoginModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLoginModal(false)}
    >
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTag}>Welcome</Text>
            <Text style={s.modalTitle}>Exclusive access awaits you ✨</Text>
            <Text style={s.modalSub}>Login for faster checkout, wishlist sync, premium offers & order tracking.</Text>
          </View>
          <View style={s.modalBody}>
            <TouchableOpacity
              style={s.loginBtn}
              onPress={() => { setShowLoginModal(false); navigation.navigate('login' as any); }}
            >
              <Text style={s.loginBtnText}>Login Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.registerBtn}
              onPress={() => { setShowLoginModal(false); navigation.navigate('register' as any); }}
            >
              <Text style={s.registerBtnText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLoginModal(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <>
      {homePageLoading ? <View style={s.sliderSkeleton} /> : <HomeSlider data={homepageSlides} />}
      {catData.length > 0 && <HomeCatSlider data={catData} />}
      {dualBannerData && <DualBanner leftBanner={dualBannerData.leftBanner} rightBanner={dualBannerData.rightBanner} />}
      {bannerGridData.length > 0 && <BannerGrid banners={bannerGridData} columns={3} />}
      <BenefitsSection />
      <FlashSaleBanner />
      
      <View style={s.section}>
        <SectionHeader title="Featured Products" onViewAll={() => navigation.navigate('products' as any, { filterType: 'featured', categoryName: 'Featured Products' })} />
        <ProductRow products={homepageFeatured} isLoading={homePageLoading} />
      </View>

      {dealOfDayData && <DealOfTheDay deal={dealOfDayData} />}

      <View style={s.section}>
        <SectionHeader title="Latest Products" onViewAll={() => navigation.navigate('products' as any, { filterType: 'latest', categoryName: 'Latest Products' })} />
        <ProductRow products={homepageLatest} isLoading={homePageLoading} />
      </View>

      {dualBannerData && <DualBanner leftBanner={dualBannerData.leftBanner} rightBanner={dualBannerData.rightBanner} />}
      {bannerGridData.length > 0 && <BannerGrid banners={bannerGridData} columns={3} />}
    </>
  );

  const renderFooter = () => (
    <>
      <View style={{ height: 62 }} />
    </>
  );

  return (
    <SafeAreaView style={s.safeArea}>
      {renderLoginModal()}
      <FlatList
        ListHeaderComponent={renderHeader}
        data={[{ id: 'allProducts' }]}
        renderItem={() => <AllProductsSection />}
        keyExtractor={() => 'allProducts'}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B2B" />}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  section: { backgroundColor: '#fff', paddingHorizontal: 10, paddingTop: 12, paddingBottom: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  sectionTitle: { fontSize: IS_SMALL_SCREEN ? 17 : 18, fontWeight: '800', color: '#111827', flex: 1 },
  viewAllBtn: { backgroundColor: '#FF6B2B', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minHeight: 32 },
  viewAllText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 2, justifyContent: 'space-between' },
  skeletonRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  skeletonCard: { flex: 1, height: IS_SMALL_SCREEN ? 160 : 180, backgroundColor: '#F3F4F6', borderRadius: 10 },
  sliderSkeleton: { marginHorizontal: 10, marginVertical: 4, height: IS_SMALL_SCREEN ? 140 : 160, backgroundColor: '#E5E7EB', borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 12 },
  modalCard: { width: '100%', maxWidth: Math.min(width - 20, 420), borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  modalHeader: { padding: IS_SMALL_SCREEN ? 18 : 20, backgroundColor: '#FF6B2B', gap: 6 },
  modalTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16 },
  modalTitle: { color: '#fff', fontSize: IS_SMALL_SCREEN ? 19 : 21, fontWeight: '800', lineHeight: 26 },
  modalSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 17 },
  modalBody: { backgroundColor: '#fff', padding: 16, gap: 8 },
  loginBtn: { backgroundColor: '#FF6B2B', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  registerBtn: { borderWidth: 1.5, borderColor: '#FF6B2B', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  registerBtnText: { color: '#FF6B2B', fontWeight: '700', fontSize: 13 },
  cancelText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, paddingVertical: 3 },
  bannerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bannerGridItem: { flex: 1, minWidth: '30%' },
  bannerV2Container: { flexDirection: 'row', gap: 10 },
  bannerV2Item: { flex: 1 },
});

export default HomeScreen;
