import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchDataFromApi } from "../utils/api";

export interface Specification {
  key: string;
  value: string;
}

export interface ColorOption {
  name: string;
  images?: string[];
  price?: number;
  oldPrice?: number;
}

export interface StyleOption {
  name: string;
  images?: string[];
  price?: number;
  oldPrice?: number;
}

export interface Seller {
  _id: string;
  name?: string;
  storeProfile?: {
    storeName?: string;
  };
}

export interface Product {
  _id: string;
  name?: string;
  description?: string;
  images?: string[];
  catName?: string;
  catId?: string;
  subCat?: string;
  subCatId?: string;
  thirdsubCat?: string;
  thirdsubCatId?: string;
  specifications?: Specification[];
  seller?: Seller | string;
  price?: number;
  oldPrice?: number;
  rating?: number;
  countInStock?: number;
  brand?: string;
  discount?: number;
  colorOptions?: ColorOption[];
  styleOptions?: StyleOption[];
  size?: string[];
  productRam?: string[];
  productWeight?: string[];
  productAge?: string[];
  sizePriceMap?: Record<string, { price: number; oldPrice?: number }>;
  priceVariants?: Array<{ size?: string; label?: string; name?: string; price: number; oldPrice?: number }>;
  [key: string]: any;
}

export interface Review {
  _id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  [key: string]: any;
}

export interface SellerData {
  total: number;
  preview: Product[];
}

export interface ProductDetailsState {
  // Main product
  currentProduct: Product | null;
  isLoadingProduct: boolean;
  productError: string | null;

  // Related products
  relatedProducts: Product[];
  isLoadingRelated: boolean;
  hasMoreRelated: boolean;
  relatedPage: number;
  relatedPageSize: number;

  // Seller info
  sellerInfo: SellerData;
  isLoadingSeller: boolean;

  // Reviews
  reviews: Review[];
  reviewsCount: number;
  isLoadingReviews: boolean;
  reviewsPage: number;

  // UI state
  activeImages: string[];
  visibleSpecifications: number;
}

const initialState: ProductDetailsState = {
  currentProduct: null,
  isLoadingProduct: false,
  productError: null,

  relatedProducts: [],
  isLoadingRelated: false,
  hasMoreRelated: false,
  relatedPage: 1,
  relatedPageSize: 10,

  sellerInfo: { total: 0, preview: [] },
  isLoadingSeller: false,

  reviews: [],
  reviewsCount: 0,
  isLoadingReviews: false,
  reviewsPage: 1,

  activeImages: [],
  visibleSpecifications: 5,
};

// ── Async Thunks ──

