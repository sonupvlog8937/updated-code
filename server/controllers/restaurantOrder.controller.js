import RestaurantOrderModel from "../models/restaurantOrder.model.js";
import RestaurantItemModel from "../models/restaurantItem.model.js";

export const placeOrder = async (req, res) => {
  try {
    const { shopId, items } = req.body;

    if (!shopId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "shopId and items are required", success: false });
    }

    const itemIds = items.map((entry) => entry.itemId);
    const dbItems = await RestaurantItemModel.find({ _id: { $in: itemIds }, shop: shopId });
    if (dbItems.length === 0) {
      return res.status(400).json({ message: "No valid items found", success: false });
    }

    const normalizedItems = dbItems.map((dbItem) => {
      const requested = items.find((entry) => String(entry.itemId) === String(dbItem._id));
      const quantity = Number(requested?.quantity || 1);
      return {
        item: dbItem._id,
        quantity,
        price: dbItem.price,
      };
    });

    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const order = await RestaurantOrderModel.create({
      user: req.userId,
      shop: shopId,
      items: normalizedItems,
      totalAmount,
      paymentStatus: "paid",
    });

    if (req.app.get("io")) {
      req.app.get("io").emit("restaurant:order-updated", {
        orderId: order._id,
        status: order.status,
      });
    }

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const verifyPayment = async (req, res) => {
  return res.json({ success: true, message: "Payment verification stub is active" });
};

export const myOrders = async (req, res) => {
  try {
    const orders = await RestaurantOrderModel.find({ user: req.userId })
      .populate("shop", "name city")
      .populate("items.item", "name price")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await RestaurantOrderModel.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!order) return res.status(404).json({ message: "Order not found", success: false });

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