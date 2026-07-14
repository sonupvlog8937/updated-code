/**
 * Migration Script: Fix Cart Coordinates
 * 
 * Problem: Old cart items don't have shop coordinates
 * Solution: Populate shopLatitude/shopLongitude from seller's storeProfile
 * 
 * Run: node server/scripts/fixCartCoordinates.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import CartProductModel from '../models/cartProduct.modal.js';
import ProductModel from '../models/product.modal.js';
import UserModel from '../models/user.model.js';
import MarketModel from '../models/market.model.js';

async function fixCartCoordinates() {
  try {
    console.log('🔧 Starting Cart Coordinates Fix...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find all cart items without coordinates
    const cartItems = await CartProductModel.find({
      $or: [
        { shopLatitude: { $exists: false } },
        { shopLatitude: null },
        { shopLongitude: { $exists: false } },
        { shopLongitude: null }
      ]
    });
    
    console.log(`📊 Found ${cartItems.length} cart items without coordinates\n`);
    
    if (cartItems.length === 0) {
      console.log('✅ All cart items already have coordinates!');
      process.exit(0);
    }
    
    let updated = 0;
    let failed = 0;
    
    for (const item of cartItems) {
      try {
        console.log(`\n🔍 Processing: ${item.productTitle}`);
        console.log(`   Cart Item ID: ${item._id}`);
        console.log(`   Product ID: ${item.productId}`);
        
        // Fetch product with seller and market details
        const product = await ProductModel.findById(item.productId)
          .populate({
            path: 'seller',
            select: 'storeProfile',
            populate: {
              path: 'storeProfile.marketId',
              select: 'latitude longitude name'
            }
          });
        
        if (!product) {
          console.log(`   ⚠️  Product not found, skipping...`);
          failed++;
          continue;
        }
        
        console.log(`   Product: ${product.name}`);
        
        // Check if seller exists
        if (!product.seller) {
          console.log(`   ⚠️  Seller not found, skipping...`);
          failed++;
          continue;
        }
        
        // Get coordinates from seller's storeProfile
        const storeProfile = product.seller.storeProfile;
        
        if (!storeProfile) {
          console.log(`   ⚠️  Store profile not found, skipping...`);
          failed++;
          continue;
        }
        
        // Check if it's a Go Market shop
        if (storeProfile.marketId) {
          const market = storeProfile.marketId;
          const lat = market.latitude;
          const lng = market.longitude;
          
          if (lat && lng) {
            console.log(`   📍 Market: ${market.name}`);
            console.log(`   📍 Coordinates: ${lat}, ${lng}`);
            
            // Update cart item with coordinates
            await CartProductModel.updateOne(
              { _id: item._id },
              {
                $set: {
                  shopId: product.seller._id,
                  shopLatitude: lat,
                  shopLongitude: lng
                }
              }
            );
            
            console.log(`   ✅ Updated successfully!`);
            updated++;
          } else {
            console.log(`   ⚠️  Market coordinates missing, skipping...`);
            failed++;
          }
        } else {
          console.log(`   ⚠️  Not a Go Market item, skipping...`);
          failed++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing item: ${error.message}`);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully updated: ${updated} items`);
    console.log(`❌ Failed/Skipped: ${failed} items`);
    console.log(`📦 Total processed: ${cartItems.length} items`);
    console.log('='.repeat(50) + '\n');
    
    if (updated > 0) {
      console.log('🎉 Cart coordinates fixed! Users can now checkout with correct distances.\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
fixCartCoordinates();
