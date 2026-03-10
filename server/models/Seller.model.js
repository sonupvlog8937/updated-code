import mongoose from "mongoose";

const sellerSchema = mongoose.Schema(
  {
    // Link to User account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Store Info
    storeName: {
      type: String,
      required: [true, "Provide store name"],
      unique: true,
      trim: true,
    },
    storeSlug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    storeLogo: {
      type: String,
      default: "",
    },
    storeBanner: {
      type: String,
      default: "",
    },
    storeDescription: {
      type: String,
      default: "",
    },

    // Contact Info
    mobile: {
      type: String,
      default: "",
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    // Bank / Payout Details
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },

    // Admin Controls
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    commission: {
      type: Number,
      default: 10, // 10% default commission
      min: 0,
      max: 100,
    },

    // Earnings
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingPayout: {
      type: Number,
      default: 0,
    },
    totalPaidOut: {
      type: Number,
      default: 0,
    },

    // Stats
    totalProducts: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto generate storeSlug from storeName
sellerSchema.pre("save", function (next) {
  if (this.isModified("storeName")) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

const SellerModel = mongoose.model("Seller", sellerSchema);
export default SellerModel;