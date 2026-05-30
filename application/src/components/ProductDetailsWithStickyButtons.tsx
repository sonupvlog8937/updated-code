import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  Text,
  TouchableOpacity,
} from "react-native";
import { ProductDetailsComponent } from "./ProductDetailsComponent";

interface ProductDetailsWithStickyButtonsProps {
  item: any;
  reviewsCount?: number;
  gotoReviews?: () => void;
  gotoSpecs?: () => void;
  onColorChange?: (images: string[]) => void;
}

const BUTTON_BAR_HEIGHT = 70;

export const ProductDetailsWithStickyButtons: React.FC<
  ProductDetailsWithStickyButtonsProps
> = ({
  item,
  reviewsCount = 0,
  gotoReviews,
  gotoSpecs,
  onColorChange,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showStickyButtons, setShowStickyButtons] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const windowHeight = Dimensions.get("window").height;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // Show sticky buttons after scrolling 150px
        setShowStickyButtons(offsetY > 150);
      },
    }
  );

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToButtons = () => {
    // Calculate the position of the buttons in ProductDetailsComponent
    // This will scroll to show the Add to Cart and Buy Now buttons
    scrollViewRef.current?.scrollTo({ y: windowHeight, animated: true });
  };

  return (
    <View style={S.container}>
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        style={S.scrollView}
      >
        <ProductDetailsComponent
          item={item}
          reviewsCount={reviewsCount}
          gotoReviews={gotoReviews}
          gotoSpecs={gotoSpecs}
          onColorChange={onColorChange}
        />
        {/* Extra padding to account for sticky buttons */}
        <View style={{ height: BUTTON_BAR_HEIGHT + 20 }} />
      </ScrollView>

      {/* ── STICKY BUTTON BAR ── */}
      {showStickyButtons && (
        <Animated.View
          style={[
            S.stickyButtonBar,
            {
              opacity: Animated.add(scrollY, 0).interpolate({
                inputRange: [150, 300],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateY: Animated.add(scrollY, 0).interpolate({
                    inputRange: [150, 300],
                    outputRange: [BUTTON_BAR_HEIGHT, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
        >
          <View style={S.stickyContent}>
            {/* Product Mini Info */}
            <View style={S.miniProductInfo}>
              <View style={{ flex: 1 }}>
                <Text
                  style={S.miniProductName}
                  numberOfLines={1}
                >
                  {item?.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={S.miniPrice}>
                    ₹{item?.price?.toLocaleString?.("en-IN") || "0"}
                  </Text>
                  {item?.oldPrice && (
                    <Text style={S.miniOldPrice}>
                      ₹{item?.oldPrice?.toLocaleString?.("en-IN") || "0"}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Button Actions */}
            <View style={S.buttonActions}>
              <TouchableOpacity
                style={S.stickyAddToCartBtn}
                onPress={scrollToButtons}
              >
                <Text style={S.stickyAddToCartText}>Add to Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={S.stickyBuyNowBtn}
                onPress={scrollToButtons}
              >
                <Text style={S.stickyBuyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};



/* ── Styles ── */
const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  stickyButtonBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BUTTON_BAR_HEIGHT,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  stickyContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  miniProductInfo: {
    flex: 1.2,
    justifyContent: "center",
  },
  miniProductName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
    lineHeight: 16,
  },
  miniPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  miniOldPrice: {
    fontSize: 11,
    color: "rgba(0,0,0,0.3)",
    textDecorationLine: "line-through",
  },
  buttonActions: {
    flex: 1.3,
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  stickyAddToCartBtn: {
    flex: 0.95,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#111",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  stickyAddToCartText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },
  stickyBuyNowBtn: {
    flex: 0.95,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ff6b00",
    borderRadius: 8,
  },
  stickyBuyNowText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
});
