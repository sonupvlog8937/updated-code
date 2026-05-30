import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  value?: number;
  size?: number;
  showValue?: boolean;
  color?: string;
}

export const RatingStars: React.FC<Props> = ({
  value = 0,
  size = 14,
  showValue = false,
  color,
}) => {
  const colors = useColors();
  const star = color || "#f59e0b";
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  return (
    <View style={styles.row}>
      {[0, 1, 2, 3, 4].map((i) => {
        const name =
          i < full ? "star" : i === full && half ? "star" : "star";
        const filled = i < full || (i === full && half);
        return (
          <Feather
            key={i}
            name={name as never}
            size={size}
            color={filled ? star : colors.border}
          />
        );
      })}
      {showValue && (
        <Text
          style={{
            marginLeft: 4,
            fontSize: size - 2,
            color: colors.mutedForeground,
            fontFamily: "Inter_500Medium",
          }}
        >
          {v.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 1 },
});
