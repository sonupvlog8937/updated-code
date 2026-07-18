import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  filterMeta: any;
  currentFilters: FilterValues;
  subCats: any[];
  subSubCats: any[];
  isRestaurant?: boolean;
};

export type FilterValues = {
  categoryId: string;
  subCategoryId: string;
  subSubCategoryId: string;
  foodType: string;
  minPrice: string;
  maxPrice: string;
  minRating: number;
  inStock: boolean;
};

export function FilterModal({
  visible,
  onClose,
  onApply,
  filterMeta,
  currentFilters,
  subCats,
  subSubCats,
  isRestaurant = false,
}: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const footerBottomPadding = Math.max(insets.bottom, 12) + 10;
  const [tempCategoryId, setTempCategoryId] = useState("");
  const [tempSubCategoryId, setTempSubCategoryId] = useState("");
  const [tempSubSubCategoryId, setTempSubSubCategoryId] = useState("");
  const [tempFoodType, setTempFoodType] = useState("");
  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");
  const [tempMinRating, setTempMinRating] = useState(0);
  const [tempInStock, setTempInStock] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempCategoryId(currentFilters.categoryId);
      setTempSubCategoryId(currentFilters.subCategoryId);
      setTempSubSubCategoryId(currentFilters.subSubCategoryId);
      setTempFoodType(currentFilters.foodType || "");
      setTempMinPrice(currentFilters.minPrice);
      setTempMaxPrice(currentFilters.maxPrice);
      setTempMinRating(currentFilters.minRating);
      setTempInStock(currentFilters.inStock);
    }
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApply({
      categoryId: tempCategoryId,
      subCategoryId: tempSubCategoryId,
      subSubCategoryId: tempSubSubCategoryId,
      foodType: tempFoodType,
      minPrice: tempMinPrice,
      maxPrice: tempMaxPrice,
      minRating: tempMinRating,
      inStock: tempInStock,
    });
    onClose();
  };

  const handleClear = () => {
    setTempCategoryId("");
    setTempSubCategoryId("");
    setTempSubSubCategoryId("");
    setTempFoodType("");
    setTempMinPrice("");
    setTempMaxPrice("");
    setTempMinRating(0);
    setTempInStock(false);
  };

  const visibleSubCats = useMemo(() => {
    const allSubCats = filterMeta?.subCategories || subCats || [];
    if (!tempCategoryId) return allSubCats;
    return allSubCats.filter((subCat: any) =>
      String(subCat.parentId) === String(tempCategoryId) ||
      String(subCat.categoryId) === String(tempCategoryId)
    );
  }, [filterMeta, subCats, tempCategoryId]);

  const visibleSubSubCats = useMemo(() => {
    const allSubSubCats = filterMeta?.subSubCategories || subSubCats || [];
    if (tempSubCategoryId) {
      return allSubSubCats.filter((subSubCat: any) =>
        String(subSubCat.subCategoryId) === String(tempSubCategoryId)
      );
    }
    if (tempCategoryId) {
      return allSubSubCats.filter((subSubCat: any) =>
        String(subSubCat.categoryId) === String(tempCategoryId)
      );
    }
    return allSubSubCats;
  }, [filterMeta, subSubCats, tempCategoryId, tempSubCategoryId]);

  const activeFiltersCount = [
    tempCategoryId,
    tempSubCategoryId,
    tempSubSubCategoryId,
    tempFoodType,
    tempMinPrice,
    tempMaxPrice,
    tempMinRating > 0,
    tempInStock,
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={S.container}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={S.closeBtn}
          >
            <Feather name="x" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={S.content}
          contentContainerStyle={S.contentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Type - Restaurant Only */}
          {isRestaurant && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Food Type</Text>
              {[{ _id: "", name: "All Food Types" }, { _id: "veg", name: "Veg" }, { _id: "non-veg", name: "Non-veg" }, { _id: "egg", name: "Egg" }].map((type) => (
                <TouchableOpacity
                  key={type._id}
                  onPress={() => setTempFoodType(type._id)}
                  style={S.option}
                >
                  <View
                    style={[
                      S.checkbox,
                      tempFoodType === type._id && S.checkboxActive,
                    ]}
                  >
                    {tempFoodType === type._id && (
                      <Feather name="check" size={12} color="#fff" />
                    )}
                  </View>
                  <Text style={S.optionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Categories */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Category</Text>
            {[{ _id: "", name: "All Categories" }, ...(filterMeta?.categories || [])].map((cat) => (
              <TouchableOpacity
                key={cat._id}
                onPress={() => {
                  setTempCategoryId(cat._id);
                  setTempSubCategoryId("");
                  setTempSubSubCategoryId("");
                }}
                style={S.option}
              >
                <View
                  style={[
                    S.checkbox,
                    tempCategoryId === cat._id && S.checkboxActive,
                  ]}
                >
                  {tempCategoryId === cat._id && (
                    <Feather name="check" size={12} color="#fff" />
                  )}
                </View>
                <Text style={S.optionText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sub-categories */}
          {visibleSubCats.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Sub-Category</Text>
              {[{ _id: "", name: "All Sub-Categories" }, ...visibleSubCats].map((sc) => (
                <TouchableOpacity
                  key={sc._id}
                  onPress={() => {
                    setTempSubCategoryId(sc._id);
                    setTempSubSubCategoryId("");
                  }}
                  style={S.option}
                >
                  <View
                    style={[
                      S.checkbox,
                      tempSubCategoryId === sc._id && S.checkboxActive,
                    ]}
                  >
                    {tempSubCategoryId === sc._id && (
                      <Feather name="check" size={12} color="#fff" />
                    )}
                  </View>
                  <Text style={S.optionText}>{sc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Sub-sub-categories */}
          {visibleSubSubCats.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Sub-Sub-Category</Text>
              {[{ _id: "", name: "All Sub-Sub-Categories" }, ...visibleSubSubCats].map((ssc) => (
                <TouchableOpacity
                  key={ssc._id}
                  onPress={() => setTempSubSubCategoryId(ssc._id)}
                  style={S.option}
                >
                  <View
                    style={[
                      S.checkbox,
                      tempSubSubCategoryId === ssc._id && S.checkboxActive,
                    ]}
                  >
                    {tempSubSubCategoryId === ssc._id && (
                      <Feather name="check" size={12} color="#fff" />
                    )}
                  </View>
                  <Text style={S.optionText}>{ssc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Price Range */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Price Range</Text>
            <View style={S.priceInputRow}>
              <TextInput
                placeholder="Min ₹"
                value={tempMinPrice}
                onChangeText={setTempMinPrice}
                keyboardType="numeric"
                style={S.priceInput}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                placeholder="Max ₹"
                value={tempMaxPrice}
                onChangeText={setTempMaxPrice}
                keyboardType="numeric"
                style={S.priceInput}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Rating */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Minimum Rating</Text>
            {[4, 3, 2].map((rating) => (
              <TouchableOpacity
                key={rating}
                onPress={() => setTempMinRating(tempMinRating === rating ? 0 : rating)}
                style={S.option}
              >
                <View
                  style={[
                    S.checkbox,
                    tempMinRating === rating && S.checkboxActive,
                  ]}
                >
                  {tempMinRating === rating && (
                    <Feather name="check" size={12} color="#fff" />
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={S.ratingStars}>{"⭐".repeat(rating)}</Text>
                  <Text style={S.optionText}>& above</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* In Stock */}
          <View style={S.section}>
            <TouchableOpacity
              style={S.option}
              onPress={() => setTempInStock(!tempInStock)}
            >
              <View
                style={[
                  S.checkbox,
                  tempInStock && S.checkboxActive,
                ]}
              >
                {tempInStock && (
                  <Feather name="check" size={12} color="#fff" />
                )}
              </View>
              <Text style={S.optionText}>In Stock Only</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[S.footer, { paddingBottom: footerBottomPadding }]}>
          {activeFiltersCount > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              style={[S.btn, S.clearBtn]}
            >
              <Text style={S.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onClose}
            style={[S.btn, S.cancelBtn]}
          >
            <Text style={S.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApply}
            style={[S.btn, S.applyBtn]}
          >
            <Text style={S.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  optionText: {
    fontSize: 12,
    color: "#111827",
  },
  priceInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: "#111827",
  },
  ratingStars: {
    fontSize: 10,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  clearBtn: {
    backgroundColor: "#ef4444",
  },
  clearBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  cancelBtn: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelBtnText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 13,
  },
  applyBtn: {
    backgroundColor: "#2563eb",
  },
  applyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
