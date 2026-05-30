import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '@/src/store';
import { fetchOrders } from '@/src/store/ordersSlice';
import { useColors } from '@/hooks/useColors';

export default function OrderSuccessScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartData = useAppSelector((s) => s.app.cartData);
  const userData = useAppSelector((s) => s.app.userData);
  const allOrders = useAppSelector((s) => s.orders.orders);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    // Fetch orders on mount
    dispatch(fetchOrders({ page: 1, limit: 20 }) as any);
    
    // Simulate order processing
    setTimeout(() => setLoading(false), 800);
  }, [dispatch]);

  // Get the first order (most recent)
  const lastOrder = allOrders && allOrders.length > 0 ? allOrders[0] : null;
  
  // Mock order data (in real app, this comes from API or navigation state)
  const orderData = {
    orderId: lastOrder?._id || ('ORD' + Date.now().toString().slice(-8)),
    itemCount: lastOrder?.products?.length || cartData?.length || 1,
    totalAmount: lastOrder?.totalAmt || 5000,
    estimatedDays: 3,
    email: userData?.email || 'customer@example.com',
  };

  const estimatedDate = new Date(Date.now() + orderData.estimatedDays * 24 * 60 * 60 * 1000);
  const formattedDate = estimatedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            Processing your order...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Success Icon Animation */}
        <View style={styles.iconContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark" size={50} color="#fff" />
          </View>
        </View>

        {/* Main Message */}
        <Text style={[styles.mainTitle, { color: colors.foreground }]}>
          Order Confirmed!
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your order has been placed successfully
        </Text>

        {/* Order ID Card */}
        <View style={[styles.highlightBox, { 
          backgroundColor: colors.success + '15',
          borderColor: colors.success + '30'
        }]}>
          <View style={styles.highlightLabel}>
            <MaterialCommunityIcons name="package-variant-closed" size={14} color={colors.success} />
            <Text style={[styles.highlightLabelText, { color: colors.success }]}>
              Order ID
            </Text>
          </View>
          <Text style={[styles.highlightValue, { color: colors.foreground }]}>
            {orderData.orderId.slice(-10).toUpperCase()}
          </Text>
        </View>

        {/* Info Cards Grid */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoCardIconContainer}>
              <Ionicons name="cart" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>
              Items
            </Text>
            <Text style={[styles.infoCardValue, { color: colors.foreground }]}>
              {orderData.itemCount}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoCardIconContainer}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>
              Delivery
            </Text>
            <Text style={[styles.infoCardValue, { color: colors.foreground }]}>
              {formattedDate}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoCardIconContainer}>
              <MaterialCommunityIcons name="currency-inr" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>
              Total
            </Text>
            <Text style={[styles.infoCardValue, { color: colors.success }]}>
              ₹{orderData.totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoCardIconContainer}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>
              Estimated
            </Text>
            <Text style={[styles.infoCardValue, { color: colors.foreground }]}>
              {orderData.estimatedDays} days
            </Text>
          </View>
        </View>

        {/* What's Next Section */}
        <View style={[styles.whatNextBox, { 
          backgroundColor: colors.primary + '15',
          borderColor: colors.primary + '30'
        }]}>
          <View style={styles.whatNextTitle}>
            <MaterialCommunityIcons name="information" size={16} color={colors.primary} />
            <Text style={[styles.whatNextTitleText, { color: colors.primary }]}>
              What's Next?
            </Text>
          </View>
          <View style={styles.whatNextList}>
            <View style={styles.whatNextItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.whatNextItemText, { color: colors.foreground }]}>
                Confirmation email sent to {orderData.email}
              </Text>
            </View>
            <View style={styles.whatNextItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.whatNextItemText, { color: colors.foreground }]}>
                Your order is being prepared for shipment
              </Text>
            </View>
            <View style={styles.whatNextItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.whatNextItemText, { color: colors.foreground }]}>
                Track your order in "My Orders" section
              </Text>
            </View>
            <View style={styles.whatNextItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.whatNextItemText, { color: colors.foreground }]}>
                You'll receive tracking updates via email
              </Text>
            </View>
          </View>
        </View>

        {/* Email Notification */}
        <View style={[styles.emailNotification, { 
          backgroundColor: colors.primary + '10',
          borderColor: colors.primary + '20'
        }]}>
          <Ionicons name="mail" size={16} color={colors.primary} />
          <Text style={[styles.emailNotificationText, { color: colors.foreground }]}>
            Check your email for order confirmation and invoice
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={() => {
              if (lastOrder?._id) {
                router.push(`/order-details?orderId=${lastOrder._id}` as never);
              } else {
                router.push('/(tabs)/my-orders' as never);
              }
            }}
            style={[styles.primaryButton, { backgroundColor: colors.foreground }]}
          >
            <Ionicons name="receipt-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>View My Orders</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/' as never)}
            style={[styles.secondaryButton, { 
              borderColor: colors.border,
              backgroundColor: colors.card
            }]}
          >
            <Ionicons name="home" size={18} color={colors.foreground} />
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
              Continue Shopping
            </Text>
          </Pressable>
        </View>

        {/* Support Link */}
        <Pressable style={styles.supportLink}>
          <Text style={[styles.supportLinkText, { color: colors.primary }]}>
            Need help? Contact Support
          </Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    gap: 20,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '500',
  },
  highlightBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  highlightLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  highlightLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  infoCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  infoCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  whatNextBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  whatNextTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  whatNextTitleText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  whatNextList: {
    gap: 10,
  },
  whatNextItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  whatNextItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  emailNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  emailNotificationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  supportLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  supportLinkText: {
    fontSize: 12,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
