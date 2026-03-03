import RestaurantShopModel from "../models/restaurantShop.model.js";

export const createShop = async (req, res) => {
  try {
    const {
      name,
      city,
      address,
      image,
      cuisineTags,
      minOrderAmount,
      deliveryFee,
      avgDeliveryTimeMins,
    } = req.body;

    if (!name || !city || !address) {
      return res
        .status(400)
        .json({
          message: "name, city and address are required",
          success: false,
        });
    }

    const created = await RestaurantShopModel.create({
      owner: req.userId,
      name,
      city,
      address,
      image,
      cuisineTags,
      minOrderAmount,
      deliveryFee,
      avgDeliveryTimeMins,
    });

    return res
      .status(201)
      .json({ success: true, data: created, message: "Shop created" });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const updateShop = async (req, res) => {
  try {
    const shop = await RestaurantShopModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
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
    const city = (req.params.city || "").toLowerCase().trim();
    const {
      q = "",
      cuisine = "",
      minRating = 0,
      sortBy = "recommended",
    } = req.query;

    const filter = { city, isOpen: true };

    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    if (cuisine) {
      filter.cuisineTags = { $in: [String(cuisine).trim()] };
    }

    if (Number(minRating) > 0) {
      filter.rating = { $gte: Number(minRating) };
    }

    const sortMap = {
      recommended: { promoted: -1, rating: -1, totalRatings: -1 },
      rating: { rating: -1, totalRatings: -1 },
      delivery_time: { avgDeliveryTimeMins: 1, rating: -1 },
      cost_low_to_high: { minOrderAmount: 1, deliveryFee: 1 },
    };

    const shops = await RestaurantShopModel.find(filter)
      .sort(sortMap[sortBy] || sortMap.recommended)
      .lean();

    const enrichedShops = shops.map((shop) => ({
      ...shop,
      serviceability: `${shop.avgDeliveryTimeMins}-${shop.avgDeliveryTimeMins + 10} mins`,
      offerText: shop.promoted
        ? "Free delivery on orders above ₹399"
        : "Up to 40% OFF on selected items",
    }));

    return res.json({ success: true, data: enrichedShops });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};
