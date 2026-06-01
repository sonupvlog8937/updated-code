import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchDataFromApi, postData } from "../utils/api";

export const fetchMarkets = createAsyncThunk("goMarket/fetchMarkets", async ({ search = "", page = 1 } = {}) => {
  const url = search ? `/api/go-market/markets/search?q=${encodeURIComponent(search)}&page=${page}&limit=20` : `/api/go-market/markets?page=${page}&limit=20&status=active`;
  return fetchDataFromApi(url);
});
export const fetchNearbyMarkets = createAsyncThunk("goMarket/fetchNearbyMarkets", async ({ latitude, longitude }) => fetchDataFromApi(`/api/go-market/markets/nearby?latitude=${latitude}&longitude=${longitude}&limit=10`));
export const fetchMarketDetail = createAsyncThunk("goMarket/fetchMarketDetail", async (marketId) => fetchDataFromApi(`/api/go-market/markets/${marketId}`));
export const fetchGroceryShopDetail = createAsyncThunk("goMarket/fetchGroceryShopDetail", async (shopId) => fetchDataFromApi(`/api/go-market/grocery-shops/${shopId}`));
export const fetchRestaurantDetail = createAsyncThunk("goMarket/fetchRestaurantDetail", async (restaurantId) => fetchDataFromApi(`/api/go-market/restaurants/${restaurantId}`));
export const followGoMarketShop = createAsyncThunk("goMarket/followShop", async (shopId) => postData("/api/go-market/follow-shop", { shopId }));
export const unfollowGoMarketShop = createAsyncThunk("goMarket/unfollowShop", async (shopId) => postData("/api/go-market/unfollow-shop", { shopId }));
export const followGoMarketRestaurant = createAsyncThunk("goMarket/followRestaurant", async (restaurantId) => postData("/api/go-market/follow-restaurant", { restaurantId }));
export const unfollowGoMarketRestaurant = createAsyncThunk("goMarket/unfollowRestaurant", async (restaurantId) => postData("/api/go-market/unfollow-restaurant", { restaurantId }));
export const savePreferredMarket = createAsyncThunk("goMarket/savePreferredMarket", async (marketId) => postData("/api/go-market/set-preferred-market", { marketId }));

const initialState = {
  markets: [], nearbyMarkets: [], selectedMarket: null,
  groceryShops: [], restaurants: [], shopDetail: null,
  restaurantDetail: null, loading: false, detailLoading: false,
  error: "", activeTab: "grocery"
};

const slice = createSlice({
  name: "goMarket",
  initialState,
  reducers: {
    setActiveTab: (state, action) => { state.activeTab = action.payload; },
    clearGoMarketDetail: (state) => { state.shopDetail = null; state.restaurantDetail = null; }
  },
  extraReducers: (builder) => {
    builder
      // ✅ addCase PEHLE
      .addCase(fetchMarkets.fulfilled, (state, action) => {
        state.loading = false;
        state.markets = action.payload?.data || [];
      })
      .addCase(fetchNearbyMarkets.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyMarkets = action.payload?.data || [];
      })
      .addCase(fetchMarketDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        const payload = action.payload?.data;
        state.selectedMarket = payload?.market || null;
        state.groceryShops = payload?.groceryShops || [];
        state.restaurants = payload?.restaurants || [];
        state.error = action.payload?.error ? action.payload?.message : "";
      })
      .addCase(fetchGroceryShopDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.shopDetail = action.payload?.data || null;
      })
      .addCase(fetchRestaurantDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.restaurantDetail = action.payload?.data || null;
      })
      // ✅ addMatcher BAAD MEIN
      .addMatcher(
        (a) => a.type.startsWith("goMarket/") && a.type.endsWith("/pending"),
        (state, action) => {
          if (action.type.includes("Detail")) state.detailLoading = true;
          else state.loading = true;
          state.error = "";
        }
      )
      .addMatcher(
        (a) => a.type.startsWith("goMarket/") && a.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.detailLoading = false;
          state.error = action.error?.message || "Unable to load Go Market";
        }
      );
  },
});

export const { setActiveTab, clearGoMarketDetail } = slice.actions;
export default slice.reducer;