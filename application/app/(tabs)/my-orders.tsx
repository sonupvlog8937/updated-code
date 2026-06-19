import { useColors } from "@/hooks/useColors";
import { fetchOrders, setSearchQuery, setSelectedStatus } from "@/src/store/ordersSlice";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ SafeAreaView import REMOVED — tab layout handles safe area

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
  userId?: { name?: string; email?: string };
  paymentId?: string;
  discount_amount?: number;
  returnRequest?: { requested?: boolean };
  refundRequest?: { requested?: boolean };
}

const STATUS_CONFIG = {
  pending: { color: "#f59e0b", bg: "#fef3c7", label: "Pending", icon: "clock" },
  confirmed: { color: "#3b82f6", bg: "#dbeafe", label: "Confirmed", icon: "check-circle" },
  processing: { color: "#8b5cf6", bg: "#ede9fe", label: "Processing", icon: "package" },
  shipped: { color: "#0ea5e9", bg: "#e0f2fe", label: "Shipped", icon: "truck" },
  "out for delivery": { color: "#0ea5e9", bg: "#e0f2fe", label: "Out for Delivery", icon: "navigation" },
  delivered: { color: "#16a34a", bg: "#dcfce7", label: "Delivered", icon: "check-all" },
  cancelled: { color: "#dc2626", bg: "#fee2e2", label: "Cancelled", icon: "close-circle" },
  refunded: { color: "#0f766e", bg: "#ccfbf1", label: "Refunded", icon: "undo" },
};

const STATUS_FILTERS = [
  { id: "all", label: "All", icon: "list" },
  { id: "pending", label: "Pending", icon: "clock" },
  { id: "confirmed", label: "Confirmed", icon: "check-circle" },
  { id: "processing", label: "Processing", icon: "package" },
  { id: "shipped", label: "Shipped", icon: "truck" },
  { id: "delivered", label: "Delivered", icon: "check-all" },
];

type StatusKey = keyof typeof STATUS_CONFIG;

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[(status?.toLowerCase() as StatusKey)] || STATUS_CONFIG.pending;

