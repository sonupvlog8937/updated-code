import ProductModel from '../models/product.modal.js';
import CategoryModel from '../models/category.modal.js';
import { INDEXES } from '../config/meilisearch.config.js';
import {
  indexDocument,
  updateDocument,
  deleteDocument,
  syncProductsToMeilisearch,
  syncCategoriesToMeilisearch,
} from './meilisearch.service.js';

/**
 * Real-time Meilisearch Sync Service
 * Keeps Meilisearch in sync with MongoDB using change streams
 */

let productWatcher = null;
let categoryWatcher = null;

/**
 * Map MongoDB product to Meilisearch document
 */
const mapProductToMeiliDoc = (product) => ({
  _id: product._id.toString(),
  name: product.name || '',
  brand: product.brand || '',
  description: product.description || '',
  keywords: product.keywords || [],
  catName: product.catName || '',
  subCat: product.subCat || '',
  thirdsubCat: product.thirdsubCat || '',
  title: product.title || '',
  searchKeywords: product.searchKeywords || [],
  price: Number(product.price) || 0,
  oldPrice: Number(product.oldPrice) || 0,
  discount: Number(product.discount) || 0,
  rating: Number(product.rating) || 0,
  countInStock: Number(product.countInStock) || 0,
  sale: Number(product.sale) || 0,
  isFeatured: Boolean(product.isFeatured),
  isActive: product.isActive !== false,
  images: product.images || [],
  createdAt: product.createdAt || new Date(),
});

/**
 * Map MongoDB category to Meilisearch document
 */
const mapCategoryToMeiliDoc = (category) => ({
  _id: category._id.toString(),
  name: category.name || '',
  description: category.description || '',
  image: category.images?.[0] || '',
  status: category.status || 'active',
  type: category.type || 'category',
  createdAt: category.createdAt || new Date(),
});

/**
 * Start watching products collection for changes
 */
export const startProductWatcher = () => {
  try {
    if (productWatcher) {
      console.log('⚠️ Product watcher already running');
      return;
    }

    console.log('👀 Starting product change stream watcher...');

    productWatcher = ProductModel.watch([], {
      fullDocument: 'updateLookup',
    });

    productWatcher.on('change', async (change) => {
      try {
        switch (change.operationType) {
          case 'insert': {
            const doc = mapProductToMeiliDoc(change.fullDocument);
            await indexDocument(INDEXES.PRODUCTS, doc);
            console.log(`✅ Indexed new product: ${doc.name}`);
            break;
          }

          case 'update':
          case 'replace': {
            if (change.fullDocument) {
              const doc = mapProductToMeiliDoc(change.fullDocument);
              await updateDocument(INDEXES.PRODUCTS, doc);
              console.log(`✅ Updated product: ${doc.name}`);
            }
            break;
          }

          case 'delete': {
            await deleteDocument(INDEXES.PRODUCTS, change.documentKey._id.toString());
            console.log(`✅ Deleted product: ${change.documentKey._id}`);
            break;
          }

          default:
            break;
        }
      } catch (error) {
        console.error('❌ Error processing product change:', error);
      }
    });

    productWatcher.on('error', (error) => {
      console.error('❌ Product watcher error:', error);
      // Restart watcher after delay
      setTimeout(() => {
        productWatcher = null;
        startProductWatcher();
      }, 5000);
    });

    console.log('✅ Product watcher started successfully');
  } catch (error) {
    console.error('❌ Failed to start product watcher:', error);
  }
};

/**
 * Start watching categories collection for changes
 */
export const startCategoryWatcher = () => {
  try {
    if (categoryWatcher) {
      console.log('⚠️ Category watcher already running');
      return;
    }

    console.log('👀 Starting category change stream watcher...');

    categoryWatcher = CategoryModel.watch([], {
      fullDocument: 'updateLookup',
    });

    categoryWatcher.on('change', async (change) => {
      try {
        switch (change.operationType) {
          case 'insert': {
            const doc = mapCategoryToMeiliDoc(change.fullDocument);
            await indexDocument(INDEXES.CATEGORIES, doc);
            console.log(`✅ Indexed new category: ${doc.name}`);
            break;
          }

          case 'update':
          case 'replace': {
            if (change.fullDocument) {
              const doc = mapCategoryToMeiliDoc(change.fullDocument);
              await updateDocument(INDEXES.CATEGORIES, doc);
              console.log(`✅ Updated category: ${doc.name}`);
            }
            break;
          }

          case 'delete': {
            await deleteDocument(INDEXES.CATEGORIES, change.documentKey._id.toString());
            console.log(`✅ Deleted category: ${change.documentKey._id}`);
            break;
          }

          default:
            break;
        }
      } catch (error) {
        console.error('❌ Error processing category change:', error);
      }
    });

    categoryWatcher.on('error', (error) => {
      console.error('❌ Category watcher error:', error);
      // Restart watcher after delay
      setTimeout(() => {
        categoryWatcher = null;
        startCategoryWatcher();
      }, 5000);
    });

    console.log('✅ Category watcher started successfully');
  } catch (error) {
    console.error('❌ Failed to start category watcher:', error);
  }
};

/**
 * Stop all watchers
 */
export const stopWatchers = async () => {
  try {
    if (productWatcher) {
      await productWatcher.close();
      productWatcher = null;
      console.log('✅ Product watcher stopped');
    }

    if (categoryWatcher) {
      await categoryWatcher.close();
      categoryWatcher = null;
      console.log('✅ Category watcher stopped');
    }
  } catch (error) {
    console.error('❌ Error stopping watchers:', error);
  }
};

/**
 * Start all watchers
 */
export const startAllWatchers = () => {
  startProductWatcher();
  startCategoryWatcher();
  console.log('🚀 All Meilisearch sync watchers started');
};

/**
 * Full resync (for recovery or initial setup)
 */
export const fullResync = async () => {
  try {
    console.log('🔄 Starting full resync...');

    // Sync products
    const products = await ProductModel.find({ isActive: { $ne: false } }).lean();
    await syncProductsToMeilisearch(products);
    console.log(`✅ Resynced ${products.length} products`);

    // Sync categories
    const categories = await CategoryModel.find({ status: { $ne: 'inactive' } }).lean();
    await syncCategoriesToMeilisearch(categories);
    console.log(`✅ Resynced ${categories.length} categories`);

    console.log('✅ Full resync completed');
  } catch (error) {
    console.error('❌ Full resync failed:', error);
    throw error;
  }
};

export default {
  startProductWatcher,
  startCategoryWatcher,
  stopWatchers,
  startAllWatchers,
  fullResync,
};
