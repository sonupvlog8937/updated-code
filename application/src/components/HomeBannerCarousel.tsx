import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  banners: string[];
  height?: number;
  onPress?: (index: number) => void;
  autoplay?: boolean;
}

export const HomeBannerCarousel: React.FC<Props> = ({
  banners,
  height = 180,
  onPress,
  autoplay = true,
}) => {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);
  const width = Dimensions.get("window").width - 24;

  useEffect(() => {
    if (!autoplay || banners.length < 2) return;
    const id = setInterval(() => {
      setActive((p) => {
        const next = (p + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [autoplay, banners.length, width]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== active) setActive(i);
  };

  if (!banners?.length) {
    return (
      <View
        style={{
          marginHorizontal: 12,
          height,
          borderRadius: 16,
          backgroundColor: colors.muted,
        }}
      />
    );
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {banners.map((uri, i) => (
          <Pressable
            key={i}
            onPress={() => onPress?.(i)}
            style={{ width, height }}
          >
            <Image
              source={{ uri }}
              style={[styles.img, { backgroundColor: colors.muted }]}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {banners.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === active ? 18 : 6,
                backgroundColor: i === active ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  img: { width: "100%", height: "100%", borderRadius: 16 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