export default function MyOrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    filteredOrders,
    loading,
    loadingMore,
    page,
    totalCount,
    hasMore,
    searchQuery,
    selectedStatus,
  } = useAppSelector((state) => state.orders);

  const flatListRef = useRef<FlatList>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const filterSlideAnim = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debug effect to track state changes
  useEffect(() => {
    console.log("📊 Orders State Updated:", {
      filteredOrdersCount: filteredOrders.length,
      totalCount,
      page,
      hasMore,
      loading,
      loadingMore,
      selectedStatus,
      searchQuery
    });
  }, [filteredOrders.length, totalCount, page, hasMore, loading, loadingMore]);

  useEffect(() => {
    if (loadingMore) {
      // Spin animation
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, { 
          toValue: 1, 
          duration: 1200, 
          useNativeDriver: true 
        })
      ).start();
      
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { 
            toValue: 1.3, 
            duration: 700, 
            useNativeDriver: true 
          }),
          Animated.timing(pulseAnim, { 
            toValue: 1, 
            duration: 700, 
            useNativeDriver: true 
          }),
        ])
      ).start();
    }
  }, [loadingMore]);

  const startLoaderAnimation = () => {
    if (loadingMore) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  // Debug effect to track state changes
  useEffect(() => {
    console.log("📊 Orders State:", {
      filteredOrdersCount: filteredOrders.length,
      totalCount,
      page,
      hasMore,
      loading,
      loadingMore,
      selectedStatus,
    });
  }, [filteredOrders.length, totalCount, page, hasMore, loading, loadingMore, selectedStatus]);

  // Auto-load more if we have less than 20 items and more are available
  useEffect(() => {
    if (filteredOrders.length > 0 && filteredOrders.length < 20 && hasMore && !loading && !loadingMore) {
      console.log("🚀 Auto-loading more orders (less than 20 items)");
      setTimeout(() => {
        handleLoadMore();
      }, 500);
    }
  }, [filteredOrders.length, hasMore, loading, loadingMore]);

  useEffect(() => {
    console.log("🚀 MyOrdersScreen mounted, fetching initial orders");
    dispatch(fetchOrders({ page: 1, limit: 10 }) as any);
  }, []);

  useEffect(() => {
    Animated.timing(filterSlideAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFilters]);

  const handleSearch = (text: string) => {
    setLocalSearchQuery(text);
    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      dispatch(setSearchQuery(text));
      dispatch(fetchOrders({ page: 1, limit: 10 }) as any);
      setIsSearching(false);
    }, 500);
  };

  const handleStatusFilter = (status: string) => {
    console.log("🔍 Status filter changed:", status);
    dispatch(setSelectedStatus(status as any));
    dispatch(fetchOrders({ page: 1, limit: 10 }) as any);
  };

  const handleLoadMore = () => {
    console.log("🔄 handleLoadMore called", {
      loading,
      loadingMore,
      hasMore,
      currentPage: page,
      filteredOrdersLength: filteredOrders.length,
      totalCount,
    });

    if (!loadingMore && hasMore && !loading) {
      console.log(`✅ Loading page ${page + 1}`);
      dispatch(fetchOrders({ page: page + 1, limit: 10 }) as any);
    } else {
      console.log("⏭️ Skipping load more:", {
        loadingMore,
        hasMore,
        loading,
      });
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Increased from 20 to 100
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && hasMore && !loadingMore && !loading) {
      console.log("📍 User scrolled close to bottom, triggering load more");
      handleLoadMore();
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const formatPrice = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const renderEmptyState = () => {
    console.log("📭 Rendering empty state");
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name={localSearchQuery ? "magnify-close" : "package-variant"}
          size={60}
          color={colors.mutedForeground}
        />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          {localSearchQuery || selectedStatus !== "all" ? "No results found" : "No Orders Yet"}
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {localSearchQuery
            ? `No orders match "${localSearchQuery}"`
            : selectedStatus !== "all"
            ? `No ${selectedStatus} orders`
            : "Your order history will appear here"}
        </Text>
        {!localSearchQuery && selectedStatus === "all" && (
          <Pressable
            onPress={() => router.push("/" as never)}
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.emptyButtonText}>Start Shopping</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderOrderCard = (order: Order) => {
    const status = order?.order_status || "pending";
    const statusConfig = getStatusConfig(status);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          router.push({ pathname: "/order-details", params: { orderId: order._id } } as never)
        }
        style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.orderContent}>
          {order?.products?.[0]?.image && (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: order.products[0].image }}
                style={styles.productImage}
                resizeMode="cover"
              />
              {order.products.length > 1 && (
                <View style={[styles.itemCountBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.itemCountText}>+{order.products.length - 1}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.orderDetails}>
            <View style={styles.topRow}>
              <View style={styles.infoLeft}>
                <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
                  📅 {formatDate(order.createdAt)}
                </Text>
                <Text style={[styles.orderItemCount, { color: colors.mutedForeground }]}>
                  📦 {order?.products?.length}{" "}
                  {order?.products?.length === 1 ? "item" : "items"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </View>

            <View style={styles.bottomRow}>
              <Text style={[styles.orderTotal, { color: colors.foreground }]}>
                {formatPrice(order?.totalAmt)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      <View
        style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Orders</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {filteredOrders.length}
            </Text>{" "}
            {totalCount > 0 ? `of ${totalCount}` : ""} orders
            {hasMore ? " (loading more...)" : " (all loaded)"}
          </Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.surfaceAlt }]}>
          <MaterialCommunityIcons name="shopping-outline" size={20} color={colors.mutedForeground} />
        </View>
      </View>

      <View style={[styles.searchContainer, { paddingHorizontal: 16 }]}>
        <View
          style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        >
          {isSearching ? (
            <ActivityIndicator size={18} color={colors.primary} style={styles.searchIcon} />
          ) : (
            <Ionicons name="search" size={18} color={colors.mutedForeground} style={styles.searchIcon} />
          )}
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search orders..."
            placeholderTextColor={colors.mutedForeground}
            value={localSearchQuery}
            onChangeText={handleSearch}
          />
          {localSearchQuery && (
            <Pressable
              onPress={() => {
                setLocalSearchQuery("");
                dispatch(setSearchQuery(""));
                dispatch(fetchOrders({ page: 1, limit: 10 }) as any);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={[
            styles.filterButton,
            {
              backgroundColor: showFilters ? colors.primary : colors.surfaceAlt,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="funnel" size={18} color={showFilters ? "#fff" : colors.foreground} />
        </Pressable>
      </View>

      {showFilters && (
        <Animated.View
          style={[
            styles.filterContainer,
            {
              opacity: filterSlideAnim,
              maxHeight: filterSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }),
            },
          ]}
        >
          <View style={styles.filterPills}>
            {STATUS_FILTERS.map((filter) => (
              <Pressable
                key={filter.id}
                onPress={() => handleStatusFilter(filter.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: selectedStatus === filter.id ? colors.primary : colors.surfaceAlt,
                    borderColor: selectedStatus === filter.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={14}
                  color={selectedStatus === filter.id ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: selectedStatus === filter.id ? "#fff" : colors.foreground,
                      fontWeight: selectedStatus === filter.id ? "700" : "500",
                    },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}
    </>
  );

  const renderFooter = () => {
    console.log("📍 Rendering footer:", { loadingMore, hasMore, totalCount, filteredOrdersLength: filteredOrders.length });
    
    if (loadingMore) {
      return (
        <View style={[styles.loadingFooter, { backgroundColor: colors.background }]}>
          <View style={styles.loadingRowContainer}>
            <Animated.View
              style={[
                styles.loaderDot,
                { 
                  backgroundColor: colors.primary, 
                  transform: [{ rotate: spin }] 
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.loaderInner, 
                  { 
                    backgroundColor: colors.background,
                    transform: [{ scale: pulseAnim }] 
                  }
                ]} 
              />
            </Animated.View>
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading more... ({filteredOrders.length} of {totalCount})
            </Text>
          </View>
        </View>
      );
    }
    
    if (!hasMore && filteredOrders.length > 0) {
      return (
        <View style={[styles.loadingFooter, { backgroundColor: colors.background }]}>
          <View style={[styles.allLoadedContainer, { borderColor: colors.border }]}>
            <View style={[styles.allLoadedIcon, { backgroundColor: colors.primary + "20" }]}>
              <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.allLoadedText, { color: colors.foreground }]}>
              All {totalCount} Orders Loaded
            </Text>
            <Text style={[styles.allLoadedSubtext, { color: colors.mutedForeground }]}>
              You've reached the end of your order history
            </Text>
          </View>
        </View>
      );
    }
    
    if (hasMore && !loadingMore) {
      return (
        <View style={[styles.loadingFooter, { backgroundColor: colors.background }]}>
          <View style={[styles.scrollHintContainer, { borderColor: colors.border }]}>
            <Animated.View style={{ transform: [{ translateY: pulseAnim.interpolate({
              inputRange: [1, 1.2],
              outputRange: [0, -4]
            }) }] }}>
              <Ionicons name="arrow-down-circle" size={28} color={colors.mutedForeground} />
            </Animated.View>
            <Text style={[styles.scrollHintText, { color: colors.mutedForeground }]}>
              Scroll down to load more orders
            </Text>
          </View>
        </View>
      );
    }
    
    return null;
  };

  // ✅ Loading state — plain View, no SafeAreaView
  if (loading && filteredOrders.length === 0) {
    console.log("⏳ Showing loading state");
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, marginTop: 12 }]}>
            Loading orders...
          </Text>
        </View>
      </View>
    );
  }

  console.log("🎨 Rendering orders list", {
    filteredOrdersCount: filteredOrders.length,
    totalCount,
    hasMore,
    loading,
    loadingMore,
  });

  // ✅ Main return — SafeAreaView hataya, plain View use kiya
  //    Expo Router tab layout already top safe area handle karta hai
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {filteredOrders.length === 0 ? (
        <FlatList
          ref={flatListRef}
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredOrders}
          renderItem={({ item }) => renderOrderCard(item)}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={1.0}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          decelerationRate="fast"
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatListContent: { paddingBottom: 80 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingBottom: 24,
  },
  loadingRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loaderDot: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loaderInner: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: "#fff" 
  },
  loadingText: { 
    fontSize: 13, 
    fontWeight: "600",
    letterSpacing: 0.2
  },
  allLoadedContainer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 8,
    marginVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  allLoadedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  allLoadedText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  allLoadedSubtext: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  scrollHintContainer: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginVertical: 8,
  },
  scrollHintText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  headerSubtitle: { fontSize: 12, fontWeight: "500" },
  headerIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  searchContainer: { flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "center" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500" },
  clearButton: { padding: 4 },
  filterButton: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  filterContainer: { marginHorizontal: 16, marginBottom: 12, overflow: "hidden" },
  filterPills: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 4 },
  filterPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterPillText: { fontSize: 12 },
  orderCard: { borderWidth: 1, borderRadius: 12, overflow: "hidden", marginHorizontal: 16, marginBottom: 12 },
  orderContent: { flexDirection: "row", alignItems: "center", padding: 10, gap: 12 },
  imageWrapper: { position: "relative", width: 90, height: 90, borderRadius: 8, overflow: "hidden" },
  productImage: { width: "100%", height: "100%" },
  itemCountBadge: { position: "absolute", bottom: 4, right: 4, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8, minWidth: 24, alignItems: "center", justifyContent: "center" },
  itemCountText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  orderDetails: { flex: 1, justifyContent: "space-between", height: 90 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  infoLeft: { gap: 4, flex: 1 },
  orderDate: { fontSize: 11, fontWeight: "500" },
  orderItemCount: { fontSize: 11, fontWeight: "500" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderTotal: { fontSize: 14, fontWeight: "800" },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 13, fontWeight: "500", marginBottom: 24, textAlign: "center" },
  emptyButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  emptyButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});