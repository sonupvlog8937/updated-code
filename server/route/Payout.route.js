import { Router } from "express";
import auth from "../middlewares/auth.js";
import { isSeller, isAdmin } from "../middlewares/Sellerauth .js";
import {
    requestPayout,
    getSellerPayoutHistory,
    getAllPayouts,
    approvePayout,
    markPayoutPaid,
    rejectPayout,
} from "../controllers/Payout.controller.js";

const payoutRouter = Router();

// ─── SELLER PAYOUT ROUTES ───
payoutRouter.post('/seller/request', auth, isSeller, requestPayout);           // Request withdrawal
payoutRouter.get('/seller/history', auth, isSeller, getSellerPayoutHistory);   // My payout history

// ─── ADMIN PAYOUT ROUTES ───
payoutRouter.get('/admin/all', auth, isAdmin, getAllPayouts);                   // All payouts (?status=pending)
payoutRouter.put('/admin/:id/approve', auth, isAdmin, approvePayout);          // Approve payout
payoutRouter.put('/admin/:id/paid', auth, isAdmin, markPayoutPaid);            // Mark as paid (with transactionId)
payoutRouter.put('/admin/:id/reject', auth, isAdmin, rejectPayout);            // Reject payout

export default payoutRouter;