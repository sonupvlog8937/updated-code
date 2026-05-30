import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchDataFromApi } from '../../utils/api';
import ProductItem from '../ProductItem';
import { Product, RootStackParamList } from '../../types';

const PRODUCTS_PER_PAGE = 10;
const { width } = Dimensions.get('window');
const IS_SMALL_SCREEN = width < 375;

const AllProductsSection: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchDataFromApi(`/api/product/getAllProducts?page=1&limit=${PRODUCTS_PER_PAGE}`)
      .then(res => {
        const prods = res?.products || [];
        const tot = res?.totalProducts ?? res?.total ?? 0;
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
    ({ item, index }: { item: Product; index: number }) => (
      <View style={{ width: '48.5%' }}>
        <ProductItem item={item} variant="grid" />
      </View>
    ),
    []
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color="#FF6B2B" size="small" />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }
    if (!hasMore && total > 0) {
      return (
        <View style={styles.endBox}>
          <Text style={styles.endEmoji}>🎉</Text>
          <Text style={styles.endTitle}>You've seen all products!</Text>
          <Text style={styles.endSub}>Explore more in our categories</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('products' as any, {})}
          >
            <Text style={styles.browseBtnText}>Browse Categories →</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#FF6B2B" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>All Products</Text>
          <Text style={styles.count}>Showing {products.length} of {total}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('products' as any, {})}
        >
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Grid using FlatList with numColumns=2 */}
      <FlatList
        data={products}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        scrollEnabled={false}
        nestedScrollEnabled={true}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#F1F3F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  heading: { fontSize: 18, fontWeight: '800', color: '#111827' },
  count: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  viewAllBtn: {
    backgroundColor: '#FF6B2B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewAllText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  row: { 
    justifyContent: 'space-between', 
    gap: 6, 
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  loadingBox: { padding: 30, alignItems: 'center' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  footerText: { fontSize: 12, color: '#FF6B2B', fontWeight: '600' },
  endBox: {
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#FFF8F4',
    borderRadius: 12,
    margin: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,43,0.1)',
  },
  endEmoji: { fontSize: 28, marginBottom: 6 },
  endTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
  endSub: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  browseBtn: {
    backgroundColor: '#FF6B2B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  browseBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default AllProductsSection;
