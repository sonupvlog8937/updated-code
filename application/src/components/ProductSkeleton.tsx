import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  count?: number;
  variant?: "grid" | "list";
}

export const ProductSkeleton: React.FC<Props> = ({ count = 6, variant = "grid" }) => {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  const screenW = Dimensions.get("window").width;
  const cardW = variant === "grid" ? (screenW - 36) / 2 : screenW - 32;

  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.card,
            {
              width: cardW,
              backgroundColor: colors.muted,
              opacity,
              height: variant === "grid" ? 250 : 130,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 16,
  },
});
