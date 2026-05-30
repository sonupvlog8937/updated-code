import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function PaymentCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Payment callback is handled in checkout.tsx via deep linking
    // Just redirect back after a moment
    setTimeout(() => {
      router.back();
    }, 2000);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
