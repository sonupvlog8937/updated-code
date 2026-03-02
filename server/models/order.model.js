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
        subTotal: {
          type: Number,
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
  },
  {
    timestamps: true,
  },
);

const OrderModel = mongoose.model("order", orderSchema);

export default OrderModel;
