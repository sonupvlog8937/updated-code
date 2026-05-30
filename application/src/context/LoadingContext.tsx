import React, { createContext, useContext, useState, useCallback } from "react";

interface LoadingContextType {
  isLoading: boolean;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  setLoaderMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");

  const showLoader = useCallback((msg: string = "Loading...") => {
    setMessage(msg);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
    setMessage("Loading...");
  }, []);

  const setLoaderMessage = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        showLoader,
        hideLoader,
        setLoaderMessage,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};
