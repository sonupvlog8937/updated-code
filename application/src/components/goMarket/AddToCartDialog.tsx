import { showToast } from "@/src/utils/toast";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { gmImg, GO_MARKET_FALLBACK } from "@/src/utils/goMarketMedia";

type ProductOption = {
  _id: string;
  name: string;
  price: number;
  isDefault?: boolean;
};

type Product = {
  _id: string;
  name: string;
  itemName?: string;
  productName?: string;
  image: string;
  images?: string[];
  price: number;
  oldPrice?: number;
  originalPrice?: number;
  discount?: number;
  discountPrice?: number;
  description?: string;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  totalReviews?: number;
  options?: ProductOption[];
  productOptions?: { name?: string; label?: string; values?: string[] }[];
};

type AddToCartDialogProps = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, selectedOption: ProductOption | null, quantity: number) => void;
};

export function AddToCartDialog({ visible, product, onClose, onAddToCart }: AddToCartDialogProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const normalizedOptions = useMemo(() => {
    if (product?.options?.length) return product.options;

    return (product?.productOptions || []).flatMap((option, optionIndex) =>
      (option.values || []).map((rawValue: any, valueIndex) => {
        const value = typeof rawValue === "object" ? (rawValue.label || rawValue.value || rawValue.name) : rawValue;
        return {
          _id: `${option.name || option.label || optionIndex}-${value}-${valueIndex}`,
          name: `${option.name || option.label || "Option"}: ${value}`,
          price: typeof rawValue === "object" ? Number(rawValue.price || 0) : 0,
          isDefault: (typeof rawValue === "object" && rawValue.isDefault) || (optionIndex === 0 && valueIndex === 0),
        };
      }),
    );
  }, [product]);

  useEffect(() => {
    if (visible && normalizedOptions.length) {
      setSelectedOption(normalizedOptions.find((o) => o.isDefault) || null);
    }
  }, [visible, product?._id, normalizedOptions]);

  if (!product) return null;

  const productName = product.name || product.itemName || product.productName || "Product";
  const hasOptions = normalizedOptions.length > 0;
  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
  const oldPrice = product.oldPrice || product.originalPrice;
  const discount = product.discount || (oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);
  const rating = Number(product.averageRating || product.rating || 0);
  const reviews = Number(product.reviewCount || product.totalReviews || 0);
  const optionPrice = selectedOption?.price && selectedOption.price > 0 ? selectedOption.price : price;
  const totalPrice = optionPrice * quantity;

  const handleAddToCart = async () => {
    if (hasOptions && !selectedOption) {
      showToast("error", "Please select a product option");
      return;
    }
    setAdding(true);
    try {
      await onAddToCart(product, selectedOption, quantity);
      // Reset state
      setSelectedOption(null);
      setQuantity(1);
      onClose();
    } catch {
      // Parent handler shows the user-facing error toast.
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    setQuantity(1);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={S.overlay} onPress={handleClose}>
        <Pressable style={S.dialog} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={S.header}>
            <Text style={S.headerTitle}>Add to Cart</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={S.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Product Info */}
            <View style={S.productInfo}>
              <Image
                source={{ uri: gmImg(product.image, GO_MARKET_FALLBACK) }}
                style={S.productImage}
              />
              <View style={S.productDetails}>
                <Text style={S.productName}>{productName}</Text>
                {product.description && (
                  <Text style={S.productDesc}>{product.description}</Text>
                )}
                <View style={S.metaRow}>
                  <Text style={S.productPrice}>₹{price}</Text>
                  {oldPrice && oldPrice > price ? <Text style={S.oldPrice}>₹{oldPrice}</Text> : null}
                  {discount ? <Text style={S.discountPill}>{discount}% OFF</Text> : null}
                </View>
                <Text style={S.ratingLine}>⭐ {rating.toFixed(1)} · {reviews} reviews</Text>
              </View>
            </View>

            {/* Options */}
            {hasOptions && (
              <View style={S.section}>
                <Text style={S.sectionTitle}>Select Option *</Text>
                {normalizedOptions.map((option) => {
                  const isSelected = selectedOption?._id === option._id;
                  return (
                    <TouchableOpacity
                      key={option._id}
                      style={[S.optionItem, isSelected && S.optionItemSelected]}
                      onPress={() => setSelectedOption(option)}
                      activeOpacity={0.7}
                    >
                      <View style={S.optionRadio}>
                        {isSelected && <View style={S.optionRadioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[S.optionName, isSelected && S.optionNameSelected]}>
                          {option.name}
                        </Text>
                        {option.price > 0 && (
                          <Text style={S.optionPrice}>₹{option.price}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Quantity */}
            <View style={S.section}>
              <Text style={S.sectionTitle}>Quantity</Text>
              <View style={S.quantityControl}>
                <TouchableOpacity
                  style={S.quantityBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  activeOpacity={0.7}
                >
                  <Text style={[S.quantityBtnText, quantity <= 1 && S.quantityBtnDisabled]}>−</Text>
                </TouchableOpacity>
                <Text style={S.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={S.quantityBtn}
                  onPress={() => setQuantity(quantity + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={S.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={S.footer}>
            <View>
              <Text style={S.footerLabel}>Total</Text>
              <Text style={S.footerPrice}>₹{totalPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={S.viewCartButton}
              onPress={() => { handleClose(); router.push("/cart" as never); }}
              activeOpacity={0.8}
            >
              <Text style={S.viewCartButtonText}>View Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.addButton, (hasOptions && !selectedOption) && S.addButtonDisabled]}
              onPress={handleAddToCart}
              disabled={adding}
              activeOpacity={0.8}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={S.addButtonText}>Add to Cart</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  dialog: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: "400",
    color: "#666",
  },
  productInfo: {
    flexDirection: "row",
    padding: 20,
    gap: 14,
  },
  productImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  productDetails: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    lineHeight: 20,
  },
  productDesc: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  oldPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    textDecorationLine: "line-through",
  },
  discountPill: {
    fontSize: 10,
    fontWeight: "900",
    color: "#D32F2F",
    backgroundColor: "#FFF1F1",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingLine: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5A6B4D",
  },
  productPrice: {
    fontSize: 17,
    fontWeight: "900",
    color: "#2D5016",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  optionItemSelected: {
    borderColor: "#2D5016",
    backgroundColor: "#f0f7ed",
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d0d0d0",
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2D5016",
  },
  optionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  optionNameSelected: {
    color: "#2D5016",
    fontWeight: "700",
  },
  optionPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginTop: 2,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  quantityBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  quantityBtnText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  quantityBtnDisabled: {
    color: "#ccc",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    minWidth: 40,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 16,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1a1a1a",
  },
  viewCartButton: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F0F7ED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CFE4C4",
  },
  viewCartButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2D5016",
  },
  addButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#2D5016",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2D5016",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
