import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages?: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const T = {
  orange: "#FF6B2C",
  bg: "#F9F9F9",
  border: "#EBEBEB",
  text: "#111111",
  textSoft: "#999999",
  white: "#FFFFFF",
};

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  hasMore,
  onPageChange,
  loading = false,
}) => {
  const isNextDisabled = loading || (totalPages !== undefined ? currentPage >= totalPages : !hasMore);
  const isPrevDisabled = loading || currentPage <= 1;

  return (
    <View style={S.container}>
      <TouchableOpacity
        style={[S.button, isPrevDisabled && S.buttonDisabled]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={isPrevDisabled}
        activeOpacity={0.7}
      >
        <ChevronLeft size={20} color={isPrevDisabled ? T.textSoft : T.text} />
        <Text style={[S.buttonText, isPrevDisabled && S.textDisabled]}>Prev</Text>
      </TouchableOpacity>
      
      <View style={S.pageIndicator}>
        {loading ? (
          <ActivityIndicator size="small" color={T.orange} />
        ) : (
          <Text style={S.pageText}>
            Page {currentPage} {totalPages ? `of ${totalPages}` : ""}
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={[S.button, isNextDisabled && S.buttonDisabled]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={isNextDisabled}
        activeOpacity={0.7}
      >
        <Text style={[S.buttonText, isNextDisabled && S.textDisabled]}>Next</Text>
        <ChevronRight size={20} color={isNextDisabled ? T.textSoft : T.text} />
      </TouchableOpacity>
    </View>
  );
};

const S = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 14,
    backgroundColor: "transparent",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    gap: 4,
    minWidth: 90,
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#EEEEEE",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: T.text,
  },
  textDisabled: {
    color: T.textSoft,
  },
  pageIndicator: {
    paddingHorizontal: 10,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  pageText: {
    fontSize: 14,
    fontWeight: "700",
    color: T.textSoft,
  },
});
