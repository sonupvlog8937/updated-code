import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, required: true },
    images:      [{ type: String, required: true }],
    brand:       { type: String, default: "" },
    price:       { type: Number, default: 0 },
    oldPrice:    { type: Number, default: 0 },
    catName:     { type: String, default: "" },
    catId:       { type: String, default: "" },
    subCatId:    { type: String, default: "" },
    subCat:      { type: String, default: "" },
    thirdsubCat:   { type: String, default: "" },
    thirdsubCatId: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    seller:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    countInStock: { type: Number, required: true },
    rating:       { type: Number, default: 0 },
    isFeatured:   { type: Boolean, default: false },
    discount:     { type: Number, required: true },
    sale:         { type: Number, default: 0 },
    productRam:    [{ type: String, default: null }],
    size:          [{ type: String, default: null }],
    productWeight: [{ type: String, default: null }],
    keywords:      [{ type: String, default: "" }],
    colorOptions: [
      {
        name:   { type: String, default: "" },
        code:   { type: String, default: "" },
        images: [{ type: String }],
      },
    ],
    specifications: [
      {
        key:   { type: String, default: "" },
        value: { type: String, default: "" },
      },
    ],
    bannerimages:          [{ type: String, required: true }],
    bannerTitleName:       { type: String, default: "" },
    isDisplayOnHomeBanner: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE INDEXES
// Bina index MongoDB har query pe POORA collection scan karta hai.
// Ye indexes server restart pe auto-create hote hain.
// ═══════════════════════════════════════════════════════════════════

// --- Single-field indexes (most used filter fields) ---
productSchema.index({ catId: 1 });
productSchema.index({ subCatId: 1 });
productSchema.index({ thirdsubCatId: 1 });
productSchema.index({ catName: 1 });
productSchema.index({ subCat: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isDisplayOnHomeBanner: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ sale: -1 });
productSchema.index({ discount: -1 });

// --- Compound indexes (filter + sort saath hona) ---
productSchema.index({ seller: 1, createdAt: -1 });   // seller dashboard
productSchema.index({ seller: 1, catId: 1 });         // seller store filter
productSchema.index({ catId: 1, createdAt: -1 });     // cat listing page
productSchema.index({ subCatId: 1, createdAt: -1 });
productSchema.index({ thirdsubCatId: 1, createdAt: -1 });
productSchema.index({ catId: 1, price: 1 });          // price filter inside category

// --- Text index for search ---
productSchema.index(
  { name: "text", brand: "text", catName: "text", subCat: "text", thirdsubCat: "text", keywords: "text" },
  { weights: { name: 10, brand: 5, keywords: 5, catName: 3, subCat: 2, thirdsubCat: 1 }, name: "product_text_search" },
);

const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;