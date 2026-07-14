/**
 * Search settings service — in-memory store with DB-ready pattern.
 */

const DEFAULT_SETTINGS = [
  { key: "EXACT_WEIGHT",      value: 1000, type: "number", category: "ranking" },
  { key: "STARTS_WITH_WEIGHT",value: 900,  type: "number", category: "ranking" },
  { key: "PREFIX_WEIGHT",     value: 800,  type: "number", category: "ranking" },
  { key: "BRAND_WEIGHT",      value: 700,  type: "number", category: "ranking" },
  { key: "CATEGORY_WEIGHT",   value: 600,  type: "number", category: "ranking" },
  { key: "PRODUCT_WEIGHT",    value: 500,  type: "number", category: "ranking" },
  { key: "SYNONYM_WEIGHT",    value: 400,  type: "number", category: "ranking" },
  { key: "RELATED_WEIGHT",    value: 300,  type: "number", category: "ranking" },
  { key: "POPULAR_WEIGHT",    value: 200,  type: "number", category: "ranking" },
  { key: "TRENDING_WEIGHT",   value: 100,  type: "number", category: "ranking" },
  { key: "SUGGESTIONS_LIMIT", value: 10,   type: "number", category: "general" },
  { key: "SEARCH_LIMIT",      value: 20,   type: "number", category: "general" },
  { key: "FUZZY_TOLERANCE",   value: 2,    type: "number", category: "general" },
];

let settingsStore = DEFAULT_SETTINGS.map((s, i) => ({
  ...s,
  _id: String(i + 1),
  isActive: true,
  createdAt: new Date(),
}));

export const getRankingWeights = async () => ({
  EXACT:       _val("EXACT_WEIGHT",       1000),
  STARTS_WITH: _val("STARTS_WITH_WEIGHT", 900),
  PREFIX:      _val("PREFIX_WEIGHT",      800),
  BRAND:       _val("BRAND_WEIGHT",       700),
  CATEGORY:    _val("CATEGORY_WEIGHT",    600),
  PRODUCT:     _val("PRODUCT_WEIGHT",     500),
  SYNONYM:     _val("SYNONYM_WEIGHT",     400),
  RELATED:     _val("RELATED_WEIGHT",     300),
  POPULAR:     _val("POPULAR_WEIGHT",     200),
  TRENDING:    _val("TRENDING_WEIGHT",    100),
});

const _val = (key, fallback) => {
  const entry = settingsStore.find((s) => s.key === key && s.isActive);
  return entry ? Number(entry.value) : fallback;
};

export const getAllSettings = async ({ category } = {}) => {
  if (category) return settingsStore.filter((s) => s.category === category);
  return settingsStore;
};

export const getSettingsByCategory = async (category) =>
  settingsStore.filter((s) => s.category === category);

export const getSettingById = async (id) =>
  settingsStore.find((s) => s._id === String(id)) || null;

export const createSetting = async (data) => {
  if (settingsStore.some((s) => s.key === data.key)) {
    throw new Error(`Setting '${data.key}' already exists`);
  }
  const entry = { ...data, _id: String(Date.now()), isActive: true, createdAt: new Date() };
  settingsStore.push(entry);
  return entry;
};

export const updateSetting = async (key, data) => {
  const entry = settingsStore.find((s) => s.key === key);
  if (!entry) throw new Error("Setting not found");
  Object.assign(entry, data);
  return entry;
};

export const updateSettingById = async (id, data) => {
  const entry = settingsStore.find((s) => s._id === String(id));
  if (!entry) throw new Error("Setting not found");
  Object.assign(entry, data);
  return entry;
};

export const deleteSetting = async (id) => {
  const idx = settingsStore.findIndex((s) => s._id === String(id));
  if (idx === -1) throw new Error("Setting not found");
  const [deleted] = settingsStore.splice(idx, 1);
  return deleted;
};

export const toggleSetting = async (id, isActive) => {
  const entry = settingsStore.find((s) => s._id === String(id));
  if (!entry) throw new Error("Setting not found");
  entry.isActive = Boolean(isActive);
  return entry;
};

export const bulkUpsertSettings = async (settings = []) => {
  const results = [];
  for (const item of settings) {
    const existing = settingsStore.find((s) => s.key === item.key);
    if (existing) {
      Object.assign(existing, item);
      results.push(existing);
    } else {
      const entry = { ...item, _id: String(Date.now() + results.length), isActive: true, createdAt: new Date() };
      settingsStore.push(entry);
      results.push(entry);
    }
  }
  return results;
};

export const initializeDefaultSettings = async () => {
  settingsStore = DEFAULT_SETTINGS.map((s, i) => ({
    ...s, _id: String(i + 1), isActive: true, createdAt: new Date(),
  }));
  return settingsStore;
};

export default {
  getRankingWeights, getAllSettings, getSettingsByCategory,
  getSettingById, createSetting, updateSetting, updateSettingById,
  deleteSetting, toggleSetting, bulkUpsertSettings, initializeDefaultSettings,
};
