import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

/* ── Types ── */
export interface Product {
  _id?: string;
  name?: string;
  images?: string[];
  price?: number;
  oldPrice?: number;
  discount?: number;
  brand?: string;
  rating?: number;
  numReviews?: number;
  countInStock?: number;
  soldCount?: number;
  totalSales?: number;
  description?: string;
}

export interface ProductsData {
  products?: Product[];
  totalPages?: number;
  total?: number;
  filterOptions?: {
    brands?: string[];
    sizes?: string[];
    productTypes?: string[];
    weights?: string[];
    ramOptions?: string[];
    colors?: string[];
  };
}

export interface FilterState {
  selectedBrands: string[];
  selectedSizes: string[];
  selectedProductTypes: string[];
  selectedPriceRanges: string[];
  selectedSaleOnly: boolean;
  selectedStockStatus: string;
  selectedDiscountRanges: number[];
  selectedWeights: string[];
  selectedRamOptions: string[];
  selectedColors: string[];
  selectedRatingBands: number[];
  sortType: string;
  page: number;
}

export interface ProductsState {
  productsData: ProductsData | null;
  allProducts: Product[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMorePages: boolean;
  error: string | null;
  filters: FilterState;
  totalPages: number;
  totalCount: number;
}

const initialState: ProductsState = {
  productsData: null,
  allProducts: [],
  isLoading: false,
  isRefreshing: false,
  hasMorePages: true,
  error: null,
  filters: {
    selectedBrands: [],
    selectedSizes: [],
    selectedProductTypes: [],
    selectedPriceRanges: [],
    selectedSaleOnly: false,
    selectedStockStatus: "all",
    selectedDiscountRanges: [],
    selectedWeights: [],
    selectedRamOptions: [],
    selectedColors: [],
    selectedRatingBands: [],
    sortType: "bestseller",
    page: 1,
  },
  totalPages: 1,
  totalCount: 0,
};

/* ── Async Thunks ── */
interface FetchProductsParams {
  catId?: string;
  subCatId?: string;
  thirdLavelCatId?: string;
  searchQuery?: string;
  filters: FilterState;
  append?: boolean;
}

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (
    {
      catId,
      subCatId,
      thirdLavelCatId,
      searchQuery,
      filters,
      append = false,
    }: FetchProductsParams,
    { rejectWithValue },
  ) => {
    try {
      const payload = {
        catId: catId ? [catId] : [],
        subCatId: subCatId ? [subCatId] : [],
        thirdsubCatId: thirdLavelCatId ? [thirdLavelCatId] : [],
        brands: filters.selectedBrands.length > 0 ? filters.selectedBrands : [],
        sizes: filters.selectedSizes.length > 0 ? filters.selectedSizes : [],
        productTypes:
          filters.selectedProductTypes.length > 0
            ? filters.selectedProductTypes
            : [],
        priceRanges:
          filters.selectedPriceRanges.length > 0
            ? filters.selectedPriceRanges
            : [],
        saleOnly: filters.selectedSaleOnly,
        stockStatus: filters.selectedStockStatus,
        discountRanges:
          filters.selectedDiscountRanges.length > 0
            ? filters.selectedDiscountRanges
            : [],
        weights:
          filters.selectedWeights.length > 0 ? filters.selectedWeights : [],
        ramOptions:
          filters.selectedRamOptions.length > 0
            ? filters.selectedRamOptions
            : [],
        colors: filters.selectedColors.length > 0 ? filters.selectedColors : [],
        ratingBands:
          filters.selectedRatingBands.length > 0
            ? filters.selectedRatingBands
            : [],
        sortType: filters.sortType,
        query: searchQuery?.trim() || "",
        page: filters.page,
        limit: 20,
      };

      const fullUrl = `${API_URL}/api/product/filters`;

      console.log("📡 Fetching products:", {
        query: searchQuery,
        page: filters.page,
        sort: filters.sortType,
        activeFilters: Object.keys(payload).filter((k) => {
          const v = payload[k as keyof typeof payload];
          return Array.isArray(v) ? v.length > 0 : v;
        }).length,
      });

      const res = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("❌ API Error:", res.status, res.statusText);
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("✅ API Response:", {
        productsCount: data?.products?.length || 0,
        totalPages: data?.totalPages || 1,
        total: data?.total || 0,
      });

      return {
        data: data as ProductsData,
        append: append,
      };
    } catch (error) {
      console.error("🔴 Fetch error:", error);
      return rejectWithValue(
        (error as Error).message || "Failed to fetch products",
      );
    }
  },
);

