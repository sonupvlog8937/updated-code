import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, Platform, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { fetchDataFromApi, postData, deleteData } from '@/utils/api';
import { LoadingView } from '@/components/LoadingView';
import { EmptyView } from '@/components/EmptyView';

interface Coupon {
  _id: string;
  code?: string;
  discount?: number;
  discountType?: string;
  minOrderAmount?: number;
  maxUsage?: number;
  usageCount?: number;
  isActive?: boolean;
  expiresAt?: string;
  description?: string;
}

export default function CouponsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [minOrder, setMinOrder] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => fetchDataFromApi('/api/coupon'),
  });

  const coupons: Coupon[] = data?.coupons ?? data?.couponList ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreate = async () => {
    if (!code.trim() || !discount) return;
    setIsSaving(true);
    const res = await postData('/api/coupon/create', {
      code: code.trim().toUpperCase(),
      discount: Number(discount),
      discountType,
      minOrderAmount: Number(minOrder) || 0,
    });
    setIsSaving(false);
    if (res?.error === false || res?._id) {
      setCode('');
      setDiscount('');
      setMinOrder('');
      setModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      Alert.alert('Success', 'Coupon created');
    } else {
      Alert.alert('Error', res?.message ?? 'Failed to create coupon');
    }
  };

  const handleDelete = (coupon: Coupon) => {
    Alert.alert('Delete Coupon', `Delete coupon "${coupon.code}"?`, [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Delete', style: 'destructive' as const,
        onPress: async () => {
          await deleteData(`/api/coupon/${coupon._id}`);
          queryClient.invalidateQueries({ queryKey: ['coupons'] });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Coupon }) => {
    const usageRatio = item.maxUsage ? (item.usageCount ?? 0) / item.maxUsage : 0;
    const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;

    return (
      <View style={[s.couponCard, !item.isActive && { opacity: 0.6 }]}>
        <View style={s.couponLeft}>
          <View style={[s.codeWrap, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[s.code, { color: colors.primary }]}>{item.code ?? '—'}</Text>
          </View>
          <Text style={s.discount}>
            {item.discountType === 'percent' ? `${item.discount}% off` : `₹${item.discount} off`}
          </Text>
          {item.minOrderAmount ? (
            <Text style={s.minOrder}>Min order: ₹{item.minOrderAmount.toLocaleString()}</Text>
          ) : null}
          {item.expiresAt && (
            <Text style={[s.expiry, { color: isExpired ? colors.destructive : colors.mutedForeground }]}>
              {isExpired ? 'Expired' : `Expires: ${new Date(item.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </Text>
          )}
          {item.maxUsage && (
            <Text style={s.usage}>{item.usageCount ?? 0}/{item.maxUsage} used</Text>
          )}
        </View>

        <View style={s.couponRight}>
          <View style={[s.activePill, { backgroundColor: item.isActive ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[s.activeText, { color: item.isActive ? '#166534' : '#991b1b' }]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading && coupons.length === 0) return <LoadingView message="Loading coupons..." />;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.pageTitle}>Coupons</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[s.addBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={coupons}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyView
            icon="percent"
            title="No coupons yet"
            description="Create your first coupon to offer discounts to customers"
            actionLabel="Create Coupon"
            onAction={() => setModalVisible(true)}
          />
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={s.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[s.sheet, { backgroundColor: colors.card }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>New Coupon</Text>

            <Text style={s.fieldLabel}>Coupon Code</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={code}
                onChangeText={setCode}
                placeholder="SAVE20"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                autoFocus
              />
            </View>

            <Text style={s.fieldLabel}>Discount Value</Text>
            <View style={s.typeRow}>
              {(['percent', 'flat'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setDiscountType(t)}
                  style={[s.typeBtn, discountType === t && { backgroundColor: colors.primary }]}
                >
                  <Text style={[s.typeBtnText, { color: discountType === t ? '#fff' : colors.mutedForeground }]}>
                    {t === 'percent' ? '% Percent' : '₹ Flat'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[s.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={discount}
                onChangeText={setDiscount}
                placeholder={discountType === 'percent' ? 'e.g. 20' : 'e.g. 100'}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
              />
            </View>

            <Text style={s.fieldLabel}>Min Order Amount (optional)</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={minOrder}
                onChangeText={setMinOrder}
                placeholder="e.g. 500"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
              />
            </View>

            <Pressable
              onPress={handleCreate}
              disabled={isSaving || !code.trim() || !discount}
              style={[s.createBtn, { backgroundColor: colors.primary }, (isSaving || !code.trim() || !discount) && { opacity: 0.5 }]}
            >
              {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.createBtnText}>Create Coupon</Text>}
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
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
    backBtn: { padding: 4 },
    pageTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, gap: 10, paddingBottom: 32 },
    couponCard: {
      backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border,
      flexDirection: 'row', padding: 14, alignItems: 'center',
    },
    couponLeft: { flex: 1, gap: 4 },
    codeWrap: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    code: { fontSize: 15, fontWeight: '800' as const, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
    discount: { fontSize: 13, fontWeight: '600' as const, color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
    minOrder: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    expiry: { fontSize: 11, fontFamily: 'Inter_400Regular' },
    usage: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    couponRight: { alignItems: 'center', gap: 10 },
    activePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    activeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
    sheetTitle: { fontSize: 18, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    fieldLabel: { fontSize: 12, fontWeight: '600' as const, color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
    inputWrap: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
    input: { fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0, margin: 0 },
    typeRow: { flexDirection: 'row', gap: 8 },
    typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: colors.muted },
    typeBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    createBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    createBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#fff', fontFamily: 'Inter_700Bold' },
  });
