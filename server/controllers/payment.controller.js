const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";
const MIN_RAZORPAY_AMOUNT = 100;

const getRazorpayCredentials = () => ({
    keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_APP_RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || process.env.VITE_APP_RAZORPAY_KEY_SECRET || "",
});

const toAmountInPaise = (amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return null;
    }

    return Math.round(numericAmount * 100);
};

const buildReceipt = (userId) => {
    const suffix = Date.now().toString(36);
    const userPart = userId ? String(userId).slice(-12) : "guest";
    return `rcpt_${userPart}_${suffix}`.slice(0, 40);
};

export const createRazorpayOrderController = async (request, response) => {
    try {
        const { keyId, keySecret } = getRazorpayCredentials();

        if (!keyId || !keySecret) {
            return response.status(500).json({
                success: false,
                error: true,
                message: "Razorpay credentials are not configured on the server.",
            });
        }

        const amount = toAmountInPaise(request.body.amount);

        if (!amount || amount < MIN_RAZORPAY_AMOUNT) {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Invalid Razorpay amount.",
            });
        }

        const currency = request.body.currency || "INR";
        const receipt = request.body.receipt || buildReceipt(request.body.userId || request.userId);
        const notes = {
            userId: String(request.body.userId || request.userId || ""),
            customerName: String(request.body.customerName || ""),
            customerEmail: String(request.body.customerEmail || ""),
            customerContact: String(request.body.customerContact || ""),
            productNames: String(request.body.productNames || "").slice(0, 250),
            ...(request.body.notes || {}),
        };

        const razorpayResponse = await fetch(RAZORPAY_ORDERS_URL, {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount,
                currency,
                receipt,
                notes,
            }),
        });

        const razorpayOrder = await razorpayResponse.json();

        if (!razorpayResponse.ok) {
            return response.status(razorpayResponse.status).json({
                success: false,
                error: true,
                message: razorpayOrder?.error?.description || "Failed to create Razorpay order.",
                data: razorpayOrder,
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Razorpay order created",
            keyId,
            orderId: razorpayOrder.id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            order: razorpayOrder,
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            error: true,
            message: error.message || "Failed to create Razorpay order.",
        });
    }
};