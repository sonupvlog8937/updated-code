import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Category } from "../store/appSlice";

interface Props {
  categories: Category[];
}

export const CategoryStrip: React.FC<Props> = ({ categories }) => {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories?.map((cat) => (
        <Pressable
          key={cat._id}
          onPress={() =>
            router.push(`/products?catId=${cat._id}&catName=${encodeURIComponent(cat.name)}` as never)
          }
          style={styles.item}
        >
          <View
            style={[
              styles.imgWrap,
              { backgroundColor: cat.color || colors.muted },
            ]}
          >
            {cat.images?.[0] ? (
              <Image
                source={{ uri: cat.images[0] }}
                style={styles.img}
                contentFit="cover"
              />
            ) : (
              <Text style={[styles.placeholder, { color: colors.foreground }]}>
                {cat.name?.charAt(0)?.toUpperCase()}
              </Text>
            )}
          </View>
          <Text
            numberOfLines={2}
            style={[styles.label, { color: colors.foreground }]}
          >
            {cat.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, gap: 14 },
  item: { width: 72, alignItems: "center" },
  imgWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%" },
  placeholder: { fontSize: 22, fontFamily: "Inter_700Bold" },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 14,
  },
});
