import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./appSlice";
import goMarketReducer from "./goMarketSlice";
import searchReducer from "./searchSlice";


export const store = configureStore({
  reducer: {
    app: appReducer,
    goMarket: goMarketReducer,
    search: searchReducer,
  },
});