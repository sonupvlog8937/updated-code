import ShopOwner from "../models/shopOwner.model.js";
import { normalizeSpecifications } from "./productSpecs.js";
import GroceryShop from "../models/groceryShop.model.js";
import GroceryProduct from "../models/groceryProduct.model.js";
import Restaurant from "../models/restaurant.model.js";
import RestaurantMenu from "../models/restaurantMenu.model.js";
import RestaurantItem from "../models/restaurantItem.model.js";

const normalizedImages = (entity = {}) => {
  const list = Array.isArray(entity.images) ? entity.images.filter(Boolean) : [];
  if (entity.image && !list.includes(entity.image)) list.unshift(entity.image);
  return [...new Set(list)];
};

export const getSellerOwnerIds = async (userId, email) => {
  const owners = await ShopOwner.find({
    $or: [{ userId }, { email }],
  }).select("_id").lean();
  return owners.map((owner) => owner._id);
};

export const getSellerGroceryShop = async (userId, email) => {
  const ownerIds = await getSellerOwnerIds(userId, email);
  if (!ownerIds.length) return null;
  return GroceryShop.findOne({ ownerId: { $in: ownerIds } }).lean();
};

export const getSellerRestaurant = async (userId, email) => {
  const ownerIds = await getSellerOwnerIds(userId, email);
  if (!ownerIds.length) return null;
  return Restaurant.findOne({ ownerId: { $in: ownerIds } }).lean();
};

export const getOrCreateDefaultRestaurantMenu = async (restaurantId) => {
  let menu = await RestaurantMenu.findOne({ restaurantId }).sort({ createdAt: 1 });
  if (!menu) {
    menu = await RestaurantMenu.create({
      restaurantId,
      menuName: "Main Menu",
      description: "Default menu",
    });
  }
  return menu;
};

export const mapGroceryProductToAdminProduct = (product) => ({
  _id: product._id,
  name: product.name,
  title: product.title || "",
  specifications: normalizeSpecifications(product.specifications),
  productOptions: product.productOptions || [],
  description: product.description || "",
  images: normalizedImages(product),
  price: product.price,
  oldPrice: product.discountPrice || product.price,
  countInStock: product.stock ?? 0,
  isFeatured: product.isFeatured || false,
  categoryId: product.categoryId?._id || product.categoryId || null,
  subCategoryId: product.subCategoryId?._id || product.subCategoryId || null,
  shopId: product.shopId?._id || product.shopId,
  isGoMarketProduct: true,
  goMarketKind: "grocery",
});

export const mapRestaurantItemToAdminProduct = (item) => ({
  _id: item._id,
  name: item.itemName,
  title: item.title || "",
  specifications: normalizeSpecifications(item.specifications),
  productOptions: item.productOptions || [],
  description: item.description || "",
  images: normalizedImages(item),
  price: item.price,
  oldPrice: item.discountPrice || item.price,
  countInStock: item.isAvailable === false ? 0 : 999,
  isAvailable: item.isAvailable !== false,
  isFeatured: item.isFeatured || false,
  categoryId: item.categoryId?._id || item.categoryId || null,
  subCategoryId: item.subCategoryId?._id || item.subCategoryId || null,
  restaurantId: item.restaurantId?._id || item.restaurantId,
  menuId: item.menuId?._id || item.menuId,
  isGoMarketProduct: true,
  goMarketKind: "restaurant",
});

export const bumpGroceryShopProductCount = async (shopId, delta) => {
  if (!shopId || !delta) return;
  await GroceryShop.findByIdAndUpdate(shopId, { $inc: { totalProducts: delta } });
};

export const assertSellerOwnsGroceryProduct = async (productId, userId, email) => {
  const shop = await getSellerGroceryShop(userId, email);
  if (!shop) return null;
  const product = await GroceryProduct.findOne({ _id: productId, shopId: shop._id });
  return product ? { product, shop } : null;
};

export const assertSellerOwnsRestaurantItem = async (itemId, userId, email) => {
  const restaurant = await getSellerRestaurant(userId, email);
  if (!restaurant) return null;
  const item = await RestaurantItem.findOne({ _id: itemId, restaurantId: restaurant._id });
  return item ? { item, restaurant } : null;
};
