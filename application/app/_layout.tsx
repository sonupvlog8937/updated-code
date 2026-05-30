import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Animated from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProviders } from "@/src/components/AppProviders";
import { CustomSplashScreen } from "@/src/components/CustomSplashScreen";
import { Header } from "@/src/components/Header";
import { ToastHost } from "@/src/components/ToastHost";
import { ScrollVisibilityProvider } from "@/src/context/ScrollVisibilityContext";
import { store, useAppDispatch } from "@/src/store";
import { fetchCategories, initAuthFromStorage } from "@/src/store/appSlice";

SplashScreen.preventAutoHideAsync();

function AppBootstrap() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(initAuthFromStorage());
    dispatch(fetchCategories());
  }, [dispatch]);
  return null;
}

function RootLayoutNav() {
  return (
    <Animated.View style={{ flex: 1 }}>
      <Header />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="search" />
        <Stack.Screen name="products" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="login" options={{ presentation: "modal" }} />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="my-list" />
        <Stack.Screen name="my-orders" />
        <Stack.Screen name="order-details" />
        <Stack.Screen
          name="order-success"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="order-failed" options={{ presentation: "modal" }} />
        <Stack.Screen name="address" />
        <Stack.Screen name="add-address" />
        <Stack.Screen name="blog" />
        <Stack.Screen name="blog/[id]" />
        <Stack.Screen name="offers" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notification-settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="become-seller" />
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="store/[sellerId]" />
      </Stack>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (showCustomSplash) {
    return <CustomSplashScreen onFinish={() => setShowCustomSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ReduxProvider store={store}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ScrollVisibilityProvider>
                <AppProviders>
                  <AppBootstrap />
                  <RootLayoutNav />
                  <ToastHost />
                </AppProviders>
              </ScrollVisibilityProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </ReduxProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
