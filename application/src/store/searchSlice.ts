import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchDataFromApi } from "@/src/utils/api";

export interface SearchSuggestion {
  _id?: string;
  name: string;
  brand?: string;
  image?: string;
}

export interface AIInsights {
  summary: string;
  highlights: string[];
  title?: string;
}

export interface SearchResponse {
  suggestions?: string[];
  suggestionProducts?: SearchSuggestion[];
  correctedQuery?: string;
  aiInsights?: AIInsights;
}

export interface SearchState {
  // Search query and suggestions
  searchQuery: string;
  suggestions: string[];
  suggestedProducts: SearchSuggestion[];
  correctedQuery: string;
  aiInsights: AIInsights | null;

  // Recent searches
  recentSearches: string[];

  // Search results (after performing search)
  searchResults: SearchSuggestion[];
  totalResults: number;

  // Loading and error states
  suggestionsLoading: boolean;
  resultsLoading: boolean;
  error: string | null;

  // UI states
  isDropdownOpen: boolean;
}

const initialState: SearchState = {
  searchQuery: "",
  suggestions: [],
  suggestedProducts: [],
  correctedQuery: "",
  aiInsights: null,
  recentSearches: [],
  searchResults: [],
  totalResults: 0,
  suggestionsLoading: false,
  resultsLoading: false,
  error: null,
  isDropdownOpen: false,
};

// Async thunk for fetching search suggestions
export const fetchSearchSuggestions = createAsyncThunk(
  "search/fetchSuggestions",
  async (query: string, { rejectWithValue }) => {
    try {
      if (query.trim().length < 2) {
        return { suggestions: [], suggestedProducts: [], correctedQuery: "", aiInsights: null };
      }

      const response = await fetchDataFromApi(
        `/api/product/search/get?query=${encodeURIComponent(query.trim())}&page=1&limit=8`
      );

      return {
        suggestions: response?.suggestions?.slice(0, 7) || [],
        suggestedProducts: response?.suggestionProducts || [],
        correctedQuery: response?.correctedQuery || "",
        aiInsights: response?.aiInsights || null,
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch suggestions");
    }
  }
);

// Async thunk for performing actual search
export const performSearch = createAsyncThunk(
  "search/performSearch",
  async (query: string, { rejectWithValue }) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) {
        return rejectWithValue("Please enter a search query");
      }

      const response = await fetchDataFromApi(
        `/api/product/search?query=${encodeURIComponent(trimmed)}&page=1&limit=20`
      );

      return {
        query: trimmed,
        results: response?.products || [],
        total: response?.totalProducts || 0,
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to perform search");
    }
  }
);

// Async thunk for loading recent searches from local storage
export const loadRecentSearches = createAsyncThunk(
  "search/loadRecent",
  async (_, { rejectWithValue }) => {
    try {
      const saved = global.localStorage?.getItem?.("recent_searches_mobile") || "[]";
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
    } catch (error) {
      return [];
    }
  }
);

// Async thunk for saving recent search
export const saveRecentSearch = createAsyncThunk<string[], string>(
  "search/saveRecent",
  async (query: string, { rejectWithValue }) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) return [];

      const saved = global.localStorage?.getItem?.("recent_searches_mobile") || "[]";
      const parsed = JSON.parse(saved);
      const recent = Array.isArray(parsed) ? parsed : [];
      
      const updated = [
        trimmed,
        ...recent.filter((item: string) => item !== trimmed),
      ].slice(0, 6);

      global.localStorage?.setItem?.(
        "recent_searches_mobile",
        JSON.stringify(updated)
      );

      return updated;
    } catch (error) {
      return [query.trim()];
    }
  }
);

// Async thunk for clearing recent searches
export const clearRecentSearches = createAsyncThunk(
  "search/clearRecent",
  async (_, { rejectWithValue }) => {
    try {
      global.localStorage?.setItem?.("recent_searches_mobile", "[]");
      return [];
    } catch (error) {
      return rejectWithValue("Failed to clear recent searches");
    }
  }
);

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    // Synchronous actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setIsDropdownOpen: (state, action: PayloadAction<boolean>) => {
      state.isDropdownOpen = action.payload;
    },
    clearSearchQuery: (state) => {
      state.searchQuery = "";
      state.suggestions = [];
      state.suggestedProducts = [];
      state.correctedQuery = "";
      state.aiInsights = null;
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.totalResults = 0;
      state.searchQuery = "";
    },
    removeFromRecentSearches: (state, action: PayloadAction<string>) => {
      state.recentSearches = state.recentSearches.filter(
        (item) => item !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch suggestions
    builder
      .addCase(fetchSearchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
        state.error = null;
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload.suggestions;
        state.suggestedProducts = action.payload.suggestedProducts;
        state.correctedQuery = action.payload.correctedQuery;
        state.aiInsights = action.payload.aiInsights;
      })
      .addCase(fetchSearchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.error = action.payload as string;
      });

    // Perform search
    builder
      .addCase(performSearch.pending, (state) => {
        state.resultsLoading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.resultsLoading = false;
        state.searchQuery = action.payload.query;
        state.searchResults = action.payload.results;
        state.totalResults = action.payload.total;
        state.isDropdownOpen = false;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.resultsLoading = false;
        state.error = action.payload as string;
      });

    // Load recent searches
    builder
      .addCase(loadRecentSearches.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      });

    // Save recent search
    builder
      .addCase(saveRecentSearch.fulfilled, (state, action) => {
        state.recentSearches = action.payload;
      });

    // Clear recent searches
    builder
      .addCase(clearRecentSearches.fulfilled, (state) => {
        state.recentSearches = [];
      });
  },
});

export const {
  setSearchQuery,
  setIsDropdownOpen,
  clearSearchQuery,
  clearSearchResults,
  removeFromRecentSearches,
} = searchSlice.actions;

export default searchSlice.reducer;
