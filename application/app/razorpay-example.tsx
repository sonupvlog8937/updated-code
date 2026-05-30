import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useRazorpay } from "@/src/hooks/useRazorpay";
import { RazorpayPaymentError } from "@/src/types/razorpay";
import { showToast } from "@/src/utils/toast";

export default function RazorpayExampleScreen() {
  const router = useRouter();
  const colors = useColors();
  const { createOrderAndPay, isProcessing } = useRazorpay();
  const [amount, setAmount] = useState("499");
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);

  const handlePayPress = async () => {
    const rupeeAmount = Number(amount);

    if (!Number.isFinite(rupeeAmount) || rupeeAmount <= 0) {
      showToast("error", "Enter a valid amount.");
      return;
    }

    try {
      const response = await createOrderAndPay({
        amount: rupeeAmount,
        currency: "INR",
        description: "Example in-app Razorpay payment",
        productNames: "Example payment",
        customerName: "Demo Customer",
        customerEmail: "demo@example.com",
        customerContact: "9999999999",
        themeColor: "#ff6b00",
      });

      setLastPaymentId(response.razorpay_payment_id);
      showToast("success", "Payment completed successfully.");
    } catch (error) {
      if (
        error instanceof RazorpayPaymentError &&
        error.reason === "cancelled"
      ) {
        showToast("info", "Payment cancelled.");
        return;
      }

      showToast("error", "Payment failed. Please try again.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Native Razorpay Checkout
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          This screen creates an order using the existing backend endpoint,
          opens the native Razorpay SDK checkout, and returns the payment
          response to the app.
        </Text>

        <Text style={[styles.label, { color: colors.foreground }]}>
          Amount (₹)
        </Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          editable={!isProcessing}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.foreground,
              backgroundColor: colors.background,
            },
          ]}
        />

        <Pressable
          disabled={isProcessing}
          onPress={handlePayPress}
          style={[
            styles.button,
            {
              backgroundColor: isProcessing
                ? colors.mutedForeground
                : colors.primary,
            },
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Pay with Razorpay</Text>
          )}
        </Pressable>

        {lastPaymentId ? (
          <Text style={[styles.paymentId, { color: colors.success }]}>
            Last payment ID: {lastPaymentId}
          </Text>
        ) : null}

        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={[styles.secondaryText, { color: colors.primary }]}>
            Go back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  paymentId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});