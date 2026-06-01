import OrderModel from "../models/order.model.js";
import GroceryProduct from "../models/groceryProduct.model.js";
import RestaurantItem from "../models/restaurantItem.model.js";
import {
  getSellerGroceryShop,
  getSellerRestaurant,
  assertSellerOwnsGroceryProduct,
  assertSellerOwnsRestaurantItem,
  mapGroceryProductToAdminProduct,
  mapRestaurantItemToAdminProduct,
} from "../utils/goMarketSellerCatalog.js";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildOrderStats = (orders) => {
  let todayOrders = 0;
  let todayRevenue = 0;
  let pendingOrders = 0;
  let preparingOrders = 0;
  let outForDelivery = 0;
  let deliveredToday = 0;

  const todayStart = startOfToday();

  for (const order of orders) {
    const status = (order.order_status || "").toLowerCase();
    const amt = Number(order.totalAmt || 0);
    const created = order.createdAt ? new Date(order.createdAt) : null;
    const isToday = created && created >= todayStart;

    if (status === "pending") pendingOrders++;
    if (status === "confirmed") preparingOrders++;
    if (status === "shipped") outForDelivery++;
    if (isToday) {
      todayOrders++;
      if (status === "delivered") {
        todayRevenue += amt;
        deliveredToday++;
      }
    }
  }

  return {
    todayOrders,
    todayRevenue,
    pendingOrders,
    preparingOrders,
    outForDelivery,
    deliveredToday,
    activeOrders: pendingOrders + preparingOrders + outForDelivery,
  };
};

export const getQuickCommerceOutlet = async (req, res) => {
  try {
    const role = req.currentUser?.role;
    const userId = req.userId;
    const email = req.currentUser?.email;

    if (role === "GROCERY_SELLER") {
      const shop = await getSellerGroceryShop(userId, email);
      if (!shop) {
        return res.status(404).json({ error: true, success: false, message: "Grocery shop not found" });
      }
      return res.status(200).json({
        error: false,
        success: true,
        kind: "grocery",
        outlet: {
          _id: shop._id,
          name: shop.shopName,
          address: shop.address,
          banner: shop.shopBanner,
          logo: shop.shopLogo,
          isOpen: shop.isOpen !== false,
          deliveryMinutes: shop.deliveryMinutes ?? 15,
          minOrderValue: shop.minOrderValue ?? 99,
          totalProducts: shop.totalProducts ?? 0,
          rating: shop.rating ?? 0,
        },
      });
    }

    if (role === "RESTAURANT_SELLER") {
      const restaurant = await getSellerRestaurant(userId, email);
      if (!restaurant) {
        return res.status(404).json({ error: true, success: false, message: "Restaurant not found" });
      }
      return res.status(200).json({
        error: false,
        success: true,
        kind: "restaurant",
        outlet: {
          _id: restaurant._id,
          name: restaurant.restaurantName,
          address: restaurant.address,
          banner: restaurant.restaurantBanner,
          logo: restaurant.restaurantLogo,
          isOpen: restaurant.isOpen !== false,
          deliveryMinutes: restaurant.deliveryMinutes ?? 30,
          minOrderValue: restaurant.minOrderValue ?? 149,
          avgPrepMinutes: restaurant.avgPrepMinutes ?? 25,
          totalItems: restaurant.totalItems ?? 0,
          rating: restaurant.rating ?? 0,
        },
      });
    }

    return res.status(403).json({ error: true, success: false, message: "Quick commerce outlet is only for grocery and restaurant sellers" });
  } catch (error) {
    return res.status(500).json({ error: true, success: false, message: error.message || error });
  }
};

export const updateQuickCommerceOutlet = async (req, res) => {
  try {
    const role = req.currentUser?.role;
    const userId = req.userId;
    const email = req.currentUser?.email;
    const { isOpen, deliveryMinutes, minOrderValue, avgPrepMinutes } = req.body;

    const patch = {};
    if (isOpen !== undefined) patch.isOpen = Boolean(isOpen);
    if (deliveryMinutes !== undefined) patch.deliveryMinutes = Math.max(5, Math.min(120, Number(deliveryMinutes) || 15));
    if (minOrderValue !== undefined) patch.minOrderValue = Math.max(0, Number(minOrderValue) || 0);
    if (avgPrepMinutes !== undefined) patch.avgPrepMinutes = Math.max(5, Math.min(90, Number(avgPrepMinutes) || 25));

    if (role === "GROCERY_SELLER") {
      const shop = await getSellerGroceryShop(userId, email);
      if (!shop) {
        return res.status(404).json({ error: true, success: false, message: "Grocery shop not found" });
      }
      const GroceryShop = (await import("../models/groceryShop.model.js")).default;
      const updated = await GroceryShop.findByIdAndUpdate(shop._id, patch, { new: true }).lean();
      return res.status(200).json({
        error: false,
        success: true,
        message: updated.isOpen ? "Store is now accepting orders" : "Store is paused",
        outlet: {
          _id: updated._id,
          name: updated.shopName,
          isOpen: updated.isOpen !== false,
          deliveryMinutes: updated.deliveryMinutes ?? 15,
          minOrderValue: updated.minOrderValue ?? 99,
        },
      });
    }

    if (role === "RESTAURANT_SELLER") {
      const restaurant = await getSellerRestaurant(userId, email);
      if (!restaurant) {
        return res.status(404).json({ error: true, success: false, message: "Restaurant not found" });
      }
      const Restaurant = (await import("../models/restaurant.model.js")).default;
      const updated = await Restaurant.findByIdAndUpdate(restaurant._id, patch, { new: true }).lean();
      return res.status(200).json({
        error: false,
        success: true,
        message: updated.isOpen ? "Kitchen is open for orders" : "Kitchen is paused",
        outlet: {
          _id: updated._id,
          name: updated.restaurantName,
          isOpen: updated.isOpen !== false,
          deliveryMinutes: updated.deliveryMinutes ?? 30,
          minOrderValue: updated.minOrderValue ?? 149,
          avgPrepMinutes: updated.avgPrepMinutes ?? 25,
        },
      });
    }

    return res.status(403).json({ error: true, success: false, message: "Not allowed" });
  } catch (error) {
    return res.status(500).json({ error: true, success: false, message: error.message || error });
  }
};

