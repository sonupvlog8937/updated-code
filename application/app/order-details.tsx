import { useColors } from "@/hooks/useColors";
import { fetchOrders, submitReturnRequest, submitRefundRequest } from "@/src/store/ordersSlice";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showToast } from "@/src/utils/toast";
import { fetchDataFromApi } from "@/src/utils/api";

interface OrderProduct {
  _id?: string;
  productId?: string;
  productTitle: string;
  image?: string;
  size?: string;
  color?: string;
  weight?: string;
  selectedOptions?: Record<string, string>;
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
  shippingFee?: number;
  deliveryFee?: number;
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

const REFUND_REASONS = [
  { id: "bad_product", label: "Bad Product", icon: "close-circle" },
  { id: "cut_product", label: "Cut/Damaged Product", icon: "alert-circle" },
  { id: "no_liked", label: "Not Liked Product", icon: "thumb-down" },
  { id: "worst_product", label: "Worst Product Quality", icon: "alert" },
  { id: "unsatisfy", label: "Unsatisfied with Product", icon: "frown" },
];

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

type StatusKey = keyof typeof STATUS_CONFIG;

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[(status?.toLowerCase() as StatusKey)] || STATUS_CONFIG.pending;

export default function OrderDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  // Get order from Redux store
  const allOrders = useAppSelector((state) => state.orders.orders);
  const storeLoading = useAppSelector((state) => state.orders.loading);
  const order = allOrders.find((o: any) => o._id === orderId) as Order | undefined;

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"return" | "refund">("return");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [commerceSettings, setCommerceSettings] = useState<any>({ shippingFee: 0, deliveryFee: 0, freeShippingAbove: 0, goMarketShippingFee: 0, goMarketDeliveryFeePerKm: 0 });

