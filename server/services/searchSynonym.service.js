/**
 * Search synonym groups service — in-memory store with DB-ready pattern.
 */

let synonymStore = [
  { _id: "1", group: "cold_drink", terms: ["cold drink", "pepsi", "sprite", "coca cola", "soft drink", "soda"], language: "en", category: "beverages", priority: 1, isActive: true },
  { _id: "2", group: "milk", terms: ["milk", "doodh", "dudh", "दूध"], language: "all", category: "dairy", priority: 1, isActive: true },
  { _id: "3", group: "biscuit", terms: ["biscuit", "cookie", "crackers"], language: "en", category: "snacks", priority: 1, isActive: true },
  { _id: "4", group: "chips", terms: ["chips", "lays", "wafer", "crisps"], language: "en", category: "snacks", priority: 1, isActive: true },
];

export const getAllSynonymGroups = async ({ language, category } = {}) => {
  let results = synonymStore;
  if (language) results = results.filter((s) => s.language === language || s.language === "all");
  if (category) results = results.filter((s) => s.category === category);
  return results;
};

export const getSynonymGroupById = async (id) =>
  synonymStore.find((s) => s._id === String(id)) || null;

export const createSynonymGroup = async ({ group, terms = [], language = "en", category = "general", priority = 1 }) => {
  if (!group || !terms.length) throw new Error("group and terms are required");
  if (synonymStore.some((s) => s.group === group)) throw new Error("Synonym group already exists");
  const entry = {
    _id: String(Date.now()),
    group, terms, language, category, priority,
    isActive: true,
    createdAt: new Date(),
  };
  synonymStore.push(entry);
  return entry;
};

export const updateSynonymGroup = async (id, data) => {
  const entry = synonymStore.find((s) => s._id === String(id));
  if (!entry) throw new Error("Synonym group not found");
  Object.assign(entry, data);
  return entry;
};

export const deleteSynonymGroup = async (id) => {
  const idx = synonymStore.findIndex((s) => s._id === String(id));
  if (idx === -1) throw new Error("Synonym group not found");
  const [deleted] = synonymStore.splice(idx, 1);
  return deleted;
};

export const toggleSynonymGroup = async (id, isActive) => {
  const entry = synonymStore.find((s) => s._id === String(id));
  if (!entry) throw new Error("Synonym group not found");
  entry.isActive = Boolean(isActive);
  return entry;
};

export const bulkImportSynonyms = async (synonyms = []) => {
  const results = [];
  for (const item of synonyms) {
    try {
      const entry = await createSynonymGroup(item).catch(() => null);
      if (entry) results.push(entry);
    } catch { /* skip duplicates */ }
  }
  return results;
};

/** Get active synonym terms for a query — used by search engine */
export const getActiveSynonyms = async (query = "") => {
  const q = query.toLowerCase().trim();
  const matches = [];
  for (const group of synonymStore) {
    if (!group.isActive) continue;
    if (group.terms.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()))) {
      matches.push(...group.terms);
    }
  }
  return [...new Set(matches)];
};

/**
 * expandSynonyms — alias used by searchSynonyms.js
 * Returns expanded synonym terms for a given query.
 */
export const expandSynonyms = async (query = "") => {
  return getActiveSynonyms(query);
};

/**
 * getSynonymMatch — alias used by searchSynonyms.js
 * Returns the matched synonym group label or null.
 */
export const getSynonymMatch = async (query = "") => {
  const q = query.toLowerCase().trim();
  for (const group of synonymStore) {
    if (!group.isActive) continue;
    if (group.terms.some((t) => t.toLowerCase() === q || q.includes(t.toLowerCase()))) {
      return group.group;
    }
  }
  return null;
};

export default {
  getAllSynonymGroups, getSynonymGroupById, createSynonymGroup,
  updateSynonymGroup, deleteSynonymGroup, toggleSynonymGroup,
  bulkImportSynonyms, getActiveSynonyms,
};
