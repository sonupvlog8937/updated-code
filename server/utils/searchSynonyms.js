/**
 * Synonym groups for intelligent search expansion.
 * Now supports dynamic loading from database with fallback to static array.
 */

import { expandSynonyms as dynamicExpandSynonyms, getSynonymMatch as dynamicGetSynonymMatch } from "../services/searchSynonym.service.js";

// Static fallback synonyms (used if database is empty or unavailable)
const STATIC_SYNONYM_GROUPS = [
  ["cold drink", "soft drink", "soda", "beverage", "pepsi", "sprite", "coca cola", "coke", "fanta", "mirinda", "thums up", "cold drinks"],
  ["milk", "doodh", "dudh", "दूध", "dahi", "curd", "yogurt"],
  ["phone", "mobile", "smartphone", "cellphone", "iphone", "android phone"],
  ["iphone", "apple phone", "apple mobile"],
  ["samsung", "samung", "samsun", "galaxy"],
  ["lays", "layss", "chips", "potato chips", "snacks"],
  ["rice", "chawal", "basmati", "chaval"],
  ["bread", "pav", "roti", "naan"],
  ["water", "paani", "pani", "mineral water", "bisleri"],
  ["tea", "chai", "green tea", "black tea"],
  ["coffee", "cafe", "nescafe"],
  ["oil", "tel", "cooking oil", "mustard oil", "sunflower oil"],
  ["sugar", "cheeni", "shakkar"],
  ["salt", "namak", "iodized salt"],
  ["soap", "sabun", "bathing soap"],
  ["shampoo", "hair wash", "conditioner"],
  ["detergent", "washing powder", "surf", "tide"],
  ["biscuit", "biscuits", "cookies", "parle g", "oreo"],
  ["chocolate", "cadbury", "dairy milk", "kitkat"],
  ["pen", "pencil", "stationery", "notebook"],
  ["medicine", "dawa", "tablet", "capsule", "pharmacy"],
  ["vegetable", "sabzi", "veggies", "fresh vegetables"],
  ["fruit", "fruits", "fresh fruits", "apple", "banana", "mango"],
  ["egg", "eggs", "anda", "andaa"],
  ["chicken", "murgh", "poultry"],
  ["fish", "machli", "seafood"],
  ["pizza", "burger", "fast food", "junk food"],
  ["ice cream", "icecream", "kulfi", "dessert"],
  ["diaper", "diapers", "baby care", "pampers"],
  ["tissue", "tissues", "napkin", "toilet paper"],
  ["battery", "batteries", "cell"],
  ["charger", "cable", "usb cable", "type c"],
  ["watch", "watches", "smartwatch", "wrist watch"],
  ["bag", "handbag", "backpack", "purse"],
  ["shirt", "t shirt", "tshirt", "top", "formal shirt"],
  ["jeans", "denim", "pant", "trouser", "formal pant"],
  ["shoes", "footwear", "sneakers", "sandals"],
  ["amul", "amul milk", "amul butter", "amul cheese"],
  ["nestle", "maggi", "noodles"],
  ["colgate", "toothpaste", "oral care"],
  ["dettol", "antiseptic", "sanitizer"],
];

export const SYNONYM_GROUPS = STATIC_SYNONYM_GROUPS;

/** @type {Map<string, string[]>} */
let synonymIndex = null;

function buildStaticIndex() {
  const index = new Map();
  for (const group of STATIC_SYNONYM_GROUPS) {
    const normalizedGroup = group.map((t) => normalizeSynonymTerm(t));
    for (const term of normalizedGroup) {
      const others = normalizedGroup.filter((t) => t !== term);
      const existing = index.get(term) || [];
      index.set(term, [...new Set([...existing, ...others])]);
    }
  }
  return index;
}

function normalizeSynonymTerm(term) {
  return String(term || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Expand query with synonym terms (dynamic from database with fallback).
 * @param {string} query
 * @returns {Promise<string[]>}
 */
export const expandSynonyms = async (query = "") => {
  try {
    // Try dynamic expansion from database
    const dynamicResult = await dynamicExpandSynonyms(query);
    if (dynamicResult && dynamicResult.length > 0) {
      return dynamicResult;
    }
  } catch (error) {
    // Fallback to static if database fails
    console.warn("Dynamic synonym expansion failed, using static fallback:", error.message);
  }

  // Static fallback
  const normalized = normalizeSynonymTerm(query);
  if (!normalized) return [];

  if (!synonymIndex) synonymIndex = buildStaticIndex();

  const expanded = new Set([normalized]);

  const direct = synonymIndex.get(normalized);
  if (direct) direct.forEach((t) => expanded.add(t));

  for (const [key, values] of synonymIndex.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) {
      expanded.add(key);
      values.forEach((v) => expanded.add(v));
    }
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const tokenSynonyms = synonymIndex.get(token);
    if (tokenSynonyms) tokenSynonyms.forEach((t) => expanded.add(t));
  }

  return Array.from(expanded);
};

/**
 * Resolve synonym-matched label for display (dynamic from database with fallback).
 * @param {string} query
 * @returns {Promise<string|null>}
 */
export const getSynonymMatch = async (query = "") => {
  try {
    // Try dynamic match from database
    const dynamicResult = await dynamicGetSynonymMatch(query);
    if (dynamicResult) return dynamicResult;
  } catch (error) {
    console.warn("Dynamic synonym match failed, using static fallback:", error.message);
  }

  // Static fallback
  const normalized = normalizeSynonymTerm(query);
  if (!synonymIndex) synonymIndex = buildStaticIndex();
  
  if (synonymIndex.has(normalized)) return normalized;
  for (const key of synonymIndex.keys()) {
    if (normalized.includes(key) || key.includes(normalized)) return key;
  }
  return null;
};

// Synchronous versions for backward compatibility (use static only)
export const expandSynonymsSync = (query = "") => {
  const normalized = normalizeSynonymTerm(query);
  if (!normalized) return [];

  if (!synonymIndex) synonymIndex = buildStaticIndex();

  const expanded = new Set([normalized]);

  const direct = synonymIndex.get(normalized);
  if (direct) direct.forEach((t) => expanded.add(t));

  for (const [key, values] of synonymIndex.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) {
      expanded.add(key);
      values.forEach((v) => expanded.add(v));
    }
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const tokenSynonyms = synonymIndex.get(token);
    if (tokenSynonyms) tokenSynonyms.forEach((t) => expanded.add(t));
  }

  return Array.from(expanded);
};

export const getSynonymMatchSync = (query = "") => {
  const normalized = normalizeSynonymTerm(query);
  if (!synonymIndex) synonymIndex = buildStaticIndex();
  
  if (synonymIndex.has(normalized)) return normalized;
  for (const key of synonymIndex.keys()) {
    if (normalized.includes(key) || key.includes(normalized)) return key;
  }
  return null;
};

export default { SYNONYM_GROUPS, expandSynonyms, getSynonymMatch, expandSynonymsSync, getSynonymMatchSync };
