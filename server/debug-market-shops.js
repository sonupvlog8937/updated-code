import mongoose from "mongoose";
import dotenv from "dotenv";
import Market from "./models/market.model.js";
import GroceryShop from "./models/groceryShop.model.js";
import Restaurant from "./models/restaurant.model.js";

dotenv.config();

const checkMarketShops = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all markets
    const markets = await Market.find().lean();
    console.log(`📍 Total Markets: ${markets.length}`);
    markets.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name} (${m.city}) - ID: ${m._id}`);
    });

    console.log("\n🛒 Grocery Shops:");
    const shops = await GroceryShop.find().lean();
    console.log(`Total: ${shops.length}`);
    shops.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.shopName}`);
      console.log(`     marketId: ${s.marketId}`);
      console.log(`     marketId type: ${typeof s.marketId}`);
      console.log(`     isOpen: ${s.isOpen}`);
    });

    console.log("\n🍽️ Restaurants:");
    const restaurants = await Restaurant.find().lean();
    console.log(`Total: ${restaurants.length}`);
    restaurants.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.restaurantName}`);
      console.log(`     marketId: ${r.marketId}`);
      console.log(`     marketId type: ${typeof r.marketId}`);
      console.log(`     isOpen: ${r.isOpen}`);
    });

    // Check if marketIds match
    console.log("\n🔍 Checking marketId matches:");
    if (markets.length > 0) {
      const firstMarket = markets[0];
      console.log(`\nChecking for market: ${firstMarket.name} (${firstMarket._id})`);
      
      const matchingShops = shops.filter(s => String(s.marketId) === String(firstMarket._id));
      const matchingRestaurants = restaurants.filter(r => String(r.marketId) === String(firstMarket._id));
      
      console.log(`  Matching shops: ${matchingShops.length}`);
      console.log(`  Matching restaurants: ${matchingRestaurants.length}`);
      
      if (matchingShops.length === 0 && shops.length > 0) {
        console.log("\n⚠️ WARNING: Shops exist but marketId doesn't match!");
        console.log(`  Market ID: ${firstMarket._id}`);
        console.log(`  Shop marketIds: ${shops.map(s => s.marketId).join(", ")}`);
      }
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkMarketShops();
