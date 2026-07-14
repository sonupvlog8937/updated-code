import SearchSettingsModel from "../models/searchSettings.model.js";

export const searchSettingsRepository = {
  create: (data) => SearchSettingsModel.create(data),

  findAll: ({ category = null, isActive = true } = {}) => {
    const query = { isActive };
    if (category) query.category = category;
    return SearchSettingsModel.find(query).sort({ key: 1 }).lean();
  },

  findById: (id) => SearchSettingsModel.findById(id).lean(),

  findByKey: (key) => SearchSettingsModel.findOne({ key, isActive: true }).lean(),

  findByCategory: (category) => SearchSettingsModel.find({ category, isActive: true }).lean(),

  update: (id, data) => SearchSettingsModel.findByIdAndUpdate(id, data, { new: true }).lean(),

  updateByKey: (key, data) => SearchSettingsModel.findOneAndUpdate({ key }, data, { new: true }).lean(),

  delete: (id) => SearchSettingsModel.findByIdAndDelete(id).lean(),

  activate: (id) => SearchSettingsModel.findByIdAndUpdate(id, { isActive: true }, { new: true }).lean(),

  deactivate: (id) => SearchSettingsModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean(),

  getSettingsMap: async () => {
    const settings = await SearchSettingsModel.find({ isActive: true }).lean();
    const settingsMap = new Map();
    for (const setting of settings) {
      settingsMap.set(setting.key, setting.value);
    }
    return settingsMap;
  },

  getRankingWeights: async () => {
    const settings = await SearchSettingsModel.find({ category: "ranking", isActive: true }).lean();
    const weights = {};
    for (const setting of settings) {
      weights[setting.key] = setting.value;
    }
    return weights;
  },

  bulkUpsert: async (settings) => {
    const operations = settings.map((setting) => ({
      updateOne: {
        filter: { key: setting.key },
        update: { $set: setting },
        upsert: true,
      },
    }));
    return await SearchSettingsModel.bulkWrite(operations);
  },
};

export default searchSettingsRepository;
