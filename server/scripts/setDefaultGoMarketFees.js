/**
 * Script to set default Go Market fees in app settings
 * Run this once to initialize Go Market shipping and delivery fees
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import AppSettings from "../models/appSettings.model.js";

dotenv.config();

const DEFAULT_GO_MARKET_FEES = {
  goMarketShippingFee: 25,        // ₹25 flat shipping fee
  goMarketDeliveryFeePerKm: 8,    // ₹8 per kilometer
  freeShippingAbove: 500,         // Free shipping if order > ₹500
};

async function setDefaultGoMarketFees() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/zeedaddy");
    console.log("✅ Connected to MongoDB");

    console.log("\n📝 Updating Go Market fee settings...");
    
    // Find or create commerce settings
    let settings = await AppSettings.findOne({ key: "commerce" });
    
    if (!settings) {
      console.log("⚠️  Commerce settings not found, creating new...");
      settings = await AppSettings.create({
        key: "commerce",
        ...DEFAULT_GO_MARKET_FEES
      });
      console.log("✅ Created new commerce settings with Go Market fees");
    } else {
      // Update existing settings
      settings.goMarketShippingFee = DEFAULT_GO_MARKET_FEES.goMarketShippingFee;
      settings.goMarketDeliveryFeePerKm = DEFAULT_GO_MARKET_FEES.goMarketDeliveryFeePerKm;
      settings.freeShippingAbove = DEFAULT_GO_MARKET_FEES.freeShippingAbove;
      await settings.save();
      console.log("✅ Updated existing commerce settings with Go Market fees");
    }

    console.log("\n💰 Go Market Fee Settings:");
    console.log(`   Shipping Fee: ₹${settings.goMarketShippingFee}`);
    console.log(`   Delivery Fee: ₹${settings.goMarketDeliveryFeePerKm}/km`);
    console.log(`   Free Shipping Above: ₹${settings.freeShippingAbove}`);
    
    console.log("\n📊 Example Calculations:");
    const examples = [
      { distance: 2, subtotal: 200 },
      { distance: 4.5, subtotal: 450 },
      { distance: 3, subtotal: 600 },
    ];
    
    examples.forEach(({ distance, subtotal }) => {
      const shipping = subtotal >= settings.freeShippingAbove ? 0 : settings.goMarketShippingFee;
      const delivery = subtotal >= settings.freeShippingAbove ? 0 : Math.round(settings.goMarketDeliveryFeePerKm * distance);
      const total = subtotal + shipping + delivery;
      
      console.log(`\n   Distance: ${distance} km | Subtotal: ₹${subtotal}`);
      console.log(`   → Shipping: ₹${shipping}`);
      console.log(`   → Delivery: ₹${delivery}`);
      console.log(`   → Total: ₹${total}`);
      if (subtotal >= settings.freeShippingAbove) {
        console.log(`   ✨ FREE (order > ₹${settings.freeShippingAbove})`);
      }
    });

    console.log("\n✅ Done! Go Market fees are now configured.");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

setDefaultGoMarketFees();
