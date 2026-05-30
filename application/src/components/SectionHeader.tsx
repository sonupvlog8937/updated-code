import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}

export const SectionHeader: React.FC<Props> = ({
  title,
  subtitle,
  onSeeAll,
  seeAllLabel = "See all",
}) => {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} style={styles.cta}>
          <Text style={[styles.ctaText, { color: colors.primary }]}>
            {seeAllLabel}
          </Text>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 8,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" },
  cta: { flexDirection: "row", alignItems: "center", gap: 2 },
  ctaText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
