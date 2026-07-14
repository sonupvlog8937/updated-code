/**
 * Cleanup Script: Remove cart items with deleted products
 * 
 * Problem: Cart has items referencing deleted products
 * Solution: Remove invalid cart items to clean up database
 * 
 * Run: node server/scripts/cleanupDeletedCartItems.js
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

async function cleanupDeletedCartItems() {
  try {
    console.log('🧹 Starting Cart Cleanup...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all cart items
    const allCartItems = await CartProductModel.find({});
    console.log(`📊 Total cart items: ${allCartItems.length}\n`);
    
    if (allCartItems.length === 0) {
      console.log('✅ No cart items to process!');
      process.exit(0);
    }
    
    let deleted = 0;
    let valid = 0;
    
    for (const item of allCartItems) {
      try {
        // Check if product exists
        const product = await ProductModel.findById(item.productId);
        
        if (!product) {
          console.log(`🗑️  Deleting: ${item.productTitle}`);
          console.log(`   Cart Item ID: ${item._id}`);
          console.log(`   Product ID: ${item.productId} (DELETED)`);
          
          await CartProductModel.deleteOne({ _id: item._id });
          deleted++;
        } else {
          valid++;
        }
        
      } catch (error) {
        console.log(`❌ Error processing item: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 CLEANUP SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Valid items: ${valid}`);
    console.log(`🗑️  Deleted items: ${deleted}`);
    console.log(`📦 Total processed: ${allCartItems.length}`);
    console.log('='.repeat(50) + '\n');
    
    if (deleted > 0) {
      console.log('🎉 Cart cleaned up! Invalid items removed.\n');
    } else {
      console.log('✨ Cart is clean! No invalid items found.\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
cleanupDeletedCartItems();
