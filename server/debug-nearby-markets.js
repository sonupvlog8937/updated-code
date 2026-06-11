import mongoose from "mongoose";
import dotenv from "dotenv";
import Market from "./models/market.model.js";
import { haversineKm } from "./services/goMarket.service.js";

dotenv.config();

const debugNearbyMarkets = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const markets = await Market.find({ status: "active" }).lean();
    console.log(`📊 Total active markets: ${markets.length}\n`);

    // Check which markets have valid coordinates
    const marketsWithCoords = markets.filter(
      (m) => m.latitude != null && m.longitude != null && !isNaN(m.latitude) && !isNaN(m.longitude)
    );
    const marketsWithoutCoords = markets.filter(
      (m) => !m.latitude || !m.longitude || isNaN(m.latitude) || isNaN(m.longitude)
    );

    console.log(`✅ Markets with valid coordinates: ${marketsWithCoords.length}`);
    console.log(`❌ Markets WITHOUT valid coordinates: ${marketsWithoutCoords.length}\n`);

    if (marketsWithoutCoords.length > 0) {
      console.log("Markets missing coordinates:");
      marketsWithoutCoords.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.name}`);
        console.log(`     Latitude: ${m.latitude}, Longitude: ${m.longitude}`);
      });
      console.log();
    }

    // Test distance calculation with first market
    if (marketsWithCoords.length > 0) {
      const testMarket = marketsWithCoords[0];
      const testLat = 28.7041; // Delhi coordinates
      const testLng = 77.1025;

      console.log(`\n📍 Testing distance calculation from Delhi (${testLat}, ${testLng}):`);
      console.log(`   To: ${testMarket.name} (${testMarket.latitude}, ${testMarket.longitude})`);

      const distance = haversineKm(testLat, testLng, testMarket.latitude, testMarket.longitude);
      console.log(`   Distance: ${distance.toFixed(2)} km\n`);

      // Sort all markets by distance
      const sorted = marketsWithCoords
        .map((m) => ({
          ...m,
          distanceKm: Number(haversineKm(testLat, testLng, m.latitude, m.longitude).toFixed(2))
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 10);

      console.log("Top 10 nearest markets from Delhi:");
      sorted.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.name} - ${m.distanceKm} km away`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

debugNearbyMarkets();
