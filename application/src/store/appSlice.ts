import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dimensions } from "react-native";
import { fetchDataFromApi, postData } from "../utils/api";
import { showToast } from "../utils/toast";

export interface ProductImage {
  url: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  catId?: string;
  catName?: string;
  subCat?: string;
  subCatId?: string;
  thirdSubCat?: string;
  thirdSubCatId?: string;
  category?: any;
  countInStock: number;
  rating?: number;
  isFeatured?: boolean;
  discount?: number;
  productRam?: string[];
  size?: string[];
  productWeight?: string[];
  images?: string[];
  banner_title_color?: string;
  banner_text_color?: string;
  bannerimages?: { image: string; bannerTitle?: string }[];
  banner_title?: string;
  banner_text?: string;
  bannerImageUrl?: string;
  productPublish?: string;
  pickup_address?: string;
  delivery_address?: string;
  shippingFee?: string | number;
  shippingFeeImg?: string;
  weight?: string;
  ram?: string;
  color?: string;
  sellerId?: string;
  soldCount?: number;
}

export interface Category {
  _id: string;
  name: string;
  images?: string[];
  parentId?: string;
  parentCatName?: string;
  color?: string;
  children?: Category[];
}

export interface CartItem {
  _id: string;
  productTitle: string;
  image: string;
  rating: number;
  price: number;
  oldPrice?: number;
  quantity: number;
  subTotal: number;
  productId: string;
  countInStock: number;
  brand?: string;
  size?: string;
  weight?: string;
  ram?: string;
  color?: string;
  userId?: string;
}

export interface MyListItem {
  _id: string;
  productTitle: string;
  image: string;
  rating: number;
  price: number;
  oldPrice?: number;
  productId: string;
  brand?: string;
  discount?: number;
}

export interface UserAddress {
  _id: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
  status?: boolean;
  addressType?: string;
  landmark?: string;
  userId?: string;
  selected?: boolean;
}

export interface UserData {
  _id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  role?: string;
  address_details?: UserAddress[];
}

export interface HomepageData {
  slides: any[];
  featuredProducts: Product[];
  latestProducts: Product[];
  categories: Category[];
  banners?: any[];
}

export interface AppState {
  openProductDetailsModal: { open: boolean; item: Partial<Product> };
  isLogin: boolean;
  userData: UserData | null;
  authLoading: boolean;
  catData: Category[];
  homepageSlides: any[];
  homepageFeatured: Product[];
  homepageLatest: Product[];
  bannerBoxData: any[];
  bannerBoxV2Data: any[];
  homePageLoading: boolean;
  cartData: CartItem[];
  myListData: MyListItem[];
  openCartPanel: boolean;
  openAddressPanel: boolean;
  addressMode: "add" | "edit";
  addressId: string;
  searchData: Product[];
  windowWidth: number;
  openFilter: boolean;
  isFilterBtnShow: boolean;
  openSearchPanel: boolean;
  globalLoading: boolean;
}

const initialState: AppState = {
  openProductDetailsModal: { open: false, item: {} },
  isLogin: false,
  userData: null,
  authLoading: true,
  catData: [],
  homepageSlides: [],
  homepageFeatured: [],
  homepageLatest: [],
  bannerBoxData: [],
  bannerBoxV2Data: [],
  homePageLoading: true,
  cartData: [],
  myListData: [],
  openCartPanel: false,
  openAddressPanel: false,
  addressMode: "add",
  addressId: "",
  searchData: [],
  windowWidth: Dimensions.get("window").width,
  openFilter: false,
  isFilterBtnShow: false,
  openSearchPanel: false,
  globalLoading: false,
};

export const fetchCategories = createAsyncThunk(
  "app/fetchCategories",
  async () => {
    const res = await fetchDataFromApi("/api/category", { useCache: true });
    return res?.error === false ? res?.data : [];
  },
);

