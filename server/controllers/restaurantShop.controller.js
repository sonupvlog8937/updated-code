import RestaurantShopModel from "../models/restaurantShop.model.js";

export const createShop = async (req, res) => {
  try {
    const { name, city, address, image } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({ message: "name, city and address are required", success: false });
    }

    const created = await RestaurantShopModel.create({
      owner: req.userId,
      name,
      city,
      address,
      image,
    });

    return res.status(201).json({ success: true, data: created, message: "Shop created" });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const updateShop = async (req, res) => {
  try {
    const shop = await RestaurantShopModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    return res.json({ success: true, data: shop, message: "Shop updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const getAllShopsForAdmin = async (req, res) => {
  try {
    const shops = await RestaurantShopModel.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: shops });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const getShopByCity = async (req, res) => {
  try {
    const city = (req.params.city || "").toLowerCase();
    const shops = await RestaurantShopModel.find({ city, isOpen: true }).sort({ createdAt: -1 });
    return res.json({ success: true, data: shops });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};