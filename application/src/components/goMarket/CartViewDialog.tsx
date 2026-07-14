import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { setCartData } from "@/src/store/appSlice";
import { gmImg } from "@/src/utils/goMarketMedia";
import { deleteData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const { width: SCREEN_W } = Dimensions.get("window");

// Grocery Theme Colors
const T = {
  green: "#2D5016",
  greenDark: "#1E3410",
  greenLight: "#E8F5E1",
  white: "#FFFFFF",
  bg: "#F5F8F2",
  surface: "#FFFFFF",
  border: "#E0E8D8",
  text: "#1A1A1A",
  textSoft: "#5A6B4D",
  textMuted: "#9BA896",
  red: "#D32F2F",
  warning: "#F59E0B",
};

type CartViewDialogProps = {
  visible: boolean;
  onClose: () => void;
};

type BusyState = {
  itemId: string | null;
  action: "remove" | "wishlist" | null;
};

export function CartViewDialog({ visible, onClose }: CartViewDialogProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const footerBottomPadding = Math.max(insets.bottom, 12) + 10;
  const cartData = useAppSelector((s: any) => s.app.cartData || []);
  const slideAnim = useRef(new Animated.Value(SCREEN_W)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState<BusyState>({ itemId: null, action: null });

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_W,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const totalAmount = cartData.reduce((sum: number, item: any) => sum + (item.subTotal || 0), 0);
  const totalItems = cartData.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const handleCheckout = () => {
    onClose();
    router.push("/checkout" as never);
  };

  const handleViewFullCart = () => {
    onClose();
    router.push("/cart" as never);
  };

  const removeItem = async (item: any) => {
    // Prevent multiple operations on same item
    if (busy.itemId === item._id) return;
    
    setBusy({ itemId: item._id, action: "remove" });
    try {
      const res = await deleteData(`/api/cart/delete-cart-item/${item._id}`);
      if (res?.success === true) {
        showToast("success", "Removed from cart");
        dispatch(setCartData(cartData.filter((c: any) => c._id !== item._id)));
      } else {
        showToast("error", res?.message || "Failed to remove");
      }
    } catch {
      showToast("error", "Failed to remove item");
    } finally {
      setBusy({ itemId: null, action: null });
    }
  };

  const handleWishlist = async (item: any) => {
    // Prevent multiple operations on same item
    if (busy.itemId === item._id) return;
    
    setBusy({ itemId: item._id, action: "wishlist" });
    try {
      // Remove from cart and move to wishlist
      const res = await deleteData(`/api/cart/delete-cart-item/${item._id}`);
      if (res?.success === true || res?.error === false) {
        showToast("success", "Moved to wishlist");
        dispatch(setCartData(cartData.filter((c: any) => c._id !== item._id)));
      } else {
        showToast("error", res?.message || "Failed to move to wishlist");
      }
    } catch {
      showToast("error", "Failed to move to wishlist");
    } finally {
      setBusy({ itemId: null, action: null });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={S.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropAnim },
            ]}
          />
        </TouchableOpacity>

        <Animated.View
          style={[
            S.dialog,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={S.header}>
            <View style={S.headerTitleRow}>
              <Text style={S.headerIcon}>🛒</Text>
              <View>
                <Text style={S.headerTitle}>Your Cart</Text>
                <Text style={S.headerSubtitle}>
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={S.closeBtn}>
              <Text style={S.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Cart Items */}
          <ScrollView style={S.itemsList} showsVerticalScrollIndicator={false}>
            {cartData.length === 0 ? (
              <View style={S.emptyCart}>
                <Text style={S.emptyIcon}>🛒</Text>
                <Text style={S.emptyTitle}>Your cart is empty</Text>
                <Text style={S.emptySub}>Add items to get started</Text>
              </View>
            ) : (
              cartData.map((item: any, index: number) => (
                <View key={item._id || index} style={S.cartItem}>
                  {/* Item Image */}
                  <Image
                    source={{ uri: gmImg(item.image, "https://placehold.co/80x80/E8F5E1/2D5016?text=Item") }}
                    style={S.itemImg}
                  />
                  
                  {/* Item Info */}
                  <View style={S.itemInfo}>
                    <Text style={S.itemName} numberOfLines={2}>
                      {item.productTitle}
                    </Text>
                    {item.brand && (
                      <Text style={S.itemBrand}>{item.brand}</Text>
                    )}
                    
                    {/* Selected Options */}
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <View style={S.optionsRow}>
                        {Object.entries(item.selectedOptions).map(([key, value]: any) => (
                          <View key={key} style={S.optionChip}>
                            <Text style={S.optionChipText}>{value}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <View style={S.itemFooter}>
                      <Text style={S.itemPrice}>₹{item.price}</Text>
                      <Text style={S.itemQty}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                  
                  {/* Right Section */}
                  <View style={S.itemRight}>
                    <Text style={S.itemTotal}>₹{item.subTotal}</Text>
                    
                    {/* Action Buttons */}
                    <View style={S.actionBtns}>
                      {/* Wishlist Button */}
                      <TouchableOpacity
                        style={[
                          S.actionBtn, 
                          S.wishlistBtn,
                          busy.itemId === item._id && S.btnDisabled
                        ]}
                        onPress={() => handleWishlist(item)}
                        disabled={busy.itemId === item._id}
                        activeOpacity={0.7}
                      >
                        {busy.itemId === item._id && busy.action === "wishlist" ? (
                          <ActivityIndicator size={13} color={T.warning} />
                        ) : (
                          <Feather name="heart" size={12} color={T.warning} />
                        )}
                      </TouchableOpacity>
                      
                      {/* Remove Button */}
                      <TouchableOpacity
                        style={[
                          S.actionBtn, 
                          S.removeBtn,
                          busy.itemId === item._id && S.btnDisabled
                        ]}
                        onPress={() => removeItem(item)}
                        disabled={busy.itemId === item._id}
                        activeOpacity={0.7}
                      >
                        {busy.itemId === item._id && busy.action === "remove" ? (
                          <ActivityIndicator size={13} color={T.red} />
                        ) : (
                          <Feather name="trash-2" size={12} color={T.red} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          {cartData.length > 0 && (
            <View style={[S.footer, { paddingBottom: footerBottomPadding }]}>
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Total Amount</Text>
                <Text style={S.totalAmount}>₹{totalAmount.toLocaleString("en-IN")}</Text>
              </View>

              <View style={S.footerActionBtns}>
                <TouchableOpacity
                  style={S.viewCartBtn}
                  onPress={handleViewFullCart}
                  activeOpacity={0.8}
                  disabled={busy.itemId !== null}
                >
                  <Text style={S.viewCartBtnTxt}>View Full Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.checkoutBtn}
                  onPress={handleCheckout}
                  activeOpacity={0.8}
                  disabled={busy.itemId !== null}
                >
                  <Text style={S.checkoutBtnTxt}>Proceed to Checkout →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  dialog: {
    width: SCREEN_W * 0.85,
    height: "100%",
    backgroundColor: T.white,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: T.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: T.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: {
    fontSize: 18,
    fontWeight: "700",
    color: T.textSoft,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: T.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: T.textMuted,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: T.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  itemImg: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: T.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: T.text,
    lineHeight: 17,
    marginBottom: 3,
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: "600",
    color: T.textMuted,
    marginBottom: 4,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
  },
  optionChip: {
    backgroundColor: T.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: T.green,
  },
  optionChipText: {
    fontSize: 9,
    fontWeight: "600",
    color: T.green,
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: T.green,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: "600",
    color: T.textSoft,
    backgroundColor: T.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginLeft: 8,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "900",
    color: T.text,
    letterSpacing: -0.3,
  },
  actionBtns: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  wishlistBtn: {
    backgroundColor: T.warning + "15",
    borderColor: T.warning + "40",
  },
  removeBtn: {
    backgroundColor: T.red + "15",
    borderColor: T.red + "40",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.white,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: T.textSoft,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: T.green,
    letterSpacing: -0.4,
  },
  footerActionBtns: {
    flexDirection: "row",
    gap: 10,
  },
  viewCartBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: T.bg,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: "center",
  },
  viewCartBtnTxt: {
    fontSize: 13,
    fontWeight: "800",
    color: T.text,
    letterSpacing: -0.2,
  },
  checkoutBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: T.green,
    alignItems: "center",
    shadowColor: T.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutBtnTxt: {
    fontSize: 13,
    fontWeight: "800",
    color: T.white,
    letterSpacing: -0.2,
  },
});
