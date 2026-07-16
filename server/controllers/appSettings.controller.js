import AppSettings from "../models/appSettings.model.js";

const DEFAULTS = {
  key: "commerce",
  shippingFee: 0,
  deliveryFee: 0,
  freeShippingAbove: 0,
  goMarketShippingFee: 0,
  goMarketDeliveryFeePerKm: 0,
  goMarketRiderFeePerKm: 0,
  goMarketRiderPickupFee: 0,
  collections: []
};

const getSettingsDoc = () =>
  AppSettings.findOneAndUpdate(
    { key: "commerce" },
    { $setOnInsert: DEFAULTS },
    { new: true, upsert: true, runValidators: true }
  ).lean();

export const getCommerceSettings = async (_req, res) => {
  try {
    const settings = await getSettingsDoc();
    console.log("📦 Commerce Settings Fetched:", settings);
    res.json({ error: false, success: true, data: settings });
  } catch (error) {
    console.error("❌ Error fetching commerce settings:", error);
    res.status(500).json({ error: true, success: false, message: error.message || error });
  }
};

export const updateCommerceSettings = async (req, res) => {
  try {
    const patch = {};

    // Update fees
     ["shippingFee", "deliveryFee", "freeShippingAbove", "goMarketShippingFee", "goMarketDeliveryFeePerKm", "goMarketRiderFeePerKm", "goMarketRiderPickupFee"].forEach((key) => {
      if (req.body[key] !== undefined) {
        patch[key] = Math.max(0, Number(req.body[key]) || 0);
      }
    });

    // Update collections
    if (Array.isArray(req.body.collections)) {
      patch.collections = req.body.collections
        .map((c, index) => ({
          title: String(c.title || "").trim(),
          type: String(c.type || "mixed"),
          categoryId: String(c.categoryId || ""),
          image: String(c.image || ""),
          sortOrder: Number(c.sortOrder ?? index) || 0,
          isActive: c.isActive !== false
        }))
        .filter((c) => c.title);
    }

    console.log("💾 Updating commerce settings with:", patch);

    const settings = await AppSettings.findOneAndUpdate(
      { key: "commerce" },
      { $set: patch, $setOnInsert: { key: "commerce" } },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    console.log("✅ Commerce settings updated:", settings);

    res.json({
      error: false,
      success: true,
      message: "Commerce settings updated",
      data: settings
    });
  } catch (error) {
    console.error("❌ Error updating commerce settings:", error);
    res.status(400).json({ error: true, success: false, message: error.message || error });
  }
};
