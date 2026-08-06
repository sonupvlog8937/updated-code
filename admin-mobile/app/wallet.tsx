import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { fetchDataFromApi } from '@/utils/api';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingView } from '@/components/LoadingView';
import { EmptyView } from '@/components/EmptyView';

interface Transaction {
  _id: string;
  type?: string;
  amount?: number;
  status?: string;
  description?: string;
  createdAt?: string;
  paymentMethod?: string;
  referenceId?: string;
}

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const { data: txData, refetch: refetchTx, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => fetchDataFromApi('/api/transactions?page=1&perPage=100'),
  });

  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => fetchDataFromApi('/api/wallet'),
  });

  const transactions: Transaction[] = txData?.transactions ?? txData?.data ?? txData ?? [];
  const balance: number = walletData?.balance ?? walletData?.wallet?.balance ?? 0;
  const pendingAmount: number = walletData?.pendingAmount ?? 0;

  const FILTERS = ['All', 'Credit', 'Debit', 'Pending'];
  const filtered = transactions.filter((t) => {
    if (filter === 'All') return true;
    return (t.type ?? t.status ?? '').toLowerCase().includes(filter.toLowerCase());
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTx(), refetchWallet()]);
    setRefreshing(false);
  }, [refetchTx, refetchWallet]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatAmount = (amount?: number, type?: string) => {
    const isCredit = (type ?? '').toLowerCase() === 'credit';
    const prefix = isCredit ? '+' : '-';
    return `${prefix}₹${(amount ?? 0).toLocaleString()}`;
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isCredit = (item.type ?? '').toLowerCase() === 'credit';
    const amountColor = isCredit ? colors.success : colors.destructive;

    return (
      <View style={s.txRow}>
        <View style={[s.txIcon, { backgroundColor: isCredit ? '#dcfce7' : '#fee2e2' }]}>
          <Feather
            name={isCredit ? 'arrow-down-left' : 'arrow-up-right'}
            size={16}
            color={amountColor}
          />
        </View>
        <View style={s.txInfo}>
          <Text style={s.txDesc} numberOfLines={1}>{item.description ?? (isCredit ? 'Payment Received' : 'Payment Sent')}</Text>
          <Text style={s.txDate}>{formatDate(item.createdAt)}</Text>
          {item.referenceId && <Text style={s.txRef}>Ref: {item.referenceId}</Text>}
        </View>
        <View style={s.txRight}>
          <Text style={[s.txAmount, { color: amountColor }]}>
            {formatAmount(item.amount, item.type)}
          </Text>
          {item.status && <StatusBadge status={item.status} small />}
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.pageTitle}>Wallet</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Balance Card */}
      <LinearGradient
        colors={['#4f46e5', '#6366f1', '#818cf8']}
        style={s.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={s.balanceTop}>
          <Feather name="credit-card" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={s.balanceLabel}>Available Balance</Text>
        </View>
        <Text style={s.balanceAmount}>₹{balance.toLocaleString()}</Text>
        {pendingAmount > 0 && (
          <View style={s.pendingRow}>
            <Feather name="clock" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={s.pendingText}>₹{pendingAmount.toLocaleString()} pending</Text>
          </View>
        )}
        <View style={s.balanceFooter}>
          <View style={s.balanceStat}>
            <Text style={s.balanceStatLabel}>Total Transactions</Text>
            <Text style={s.balanceStatValue}>{transactions.length}</Text>
          </View>
          <View style={s.balanceDivider} />
          <View style={s.balanceStat}>
            <Text style={s.balanceStatLabel}>Credits</Text>
            <Text style={s.balanceStatValue}>
              {transactions.filter((t) => (t.type ?? '').toLowerCase() === 'credit').length}
            </Text>
          </View>
          <View style={s.balanceDivider} />
          <View style={s.balanceStat}>
            <Text style={s.balanceStatLabel}>Debits</Text>
            <Text style={s.balanceStatValue}>
              {transactions.filter((t) => (t.type ?? '').toLowerCase() === 'debit').length}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter */}
      <FlatList
        data={FILTERS}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFilter(item)}
            style={[s.filterChip, filter === item && { backgroundColor: colors.primary }]}
          >
            <Text style={[s.filterChipText, { color: filter === item ? '#fff' : colors.mutedForeground }]}>{item}</Text>
          </Pressable>
        )}
      />

      {/* Transactions */}
      {txLoading && transactions.length === 0 ? (
        <LoadingView message="Loading transactions..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={s.txList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={<Text style={s.txSectionTitle}>Transaction History</Text>}
          ListEmptyComponent={
            <EmptyView
              icon="dollar-sign"
              title="No transactions"
              description="Your transactions will appear here"
            />
          }
        />
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    },
    backBtn: { padding: 4 },
    pageTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    balanceCard: {
      marginHorizontal: 16, borderRadius: 20, padding: 22, gap: 4,
      shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    },
    balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular' },
    balanceAmount: { fontSize: 36, fontWeight: '800' as const, color: '#fff', fontFamily: 'Inter_700Bold', letterSpacing: -1, marginTop: 4 },
    pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    pendingText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular' },
    balanceFooter: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: 12 },
    balanceStat: { flex: 1, alignItems: 'center' },
    balanceStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.5 },
    balanceStatValue: { fontSize: 18, fontWeight: '700' as const, color: '#fff', fontFamily: 'Inter_700Bold' },
    balanceDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    filterList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
      backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border,
    },
    filterChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    txList: { paddingHorizontal: 16, paddingBottom: 32, gap: 1 },
    txSectionTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold', marginBottom: 10 },
    txRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, padding: 14, borderRadius: 0,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    txIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    txInfo: { flex: 1 },
    txDesc: { fontSize: 13, fontWeight: '500' as const, color: colors.foreground, fontFamily: 'Inter_500Medium' },
    txDate: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    txRef: { fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 1 },
    txRight: { alignItems: 'flex-end', gap: 4 },
    txAmount: { fontSize: 14, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  });
