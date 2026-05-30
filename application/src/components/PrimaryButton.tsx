import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const PrimaryButton: React.FC<Props> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const palette = {
    primary: {
      bg: colors.primary || "#f97316",
      fg: colors.primaryForeground || "#ffffff",
      border: "transparent",
    },
    outline: {
      bg: "transparent",
      fg: colors.primary || "#f97316",
      border: colors.primary || "#f97316",
    },
    ghost: {
      bg: "transparent",
      fg: colors.foreground || "#000000",
      border: "transparent",
    },
    dark: {
      bg: "#171717",
      fg: "#ffffff",
      border: "transparent",
    },
  }[variant];

  const sizes = {
    sm: { py: 9, px: 14, font: 13 },
    md: { py: 13, px: 18, font: 14 },
    lg: { py: 16, px: 22, font: 15 },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingVertical: sizes.py,
          paddingHorizontal: sizes.px,
          opacity: isDisabled ? 0.6 : pressed ? 0.9 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          borderWidth: variant === "outline" ? 1.5 : 0,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={palette.fg} size="small" />
        ) : (
          <>
            {leftIcon}
            <Text
              style={[
                styles.btnText,
                {
                  color: palette.fg,
                  fontSize: sizes.font,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {rightIcon}
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
});
