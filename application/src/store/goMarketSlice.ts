import { AnyAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchDataFromApi, postData } from "@/src/utils/api";

export const fetchGoMarkets = createAsyncThunk<any, string | undefined>("goMarket/fetchMarkets", async (search = "") => fetchDataFromApi(search ? `/api/go-market/markets/search?q=${encodeURIComponent(search)}` : "/api/go-market/markets?status=active&limit=20"));
export const fetchGoNearbyMarkets = createAsyncThunk<any, { latitude: number; longitude: number }>("goMarket/fetchNearby", async ({ latitude, longitude }) => fetchDataFromApi(`/api/go-market/markets/nearby?latitude=${latitude}&longitude=${longitude}&limit=10`));
export const fetchGoMarketDetail = createAsyncThunk<any, string>("goMarket/fetchDetail", async (id) => fetchDataFromApi(`/api/go-market/markets/${id}`));
export const fetchGoShopDetail = createAsyncThunk<any, string>("goMarket/fetchShop", async (id) => fetchDataFromApi(`/api/go-market/grocery-shops/${id}`));
export const fetchGoRestaurantDetail = createAsyncThunk<any, string>("goMarket/fetchRestaurant", async (id) => fetchDataFromApi(`/api/go-market/restaurants/${id}`));
export const followGoShop = createAsyncThunk<any, string>("goMarket/followShop", async (shopId) => postData("/api/go-market/follow-shop", { shopId }));
export const followGoRestaurant = createAsyncThunk<any, string>("goMarket/followRestaurant", async (restaurantId) => postData("/api/go-market/follow-restaurant", { restaurantId }));

interface GoMarketState { markets: any[]; nearbyMarkets: any[]; selectedMarket: any | null; groceryShops: any[]; restaurants: any[]; shopDetail: any | null; restaurantDetail: any | null; loading: boolean; error: string; activeTab: "grocery" | "restaurants"; }
const initialState: GoMarketState = { markets: [], nearbyMarkets: [], selectedMarket: null, groceryShops: [], restaurants: [], shopDetail: null, restaurantDetail: null, loading: false, error: "", activeTab: "grocery" };
const isGoPending = (a: AnyAction) => a.type.startsWith("goMarket/") && a.type.endsWith("/pending");
const isGoRejected = (a: AnyAction) => a.type.startsWith("goMarket/") && a.type.endsWith("/rejected");
const slice = createSlice({
  name: "goMarket", initialState, reducers: { setGoMarketTab: (s, a) => { s.activeTab = a.payload; } },
  extraReducers: (b) => {
    b.addCase(fetchGoMarkets.fulfilled, (s, a) => { s.loading = false; s.markets = a.payload?.data || []; })
      .addCase(fetchGoNearbyMarkets.fulfilled, (s, a) => { s.loading = false; s.nearbyMarkets = a.payload?.data || []; })
      .addCase(fetchGoMarketDetail.fulfilled, (s, a) => { s.loading = false; const data = a.payload?.data; s.selectedMarket = data?.market || null; s.groceryShops = data?.groceryShops || []; s.restaurants = data?.restaurants || []; s.error = a.payload?.error ? a.payload?.message : ""; })
      .addCase(fetchGoShopDetail.fulfilled, (s, a) => { s.loading = false; s.shopDetail = a.payload?.data || null; })
      .addCase(fetchGoRestaurantDetail.fulfilled, (s, a) => { s.loading = false; s.restaurantDetail = a.payload?.data || null; })
      .addMatcher(isGoPending, (s) => { s.loading = true; s.error = ""; })
      .addMatcher(isGoRejected, (s, a: AnyAction) => { s.loading = false; s.error = a.error?.message || "Unable to load Go Market"; });
  },
});
export const { setGoMarketTab } = slice.actions;
export default slice.reducer;
