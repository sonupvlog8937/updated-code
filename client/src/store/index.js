import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./appSlice";
import goMarketReducer from "./goMarketSlice";


export const store = configureStore({
  reducer: {
    app: appReducer,
    goMarket: goMarketReducer,
  },
});