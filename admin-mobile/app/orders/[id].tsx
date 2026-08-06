import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchDataFromApi, patchData, deleteData } from '../../utils/api';
import Colors from '../../constants/colors';

interface OrderItem {
  _id?: string;
  productTitle?: string;
  name?: string;
  quantity?: number;
  price?: number;
  subTotal?: number;
}

interface Order {
  _id: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  pincode?: string;
  country?: string;
  email?: string;
  userId?: { name?: string; email?: string; _id?: string } | string;
  products?: OrderItem[];
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
  returned: '#f97316',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const C = Colors[scheme ?? 'dark'];

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDataFromApi(`/api/orders/${id}`);
      if (data?.order) setOrder(data.order);
      else if (data?._id) setOrder(data);
    } catch {
      Alert.alert('Error', 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder])
  );

  const updateStatus = async (status: string) => {
    if (!order) return;
    setUpdatingStatus(true);
    setShowStatusPicker(false);
    try {
      await patchData(`/api/orders/${order._id}`, { status });
      setOrder((prev) => (prev ? { ...prev, status } : prev));
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = () => {
    if (!order) return;
    Alert.alert('Delete Order', 'This action cannot be undone. Delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteData(`/api/orders/${order._id}`);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete order.');
          }
        },
      },
    ]);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const styles = makeStyles(C);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Order Details', headerStyle: { backgroundColor: C.headerBg }, headerTintColor: C.text }} />
        <View style={[styles.center, { backgroundColor: C.background }]}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Stack.Screen options={{ title: 'Order Details', headerStyle: { backgroundColor: C.headerBg }, headerTintColor: C.text }} />
        <View style={[styles.center, { backgroundColor: C.background }]}>
          <Ionicons name="receipt-outline" size={48} color={C.textMuted} />
          <Text style={{ color: C.textMuted, marginTop: 12 }}>Order not found.</Text>
        </View>
      </>
    );
  }

  const statusColor = STATUS_COLORS[order.status ?? ''] ?? C.textMuted;
  const customerName =
    typeof order.userId === 'object'
      ? order.userId?.name ?? order.name
      : order.name;
  const customerEmail =
    typeof order.userId === 'object'
      ? order.userId?.email ?? order.email
      : order.email;

  return (
    <>
      <Stack.Screen
        options={{
          title: `Order #${order._id.slice(-6).toUpperCase()}`,
          headerStyle: { backgroundColor: C.headerBg },
          headerTintColor: C.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} style={{ marginRight: 4 }}>
              <Ionicons name="trash-outline" size={20} color={C.error} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={{ backgroundColor: C.background }}
        contentContainerStyle={styles.scroll}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { borderColor: statusColor + '55', backgroundColor: statusColor + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {order.status?.toUpperCase() ?? 'UNKNOWN'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowStatusPicker(true)}
            style={[styles.changeBtn, { borderColor: statusColor }]}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator size="small" color={statusColor} />
            ) : (
              <Text style={[styles.changeBtnText, { color: statusColor }]}>Change</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Status Picker */}
        {showStatusPicker && (
          <View style={[styles.card, styles.pickerCard]}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Select New Status</Text>
            <View style={styles.statusGrid}>
              {ORDER_STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => updateStatus(s)}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor:
                        order.status === s
                          ? (STATUS_COLORS[s] ?? C.primary) + '33'
                          : C.surface,
                      borderColor:
                        order.status === s
                          ? STATUS_COLORS[s] ?? C.primary
                          : C.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: STATUS_COLORS[s] ?? C.text,
                      fontWeight: order.status === s ? '700' : '500',
                      fontSize: 13,
                      textTransform: 'capitalize',
                    }}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowStatusPicker(false)} style={styles.cancelPickerBtn}>
              <Text style={{ color: C.textSecondary, fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Info */}
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Customer</Text>
          <InfoRow icon="person-outline" label="Name" value={customerName ?? '—'} C={C} />
          <InfoRow icon="mail-outline" label="Email" value={customerEmail ?? '—'} C={C} />
          <InfoRow icon="call-outline" label="Phone" value={order.phoneNumber ?? '—'} C={C} />
        </View>

        {/* Delivery Address */}
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Delivery Address</Text>
          <InfoRow icon="location-outline" label="Address" value={order.address ?? '—'} C={C} />
          <InfoRow icon="business-outline" label="City" value={[order.city, order.pincode].filter(Boolean).join(' ')} C={C} />
          <InfoRow icon="globe-outline" label="Country" value={order.country ?? '—'} C={C} />
        </View>

        {/* Payment Info */}
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Payment</Text>
          <InfoRow icon="card-outline" label="Method" value={order.paymentMethod ?? '—'} C={C} />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Status"
            value={order.paymentStatus ?? '—'}
            valueColor={
              order.paymentStatus === 'paid'
                ? C.success
                : order.paymentStatus === 'failed'
                ? C.error
                : C.warning
            }
            C={C}
          />
          <InfoRow icon="bicycle-outline" label="Delivery" value={order.deliveryMethod ?? '—'} C={C} />
        </View>

        {/* Items */}
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            Items ({order.products?.length ?? 0})
          </Text>
          {(order.products ?? []).map((item, i) => (
            <View
              key={item._id ?? i}
              style={[styles.itemRow, i < (order.products?.length ?? 0) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }]}
            >
              <View style={styles.itemLeft}>
                <Text style={[styles.itemName, { color: C.text }]} numberOfLines={2}>
                  {item.productTitle ?? item.name ?? 'Item'}
                </Text>
                <Text style={[styles.itemMeta, { color: C.textMuted }]}>
                  Qty: {item.quantity ?? 1} × ${(item.price ?? 0).toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: C.text }]}>
                ${(item.subTotal ?? (item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={[styles.totalRow, { borderTopColor: C.border }]}>
            <Text style={[styles.totalLabel, { color: C.textSecondary }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: C.primary }]}>
              ${(order.totalAmount ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Timestamps */}
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Timeline</Text>
          <InfoRow icon="time-outline" label="Placed" value={formatDate(order.createdAt)} C={C} />
          <InfoRow icon="refresh-outline" label="Updated" value={formatDate(order.updatedAt)} C={C} />
        </View>

        {!!order.notes && (
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Notes</Text>
            <Text style={{ color: C.textSecondary, fontSize: 14, lineHeight: 20 }}>{order.notes}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
  C,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  C: typeof Colors.dark;
}) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={15} color={C.textMuted} style={infoStyles.icon} />
      <Text style={[infoStyles.label, { color: C.textMuted }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: valueColor ?? C.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 8,
  },
  icon: { marginTop: 1 },
  label: { width: 68, fontSize: 13 },
  value: { flex: 1, fontSize: 13, fontWeight: '500' },
});

const makeStyles = (C: typeof Colors.dark) =>
  StyleSheet.create({
    scroll: { padding: 16, gap: 14, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    statusLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    changeBtn: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 6,
      minWidth: 64,
      alignItems: 'center',
    },
    changeBtnText: { fontSize: 13, fontWeight: '600' },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 16,
      gap: 4,
    },
    pickerCard: {
      backgroundColor: C.surface,
      borderColor: C.border,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      opacity: 0.7,
    },
    statusGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    statusOption: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
    },
    cancelPickerBtn: {
      alignSelf: 'center',
      padding: 8,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 10,
      gap: 12,
    },
    itemLeft: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    itemMeta: { fontSize: 12 },
    itemTotal: { fontSize: 14, fontWeight: '600', paddingTop: 1 },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      marginTop: 6,
      paddingTop: 12,
    },
    totalLabel: { fontSize: 15, fontWeight: '600' },
    totalAmount: { fontSize: 18, fontWeight: '800' },
  });
