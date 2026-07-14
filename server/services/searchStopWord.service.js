/**
 * Search stop words service — in-memory store with DB-ready pattern.
 */

import { normalizeSearchText } from "../utils/searchEngine.js";

const STATIC_STOP_WORDS = [
  "a", "an", "the", "and", "or", "for", "to", "in", "on", "of", "with", "at", "by",
  "is", "it", "ka", "ke", "ki", "se", "me", "mein", "aur", "ya", "kya", "hai",
];

// In-memory store (replace with DB model when ready)
let stopWordsStore = STATIC_STOP_WORDS.map((w, i) => ({
  _id: String(i + 1),
  word: w,
  normalizedWord: w,
  language: "all",
  isActive: true,
  createdAt: new Date(),
}));

export const loadStopWords = async () => {
  const active = stopWordsStore.filter((s) => s.isActive).map((s) => s.word);
  return new Set([...STATIC_STOP_WORDS, ...active]);
};

export const getAllStopWords = async ({ language } = {}) => {
  if (language) return stopWordsStore.filter((s) => s.language === language || s.language === "all");
  return stopWordsStore;
};

export const getStopWordById = async (id) =>
  stopWordsStore.find((s) => s._id === String(id)) || null;

export const createStopWord = async ({ word, language = "all" }) => {
  const normalized = normalizeSearchText(word);
  if (!normalized) throw new Error("Invalid word");
  if (stopWordsStore.some((s) => s.normalizedWord === normalized)) {
    throw new Error("Stop word already exists");
  }
  const entry = {
    _id: String(Date.now()),
    word: word.trim(),
    normalizedWord: normalized,
    language,
    isActive: true,
    createdAt: new Date(),
  };
  stopWordsStore.push(entry);
  return entry;
};

export const updateStopWord = async (id, data) => {
  const idx = stopWordsStore.findIndex((s) => s._id === String(id));
  if (idx === -1) throw new Error("Stop word not found");
  stopWordsStore[idx] = { ...stopWordsStore[idx], ...data };
  return stopWordsStore[idx];
};

export const deleteStopWord = async (id) => {
  const idx = stopWordsStore.findIndex((s) => s._id === String(id));
  if (idx === -1) throw new Error("Stop word not found");
  const [deleted] = stopWordsStore.splice(idx, 1);
  return deleted;
};

export const toggleStopWord = async (id, isActive) => {
  const entry = stopWordsStore.find((s) => s._id === String(id));
  if (!entry) throw new Error("Stop word not found");
  entry.isActive = Boolean(isActive);
  return entry;
};

export const bulkImportStopWords = async (words = []) => {
  const results = [];
  for (const item of words) {
    try {
      const word = typeof item === "string" ? item : item.word;
      const language = typeof item === "object" ? item.language : "all";
      const entry = await createStopWord({ word, language }).catch(() => null);
      if (entry) results.push(entry);
    } catch { /* skip duplicates */ }
  }
  return results;
};

export default {
  loadStopWords, getAllStopWords, getStopWordById,
  createStopWord, updateStopWord, deleteStopWord,
  toggleStopWord, bulkImportStopWords,
};
