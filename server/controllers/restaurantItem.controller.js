import RestaurantItemModel from "../models/restaurantItem.model.js";

export const addItem = async (req, res) => {
  try {
    const {
      shopId,
      name,
      description,
      category,
      price,
      image,
      prepTimeMins,
      vegType,
      discountPercent,
      bestseller,
    } = req.body;

    if (!shopId || !name || price === undefined) {
      return res.status(400).json({
        message: "shopId, name and price are required",
        success: false,
      });
    }

    const item = await RestaurantItemModel.create({
      shop: shopId,
      name,
      description,
      category,
      price,
      image,
      prepTimeMins,
      vegType,
      discountPercent,
      bestseller,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const editItem = async (req, res) => {
  try {
    const item = await RestaurantItemModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!item)
      return res
        .status(404)
        .json({ message: "Item not found", success: false });

    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const deleted = await RestaurantItemModel.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Item not found", success: false });

    return res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const getItemsByShop = async (req, res) => {
  try {
    const { q = "", category = "", sortBy = "recommended" } = req.query;
    const filter = { shop: req.params.shopId, isAvailable: true };

    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    const sortMap = {
      recommended: { bestseller: -1, rating: -1, createdAt: -1 },
      price_low_to_high: { price: 1 },
      price_high_to_low: { price: -1 },
      prep_time: { prepTimeMins: 1, rating: -1 },
    };

    const items = await RestaurantItemModel.find(filter)
      .sort(sortMap[sortBy] || sortMap.recommended)
      .lean();

    const enrichedItems = items.map((item) => {
      const finalPrice = Math.max(
        Math.round(
          item.price - (item.price * (item.discountPercent || 0)) / 100,
        ),
        0,
      );
      return {
        ...item,
        finalPrice,
      };
    });

    return res.json({ success: true, data: enrichedItems });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const searchItems = async (req, res) => {
  try {
    const q = req.query.q || "";
    const items = await RestaurantItemModel.find({
      name: { $regex: q, $options: "i" },
      isAvailable: true,
    }).limit(25);
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};
