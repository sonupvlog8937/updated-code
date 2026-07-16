import { AnyAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchDataFromApi, postData } from "@/src/utils/api";
import { setUserData } from "./appSlice";

export const fetchGoMarkets = createAsyncThunk<any, string | undefined>("goMarket/fetchMarkets", async (search = "") => fetchDataFromApi(search ? `/api/go-market/markets/search?q=${encodeURIComponent(search)}` : "/api/go-market/markets?status=active&limit=20"));
export const fetchGoNearbyMarkets = createAsyncThunk<any, { latitude: number; longitude: number }>("goMarket/fetchNearby", async ({ latitude, longitude }) => fetchDataFromApi(`/api/go-market/markets/nearby?latitude=${latitude}&longitude=${longitude}&limit=10`));
export const fetchGoMarketDetail = createAsyncThunk<any, string>("goMarket/fetchDetail", async (id) => fetchDataFromApi(`/api/go-market/markets/${id}`));
export const fetchGoShopDetail = createAsyncThunk<any, string>("goMarket/fetchShop", async (id) => fetchDataFromApi(`/api/go-market/grocery-shops/${id}`));
export const fetchGoRestaurantDetail = createAsyncThunk<any, string>("goMarket/fetchRestaurant", async (id) => fetchDataFromApi(`/api/go-market/restaurants/${id}`));
export const followGoShop = createAsyncThunk<any, string>("goMarket/followShop", async (shopId) => postData("/api/go-market/follow-shop", { shopId }));
export const unfollowGoShop = createAsyncThunk<any, string>("goMarket/unfollowShop", async (shopId) => postData("/api/go-market/unfollow-shop", { shopId }));
export const followGoRestaurant = createAsyncThunk<any, string>("goMarket/followRestaurant", async (restaurantId) => postData("/api/go-market/follow-restaurant", { restaurantId }));
export const unfollowGoRestaurant = createAsyncThunk<any, string>("goMarket/unfollowRestaurant", async (restaurantId) => postData("/api/go-market/unfollow-restaurant", { restaurantId }));
export const savePreferredMarket = createAsyncThunk<any, { marketId: string; location?: { lat: number; lng: number }; address?: string; forceLocationUpdate?: boolean }>("goMarket/savePreferred", async ({ marketId, location, address, forceLocationUpdate = false }, { dispatch, getState }) => {
  const result = await postData("/api/go-market/set-preferred-market", { marketId, location, address, forceLocationUpdate });
  if (result?.success || result?.error === false) {
    const state = getState() as any;
    const userData = state.app.userData;
    if (userData) {
      dispatch(setUserData({
        ...userData,
        preferredMarketId: marketId,
        goMarketLocation: result?.data?.goMarketLocation || userData?.goMarketLocation || null,
      }));
    }
  }
  return result;
});

interface GoMarketState { markets: any[]; nearbyMarkets: any[]; selectedMarket: any | null; groceryShops: any[]; restaurants: any[]; shopDetail: any | null; restaurantDetail: any | null; loading: boolean; error: string; activeTab: "grocery" | "restaurants"; }
const initialState: GoMarketState = { markets: [], nearbyMarkets: [], selectedMarket: null, groceryShops: [], restaurants: [], shopDetail: null, restaurantDetail: null, loading: false, error: "", activeTab: "grocery" };

// Action types that should NOT toggle the global page-level `loading` flag.
// These have their own local/optimistic loading UI (e.g. followBusy in the component),
// so letting them flip `loading` causes the whole screen to show the skeleton again.
const SILENT_ACTION_TYPES = new Set([
  "goMarket/followRestaurant",
  "goMarket/unfollowRestaurant",
  "goMarket/followShop",
  "goMarket/unfollowShop",
]);

const isSilentAction = (a: AnyAction) => {
  const base = a.type.replace(/\/(pending|fulfilled|rejected)$/, "");
  return SILENT_ACTION_TYPES.has(base);
};

