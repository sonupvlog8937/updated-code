import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  alertBox,
  fetchCartItems,
  fetchMyListData,
  fetchUserDetails,
  setAddressId,
  setAddressMode,
  setCatData,
  setIsLogin,
  setMyListData,
  setOpenAddressPanel,
  setOpenCartPanel,
  setOpenFilter,
  setOpenProductDetailsModal,
  setOpenSearchPanel,
  setSearchData,
  setUserData,
  setWindowWidth,
  setisFilterBtnShow,
  setCartData,
} from "../store/appSlice";

export const useAppContext = () => {
  const dispatch = useDispatch();
  const state = useSelector((store) => store.app);

  const toggleCartPanel = (newOpen) => () =>
    dispatch(setOpenCartPanel(newOpen));
  const toggleAddressPanel = (newOpen) => () => {
    if (newOpen === false) {
      dispatch(setAddressMode("add"));
    }
    dispatch(setOpenAddressPanel(newOpen));
  };

  return {
    ...state,
    setOpenProductDetailsModal: (payload) =>
      dispatch(setOpenProductDetailsModal(payload)),
    handleOpenProductDetailsModal: (status, item) =>
      dispatch(setOpenProductDetailsModal({ open: status, item })),
    handleCloseProductDetailsModal: () =>
      dispatch(setOpenProductDetailsModal({ open: false, item: {} })),
    setOpenCartPanel: (payload) => dispatch(setOpenCartPanel(payload)),
    toggleCartPanel,
    setOpenAddressPanel: (payload) => dispatch(setOpenAddressPanel(payload)),
    toggleAddressPanel,
    setIsLogin: (payload) => dispatch(setIsLogin(payload)),
    alertBox: (type, msg) => dispatch(alertBox({ type, msg })),
    setUserData: (payload) => dispatch(setUserData(payload)),
    setCatData: (payload) => dispatch(setCatData(payload)),
    addToCart: (product, userId, quantity) =>
      dispatch(addToCart({ product, userId, quantity })),
    setCartData: (payload) => dispatch(setCartData(payload)),
    getCartItems: () => dispatch(fetchCartItems()),
    setMyListData: (payload) => dispatch(setMyListData(payload)),
    getMyListData: () => dispatch(fetchMyListData()),
    getUserDetails: () => dispatch(fetchUserDetails()),
    setAddressMode: (payload) => dispatch(setAddressMode(payload)),
    setAddressId: (payload) => dispatch(setAddressId(payload)),
    setSearchData: (payload) => dispatch(setSearchData(payload)),
    setWindowWidth: (payload) => dispatch(setWindowWidth(payload)),
    setOpenFilter: (payload) => dispatch(setOpenFilter(payload)),
    setisFilterBtnShow: (payload) => dispatch(setisFilterBtnShow(payload)),
    setOpenSearchPanel: (payload) => dispatch(setOpenSearchPanel(payload)),
  };
};
