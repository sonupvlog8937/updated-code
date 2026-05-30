import { useCallback, useState } from "react";

import {
  getRazorpayUserMessage,
  openRazorpayCheckout,
  startRazorpayPayment,
} from "@/src/services/razorpayPaymentService";
import {
  RazorpayCheckoutRequest,
  RazorpayPaymentError,
  RazorpaySuccessResponse,
  StartRazorpayPaymentRequest,
} from "@/src/types/razorpay";
import { showToast } from "@/src/utils/toast";

export type RazorpayOptions = RazorpayCheckoutRequest;
interface UseRazorpayReturn {
  initiatePayment: (
    options: RazorpayOptions,
  ) => Promise<RazorpaySuccessResponse>;
  createOrderAndPay: (
    options: StartRazorpayPaymentRequest,
  ) => Promise<RazorpaySuccessResponse>;
  isProcessing: boolean;
  error: RazorpayPaymentError | null;
}

export const useRazorpay = (): UseRazorpayReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<RazorpayPaymentError | null>(null);

  const runPayment = useCallback(
    async <T>(paymentTask: () => Promise<T>): Promise<T> => {
      setIsProcessing(true);
      setError(null);

      try {
        return await paymentTask();
      } catch (paymentError) {
        const normalizedError =
          paymentError instanceof RazorpayPaymentError
            ? paymentError
            : new RazorpayPaymentError(
                getRazorpayUserMessage(paymentError),
                "failed",
                paymentError,
              );

        setError(normalizedError);
        showToast("error", getRazorpayUserMessage(normalizedError));
        throw normalizedError;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const initiatePayment = useCallback(
    (options: RazorpayOptions) =>
      runPayment(() => openRazorpayCheckout(options)),
    [runPayment],
  );

  const createOrderAndPay = useCallback(
    (options: StartRazorpayPaymentRequest) =>
      runPayment(() => startRazorpayPayment(options)),
    [runPayment],
  );

  return {
    initiatePayment,
    createOrderAndPay,
    isProcessing,
    error,
  };
};

export type {
  RazorpayCheckoutRequest,
  RazorpayPaymentError,
  RazorpaySuccessResponse,
  StartRazorpayPaymentRequest
} from "@/src/types/razorpay";

