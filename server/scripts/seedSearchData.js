import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import { initializeDefaultSettings } from "../services/searchSettings.service.js";
import { bulkImportSynonyms } from "../services/searchSynonym.service.js";
import { bulkImportStopWords } from "../services/searchStopWord.service.js";

// Default synonyms from static array
const DEFAULT_SYNONYMS = [
  { group: "cold drink", terms: ["cold drink", "soft drink", "soda", "beverage", "pepsi", "sprite", "coca cola", "coke", "fanta", "mirinda", "thums up", "cold drinks"], language: "mixed", category: "product", priority: 10 },
  { group: "milk", terms: ["milk", "doodh", "dudh", "दूध", "dahi", "curd", "yogurt"], language: "mixed", category: "product", priority: 10 },
  { group: "phone", terms: ["phone", "mobile", "smartphone", "cellphone", "iphone", "android phone"], language: "mixed", category: "product", priority: 10 },
  { group: "iphone", terms: ["iphone", "apple phone", "apple mobile"], language: "english", category: "brand", priority: 20 },
  { group: "samsung", terms: ["samsung", "samung", "samsun", "galaxy"], language: "english", category: "brand", priority: 20 },
  { group: "lays", terms: ["lays", "layss", "chips", "potato chips", "snacks"], language: "mixed", category: "brand", priority: 15 },
  { group: "rice", terms: ["rice", "chawal", "basmati", "chaval"], language: "mixed", category: "product", priority: 10 },
  { group: "bread", terms: ["bread", "pav", "roti", "naan"], language: "mixed", category: "product", priority: 10 },
  { group: "water", terms: ["water", "paani", "pani", "mineral water", "bisleri"], language: "mixed", category: "product", priority: 10 },
  { group: "tea", terms: ["tea", "chai", "green tea", "black tea"], language: "mixed", category: "product", priority: 10 },
  { group: "coffee", terms: ["coffee", "cafe", "nescafe"], language: "mixed", category: "product", priority: 10 },
  { group: "oil", terms: ["oil", "tel", "cooking oil", "mustard oil", "sunflower oil"], language: "mixed", category: "product", priority: 10 },
  { group: "sugar", terms: ["sugar", "cheeni", "shakkar"], language: "mixed", category: "product", priority: 10 },
  { group: "salt", terms: ["salt", "namak", "iodized salt"], language: "mixed", category: "product", priority: 10 },
  { group: "soap", terms: ["soap", "sabun", "bathing soap"], language: "mixed", category: "product", priority: 10 },
  { group: "shampoo", terms: ["shampoo", "hair wash", "conditioner"], language: "mixed", category: "product", priority: 10 },
  { group: "detergent", terms: ["detergent", "washing powder", "surf", "tide"], language: "mixed", category: "product", priority: 10 },
  { group: "biscuit", terms: ["biscuit", "biscuits", "cookies", "parle g", "oreo"], language: "mixed", category: "product", priority: 10 },
  { group: "chocolate", terms: ["chocolate", "cadbury", "dairy milk", "kitkat"], language: "mixed", category: "product", priority: 10 },
  { group: "stationery", terms: ["pen", "pencil", "stationery", "notebook"], language: "english", category: "category", priority: 10 },
  { group: "medicine", terms: ["medicine", "dawa", "tablet", "capsule", "pharmacy"], language: "mixed", category: "product", priority: 10 },
  { group: "vegetable", terms: ["vegetable", "sabzi", "veggies", "fresh vegetables"], language: "mixed", category: "category", priority: 10 },
  { group: "fruit", terms: ["fruit", "fruits", "fresh fruits", "apple", "banana", "mango"], language: "mixed", category: "category", priority: 10 },
  { group: "egg", terms: ["egg", "eggs", "anda", "andaa"], language: "mixed", category: "product", priority: 10 },
  { group: "chicken", terms: ["chicken", "murgh", "poultry"], language: "mixed", category: "product", priority: 10 },
  { group: "fish", terms: ["fish", "machli", "seafood"], language: "mixed", category: "product", priority: 10 },
  { group: "fast food", terms: ["pizza", "burger", "fast food", "junk food"], language: "english", category: "category", priority: 10 },
  { group: "ice cream", terms: ["ice cream", "icecream", "kulfi", "dessert"], language: "mixed", category: "product", priority: 10 },
  { group: "diaper", terms: ["diaper", "diapers", "baby care", "pampers"], language: "english", category: "product", priority: 10 },
  { group: "tissue", terms: ["tissue", "tissues", "napkin", "toilet paper"], language: "english", category: "product", priority: 10 },
  { group: "battery", terms: ["battery", "batteries", "cell"], language: "english", category: "product", priority: 10 },
  { group: "charger", terms: ["charger", "cable", "usb cable", "type c"], language: "english", category: "product", priority: 10 },
  { group: "watch", terms: ["watch", "watches", "smartwatch", "wrist watch"], language: "english", category: "product", priority: 10 },
  { group: "bag", terms: ["bag", "handbag", "backpack", "purse"], language: "english", category: "product", priority: 10 },
  { group: "shirt", terms: ["shirt", "t shirt", "tshirt", "top", "formal shirt"], language: "english", category: "product", priority: 10 },
  { group: "jeans", terms: ["jeans", "denim", "pant", "trouser", "formal pant"], language: "english", category: "product", priority: 10 },
  { group: "shoes", terms: ["shoes", "footwear", "sneakers", "sandals"], language: "english", category: "product", priority: 10 },
  { group: "amul", terms: ["amul", "amul milk", "amul butter", "amul cheese"], language: "english", category: "brand", priority: 20 },
  { group: "nestle", terms: ["nestle", "maggi", "noodles"], language: "english", category: "brand", priority: 20 },
  { group: "colgate", terms: ["colgate", "toothpaste", "oral care"], language: "english", category: "brand", priority: 20 },
  { group: "dettol", terms: ["dettol", "antiseptic", "sanitizer"], language: "english", category: "brand", priority: 20 },
];

