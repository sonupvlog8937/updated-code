import Constants from "expo-constants";
import { Platform } from "react-native";

import { postData } from "@/src/utils/api";
import {
  CreateRazorpayOrderRequest,
  CreateRazorpayOrderResponse,
  RazorpayCheckoutRequest,
  RazorpayFailureReason,
  RazorpayNativeErrorResponse,
  RazorpayOrder,
  RazorpayPaymentError,
  RazorpaySuccessResponse,
  StartRazorpayPaymentRequest,
} from "@/src/types/razorpay";

type RazorpayNativeModule = {
  open: (options: Record<string, unknown>) => Promise<{
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }>;
};

const CREATE_ORDER_ENDPOINT = "/api/payment/razorpay/create";
const DEFAULT_APP_NAME = "Zeedaddy Store";
const DEFAULT_THEME_COLOR = "#ff6b00";

const getRazorpayKeyId = () => process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";

export const isExpoGo = () => Constants.appOwnership === "expo";

export const assertRazorpayEnvironment = () => {
  if (Platform.OS === "web") {
    throw new RazorpayPaymentError(
      "Razorpay native checkout is not available on web. Please run this flow on Android or iOS.",
      "unsupported_environment",
    );
  }

  if (isExpoGo()) {
    throw new RazorpayPaymentError(
      "Razorpay native checkout is not available in Expo Go. Create and install a custom development client with EAS Build.",
      "unsupported_environment",
    );
  }

  if (!getRazorpayKeyId()) {
    throw new RazorpayPaymentError(
      "Razorpay key is not configured. Set EXPO_PUBLIC_RAZORPAY_KEY_ID for your EAS build profile.",
      "configuration_error",
    );
  }
};

const getRazorpayCheckout = (): RazorpayNativeModule => {
  assertRazorpayEnvironment();
  // Native modules must be loaded only after the Expo Go/custom-client check.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("react-native-razorpay").default as RazorpayNativeModule;
};

const normalizeOrder = (
  response: CreateRazorpayOrderResponse,
  fallbackAmountInPaise: number,
): RazorpayOrder => {
  const dataOrder =
    response?.order ||
    (response?.data as { order?: Partial<RazorpayOrder> } | undefined)?.order ||
    (response?.data as Partial<RazorpayOrder> | undefined) ||
    {};

  const id =
    dataOrder?.id ||
    response?.orderId ||
    response?.razorpayOrderId ||
    response?.id;

  if (!id) {
    throw new RazorpayPaymentError(
      "No Razorpay order ID was returned by the backend.",
      "failed",
      response,
    );
  }

  return {
    id,
    amount: Number(
      dataOrder?.amount || response?.amount || fallbackAmountInPaise,
    ),
    currency: dataOrder?.currency || response?.currency || "INR",
    receipt: dataOrder?.receipt,
    status: dataOrder?.status,
    notes: dataOrder?.notes,
  };
};

export const createRazorpayOrder = async (
  payload: CreateRazorpayOrderRequest,
): Promise<RazorpayOrder> => {
  const amountInPaise = Math.round(payload.amount * 100);
  const response = (await postData(CREATE_ORDER_ENDPOINT, {
    ...payload,
    currency: payload.currency || "INR",
  })) as CreateRazorpayOrderResponse;

  if (response?.error === true || response?.success === false) {
    throw new RazorpayPaymentError(
      response?.message || "Failed to create Razorpay order.",
      "failed",
      response,
    );
  }

  return normalizeOrder(response, amountInPaise);
};

const getFailureReason = (
  error: RazorpayNativeErrorResponse,
): RazorpayFailureReason => {
  const code = String(error?.code ?? "");
  const description = (
    error?.description ||
    error?.message ||
    ""
  ).toLowerCase();

  if (code === "0" || description.includes("cancel")) return "cancelled";
  if (code === "2" || description.includes("network")) return "network_error";
  return "failed";
};

const toPaymentError = (error: unknown): RazorpayPaymentError => {
  if (error instanceof RazorpayPaymentError) return error;

  const nativeError = error as RazorpayNativeErrorResponse;
  const reason = getFailureReason(nativeError);
  const message =
    nativeError?.description ||
    nativeError?.message ||
    (reason === "cancelled"
      ? "Payment cancelled by user."
      : "Payment could not be completed. Please try again.");

  return new RazorpayPaymentError(message, reason, error);
};

export const openRazorpayCheckout = async (
  request: RazorpayCheckoutRequest,
): Promise<RazorpaySuccessResponse> => {
  const RazorpayCheckout = getRazorpayCheckout();
  const key = getRazorpayKeyId();

  try {
    const response = await RazorpayCheckout.open({
      key,
      amount: request.amount,
      currency: request.currency || "INR",
      name: request.name || DEFAULT_APP_NAME,
      description: request.description || "Order Payment",
      image: request.image,
      order_id: request.orderId,
      prefill: {
        name: request.prefill?.name || "",
        email: request.prefill?.email || "",
        contact: request.prefill?.contact || "",
      },
      notes: request.notes,
      theme: {
        color: request.theme?.color || DEFAULT_THEME_COLOR,
      },
      retry: request.retry || { enabled: true, max_count: 1 },
    });

    if (!response?.razorpay_payment_id) {
      throw new RazorpayPaymentError(
        "Razorpay did not return a payment ID.",
        "failed",
        response,
      );
    }

    return {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id || request.orderId,
      razorpay_signature: response.razorpay_signature || "",
    };
  } catch (error) {
    throw toPaymentError(error);
  }
};

export const startRazorpayPayment = async (
  request: StartRazorpayPaymentRequest,
): Promise<RazorpaySuccessResponse> => {
  assertRazorpayEnvironment();

  const order = await createRazorpayOrder(request);

  return openRazorpayCheckout({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    name: request.appName || DEFAULT_APP_NAME,
    description: request.description,
    image: request.checkoutImage,
    prefill: request.prefill || {
      name: request.customerName,
      email: request.customerEmail,
      contact: request.customerContact,
    },
    notes: request.notes || order.notes,
    theme: { color: request.themeColor || DEFAULT_THEME_COLOR },
  });
};

export const getRazorpayUserMessage = (error: unknown) => {
  const paymentError = toPaymentError(error);

  if (paymentError.reason === "cancelled") return "Payment cancelled.";
  if (paymentError.reason === "network_error") {
    return "Network error while processing payment. Please check your connection and try again.";
  }

  return paymentError.message;
};