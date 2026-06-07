import crypto from "crypto";
import OrderModel from "../models/order.model.js";
import ProductModel from '../models/product.modal.js';
import UserModel from '../models/user.model.js';
import GroceryProduct from '../models/groceryProduct.model.js';
import RestaurantItem from '../models/restaurantItem.model.js';
import ShopOwner from '../models/shopOwner.model.js';
import GroceryShop from '../models/groceryShop.model.js';
import Restaurant from '../models/restaurant.model.js';
import paypal from "@paypal/checkout-server-sdk";
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import getOtpEmailHtml from "../utils/emailTemplates.js";
import sendEmailFun from "../config/sendEmail.js";
import { getRazorpayCredentials } from "./payment.controller.js";


const isRazorpaySignaturePayload = (body = {}) =>
    Boolean(body.razorpay_order_id || body.razorpay_signature);

const verifyRazorpayPaymentSignature = (body = {}) => {
    const { keySecret } = getRazorpayCredentials();
    const razorpayOrderId = String(body.razorpay_order_id || "");
    const paymentId = String(body.paymentId || body.razorpay_payment_id || "");
    const razorpaySignature = String(body.razorpay_signature || "");

    if (!keySecret || !razorpayOrderId || !paymentId || !razorpaySignature) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${paymentId}`)
        .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const actualBuffer = Buffer.from(razorpaySignature, "hex");

    return (
        expectedBuffer.length === actualBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    );
};

const updateProductsInventory = async (products = []) => {
    if (!Array.isArray(products) || products.length === 0) {
        return;
    }

    const operations = products
        .filter((item) => item?.productId && Number(item?.quantity) > 0)
        .map((item) => ({
            updateOne: {
                filter: { _id: item.productId },
                update: {
                    $inc: {
                        countInStock: -Number(item.quantity),
                        sale: Number(item.quantity)
                    }
                }
            }
        }));

    if (operations.length > 0) {
        await ProductModel.bulkWrite(operations);
    }
};

const attachSellerToProducts = async (products = []) => {
    if (!Array.isArray(products) || products.length === 0) {
        return [];
    }

    const productIds = products.map((item) => item?.productId).filter(Boolean);
    const [marketProducts, groceryProducts, restaurantItems] = await Promise.all([
        ProductModel.find({ _id: { $in: productIds } }).select("_id seller").lean(),
        GroceryProduct.find({ _id: { $in: productIds } }).populate({ path: "shopId", populate: { path: "ownerId", select: "userId email" } }).lean(),
        RestaurantItem.find({ _id: { $in: productIds } }).populate({ path: "restaurantId", populate: { path: "ownerId", select: "userId email" } }).lean(),
    ]);

    const sellerMap = new Map(marketProducts.map((item) => [String(item._id), item?.seller ? String(item.seller) : null]));
    groceryProducts.forEach((item) => {
        const sellerId = item?.shopId?.ownerId?.userId;
        if (sellerId) sellerMap.set(String(item._id), String(sellerId));
    });
    restaurantItems.forEach((item) => {
        const sellerId = item?.restaurantId?.ownerId?.userId;
        if (sellerId) sellerMap.set(String(item._id), String(sellerId));
    });

    return products.map((item) => ({
        ...item,
        sellerId: sellerMap.get(String(item.productId)) || item?.sellerId || null,
    }));
};

const updateGoMarketSales = async (products = []) => {
    const groceryOps = [];
    const restaurantOps = [];
    for (const item of products || []) {
        if (!item?.productId || Number(item?.quantity || 0) <= 0) continue;
        const op = {
            updateOne: {
                filter: { _id: item.productId },
                update: { $inc: { soldCount: Number(item.quantity) } },
            },
        };
        groceryOps.push(op);
        restaurantOps.push(op);
    }
    if (groceryOps.length) await GroceryProduct.bulkWrite(groceryOps, { ordered: false }).catch(() => { });
    if (restaurantOps.length) await RestaurantItem.bulkWrite(restaurantOps, { ordered: false }).catch(() => { });
};

const queueOrderConfirmationEmail = async (userId, order) => {
    try {
        const user = await UserModel.findById(userId).select("name email").lean();
        if (!user?.email) {
            console.warn("Order email skipped — no email found for userId:", userId);
            return;
        }

        const storeName = process.env.STORE_NAME || 'Zeedaddy';

        const sent = await sendEmailFun({
            sendTo: user.email,
            subject: `✅ Order Confirmed – #${order?._id?.toString().slice(-8).toUpperCase()} | ${storeName}`,
            text: `Hi ${user.name}, your order has been placed successfully! Order ID: ${order?._id}. Total: ₹${order?.totalAmt}`,
            html: OrderConfirmationEmail(user.name, order)
        });

        if (!sent) {
            console.error("❌ Order confirmation email failed", { userId, orderId: order?._id });
        } else {
            console.log(`📧 Order confirmation email sent to ${user.email}`);
        }
    } catch (error) {
        console.error("Order confirmation email error:", error.message);
    }
};