const isGoPending = (a: AnyAction) => a.type.startsWith("goMarket/") && a.type.endsWith("/pending") && !isSilentAction(a);
const isGoRejected = (a: AnyAction) => a.type.startsWith("goMarket/") && a.type.endsWith("/rejected") && !isSilentAction(a);

const slice = createSlice({
  name: "goMarket", initialState, reducers: { setGoMarketTab: (s, a) => { s.activeTab = a.payload; } },
  extraReducers: (b) => {
    b.addCase(fetchGoMarkets.fulfilled, (s, a) => { s.loading = false; s.markets = a.payload?.data || []; })
      .addCase(fetchGoNearbyMarkets.fulfilled, (s, a) => { s.loading = false; s.nearbyMarkets = a.payload?.data || []; })
      .addCase(fetchGoMarketDetail.fulfilled, (s, a) => { s.loading = false; const data = a.payload?.data; s.selectedMarket = data?.market || null; s.groceryShops = data?.groceryShops || []; s.restaurants = data?.restaurants || []; s.error = a.payload?.error ? a.payload?.message : ""; })
      .addCase(fetchGoShopDetail.fulfilled, (s, a) => { s.loading = false; s.shopDetail = a.payload?.data || null; })
      .addCase(fetchGoRestaurantDetail.fulfilled, (s, a) => { 
        s.loading = false; 
        s.restaurantDetail = a.payload?.data || null;
        s.error = ""; // Clear any previous errors
      })
      .addCase(followGoRestaurant.fulfilled, (s, a) => { 
        // Update restaurant detail if loaded  
        if (s.restaurantDetail?.restaurant && a.meta.arg === s.restaurantDetail.restaurant._id) {
          const data = a.payload?.data || a.payload;
          s.restaurantDetail.restaurant.isFollowing = data?.isFollowing ?? true;
          s.restaurantDetail.restaurant.followerCount = data?.followerCount ?? s.restaurantDetail.restaurant.followerCount;
        }
      })
      .addCase(unfollowGoRestaurant.fulfilled, (s, a) => { 
        // Update restaurant detail if loaded
        if (s.restaurantDetail?.restaurant && a.meta.arg === s.restaurantDetail.restaurant._id) {
          const data = a.payload?.data || a.payload;
          s.restaurantDetail.restaurant.isFollowing = data?.isFollowing ?? false;
          s.restaurantDetail.restaurant.followerCount = data?.followerCount ?? s.restaurantDetail.restaurant.followerCount;
        }
      })
      .addCase(followGoShop.fulfilled, (s, a) => { 
        // Update shop detail if loaded
        if (s.shopDetail && a.meta.arg === s.shopDetail._id) {
          const data = a.payload?.data || a.payload;
          s.shopDetail.isFollowing = data?.isFollowing ?? true;
          s.shopDetail.followerCount = data?.followerCount ?? s.shopDetail.followerCount;
        }
      })
      .addCase(unfollowGoShop.fulfilled, (s, a) => { 
        // Update shop detail if loaded
        if (s.shopDetail && a.meta.arg === s.shopDetail._id) {
          const data = a.payload?.data || a.payload;
          s.shopDetail.isFollowing = data?.isFollowing ?? false;
          s.shopDetail.followerCount = data?.followerCount ?? s.shopDetail.followerCount;
        }
      })
      .addCase(fetchGoRestaurantDetail.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error?.message || "Failed to load restaurant details";
        console.error("fetchGoRestaurantDetail rejected:", a.error);
      })
      .addMatcher(isGoPending, (s) => { s.loading = true; s.error = ""; })
      .addMatcher(isGoRejected, (s, a: AnyAction) => { s.loading = false; s.error = a.error?.message || "Unable to load Go Market"; });
  },
});
export const { setGoMarketTab } = slice.actions;
export default slice.reducer;