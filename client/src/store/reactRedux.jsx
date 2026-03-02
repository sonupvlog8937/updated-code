import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";

const StoreContext = createContext(null);

export const Provider = ({ store, children }) => {
  const value = useMemo(() => ({ store }), [store]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

const useStore = () => {
  const context = useContext(StoreContext);
  if (!context?.store) {
    throw new Error("Store is not available. Wrap your app in <Provider store={store}>.");
  }
  return context.store;
};

export const useDispatch = () => useStore().dispatch;

export const useSelector = (selector) => {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
};