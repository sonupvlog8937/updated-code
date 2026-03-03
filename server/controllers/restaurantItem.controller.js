import RestaurantItemModel from "../models/restaurantItem.model.js";

export const addItem = async (req, res) => {
  try {
    const { shopId, name, description, price, image } = req.body;

    if (!shopId || !name || price === undefined) {
      return res.status(400).json({ message: "shopId, name and price are required", success: false });
    }

    const item = await RestaurantItemModel.create({
      shop: shopId,
      name,
      description,
      price,
      image,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const editItem = async (req, res) => {
  try {
    const item = await RestaurantItemModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!item) return res.status(404).json({ message: "Item not found", success: false });

    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const deleted = await RestaurantItemModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Item not found", success: false });

    return res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const getItemsByShop = async (req, res) => {
  try {
    const items = await RestaurantItemModel.find({ shop: req.params.shopId, isAvailable: true }).sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const searchItems = async (req, res) => {
  try {
    const q = req.query.q || "";
    const items = await RestaurantItemModel.find({ name: { $regex: q, $options: "i" }, isAvailable: true }).limit(25);
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};