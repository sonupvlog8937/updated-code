import mongoose from "mongoose";
import dotenv from "dotenv";
import Market from "./models/market.model.js";
import GroceryShop from "./models/groceryShop.model.js";
import Restaurant from "./models/restaurant.model.js";

dotenv.config();

const testAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const markets = await Market.find({ status: "active" }).lean();
    if (markets.length === 0) {
      console.log("❌ No active markets found!");
      return;
    }

    const market = markets[0];
    const marketId = market._id;
    
    console.log(`Testing API for market: ${market.name}`);
    console.log(`Market ID: ${marketId}\n`);

    // Simulate the API logic
    const type = "all";
    const openOnly = false;

    let outlets = [];

    // Grocery shops
    const groceryFilter = { marketId };
    if (openOnly) groceryFilter.isOpen = true;
    const shops = await GroceryShop.find(groceryFilter).lean();
    console.log(`📦 Found ${shops.length} grocery shops`);
    
    const mappedShops = shops.map((shop) => ({
      _id: shop._id,
      outletType: "grocery",
      displayName: shop.shopName,
      name: shop.shopName,
      banner: shop.shopBanner,
      logo: shop.shopLogo,
      address: shop.address,
      rating: shop.rating || 0,
      followerCount: Array.isArray(shop.followers) ? shop.followers.length : 0,
      isOpen: shop.isOpen !== false,
      totalProducts: shop.totalProducts || 0,
      meta: `${shop.totalProducts || 0} products`,
      createdAt: shop.createdAt,
    }));
    outlets.push(...mappedShops);

    // Restaurants
    const restFilter = { marketId };
    if (openOnly) restFilter.isOpen = true;
    const restaurants = await Restaurant.find(restFilter).lean();
    console.log(`🍽️ Found ${restaurants.length} restaurants`);
    
    const mappedRestaurants = restaurants.map((r) => ({
      _id: r._id,
      outletType: "restaurant",
      displayName: r.restaurantName,
      name: r.restaurantName,
      banner: r.restaurantBanner,
      logo: r.restaurantLogo,
      address: r.address,
      rating: r.rating || 0,
      followerCount: Array.isArray(r.followers) ? r.followers.length : 0,
      isOpen: r.isOpen !== false,
      totalProducts: r.totalItems || 0,
      meta: `${r.totalMenus || 0} menus · ${r.totalItems || 0} dishes`,
      createdAt: r.createdAt,
    }));
    outlets.push(...mappedRestaurants);

    console.log(`\n✅ Total outlets: ${outlets.length}`);
    console.log("\nOutlets:");
    outlets.forEach((o, i) => {
      console.log(`  ${i + 1}. ${o.displayName} (${o.outletType})`);
      console.log(`     Address: ${o.address || "N/A"}`);
      console.log(`     Rating: ${o.rating}`);
      console.log(`     Open: ${o.isOpen}`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testAPI();
