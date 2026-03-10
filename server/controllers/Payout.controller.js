import PayoutModel from "../models/Payout.model.js";
import SellerModel from "../models/Seller.model.js";

// ─────────────────────────────────────────────
// SELLER - Payout Requests
// ─────────────────────────────────────────────

// POST /api/seller/payout/request
export const requestPayout = async (request, response) => {
    try {
        const seller = request.seller;
        const { amount, paymentMethod } = request.body;

        if (!amount || amount <= 0) {
            return response.status(400).json({ message: "Invalid amount", error: true, success: false });
        }

        if (amount > seller.pendingPayout) {
            return response.status(400).json({
                message: `Insufficient balance. Available: ₹${seller.pendingPayout}`,
                error: true,
                success: false
            });
        }

        // Check no pending request already exists
        const existing = await PayoutModel.findOne({ sellerId: seller._id, status: "pending" });
        if (existing) {
            return response.status(400).json({
                message: "You already have a pending payout request. Wait for admin to process it.",
                error: true,
                success: false
            });
        }

        const payout = await PayoutModel.create({
            sellerId: seller._id,
            amount,
            paymentMethod: paymentMethod || "bank",
            paymentDetails: {
                accountHolderName: seller.bankDetails?.accountHolderName || "",
                accountNumber: seller.bankDetails?.accountNumber || "",
                ifscCode: seller.bankDetails?.ifscCode || "",
                bankName: seller.bankDetails?.bankName || "",
                upiId: seller.bankDetails?.upiId || "",
            },
        });

        return response.status(201).json({
            message: "Payout request submitted. Admin will process it soon.",
            data: payout,
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({ message: error.message, error: true, success: false });
    }
};

// GET /api/seller/payout/history
export const getSellerPayoutHistory = async (request, response) => {
    try {
        const seller = request.seller;
        const { page = 1, limit = 10 } = request.query;

        const payouts = await PayoutModel.find({ sellerId: seller._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await PayoutModel.countDocuments({ sellerId: seller._id });

        return response.status(200).json({
            data: payouts,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({ message: error.message, error: true, success: false });
    }
};

// ─────────────────────────────────────────────
// ADMIN - Payout Management
// ─────────────────────────────────────────────

// GET /api/admin/payouts?status=pending
export const getAllPayouts = async (request, response) => {
    try {
        const { page = 1, limit = 10, status } = request.query;
        const filter = {};
        if (status) filter.status = status;

        const payouts = await PayoutModel.find(filter)
            .populate("sellerId", "storeName storeLogo userId")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await PayoutModel.countDocuments(filter);

        return response.status(200).json({
            data: payouts,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({ message: error.message, error: true, success: false });
    }
};

// PUT /api/admin/payouts/:id/approve
export const approvePayout = async (request, response) => {
    try {
        const payout = await PayoutModel.findById(request.params.id);
        if (!payout) {
            return response.status(404).json({ message: "Payout request not found", error: true, success: false });
        }
        if (payout.status !== "pending") {
            return response.status(400).json({ message: "Payout already processed", error: true, success: false });
        }

        payout.status = "approved";
        payout.adminNote = request.body.adminNote || "";
        await payout.save();

        return response.status(200).json({ message: "Payout approved", data: payout, error: false, success: true });
    } catch (error) {
        return response.status(500).json({ message: error.message, error: true, success: false });
    }
};

// PUT /api/admin/payouts/:id/paid  — mark as actually paid
export const markPayoutPaid = async (request, response) => {
    try {
        const { transactionId } = request.body;
        const payout = await PayoutModel.findById(request.params.id);

        if (!payout) {
            return response.status(404).json({ message: "Payout not found", error: true, success: false });
        }

        payout.status = "paid";
        payout.transactionId = transactionId || "";
        payout.paidAt = new Date();
        await payout.save();

        // Deduct from seller pendingPayout, add to totalPaidOut
        await SellerModel.findByIdAndUpdate(payout.sellerId, {
            $inc: {
                pendingPayout: -payout.amount,
                totalPaidOut: payout.amount,
            }
        });

        return response.status(200).json({ message: "Payout marked as paid", data: payout, error: false, success: true });
    } catch (error) {
        return response.status(500).json({ message: error.message, error: true, success: false });
    }
};

// PUT /api/admin/payouts/:id/reject
export const rejectPayout = async (request, response) => {
    try {
        const payout = await PayoutModel.findById(request.params.id);
        if (!payout) {
            return response.status(404).json({ message: "Payout not found", error: true, success: false });
        }

        payout.status = "rejected";
        payout.adminNote = request.body.reason || "Rejected by admin";
        await payout.save();

        return response.status(200).json({ message: "Payout rejected", data: payout, error: false, success: true });
    } catch (error) {
        return response.status(500).json({ message: error.message, error: true, success: false });
    }
};