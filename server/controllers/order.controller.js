import OrderModel from "../models/order.model.js";
import ProductModel from '../models/product.modal.js';
import UserModel from '../models/user.model.js';
import SellerModel from '../models/Seller.model.js';
import paypal from "@paypal/checkout-server-sdk";
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import sendEmailFun from "../config/sendEmail.js";


// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const updateProductsInventory = async (products = []) => {
    if (!Array.isArray(products) || products.length === 0) return;
    const operations = products
        .filter((item) => item?.productId && Number(item?.quantity) > 0)
        .map((item) => ({
            updateOne: {
                filter: { _id: item.productId },
                update: { $inc: { countInStock: -Number(item.quantity), sale: Number(item.quantity) } }
            }
        }));
    if (operations.length > 0) await ProductModel.bulkWrite(operations);
};

const queueOrderConfirmationEmail = async (userId, order) => {
    try {
        const user = await UserModel.findById(userId).select("name email").lean();
        if (!user?.email) return;
        const storeName = process.env.STORE_NAME || 'Zeedaddy';
        const sent = await sendEmailFun({
            sendTo: user.email,
            subject: `✅ Order Confirmed – #${order?._id?.toString().slice(-8).toUpperCase()} | ${storeName}`,
            text: `Hi ${user.name}, your order has been placed! Order ID: ${order?._id}. Total: ₹${order?.totalAmt}`,
            html: OrderConfirmationEmail(user.name, order)
        });
        if (!sent) console.error("❌ Order confirmation email failed", { userId, orderId: order?._id });
        else console.log(`📧 Order confirmation email sent to ${user.email}`);
    } catch (error) {
        console.error("Order confirmation email error:", error.message);
    }
};

