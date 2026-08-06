import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { fetchDataFromApi } from '@/utils/api';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingView } from '@/components/LoadingView';

const SELLER_ROLES = ['SELLER', 'GROCERY_SELLER', 'RESTAURANT_SELLER', 'FASHION_SELLER',
  'ELECTRONICS_SELLER', 'MEDICAL_SELLER', 'BEAUTY_SELLER', 'HOME_KITCHEN_SELLER',
  'GIFTS_TOYS_SELLER', 'BOOKS_STATIONERY_SELLER', 'JEWELLERY_SELLER', 'HARDWARE_SELLER', 'AUTOMOBILE_SELLER'];

const isSellerRole = (role: string) => SELLER_ROLES.includes(role);

interface Order {
  _id: string;
  name?: string;
  userId?: { name?: string; email?: string };
  amount?: number;
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  products?: unknown[];
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : 0;

  const userRole = userData?.role ?? '';
  const isAdmin = userRole === 'ADMIN';
  const isSeller = isSellerRole(userRole);
  const isRider = userRole === 'DELIVERY_RIDER';

  const { data: ordersData, refetch: refetchOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: () => fetchDataFromApi('/api/orders?page=1&perPage=100'),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: () => fetchDataFromApi('/api/products?page=1&perPage=1'),
    enabled: isAdmin || isSeller,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => fetchDataFromApi('/api/user/?page=1&perPage=1'),
    enabled: isAdmin,
  });

  const orders: Order[] = ordersData?.orders ?? ordersData?.data ?? [];
  const pendingOrders = orders.filter((o) => o.status?.toLowerCase() === 'pending');
  const deliveredOrders = orders.filter((o) => o.status?.toLowerCase() === 'delivered');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount ?? o.totalAmount ?? 0), 0);
  const recentOrders = orders.slice(0, 8);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchOrders();
    setRefreshing(false);
  }, [refetchOrders]);

  const isLoading = ordersLoading || (isAdmin && usersLoading) || ((isAdmin || isSeller) && productsLoading);

  if (isLoading && orders.length === 0) {
    return <LoadingView message="Loading dashboard..." />;
  }

  const firstName = userData?.name?.split(' ')[0] ?? 'User';

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Pressable
      style={s.orderRow}
      onPress={() => router.push(`/orders/${item._id}` as never)}
    >
      <View style={s.orderLeft}>
        <Text style={s.orderId}>#{(item._id ?? '').slice(-6).toUpperCase()}</Text>
        <Text style={s.orderCustomer} numberOfLines={1}>
          {item.userId?.name ?? item.name ?? 'Customer'}
        </Text>
      </View>
      <View style={s.orderRight}>
        <Text style={s.orderAmount}>
          {typeof (item.amount ?? item.totalAmount) === 'number'
            ? `₹${(item.amount ?? item.totalAmount ?? 0).toLocaleString()}`
            : '—'}
        </Text>
        <StatusBadge status={item.status ?? 'pending'} small />
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: topPad }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {getTimeOfDay()},</Text>
          <Text style={s.name}>{firstName}</Text>
        </View>
        <View style={[s.rolePill, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[s.roleText, { color: colors.primary }]}>
            {formatRole(userRole)}
          </Text>
        </View>
      </View>

      {/* Stats */}
      {!isRider && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Overview</Text>
          <View style={s.statsGrid}>
            <StatCard
              label="Total Orders"
              value={orders.length}
              icon={<Feather name="shopping-bag" size={18} color="#6366f1" />}
              color="#6366f1"
              bgColor="#eef2ff"
            />
            <StatCard
              label="Pending"
              value={pendingOrders.length}
              icon={<Feather name="clock" size={18} color="#f59e0b" />}
              color="#f59e0b"
              bgColor="#fffbeb"
            />
          </View>
          <View style={s.statsGrid}>
            <StatCard
              label="Delivered"
              value={deliveredOrders.length}
              icon={<Feather name="check-circle" size={18} color="#10b981" />}
              color="#10b981"
              bgColor="#ecfdf5"
            />
            <StatCard
              label="Revenue"
              value={`₹${(totalRevenue / 1000).toFixed(0)}K`}
              icon={<Feather name="trending-up" size={18} color="#3b82f6" />}
              color="#3b82f6"
              bgColor="#eff6ff"
            />
          </View>
          {isAdmin && (
            <View style={s.statsGrid}>
              <StatCard
                label="Products"
                value={productsData?.totalCount ?? productsData?.total ?? '—'}
                icon={<Feather name="box" size={18} color="#8b5cf6" />}
                color="#8b5cf6"
                bgColor="#f5f3ff"
              />
              <StatCard
                label="Users"
                value={usersData?.totalCount ?? usersData?.count ?? '—'}
                icon={<Feather name="users" size={18} color="#ec4899" />}
                color="#ec4899"
                bgColor="#fdf2f8"
              />
            </View>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsRow}>
          <QuickAction icon="shopping-bag" label="Orders" color="#6366f1" onPress={() => router.push('/(tabs)/orders' as never)} />
          {!isRider && <QuickAction icon="box" label="Products" color="#10b981" onPress={() => router.push('/(tabs)/products' as never)} />}
          {isAdmin && <QuickAction icon="users" label="Users" color="#3b82f6" onPress={() => router.push('/users' as never)} />}
          {isAdmin && <QuickAction icon="tag" label="Categories" color="#f59e0b" onPress={() => router.push('/categories' as never)} />}
          <QuickAction icon="dollar-sign" label="Wallet" color="#ec4899" onPress={() => router.push('/wallet' as never)} />
          <QuickAction icon="user" label="Profile" color="#8b5cf6" onPress={() => router.push('/profile' as never)} />
        </View>
      </View>

      {/* Recent Orders */}
      <View style={s.section}>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Recent Orders</Text>
          <Pressable onPress={() => router.push('/(tabs)/orders' as never)}>
            <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
          </Pressable>
        </View>
        <View style={s.card}>
          {recentOrders.length === 0 ? (
            <Text style={s.emptyText}>No orders yet</Text>
          ) : (
            <FlatList
              data={recentOrders}
              keyExtractor={(item) => item._id}
              renderItem={renderOrderItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={s.divider} />}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; color: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[qaStyles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[qaStyles.iconWrap, { backgroundColor: color + '18' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[qaStyles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
    </Pressable>
  );
}

const qaStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 72,
    maxWidth: 88,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatRole(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 120 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 20,
      paddingBottom: 4,
    },
    greeting: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    name: { fontSize: 22, fontWeight: '800' as const, color: colors.foreground, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
    rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    section: { marginTop: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold', marginBottom: 10 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    orderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
    },
    orderLeft: { flex: 1 },
    orderId: { fontSize: 12, fontWeight: '700' as const, color: colors.primary, fontFamily: 'Inter_700Bold' },
    orderCustomer: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_400Regular', marginTop: 1 },
    orderRight: { alignItems: 'flex-end', gap: 4 },
    orderAmount: { fontSize: 13, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    divider: { height: 1, backgroundColor: colors.border },
    emptyText: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', padding: 20, textAlign: 'center' },
  });
