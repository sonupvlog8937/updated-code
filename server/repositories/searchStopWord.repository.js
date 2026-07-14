import SearchStopWordModel from "../models/searchStopWord.model.js";

export const searchStopWordRepository = {
  create: (data) => SearchStopWordModel.create(data),

  findAll: ({ language = null, isActive = true } = {}) => {
    const query = { isActive };
    if (language) query.language = language;
    return SearchStopWordModel.find(query).sort({ frequency: -1, word: 1 }).lean();
  },

  findById: (id) => SearchStopWordModel.findById(id).lean(),

  findByWord: (word) => {
    const { normalizeSearchText } = require("../utils/searchEngine.js");
    const normalized = normalizeSearchText(word);
    return SearchStopWordModel.findOne({ normalizedWord: normalized }).lean();
  },

  update: (id, data) => SearchStopWordModel.findByIdAndUpdate(id, data, { new: true }).lean(),

  delete: (id) => SearchStopWordModel.findByIdAndDelete(id).lean(),

  activate: (id) => SearchStopWordModel.findByIdAndUpdate(id, { isActive: true }, { new: true }).lean(),

  deactivate: (id) => SearchStopWordModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean(),

  getActiveWordsSet: async () => {
    const stopWords = await SearchStopWordModel.find({ isActive: true }).lean();
    return new Set(stopWords.map((sw) => sw.normalizedWord));
  },

  getActiveWordsArray: async () => {
    const stopWords = await SearchStopWordModel.find({ isActive: true }).lean();
    return stopWords.map((sw) => sw.normalizedWord);
  },

  bulkCreate: async (words) => {
    return await SearchStopWordModel.insertMany(words);
  },

  incrementFrequency: async (word) => {
    const { normalizeSearchText } = require("../utils/searchEngine.js");
    const normalized = normalizeSearchText(word);
    return await SearchStopWordModel.findOneAndUpdate(
      { normalizedWord: normalized },
      { $inc: { frequency: 1 } },
      { new: true },
    );
  },
};

export default searchStopWordRepository;