export const getQuickCommerceDashboard = async (req, res) => {
  try {
    const role = req.currentUser?.role;
    const userId = req.userId;
    const email = req.currentUser?.email;

    if (!["GROCERY_SELLER", "RESTAURANT_SELLER"].includes(role)) {
      return res.status(403).json({ error: true, success: false, message: "Not allowed" });
    }

    const orders = await OrderModel.find(
      { "products.sellerId": userId },
      { order_status: 1, totalAmt: 1, createdAt: 1, userId: 1, delivery_address: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("userId", "name mobile")
      .lean();

    const orderStats = buildOrderStats(orders);
    const recentOrders = orders.slice(0, 8).map((o) => ({
      _id: o._id,
      order_status: o.order_status,
      totalAmt: o.totalAmt,
      createdAt: o.createdAt,
      customerName: o.userId?.name || "Customer",
      customerPhone: o.delivery_address?.mobile || o.userId?.mobile || "",
      address: [
        o.delivery_address?.address_line1,
        o.delivery_address?.city,
      ]
        .filter(Boolean)
        .join(", "),
    }));

    let catalog = { totalItems: 0, lowStock: 0, outOfStock: 0, unavailable: 0 };
    let outletRes = null;

    if (role === "GROCERY_SELLER") {
      const shop = await getSellerGroceryShop(userId, email);
      if (shop) {
        const products = await GroceryProduct.find({ shopId: shop._id }).select("stock name").lean();
        catalog.totalItems = products.length;
        catalog.lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
        catalog.outOfStock = products.filter((p) => p.stock === 0).length;
        outletRes = {
          kind: "grocery",
          name: shop.shopName,
          isOpen: shop.isOpen !== false,
          deliveryMinutes: shop.deliveryMinutes ?? 15,
          minOrderValue: shop.minOrderValue ?? 99,
        };
      }
    } else {
      const restaurant = await getSellerRestaurant(userId, email);
      if (restaurant) {
        const items = await RestaurantItem.find({ restaurantId: restaurant._id }).select("isAvailable itemName").lean();
        catalog.totalItems = items.length;
        catalog.unavailable = items.filter((p) => p.isAvailable === false).length;
        outletRes = {
          kind: "restaurant",
          name: restaurant.restaurantName,
          isOpen: restaurant.isOpen !== false,
          deliveryMinutes: restaurant.deliveryMinutes ?? 30,
          minOrderValue: restaurant.minOrderValue ?? 149,
          avgPrepMinutes: restaurant.avgPrepMinutes ?? 25,
        };
      }
    }

    return res.status(200).json({
      error: false,
      success: true,
      role,
      outlet: outletRes,
      orderStats,
      catalog,
      recentOrders,
    });
  } catch (error) {
    return res.status(500).json({ error: true, success: false, message: error.message || error });
  }
};

export const patchGroceryStock = async (req, res) => {
  try {
    const owned = await assertSellerOwnsGroceryProduct(
      req.params.id,
      req.userId,
      req.currentUser.email,
    );
    if (!owned) {
      return res.status(404).json({ error: true, success: false, message: "Product not found" });
    }

    const stock = Math.max(0, Number(req.body.stock ?? req.body.countInStock ?? owned.product.stock));
    const product = await GroceryProduct.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true },
    ).lean();

    return res.status(200).json({
      error: false,
      success: true,
      product: mapGroceryProductToAdminProduct(product),
    });
  } catch (error) {
    return res.status(500).json({ error: true, success: false, message: error.message || error });
  }
};

export const patchRestaurantAvailability = async (req, res) => {
  try {
    const owned = await assertSellerOwnsRestaurantItem(
      req.params.id,
      req.userId,
      req.currentUser.email,
    );
    if (!owned) {
      return res.status(404).json({ error: true, success: false, message: "Menu item not found" });
    }

    const isAvailable = req.body.isAvailable !== undefined
      ? Boolean(req.body.isAvailable)
      : !owned.item.isAvailable;

    const item = await RestaurantItem.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true },
    ).lean();

    return res.status(200).json({
      error: false,
      success: true,
      product: mapRestaurantItemToAdminProduct(item),
    });
  } catch (error) {
    return res.status(500).json({ error: true, success: false, message: error.message || error });
  }
};
