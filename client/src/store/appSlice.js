import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { fetchDataFromApi, postData } from "../utils/api";

const initialState = {
  openProductDetailsModal: { open: false, item: {} },
  isLogin: false,
  userData: null,
  catData: [],
  cartData: [],
  myListData: [],
  openCartPanel: false,
  openAddressPanel: false,
  addressMode: "add",
  addressId: "",
  searchData: [],
  windowWidth: window.innerWidth,
  openFilter: false,
  isFilterBtnShow: false,
  openSearchPanel: false,
};

export const fetchCategories = createAsyncThunk("app/fetchCategories", async () => {
  const res = await fetchDataFromApi("/api/category");
  return res?.error === false ? res?.data : [];
});

export const fetchUserDetails = createAsyncThunk("app/fetchUserDetails", async (_, { dispatch }) => {
  const res = await fetchDataFromApi(`/api/user/user-details`);
  if (res?.response?.data?.error === true && res?.response?.data?.message === "You have not login") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    dispatch(alertBox({ type: "error", msg: "Your session is closed please login again" }));
    dispatch(setIsLogin(false));
    return null;
  }
  return res?.data ?? null;
});

export const fetchCartItems = createAsyncThunk("app/fetchCartItems", async () => {
  const res = await fetchDataFromApi(`/api/cart/get`);
  return res?.error === false ? res?.data : [];
});

export const fetchMyListData = createAsyncThunk("app/fetchMyListData", async () => {
  const res = await fetchDataFromApi("/api/myList");
  return res?.error === false ? res?.data : [];
});

export const addToCart = createAsyncThunk("app/addToCart", async ({ product, userId, quantity }, { dispatch }) => {
  if (userId === undefined) {
    dispatch(alertBox({ type: "error", msg: "you are not login please login first" }));
    return false;
  }

  const data = {
    productTitle: product?.name,
    image: product?.image,
    rating: product?.rating,
    price: product?.price,
    oldPrice: product?.oldPrice,
    discount: product?.discount,
    quantity,
    subTotal: parseInt(product?.price * quantity),
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
    dispatch(alertBox({ type: "success", msg: res?.message }));
    dispatch(fetchCartItems());
  } else {
    dispatch(alertBox({ type: "error", msg: res?.message }));
  }

  return res;
});

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setOpenProductDetailsModal: (state, action) => {
      state.openProductDetailsModal = action.payload;
    },
    setOpenCartPanel: (state, action) => {
      state.openCartPanel = action.payload;
    },
    setOpenAddressPanel: (state, action) => {
      state.openAddressPanel = action.payload;
    },
    setIsLogin: (state, action) => {
      state.isLogin = action.payload;
    },
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setCatData: (state, action) => {
      state.catData = action.payload;
    },
    setCartData: (state, action) => {
      state.cartData = action.payload;
    },
    setMyListData: (state, action) => {
      state.myListData = action.payload;
    },
    setAddressMode: (state, action) => {
      state.addressMode = action.payload;
    },
    setAddressId: (state, action) => {
      state.addressId = action.payload;
    },
    setSearchData: (state, action) => {
      state.searchData = action.payload;
    },
    setWindowWidth: (state, action) => {
      state.windowWidth = action.payload;
    },
    setOpenFilter: (state, action) => {
      state.openFilter = action.payload;
    },
    setisFilterBtnShow: (state, action) => {
      state.isFilterBtnShow = action.payload;
    },
    setOpenSearchPanel: (state, action) => {
      state.openSearchPanel = action.payload;
    },
    alertBox: (_, action) => {
      const { type, msg } = action.payload;
      if (type === "success") toast.success(msg);
      if (type === "error") toast.error(msg);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.catData = action.payload;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.userData = action.payload;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.cartData = action.payload;
      })
      .addCase(fetchMyListData.fulfilled, (state, action) => {
        state.myListData = action.payload;
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
  alertBox,
} = appSlice.actions;

export default appSlice.reducer;