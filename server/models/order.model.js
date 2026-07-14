import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    products: [
      {
        productId: {
          type: String,
        },
        productTitle: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        RTCEncodedVideoFrame: [
          {
            type: String,
            default: null,
          },
        ],
        size: [
          {
            type: String,
            default: null,
          },
        ],
        weight: [
          {
            type: String,
            default: null,
          },
        ],
        price: {
          type: Number,
        },
        image: {
          type: String,
        },
        color: {
          type: String,
          default: "",
        },
        colorCode: {
          type: String,
          default: "",
        },
        selectedOptions: {
          type: Object,
          default: {},
        },
        subTotal: {
          type: Number,
        },
        sellerId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          default: null,
        },
      },
    ],
    paymentId: {
      type: String,
      default: "",
    },
    payment_status: {
      type: String,
      default: "",
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    order_status: {
      type: String,
      default: "confirm",
    },
    delivery_address: {
      type: mongoose.Schema.ObjectId,
      ref: "address",
    },
    totalAmt: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    goMarketData: {
      type: {
        type: String,
        default: "standard",
      },
      distanceKm: {
        type: Number,
        default: 0,
      },
      distanceDisplay: {
        type: String,
        default: "",
      },
      userLocation: {
        type: Object,
        default: null,
      },
      farthestSource: {
        type: Object,
        default: null,
      },
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    returnRequest: {
      requested: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
        default: "",
      },
      requestedAt: {
        type: Date,
        default: null,
      },
      status: {
        type: String,
        default: "none",
      },
    },
    deliveryAssignment: {
      riderId: { type: mongoose.Schema.ObjectId, ref: "User", default: null },
      assignedBy: { type: mongoose.Schema.ObjectId, ref: "User", default: null },
      assignedAt: { type: Date, default: null },
      confirmedAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      deliveryOtp: { type: String, default: "" },
      deliveryOtpExpires: { type: Date, default: null },
      earningAmount: { type: Number, default: 20 },
      earningCredited: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["unassigned", "broadcast", "assigned", "confirmed", "otp_sent", "delivered"],
        default: "unassigned",
      },
    },
    refund: {
      status: {
        type: String,
        default: "none",
      },
      method: {
        type: String,
        default: "",
      },
      amount: {
        type: Number,
        default: 0,
      },
      processedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

const OrderModel = mongoose.model("order", orderSchema);

export default OrderModel;
