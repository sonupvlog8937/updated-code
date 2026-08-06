import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, Platform, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { fetchDataFromApi, deleteData, patchData } from '@/utils/api';
import { SearchInput } from '@/components/SearchInput';
import { LoadingView } from '@/components/LoadingView';
import { EmptyView } from '@/components/EmptyView';

interface Product {
  _id: string;
  name?: string;
  price?: number;
  oldPrice?: number;
  category?: string;
  catName?: string;
  images?: string[];
  countInStock?: number;
  rating?: number;
  numReviews?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { userData } = useAuth();

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : 0;
  const isAdmin = userData?.role === 'ADMIN';

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['products', page],
    queryFn: () => fetchDataFromApi(`/api/products?page=${page}&perPage=30`),
  });

  const products: Product[] = data?.products ?? data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  const filtered = products.filter((p) =>
    !search ||
    (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.catName ?? p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const togglePublish = async (product: Product) => {
    const newVal = !product.isPublished;
    await patchData(`/api/products/${product._id}`, { isPublished: newVal });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleDelete = (product: Product) => {
    Alert.alert('Delete Product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Delete', style: 'destructive' as const,
        onPress: async () => {
          await deleteData(`/api/products/${product._id}`);
          queryClient.invalidateQueries({ queryKey: ['products'] });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Product }) => {
    const img = item.images?.[0];
    const stock = item.countInStock ?? 0;
    const inStock = stock > 0;

    return (
      <View style={s.productCard}>
        {/* Image */}
        <View style={s.imageWrap}>
          {img ? (
            <Image source={{ uri: img }} style={s.image} resizeMode="cover" />
          ) : (
            <View style={[s.image, s.imagePlaceholder]}>
              <Feather name="image" size={22} color={colors.mutedForeground} />
            </View>
          )}
          {!inStock && (
            <View style={s.outOfStockBadge}>
              <Text style={s.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.productName} numberOfLines={2}>{item.name ?? 'Unnamed Product'}</Text>
          <Text style={s.category} numberOfLines={1}>{item.catName ?? item.category ?? ''}</Text>

          <View style={s.priceRow}>
            <Text style={s.price}>₹{(item.price ?? 0).toLocaleString()}</Text>
            {item.oldPrice && item.oldPrice > (item.price ?? 0) && (
              <Text style={s.oldPrice}>₹{item.oldPrice.toLocaleString()}</Text>
            )}
          </View>

          <View style={s.metaRow}>
            <View style={[s.stockPill, { backgroundColor: inStock ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[s.stockText, { color: inStock ? '#166534' : '#991b1b' }]}>
                {inStock ? `${stock} in stock` : 'Out of stock'}
              </Text>
            </View>
            {item.rating != null && (
              <View style={s.ratingRow}>
                <Feather name="star" size={11} color="#f59e0b" />
                <Text style={s.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {isAdmin && (
          <View style={s.actions}>
            <Pressable onPress={() => togglePublish(item)} hitSlop={8} style={s.iconBtn}>
              <Feather
                name={item.isPublished ? 'eye' : 'eye-off'}
                size={16}
                color={item.isPublished ? colors.success : colors.mutedForeground}
              />
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={s.iconBtn}>
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (isLoading && products.length === 0) return <LoadingView message="Loading products..." />;
  if (isError) return <EmptyView icon="wifi-off" title="Failed to load products" actionLabel="Retry" onAction={refetch} />;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.topBar}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search products..." />
      </View>

      <Text style={s.countText}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyView
            icon="box"
            title={search ? 'No products found' : 'No products yet'}
            description={search ? `No results for "${search}"` : 'Add your first product to get started'}
          />
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={s.pagination}>
              <Pressable
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={[s.pageBtn, page === 1 && s.pageBtnDisabled]}
              >
                <Feather name="chevron-left" size={16} color={page === 1 ? colors.mutedForeground : colors.foreground} />
              </Pressable>
              <Text style={s.pageText}>{page} / {totalPages}</Text>
              <Pressable
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={[s.pageBtn, page === totalPages && s.pageBtnDisabled]}
              >
                <Feather name="chevron-right" size={16} color={page === totalPages ? colors.mutedForeground : colors.foreground} />
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    countText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, marginBottom: 4 },
    list: { padding: 16, gap: 10, paddingBottom: 120 },
    productCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.border, flexDirection: 'row',
      overflow: 'hidden',
    },
    imageWrap: { position: 'relative' },
    image: { width: 90, height: 90 },
    imagePlaceholder: { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    outOfStockBadge: {
      position: 'absolute', bottom: 4, left: 4,
      backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
    },
    outOfStockText: { fontSize: 9, color: '#fff', fontFamily: 'Inter_700Bold' },
    info: { flex: 1, padding: 10, gap: 3 },
    productName: { fontSize: 13, fontWeight: '600' as const, color: colors.foreground, fontFamily: 'Inter_600SemiBold', lineHeight: 18 },
    category: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    price: { fontSize: 15, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    oldPrice: { fontSize: 12, color: colors.mutedForeground, textDecorationLine: 'line-through' as const, fontFamily: 'Inter_400Regular' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    stockPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
    stockText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingText: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
    actions: { justifyContent: 'center', paddingRight: 10, gap: 12 },
    iconBtn: { padding: 6 },
    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 },
    pageBtn: { padding: 8, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    pageBtnDisabled: { opacity: 0.4 },
    pageText: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_500Medium' },
  });
