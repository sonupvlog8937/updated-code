import { useColors } from "@/hooks/useColors";
import { fetchDataFromApi } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OrderProduct {
  _id?: string;
  productId?: string;
  productTitle: string;
  image?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

interface DeliveryAddress {
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  mobile?: string;
}

interface Order {
  _id: string;
  order_status: string;
  createdAt: string;
  products: OrderProduct[];
  totalAmt: number;
  delivery_address?: DeliveryAddress;
  userId?: {
    name?: string;
    email?: string;
  };
  paymentId?: string;
  discount_amount?: number;
  returnRequest?: {
    requested?: boolean;
  };
  refundRequest?: {
    requested?: boolean;
  };
}

const STATUS_CONFIG = {
  pending: { color: "#f59e0b", bg: "#fef3c7", label: "Pending", icon: "clock" },
  confirmed: {
    color: "#3b82f6",
    bg: "#dbeafe",
    label: "Confirmed",
    icon: "check-circle",
  },
  processing: {
    color: "#8b5cf6",
    bg: "#ede9fe",
    label: "Processing",
    icon: "package",
  },
  shipped: { color: "#0ea5e9", bg: "#e0f2fe", label: "Shipped", icon: "truck" },
  "out for delivery": {
    color: "#0ea5e9",
    bg: "#e0f2fe",
    label: "Out for Delivery",
    icon: "navigation",
  },
  delivered: {
    color: "#16a34a",
    bg: "#dcfce7",
    label: "Delivered",
    icon: "check-all",
  },
  cancelled: {
    color: "#dc2626",
    bg: "#fee2e2",
    label: "Cancelled",
    icon: "close-circle",
  },
  refunded: {
    color: "#0f766e",
    bg: "#ccfbf1",
    label: "Refunded",
    icon: "undo",
  },
};

type StatusKey = keyof typeof STATUS_CONFIG;

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[(status?.toLowerCase() as StatusKey)] || STATUS_CONFIG.pending;

export default function MyOrdersScreen() {
  const colors = useColors();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startLoaderAnimation();
  }, [loadingMore]);

  const startLoaderAnimation = () => {
    if (loadingMore) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const fetchOrders = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetchDataFromApi(
        `/api/order/order-list/orders?page=${pageNum}&limit=10`,
      );

      if (res?.error === false || res?.success === true) {
        const newOrders = (res?.data || []) as Order[];
        const totalCount = res?.totalCount || res?.total || 0;

        if (pageNum === 1) {
          setOrders(newOrders);
        } else {
          setOrders((prev) => [...prev, ...newOrders]);
        }

        const currentTotal =
          pageNum === 1 ? newOrders.length : orders.length + newOrders.length;
        const hasMoreOrders = currentTotal < totalCount;

        setTotalCount(totalCount);
        setHasMore(hasMoreOrders);
        setPage(pageNum);

        if (newOrders.length === 0 && pageNum === 1) {
          showToast("info", "No orders found");
        }
      } else {
        showToast("error", res?.message || "Failed to fetch orders");
      }
    } catch (error) {
      showToast("error", "Error loading orders");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchOrders(page + 1);
    }
  };



  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="package-variant"
        size={60}
        color={colors.mutedForeground}
      />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No Orders Yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        Your order history will appear here
      </Text>
      <Pressable
        onPress={() => router.push("/" as never)}
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.emptyButtonText}>Start Shopping</Text>
      </Pressable>
    </View>
  );

  const renderOrderCard = (order: Order, index: number) => {
    const status = order?.order_status || "pending";
    const statusConfig = getStatusConfig(status);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          router.push({ pathname: '/order-details', params: { orderId: order._id } } as never);
        }}
        style={[
          styles.orderCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIndexBadge}>
            <Text style={styles.orderIndex}>#{index + 1}</Text>
          </View>

          <View style={styles.orderInfo}>
            <Text style={[styles.orderId, { color: colors.primary }]}>
              {order._id?.slice(-10).toUpperCase()}
            </Text>
            <View style={styles.orderMeta}>
              <Text
                style={[styles.orderDate, { color: colors.mutedForeground }]}
              >
                📅 {formatDate(order.createdAt)}
              </Text>
              <Text
                style={[
                  styles.orderItemCount,
                  { color: colors.mutedForeground },
                ]}
              >
                📦 {order?.products?.length} items
              </Text>
            </View>
          </View>

          <View style={styles.orderRight}>
            <Text style={[styles.orderTotal, { color: colors.foreground }]}>
              {formatPrice(order?.totalAmt)}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
            >
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                ● {statusConfig.label}
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.mutedForeground}
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          My Orders
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {orders.length}
          </Text>{" "}
          {totalCount > 0 ? `of ${totalCount}` : ""} orders
        </Text>
      </View>
      <View style={[styles.headerIcon, { backgroundColor: colors.surfaceAlt }]}>
        <MaterialCommunityIcons
          name="shopping-outline"
          size={20}
          color={colors.mutedForeground}
        />
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={[styles.loadingFooter, { backgroundColor: colors.background }]}>
        <Animated.View
          style={[
            styles.loaderDot,
            {
              backgroundColor: colors.primary,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Animated.View
            style={[styles.loaderInner, { transform: [{ scale: pulseAnim }] }]}
          />
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading more orders...
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {orders.length === 0 ? (
        <FlatList
          ref={flatListRef}
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={orders}
          renderItem={({ item, index }) => renderOrderCard(item, index)}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.15}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          decelerationRate="fast"
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16, // Reduced from 32
    paddingBottom: 20, // Reduced from 48
    gap: 10, // Reduced from 14
  },
  loaderDot: {
    width: 32, // Reduced from 50
    height: 32, // Reduced from 50
    borderRadius: 16, // Reduced from 25
    justifyContent: "center",
    alignItems: "center",
  },
  loaderInner: {
    width: 16, // Reduced from 24
    height: 16, // Reduced from 24
    borderRadius: 8, // Reduced from 12
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 13, // Reduced from 14
    fontWeight: "600", // Changed from 700 to 600 for lighter weight
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  orderIndexBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  orderIndex: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(0,0,0,0.6)",
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  orderDate: {
    fontSize: 11,
    fontWeight: "500",
  },
  orderItemCount: {
    fontSize: 11,
    fontWeight: "500",
  },
  orderRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "800",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  chevron: {},
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});