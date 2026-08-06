import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, Platform, Alert, TextInput, Modal, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { fetchDataFromApi, postData, deleteData } from '@/utils/api';
import { SearchInput } from '@/components/SearchInput';
import { LoadingView } from '@/components/LoadingView';
import { EmptyView } from '@/components/EmptyView';

interface Category {
  _id: string;
  name?: string;
  image?: string;
  color?: string;
  slug?: string;
  parentId?: string | null;
}

export default function CategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userData } = useAuth();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const isAdmin = userData?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [isSaving, setIsSaving] = useState(false);

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchDataFromApi('/api/category'),
  });

  const categories: Category[] = data?.categoryList ?? data?.categories ?? data ?? [];

  const filtered = categories.filter(
    (c) => !search || (c.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAdd = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Validation', 'Category name is required');
      return;
    }
    setIsSaving(true);
    const res = await postData('/api/category/create', { name: newCatName.trim(), color: newCatColor });
    setIsSaving(false);
    if (res?.error === false || res?._id) {
      setNewCatName('');
      setAddModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      Alert.alert('Success', 'Category created');
    } else {
      Alert.alert('Error', res?.message ?? 'Failed to create category');
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Delete', style: 'destructive' as const,
        onPress: async () => {
          await deleteData(`/api/category/${cat._id}`);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
      },
    ]);
  };

  const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  const renderItem = ({ item }: { item: Category }) => (
    <View style={s.catCard}>
      <View style={[s.catColor, { backgroundColor: item.color ?? colors.primary }]} />
      {item.image ? (
        <Image source={{ uri: item.image }} style={s.catImage} resizeMode="cover" />
      ) : (
        <View style={[s.catImagePlaceholder, { backgroundColor: (item.color ?? colors.primary) + '20' }]}>
          <Feather name="tag" size={18} color={item.color ?? colors.primary} />
        </View>
      )}
      <View style={s.catInfo}>
        <Text style={s.catName} numberOfLines={1}>{item.name ?? 'Unnamed'}</Text>
        {item.slug && <Text style={s.catSlug} numberOfLines={1}>{item.slug}</Text>}
      </View>
      {isAdmin && (
        <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={s.deleteBtn}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </Pressable>
      )}
    </View>
  );

  if (isLoading && categories.length === 0) return <LoadingView message="Loading categories..." />;
  if (isError) return <EmptyView icon="wifi-off" title="Failed to load categories" actionLabel="Retry" onAction={refetch} />;

  return (
    <View style={[s.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      {/* Header */}
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.pageTitle}>Categories</Text>
        {isAdmin ? (
          <Pressable onPress={() => setAddModalVisible(true)} style={[s.addBtn, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        ) : <View style={{ width: 36 }} />}
      </View>

      <View style={s.searchWrap}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search categories..." />
      </View>

      <Text style={s.countText}>{filtered.length} categor{filtered.length !== 1 ? 'ies' : 'y'}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyView
            icon="tag"
            title="No categories found"
            description={search ? `No results for "${search}"` : 'No categories available'}
          />
        }
      />

      {/* Add Category Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setAddModalVisible(false)}>
          <Pressable style={[s.modalSheet, { backgroundColor: colors.card }]}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>New Category</Text>

            <Text style={s.fieldLabel}>Category Name</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="e.g. Electronics"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />
            </View>

            <Text style={s.fieldLabel}>Color</Text>
            <View style={s.colorRow}>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewCatColor(c)}
                  style={[s.colorDot, { backgroundColor: c }, newCatColor === c && s.colorDotSelected]}
                />
              ))}
            </View>

            <Pressable onPress={handleAdd} disabled={isSaving || !newCatName.trim()} style={[s.modalBtn, { backgroundColor: colors.primary, opacity: (isSaving || !newCatName.trim()) ? 0.5 : 1 }]}>
              {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalBtnText}>Create Category</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },
    backBtn: { padding: 4 },
    pageTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    searchWrap: { paddingHorizontal: 16, marginBottom: 4 },
    countText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, marginBottom: 4 },
    list: { padding: 16, gap: 8, paddingBottom: 32 },
    catCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.border, flexDirection: 'row',
      alignItems: 'center', overflow: 'hidden',
    },
    catColor: { width: 4, alignSelf: 'stretch' },
    catImage: { width: 52, height: 52 },
    catImagePlaceholder: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    catInfo: { flex: 1, padding: 12, gap: 2 },
    catName: { fontSize: 14, fontWeight: '600' as const, color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
    catSlug: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    deleteBtn: { padding: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
    modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 18, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    fieldLabel: { fontSize: 12, fontWeight: '600' as const, color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' },
    inputWrap: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
    input: { fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0, margin: 0 },
    colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    colorDot: { width: 30, height: 30, borderRadius: 15 },
    colorDotSelected: { borderWidth: 3, borderColor: colors.foreground },
    modalBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    modalBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#fff', fontFamily: 'Inter_700Bold' },
  });