  // Fetch commerce settings for fallback pricing
  useEffect(() => {
    fetchDataFromApi("/api/settings/commerce")
      .then((res) => {
        if (res?.data) {
          setCommerceSettings(res.data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch commerce settings:", error);
      });
  }, []);

  // If orders are not loaded yet, fetch them
  useEffect(() => {
    if (allOrders.length === 0 && orderId) {
      dispatch(fetchOrders({ page: 1, limit: 50 }) as any);
    }
  }, [orderId]);

  useEffect(() => {
    if (order) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [order]);

  const handleReturnPress = () => {
    setModalType("return");
    setSelectedReason(null);
    setFeedbackModalVisible(true);
  };

  const handleRefundPress = () => {
    setModalType("refund");
    setSelectedReason(null);
    setFeedbackModalVisible(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReason || !order) {
      showToast("error", "Please select a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const reasonText = REFUND_REASONS.find(r => r.id === selectedReason)?.label || "Customer request";

      if (modalType === "return") {
        // Submit return request to backend
        await dispatch(
          submitReturnRequest({
            orderId: order._id,
            reason: reasonText,
          }) as any
        ).unwrap();
        showToast("success", "Return request submitted to seller");
      } else {
        // Submit refund request to backend
        await dispatch(
          submitRefundRequest({
            orderId: order._id,
            reason: reasonText,
          }) as any
        ).unwrap();
        showToast("success", "Refund request submitted to seller");
      }

      setFeedbackModalVisible(false);
      setSelectedReason(null);
      // Refresh orders to update UI
      dispatch(fetchOrders({ page: 1, limit: 50 }) as any);
    } catch (error: any) {
      showToast(error || "Error submitting request. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepState = (orderStatus: string, step: string) => {
    const s = orderStatus?.toLowerCase();
    if (s === "cancelled") return step === "pending" ? "cancelled" : "idle";
    const si = STEPS.indexOf(s);
    const ti = STEPS.indexOf(step);
    if (si === -1) return "idle";
    if (ti < si) return "done";
    if (ti === si) return "active";
    return "idle";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (amount: number) => {
    return `₹${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
  };

  if (storeLoading && !order) {
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

  if (!order) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="package-variant-remove"
            size={60}
            color={colors.mutedForeground}
          />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            Order Not Found
          </Text>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            We couldn't find this order. It may have been removed.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.errorButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const status = order?.order_status || "pending";
  const statusConfig = getStatusConfig(status);
  const addr = order?.delivery_address || {};
  const isCOD = !order?.paymentId || order?.paymentId === "";
  const isDelivered = status.toLowerCase() === "delivered";
  const hasReturnRequested = order?.returnRequest?.requested;
  const hasRefundRequested = order?.refundRequest?.requested;

  // Calculate shipping and delivery fees with fallback to commerce settings
  const subtotal = order?.products?.reduce(
    (sum: number, p: OrderProduct) => sum + p.price * p.quantity,
    0,
  ) || 0;
  const discount = order?.discount_amount || 0;
  const baseAfterDiscount = Math.max(subtotal - discount, 0);

  // Use order's fees if available, otherwise use commerce settings
  const hasOrderFees = (order?.shippingFee !== undefined && order?.shippingFee !== null) ||
    (order?.deliveryFee !== undefined && order?.deliveryFee !== null);
  const isGoMarketOrder = order?.products?.some((item: any) => String(item?.brand || "").toLowerCase().includes("gomarket") || String(item?.source || "").toLowerCase().includes("gomarket"));

  let displayShippingFee = 0;
  let displayDeliveryFee = 0;

  if (hasOrderFees) {
    displayShippingFee = Math.round(order?.shippingFee || 0);
    displayDeliveryFee = Math.round(order?.deliveryFee || 0);
  } else if (commerceSettings.shippingFee > 0 || commerceSettings.deliveryFee > 0) {
    const freeByRule = commerceSettings.freeShippingAbove > 0 && baseAfterDiscount >= commerceSettings.freeShippingAbove;
    if (isGoMarketOrder) {
      displayShippingFee = freeByRule ? 0 : Math.round(Number(commerceSettings.goMarketShippingFee || 0));
      displayDeliveryFee = freeByRule ? 0 : Math.round(Number((commerceSettings.goMarketDeliveryFeePerKm || 0) * 3));
    } else {
      displayShippingFee = freeByRule ? 0 : Math.round(Number(commerceSettings.shippingFee || 0));
      displayDeliveryFee = freeByRule ? 0 : Math.round(Number(commerceSettings.deliveryFee || 0));
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Order Details
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
          >
            #{order._id?.slice(-10).toUpperCase()}
          </Text>
        </View>
        <View
          style={[styles.headerIcon, { backgroundColor: colors.surfaceAlt }]}
        >
          <MaterialCommunityIcons
            name="package-variant"
            size={20}
            color={colors.mutedForeground}
          />
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Badge */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: statusConfig.bg, borderColor: statusConfig.color + "30" },
          ]}
        >
          <View
            style={[
              styles.statusIconCircle,
              { backgroundColor: statusConfig.color + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name={statusConfig.icon as any}
              size={28}
              color={statusConfig.color}
            />
          </View>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <Text style={[styles.statusDate, { color: statusConfig.color + "99" }]}>
            {formatDate(order.createdAt)}
          </Text>
        </View>

        {/* Order Tracking Timeline */}
        <View style={[styles.timeline, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.timelineTitle, { color: colors.mutedForeground }]}>
            📦 ORDER TRACKING
          </Text>
          <View style={styles.timelineSteps}>
            {STEPS.map((step, index) => {
              const state = getStepState(status, step);
              const stepConfig = getStatusConfig(step);
              const isLast = index === STEPS.length - 1;

              return (
                <View key={step} style={styles.timelineStep}>
                  <View
                    style={[
                      styles.stepCircle,
                      state === "active" && { backgroundColor: colors.foreground },
                      state === "done" && { backgroundColor: colors.primary },
                      state === "cancelled" && { backgroundColor: "#dc2626" },
                    ]}
                  >
                    <Ionicons
                      name={
                        state === "done" || state === "active"
                          ? "checkmark"
                          : ("ellipse" as any)
                      }
                      size={14}
                      color="#fff"
                    />
                  </View>

                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        state === "active" && {
                          backgroundColor: colors.foreground,
                        },
                        state === "done" && { backgroundColor: colors.primary },
                      ]}
                    />
                  )}

                  <Text
                    style={[
                      styles.stepLabel,
                      state === "active" && {
                        color: colors.foreground,
                        fontWeight: "700",
                      },
                      state === "done" && {
                        color: colors.primary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {stepConfig.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Info Card */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt" size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              ORDER INFO
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Order ID
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {order._id?.slice(-10).toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Date
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              📅 {formatDate(order.createdAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Payment
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {isCOD ? "💵 Cash on Delivery" : "💳 Paid Online"}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              DELIVERY ADDRESS
            </Text>
          </View>
          <Text style={[styles.addressText, { color: colors.foreground }]}>
            {addr?.address_line1}
          </Text>
          <Text
            style={[styles.addressText, { color: colors.mutedForeground }]}
          >
            {[addr?.city, addr?.state, addr?.country]
              .filter(Boolean)
              .join(", ")}
          </Text>
          <Text
            style={[styles.addressText, { color: colors.mutedForeground }]}
          >
            PIN: {addr?.pincode}
          </Text>
          {addr?.mobile && (
            <Text
              style={[
                styles.addressText,
                { color: colors.mutedForeground },
              ]}
            >
              📞 {addr?.mobile}
            </Text>
          )}
        </View>

        {/* Contact */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              CONTACT
            </Text>
          </View>
          <Text style={[styles.contactText, { color: colors.foreground }]}>
            {order?.userId?.name}
          </Text>
          <Text
            style={[styles.contactText, { color: colors.mutedForeground }]}
          >
            📧 {order?.userId?.email}
          </Text>
        </View>

        {/* Payment */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              PAYMENT
            </Text>
          </View>
          {isCOD ? (
            <View
              style={[styles.paymentBadge, { backgroundColor: "#fef3c7" }]}
            >
              <Text style={[styles.paymentBadgeText, { color: "#92400e" }]}>
                💵 Cash on Delivery
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.paymentBadge,
                  { backgroundColor: "#d1fae5" },
                ]}
              >
                <Text
                  style={[styles.paymentBadgeText, { color: "#065f46" }]}
                >
                  ✓ Paid Online
                </Text>
              </View>
              <Text
                style={[
                  styles.paymentId,
                  { color: colors.mutedForeground },
                ]}
              >
                ID: {order.paymentId}
              </Text>
            </>
          )}
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag" size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              PRODUCTS ({order?.products?.length})
            </Text>
          </View>
          {order?.products?.map((product: OrderProduct, idx: number) => (
            <React.Fragment key={idx}>
              <Pressable onPress={() => { if (product?.productId || product?._id) { router.push(`/product/${product?.productId || product?._id}` as never); } }} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}><View style={styles.productItem}>
                {product?.image ? (
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.productImage,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Ionicons
                      name={"cube-outline" as any}
                      size={24}
                      color={colors.mutedForeground}
                    />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productName, { color: colors.foreground }]}
                  >
                    {product?.productTitle}
                  </Text>
                  <View style={styles.productMeta}>
                    {product?.size && (
                      <Text
                        style={[
                          styles.productMetaItem,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        📐 {product.size}
                      </Text>
                    )}
                    {product?.color && (
                      <Text
                        style={[
                          styles.productMetaItem,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        🎨 {product.color}
                      </Text>
                    )}
                    {product?.weight && (
                      <Text
                        style={[
                          styles.productMetaItem,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        ⚖️ {product.weight}
                      </Text>
                    )}
                    {product?.selectedOptions && Object.keys(product.selectedOptions).length > 0 && (
                      Object.entries(product.selectedOptions).map(([key, value]) => (
                        <Text
                          key={key}
                          style={[
                            styles.productMetaItem,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {key}: {value}
                        </Text>
                      ))
                    )}
                    <Text
                      style={[
                        styles.productMetaItem,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Qty: {product?.quantity}
                    </Text>
                  </View>
                </View>
                <View style={styles.productPrice}>
                  <Text
                    style={[
                      styles.pricePerUnit,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {formatPrice(product?.price)}
                  </Text>
                  <Text
                    style={[styles.priceTotal, { color: colors.foreground }]}
                  >
                    {formatPrice(product?.price * product?.quantity)}
                  </Text>
                </View>
              </View></Pressable>
              {/* Write Review Button - only show for delivered orders */}
              {isDelivered && (
                <Pressable
                  onPress={() =>
                    router.push(
                      `/reviews?productId=${product?.productId || product?._id || ""}&productName=${encodeURIComponent(product?.productTitle || "")}` as never
                    )
                  }
                  style={[
                    styles.writeReviewButton,
                    { borderColor: colors.primary },
                  ]}
                >
                  <Ionicons name="star-outline" size={13} color={colors.primary} />
                  <Text
                    style={[
                      styles.writeReviewText,
                      { color: colors.primary },
                    ]}
                  >
                    Write Review
                  </Text>
                </Pressable>
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Price Summary */}
        <View
          style={[
            styles.priceSummary,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <View style={styles.priceRow}>
            <Text
              style={[styles.priceLabel, { color: colors.mutedForeground }]}
            >
              Subtotal
            </Text>
            <Text style={[styles.priceValue, { color: colors.foreground }]}>
              {formatPrice(
                order?.products?.reduce(
                  (sum: number, p: OrderProduct) => sum + p.price * p.quantity,
                  0,
                ) || 0,
              )}
            </Text>
          </View>
          {(order?.discount_amount || 0) > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.primary }]}>
                Discount
              </Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                -{formatPrice(order.discount_amount || 0)}
              </Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text
              style={[styles.priceLabel, { color: colors.mutedForeground }]}
            >
              Shipping Fee
            </Text>
            <Text style={[styles.priceValue, { color: displayShippingFee === 0 ? colors.success : colors.foreground }]}>
              {displayShippingFee === 0 ? "FREE" : formatPrice(displayShippingFee)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text
              style={[styles.priceLabel, { color: colors.mutedForeground }]}
            >
              Delivery Fee
            </Text>
            <Text style={[styles.priceValue, { color: displayDeliveryFee === 0 ? colors.success : colors.foreground }]}>
              {displayDeliveryFee === 0 ? "FREE" : formatPrice(displayDeliveryFee)}
            </Text>
          </View>
          <View
            style={[
              styles.priceDivider,
              { backgroundColor: colors.border },
            ]}
          />
          <View style={styles.priceRow}>
            <Text
              style={[styles.priceLabelBold, { color: colors.foreground }]}
            >
              Total
            </Text>
            <Text
              style={[styles.priceValueBold, { color: colors.foreground }]}
            >
              {formatPrice(order?.totalAmt)}
            </Text>
          </View>
        </View>

        {/* Return & Refund Button - Hide if already requested */}
        {isDelivered && !hasReturnRequested && !hasRefundRequested && (
          <Pressable
            onPress={handleReturnPress}
            style={[
              styles.returnButton,
              {
                backgroundColor: colors.foreground,
              },
            ]}
          >
            <Ionicons name="arrow-undo" size={16} color="#fff" />
            <Text style={styles.returnButtonText}>
              Request Return & Refund
            </Text>
          </Pressable>
        )}

        {/* Refund Requested Badge - Show when requested */}
        {(hasReturnRequested || hasRefundRequested) && (
          <View style={[styles.refundRequestedBadge, { backgroundColor: "#ccfbf1" }]}>
            <Ionicons name="checkmark-circle" size={16} color="#0f766e" />
            <Text style={[styles.refundRequestedText, { color: "#0f766e" }]}>
              {hasReturnRequested && hasRefundRequested
                ? "Return & Refund Requested"
                : hasReturnRequested
                  ? "Return Requested"
                  : "Refund Requested"}
            </Text>
            <Text style={[styles.refundRequestedSubtext, { color: "#0f766e" }]}>
              Seller is reviewing your request
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isSubmitting && setFeedbackModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: colors.card, borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {modalType === "return" ? "Return Reason" : "Refund Reason"}
            </Text>
            <Pressable
              onPress={() => !isSubmitting && setFeedbackModalVisible(false)}
              disabled={isSubmitting}
            >
              <Ionicons
                name="close"
                size={24}
                color={colors.foreground}
                style={{ opacity: isSubmitting ? 0.5 : 1 }}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Please select the reason for {modalType === "return" ? "return" : "refund"}:
            </Text>

            <View style={styles.reasonsList}>
              {REFUND_REASONS.map((reason) => (
                <Pressable
                  key={reason.id}
                  onPress={() => !isSubmitting && setSelectedReason(reason.id)}
                  disabled={isSubmitting}
                  style={[
                    styles.reasonItem,
                    {
                      backgroundColor: selectedReason === reason.id ? colors.primary + "20" : colors.card,
                      borderColor: selectedReason === reason.id ? colors.primary : colors.border,
                      borderWidth: selectedReason === reason.id ? 2 : 1,
                      opacity: isSubmitting ? 0.6 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.reasonIcon,
                      {
                        backgroundColor: selectedReason === reason.id ? colors.primary : colors.surfaceAlt,
                      },
                    ]}
                  >
                    <Ionicons
                      name={reason.icon as any}
                      size={20}
                      color={selectedReason === reason.id ? "#fff" : colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.reasonText}>
                    <Text
                      style={[
                        styles.reasonLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </View>
                  {selectedReason === reason.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View
            style={[
              styles.modalFooter,
              { borderTopColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Pressable
              onPress={() => !isSubmitting && setFeedbackModalVisible(false)}
              disabled={isSubmitting}
              style={[
                styles.cancelButton,
                {
                  borderColor: colors.border,
                  opacity: isSubmitting ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmitFeedback}
              disabled={!selectedReason || isSubmitting}
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.foreground,
                  opacity: !selectedReason || isSubmitting ? 0.5 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit to Seller</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 24,
    textAlign: "center",
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
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
  statusCard: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statusIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  timeline: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timelineTitle: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  timelineSteps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timelineStep: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepLine: {
    height: 2,
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: -12,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(0,0,0,0.5)",
    marginTop: 2,
  },
  section: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  contactText: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  paymentBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  paymentId: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
  productItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  productMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  productMetaItem: {
    fontSize: 10,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  productPrice: {
    alignItems: "flex-end",
    gap: 2,
  },
  pricePerUnit: {
    fontSize: 10,
    fontWeight: "500",
  },
  priceTotal: {
    fontSize: 13,
    fontWeight: "800",
  },
  priceSummary: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  priceLabelBold: {
    fontSize: 13,
    fontWeight: "700",
  },
  priceValueBold: {
    fontSize: 14,
    fontWeight: "800",
  },
  priceDivider: {
    height: 1,
    marginVertical: 4,
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  writeReviewText: {
    fontSize: 11,
    fontWeight: "600",
  },
  returnButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  returnButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  refundRequestedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  refundRequestedText: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  refundRequestedSubtext: {
    fontSize: 11,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  reasonsList: {
    gap: 10,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  reasonText: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
