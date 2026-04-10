import NotificationSettingModel from "../models/notificationSetting.model.js";

const getOrCreateSettings = async (userId) => {
  let settings = await NotificationSettingModel.findOne({ userId });
  if (!settings) {
    settings = await NotificationSettingModel.create({ userId });
  }
  return settings;
};

export const getNotificationSettingsController = async (request, response) => {
  try {
    const settings = await getOrCreateSettings(request.userId);
    return response.status(200).json({ success: true, error: false, data: settings });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};

export const updateNotificationSettingsController = async (request, response) => {
  try {
    const allowedFields = [
      "orderUpdates",
      "offersAndCoupons",
      "sellerProgram",
      "productUpdates",
      "pushEnabled",
      "emailEnabled",
    ];

    const updates = Object.fromEntries(
      Object.entries(request.body || {}).filter(([key]) => allowedFields.includes(key))
    );

    const settings = await NotificationSettingModel.findOneAndUpdate(
      { userId: request.userId },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return response.status(200).json({
      success: true,
      error: false,
      message: "Notification settings updated",
      data: settings,
    });
  } catch (error) {
    return response.status(500).json({ success: false, error: true, message: error.message || error });
  }
};