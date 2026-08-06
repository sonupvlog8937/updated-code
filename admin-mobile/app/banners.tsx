import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, Platform, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { fetchDataFromApi, deleteData } from '@/utils/api';
import { LoadingView } from '@/components/LoadingView';
import { EmptyView } from '@/components/EmptyView';

interface Banner {
  _id: string;
  images?: string[];
  catName?: string;
  catId?: string;
  subCatName?: string;
}

export default function BannersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => fetchDataFromApi('/api/banners'),
  });

  const banners: Banner[] = data?.bannerList ?? data?.banners ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDelete = (banner: Banner) => {
    Alert.alert('Delete Banner', 'Delete this banner?', [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Delete', style: 'destructive' as const,
        onPress: async () => {
          await deleteData(`/api/banners/${banner._id}`);
          queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Banner }) => {
    const img = item.images?.[0];
    return (
      <View style={s.bannerCard}>
        {img ? (
          <Image source={{ uri: img }} style={s.bannerImage} resizeMode="cover" />
        ) : (
          <View style={[s.bannerImage, s.bannerPlaceholder]}>
            <Feather name="image" size={28} color={colors.mutedForeground} />
          </View>
        )}
        <View style={s.bannerInfo}>
          <Text style={s.bannerCat} numberOfLines={1}>{item.catName ?? 'Uncategorized'}</Text>
          {item.subCatName && <Text style={s.bannerSubCat} numberOfLines={1}>{item.subCatName}</Text>}
        </View>
        <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={s.delBtn}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </Pressable>
      </View>
    );
  };

  if (isLoading && banners.length === 0) return <LoadingView message="Loading banners..." />;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.pageTitle}>Banners</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={banners}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyView icon="image" title="No banners yet" description="Upload banners from the web panel" />
        }
      />
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
    backBtn: { padding: 4 },
    pageTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    list: { padding: 16, gap: 12, paddingBottom: 32 },
    bannerCard: {
      backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden',
    },
    bannerImage: { width: '100%', height: 160 },
    bannerPlaceholder: { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    bannerInfo: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    bannerCat: { fontSize: 13, fontWeight: '600' as const, color: colors.foreground, fontFamily: 'Inter_600SemiBold', flex: 1 },
    bannerSubCat: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    delBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 8 },
  });