const countSellerGoMarketProducts = async (sellerId) => {
    const ownerIds = (await ShopOwner.find({ userId: sellerId }).select("_id").lean()).map((owner) => owner._id);
    if (!ownerIds.length) return 0;

    const [shopIds, restaurantIds] = await Promise.all([
        GroceryShop.find({ ownerId: { $in: ownerIds } }).select("_id").lean(),
        Restaurant.find({ ownerId: { $in: ownerIds } }).select("_id").lean(),
    ]);

    const [groceryCount, restaurantItemCount] = await Promise.all([
        GroceryProduct.countDocuments({ shopId: { $in: shopIds.map((shop) => shop._id) } }),
        RestaurantItem.countDocuments({ restaurantId: { $in: restaurantIds.map((restaurant) => restaurant._id) } }),
    ]);

    return groceryCount + restaurantItemCount;
};

const applySellerCommission = async (products = []) => {
    const commissionBySeller = new Map();

    for (const item of products) {
        const sellerId = item?.sellerId ? String(item.sellerId) : null;
        if (!sellerId) continue;
        const subTotal = Number(item?.subTotal || (Number(item?.price || 0) * Number(item?.quantity || 1)));
        const commission = Number((subTotal * 0.10).toFixed(2));
        commissionBySeller.set(sellerId, (commissionBySeller.get(sellerId) || 0) + commission);
    }

    for (const [sellerId, commissionAmount] of commissionBySeller.entries()) {
        await UserModel.findByIdAndUpdate(sellerId, {
            $inc: {
                "wallet.pendingCommission": commissionAmount,
                "wallet.totalCommissionPaid": commissionAmount,
            },
            $push: {
                walletTransactions: {
                    type: "COMMISSION",
                    amount: commissionAmount,
                    status: "APPROVED",
                    note: "10% commission charged for completed order",
                },
            },
        });
    }
};

