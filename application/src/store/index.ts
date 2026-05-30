import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import appReducer from "./appSlice";
import productDetailsReducer from "./productDetailsSlice";
import productsReducer from "./productsSlice";
import searchReducer from "./searchSlice";
import sellerStoreReducer from "./sellerStoreSlice";
import ordersReducer from "./ordersSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    products: productsReducer,
    productDetails: productDetailsReducer,
    search: searchReducer,
    sellerStore: sellerStoreReducer,
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Selective imports from productDetailsSlice (no type conflicts)
export {
    fetchProductDetails,
    fetchRelatedProducts, fetchReviews, fetchReviewsCount, fetchSellerInfo, resetProductDetails,
    seedProductData, setActiveImages,
    setVisibleSpecifications, type ProductDetailsState
} from "./productDetailsSlice";

// Re-export from appSlice only specific items
export {
    addToCart, alertBox, fetchCartItems, fetchCategories, fetchBanners, fetchHomepageData, fetchMyListData, fetchUserDetails, initAuthFromStorage,
    logoutUser, setAddressId, setAddressMode, setCartData, setCatData, setGlobalLoading, setisFilterBtnShow, setIsLogin, setMyListData, setOpenAddressPanel, setOpenCartPanel, setOpenFilter, setOpenProductDetailsModal, setOpenSearchPanel, setSearchData, setUserData, setWindowWidth, type AppState, type CartItem, type Category, type MyListItem, type UserData
} from "./appSlice";

// Export products slice actions
export {
    fetchProducts, goToPage, nextPage,
    previousPage, resetAllFilters, resetPagination, setPage, setSelectedBrands, setSelectedColors, setSelectedDiscountRanges, setSelectedPriceRanges, setSelectedProductTypes, setSelectedRamOptions, setSelectedRatingBands, setSelectedSaleOnly, setSelectedSizes, setSelectedStockStatus, setSelectedWeights, setSortType, type FilterState, type Product, type ProductsData, type ProductsState
} from "./productsSlice";

export { default as productsReducer } from "./productsSlice";

// Export search slice
export {
    clearRecentSearches, clearSearchQuery,
    clearSearchResults, fetchSearchSuggestions, loadRecentSearches, performSearch, removeFromRecentSearches, saveRecentSearch, setIsDropdownOpen, setSearchQuery, type AIInsights, type SearchResponse, type SearchState,
    type SearchSuggestion
} from "./searchSlice";

// Export seller store slice
export {
    fetchSellerStore, fetchSellerProfile, setCurrentPage, setSortBy, setSearch, setCategoryFilter, setPriceRange, setMinRating, setDiscountMin, toggleBrandFilter, toggleColorFilter, toggleSizeFilter, toggleRamFilter, toggleWeightFilter, resetFilters, clearProducts, type SellerStoreState, type SellerProduct, type SellerProfile, type FilterOptions, type RatingStats, type Category as SellerCategory
} from "./sellerStoreSlice";

// Export orders slice
export {
    fetchOrders,
    fetchOrderDetail,
    submitReturnRequest,
    submitRefundRequest,
    cancelOrder,
    setSelectedStatus,
    setSortBy as setOrdersSortBy,
    setSearchQuery as setOrdersSearchQuery,
    setDateRange,
    resetFilters as resetOrderFilters,
    setSelectedOrder,
    clearOrders,
    type Order,
    type OrderProduct,
    type DeliveryAddress,
    type OrderStatus,
    type SortOption,
    type OrdersState,
    type RefundRequest,
} from "./ordersSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
