import SearchSynonymModel from "../models/searchSynonym.model.js";

export const searchSynonymRepository = {
  create: (data) => SearchSynonymModel.create(data),

  findAll: ({ language = null, category = null, isActive = true } = {}) => {
    const query = { isActive };
    if (language) query.language = language;
    if (category) query.category = category;
    return SearchSynonymModel.find(query).sort({ priority: -1, createdAt: -1 }).lean();
  },

  findById: (id) => SearchSynonymModel.findById(id).lean(),

  findByGroup: (group) => SearchSynonymModel.findOne({ group, isActive: true }).lean(),

  findByTerm: (term) => {
    const { normalizeSearchText } = require("../utils/searchEngine.js");
    const normalized = normalizeSearchText(term);
    return SearchSynonymModel.find({ normalizedTerms: normalized, isActive: true }).lean();
  },

  update: (id, data) => SearchSynonymModel.findByIdAndUpdate(id, data, { new: true }).lean(),

  delete: (id) => SearchSynonymModel.findByIdAndDelete(id).lean(),

  activate: (id) => SearchSynonymModel.findByIdAndUpdate(id, { isActive: true }, { new: true }).lean(),

  deactivate: (id) => SearchSynonymModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean(),

  getAllActiveTerms: async () => {
    const synonyms = await SearchSynonymModel.find({ isActive: true }).lean();
    const allTerms = new Map();
    for (const synonym of synonyms) {
      for (const term of synonym.normalizedTerms) {
        const others = synonym.normalizedTerms.filter((t) => t !== term);
        const existing = allTerms.get(term) || [];
        allTerms.set(term, [...new Set([...existing, ...others])]);
      }
    }
    return allTerms;
  },

  bulkCreate: async (synonyms) => {
    return await SearchSynonymModel.insertMany(synonyms);
  },

  bulkUpdate: async (updates) => {
    const operations = updates.map((update) => ({
      updateOne: {
        filter: { _id: update._id },
        update: { $set: update.data },
      },
    }));
    return await SearchSynonymModel.bulkWrite(operations);
  },
};

export default searchSynonymRepository;
