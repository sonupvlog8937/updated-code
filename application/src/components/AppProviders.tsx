import React from "react";
import { View } from "react-native";
import { LoadingProvider } from "@/src/context/LoadingContext";
import { ToastProvider, useToast } from "@/src/context/ToastContext";
import { GlobalLoader } from "@/src/components/GlobalLoader";
import { ToastContainer } from "@/src/components/Toast";

// Inner component that uses the Toast context
const ToastRenderer = () => {
  const { toasts, removeToast } = useToast();

  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
};

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <LoadingProvider>
      <ToastProvider>
        <View style={{ flex: 1 }}>
          <GlobalLoader />
          <ToastRenderer />
          {children}
        </View>
      </ToastProvider>
    </LoadingProvider>
  );
};
