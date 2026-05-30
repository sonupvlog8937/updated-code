import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchDataFromApi } from "../utils/api";
import { showToast } from "../utils/toast";

export interface SellerProduct {
  _id: string;
  name: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string;
  rating?: number;
  countInStock: number;
  brand?: string;
  size?: string;
  color?: string;
  weight?: string;
  ram?: string;
  [key: string]: any;
}

export interface SellerProfile {
  storeName?: string;
  storeLogo?: string;
  storeBanner?: string;
  description?: string;
  location?: string;
  contactNo?: string;
  [key: string]: any;
}

export interface FilterOptions {
  brands: string[];
  sizes: string[];
  colors: string[];
  ramOptions: string[];
  weights: string[];
}

export interface RatingStats {
  avg: number;
  breakdown: Record<number, number>;
  totalReviews: number;
}

export interface Category {
  _id: string;
  name: string;
  total?: number;
}

export interface SellerStoreState {
  products: SellerProduct[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  sellerProfile: SellerProfile | null;
  categories: Category[];
  filterOptions: FilterOptions;
  ratingStats: RatingStats;
  meta: {
    total: number;
    totalPages: number;
  };
  currentPage: number;
  sortBy: string;
  filters: {
    search: string;
    categoryId: string;
    minPrice: string;
    maxPrice: string;
    minRating: string;
    brands: string[];
    colors: string[];
    sizes: string[];
    ramOptions: string[];
    weights: string[];
    discountMin: string;
  };
}

const initialState: SellerStoreState = {
  products: [],
  loading: true,
  loadingMore: false,
  refreshing: false,
  sellerProfile: null,
  categories: [],
  filterOptions: {
    brands: [],
    sizes: [],
    colors: [],
    ramOptions: [],
    weights: [],
  },
  ratingStats: {
    avg: 0,
    breakdown: {},
    totalReviews: 0,
  },
  meta: {
    total: 0,
    totalPages: 1,
  },
  currentPage: 1,
  sortBy: "latest",
  filters: {
    search: "",
    categoryId: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    brands: [],
    colors: [],
    sizes: [],
    ramOptions: [],
    weights: [],
    discountMin: "",
  },
};

// Async Thunks
export const fetchSellerStore = createAsyncThunk(
  "sellerStore/fetchStore",
  async (
    {
      sellerId,
      page = 1,
      append = false,
    }: { sellerId: string; page?: number; append?: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as any;
      const filters = state.sellerStore.filters;
      const sortBy = state.sellerStore.sortBy;

      const query = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        ...(filters.search && { search: filters.search }),
        ...(filters.categoryId && { catId: filters.categoryId }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.minRating && { minRating: filters.minRating }),
        ...(filters.brands.length && { brands: filters.brands.join(",") }),
        ...(filters.colors.length && { colors: filters.colors.join(",") }),
        ...(filters.sizes.length && { sizes: filters.sizes.join(",") }),
        ...(filters.ramOptions.length && {
          ramOptions: filters.ramOptions.join(","),
        }),
        ...(filters.weights.length && { weights: filters.weights.join(",") }),
        ...(filters.discountMin && { discountMin: filters.discountMin }),
      });

      const res = await fetchDataFromApi(
        `/api/product/store/${sellerId}?${query.toString()}`
      );

      if (res?.success) {
        return {
          products: res.products || [],
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          categories: res.categories || [],
          filterOptions: res.filterOptions || {},
          ratingStats: res.ratingStats || {},
          append,
          page,
        };
      } else {
        return rejectWithValue(res?.message || "Failed to fetch products");
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || "Network error");
    }
  }
);

export const fetchSellerProfile = createAsyncThunk(
  "sellerStore/fetchProfile",
  async (sellerId: string, { rejectWithValue }) => {
    try {
      const res = await fetchDataFromApi(
        `/api/user/seller/store-profile/${sellerId}`
      );

      if (res?.success) {
        return res?.seller?.storeProfile || null;
      } else {
        return rejectWithValue(res?.message || "Failed to fetch profile");
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || "Network error");
    }
  }
);

