import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { fetchDataFromApi, patchData, deleteData } from '@/utils/api';
import { SearchInput } from '@/components/SearchInput';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingView } from '@/components/LoadingView';
import { EmptyView } from '@/components/EmptyView';

const STATUSES = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

interface Order {
  _id: string;
  name?: string;
  userId?: { name?: string; email?: string; mobile?: string };
  amount?: number;
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
  products?: Array<{ _id?: string; productTitle?: string; quantity?: number; price?: number; subTotal?: number }>;
  address?: { addressLine1?: string; city?: string; state?: string; pinCode?: string };
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : 0;

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchDataFromApi('/api/orders?page=1&perPage=200'),
  });

  const allOrders: Order[] = data?.orders ?? data?.data ?? [];

  const filtered = allOrders.filter((o) => {
    const matchesSearch =
      !search ||
      (o._id ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (o.userId?.name ?? o.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (o.userId?.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = activeStatus === 'All' || (o.status ?? '').toLowerCase() === activeStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const res = await patchData(`/api/orders/${orderId}`, { status: newStatus });
    setUpdatingId(null);
    if (res?.error === false || res?.success) {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] });
    } else {
      Alert.alert('Error', res?.message ?? 'Failed to update order status');
    }
  };

  const promptStatusChange = (order: Order) => {
    const options = STATUSES.filter((s) => s !== 'All' && s.toLowerCase() !== (order.status ?? '').toLowerCase());
    Alert.alert('Update Status', `Change status for order #${(order._id ?? '').slice(-6).toUpperCase()}`, [
      ...options.map((s) => ({ text: s, onPress: () => updateStatus(order._id, s.toLowerCase()) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleDelete = (orderId: string) => {
    Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Delete', style: 'destructive' as const,
        onPress: async () => {
          await deleteData(`/api/orders/${orderId}`);
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Order }) => {
    const isExpanded = expandedId === item._id;
    const isUpdating = updatingId === item._id;

    return (
      <View style={s.orderCard}>
        <Pressable style={s.orderHeader} onPress={() => setExpandedId(isExpanded ? null : item._id)}>
          {/* Left */}
          <View style={s.orderLeft}>
            <Text style={s.orderId}>#{(item._id ?? '').slice(-6).toUpperCase()}</Text>
            <Text style={s.customerName} numberOfLines={1}>
              {item.userId?.name ?? item.name ?? 'Customer'}
            </Text>
            <Text style={s.customerEmail} numberOfLines={1}>
              {item.userId?.email ?? ''}
            </Text>
          </View>
          {/* Right */}
          <View style={s.orderRight}>
            <Text style={s.amount}>
              {typeof (item.amount ?? item.totalAmount) === 'number'
                ? `₹${(item.amount ?? item.totalAmount ?? 0).toLocaleString()}`
                : '—'}
            </Text>
            <StatusBadge status={item.status ?? 'pending'} small />
            <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} />
          </View>
        </Pressable>

        {isExpanded && (
          <View style={s.expandedPanel}>
            {/* Products */}
            {(item.products ?? []).length > 0 && (
              <View style={s.productsSection}>
                <Text style={s.panelLabel}>Items</Text>
                {(item.products ?? []).map((p, idx) => (
                  <View key={idx} style={s.productRow}>
                    <Text style={s.productName} numberOfLines={1}>{p.productTitle ?? 'Product'}</Text>
                    <Text style={s.productMeta}>×{p.quantity ?? 1} · ₹{(p.subTotal ?? p.price ?? 0).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Address */}
            {item.address && (
              <View style={s.addressSection}>
                <Text style={s.panelLabel}>Delivery Address</Text>
                <Text style={s.addressText}>
                  {[item.address.addressLine1, item.address.city, item.address.state, item.address.pinCode].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}

            {/* Payment */}
            <View style={s.payRow}>
              <Text style={s.payLabel}>Payment</Text>
              <View style={s.payPill}>
                <Text style={s.payText}>{(item.paymentMethod ?? 'COD').toUpperCase()}</Text>
              </View>
              {item.paymentStatus && <StatusBadge status={item.paymentStatus} small />}
            </View>

            {/* Actions */}
            <View style={s.actionRow}>
              <Pressable
                style={[s.actionBtn, s.statusBtn]}
                onPress={() => promptStatusChange(item)}
                disabled={isUpdating}
              >
                <Feather name={isUpdating ? 'loader' : 'refresh-cw'} size={14} color={colors.primary} />
                <Text style={[s.actionBtnText, { color: colors.primary }]}>
                  {isUpdating ? 'Updating...' : 'Change Status'}
                </Text>
              </Pressable>
              <Pressable style={[s.actionBtn, s.deleteBtn]} onPress={() => handleDelete(item._id)}>
                <Feather name="trash-2" size={14} color={colors.destructive} />
                <Text style={[s.actionBtnText, { color: colors.destructive }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading && allOrders.length === 0) return <LoadingView message="Loading orders..." />;
  if (isError) return <EmptyView icon="wifi-off" title="Failed to load orders" description="Check your connection and API URL" actionLabel="Retry" onAction={refetch} />;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {/* Search */}
      <View style={s.topBar}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search orders..." />
      </View>

      {/* Status filter */}
      <FlatList
        data={STATUSES}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setActiveStatus(item)}
            style={[s.filterChip, activeStatus === item && { backgroundColor: colors.primary }]}
          >
            <Text style={[s.filterChipText, { color: activeStatus === item ? '#fff' : colors.mutedForeground }]}>
              {item}
            </Text>
          </Pressable>
        )}
      />

      {/* Count */}
      <Text style={s.countText}>{filtered.length} order{filtered.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyView
            icon="shopping-bag"
            title={search ? 'No orders found' : 'No orders yet'}
            description={search ? `No results for "${search}"` : 'New orders will appear here'}
          />
        }
      />
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    filterList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
      backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border,
    },
    filterChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    countText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, marginBottom: 4 },
    list: { padding: 16, gap: 10, paddingBottom: 120 },
    orderCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    orderHeader: { flexDirection: 'row', padding: 14, gap: 12 },
    orderLeft: { flex: 1 },
    orderId: { fontSize: 12, fontWeight: '700' as const, color: colors.primary, fontFamily: 'Inter_700Bold' },
    customerName: { fontSize: 14, fontWeight: '600' as const, color: colors.foreground, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
    customerEmail: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 1 },
    orderRight: { alignItems: 'flex-end', gap: 4 },
    amount: { fontSize: 15, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    expandedPanel: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, gap: 12 },
    panelLabel: { fontSize: 11, fontWeight: '700' as const, color: colors.mutedForeground, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    productsSection: { gap: 2 },
    productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    productName: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    productMeta: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
    addressSection: {},
    addressText: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_400Regular', lineHeight: 18 },
    payRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    payLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', flex: 1 },
    payPill: { backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    payText: { fontSize: 11, fontWeight: '700' as const, color: colors.mutedForeground, fontFamily: 'Inter_700Bold' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
    },
    statusBtn: { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' },
    deleteBtn: { backgroundColor: colors.destructive + '10', borderColor: colors.destructive + '30' },
    actionBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  });
