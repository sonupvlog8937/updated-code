import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";

export type SortOption = {
  key: string;
  label: string;
  icon: string;
};

export const SORT_OPTIONS: SortOption[] = [
  { key: "latest", label: "Latest", icon: "🕐" },
  { key: "popular", label: "Popular", icon: "🔥" },
  { key: "rating", label: "Highest Rated", icon: "⭐" },
  { key: "price_low", label: "Price: Low to High", icon: "📉" },
  { key: "price_high", label: "Price: High to Low", icon: "📈" },
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={S.container}>
        <View style={S.header}>
          <Text style={S.title}>Sort By</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={S.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={S.optionsContainer}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[S.option, selectedSort === option.key && S.optionActive]}
              onPress={() => handleSelect(option.key)}
            >
              <Text style={S.optionIcon}>{option.icon}</Text>
              <Text style={[S.optionLabel, selectedSort === option.key && S.optionLabelActive]}>
                {option.label}
              </Text>
              {selectedSort === option.key && <Text style={S.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={S.applyBtn} onPress={onClose}>
          <Text style={S.applyBtnText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  closeBtn: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "700",
  },
  optionsContainer: {
    backgroundColor: "#fff",
    maxHeight: "70%",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 4,
    backgroundColor: "#f8fafc",
  },
  optionActive: {
    backgroundColor: "#f0f9ff",
  },
  optionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    flex: 1,
  },
  optionLabelActive: {
    color: "#0f172a",
    fontWeight: "700",
  },
  checkmark: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "700",
  },
  applyBtn: {
    backgroundColor: "#0f172a",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
