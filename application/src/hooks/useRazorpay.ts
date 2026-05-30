import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { showToast } from "@/src/utils/toast";

// Import RazorpayCheckout only on native platforms
let RazorpayCheckout: any = null;

if (Platform.OS === "android" || Platform.OS === "ios") {
  try {
    RazorpayCheckout = require("react-native-razorpay").default;
  } catch (e) {
    console.warn("Razorpay not available in this build:", e);
  }
}

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";

export interface RazorpayOptions {
  orderId: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

interface UseRazorpayReturn {
  initiatePayment: (options: RazorpayOptions) => Promise<RazorpaySuccessResponse>;
  isProcessing: boolean;
  error: string | null;
}

export const useRazorpay = (): UseRazorpayReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(
    async (options: RazorpayOptions): Promise<RazorpaySuccessResponse> => {
      setIsProcessing(true);
      setError(null);

      // Check if Razorpay is available
      if (!RazorpayCheckout) {
        const errorMsg = 
          "Razorpay is not available in Expo Go. Please use a dev client build: eas build --platform android --profile development";
        setError(errorMsg);
        setIsProcessing(false);
        showToast("error", errorMsg);
        throw new Error(errorMsg);
      }

      if (!RAZORPAY_KEY_ID) {
        const errorMsg = "Razorpay key not configured. Check EXPO_PUBLIC_RAZORPAY_KEY_ID in .env";
        setError(errorMsg);
        setIsProcessing(false);
        showToast("error", errorMsg);
        throw new Error(errorMsg);
      }

      try {
        const razorpayOptions = {
          description: options.description || "Order Payment",
          image: options.image || "https://i.imgur.com/3g7nmJC.png",
          currency: options.currency || "INR",
          key: RAZORPAY_KEY_ID,
          amount: options.amount,
          name: options.name || "Zeedaddy Store",
          order_id: options.orderId,
          prefill: {
            email: options.prefill?.email || "",
            contact: options.prefill?.contact || "",
            name: options.prefill?.name || "",
          },
          theme: {
            color: options.theme?.color || "#ff6b00",
          },
          ...(options.notes && { notes: options.notes }),
        };

        console.log("Opening Razorpay with options:", {
          ...razorpayOptions,
          key: "***" + RAZORPAY_KEY_ID.slice(-4),
        });

        const data = await RazorpayCheckout.open(razorpayOptions);

        console.log("✅ Payment successful:", data);
        setIsProcessing(false);

        return {
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id || options.orderId,
          razorpay_signature: data.razorpay_signature || "",
        };
      } catch (err: any) {
        console.error("❌ Razorpay payment error:", err);

        let errorMessage = "Payment failed";

        // Handle different error scenarios
        if (err.code === "0") {
          // User cancelled payment
          errorMessage = "Payment cancelled by user";
        } else if (err.code === "1") {
          // Payment failed
          errorMessage = err.description || "Payment failed";
        } else if (err.code === "2") {
          // Network error
          errorMessage = "Network error. Please check your connection";
        } else if (err.description) {
          errorMessage = err.description;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setIsProcessing(false);
        showToast("error", errorMessage);

        throw new Error(errorMessage);
      }
    },
    []
  );

  return {
    initiatePayment,
    isProcessing,
    error,
  };
};