export const fetchUserDetails = createAsyncThunk(
  "app/fetchUserDetails",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await fetchDataFromApi("/api/user/user-details");
      
      // Check if there's an auth error
      if (res?.error === true) {
        const msg = res?.message || "";
        if (msg.includes("login") || msg.includes("token") || msg.includes("unauthorized")) {
          await AsyncStorage.removeItem("accessToken");
          await AsyncStorage.removeItem("refreshToken");
          dispatch(setIsLogin(false));
          return rejectWithValue("Session expired");
        }
      }
      
      return res?.data ?? null;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchCartItems = createAsyncThunk(
  "app/fetchCartItems",
  async () => {
    const res = await fetchDataFromApi("/api/cart/get");
    return res?.error === false ? res?.data : [];
  },
);

export const fetchMyListData = createAsyncThunk(
  "app/fetchMyListData",
  async () => {
    const res = await fetchDataFromApi("/api/myList");
    return res?.error === false ? res?.data : [];
  },
);

interface AddToCartPayload {
  product: Partial<Product> & { _id: string };
  userId?: string;
  quantity: number;
}

export const addToCart = createAsyncThunk(
  "app/addToCart",
  async ({ product, userId, quantity }: AddToCartPayload, { dispatch }) => {
    if (!userId) {
      showToast("error", "Please login first to add items to cart");
      return false;
    }
    const data = {
      productTitle: product?.name,
      image: product?.images?.[0],
      rating: product?.rating,
      price: product?.price,
      oldPrice: product?.oldPrice,
      discount: product?.discount,
      quantity,
      subTotal: Math.round((product?.price || 0) * quantity),
      productId: product?._id,
      countInStock: product?.countInStock,
      brand: product?.brand,
      size: product?.size,
      weight: product?.weight,
      ram: product?.ram,
      color: product?.color,
    };
    const res = await postData("/api/cart/add", data);
    if (res?.error === false) {
      showToast("success", res?.message || "Added to cart");
      dispatch(fetchCartItems());
    } else {
      showToast("error", res?.message || "Failed to add");
    }
    return res;
  },
);

export const initAuthFromStorage = createAsyncThunk(
  "app/initAuth",
  async (_, { dispatch }) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        dispatch(setIsLogin(true));
        // Fetch all data
        dispatch(fetchCartItems());
        dispatch(fetchMyListData());
        dispatch(fetchUserDetails());
        return true;
      }
      dispatch(setIsLogin(false));
      return false;
    } catch (error) {
      dispatch(setIsLogin(false));
      return false;
    }
  },
);

export const logoutUser = createAsyncThunk(
  "app/logout",
  async (_, { dispatch }) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      
      if (token) {
        try {
          await fetchDataFromApi("/api/user/logout");
        } catch (error) {
          // Continue with logout even if API fails
        }
      }
      
      // Clear storage
      await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userEmail"]);
      
      // Clear Redux state
      dispatch(setIsLogin(false));
      dispatch(setUserData(null));
      dispatch(setCartData([]));
      dispatch(setMyListData([]));
      
      return true;
    } catch (error) {
      // Still clear state even if storage fails
      dispatch(setIsLogin(false));
      dispatch(setUserData(null));
      dispatch(setCartData([]));
      dispatch(setMyListData([]));
      return true;
    }
  },
);

const DEFAULT_BANNERS = [
  {
    _id: "1",
    type: "box",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80",
    img: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80",
    bannerTitle: "Ethnic Wear",
    catId: "ethnic",
  },
  {
    _id: "2",
    type: "box",
    image: "https://images.unsplash.com/photo-1539533057592-4d2b7d37f537?w=400&q=80",
    img: "https://images.unsplash.com/photo-1539533057592-4d2b7d37f537?w=400&q=80",
    bannerTitle: "Sports Wear",
    catId: "sports",
  },
  {
    _id: "3",
    type: "box",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
    img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
    bannerTitle: "Accessories",
    catId: "accessories",
  },
  {
    _id: "4",
    type: "v2",
    image: "https://images.unsplash.com/photo-1595847368919-86d02d198b74?w=500&q=80",
    bannerTitle: "Summer Collection",
    catId: "summer",
    price: 2499,
  },
  {
    _id: "5",
    type: "v2",
    image: "https://images.unsplash.com/photo-1611003228941-98852ba62227?w=500&q=80",
    bannerTitle: "Winter Jackets",
    catId: "winter",
    price: 3999,
  },
];

export const fetchBanners = createAsyncThunk("app/fetchBanners", async () => {
  try {
    const res = await fetchDataFromApi("/api/banner", { useCache: true });
    const banners = res?.data || res?.banners || [];
    return banners.length > 0 ? banners : DEFAULT_BANNERS;
  } catch {
    return DEFAULT_BANNERS;
  }
});

