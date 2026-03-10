import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank", "upi"],
      default: "bank",
    },
    // Snapshot of bank/upi at time of request
    paymentDetails: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
    adminNote: {
      type: String,
      default: "",
    },
    // Transaction reference when paid
    transactionId: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const PayoutModel = mongoose.model("Payout", payoutSchema);
export default PayoutModel;