import RestaurantOrderModel from "../models/restaurantOrder.model.js";
import RestaurantItemModel from "../models/restaurantItem.model.js";
import RestaurantShopModel from "../models/restaurantShop.model.js";

export const placeOrder = async (req, res) => {
  try {
    const { shopId, items, paymentMethod = "upi", notes = "" } = req.body;

    if (!shopId || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "shopId and items are required", success: false });
    }

    const shop = await RestaurantShopModel.findOne({
      _id: shopId,
      isOpen: true,
    });
    if (!shop) {
      return res
        .status(404)
        .json({
          message: "Restaurant not available right now",
          success: false,
        });
    }

    const itemIds = items.map((entry) => entry.itemId);
    const dbItems = await RestaurantItemModel.find({
      _id: { $in: itemIds },
      shop: shopId,
      isAvailable: true,
    });
    if (dbItems.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid items found", success: false });
    }

    const normalizedItems = dbItems.map((dbItem) => {
      const requested = items.find(
        (entry) => String(entry.itemId) === String(dbItem._id),
      );
      const quantity = Math.max(
        1,
        Math.min(10, Number(requested?.quantity || 1)),
      );
      return {
        item: dbItem._id,
        quantity,
        price: dbItem.price,
        discountPercent: dbItem.discountPercent || 0,
      };
    });

    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
    const itemDiscount = normalizedItems.reduce(
      (sum, item) =>
        sum + (item.quantity * item.price * item.discountPercent) / 100,
      0,
    );

    const discountedSubtotal = Math.max(subtotal - itemDiscount, 0);
    const deliveryFee = discountedSubtotal >= 399 ? 0 : shop.deliveryFee;
    const platformFee = discountedSubtotal > 0 ? 6 : 0;
    const gst = Number((discountedSubtotal * 0.05).toFixed(2));
    const totalAmount = Number(
      (discountedSubtotal + deliveryFee + platformFee + gst).toFixed(2),
    );

    if (discountedSubtotal < shop.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount is ₹${shop.minOrderAmount}`,
        success: false,
      });
    }

    const now = new Date();
    const estimatedDeliveryAt = new Date(
      now.getTime() + shop.avgDeliveryTimeMins * 60 * 1000,
    );

    const order = await RestaurantOrderModel.create({
      user: req.userId,
      shop: shopId,
      items: normalizedItems,
      pricing: {
        subtotal,
        itemDiscount: Number(itemDiscount.toFixed(2)),
        deliveryFee,
        platformFee,
        gst,
      },
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      notes,
      estimatedDeliveryAt,
      statusTimeline: [{ status: "placed", updatedAt: now }],
    });

    if (req.app.get("io")) {
      req.app.get("io").emit("restaurant:order-updated", {
        orderId: order._id,
        status: order.status,
      });
    }

    return res
      .status(201)
      .json({
        success: true,
        data: order,
        message: "Order placed successfully",
      });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const verifyPayment = async (req, res) => {
  return res.json({
    success: true,
    message: "Payment verification stub is active",
  });
};

export const myOrders = async (req, res) => {
  try {
    const orders = await RestaurantOrderModel.find({ user: req.userId })
      .populate("shop", "name city avgDeliveryTimeMins rating")
      .populate("items.item", "name price image")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await RestaurantOrderModel.findById(req.params.id);

    if (!order)
      return res
        .status(404)
        .json({ message: "Order not found", success: false });

    order.status = status;
    order.statusTimeline.push({ status, updatedAt: new Date() });

    if (status === "delivered") {
      order.paymentStatus = "paid";
    }

    await order.save();

    if (req.app.get("io")) {
      req.app.get("io").emit("restaurant:order-updated", {
        orderId: order._id,
        status: order.status,
      });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};
