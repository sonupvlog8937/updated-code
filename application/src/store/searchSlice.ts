import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchDataFromApi, postData, deleteData, API_URL } from "@/src/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SearchProduct {
  _id?: string;
  name: string;
  highlightedName?: string;
  brand?: string;
  image?: string;
  price?: number;
  discount?: number;
  source?: string;
}

export interface SearchCategory {
  _id?: string;
  name: string;
  highlightedName?: string;
  image?: string;
  type?: string;
}

export interface SearchBrand {
  name: string;
  highlightedName?: string;
}

export interface RecentSearchItem {
  keyword: string;
  searchedAt?: string;
}

export interface SearchState {
  search: string;
  loading: boolean;
  suggestionsLoading: boolean;
  suggestions: string[];
  recentSearches: RecentSearchItem[];
  topSearches: string[];
  trending: string[];
  products: SearchProduct[];
  categories: SearchCategory[];
  brands: SearchBrand[];
  shops: Array<{ _id?: string; name: string; type?: string }>;
  related: SearchProduct[];
  popular: SearchProduct[];
  popularCategories: SearchCategory[];
  popularBrands: SearchBrand[];
  didYouMean: string | null;
  totalProducts: number;
  page: number;
  totalPages: number;
  error: string | null;
  isDropdownOpen: boolean;
}

const initialState: SearchState = {
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
  popularCategories: [],
  popularBrands: [],
  didYouMean: null,
  totalProducts: 0,
  page: 1,
  totalPages: 0,
  error: null,
  isDropdownOpen: false,
};

const getMobileHeaders = async () => {
  const token = await AsyncStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
    "X-Platform": "android",
  };
};

let suggestionsAbort: AbortController | null = null;

export const fetchSearchSuggestions = createAsyncThunk(
  "search/fetchSuggestions",
  async (query: string, { rejectWithValue }) => {
    try {
      if (suggestionsAbort) suggestionsAbort.abort();
      suggestionsAbort = new AbortController();

      const trimmed = query.trim();
      const url = trimmed
        ? `/api/search/suggestions?q=${encodeURIComponent(trimmed)}&limit=10`
        : `/api/search/suggestions`;

      console.log('🌐 API Request:', `${API_URL}${url}`);

      const headers = await getMobileHeaders();
      const response = await fetch(`${API_URL}${url}`, {
        headers,
        signal: suggestionsAbort.signal,
      });
      const data = await response.json();
      
      console.log('✅ API Response:', {
        suggestions: data.suggestions?.length || 0,
        products: data.products?.length || 0,
        brands: data.brands?.length || 0,
        categories: data.categories?.length || 0,
      });
      
      if (!response.ok) throw new Error(data.message || "Failed to fetch suggestions");
      return data;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.log('⚠️ Request aborted (new request started)');
        return rejectWithValue(null);
      }
      console.error('❌ API Error:', error?.message);
      return rejectWithValue(error?.message || "Failed to fetch suggestions");
    }
  },
);

export const fetchSearchDefaults = createAsyncThunk(
  "search/fetchDefaults",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchDataFromApi("/api/search");
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to load defaults");
    }
  },
);

export const performSearch = createAsyncThunk(
  "search/performSearch",
  async (
    { query, page = 1, limit = 20 }: { query: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) return rejectWithValue("Please enter a search query");

      const params = new URLSearchParams({
        q: trimmed,
        page: String(page),
        limit: String(limit),
        platform: "android",
      });

      return await fetchDataFromApi(`/api/search?${params}`);
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to perform search");
    }
  },
);

export const loadRecentSearches = createAsyncThunk(
  "search/loadRecent",
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        const data = await fetchDataFromApi("/api/search/recent");
        return data?.recentSearches || [];
      }

      const saved = await AsyncStorage.getItem("recent_searches_mobile");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed)
        ? parsed.map((k: string) => ({ keyword: k }))
        : [];
    } catch {
      return [];
    }
  },
);

