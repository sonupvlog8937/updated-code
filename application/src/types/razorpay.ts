export type RazorpayCurrency = "INR" | string;

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface CreateRazorpayOrderRequest {
  amount: number;
  currency?: RazorpayCurrency;
  description?: string;
  productNames?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  keyId?: string;
  currency: RazorpayCurrency;
  receipt?: string;
  status?: string;
  notes?: Record<string, string>;
}

export interface CreateRazorpayOrderResponse {
  success?: boolean;
  error?: boolean;
  message?: string;
  order?: Partial<RazorpayOrder>;
  data?: Partial<RazorpayOrder> | { order?: Partial<RazorpayOrder> };
  keyId?: string;
  orderId?: string;
  razorpayOrderId?: string;
  id?: string;
  amount?: number;
  currency?: RazorpayCurrency;
}

export interface RazorpayCheckoutRequest {
  orderId: string;
  amount: number;
  keyId?: string;
  currency?: RazorpayCurrency;
  name?: string;
  description?: string;
  image?: string;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  retry?: {
    enabled: boolean;
    max_count?: number;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayNativeErrorResponse {
  code?: string | number;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
  message?: string;
}

export type RazorpayFailureReason =
  | "cancelled"
  | "failed"
  | "network_error"
  | "configuration_error"
  | "unsupported_environment";

export class RazorpayPaymentError extends Error {
  reason: RazorpayFailureReason;
  raw?: RazorpayNativeErrorResponse | unknown;

  constructor(
    message: string,
    reason: RazorpayFailureReason = "failed",
    raw?: RazorpayNativeErrorResponse | unknown,
  ) {
    super(message);
    this.name = "RazorpayPaymentError";
    this.reason = reason;
    this.raw = raw;
  }
}

export interface StartRazorpayPaymentRequest extends CreateRazorpayOrderRequest {
  appName?: string;
  checkoutImage?: string;
  prefill?: RazorpayPrefill;
  themeColor?: string;
}