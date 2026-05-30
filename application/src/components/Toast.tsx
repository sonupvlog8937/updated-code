import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ToastMessage } from "@/src/context/ToastContext";

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const { width } = Dimensions.get("window");

const getToastStyles = (type: string) => {
  const baseStyles = {
    success: {
      backgroundColor: "#ECFDF5",
      borderColor: "#86EFAC",
      iconColor: "#16A34A",
      textColor: "#166534",
    },
    error: {
      backgroundColor: "#FEF2F2",
      borderColor: "#FCA5A5",
      iconColor: "#DC2626",
      textColor: "#7F1D1D",
    },
    warning: {
      backgroundColor: "#FFFBEB",
      borderColor: "#FDE68A",
      iconColor: "#D97706",
      textColor: "#92400E",
    },
    info: {
      backgroundColor: "#EFF6FF",
      borderColor: "#93C5FD",
      iconColor: "#2563EB",
      textColor: "#1E3A8A",
    },
  };

  return baseStyles[type as keyof typeof baseStyles] || baseStyles.info;
};

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return "check-circle";
    case "error":
      return "alert-circle";
    case "warning":
      return "alert-triangle";
    case "info":
      return "info";
    default:
      return "info";
  }
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const styleConfig = getToastStyles(toast.type);
  const iconName = getIcon(toast.type);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleRemove = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onRemove(toast.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: styleConfig.backgroundColor,
            borderColor: styleConfig.borderColor,
          },
        ]}
      >
        <Feather
          name={iconName as any}
          size={20}
          color={styleConfig.iconColor}
        />
        <Text
          style={[styles.message, { color: styleConfig.textColor }]}
          numberOfLines={2}
        >
          {toast.message}
        </Text>
        <TouchableOpacity onPress={handleRemove} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Feather name="x" size={18} color={styleConfig.iconColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 1000,
    pointerEvents: "box-none",
  },
  toastContainer: {
    marginBottom: 12,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
});