export const saveRecentSearch = createAsyncThunk(
  "search/saveRecent",
  async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      await postData("/api/search/history", { keyword: trimmed, resultCount: 0 });
      const data = await fetchDataFromApi("/api/search/recent");
      return data?.recentSearches || [];
    }

    const saved = await AsyncStorage.getItem("recent_searches_mobile");
    const parsed = saved ? JSON.parse(saved) : [];
    const recent: string[] = Array.isArray(parsed) ? parsed : [];
    const updated = [trimmed, ...recent.filter((i) => i !== trimmed)].slice(0, 20);
    await AsyncStorage.setItem("recent_searches_mobile", JSON.stringify(updated));
    return updated.map((k) => ({ keyword: k }));
  },
);

export const clearRecentSearches = createAsyncThunk(
  "search/clearRecent",
  async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      await deleteData("/api/search/recent/all");
    } else {
      await AsyncStorage.setItem("recent_searches_mobile", "[]");
    }
    return [];
  },
);

export const removeFromRecentSearches = createAsyncThunk(
  "search/removeRecent",
  async (keyword: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      const result = await deleteData(`/api/search/recent?keyword=${encodeURIComponent(keyword)}`);
      return result?.data?.recentSearches || [];
    }

    const saved = await AsyncStorage.getItem("recent_searches_mobile");
    const parsed = saved ? JSON.parse(saved) : [];
    const recent: string[] = Array.isArray(parsed) ? parsed : [];
    const updated = recent.filter((i) => i !== keyword);
    await AsyncStorage.setItem("recent_searches_mobile", JSON.stringify(updated));
    return updated.map((k) => ({ keyword: k }));
  },
);

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setIsDropdownOpen: (state, action: PayloadAction<boolean>) => {
      state.isDropdownOpen = action.payload;
    },
    clearSearchQuery: (state) => {
      state.search = "";
      state.suggestions = [];
      state.products = [];
      state.didYouMean = null;
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.products = [];
      state.totalProducts = 0;
      state.search = "";
      state.related = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
        state.error = null;
        // Clear old suggestions when new request starts
        // This ensures UI shows loading state without old suggestions
        state.suggestions = [];
        state.products = [];
        state.categories = [];
        state.brands = [];
        state.didYouMean = null;
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        if (!action.payload) return;
        
        console.log('📦 Redux State Updated:', {
          suggestions: action.payload.suggestions?.length || 0,
          products: action.payload.products?.length || 0,
          brands: action.payload.brands?.length || 0,
          categories: action.payload.categories?.length || 0,
        });
        
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
      .addCase(fetchSearchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        // Only set error if it's NOT an abort (abort payload is null)
        if (action.payload && action.payload !== null) {
          state.error = action.payload as string;
        }
        // When aborted, suggestions are already cleared in pending
        // so no need to do anything else
      })

      .addCase(fetchSearchDefaults.fulfilled, (state, action) => {
        state.topSearches =
          action.payload?.topSearches?.map((t: { keyword?: string }) => t.keyword || t) ||
          action.payload?.trending ||
          [];
        state.trending = action.payload?.trending || [];
        state.popularCategories = action.payload?.popularCategories || [];
        state.popularBrands = action.payload?.popularBrands || [];
        state.popular = action.payload?.popularProducts || [];
        if (action.payload?.recentSearches?.length) {
          state.recentSearches = action.payload.recentSearches;
        }
      })

      .addCase(performSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload?.products || [];
        state.totalProducts = action.payload?.totalProducts || 0;
        state.page = action.payload?.page || 1;
        state.totalPages = action.payload?.totalPages || 0;
        state.categories = action.payload?.categories || [];
        state.brands = action.payload?.brands || [];
        state.shops = action.payload?.shops || [];
        state.related = action.payload?.related || [];
        state.didYouMean = action.payload?.didYouMean || null;
        state.isDropdownOpen = false;
        if (action.payload?.recentSearches?.length) {
          state.recentSearches = action.payload.recentSearches;
        }
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(loadRecentSearches.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      })
      .addCase(saveRecentSearch.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      })
      .addCase(clearRecentSearches.fulfilled, (state) => {
        state.recentSearches = [];
      })
      .addCase(removeFromRecentSearches.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      });
  },
});

export const {
  setSearchQuery,
  setIsDropdownOpen,
  clearSearchQuery,
  clearSearchResults,
} = searchSlice.actions;

export default searchSlice.reducer;
