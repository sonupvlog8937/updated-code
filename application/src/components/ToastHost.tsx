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
      const scale = new Animated.Value(0.92);
      animationsRef.current.set(id, opacity);
      setToasts((prev) => [...prev, { id, msg, type }]);
      
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.92,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start(() => {
          animationsRef.current.delete(id);
          setToasts((prev) => prev.filter((t) => t.id !== id));
        });
      }, 3200);
    });
  }, []);

  const iconFor = (type: ToastEntry["type"]) => {
    if (type === "success") return "check-circle" as const;
    if (type === "error") return "alert-circle" as const;
    return "info" as const;
  };

  const bgColorFor = (type: ToastEntry["type"]) => {
    if (type === "success") return "#F0FDF4";
    if (type === "error") return "#FEF2F2";
    return "#F0F9FF";
  };

  const borderColorFor = (type: ToastEntry["type"]) => {
    if (type === "success") return "#86EFAC";
    if (type === "error") return "#FECACA";
    return "#93C5FD";
  };

  const iconColorFor = (type: ToastEntry["type"]) => {
    if (type === "success") return "#16A34A";
    if (type === "error") return "#DC2626";
    return "#2563EB";
  };

  const textColorFor = (type: ToastEntry["type"]) => {
    if (type === "success") return "#166534";
    if (type === "error") return "#7F1D1D";
    return "#1E3A8A";
  };

  const top =
    Platform.OS === "web" ? Math.max(insets.top, 67) + 8 : insets.top + 12;

  return (
    <View pointerEvents="none" style={[styles.host, { top }]}>
      {toasts.map((t) => {
        const opacity = animationsRef.current.get(t.id) || new Animated.Value(1);
        const scale = new Animated.Value(1);
        const translateY = opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [-16, 0],
        });
        return (
          <Animated.View
            key={t.id}
            style={[
              styles.toast,
              {
                opacity,
                transform: [{ translateY }, { scale }],
                backgroundColor: bgColorFor(t.type),
                borderColor: borderColorFor(t.type),
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Feather name={iconFor(t.type)} size={20} color={iconColorFor(t.type)} />
            </View>
            <Text
              numberOfLines={3}
              style={[styles.msg, { color: textColorFor(t.type) }]}
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
    gap: 10,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.15,
    elevation: 8,
    overflow: "hidden",
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  msg: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
});
