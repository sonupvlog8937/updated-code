import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export type SortOption = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

export const SORT_OPTIONS: SortOption[] = [
  { key: "latest", label: "Latest", icon: "clock" },
  { key: "popular", label: "Popular", icon: "trending-up" },
  { key: "rating", label: "Highest Rated", icon: "star" },
  { key: "price_low", label: "Price: Low to High", icon: "arrow-down" },
  { key: "price_high", label: "Price: High to Low", icon: "arrow-up" },
];

interface SortModalProps {
  visible: boolean;
  selectedSort: string;
  onSelect: (sortKey: string) => void;
  onClose: () => void;
}

export function SortModal({ visible, selectedSort, onSelect, onClose }: SortModalProps) {
  const handleSelect = (sortKey: string) => {
    onSelect(sortKey);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={S.sortOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={S.sortMenu}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                S.sortOption, 
                selectedSort === option.key && S.sortOptionActive
              ]}
              onPress={() => handleSelect(option.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                S.sortText,
                selectedSort === option.key && S.sortTextActive
              ]}>
                {option.label}
              </Text>
              {selectedSort === option.key && (
                <Feather name="check" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const S = StyleSheet.create({
  sortOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sortMenu: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 8,
    paddingBottom: 20,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  sortOptionActive: {
    backgroundColor: "#2563eb",
  },
  sortText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  sortTextActive: {
    color: "#fff",
  },
});
