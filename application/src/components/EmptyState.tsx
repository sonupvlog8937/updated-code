import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { PrimaryButton } from "./PrimaryButton";

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  ctaTitle?: string;
  onCta?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  icon = "inbox",
  title,
  description,
  ctaTitle,
  onCta,
}) => {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Feather name={icon} size={32} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {description ? (
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          {description}
        </Text>
      ) : null}
      {ctaTitle && onCta ? (
        <View style={{ marginTop: 18 }}>
          <PrimaryButton title={ctaTitle} onPress={onCta} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  desc: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    maxWidth: 280,
  },
});
