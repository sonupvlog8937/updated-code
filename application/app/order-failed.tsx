import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function OrderFailedScreen() {
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, []);

  const failureReasons = [
    'Payment could not be processed',
    'Insufficient funds in your account',
    'Card declined by bank',
    'Invalid payment details provided',
    'Payment gateway timeout',
  ];

  const whatToDoNext = [
    'Check your card/payment method details',
    'Ensure sufficient balance in your account',
    'Try with a different payment method',
    'Contact your bank if card was declined',
    'Retry after some time',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Failed Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.failedIcon, { backgroundColor: colors.error || '#ef4444' }]}>
            <Ionicons name="close" size={50} color="#fff" />
          </View>
        </View>

        {/* Main Message */}
        <Text style={[styles.mainTitle, { color: colors.foreground }]}>
          Order Failed
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          We couldn't process your payment
        </Text>

        {/* Error Details Card */}
        <View style={[styles.errorBox, { 
          backgroundColor: (colors.error || '#ef4444') + '15',
          borderColor: (colors.error || '#ef4444') + '30'
        }]}>
          <View style={styles.errorHeader}>
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={16} 
              color={colors.error || '#ef4444'} 
            />
            <Text style={[styles.errorTitle, { color: colors.error || '#ef4444' }]}>
              Payment Error
            </Text>
          </View>
          <Text style={[styles.errorMessage, { color: colors.foreground }]}>
            Your order could not be completed. Please review the possible reasons below and try again.
          </Text>
        </View>

        {/* Possible Reasons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="help-circle" 
              size={16} 
              color={colors.primary} 
            />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Possible Reasons
            </Text>
          </View>
          <View style={styles.reasonsList}>
            {failureReasons.map((reason, index) => (
              <View key={index} style={styles.reasonItem}>
                <View style={[
                  styles.reasonIcon,
                  { backgroundColor: (colors.error || '#ef4444') + '20' }
                ]}>
                  <Ionicons 
                    name="close-circle" 
                    size={14} 
                    color={colors.error || '#ef4444'} 
                  />
                </View>
                <Text style={[styles.reasonText, { color: colors.foreground }]}>
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* What to Do Next */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons 
              name="information-circle" 
              size={16} 
              color={colors.primary} 
            />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              What to Do Next
            </Text>
          </View>
          <View style={styles.actionsList}>
            {whatToDoNext.map((action, index) => (
              <View key={index} style={styles.actionItem}>
                <View style={[
                  styles.actionNumber,
                  { backgroundColor: colors.primary }
                ]}>
                  <Text style={styles.actionNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.actionText, { color: colors.foreground }]}>
                  {action}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Alternative Payment Methods */}
        <View style={[styles.alternativeBox, { 
          backgroundColor: colors.card,
          borderColor: colors.border
        }]}>
          <View style={styles.alternativeHeader}>
            <MaterialCommunityIcons 
              name="credit-card-multiple" 
              size={16} 
              color={colors.primary} 
            />
            <Text style={[styles.alternativeTitle, { color: colors.foreground }]}>
              Try Another Payment Method
            </Text>
          </View>
          <Text style={[styles.alternativeText, { color: colors.mutedForeground }]}>
            You can retry with:
          </Text>
          <View style={styles.paymentMethodsList}>
            <View style={styles.paymentMethod}>
              <Ionicons name="card" size={16} color={colors.primary} />
              <Text style={[styles.paymentMethodText, { color: colors.foreground }]}>
                Different Credit/Debit Card
              </Text>
            </View>
            <View style={styles.paymentMethod}>
              <MaterialCommunityIcons name="wallet" size={16} color={colors.primary} />
              <Text style={[styles.paymentMethodText, { color: colors.foreground }]}>
                UPI Payment
              </Text>
            </View>
            <View style={styles.paymentMethod}>
              <Ionicons name="cash" size={16} color={colors.primary} />
              <Text style={[styles.paymentMethodText, { color: colors.foreground }]}>
                Cash on Delivery (if available)
              </Text>
            </View>
          </View>
        </View>

        {/* Support Contact */}
        <View style={[styles.supportBox, { 
          backgroundColor: (colors.primary) + '10',
          borderColor: (colors.primary) + '20'
        }]}>
          <Ionicons 
            name="help" 
            size={16} 
            color={colors.primary} 
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.supportTitle, { color: colors.foreground }]}>
              Still having trouble?
            </Text>
            <Text style={[styles.supportText, { color: colors.mutedForeground }]}>
              Contact our support team for immediate assistance
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={() => router.push('/checkout' as never)}
            style={[styles.primaryButton, { backgroundColor: colors.foreground }]}
          >
            <MaterialCommunityIcons name="reload" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Retry Payment</Text>
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
              Back to Home
            </Text>
          </Pressable>
        </View>

        {/* Help Link */}
        <Pressable style={styles.helpLink}>
          <Text style={[styles.helpLinkText, { color: colors.primary }]}>
            📞 Contact Support
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  failedIcon: {
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
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Sora_800ExtraBold',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '500',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  errorMessage: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  reasonsList: {
    gap: 10,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  reasonIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    paddingTop: 2,
  },
  alternativeBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  alternativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alternativeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  alternativeText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  paymentMethodsList: {
    gap: 10,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  supportText: {
    fontSize: 12,
    fontWeight: '500',
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
    fontWeight: '700',
    fontFamily: 'DM_Sans_700Bold',
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
    fontWeight: '700',
    fontFamily: 'DM_Sans_700Bold',
  },
  helpLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  helpLinkText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
