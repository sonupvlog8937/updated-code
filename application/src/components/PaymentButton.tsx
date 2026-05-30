import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useRazorpay, RazorpayOptions } from "@/src/hooks/useRazorpay";

interface PaymentButtonProps {
  amount: number; // in rupees (will be converted to paise)
  orderId: string;
  customerInfo?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  description?: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  buttonText?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  orderId,
  customerInfo,
  description,
  onSuccess,
  onError,
  disabled = false,
  buttonText,
}) => {
  const colors = useColors();
  const { initiatePayment, isProcessing } = useRazorpay();

  const handlePayment = async () => {
    if (disabled || isProcessing) return;

    try {
      const options: RazorpayOptions = {
        orderId,
        amount: Math.round(amount * 100), // Convert rupees to paise
        currency: "INR",
        description: description || `Payment of ₹${amount}`,
        prefill: {
          name: customerInfo?.name,
          email: customerInfo?.email,
          contact: customerInfo?.contact,
        },
        theme: {
          color: "#ff6b00",
        },
      };

      const response = await initiatePayment(options);
      await onSuccess(response);
    } catch (error) {
      console.error("Payment error:", error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  return (
    <Pressable
      onPress={handlePayment}
      disabled={disabled || isProcessing}
      style={[
        styles.button,
        {
          backgroundColor:
            disabled || isProcessing ? colors.mutedForeground : colors.primary,
        },
      ]}
    >
      {isProcessing ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.buttonText}>
          {buttonText || `Pay ₹${amount.toLocaleString("en-IN")}`}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
