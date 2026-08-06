import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

const SELLER_ROLES = ['SELLER', 'GROCERY_SELLER', 'RESTAURANT_SELLER', 'FASHION_SELLER',
  'ELECTRONICS_SELLER', 'MEDICAL_SELLER', 'BEAUTY_SELLER', 'HOME_KITCHEN_SELLER',
  'GIFTS_TOYS_SELLER', 'BOOKS_STATIONERY_SELLER', 'JEWELLERY_SELLER',
  'HARDWARE_SELLER', 'AUTOMOBILE_SELLER'];

const isSellerRole = (role: string) => SELLER_ROLES.includes(role);

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle?: string;
  color?: string;
  onPress: () => void;
  showArrow?: boolean;
}

function MenuItem({ icon, label, subtitle, color, onPress, showArrow = true }: MenuItemProps) {
  const colors = useColors();
  const iconColor = color ?? colors.primary;

  return (
    <Pressable
      style={({ pressed }) => [mStyles.item, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <View style={[mStyles.itemIcon, { backgroundColor: iconColor + '18' }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <View style={mStyles.itemContent}>
        <Text style={[mStyles.itemLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
        {subtitle && <Text style={[mStyles.itemSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{subtitle}</Text>}
      </View>
      {showArrow && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[mStyles.sectionHeader, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>{title}</Text>;
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userData, logout } = useAuth();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : 0;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const userRole = userData?.role ?? '';
  const isAdmin = userRole === 'ADMIN';
  const isSeller = isSellerRole(userRole);
  const isRider = userRole === 'DELIVERY_RIDER';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Sign Out', style: 'destructive' as const,
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  const nav = (path: string) => () => router.push(path as never);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: topPad, paddingBottom: botPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* User Card */}
      <View style={[s.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[s.avatar, { backgroundColor: colors.primary + '20' }]}>
          {userData?.image ? (
            <Image source={{ uri: userData.image }} style={s.avatarImg} />
          ) : (
            <Text style={[s.avatarInitial, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
              {(userData?.name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={s.userInfo}>
          <Text style={[s.userName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
            {userData?.name ?? 'User'}
          </Text>
          <Text style={[s.userEmail, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
            {userData?.email ?? ''}
          </Text>
          <View style={[s.rolePill, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[s.roleText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              {(userRole).replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
        <Pressable onPress={nav('/profile')} hitSlop={8}>
          <Feather name="edit-3" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Admin Section */}
      {isAdmin && (
        <>
          <SectionHeader title="Admin" />
          <View style={s.group}>
            <MenuItem icon="users" label="Manage Users" subtitle="View and manage all users" onPress={nav('/users')} />
            <View style={s.divider} />
            <MenuItem icon="tag" label="Categories" subtitle="Product categories" onPress={nav('/categories')} />
            <View style={s.divider} />
            <MenuItem icon="image" label="Banners" subtitle="Manage promotional banners" onPress={nav('/banners')} />
            <View style={s.divider} />
            <MenuItem icon="book-open" label="Blog" subtitle="Manage blog posts" onPress={nav('/blog')} />
            <View style={s.divider} />
            <MenuItem icon="percent" label="Coupons" subtitle="Discounts and offers" onPress={nav('/coupons')} />
          </View>
        </>
      )}

      {/* Seller Section */}
      {isSeller && (
        <>
          <SectionHeader title="My Store" />
          <View style={s.group}>
            <MenuItem icon="store" label="Store Profile" subtitle="Manage your store details" onPress={nav('/store-profile')} color="#10b981" />
            <View style={s.divider} />
            <MenuItem icon="percent" label="Coupons & Offers" subtitle="Create discount codes" onPress={nav('/coupons')} color="#f59e0b" />
            <View style={s.divider} />
            <MenuItem icon="tag" label="Categories" onPress={nav('/categories')} color="#8b5cf6" />
          </View>
        </>
      )}

      {/* Rider Section */}
      {isRider && (
        <>
          <SectionHeader title="Delivery" />
          <View style={s.group}>
            <MenuItem icon="map-pin" label="My Deliveries" onPress={nav('/(tabs)/orders')} color="#10b981" />
          </View>
        </>
      )}

      {/* Finance */}
      <SectionHeader title="Finance" />
      <View style={s.group}>
        <MenuItem icon="dollar-sign" label="Wallet & Transactions" subtitle="View earnings and requests" onPress={nav('/wallet')} color="#3b82f6" />
      </View>

      {/* Account */}
      <SectionHeader title="Account" />
      <View style={s.group}>
        <MenuItem icon="user" label="My Profile" onPress={nav('/profile')} color="#6366f1" />
        <View style={s.divider} />
        <MenuItem icon="lock" label="Change Password" onPress={nav('/change-password')} color="#8b5cf6" />
        <View style={s.divider} />
        <MenuItem icon="settings" label="Settings" onPress={nav('/settings')} color="#6b7280" />
      </View>

      {/* Logout */}
      <View style={s.group}>
        <MenuItem
          icon="log-out"
          label="Sign Out"
          color={colors.destructive}
          onPress={handleLogout}
          showArrow={false}
        />
      </View>

      <Text style={[s.version, { color: colors.mutedForeground }]}>Admin Panel v1.0.0</Text>
    </ScrollView>
  );
}

const mStyles = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13, borderWidth: 0,
  },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 14 },
  itemSub: { fontSize: 12, marginTop: 1 },
  sectionHeader: {
    fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 6, marginLeft: 4,
  },
});

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16 },
    userCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 16, borderRadius: colors.radius, borderWidth: 1, marginTop: 16,
    },
    avatar: {
      width: 52, height: 52, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    avatarImg: { width: 52, height: 52 },
    avatarInitial: { fontSize: 22 },
    userInfo: { flex: 1, gap: 2 },
    userName: { fontSize: 16 },
    userEmail: { fontSize: 12 },
    rolePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 3 },
    roleText: { fontSize: 10 },
    group: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 62 },
    version: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 24 },
  });