// ✅ NEW: Send email notification to seller when their product is ordered
const notifySellerEmail = async (sellerId, order, sellerProducts) => {
    try {
        const seller = await SellerModel.findById(sellerId).populate('userId', 'name email').lean();
        if (!seller?.userId?.email) return;

        const sellerTotal = sellerProducts.reduce((sum, p) => sum + (p.subTotal || 0), 0);

        await sendEmailFun({
            sendTo: seller.userId.email,
            subject: `🛍️ New Order Received – #${order._id.toString().slice(-8).toUpperCase()} | ${seller.storeName}`,
            text: `Hi ${seller.storeName}, you have received a new order! Order ID: ${order._id}. Your items total: ₹${sellerTotal}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">🎉 New Order Received!</h2>
                    <p>Hi <strong>${seller.storeName}</strong>,</p>
                    <p>You have received a new order. Here are the details:</p>
                    <p><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
                    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
                        <thead>
                            <tr style="background:#f3f4f6;">
                                <th style="padding:8px; text-align:left; border:1px solid #e5e7eb;">Product</th>
                                <th style="padding:8px; text-align:center; border:1px solid #e5e7eb;">Qty</th>
                                <th style="padding:8px; text-align:right; border:1px solid #e5e7eb;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sellerProducts.map(p => `
                                <tr>
                                    <td style="padding:8px; border:1px solid #e5e7eb;">${p.productTitle}</td>
                                    <td style="padding:8px; text-align:center; border:1px solid #e5e7eb;">${p.quantity}</td>
                                    <td style="padding:8px; text-align:right; border:1px solid #e5e7eb;">₹${p.subTotal}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="font-size:18px;"><strong>Your Earning: ₹${sellerProducts.reduce((s, p) => s + (p.sellerEarning || 0), 0).toFixed(2)}</strong></p>
                    <p style="color:#6b7280;">Login to your seller dashboard to manage this order.</p>
                </div>
            `
        });
        console.log(`📧 Seller notification sent to ${seller.userId.email}`);
    } catch (error) {
        console.error("Seller notification email error:", error.message);
    }
};

// ✅ NEW: Enrich products with seller info + calculate earnings
const enrichProductsWithSellerData = async (products = []) => {
    const enriched = [];
    const involvedSellerIds = new Set();

    for (const item of products) {
        const product = await ProductModel.findById(item.productId).select('sellerId sellerName').lean();

        let sellerEarning = 0;
        let sellerId = null;
        let sellerName = "";

        if (product?.sellerId) {
            const seller = await SellerModel.findById(product.sellerId).select('commission storeName').lean();
            if (seller) {
                sellerId = product.sellerId;
                sellerName = seller.storeName;
                const commission = seller.commission || 10;
                // Seller gets (100 - commission)% of their product subtotal
                sellerEarning = parseFloat(((item.subTotal || 0) * (100 - commission) / 100).toFixed(2));
                involvedSellerIds.add(product.sellerId.toString());
            }
        }

        enriched.push({
            ...item,
            sellerId,
            sellerName,
            sellerEarning,
        });
    }

    return { enrichedProducts: enriched, involvedSellers: [...involvedSellerIds] };
};

// ✅ NEW: Update seller earnings after order placed
const updateSellerEarnings = async (enrichedProducts) => {
    // Group by seller
    const sellerMap = {};
    for (const item of enrichedProducts) {
        if (!item.sellerId) continue;
        const sid = item.sellerId.toString();
        if (!sellerMap[sid]) sellerMap[sid] = 0;
        sellerMap[sid] += item.sellerEarning;
    }

    // Bulk update seller earnings
    const updates = Object.entries(sellerMap).map(([sellerId, earning]) =>
        SellerModel.findByIdAndUpdate(sellerId, {
            $inc: {
                totalEarnings: earning,
                pendingPayout: earning,
                totalOrders: 1,
            }
        })
    );
    await Promise.all(updates);
};

// ✅ NEW: Notify all involved sellers
const notifyAllSellers = async (involvedSellers, enrichedProducts, order) => {
    for (const sellerId of involvedSellers) {
        const sellerProducts = enrichedProducts.filter(p => p.sellerId?.toString() === sellerId.toString());
        void notifySellerEmail(sellerId, order, sellerProducts);
    }
};

// ─────────────────────────────────────────────
// ORDER CONTROLLERS
// ─────────────────────────────────────────────

export const createOrderController = async (request, response) => {
    try {
        // ✅ Enrich products with seller data
        const { enrichedProducts, involvedSellers } = await enrichProductsWithSellerData(request.body.products || []);

        let order = new OrderModel({
            userId: request.body.userId,
            products: enrichedProducts,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmt,
            date: request.body.date,
            involvedSellers,
        });

        order = await order.save();

        await updateProductsInventory(request.body.products);

        // ✅ Update seller earnings
        void updateSellerEarnings(enrichedProducts);

        // ✅ Notify customer
        void queueOrderConfirmationEmail(request.body.userId, order);

        // ✅ Notify all involved sellers
        void notifyAllSellers(involvedSellers, enrichedProducts, order);

        return response.status(200).json({
            error: false,
            success: true,
            message: "Order Placed",
            order: order
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
};

// ADMIN - Get ALL orders
export async function getOrderDetailsController(request, response) {
    try {
        const { page = 1, limit = 10 } = request.query;
        const orderlist = await OrderModel.find()
            .sort({ createdAt: -1 })
            .populate('delivery_address userId')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await OrderModel.countDocuments();

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// CUSTOMER - Get my orders
export async function getUserOrderDetailsController(request, response) {
    try {
        const userId = request.userId;
        const { page = 1, limit = 10 } = request.query;

        const orderlist = await OrderModel.find({ userId })
            .sort({ createdAt: -1 })
            .populate('delivery_address userId')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await OrderModel.countDocuments({ userId });

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// ✅ NEW: SELLER - Get only MY orders (orders where my products were bought)
export async function getSellerOrdersController(request, response) {
    try {
        const sellerId = request.seller._id;
        const { page = 1, limit = 10, status } = request.query;

        // Filter orders where this seller is involved
        const filter = { involvedSellers: sellerId };

        const orders = await OrderModel.find(filter)
            .sort({ createdAt: -1 })
            .populate('delivery_address userId', 'name email mobile address_details')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Return only this seller's products in each order
        const sellerOrders = orders.map(order => ({
            ...order,
            products: order.products.filter(p => p.sellerId?.toString() === sellerId.toString()),
            myEarning: order.products
                .filter(p => p.sellerId?.toString() === sellerId.toString())
                .reduce((sum, p) => sum + (p.sellerEarning || 0), 0),
        }));

        const total = await OrderModel.countDocuments(filter);

        return response.json({
            message: "seller orders",
            data: sellerOrders,
            error: false,
            success: true,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// ✅ NEW: SELLER - Update item status of their own products
export async function updateSellerItemStatusController(request, response) {
    try {
        const sellerId = request.seller._id;
        const { orderId, productId } = request.params;
        const { status } = request.body;

        const validStatuses = ["confirm", "processing", "shipped", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
            return response.status(400).json({ message: "Invalid status", error: true, success: false });
        }

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return response.status(404).json({ message: "Order not found", error: true, success: false });
        }

        // Find and update only this seller's product item
        const productIndex = order.products.findIndex(
            p => p.productId === productId && p.sellerId?.toString() === sellerId.toString()
        );

        if (productIndex === -1) {
            return response.status(403).json({ message: "Product not found or unauthorized", error: true, success: false });
        }

        order.products[productIndex].item_status = status;
        await order.save();

        return response.status(200).json({
            message: "Item status updated",
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// ADMIN - Update overall order status
export async function updateOrderStatusController(request, response) {
    try {
        const { order_status } = request.body;
        const order = await OrderModel.findByIdAndUpdate(
            request.params.id,
            { order_status },
            { new: true }
        );

        return response.status(200).json({
            message: "Order status updated",
            data: order,
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

export async function getTotalOrdersCountController(request, response) {
    try {
        const ordersCount = await OrderModel.countDocuments();
        return response.status(200).json({ error: false, success: true, count: ordersCount });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// ─────────────────────────────────────────────
// PAYPAL
// ─────────────────────────────────────────────

function getPayPalClient() {
    const environment =
        process.env.PAYPAL_MODE === "live"
            ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID_LIVE, process.env.PAYPAL_SECRET_LIVE)
            : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID_TEST, process.env.PAYPAL_SECRET_TEST);
    return new paypal.core.PayPalHttpClient(environment);
}

export const createOrderPaypalController = async (request, response) => {
    try {
        const req = new paypal.orders.OrdersCreateRequest();
        req.prefer("return=representation");
        req.requestBody({
            intent: "CAPTURE",
            purchase_units: [{ amount: { currency_code: 'USD', value: request.query.totalAmount } }]
        });
        const client = getPayPalClient();
        const order = await client.execute(req);
        response.json({ id: order.result.id });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
};

export const captureOrderPaypalController = async (request, response) => {
    try {
        const { paymentId } = request.body;
        const req = new paypal.orders.OrdersCaptureRequest(paymentId);
        req.requestBody({});

        // ✅ Enrich products with seller data
        const { enrichedProducts, involvedSellers } = await enrichProductsWithSellerData(request.body.products || []);

        const order = new OrderModel({
            userId: request.body.userId,
            products: enrichedProducts,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmount,
            date: request.body.date,
            involvedSellers,
        });

        await order.save();
        await updateProductsInventory(request.body.products);
        void updateSellerEarnings(enrichedProducts);
        void queueOrderConfirmationEmail(request.body.userId, order);
        void notifyAllSellers(involvedSellers, enrichedProducts, order);

        return response.status(200).json({ success: true, error: false, order, message: "Order Placed" });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
};

// ─────────────────────────────────────────────
// STATS (kept from original)
// ─────────────────────────────────────────────

export const totalSalesController = async (request, response) => {
    try {
        const ordersList = await OrderModel.find({ payment_status: "paid" });
        let totalSales = 0;
        let monthlySales = ['JAN','FEB','MAR','APRIL','MAY','JUNE','JULY','AUG','SEP','OCT','NOV','DEC'].map(name => ({ name, TotalSales: 0 }));

        for (const order of ordersList) {
            totalSales += order.totalAmt;
            const month = new Date(order.createdAt).getMonth(); // 0-indexed
            monthlySales[month].TotalSales += order.totalAmt;
        }

        return response.status(200).json({ totalSales, monthlySales, error: false, success: true });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
};

export const totalUsersController = async (request, response) => {
    try {
        const users = await UserModel.aggregate([
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        let monthlyUsers = ['JAN','FEB','MAR','APRIL','MAY','JUNE','JULY','AUG','SEP','OCT','NOV','DEC'].map(name => ({ name, TotalUsers: 0 }));

        for (const u of users) {
            const idx = u._id.month - 1;
            monthlyUsers[idx].TotalUsers = u.count;
        }

        return response.status(200).json({ TotalUsers: monthlyUsers, error: false, success: true });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
};

export async function deleteOrder(request, response) {
    const order = await OrderModel.findById(request.params.id);
    if (!order) {
        return response.status(404).json({ message: "Order Not found", error: true, success: false });
    }
    const deletedOrder = await OrderModel.findByIdAndDelete(request.params.id);
    if (!deletedOrder) {
        return response.status(404).json({ message: "Order not deleted!", success: false, error: true });
    }
    return response.status(200).json({ success: true, error: false, message: "Order Deleted!" });
}