export const fetchProductDetails = createAsyncThunk(
  "productDetails/fetchProduct",
  async (productId: string, { rejectWithValue }) => {
    try {
      const res: any = await fetchDataFromApi(`/api/product/${productId}`);
      if (res?.error !== false) {
        return rejectWithValue(res?.message || "Failed to fetch product");
      }
      return res?.product || null;
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error fetching product");
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk(
  "productDetails/fetchRelated",
  async (
    {
      subCatId,
      productId,
      page = 1,
      perPage = 10,
    }: { subCatId: string; productId: string; page?: number; perPage?: number },
    { rejectWithValue }
  ) => {
    try {
      const res: any = await fetchDataFromApi(
        `/api/product/getAllProductsBySubCatId/${subCatId}?page=${page}&perPage=${perPage}`
      );
      if (res?.error !== false) {
        return rejectWithValue(res?.message || "Failed to fetch related products");
      }
      const filtered: Product[] = (res?.products || []).filter(
        (item: Product) => item?._id !== productId
      );
      return {
        products: filtered,
        hasMore: (res?.products || []).length === perPage,
        page,
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error fetching related products");
    }
  }
);

export const fetchSellerInfo = createAsyncThunk(
  "productDetails/fetchSeller",
  async (
    {
      sellerId,
      productId,
      thirdsubCatId,
    }: { sellerId: string; productId: string; thirdsubCatId?: string },
    { rejectWithValue }
  ) => {
    try {
      const res: any = await fetchDataFromApi(
        `/api/product/store/${sellerId}?limit=6&page=1&thirdLavelCatId=${thirdsubCatId || ""}`
      );
      if (res?.error !== false && res?.success !== true) {
        return rejectWithValue("Failed to fetch seller info");
      }
      return {
        total: res?.total || 0,
        preview: ((res?.products || [])
          .filter((item: Product) => String(item?._id) !== String(productId))
          .slice(0, 5)) as Product[],
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error fetching seller info");
    }
  }
);

export const fetchReviewsCount = createAsyncThunk(
  "productDetails/fetchReviewsCount",
  async (productId: string, { rejectWithValue }) => {
    try {
      const res: any = await fetchDataFromApi(
        `/api/user/getReviews?productId=${productId}`
      );
      if (res?.error !== false) {
        return rejectWithValue("Failed to fetch reviews");
      }
      return res?.reviews?.length || 0;
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error fetching reviews");
    }
  }
);

export const fetchReviews = createAsyncThunk(
  "productDetails/fetchReviews",
  async (
    {
      productId,
      page = 1,
      limit = 10,
    }: { productId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res: any = await fetchDataFromApi(
        `/api/user/getReviews?productId=${productId}&page=${page}&limit=${limit}`
      );
      if (res?.error !== false) {
        return rejectWithValue("Failed to fetch reviews");
      }
      return {
        reviews: res?.reviews || [],
        hasMore: (res?.reviews || []).length === limit,
        page,
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error fetching reviews");
    }
  }
);

// ── Slice ──

const productDetailsSlice = createSlice({
  name: "productDetails",
  initialState,
  reducers: {
    setActiveImages: (state, action: PayloadAction<string[]>) => {
      state.activeImages = action.payload;
    },
    setVisibleSpecifications: (state, action: PayloadAction<number>) => {
      state.visibleSpecifications = action.payload;
    },
    resetProductDetails: (state) => {
      state.currentProduct = null;
      state.relatedProducts = [];
      state.sellerInfo = { total: 0, preview: [] };
      state.reviews = [];
      state.reviewsCount = 0;
      state.activeImages = [];
      state.visibleSpecifications = 5;
      state.relatedPage = 1;
      state.reviewsPage = 1;
      state.productError = null;
    },
    seedProductData: (state, action: PayloadAction<Product>) => {
      state.currentProduct = action.payload;
      state.activeImages = action.payload?.images || [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Product
    builder
      .addCase(fetchProductDetails.pending, (state) => {
        state.isLoadingProduct = true;
        state.productError = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.isLoadingProduct = false;
        state.currentProduct = action.payload;
        state.activeImages = action.payload?.images || [];
        state.productError = null;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.isLoadingProduct = false;
        state.productError = action.payload as string;
      });

    // Fetch Related Products
    builder
      .addCase(fetchRelatedProducts.pending, (state) => {
        state.isLoadingRelated = true;
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.isLoadingRelated = false;
        const { products, hasMore, page } = action.payload;
        if (page === 1) {
          state.relatedProducts = products;
        } else {
          const seen = new Set(state.relatedProducts.map((p) => p?._id));
          state.relatedProducts = [
            ...state.relatedProducts,
            ...products.filter((p) => !seen.has(p?._id)),
          ];
        }
        state.hasMoreRelated = hasMore;
        state.relatedPage = page;
      })
      .addCase(fetchRelatedProducts.rejected, (state) => {
        state.isLoadingRelated = false;
      });

    // Fetch Seller Info
    builder
      .addCase(fetchSellerInfo.pending, (state) => {
        state.isLoadingSeller = true;
      })
      .addCase(fetchSellerInfo.fulfilled, (state, action) => {
        state.isLoadingSeller = false;
        state.sellerInfo = action.payload;
      })
      .addCase(fetchSellerInfo.rejected, (state) => {
        state.isLoadingSeller = false;
      });

    // Fetch Reviews Count
    builder
      .addCase(fetchReviewsCount.pending, (state) => {
        state.isLoadingReviews = true;
      })
      .addCase(fetchReviewsCount.fulfilled, (state, action) => {
        state.isLoadingReviews = false;
        state.reviewsCount = action.payload;
      })
      .addCase(fetchReviewsCount.rejected, (state) => {
        state.isLoadingReviews = false;
      });

    // Fetch Reviews
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.isLoadingReviews = true;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.isLoadingReviews = false;
        const { reviews, hasMore, page } = action.payload;
        if (page === 1) {
          state.reviews = reviews;
        } else {
          state.reviews = [...state.reviews, ...reviews];
        }
        state.reviewsPage = page;
      })
      .addCase(fetchReviews.rejected, (state) => {
        state.isLoadingReviews = false;
      });
  },
});

export const {
  setActiveImages,
  setVisibleSpecifications,
  resetProductDetails,
  seedProductData,
} = productDetailsSlice.actions;

export default productDetailsSlice.reducer;
