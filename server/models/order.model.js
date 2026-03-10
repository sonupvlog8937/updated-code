import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    products: [
      {
        productId: { type: String },
        productTitle: { type: String },
        quantity: { type: Number },
        RTCEncodedVideoFrame: [{ type: String, default: null }],
        size: [{ type: String, default: null }],
        weight: [{ type: String, default: null }],
        price: { type: Number },
        image: { type: String },
        color: { type: String, default: "" },
        colorCode: { type: String, default: "" },
        subTotal: { type: Number },

        // ✅ NEW: Seller info per product item
        sellerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Seller",
          default: null,  // null = admin product
        },
        sellerName: {
          type: String,
          default: "",
        },
        // Seller earnings for this item (after commission deduction)
        sellerEarning: {
          type: Number,
          default: 0,
        },
        // Item level order status (seller can update his own items)
        item_status: {
          type: String,
          enum: ["confirm", "processing", "shipped", "delivered", "cancelled"],
          default: "confirm",
        },
      },
    ],

    paymentId: { type: String, default: "" },
    payment_status: { type: String, default: "" },

    // Overall order status (admin controls)
    order_status: {
      type: String,
      enum: ["confirm", "processing", "shipped", "delivered", "cancelled"],
      default: "confirm",
    },

    delivery_address: {
      type: mongoose.Schema.ObjectId,
      ref: "address",
    },
    totalAmt: { type: Number, default: 0 },

    // ✅ NEW: Which sellers are involved in this order
    involvedSellers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
      },
    ],
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("order", orderSchema);
export default OrderModel;