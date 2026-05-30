import React from "react";
import {
  Modal,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useLoading } from "@/src/context/LoadingContext";

const { width, height } = Dimensions.get("window");

export const GlobalLoader = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <Modal
      visible={isLoading}
      transparent
      statusBarTranslucent
      animationType="fade"
      hardwareAccelerated
    >
      <View style={styles.overlay}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loaderText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#374151",
    marginTop: 8,
  },
});
