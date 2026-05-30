import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SW } = Dimensions.get("window");
const IS_SMALL = SW < 375;

interface FooterActionButtonsProps {
  isAdded: boolean;
  isLoading: boolean;
  isBuyingNow: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export const FooterActionButtons: React.FC<FooterActionButtonsProps> = ({
  isAdded,
  isLoading,
  isBuyingNow,
  onAddToCart,
  onBuyNow,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: insets.bottom + (IS_SMALL ? 10 : 12),
          paddingHorizontal: IS_SMALL ? 12 : 16,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.btnCart,
          { backgroundColor: isAdded ? "#111" : "#fff" },
        ]}
        onPress={onAddToCart}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isAdded ? "#fff" : "#111"} />
        ) : (
          <>
            <Text style={{ fontSize: IS_SMALL ? 14 : 16 }}>
              {isAdded ? "✓" : "🛒"}
            </Text>
            <Text
              style={[
                styles.btnCartText,
                {
                  color: isAdded ? "#fff" : "#111",
                  fontSize: IS_SMALL ? 12 : 14,
                },
              ]}
            >
              {isAdded ? "Added" : "Add to Cart"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnBuy}
        onPress={onBuyNow}
        disabled={isBuyingNow}
      >
        {isBuyingNow ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={{ fontSize: IS_SMALL ? 12 : 14 }}>⚡</Text>
            <Text style={[styles.btnBuyText, { fontSize: IS_SMALL ? 12 : 14 }]}>
              Buy Now
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    zIndex: 10,
  },
  btnCart: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#111",
    borderRadius: 12,
  },
  btnCartText: { fontWeight: "700" },
  btnBuy: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ff6b00",
    borderRadius: 12,
  },
  btnBuyText: { color: "#fff", fontWeight: "700" },
});
