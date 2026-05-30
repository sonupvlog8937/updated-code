import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export const QtyBox: React.FC<Props> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}) => {
  const colors = useColors();
  const dim = size === "sm" ? 28 : 34;
  const fs = size === "sm" ? 13 : 15;

  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Pressable
        onPress={dec}
        disabled={value <= min}
        style={[styles.btn, { width: dim, height: dim }]}
      >
        <Feather
          name="minus"
          size={14}
          color={value <= min ? colors.mutedForeground : colors.foreground}
        />
      </Pressable>
      <Text
        style={[
          styles.value,
          { color: colors.foreground, fontSize: fs, minWidth: dim },
        ]}
      >
        {value}
      </Text>
      <Pressable
        onPress={inc}
        disabled={value >= max}
        style={[styles.btn, { width: dim, height: dim }]}
      >
        <Feather
          name="plus"
          size={14}
          color={value >= max ? colors.mutedForeground : colors.foreground}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});