export const fetchHomepageData = createAsyncThunk(
  "app/fetchHomepageData",
  async (_, { rejectWithValue }) => {
    try {
      const [slidesRes, featuredRes, latestRes, catRes] = await Promise.all([
        fetchDataFromApi("/api/homeSlides", { useCache: true }),
        fetchDataFromApi("/api/product/getAllFeaturedProducts", { useCache: true }),
        fetchDataFromApi("/api/product/getAllProducts?page=1&limit=12"),
        fetchDataFromApi("/api/category", { useCache: true }),
      ]);

      return {
        slides: slidesRes?.data || [],
        featuredProducts: featuredRes?.products || featuredRes?.data || [],
        latestProducts: latestRes?.products || latestRes?.data || [],
        categories: catRes?.data || [],
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch homepage data");
    }
  },
);

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setOpenProductDetailsModal: (
      state,
      action: PayloadAction<{ open: boolean; item: Partial<Product> }>,
    ) => {
      state.openProductDetailsModal = action.payload;
    },
    setOpenCartPanel: (state, action: PayloadAction<boolean>) => {
      state.openCartPanel = action.payload;
    },
    setOpenAddressPanel: (state, action: PayloadAction<boolean>) => {
      state.openAddressPanel = action.payload;
    },
    setIsLogin: (state, action: PayloadAction<boolean>) => {
      state.isLogin = action.payload;
    },
    setUserData: (state, action: PayloadAction<UserData | null>) => {
      state.userData = action.payload;
    },
    setCatData: (state, action: PayloadAction<Category[]>) => {
      state.catData = action.payload;
    },
    setCartData: (state, action: PayloadAction<CartItem[]>) => {
      state.cartData = action.payload;
    },
    setMyListData: (state, action: PayloadAction<MyListItem[]>) => {
      state.myListData = action.payload;
    },
    setAddressMode: (state, action: PayloadAction<"add" | "edit">) => {
      state.addressMode = action.payload;
    },
    setAddressId: (state, action: PayloadAction<string>) => {
      state.addressId = action.payload;
    },
    setSearchData: (state, action: PayloadAction<Product[]>) => {
      state.searchData = action.payload;
    },
    setWindowWidth: (state, action: PayloadAction<number>) => {
      state.windowWidth = action.payload;
    },
    setOpenFilter: (state, action: PayloadAction<boolean>) => {
      state.openFilter = action.payload;
    },
    setisFilterBtnShow: (state, action: PayloadAction<boolean>) => {
      state.isFilterBtnShow = action.payload;
    },
    setOpenSearchPanel: (state, action: PayloadAction<boolean>) => {
      state.openSearchPanel = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    alertBox: (
      _,
      action: PayloadAction<{ type: "success" | "error"; msg: string }>,
    ) => {
      const { type, msg } = action.payload;
      showToast(type, msg);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.catData = action.payload;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        if (action.payload) {
          state.userData = action.payload;
        }
      })
      .addCase(fetchUserDetails.rejected, (state) => {
        state.isLogin = false;
        state.userData = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.cartData = action.payload;
      })
      .addCase(fetchMyListData.fulfilled, (state, action) => {
        state.myListData = action.payload;
      })
      .addCase(initAuthFromStorage.fulfilled, (state) => {
        state.authLoading = false;
      })
      .addCase(initAuthFromStorage.rejected, (state) => {
        state.authLoading = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLogin = false;
        state.userData = null;
        state.cartData = [];
        state.myListData = [];
        state.authLoading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLogin = false;
        state.userData = null;
        state.authLoading = false;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        const banners = action.payload;
        state.bannerBoxData = banners
          .filter((b: { type: string }) => b.type === "box" || !b.type)
          .slice(0, 3);
        state.bannerBoxV2Data = banners
          .filter((b: { type: string }) => b.type === "v2")
          .slice(0, 2);
      })
      .addCase(fetchHomepageData.pending, (state) => {
        state.homePageLoading = true;
      })
      .addCase(fetchHomepageData.fulfilled, (state, action) => {
        state.homepageSlides = action.payload.slides;
        state.homepageFeatured = action.payload.featuredProducts;
        state.homepageLatest = action.payload.latestProducts;
        state.catData = action.payload.categories;
        state.homePageLoading = false;
      })
      .addCase(fetchHomepageData.rejected, (state) => {
        state.homePageLoading = false;
      });
  },
});

export const {
  setOpenProductDetailsModal,
  setOpenCartPanel,
  setOpenAddressPanel,
  setIsLogin,
  setUserData,
  setCatData,
  setCartData,
  setMyListData,
  setAddressMode,
  setAddressId,
  setSearchData,
  setWindowWidth,
  setOpenFilter,
  setisFilterBtnShow,
  setOpenSearchPanel,
  setGlobalLoading,
  alertBox,
} = appSlice.actions;

export default appSlice.reducer;
