import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { subscribeToast } from "../utils/toast";

interface ToastEntry {
  id: number;
  msg: string;
  type: "success" | "error" | "info";
}

let nextId = 1;

export const ToastHost: React.FC = () => {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const animationsRef = useRef<Map<number, Animated.Value>>(new Map());

  useEffect(() => {
    return subscribeToast((msg, type) => {
      const id = nextId++;
      const opacity = new Animated.Value(0);
      animationsRef.current.set(id, opacity);
      setToasts((prev) => [...prev, { id, msg, type }]);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }).start(() => {
          animationsRef.current.delete(id);
          setToasts((prev) => prev.filter((t) => t.id !== id));
        });
      }, 2800);
    });
  }, []);

  const iconFor = (type: ToastEntry["type"]) => {
    if (type === "success") return "check-circle" as const;
    if (type === "error") return "alert-circle" as const;
    return "info" as const;
  };

  const colorFor = (type: ToastEntry["type"]) => {
    if (type === "success") return colors.success;
    if (type === "error") return colors.destructive;
    return colors.info;
  };

  const top =
    Platform.OS === "web" ? Math.max(insets.top, 67) + 8 : insets.top + 12;

  return (
    <View pointerEvents="none" style={[styles.host, { top }]}>
      {toasts.map((t) => {
        const opacity = animationsRef.current.get(t.id) || new Animated.Value(1);
        const translateY = opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [-12, 0],
        });
        return (
          <Animated.View
            key={t.id}
            style={[
              styles.toast,
              {
                opacity,
                transform: [{ translateY }],
                backgroundColor: colors.background,
                borderColor: colors.border,
                shadowColor: "#000",
              },
            ]}
          >
            <Feather name={iconFor(t.type)} size={18} color={colorFor(t.type)} />
            <Text
              numberOfLines={3}
              style={[styles.msg, { color: colors.foreground }]}
            >
              {t.msg}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  msg: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
