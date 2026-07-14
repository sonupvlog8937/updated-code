import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchDataFromApi, postData, deleteData } from "../utils/api";

let suggestionsAbortController = null;
let searchAbortController = null;

export const fetchSuggestions = createAsyncThunk(
  "search/fetchSuggestions",
  async ({ query = "" } = {}, { rejectWithValue }) => {
    try {
      // Cancel previous request
      if (suggestionsAbortController) suggestionsAbortController.abort();
      suggestionsAbortController = new AbortController();

      const trimmed = query.trim();
      const url = trimmed
        ? `/api/search/suggestions?q=${encodeURIComponent(trimmed)}&limit=10`
        : `/api/search/suggestions`;

      const data = await fetchDataFromApi(url);
      if (!data || data.error) return rejectWithValue(data?.message || "Failed to fetch suggestions");
      return data;
    } catch (error) {
      if (error?.name === "AbortError") return rejectWithValue(null);
      return rejectWithValue(error?.message || "Failed to fetch suggestions");
    }
  },
);

export const performSearch = createAsyncThunk(
  "search/performSearch",
  async ({ query, page = 1, limit = 20, filters = {}, sortBy = "relevance" } = {}, { rejectWithValue }) => {
    try {
      if (searchAbortController) searchAbortController.abort();
      searchAbortController = new AbortController();

      const trimmed = String(query || "").trim();
      if (!trimmed) return rejectWithValue("Query is required");

      const params = new URLSearchParams({
        q: trimmed,
        page: String(page),
        limit: String(limit),
        sortBy,
        platform: "website",
      });

      if (filters.brands?.length) params.set("brands", filters.brands.join(","));
      if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
      if (filters.minDiscount != null) params.set("minDiscount", String(filters.minDiscount));
      if (filters.minRating != null) params.set("minRating", String(filters.minRating));
      if (filters.inStock) params.set("inStock", "true");

      const data = await fetchDataFromApi(`/api/search?${params}`);
      if (!data || data.error) return rejectWithValue(data?.message || "Search failed");
      return { ...data, query: trimmed };
    } catch (error) {
      if (error.name === "AbortError") return rejectWithValue(null);
      return rejectWithValue(error.message || "Search failed");
    }
  },
);

export const fetchSearchDefaults = createAsyncThunk(
  "search/fetchDefaults",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchDataFromApi("/api/search");
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load search defaults");
    }
  },
);

export const fetchTopSearches = createAsyncThunk(
  "search/fetchTopSearches",
  async ({ period = "all", limit = 20 } = {}, { rejectWithValue }) => {
    try {
      return await fetchDataFromApi(`/api/search/top?period=${period}&limit=${limit}`);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch top searches");
    }
  },
);

export const fetchRecentSearches = createAsyncThunk(
  "search/fetchRecentSearches",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { recentSearches: [] };
      return await fetchDataFromApi("/api/search/recent");
    } catch (error) {
      return { recentSearches: [] };
    }
  },
);

export const deleteRecentSearchItem = createAsyncThunk(
  "search/deleteRecent",
  async (keyword, { rejectWithValue }) => {
    try {
      const result = await deleteData(`/api/search/recent?keyword=${encodeURIComponent(keyword)}`);
      return result?.data || { recentSearches: [] };
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to delete");
    }
  },
);

export const clearAllRecentSearches = createAsyncThunk(
  "search/clearRecent",
  async (_, { rejectWithValue }) => {
    try {
      const result = await deleteData("/api/search/recent/all");
      return result?.data || { recentSearches: [] };
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to clear");
    }
  },
);

export const recordSearchHistory = createAsyncThunk(
  "search/recordHistory",
  async ({ keyword, resultCount, clickedProduct, clickedProductType }, { rejectWithValue }) => {
    try {
      await postData("/api/search/history", {
        keyword,
        resultCount,
        clickedProduct,
        clickedProductType,
      });
      return true;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to record history");
    }
  },
);

const initialState = {
  search: "",
  loading: false,
  suggestionsLoading: false,
  suggestions: [],
  recentSearches: [],
  topSearches: [],
  trending: [],
  products: [],
  categories: [],
  brands: [],
  shops: [],
  related: [],
  popular: [],
  didYouMean: null,
  totalProducts: 0,
  page: 1,
  totalPages: 0,
  filterOptions: null,
  popularCategories: [],
  popularBrands: [],
  error: null,
  isDropdownOpen: false,
  activeIndex: -1,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.search = action.payload;
    },
    setIsDropdownOpen: (state, action) => {
      state.isDropdownOpen = action.payload;
    },
    setActiveIndex: (state, action) => {
      state.activeIndex = action.payload;
    },
    clearSearchState: (state) => {
      state.search = "";
      state.suggestions = [];
      state.products = [];
      state.didYouMean = null;
      state.error = null;
      state.activeIndex = -1;
    },
    resetSearchResults: (state) => {
      state.products = [];
      state.totalProducts = 0;
      state.page = 1;
      state.totalPages = 0;
      state.related = [];
      state.didYouMean = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
        state.error = null;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        if (!action.payload) return;
        state.suggestions = action.payload.suggestions || [];
        state.products = action.payload.products || [];
        state.categories = action.payload.categories || [];
        state.brands = action.payload.brands || [];
        state.didYouMean = action.payload.didYouMean || null;
        state.topSearches = action.payload.topSearches || [];
        state.trending = action.payload.trending || [];
        if (action.payload.recentSearches?.length) {
          state.recentSearches = action.payload.recentSearches;
        }
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        if (action.payload && typeof action.payload === "string") state.error = action.payload;
      })

      .addCase(performSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload) return;
        state.search = action.payload.query;
        state.products = action.payload.products || [];
        state.totalProducts = action.payload.totalProducts || 0;
        state.page = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 0;
        state.categories = action.payload.categories || [];
        state.brands = action.payload.brands || [];
        state.shops = action.payload.shops || [];
        state.related = action.payload.related || [];
        state.popular = action.payload.popular || [];
        state.trending = action.payload.trending || [];
        state.didYouMean = action.payload.didYouMean || null;
        state.filterOptions = action.payload.filterOptions || null;
        state.topSearches = action.payload.topSearches || state.topSearches;
        if (action.payload.recentSearches?.length) {
          state.recentSearches = action.payload.recentSearches;
        }
        state.isDropdownOpen = false;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.loading = false;
        if (action.payload) state.error = action.payload;
      })

      .addCase(fetchSearchDefaults.fulfilled, (state, action) => {
        state.topSearches = action.payload?.topSearches?.map((t) => t.keyword || t) || action.payload?.trending || [];
        state.trending = action.payload?.trending || action.payload?.topToday || [];
        state.popularCategories = action.payload?.popularCategories || [];
        state.popularBrands = action.payload?.popularBrands || [];
        state.popular = action.payload?.popularProducts || [];
        if (action.payload?.recentSearches?.length) {
          state.recentSearches = action.payload.recentSearches;
        }
      })

      .addCase(fetchRecentSearches.fulfilled, (state, action) => {
        state.recentSearches = action.payload?.recentSearches || [];
      })

      .addCase(deleteRecentSearchItem.fulfilled, (state, action) => {
        state.recentSearches = action.payload?.recentSearches || [];
      })

      .addCase(clearAllRecentSearches.fulfilled, (state) => {
        state.recentSearches = [];
      });
  },
});

export const {
  setSearchQuery,
  setIsDropdownOpen,
  setActiveIndex,
  clearSearchState,
  resetSearchResults,
} = searchSlice.actions;

export default searchSlice.reducer;