/* ── Slice ── */
const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setSelectedBrands: (state, action: PayloadAction<string[]>) => {
      state.filters.selectedBrands = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedSizes: (state, action: PayloadAction<string[]>) => {
      state.filters.selectedSizes = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedProductTypes: (state, action: PayloadAction<string[]>) => {
      state.filters.selectedProductTypes = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedPriceRanges: (state, action: PayloadAction<string[]>) => {
      state.filters.selectedPriceRanges = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedSaleOnly: (state, action: PayloadAction<boolean>) => {
      state.filters.selectedSaleOnly = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedStockStatus: (state, action: PayloadAction<string>) => {
      state.filters.selectedStockStatus = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedDiscountRanges: (state, action: PayloadAction<number[]>) => {
      state.filters.selectedDiscountRanges = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedWeights: (state, action: PayloadAction<string[]>) => {
      state.filters.selectedWeights = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedRamOptions: (state, action: PayloadAction<string[]>) => {
      state.filters.selectedRamOptions = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedColors: (state, action: PayloadAction<string[]>) => {
      state.filters.selectedColors = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSelectedRatingBands: (state, action: PayloadAction<number[]>) => {
      state.filters.selectedRatingBands = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setSortType: (state, action: PayloadAction<string>) => {
      state.filters.sortType = action.payload;
      state.filters.page = 1;
      state.allProducts = [];
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
    },
    nextPage: (state) => {
      if (state.filters.page < state.totalPages) {
        state.filters.page += 1;
      }
    },
    previousPage: (state) => {
      if (state.filters.page > 1) {
        state.filters.page -= 1;
      }
    },
    goToPage: (state, action: PayloadAction<number>) => {
      const pageNum = action.payload;
      if (pageNum >= 1 && pageNum <= state.totalPages) {
        state.filters.page = pageNum;
      }
    },
    resetPagination: (state) => {
      state.filters.page = 1;
      state.allProducts = [];
    },
    resetAllFilters: (state) => {
      state.filters = {
        ...initialState.filters,
        sortType: state.filters.sortType,
      };
      state.allProducts = [];
    },
    setIsRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;

        const shouldAppend = action.payload.append === true;
        const oldCount = state.allProducts.length;
        const newCount = action.payload.data?.products?.length || 0;

        console.log("📊 Redux UPDATE:", {
          shouldAppend,
          oldCount,
          newCount,
          page: state.filters.page,
        });

        if (shouldAppend) {
          // APPEND: Keep old + add new
          const newProducts = action.payload.data?.products || [];
          state.allProducts = [...state.allProducts, ...newProducts];
          console.log("✅ APPENDED - Total now:", state.allProducts.length);
        } else {
          // REPLACE: Fresh search
          state.allProducts = action.payload.data?.products || [];
          console.log("✅ REPLACED - Total now:", state.allProducts.length);
        }

        state.productsData = action.payload.data;
        state.totalPages = action.payload.data?.totalPages || 1;
        state.totalCount = action.payload.data?.total || 0;
        state.hasMorePages = state.filters.page < state.totalPages;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to fetch products";
        if (state.filters.page === 1) {
          state.allProducts = [];
        }
      });
  },
});

export const {
  setSelectedBrands,
  setSelectedSizes,
  setSelectedProductTypes,
  setSelectedPriceRanges,
  setSelectedSaleOnly,
  setSelectedStockStatus,
  setSelectedDiscountRanges,
  setSelectedWeights,
  setSelectedRamOptions,
  setSelectedColors,
  setSelectedRatingBands,
  setSortType,
  setPage,
  nextPage,
  previousPage,
  goToPage,
  resetPagination,
  resetAllFilters,
  setIsRefreshing,
} = productsSlice.actions;

export default productsSlice.reducer;