// Slice
const sellerStoreSlice = createSlice({
  name: "sellerStore",
  initialState,
  reducers: {
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
      state.currentPage = 1;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.currentPage = 1;
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.filters.categoryId = action.payload;
      state.currentPage = 1;
    },
    setPriceRange: (
      state,
      action: PayloadAction<{ min: string; max: string }>
    ) => {
      state.filters.minPrice = action.payload.min;
      state.filters.maxPrice = action.payload.max;
      state.currentPage = 1;
    },
    setMinRating: (state, action: PayloadAction<string>) => {
      state.filters.minRating = action.payload;
      state.currentPage = 1;
    },
    setDiscountMin: (state, action: PayloadAction<string>) => {
      state.filters.discountMin = action.payload;
      state.currentPage = 1;
    },
    toggleBrandFilter: (state, action: PayloadAction<string>) => {
      const brand = action.payload;
      const index = state.filters.brands.indexOf(brand);
      if (index > -1) {
        state.filters.brands.splice(index, 1);
      } else {
        state.filters.brands.push(brand);
      }
      state.currentPage = 1;
    },
    toggleColorFilter: (state, action: PayloadAction<string>) => {
      const color = action.payload;
      const index = state.filters.colors.indexOf(color);
      if (index > -1) {
        state.filters.colors.splice(index, 1);
      } else {
        state.filters.colors.push(color);
      }
      state.currentPage = 1;
    },
    toggleSizeFilter: (state, action: PayloadAction<string>) => {
      const size = action.payload;
      const index = state.filters.sizes.indexOf(size);
      if (index > -1) {
        state.filters.sizes.splice(index, 1);
      } else {
        state.filters.sizes.push(size);
      }
      state.currentPage = 1;
    },
    toggleRamFilter: (state, action: PayloadAction<string>) => {
      const ram = action.payload;
      const index = state.filters.ramOptions.indexOf(ram);
      if (index > -1) {
        state.filters.ramOptions.splice(index, 1);
      } else {
        state.filters.ramOptions.push(ram);
      }
      state.currentPage = 1;
    },
    toggleWeightFilter: (state, action: PayloadAction<string>) => {
      const weight = action.payload;
      const index = state.filters.weights.indexOf(weight);
      if (index > -1) {
        state.filters.weights.splice(index, 1);
      } else {
        state.filters.weights.push(weight);
      }
      state.currentPage = 1;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.sortBy = "latest";
      state.currentPage = 1;
    },
    clearProducts: (state) => {
      state.products = [];
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    // Fetch Store
    builder
      .addCase(fetchSellerStore.pending, (state, action) => {
        const append = (action.meta.arg as any)?.append || false;
        if (!append) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(fetchSellerStore.fulfilled, (state, action) => {
        const { products, total, totalPages, categories, filterOptions, ratingStats, append, page } =
          action.payload;

        if (append) {
          state.products.push(...products);
          state.currentPage = page;
        } else {
          state.products = products;
          state.currentPage = 1;
        }

        state.meta.total = total;
        state.meta.totalPages = totalPages;
        state.categories = categories;
        state.filterOptions = filterOptions;
        state.ratingStats = ratingStats;
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
      })
      .addCase(fetchSellerStore.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
        showToast("error", (action.payload as string) || "Failed to load products");
      });

    // Fetch Profile
    builder
      .addCase(fetchSellerProfile.fulfilled, (state, action) => {
        state.sellerProfile = action.payload;
      })
      .addCase(fetchSellerProfile.rejected, (state) => {
        state.sellerProfile = null;
      });
  },
});

export const {
  setCurrentPage,
  setSortBy,
  setSearch,
  setCategoryFilter,
  setPriceRange,
  setMinRating,
  setDiscountMin,
  toggleBrandFilter,
  toggleColorFilter,
  toggleSizeFilter,
  toggleRamFilter,
  toggleWeightFilter,
  resetFilters,
  clearProducts,
} = sellerStoreSlice.actions;

export default sellerStoreSlice.reducer;
