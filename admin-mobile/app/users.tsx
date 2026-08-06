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
import { fetchDataFromApi, deleteData, patchData } from '@/utils/api';
import { SearchInput } from '@/components/SearchInput';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingView } from '@/components/LoadingView';
import { EmptyView } from '@/components/EmptyView';

interface User {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  image?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isBanned?: boolean;
  createdAt?: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#6366f1',
  SELLER: '#10b981',
  GROCERY_SELLER: '#10b981',
  RESTAURANT_SELLER: '#f59e0b',
  DELIVERY_RIDER: '#3b82f6',
  USER: '#6b7280',
};

export default function UsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterRole, setFilterRole] = useState('All');

  const ROLES = ['All', 'ADMIN', 'SELLER', 'USER', 'DELIVERY_RIDER'];

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchDataFromApi('/api/user/?page=1&perPage=200'),
  });

  const users: User[] = data?.userList ?? data?.users ?? [];

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.mobile ?? '').includes(search);
    const matchRole = filterRole === 'All' || (u.role ?? '').includes(filterRole.replace(' ', '_'));
    return matchSearch && matchRole;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleBan = (user: User) => {
    const action = user.isBanned ? 'Unban' : 'Ban';
    Alert.alert(`${action} User`, `${action} "${user.name}"?`, [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: action, style: user.isBanned ? 'default' : 'destructive' as const,
        onPress: async () => {
          await patchData(`/api/user/${user._id}`, { isBanned: !user.isBanned });
          queryClient.invalidateQueries({ queryKey: ['users'] });
        },
      },
    ]);
  };

  const handleDelete = (user: User) => {
    Alert.alert('Delete User', `Permanently delete "${user.name}"?`, [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Delete', style: 'destructive' as const,
        onPress: async () => {
          await deleteData(`/api/user/${user._id}`);
          queryClient.invalidateQueries({ queryKey: ['users'] });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: User }) => {
    const roleColor = ROLE_COLORS[item.role ?? 'USER'] ?? '#6b7280';

    return (
      <View style={s.userCard}>
        <View style={[s.avatarWrap, { backgroundColor: roleColor + '20' }]}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={s.avatar} />
          ) : (
            <Text style={[s.avatarInitial, { color: roleColor }]}>
              {(item.name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={s.userInfo}>
          <View style={s.nameRow}>
            <Text style={s.userName} numberOfLines={1}>{item.name ?? 'Unknown'}</Text>
            {item.isVerified && <Feather name="check-circle" size={13} color={colors.success} />}
          </View>
          <Text style={s.userEmail} numberOfLines={1}>{item.email ?? ''}</Text>
          {item.mobile && <Text style={s.userMobile}>{item.mobile}</Text>}
          <View style={s.metaRow}>
            <View style={[s.rolePill, { backgroundColor: roleColor + '18' }]}>
              <Text style={[s.roleText, { color: roleColor }]}>
                {(item.role ?? 'USER').replace(/_/g, ' ')}
              </Text>
            </View>
            {item.isBanned && <StatusBadge status="inactive" small />}
          </View>
        </View>

        <View style={s.actions}>
          <Pressable onPress={() => handleBan(item)} hitSlop={8} style={s.actionBtn}>
            <Feather name={item.isBanned ? 'unlock' : 'lock'} size={15} color={item.isBanned ? colors.success : colors.warning} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={s.actionBtn}>
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading && users.length === 0) return <LoadingView message="Loading users..." />;
  if (isError) return <EmptyView icon="wifi-off" title="Failed to load users" actionLabel="Retry" onAction={refetch} />;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.pageTitle}>Users</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.searchWrap}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search users..." />
      </View>

      <FlatList
        data={ROLES}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFilterRole(item)}
            style={[s.filterChip, filterRole === item && { backgroundColor: colors.primary }]}
          >
            <Text style={[s.filterChipText, { color: filterRole === item ? '#fff' : colors.mutedForeground }]}>
              {item.replace(/_/g, ' ')}
            </Text>
          </Pressable>
        )}
      />

      <Text style={s.countText}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyView
            icon="users"
            title={search ? 'No users found' : 'No users yet'}
            description={search ? `No results for "${search}"` : 'Users will appear here after registration'}
          />
        }
      />
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
    searchWrap: { paddingHorizontal: 16, marginBottom: 4 },
    filterList: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
    filterChip: {
      paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
      backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border,
    },
    filterChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
    countText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, marginBottom: 4 },
    list: { padding: 16, gap: 10, paddingBottom: 32 },
    userCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.border, flexDirection: 'row',
      alignItems: 'center', padding: 12, gap: 12,
    },
    avatarWrap: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatar: { width: 46, height: 46 },
    avatarInitial: { fontSize: 18, fontFamily: 'Inter_700Bold' },
    userInfo: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    userName: { fontSize: 14, fontWeight: '600' as const, color: colors.foreground, fontFamily: 'Inter_600SemiBold', flex: 1 },
    userEmail: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    userMobile: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
    rolePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
    roleText: { fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
    actions: { gap: 8 },
    actionBtn: { padding: 6 },
  });
