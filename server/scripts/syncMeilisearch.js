import mongoose from 'mongoose';
import ProductModel from '../models/product.modal.js';
import CategoryModel from '../models/category.modal.js';
import {
  syncProductsToMeilisearch,
  syncCategoriesToMeilisearch,
  syncBrandsToMeilisearch,
} from '../services/meilisearch.service.js';
import { initializeMeilisearch, checkMeilisearchHealth } from '../config/meilisearch.config.js';

/**
 * Sync MongoDB data to Meilisearch
 * Run this script to populate Meilisearch indexes
 */

const BATCH_SIZE = 1000;

async function syncProducts() {
  try {
    console.log('📦 Starting products sync...');

    const totalProducts = await ProductModel.countDocuments({ isActive: { $ne: false } });
    console.log(`Found ${totalProducts} products to sync`);

    let synced = 0;
    let batch = 0;

    while (synced < totalProducts) {
      const products = await ProductModel.find({ isActive: { $ne: false } })
        .skip(synced)
        .limit(BATCH_SIZE)
        .lean();

      if (products.length === 0) break;

      await syncProductsToMeilisearch(products);
      synced += products.length;
      batch++;

      console.log(
        `✅ Synced batch ${batch}: ${synced}/${totalProducts} products (${Math.round(
          (synced / totalProducts) * 100,
        )}%)`,
      );
    }

    console.log(`✅ Products sync completed: ${synced} products indexed`);
  } catch (error) {
    console.error('❌ Error syncing products:', error);
    throw error;
  }
}

async function syncCategories() {
  try {
    console.log('📁 Starting categories sync...');

    const categories = await CategoryModel.find({ status: { $ne: 'inactive' } }).lean();
    console.log(`Found ${categories.length} categories to sync`);

    await syncCategoriesToMeilisearch(categories);
    console.log(`✅ Categories sync completed: ${categories.length} categories indexed`);
  } catch (error) {
    console.error('❌ Error syncing categories:', error);
    throw error;
  }
}

async function syncBrands() {
  try {
    console.log('🏷️ Starting brands sync...');

    const brands = await ProductModel.distinct('brand', { brand: { $ne: '' } });
    console.log(`Found ${brands.length} brands to sync`);

    await syncBrandsToMeilisearch(brands);
    console.log(`✅ Brands sync completed: ${brands.length} brands indexed`);
  } catch (error) {
    console.error('❌ Error syncing brands:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Meilisearch sync process...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check Meilisearch health
    console.log('🔍 Checking Meilisearch health...');
    const isHealthy = await checkMeilisearchHealth();
    if (!isHealthy) {
      throw new Error('Meilisearch is not available. Please start Meilisearch server.');
    }
    console.log('✅ Meilisearch is healthy\n');

    // Initialize Meilisearch indexes
    console.log('⚙️ Initializing Meilisearch indexes...');
    await initializeMeilisearch();
    console.log('✅ Indexes initialized\n');

    // Sync data
    await syncProducts();
    console.log('');
    await syncCategories();
    console.log('');
    await syncBrands();

    console.log('\n✅ All data synced successfully!');
    console.log('🎉 Meilisearch is ready for lightning-fast searches!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
main();
