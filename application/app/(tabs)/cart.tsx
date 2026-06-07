import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/src/components/EmptyState";
import { QtyBox } from "@/src/components/QtyBox";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { CartItem, fetchCartItems, setCartData } from "@/src/store/appSlice";
import { deleteData, fetchDataFromApi, putData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const { width } = Dimensions.get("window");
const IS_SMALL = width < 375;

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Animated remove press effect */
const RemoveButton = ({
  onPress,
  loading,
  colors,
}: {
  onPress: () => void;
  loading: boolean;
  colors: any;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(() => onPress());
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        disabled={loading}
        hitSlop={8}
        style={[
          styles.iconBtn,
          {
            backgroundColor: colors.destructive + "15",
            borderColor: colors.destructive + "30",
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.destructive} />
        ) : (
          <Feather name="trash-2" size={14} color={colors.destructive} />
        )}
      </Pressable>
    </Animated.View>
  );
};

/** Savings badge shown next to price */
const SavingBadge = ({ saved, colors }: { saved: number; colors: any }) => (
  <View style={[styles.saveBadge, { backgroundColor: colors.success + "18" }]}>
    <Text style={[styles.saveBadgeText, { color: colors.success }]}>
      Save ₹{saved}
    </Text>
  </View>
);

/** Single cart item card */
const CartItemCard = ({
  item,
  colors,
  busy,
  onQtyChange,
  onRemove,
  onWishlist,
  router,
}: {
  item: CartItem;
  colors: any;
  busy: string | null;
  onQtyChange: (item: CartItem, next: number) => void;
  onRemove: (item: CartItem) => void;
  onWishlist: (item: CartItem) => void;
  router: any;
}) => {
  const discountPct =
    item.oldPrice && item.oldPrice > item.price
      ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
      : 0;
  const saved = item.oldPrice
    ? (item.oldPrice - item.price) * item.quantity
    : 0;

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleRemove = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onRemove(item));
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View
        style={[
          styles.itemCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Discount Badge */}
        {discountPct > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountPct}% OFF</Text>
          </View>
        )}

        <Pressable
          style={styles.itemImageWrap}
          onPress={() => router.push(`/product/${item.productId}` as never)}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.itemImg}
            contentFit="cover"
          />
        </Pressable>

        <View style={styles.itemRight}>
          {item.brand && (
            <Text style={[styles.brandText, { color: colors.mutedForeground }]}>
              {item.brand.toUpperCase()}
            </Text>
          )}

          <Pressable
            onPress={() => router.push(`/product/${item.productId}` as never)}
          >
            <Text
              numberOfLines={2}
              style={[styles.itemTitle, { color: colors.foreground }]}
            >
              {item.productTitle}
            </Text>
          </Pressable>

          {/* Attribute chips */}
          {(item.size || item.color) && (
            <View style={styles.chipsRow}>
              {item.size && (
                <View style={[styles.chip, { backgroundColor: colors.muted }]}>
                  <Text
                    style={[styles.chipText, { color: colors.mutedForeground }]}
                  >
                    {item.size}
                  </Text>
                </View>
              )}
              {item.color && (
                <View style={[styles.chip, { backgroundColor: colors.muted }]}>
                  <Text
                    style={[styles.chipText, { color: colors.mutedForeground }]}
                  >
                    {item.color}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: colors.foreground }]}>
              ₹{item.price}
            </Text>
            {item.oldPrice && (
              <Text
                style={[styles.oldPriceText, { color: colors.mutedForeground }]}
              >
                ₹{item.oldPrice}
              </Text>
            )}
            {saved > 0 && <SavingBadge saved={saved} colors={colors} />}
          </View>

          {/* Actions row */}
          <View style={styles.actionsRow}>
            <QtyBox
              value={item.quantity}
              onChange={(v) => onQtyChange(item, v)}
              max={item.countInStock || 99}
              size="sm"
            />
            <View style={styles.iconBtnsRow}>
              <Pressable
                onPress={() => onWishlist(item)}
                hitSlop={8}
                style={[
                  styles.iconBtn,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Feather
                  name="heart"
                  size={14}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <RemoveButton
                onPress={handleRemove}
                loading={busy === item._id}
                colors={colors}
              />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

/** Delivery info banner */
const DeliveryBanner = ({
  subTotal,
  freeShippingAbove,
  colors,
}: {
  subTotal: number;
  freeShippingAbove: number;
  colors: any;
}) => {
  const threshold = freeShippingAbove || 500; // fallback
  const isFree = subTotal >= threshold;
  const remaining = threshold - subTotal;

  return (
    <View
      style={[
        styles.deliveryBanner,
        {
          backgroundColor: isFree ? colors.success + "12" : colors.muted,
          borderColor: isFree ? colors.success + "40" : colors.border,
        },
      ]}
    >
      <Feather
        name="truck"
        size={16}
        color={isFree ? colors.success : colors.mutedForeground}
      />
      <Text
        style={[
          styles.deliveryText,
          { color: isFree ? colors.success : colors.mutedForeground },
        ]}
      >
        {isFree
          ? "🎉 Congratulations! You've unlocked FREE delivery"
          : `Add ₹${remaining.toFixed(0)} more for FREE delivery`}
      </Text>
    </View>
  );
};

/** Trust badges */
const TrustBadges = ({ colors }: { colors: any }) => (
  <View
    style={[
      styles.trustCard,
      { backgroundColor: colors.card, borderColor: colors.border },
    ]}
  >
    {[
      { icon: "shield" as const, text: "100% Authentic products" },
      { icon: "refresh-cw" as const, text: "Easy 7-day returns" },
      { icon: "lock" as const, text: "Secure checkout" },
    ].map((item) => (
      <View key={item.text} style={styles.trustRow}>
        <View style={[styles.trustIconWrap, { backgroundColor: colors.muted }]}>
          <Feather name={item.icon} size={13} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.trustText, { color: colors.mutedForeground }]}>
          {item.text}
        </Text>
      </View>
    ))}
  </View>
);

/** Price summary row */
const SummaryRow = ({
  label,
  value,
  valueColor,
  bold,
  colors,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  colors: any;
}) => (
  <View style={styles.summaryRow}>
    <Text
      style={[
        styles.summaryLabel,
        {
          color: bold ? colors.foreground : colors.mutedForeground,
          fontFamily: bold ? "Inter_700Bold" : "Inter_400Regular",
          fontSize: bold ? 14 : 13,
        },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.summaryValue,
        {
          color: valueColor || colors.foreground,
          fontFamily: bold ? "Inter_700Bold" : "Inter_600SemiBold",
          fontSize: bold ? 15 : 13,
        },
      ]}
    >
      {value}
    </Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CartScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const cartData = useAppSelector((s) => s.app.cartData);
  const userData = useAppSelector((s) => s.app.userData);
  const isLogin = useAppSelector((s) => s.app.isLogin);

  const [busy, setBusy] = useState<string | null>(null);
  const [commerceSettings, setCommerceSettings] = useState<any>({ shippingFee: 0, deliveryFee: 0, freeShippingAbove: 0 });

  // Fetch commerce settings
  useEffect(() => {
    fetchDataFromApi("/api/settings/commerce")
      .then((res) => {
        console.log("🛒 Commerce Settings Response:", res);
        if (res?.data) {
          console.log("✅ Commerce Settings Loaded:", res.data);
          setCommerceSettings(res.data);
        } else {
          console.warn("⚠️ No data in commerce settings response");
        }
      })
      .catch((error) => {
        console.error("❌ Failed to fetch commerce settings:", error);
      });
  }, []);

  const subTotal = useMemo(
    () => cartData.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cartData],
  );

  const oldTotal = useMemo(
    () =>
      cartData.reduce(
        (sum, c) => sum + (c.oldPrice || c.price) * c.quantity,
        0,
      ),
    [cartData],
  );

  const itemDiscount = Math.max(0, oldTotal - subTotal);
  const freeByRule = commerceSettings.freeShippingAbove > 0 && subTotal >= commerceSettings.freeShippingAbove;
  const shipping = freeByRule ? 0 : Number(commerceSettings.shippingFee || 0);
  const deliveryFee = freeByRule ? 0 : Number(commerceSettings.deliveryFee || 0);
  const grandTotal = subTotal + shipping + deliveryFee;
  const totalSavings = itemDiscount + (freeByRule && subTotal > 0 ? (Number(commerceSettings.shippingFee || 0) + Number(commerceSettings.deliveryFee || 0)) : 0);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const updateQty = async (item: CartItem, next: number) => {
    if (next === item.quantity) return;
    setBusy(item._id);
    const optimistic = cartData.map((c) =>
      c._id === item._id
        ? { ...c, quantity: next, subTotal: Math.round(c.price * next) }
        : c,
    );
    dispatch(setCartData(optimistic));
    const res = await putData("/api/cart/update-qty", {
      _id: item._id,
      qty: next,
      subTotal: Math.round(item.price * next),
    });
    if (res?.error !== false) {
      showToast("error", res?.message || "Failed to update");
      dispatch(fetchCartItems());
    }
    setBusy(null);
  };

  const removeItem = async (item: CartItem) => {
    setBusy(item._id);
    try {
      const res = await deleteData(`/api/cart/delete-cart-item/${item._id}`);
      if (res?.success === true) {
        showToast("success", "Removed from cart");
        dispatch(setCartData(cartData.filter((c) => c._id !== item._id)));
      } else {
        showToast("error", res?.message || "Failed to remove");
        dispatch(fetchCartItems());
      }
    } catch {
      showToast("error", "Failed to remove item");
      dispatch(fetchCartItems());
    } finally {
      setBusy(null);
    }
  };

  const handleWishlist = async (item: CartItem) => {
    showToast("success", "Moved to wishlist");
    dispatch(setCartData(cartData.filter((c) => c._id !== item._id)));
  };

  const onCheckout = () => {
    if (!isLogin) {
      router.push("/login" as never);
      return;
    }
    if (!userData?.address_details?.length) {
      showToast("error", "Please add a delivery address");
      router.push("/address" as never);
      return;
    }
    router.push("/checkout" as never);
  };

  // ── Empty / Auth states ──────────────────────────────────────────────────────
  if (!isLogin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <Header />
            <EmptyState
              icon="shopping-bag"
              title="Sign in to view your cart"
              description="Your cart items will be saved here once you log in"
              ctaTitle="Sign In"
              onCta={() => router.push("/login" as never)}
            />
          </ScrollView>
        </SafeAreaView>
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 75,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.footerLabel, { color: colors.mutedForeground }]}
            >
              Total Payable
            </Text>
            <Text style={[styles.footerPrice, { color: colors.foreground }]}>
              ₹0
            </Text>
          </View>
          <Pressable
            onPress={onCheckout}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" }}>
              Proceed to Checkout
            </Text>
            <Feather name="arrow-right" size={14} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  if (!cartData?.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
          <ScrollView contentContainerStyle={{ flex: 1 }}>
            <Header />
            <EmptyState
              icon="shopping-bag"
              title="Your cart is empty"
              description="Browse products and add them to your cart"
              ctaTitle="Start shopping"
              onCta={() => router.push("/(tabs)" as never)}
            />
          </ScrollView>
        </SafeAreaView>
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 75,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.footerLabel, { color: colors.mutedForeground }]}
            >
              Total Payable
            </Text>
            <Text style={[styles.footerPrice, { color: colors.foreground }]}>
              ₹0
            </Text>
          </View>
          <Pressable
            onPress={onCheckout}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" }}>
              Proceed to Checkout
            </Text>
            <Feather name="arrow-right" size={14} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          {/* Header scrolls with content */}
          <Header count={cartData.length} />

          {/* Delivery banner */}
          <DeliveryBanner subTotal={subTotal} freeShippingAbove={commerceSettings.freeShippingAbove} colors={colors} />

          {/* Cart items */}
          <View style={styles.section}>
            <SectionLabel
              label={`Items (${cartData.length})`}
              colors={colors}
            />
            {cartData.map((item) => (
              <CartItemCard
                key={item._id}
                item={item}
                colors={colors}
                busy={busy}
                onQtyChange={updateQty}
                onRemove={removeItem}
                onWishlist={handleWishlist}
                router={router}
              />
            ))}
          </View>

          {/* Price details */}
          <View style={styles.section}>
            <SectionLabel label="Price Details" colors={colors} />
            <View
              style={[
                styles.priceCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <SummaryRow
                label={`MRP (${cartData.length} items)`}
                value={`₹${oldTotal}`}
                colors={colors}
              />
              {itemDiscount > 0 && (
                <SummaryRow
                  label="Product Discount"
                  value={`−₹${itemDiscount}`}
                  valueColor={colors.success}
                  colors={colors}
                />
              )}
              <SummaryRow
                label="Shipping"
                value={shipping === 0 ? "FREE" : `₹${shipping}`}
                valueColor={shipping === 0 ? colors.success : undefined}
                colors={colors}
              />
              <SummaryRow
                label="Delivery Fee"
                value={deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                valueColor={deliveryFee === 0 ? colors.success : undefined}
                colors={colors}
              />
              {freeByRule && commerceSettings.freeShippingAbove > 0 && (
                <View style={[styles.freeShipBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                  <Feather name="check-circle" size={12} color={colors.success} />
                  <Text style={[styles.freeShipText, { color: colors.success }]}>
                    🎉 Free shipping & delivery applied!
                  </Text>
                </View>
              )}
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <SummaryRow
                label="Total Payable"
                value={`₹${grandTotal}`}
                bold
                colors={colors}
              />

              {/* Savings strip */}
              {totalSavings > 0 && (
                <View
                  style={[
                    styles.savingsStrip,
                    {
                      backgroundColor: colors.success + "15",
                      borderColor: colors.success + "30",
                    },
                  ]}
                >
                  <Feather name="tag" size={12} color={colors.success} />
                  <Text
                    style={[styles.savingsStripText, { color: colors.success }]}
                  >
                    {`You're saving ₹${totalSavings} on this order 🎉`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Trust badges */}
          <View style={styles.section}>
            <TrustBadges colors={colors} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Sticky footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 75,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>
            Total Payable
          </Text>
          <Text style={[styles.footerPrice, { color: colors.foreground }]}>
            ₹{grandTotal}
          </Text>
          {totalSavings > 0 && (
            <Text style={[styles.footerSavings, { color: colors.success }]}>
              Saving ₹{totalSavings}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onCheckout}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" }}>
            Proceed to Checkout
          </Text>
          <Feather name="arrow-right" size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

const Header = ({ count }: { count?: number }) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>
        My Cart{count ? ` (${count})` : ""}
      </Text>
    </View>
  );
};

const SectionLabel = ({ label, colors }: { label: string; colors: any }) => (
  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
    {label}
  </Text>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    padding: IS_SMALL ? 12 : 14,
    paddingTop: 10,
    gap: 0,
  },
  section: {
    marginBottom: IS_SMALL ? 16 : 18,
    gap: IS_SMALL ? 8 : 10,
  },
  sectionLabel: {
    fontSize: IS_SMALL ? 10 : 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: IS_SMALL ? -4 : -4,
  },

  // Header
  header: {
    paddingHorizontal: IS_SMALL ? 12 : 14,
    paddingVertical: IS_SMALL ? 10 : 12,
    paddingTop: IS_SMALL ? 12 : 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -(IS_SMALL ? 12 : 14),
    marginTop: -(IS_SMALL ? 12 : 14),
    paddingLeft: IS_SMALL ? 12 : 14,
    paddingRight: IS_SMALL ? 12 : 14,
    marginBottom: IS_SMALL ? 12 : 14,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: IS_SMALL ? 16 : 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },

  // Delivery Banner
  deliveryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: IS_SMALL ? 10 : 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: IS_SMALL ? 16 : 18,
  },
  deliveryText: {
    fontSize: IS_SMALL ? 11 : 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  // Item card
  itemCard: {
    flexDirection: "row",
    gap: IS_SMALL ? 10 : 12,
    padding: IS_SMALL ? 10 : 12,
    borderRadius: 14,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  itemImageWrap: {
    flexShrink: 0,
  },
  itemImg: {
    width: IS_SMALL ? 78 : 86,
    height: IS_SMALL ? 86 : 94,
    borderRadius: 10,
    backgroundColor: "#f0eeea",
  },
  discountBadge: {
    position: "absolute",
    top: IS_SMALL ? 8 : 10,
    left: IS_SMALL ? 8 : 10,
    backgroundColor: "#E8420A",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 1,
  },
  discountBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  itemRight: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  brandText: {
    fontSize: IS_SMALL ? 9 : 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.7,
  },
  itemTitle: {
    fontSize: IS_SMALL ? 12 : 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: IS_SMALL ? 16 : 17,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    marginTop: 1,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  chipText: {
    fontSize: IS_SMALL ? 9 : 10,
    fontFamily: "Inter_500Medium",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
    flexWrap: "wrap",
  },
  priceText: {
    fontSize: IS_SMALL ? 14 : 15,
    fontFamily: "Inter_700Bold",
  },
  oldPriceText: {
    fontSize: IS_SMALL ? 10 : 11,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "line-through",
  },
  saveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  iconBtnsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Price card
  priceCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: IS_SMALL ? 12 : 14,
    gap: 6,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    flex: 1,
  },
  summaryValue: {
    textAlign: "right",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  savingsStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    padding: IS_SMALL ? 8 : 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  savingsStripText: {
    fontSize: IS_SMALL ? 11 : 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  freeShipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  freeShipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },

  // Trust badges
  trustCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: IS_SMALL ? 12 : 13,
    gap: 8,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trustIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  trustText: {
    fontSize: IS_SMALL ? 11 : 12,
    fontFamily: "Inter_400Regular",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: IS_SMALL ? 12 : 14,
    paddingTop: IS_SMALL ? 10 : 12,
    flexDirection: "row",
    alignItems: "center",
    gap: IS_SMALL ? 10 : 12,
  },
  footerLabel: {
    fontSize: IS_SMALL ? 10 : 11,
    fontFamily: "Inter_400Regular",
  },
  footerPrice: {
    fontSize: IS_SMALL ? 18 : 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
    marginTop: 1,
  },
  footerSavings: {
    fontSize: IS_SMALL ? 10 : 11,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
});