export const createOrderController = async (request, response) => {
    try {

        if (isRazorpaySignaturePayload(request.body) && !verifyRazorpayPaymentSignature(request.body)) {
            return response.status(400).json({
                message: "Razorpay payment verification failed.",
                error: true,
                success: false
            });
        }

        const productsWithSeller = await attachSellerToProducts(request.body.products);

        let order = new OrderModel({
            userId: request.body.userId,
            products: productsWithSeller,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            razorpayOrderId: request.body.razorpay_order_id,
            razorpaySignature: request.body.razorpay_signature,
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmt,
            shippingFee: request.body.shippingFee || 0,
            deliveryFee: request.body.deliveryFee || 0,
            discount_amount: request.body.discount_amount || request.body.discountAmount || 0,
            date: request.body.date
        });

        if (!order) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        order = await order.save();

        await updateProductsInventory(productsWithSeller);
        await updateGoMarketSales(productsWithSeller);
        await applySellerCommission(productsWithSeller);

        void queueOrderConfirmationEmail(request.body.userId, order);


        return response.status(200).json({
            error: false,
            success: true,
            message: "Order Placed",
            order: order
        });


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId // order id

        const { page, limit } = request.query;

        let orderlist;
        if (page && limit) {
            // Paginated query
            orderlist = await OrderModel.find()
                .sort({ createdAt: -1 })
                .populate('delivery_address userId deliveryAssignment.riderId')
                .skip((page - 1) * limit)
                .limit(parseInt(limit));
        } else {
            // Fetch all orders (no pagination)
            orderlist = await OrderModel.find()
                .sort({ createdAt: -1 })
                .populate('delivery_address userId deliveryAssignment.riderId');
        }

        const total = page && limit ? await OrderModel.countDocuments() : orderlist.length;

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page) || 1,
            totalPages: page && limit ? Math.ceil(total / limit) : 1
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getUserOrderDetailsController(request, response) {
    try {
        const userId = request.userId // order id

        const { page, limit } = request.query;

        let orderlist;
        if (page && limit) {
            // Paginated query
            orderlist = await OrderModel.find({ userId: userId })
                .sort({ createdAt: -1 })
                .populate('delivery_address userId deliveryAssignment.riderId')
                .skip((page - 1) * limit)
                .limit(parseInt(limit));
        } else {
            // Fetch all orders (no pagination)
            orderlist = await OrderModel.find({ userId: userId })
                .sort({ createdAt: -1 })
                .populate('delivery_address userId deliveryAssignment.riderId');
        }

        const total = orderlist?.length;

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page) || 1,
            totalPages: page && limit ? Math.ceil(total / limit) : 1
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getTotalOrdersCountController(request, response) {
    try {
        const ordersCount = await OrderModel.countDocuments();
        return response.status(200).json({
            error: false,
            success: true,
            count: ordersCount
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



function getPayPalClient() {

    const environment =
        process.env.PAYPAL_MODE === "live"
            ? new paypal.core.LiveEnvironment(
                process.env.PAYPAL_CLIENT_ID_LIVE,
                process.env.PAYPAL_SECRET_LIVE
            )
            : new paypal.core.SandboxEnvironment(
                process.env.PAYPAL_CLIENT_ID_TEST,
                process.env.PAYPAL_SECRET_TEST
            );

    return new paypal.core.PayPalHttpClient(environment);


}


export const createOrderPaypalController = async (request, response) => {
    try {

        const req = new paypal.orders.OrdersCreateRequest();
        req.prefer("return=representation");

        req.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: request.query.totalAmount
                }
            }]
        });


        try {
            const client = getPayPalClient();
            const order = await client.execute(req);
            response.json({ id: order.result.id });
        } catch (error) {
            console.error(error);
            response.status(500).send("Error creating PayPal order");
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}




export const captureOrderPaypalController = async (request, response) => {
    try {
        const { paymentId } = request.body;

        const req = new paypal.orders.OrdersCaptureRequest(paymentId);
        req.requestBody({});

        const productsWithSeller = await attachSellerToProducts(request.body.products);

        const orderInfo = {
            userId: request.body.userId,
            products: productsWithSeller,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmount,
            shippingFee: request.body.shippingFee || 0,
            deliveryFee: request.body.deliveryFee || 0,
            discount_amount: request.body.discount_amount || request.body.discountAmount || 0,
            date: request.body.date
        }

        const order = new OrderModel(orderInfo);
        await order.save();

        await updateProductsInventory(productsWithSeller);
        await updateGoMarketSales(productsWithSeller);
        await applySellerCommission(productsWithSeller);

        void queueOrderConfirmationEmail(request.body.userId, order);


        return response.status(200).json(
            {
                success: true,
                error: false,
                order: order,
                message: "Order Placed"
            }
        );

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export const updateOrderStatusController = async (request, response) => {
    try {
        const id = request.params.id || request.body.id;
        const { order_status } = request.body;

        if (!id || !order_status) {
            return response.status(400).json({
                message: "Order id and status are required",
                error: true,
                success: false
            });
        }

        const updateOrder = await OrderModel.findByIdAndUpdate(
            id,
            {
                order_status: order_status,
            },
            { new: true }
        );

        return response.json({
            message: "Update order status",
            success: true,
            error: false,
            data: updateOrder
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}

export const requestOrderReturnController = async (request, response) => {
    try {
        const { id } = request.params;
        const { reason } = request.body;

        const order = await OrderModel.findOne({ _id: id, userId: request.userId });

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false,
            });
        }

        const status = (order.order_status || "").toLowerCase();
        if (status !== "delivered") {
            return response.status(400).json({
                message: "Return can be requested only for delivered orders",
                error: true,
                success: false,
            });
        }

        if (order.returnRequest?.requested && order.returnRequest?.status !== "rejected") {
            return response.status(400).json({
                message: "Return request already exists for this order",
                error: true,
                success: false,
            });
        }

        order.returnRequest = {
            requested: true,
            reason: reason || "No reason provided",
            requestedAt: new Date(),
            status: "requested",
        };

        await order.save();

        return response.status(200).json({
            message: "Return requested successfully",
            error: false,
            success: true,
            data: order,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};

export const updateReturnRefundStatusController = async (request, response) => {
    try {
        const { id } = request.params;
        const { returnStatus, refundStatus, refundMethod, refundAmount } = request.body;

        const order = await OrderModel.findById(id);

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false,
            });
        }

        if (returnStatus) {
            order.returnRequest = {
                ...(order.returnRequest || {}),
                requested: true,
                status: returnStatus,
            };
        }

        if (refundStatus) {
            order.refund = {
                ...(order.refund || {}),
                status: refundStatus,
                method: refundMethod || order.refund?.method || "",
                amount: Number(refundAmount ?? order.refund?.amount ?? order.totalAmt ?? 0),
                processedAt: refundStatus === "processed" ? new Date() : order.refund?.processedAt || null,
            };

            if (refundStatus === "processed") {
                order.order_status = "refunded";
            }
        }

        await order.save();

        return response.status(200).json({
            message: "Return/refund status updated",
            error: false,
            success: true,
            data: order,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};



export async function getSellerOrdersController(request, response) {
    try {
        const { page = 1, limit = 10 } = request.query;
        const skip = (Number(page) - 1) * Number(limit);

        const orders = await OrderModel.find({ "products.sellerId": request.userId })
            .sort({ createdAt: -1 })
            .populate('delivery_address userId products.sellerId deliveryAssignment.riderId')
            .skip(skip)
            .limit(Number(limit));

        const total = await OrderModel.countDocuments({ "products.sellerId": request.userId });

        return response.status(200).json({
            message: "seller order list",
            data: orders,
            error: false,
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}



export const totalSalesController = async (request, response) => {
    try {
        const currentYear = new Date().getFullYear();

        const ordersList = await OrderModel.find();

        let totalSales = 0;
        let monthlySales = [
            {
                name: 'JAN',
                TotalSales: 0
            },
            {
                name: 'FEB',
                TotalSales: 0
            },
            {
                name: 'MAR',
                TotalSales: 0
            },
            {
                name: 'APRIL',
                TotalSales: 0
            },
            {
                name: 'MAY',
                TotalSales: 0
            },
            {
                name: 'JUNE',
                TotalSales: 0
            },
            {
                name: 'JULY',
                TotalSales: 0
            },
            {
                name: 'AUG',
                TotalSales: 0
            },
            {
                name: 'SEP',
                TotalSales: 0
            },
            {
                name: 'OCT',
                TotalSales: 0
            },
            {
                name: 'NOV',
                TotalSales: 0
            },
            {
                name: 'DEC',
                TotalSales: 0
            },
        ]


        for (let i = 0; i < ordersList.length; i++) {
            totalSales = totalSales + parseInt(ordersList[i].totalAmt);
            const str = JSON.stringify(ordersList[i]?.createdAt);
            const year = str.substr(1, 4);
            const monthStr = str.substr(6, 8);
            const month = parseInt(monthStr.substr(0, 2));

            if (currentYear == year) {

                if (month === 1) {
                    monthlySales[0] = {
                        name: 'JAN',
                        TotalSales: monthlySales[0].TotalSales = parseInt(monthlySales[0].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 2) {

                    monthlySales[1] = {
                        name: 'FEB',
                        TotalSales: monthlySales[1].TotalSales = parseInt(monthlySales[1].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 3) {
                    monthlySales[2] = {
                        name: 'MAR',
                        TotalSales: monthlySales[2].TotalSales = parseInt(monthlySales[2].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 4) {
                    monthlySales[3] = {
                        name: 'APRIL',
                        TotalSales: monthlySales[3].TotalSales = parseInt(monthlySales[3].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 5) {
                    monthlySales[4] = {
                        name: 'MAY',
                        TotalSales: monthlySales[4].TotalSales = parseInt(monthlySales[4].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 6) {
                    monthlySales[5] = {
                        name: 'JUNE',
                        TotalSales: monthlySales[5].TotalSales = parseInt(monthlySales[5].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 7) {
                    monthlySales[6] = {
                        name: 'JULY',
                        TotalSales: monthlySales[6].TotalSales = parseInt(monthlySales[6].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 8) {
                    monthlySales[7] = {
                        name: 'AUG',
                        TotalSales: monthlySales[7].TotalSales = parseInt(monthlySales[7].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 9) {
                    monthlySales[8] = {
                        name: 'SEP',
                        TotalSales: monthlySales[8].TotalSales = parseInt(monthlySales[8].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 10) {
                    monthlySales[9] = {
                        name: 'OCT',
                        TotalSales: monthlySales[9].TotalSales = parseInt(monthlySales[9].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 11) {
                    monthlySales[10] = {
                        name: 'NOV',
                        TotalSales: monthlySales[10].TotalSales = parseInt(monthlySales[10].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 12) {
                    monthlySales[11] = {
                        name: 'DEC',
                        TotalSales: monthlySales[11].TotalSales = parseInt(monthlySales[11].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

            }


        }


        return response.status(200).json({
            totalSales: totalSales,
            monthlySales: monthlySales,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}





export const totalUsersController = async (request, response) => {
    try {
        const users = await UserModel.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);



        let monthlyUsers = [
            {
                name: 'JAN',
                TotalUsers: 0
            },
            {
                name: 'FEB',
                TotalUsers: 0
            },
            {
                name: 'MAR',
                TotalUsers: 0
            },
            {
                name: 'APRIL',
                TotalUsers: 0
            },
            {
                name: 'MAY',
                TotalUsers: 0
            },
            {
                name: 'JUNE',
                TotalUsers: 0
            },
            {
                name: 'JULY',
                TotalUsers: 0
            },
            {
                name: 'AUG',
                TotalUsers: 0
            },
            {
                name: 'SEP',
                TotalUsers: 0
            },
            {
                name: 'OCT',
                TotalUsers: 0
            },
            {
                name: 'NOV',
                TotalUsers: 0
            },
            {
                name: 'DEC',
                TotalUsers: 0
            },
        ]




        for (let i = 0; i < users.length; i++) {

            if (users[i]?._id?.month === 1) {
                monthlyUsers[0] = {
                    name: 'JAN',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 2) {
                monthlyUsers[1] = {
                    name: 'FEB',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 3) {
                monthlyUsers[2] = {
                    name: 'MAR',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 4) {
                monthlyUsers[3] = {
                    name: 'APRIL',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 5) {
                monthlyUsers[4] = {
                    name: 'MAY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 6) {
                monthlyUsers[5] = {
                    name: 'JUNE',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 7) {
                monthlyUsers[6] = {
                    name: 'JULY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 8) {
                monthlyUsers[7] = {
                    name: 'AUG',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 9) {
                monthlyUsers[8] = {
                    name: 'SEP',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 10) {
                monthlyUsers[9] = {
                    name: 'OCT',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 11) {
                monthlyUsers[10] = {
                    name: 'NOV',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 12) {
                monthlyUsers[11] = {
                    name: 'DEC',
                    TotalUsers: users[i].count
                }
            }

        }



        return response.status(200).json({
            TotalUsers: monthlyUsers,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteOrder(request, response) {
    const order = await OrderModel.findById(request.params.id);

    console.log(request.params.id)

    if (!order) {
        return response.status(404).json({
            message: "Order Not found",
            error: true,
            success: false
        })
    }


    const deletedOrder = await OrderModel.findByIdAndDelete(request.params.id);

    if (!deletedOrder) {
        response.status(404).json({
            message: "Order not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Order Deleted!",
    });
}

// ─── Seller Dashboard Stats ────────────────────────────────────────────────────
export async function getSellerDashboardStats(request, response) {
    try {
        const sellerId = request.userId; // string — same as products.sellerId in DB

        // 1. Total products by this seller
        const [totalMarketplaceProducts, goMarketProducts] = await Promise.all([
            ProductModel.countDocuments({ seller: sellerId }),
            countSellerGoMarketProducts(sellerId),
        ]);

        const totalProducts = totalMarketplaceProducts + goMarketProducts;

        // 2. Count orders by status — same match as getSellerOrdersController
        const allOrders = await OrderModel.find(
            { "products.sellerId": sellerId },
            { order_status: 1, totalAmt: 1 }  // only fetch needed fields
        ).lean();

        let totalOrders = allOrders.length;
        let pendingOrders = 0;
        let confirmedOrders = 0;
        let shippedOrders = 0;
        let deliveredOrders = 0;
        let cancelledOrders = 0;
        let totalEarning = 0;
        let pendingEarning = 0;

        for (const order of allOrders) {
            const status = (order.order_status || "").toLowerCase();
            const amt = Number(order.totalAmt || 0);

            if (status === "pending") pendingOrders++;
            if (status === "confirmed") confirmedOrders++;
            if (status === "shipped") shippedOrders++;
            if (status === "delivered") { deliveredOrders++; totalEarning += amt; }
            if (status === "cancelled") cancelledOrders++;
            if (status === "confirmed" || status === "shipped") pendingEarning += amt;
        }

        return response.status(200).json({
            error: false,
            success: true,
            totalProducts,
            totalOrders,
            pendingOrders,
            confirmedOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            totalEarning,
            pendingEarning,
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}
const RIDER_DELIVERY_FEE = 20;

const getSellerMarketIds = async (sellerId, sellerEmail = "") => {
    const ownerQuery = sellerEmail ? { $or: [{ userId: sellerId }, { email: sellerEmail }] } : { userId: sellerId };
    const ownerIds = (await ShopOwner.find(ownerQuery).select("_id").lean()).map((o) => o._id);
    const [shops, restaurants] = await Promise.all([
        GroceryShop.find({ ownerId: { $in: ownerIds } }).select("marketId").lean(),
        Restaurant.find({ ownerId: { $in: ownerIds } }).select("marketId").lean(),
    ]);
    return [...shops, ...restaurants].map((o) => o.marketId).filter(Boolean).map(String);
};

export const listDeliveryRidersController = async (request, response) => {
    try {
        const marketIds = request.currentUser?.role === "ADMIN"
            ? []
            : await getSellerMarketIds(request.userId, request.currentUser?.email);
        const filter = { role: "DELIVERY_RIDER", status: "Active" };
        if (marketIds.length) filter["riderProfile.marketId"] = { $in: marketIds };
        const riders = await UserModel.find(filter)
            .select("name email mobile wallet riderProfile status createdAt")
            .populate("riderProfile.marketId", "name city")
            .sort({ name: 1 })
            .lean();
        return response.json({ success: true, error: false, riders, data: riders });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};

export const assignOrderToRiderController = async (request, response) => {
    try {
        const { riderId } = request.body || {};
        if (!riderId) return response.status(400).json({ success: false, error: true, message: "Select a delivery rider" });

        const order = await OrderModel.findOne({ _id: request.params.id, "products.sellerId": request.userId });
        if (!order && request.currentUser?.role !== "ADMIN") {
            return response.status(404).json({ success: false, error: true, message: "Seller order not found" });
        }
        const targetOrder = order || await OrderModel.findById(request.params.id);
        if (!targetOrder) return response.status(404).json({ success: false, error: true, message: "Order not found" });

        const rider = await UserModel.findOne({ _id: riderId, role: "DELIVERY_RIDER", status: "Active" });
        if (!rider) return response.status(404).json({ success: false, error: true, message: "Delivery rider not found" });

        if (request.currentUser?.role !== "ADMIN") {
            const marketIds = await getSellerMarketIds(request.userId, request.currentUser?.email);
            const riderMarketId = rider.riderProfile?.marketId ? String(rider.riderProfile.marketId) : "";
            if (!riderMarketId || !marketIds.includes(riderMarketId)) {
                return response.status(400).json({ success: false, error: true, message: "This rider is not active in your selected market" });
            }
        }

        targetOrder.deliveryAssignment = {
            ...(targetOrder.deliveryAssignment || {}),
            riderId: rider._id,
            assignedBy: request.userId,
            assignedAt: new Date(),
            earningAmount: RIDER_DELIVERY_FEE,
            status: "assigned",
        };
        targetOrder.order_status = "assigned_to_rider";
        await targetOrder.save();

        return response.json({ success: true, error: false, message: "Order assigned to rider", data: targetOrder });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};

export const getRiderOrdersController = async (request, response) => {
    try {
        const status = String(request.query.status || "");
        const filter = { "deliveryAssignment.riderId": request.userId };
        if (status) filter["deliveryAssignment.status"] = status;
        const orders = await OrderModel.find(filter)
            .sort({ createdAt: -1 })
            .populate("delivery_address userId products.sellerId")
            .lean();
        return response.json({ success: true, error: false, data: orders, orders });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};

export const getRiderStatsController = async (request, response) => {
    try {
        const riderId = request.userId;
        
        // Get rider profile data
        const rider = await UserModel.findById(riderId).select('wallet riderProfile');
        
        // Get order stats
        const allOrders = await OrderModel.find({ "deliveryAssignment.riderId": riderId }).lean();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = allOrders.filter(o => {
            const deliveredAt = o.deliveryAssignment?.deliveredAt;
            return deliveredAt && new Date(deliveredAt) >= today;
        });
        
        const pending = allOrders.filter(o => 
            o.deliveryAssignment?.status === "assigned" || 
            o.deliveryAssignment?.status === "confirmed"
        ).length;
        
        const stats = {
            totalDelivered: rider?.riderProfile?.totalDelivered || 0,
            totalEarnings: rider?.riderProfile?.totalEarnings || 0,
            pending: pending,
            today: todayOrders.length,
            availableBalance: rider?.wallet?.availableBalance || 0
        };
        
        return response.json({ success: true, error: false, stats });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};

export const getRiderRecentDeliveriesController = async (request, response) => {
    try {
        const limit = parseInt(request.query.limit) || 20;
        const deliveries = await OrderModel.find({ 
            "deliveryAssignment.riderId": request.userId,
            "deliveryAssignment.status": "delivered"
        })
        .sort({ "deliveryAssignment.deliveredAt": -1 })
        .limit(limit)
        .select('_id deliveryAssignment.deliveredAt deliveryAssignment.earningAmount totalAmt')
        .lean();
        
        const formattedDeliveries = deliveries.map(d => ({
            orderId: d._id,
            deliveredAt: d.deliveryAssignment?.deliveredAt,
            riderEarning: d.deliveryAssignment?.earningAmount || RIDER_DELIVERY_FEE,
            amount: d.totalAmt
        }));
        
        return response.json({ success: true, error: false, deliveries: formattedDeliveries, data: formattedDeliveries });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};

export const confirmRiderOrderController = async (request, response) => {
    try {
        const order = await OrderModel.findOne({ _id: request.params.id, "deliveryAssignment.riderId": request.userId });
        if (!order) return response.status(404).json({ success: false, error: true, message: "Assigned order not found" });
        order.deliveryAssignment.status = "confirmed";
        order.deliveryAssignment.confirmedAt = new Date();
        order.order_status = "out_for_delivery";
        await order.save();
        return response.json({ success: true, error: false, message: "Order confirmed", data: order });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};

export const sendDeliveryOtpController = async (request, response) => {
    try {
        const order = await OrderModel.findOne({ _id: request.params.id, "deliveryAssignment.riderId": request.userId }).populate("userId", "name email");
        if (!order) return response.status(404).json({ success: false, error: true, message: "Assigned order not found" });
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        order.deliveryAssignment.deliveryOtp = otp;
        order.deliveryAssignment.deliveryOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        order.deliveryAssignment.status = "otp_sent";
        await order.save();
        if (order.userId?.email) {
            await sendEmailFun({
                sendTo: order.userId.email,
                subject: `🔐 Delivery OTP for Order #${order._id}`,
                text: `Your delivery OTP is ${otp}. Valid for 10 minutes. Never share it with anyone.`,
                html: getOtpEmailHtml({
                    customerName: order.userId.name,
                    otp,
                    orderId: `#${order._id}`,
                    trackingUrl: `https://zeedaddy.in/my-orders`,
                    supportUrl: "https://zeedaddy.in/support",
                    customerEmail: order.userId.email,
                }),
            });
        }
        return response.json({ success: true, error: false, message: "Delivery OTP sent to customer email" });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};

export const deliverRiderOrderController = async (request, response) => {
    try {
        const otp = String(request.body?.otp || "").trim();
        const order = await OrderModel.findOne({ _id: request.params.id, "deliveryAssignment.riderId": request.userId });
        if (!order) return response.status(404).json({ success: false, error: true, message: "Assigned order not found" });
        if (!otp || otp !== order.deliveryAssignment.deliveryOtp || new Date(order.deliveryAssignment.deliveryOtpExpires || 0) < new Date()) {
            return response.status(400).json({ success: false, error: true, message: "Invalid or expired delivery OTP" });
        }
        order.deliveryAssignment.status = "delivered";
        order.deliveryAssignment.deliveredAt = new Date();
        order.order_status = "delivered";

        if (!order.deliveryAssignment.earningCredited) {
            const amount = Number(order.deliveryAssignment.earningAmount || RIDER_DELIVERY_FEE);
            console.log(`💰 Crediting ${amount} to rider ${request.userId} for order ${order._id}`);
            
            const updatedUser = await UserModel.findByIdAndUpdate(
                request.userId, 
                {
                    $inc: {
                        "wallet.availableBalance": amount,
                        "riderProfile.totalDelivered": 1,
                        "riderProfile.totalEarnings": amount,
                    },
                    $push: { 
                        walletTransactions: { 
                            type: "RIDER_EARNING", 
                            amount, 
                            status: "APPROVED", 
                            note: `Delivery earning for order ${order._id}`,
                            createdAt: new Date()
                        } 
                    },
                },
                { new: true } // Return updated document
            );
            
            order.deliveryAssignment.earningCredited = true;
            console.log(`✅ Wallet updated! New balance: ₹${updatedUser?.wallet?.availableBalance || 0}`);
        }
        await order.save();
        
        // Fetch updated rider data to return in response
        const riderData = await UserModel.findById(request.userId).select('wallet riderProfile');
        
        return response.json({ 
            success: true, 
            error: false, 
            message: `Order delivered successfully! ₹${order.deliveryAssignment.earningAmount || RIDER_DELIVERY_FEE} credited to your wallet.`, 
            data: order,
            wallet: riderData?.wallet,
            riderProfile: riderData?.riderProfile
        });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};

export const payRiderWalletController = async (request, response) => {
    try {
        const { riderId, amount, note = "Rider wallet payout" } = request.body || {};
        const payout = Number(amount || 0);
        if (!riderId || payout <= 0) return response.status(400).json({ success: false, error: true, message: "Select rider and valid amount" });
        const admin = await UserModel.findById(request.userId);
        const rider = await UserModel.findOne({ _id: riderId, role: "DELIVERY_RIDER" });
        if (!rider) return response.status(404).json({ success: false, error: true, message: "Rider not found" });
        if (Number(admin.wallet?.availableBalance || 0) < payout) return response.status(400).json({ success: false, error: true, message: "Admin wallet balance is low" });
        if (Number(rider.wallet?.availableBalance || 0) < payout) return response.status(400).json({ success: false, error: true, message: "Rider wallet balance is low" });

        admin.wallet.availableBalance -= payout;
        admin.wallet.totalWithdrawn = Number(admin.wallet.totalWithdrawn || 0) + payout;
        admin.walletTransactions.push({ type: "ADMIN_TRANSFER", amount: payout, status: "APPROVED", note, createdBy: request.userId, approvedBy: request.userId });
        rider.wallet.availableBalance -= payout;
        rider.wallet.totalWithdrawn = Number(rider.wallet.totalWithdrawn || 0) + payout;
        rider.walletTransactions.push({ type: "RIDER_PAYOUT", amount: payout, status: "APPROVED", note, createdBy: request.userId, approvedBy: request.userId });
        await Promise.all([admin.save(), rider.save()]);
        return response.json({ success: true, error: false, message: "Rider payout recorded", data: { riderBalance: rider.wallet.availableBalance, adminBalance: admin.wallet.availableBalance } });
    } catch (error) {
        return response.status(500).json({ success: false, error: true, message: error.message || error });
    }
};