// Default stop words from static array
const DEFAULT_STOP_WORDS = [
  { word: "a", language: "english" },
  { word: "an", language: "english" },
  { word: "the", language: "english" },
  { word: "and", language: "english" },
  { word: "or", language: "english" },
  { word: "for", language: "english" },
  { word: "to", language: "english" },
  { word: "in", language: "english" },
  { word: "on", language: "english" },
  { word: "of", language: "english" },
  { word: "with", language: "english" },
  { word: "at", language: "english" },
  { word: "by", language: "english" },
  { word: "is", language: "english" },
  { word: "it", language: "english" },
  { word: "ka", language: "hindi" },
  { word: "ke", language: "hindi" },
  { word: "ki", language: "hindi" },
  { word: "se", language: "hindi" },
  { word: "me", language: "hindi" },
  { word: "mein", language: "hindi" },
  { word: "aur", language: "hindi" },
  { word: "ya", language: "hindi" },
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

async function seedSearchData() {
  try {
    console.log("\n🌱 Starting search data seed...\n");

    // Initialize default settings
    console.log("📊 Initializing default search settings...");
    const settings = await initializeDefaultSettings();
    console.log(`✅ Created/updated ${settings.length} default settings\n`);

    // Import default synonyms
    console.log("🔤 Importing default synonyms...");
    const synonyms = await bulkImportSynonyms(DEFAULT_SYNONYMS);
    console.log(`✅ Imported ${synonyms.length} synonym groups\n`);

    // Import default stop words
    console.log("🚫 Importing default stop words...");
    const stopWords = await bulkImportStopWords(DEFAULT_STOP_WORDS);
    console.log(`✅ Imported ${stopWords.length} stop words\n`);

    console.log("🎉 Search data seed completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding search data:", error.message);
    process.exit(1);
  }
}

// Run seed
connectDB().then(seedSearchData);
