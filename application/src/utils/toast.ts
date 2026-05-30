import { Alert } from "react-native";

type ToastListener = (msg: string, type: "success" | "error" | "info") => void;
const listeners: Set<ToastListener> = new Set();

export const subscribeToast = (cb: ToastListener) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const showToast = (
  type: "success" | "error" | "info",
  msg: string,
) => {
  if (!msg) return;
  if (listeners.size === 0) {
    Alert.alert(type === "error" ? "Error" : "Info", msg);
    return;
  }
  listeners.forEach((cb) => cb(msg, type));
};
