import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useRazorpay } from "@/src/hooks/useRazorpay";
import { RazorpayPaymentError } from "@/src/types/razorpay";
import { useScrollHeader } from "@/src/hooks/useScrollHeader";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchCartItems, UserAddress } from "@/src/store/appSlice";
import { deleteData, fetchDataFromApi, postData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const IS_SMALL = width < 375;

// ─── Available Coupons (Fetched from API) ────────────────────────────────────
interface Coupon {
  _id?: string;
  code: string;
  discount: number;
  discountType?: "percentage" | "fixed";
  minOrder: number;
  maxDiscount?: number;
  label?: string;
  expiryDate?: string;
  isActive?: boolean;
}

// Helper function to get product attributes
const getProductAttributes = (product: any): string[] => {
  const attrs: string[] = [];
  if (product.size) attrs.push(`Size: ${product.size}`);
  if (product.color) attrs.push(`Color: ${product.color}`);
  if (product.weight) attrs.push(`Weight: ${product.weight}`);
  if (product.ram) attrs.push(`RAM: ${product.ram}`);
  if (product.storage) attrs.push(`Storage: ${product.storage}`);
  if (product.brand) attrs.push(`${product.brand}`);
  return attrs;
};

// ─── Step indicator ──────────────────────────────────────────────────────────
const STEPS = ["Address", "Items", "Payment", "Summary"];

const StepIndicator = ({ current }: { current: number }) => {
  const colors = useColors();
  return (
    <View style={stepStyles.container}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <View style={stepStyles.step}>
              <View
                style={[
                  stepStyles.circle,
                  {
                    backgroundColor: done
                      ? colors.primary
                      : active
                        ? colors.primary
                        : colors.border,
                    borderColor: active ? colors.primary : "transparent",
                  },
                ]}
              >
                {done ? (
                  <Feather name="check" size={10} color="#fff" />
                ) : (
                  <Text
                    style={[
                      stepStyles.circleText,
                      { color: active ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  stepStyles.label,
                  {
                    color: active ? colors.primary : colors.mutedForeground,
                    fontFamily: active ? "Inter_700Bold" : "Inter_400Regular",
                  },
                ]}
              >
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View
                style={[
                  stepStyles.connector,
                  {
                    backgroundColor:
                      i < current ? colors.primary : colors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  step: { alignItems: "center", gap: 4 },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 9.5 },
  connector: {
    flex: 1,
    height: 2,
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 2,
  },
});

// ─── Animated section card ────────────────────────────────────────────────────
const AnimatedSection = ({
  title,
  icon,
  badge,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  delay?: number;
}) => {
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
        marginBottom: 14,
      }}
    >
      <View
        style={[
          sectionStyles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[sectionStyles.header, { borderBottomColor: colors.border }]}>
          <View
            style={[sectionStyles.iconWrap, { backgroundColor: colors.accent }]}
          >
            {icon}
          </View>
          <Text style={[sectionStyles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          {badge && (
            <View
              style={[sectionStyles.badge, { backgroundColor: colors.primary }]}
            >
              <Text style={sectionStyles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <View style={sectionStyles.body}>{children}</View>
      </View>
    </Animated.View>
  );
};

const sectionStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: IS_SMALL ? 13 : 14,
    fontFamily: "Inter_700Bold",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  body: { padding: 12 },
});

// ─── Address card ─────────────────────────────────────────────────────────────
const AddressCard = ({
  address,
  selected,
  onPress,
}: {
  address: UserAddress;
  selected: boolean;
  onPress: () => void;
}) => {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          addrStyles.card,
          {
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected
              ? colors.accent
              : (colors.surfaceAlt ?? colors.card),
          },
        ]}
      >
        {selected && (
          <View
            style={[
              addrStyles.selectedDot,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
        <View
          style={[
            addrStyles.radioOuter,
            { borderColor: selected ? colors.primary : colors.border },
          ]}
        >
          {selected && (
            <View
              style={[
                addrStyles.radioInner,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[addrStyles.name, { color: colors.foreground }]}>
              {address.address_line1}
            </Text>
            {address.addressType && (
              <View
                style={[
                  addrStyles.defaultBadge,
                  {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary + "40",
                  },
                ]}
              >
                <Text
                  style={[addrStyles.defaultText, { color: colors.primary }]}
                >
                  {address.addressType}
                </Text>
              </View>
            )}
          </View>
          <Text style={[addrStyles.sub, { color: colors.mutedForeground }]}>
            {address.city}, {address.state} — {address.pincode}
          </Text>
          <View style={addrStyles.phoneRow}>
            <Feather name="phone" size={10} color={colors.mutedForeground} />
            <Text style={[addrStyles.phone, { color: colors.mutedForeground }]}>
              {address.mobile}
            </Text>
          </View>
        </View>
        {selected && (
          <View
            style={[
              addrStyles.checkCircle,
              { backgroundColor: colors.primary },
            ]}
          >
            <Feather name="check" size={12} color="#fff" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const addrStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },
  selectedDot: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: IS_SMALL ? 12 : 13,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  defaultText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: IS_SMALL ? 10 : 11, marginTop: 3 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  phone: { fontSize: IS_SMALL ? 10 : 11 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
});

// ─── Payment option card ──────────────────────────────────────────────────────
const PaymentOption = ({
  mode,
  icon,
  title,
  subtitle,
  tags,
  selected,
  onPress,
}: {
  mode: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tags?: string[];
  selected: boolean;
  onPress: () => void;
}) => {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }], marginBottom: 8 }}
    >
      <Pressable
        onPress={handlePress}
        style={[
          payStyles.card,
          {
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected ? colors.accent : colors.card,
          },
        ]}
      >
        {selected && (
          <View
            style={[payStyles.leftAccent, { backgroundColor: colors.primary }]}
          />
        )}
        <View
          style={[
            payStyles.iconBox,
            {
              backgroundColor: selected
                ? colors.primary + "20"
                : (colors.surfaceAlt ?? colors.border + "40"),
            },
          ]}
        >
          {icon}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[payStyles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          <Text style={[payStyles.subtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
          {tags && (
            <View style={payStyles.tags}>
              {tags.map((tag) => (
                <View
                  key={tag}
                  style={[payStyles.tag, { backgroundColor: colors.border }]}
                >
                  <Text
                    style={[
                      payStyles.tagText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View
          style={[
            payStyles.radioOuter,
            { borderColor: selected ? colors.primary : colors.border },
          ]}
        >
          {selected && (
            <View
              style={[
                payStyles.radioInner,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const payStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    position: "relative",
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 3,
    height: "100%",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_600SemiBold", fontSize: IS_SMALL ? 12 : 13 },
  subtitle: { fontSize: IS_SMALL ? 10 : 11 },
  tags: { flexDirection: "row", gap: 4, marginTop: 4, flexWrap: "wrap" },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, fontFamily: "Inter_500Medium" },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
});

// ─── Dynamic Coupon Section ──────────────────────────────────────────────────
const CouponSection = ({
  coupon,
  setCoupon,
  discount,
  setDiscount,
  subTotal,
  onRemove,
  checkoutItems = [],
}: {
  coupon: string;
  setCoupon: (v: string) => void;
  discount: number;
  setDiscount: (v: number) => void;
  subTotal: number;
  onRemove: () => void;
  checkoutItems?: any[];
}) => {
  const colors = useColors();
  const successAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false); // Loading state for apply button
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Extract shopId/restaurantId from cart items
  const orderContext = useMemo(() => {
    if (!checkoutItems || checkoutItems.length === 0) return {};
    
    const firstItem = checkoutItems[0];
    
    // Check for grocery shop
    if (firstItem.shopId) {
      return { shopId: firstItem.shopId };
    }
    
    // Check for restaurant
    if (firstItem.restaurantId) {
      return { restaurantId: firstItem.restaurantId };
    }
    
    // Check for product ID (for specific product coupons)
    if (firstItem.productId) {
      return { productId: firstItem.productId };
    }
    
    return {};
  }, [checkoutItems]);

  // Fetch available coupons from API with context
  useEffect(() => {
    const fetchCoupons = async () => {
      setLoadingCoupons(true);
      try {
        // Build query params based on order context
        const params = new URLSearchParams();
        if (orderContext.shopId) params.append('shopId', orderContext.shopId);
        if (orderContext.restaurantId) params.append('restaurantId', orderContext.restaurantId);
        if (orderContext.productId) params.append('productId', orderContext.productId);
        
        const endpoint = `/api/coupon/active${params.toString() ? `?${params.toString()}` : ''}`;
        console.log("🎫 Fetching coupons:", endpoint, orderContext);
        
        const res = await fetchDataFromApi(endpoint);
        if (res && Array.isArray(res)) {
          // Filter only active and non-expired coupons
          const activeCoupons = res.filter((c: any) => {
            const isActive = c.isActive !== false;
            const notExpired = !c.expiryDate || new Date(c.expiryDate) > new Date();
            return isActive && notExpired;
          });
          console.log("✅ Available coupons:", activeCoupons.length);
          setAvailableCoupons(activeCoupons);
        }
      } catch (error) {
        console.error("❌ Failed to fetch coupons:", error);
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchCoupons();
  }, [orderContext.shopId, orderContext.restaurantId, orderContext.productId]);

  useEffect(() => {
    if (discount > 0) {
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [discount]);

  const toggle = () => {
    const toVal = expanded ? 0 : 1;
    Animated.timing(rotateAnim, {
      toValue: toVal,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded((p) => !p);
  };

  const calculateDiscount = (couponData: Coupon, orderTotal: number) => {
    if (couponData.discountType === "percentage") {
      const discountAmount = (orderTotal * couponData.discount) / 100;
      return couponData.maxDiscount
        ? Math.min(discountAmount, couponData.maxDiscount)
        : discountAmount;
    }
    return couponData.discount;
  };

  const applyCoupon = async (couponCode: string) => {
    setApplyingCoupon(true); // Start loading
    try {
      console.log("🎫 Applying coupon:", couponCode, "Context:", orderContext);
      
      // Validate coupon via API with shop/restaurant context
      const res = await postData("/api/coupon/validate", {
        code: couponCode.toUpperCase(),
        orderTotal: subTotal,
        ...orderContext, // Pass shopId/restaurantId/productId
      });

      console.log("📥 Validation response:", res);

      if (res?.error) {
        showToast("error", res.message || "Invalid coupon code");
        setApplyingCoupon(false);
        return;
      }

      if (res?.coupon) {
        const couponData = res.coupon;
        
        // Check minimum order
        if (couponData.minOrder > subTotal) {
          showToast("error", `Minimum order ₹${couponData.minOrder} required`);
          setApplyingCoupon(false);
          return;
        }

        // Calculate discount
        const discountAmount = calculateDiscount(couponData, subTotal);
        
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCoupon(couponCode.toUpperCase());
        setDiscount(Math.round(discountAmount));
        setExpanded(false);
        
        const discountText = couponData.discountType === "percentage"
          ? `${couponData.discount}% off (₹${Math.round(discountAmount)})`
          : `₹${discountAmount} off`;
        
        showToast("success", `${couponCode.toUpperCase()} applied! ${discountText}`);
      }
    } catch (error) {
      console.error("❌ Apply coupon error:", error);
      showToast("error", "Failed to apply coupon. Please try again.");
    } finally {
      setApplyingCoupon(false); // Stop loading
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  if (discount > 0) {
    return (
      <Animated.View
        style={{
          transform: [{ scale: successAnim }],
          opacity: successAnim,
        }}
      >
        <View
          style={[
            couponStyles.applied,
            {
              backgroundColor: colors.success + "15",
              borderColor: colors.success + "40",
            },
          ]}
        >
          <View
            style={[
              couponStyles.appliedIcon,
              { backgroundColor: colors.success },
            ]}
          >
            <Feather name="tag" size={14} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[couponStyles.appliedCode, { color: colors.success }]}>
              {coupon.toUpperCase()} applied!
            </Text>
            <Text
              style={[
                couponStyles.appliedSaving,
                { color: colors.mutedForeground },
              ]}
            >
              {`You're saving ₹${discount.toLocaleString("en-IN")}`}
            </Text>
          </View>
          <Pressable onPress={onRemove} style={couponStyles.removeBtn}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={couponStyles.container}>
      <View style={couponStyles.row}>
        <View
          style={[
            couponStyles.inputWrap,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Feather
            name="tag"
            size={14}
            color={colors.mutedForeground}
            style={{ marginLeft: 10 }}
          />
          <TextInput
            value={coupon}
            onChangeText={(t) => setCoupon(t.toUpperCase())}
            placeholder="Enter coupon code"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            style={[couponStyles.input, { color: colors.foreground }]}
          />
        </View>
        <Pressable
          onPress={() => applyCoupon(coupon)}
          disabled={!coupon.trim() || applyingCoupon}
          style={[
            couponStyles.applyBtn,
            {
              backgroundColor: coupon.trim() && !applyingCoupon ? colors.primary : colors.border,
              opacity: coupon.trim() && !applyingCoupon ? 1 : 0.5,
            },
          ]}
        >
          {applyingCoupon ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={couponStyles.applyText}>Apply</Text>
          )}
        </Pressable>
      </View>

      {/* Show available coupons button */}
      {availableCoupons.length > 0 && (
        <Pressable onPress={toggle} style={couponStyles.expandBtn}>
          <View style={couponStyles.expandHeader}>
            <Feather name="gift" size={14} color={colors.primary} />
            <Text style={[couponStyles.expandTitle, { color: colors.foreground }]}>
              {availableCoupons.length} {availableCoupons.length === 1 ? 'coupon' : 'coupons'} available
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
          </Animated.View>
        </Pressable>
      )}

      {expanded && (
        <View style={[couponStyles.list, { borderTopColor: colors.border }]}>
          {loadingCoupons ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : availableCoupons.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={[{ color: colors.mutedForeground, fontSize: 12 }]}>
                No coupons available
              </Text>
            </View>
          ) : (
            availableCoupons.map((c) => {
              const isDisabled = c.minOrder > subTotal;
              const discountText = c.discountType === "percentage"
                ? `${c.discount}% off${c.maxDiscount ? ` (upto ₹${c.maxDiscount})` : ""}`
                : `₹${c.discount} off`;
              
              return (
                <Pressable
                  key={c._id || c.code}
                  onPress={() => !isDisabled && !applyingCoupon && applyCoupon(c.code)}
                  disabled={isDisabled || applyingCoupon}
                  style={[
                    couponStyles.couponItem,
                    { 
                      borderColor: colors.border, 
                      opacity: (isDisabled || applyingCoupon) ? 0.5 : 1 
                    },
                  ]}
                >
                  <View
                    style={[
                      couponStyles.couponCodeBox,
                      {
                        backgroundColor: colors.primary + "15",
                        borderColor: colors.primary + "40",
                      },
                    ]}
                  >
                    <Text
                      style={[couponStyles.couponCode, { color: colors.primary }]}
                    >
                      {c.code}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[
                        couponStyles.couponLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      {c.label || `${discountText} on orders above ₹${c.minOrder}`}
                    </Text>
                    {isDisabled && (
                      <Text
                        style={[
                          couponStyles.couponMinOrder,
                          { color: colors.destructive },
                        ]}
                      >
                        Min order ₹{c.minOrder} required
                      </Text>
                    )}
                  </View>
                  {applyingCoupon ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View
                      style={[
                        couponStyles.discountBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={couponStyles.discountText}>{discountText}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </View>
  );
};

const couponStyles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingRight: 12,
    fontSize: IS_SMALL ? 12 : 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  applyBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  applied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  appliedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  appliedCode: { fontFamily: "Inter_700Bold", fontSize: 13 },
  appliedSaving: { fontSize: 11, marginTop: 2 },
  removeBtn: { padding: 4 },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "rgba(99,102,241,0.2)",
  },
  expandHeader: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  expandTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  list: { borderTopWidth: 1, paddingTop: 10, gap: 8, maxHeight: 300 },
  couponItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  couponCodeBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  couponCode: { fontFamily: "Inter_700Bold", fontSize: 11 },
  couponLabel: { fontFamily: "Inter_500Medium", fontSize: 11 },
  couponMinOrder: { fontFamily: "Inter_400Regular", fontSize: 10 },
  discountBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 },
});

// ─── Price row ────────────────────────────────────────────────────────────────
const PriceRow = ({
  label,
  value,
  color,
  bold,
  strikethrough,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
  strikethrough?: boolean;
}) => {
  const colors = useColors();
  return (
    <View style={priceStyles.row}>
      <Text
        style={[
          priceStyles.label,
          {
            color: colors.mutedForeground,
            fontFamily: bold ? "Inter_600SemiBold" : "Inter_400Regular",
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          priceStyles.value,
          {
            color: color || colors.foreground,
            fontFamily: bold ? "Inter_700Bold" : "Inter_500Medium",
            fontSize: bold ? 15 : 13,
            textDecorationLine: strikethrough ? "line-through" : "none",
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

const priceStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: IS_SMALL ? 11 : 12 },
  value: {},
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CheckoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const footerBottomPadding = Math.max(insets.bottom, 12) + 16;
  const { handleScroll } = useScrollHeader();
  const cartData = useAppSelector((s) => s.app.cartData);
  const userData = useAppSelector((s) => s.app.userData);
  const { createOrderAndPay, isProcessing: isPaymentProcessing } =
    useRazorpay();
  const { buyNowItem, isBuyNow } = useLocalSearchParams<{
    buyNowItem?: string;
    isBuyNow?: string;
  }>();

  const addresses = userData?.address_details || [];
  const defaultAddr = addresses.find((a) => a.status) || addresses[0] || null;
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(
    defaultAddr?._id || null,
  );
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  // ── KEY CHANGE: null = no payment method selected yet ──
  const [paymentMode, setPaymentMode] = useState<"COD" | "RAZORPAY" | null>(null);

  const [placing, setPlacing] = useState(false);

  // Shake animation for payment section when user tries to proceed without selecting
  const paymentShakeAnim = useRef(new Animated.Value(0)).current;

  const shakePaymentSection = () => {
    Animated.sequence([
      Animated.timing(paymentShakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(paymentShakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(paymentShakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(paymentShakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(paymentShakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // Footer pulse animation
  const footerAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (placing) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(footerAnim, {
            toValue: 0.95,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(footerAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      footerAnim.setValue(1);
    }
    return () => pulseLoop.current?.stop();
  }, [placing]);

  const buyNowProduct = useMemo(() => {
    if (buyNowItem && isBuyNow === "true") {
      try {
        return JSON.parse(buyNowItem);
      } catch {
        return null;
      }
    }
    return null;
  }, [buyNowItem, isBuyNow]);

  const checkoutItems = useMemo(
    () => (buyNowProduct ? [buyNowProduct] : cartData),
    [buyNowProduct, cartData],
  );
  const isBuyNowCheckout = !!buyNowProduct;

  useEffect(() => {
    if (!selectedAddrId && defaultAddr) setSelectedAddrId(defaultAddr._id);
  }, [defaultAddr, selectedAddrId]);

  const subTotal = useMemo(
    () =>
      checkoutItems.reduce((s, c) => s + (c.price || 0) * (c.quantity || 1), 0),
    [checkoutItems],
  );
  const [commerceSettings, setCommerceSettings] = useState<any>({ shippingFee: 0, deliveryFee: 0, freeShippingAbove: 0, goMarketShippingFee: 0, goMarketDeliveryFeePerKm: 0 });
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0); // Will be updated with actual distance
  const [distanceCalculated, setDistanceCalculated] = useState(false); // Track if calculation happened
  
  useEffect(() => { 
    fetchDataFromApi("/api/settings/commerce")
      .then((res) => { 
        console.log("💳 Checkout - Commerce Settings Response:", res);
        if (res?.data) {
          console.log("✅ Checkout - Commerce Settings Loaded:", res.data);
          setCommerceSettings(res.data);
        } else {
          console.warn("⚠️ Checkout - No data in response");
        }
      })
      .catch((error) => {
        console.error("❌ Checkout - Failed to fetch commerce settings:", error);
      });
  }, []);

  useEffect(() => {
    // Check if user has any previous orders
    if (userData?._id) {
      fetchDataFromApi(`/api/order/order-list/orders`)
        .then((res) => {
          console.log("✅ First Order Check - Response:", res);
          setIsFirstOrder(res?.total === 0 || res?.data?.length === 0);
        })
        .catch((err) => {
          console.error("❌ First Order Check Failed:", err);
          setIsFirstOrder(false);
        });
    }
  }, [userData]);
  
  const baseAfterDiscount = Math.max(subTotal - discount, 0);
  
  // Separate Go Market and non-Go Market items
  const goMarketItems = checkoutItems.filter((item: any) => {
    const source = String(item?.source || "").toLowerCase();
    const brand = String(item?.brand || "").toLowerCase();
    const isGoMarketSeller = item?.sellerId?.storeProfile?.marketId != null || 
                             item?.sellerId?.storeProfile?.goMarketOwnerId != null;
    return source.includes("gomarket") || brand.includes("gomarket") || isGoMarketSeller;
  });
  
  const nonGoMarketItems = checkoutItems.filter((item: any) => {
    const source = String(item?.source || "").toLowerCase();
    const brand = String(item?.brand || "").toLowerCase();
    const isGoMarketSeller = item?.sellerId?.storeProfile?.marketId != null || 
                             item?.sellerId?.storeProfile?.goMarketOwnerId != null;
    return !source.includes("gomarket") && !brand.includes("gomarket") && !isGoMarketSeller;
  });
  
  const hasGoMarketItems = goMarketItems.length > 0;
  const hasNonGoMarketItems = nonGoMarketItems.length > 0;
  const isMixedCart = hasGoMarketItems && hasNonGoMarketItems;
  
  // Calculate subtotals for each type
  const goMarketSubtotal = goMarketItems.reduce((sum: number, item: any) => {
    return sum + (Number(item.price || 0) * Number(item.quantity || 1));
  }, 0);
  
  const nonGoMarketSubtotal = nonGoMarketItems.reduce((sum: number, item: any) => {
    return sum + (Number(item.price || 0) * Number(item.quantity || 1));
  }, 0);
  
  const freeByRule = commerceSettings.freeShippingAbove > 0 && baseAfterDiscount >= commerceSettings.freeShippingAbove;
  
  // Calculate Go Market fees (rounded). Shipping is flat; delivery is distance-based.
  const goMarketShipping = (hasGoMarketItems && !isFirstOrder && !freeByRule) 
    ? Math.round(Number(commerceSettings.goMarketShippingFee || 0))
    : 0;
  const goMarketDelivery = (hasGoMarketItems && !isFirstOrder && !freeByRule) 
    ? Math.round(Number((commerceSettings.goMarketDeliveryFeePerKm || 0) * distanceKm))
    : 0;
  
  // Calculate normal fees (rounded)
  const normalShipping = (hasNonGoMarketItems && !isFirstOrder && !freeByRule) 
    ? Math.round(Number(commerceSettings.shippingFee || 0))
    : 0;
  const normalDelivery = (hasNonGoMarketItems && !isFirstOrder && !freeByRule) 
    ? Math.round(Number(commerceSettings.deliveryFee || 0))
    : 0;
  
  // Total fees
  const totalShipping = goMarketShipping + normalShipping;
  const totalDelivery = goMarketDelivery + normalDelivery;
  const total = baseAfterDiscount + totalShipping + totalDelivery;

  // Log fee calculation for debugging
  useEffect(() => {
    if (hasGoMarketItems || hasNonGoMarketItems) {
      console.log("💰 Fees Breakdown:", {
        cartType: isMixedCart ? "MIXED" : (hasGoMarketItems ? "GO_MARKET_ONLY" : "NORMAL_ONLY"),
        isFirstOrder,
        freeByRule,
        baseAfterDiscount: `₹${baseAfterDiscount}`,
        goMarketItems: goMarketItems.length,
        nonGoMarketItems: nonGoMarketItems.length,
        goMarketSubtotal: `₹${goMarketSubtotal}`,
        nonGoMarketSubtotal: `₹${nonGoMarketSubtotal}`,
        ...(hasGoMarketItems && {
          goMarket: {
            distanceKm: `${distanceKm.toFixed(2)} km`,
            shippingFee: `₹${goMarketShipping}`,
            deliveryFeePerKm: `₹${commerceSettings.goMarketDeliveryFeePerKm || 0}/km`,
            deliveryFeeTotal: `₹${goMarketDelivery}`,
          }
        }),
        ...(hasNonGoMarketItems && {
          normal: {
            shippingFee: `₹${normalShipping}`,
            deliveryFee: `₹${normalDelivery}`,
          }
        }),
        totalFees: `₹${totalShipping + totalDelivery}`,
        total: `₹${total}`
      });
    }
  }, [hasGoMarketItems, hasNonGoMarketItems, goMarketShipping, goMarketDelivery, normalShipping, normalDelivery, distanceKm, baseAfterDiscount, isFirstOrder, freeByRule]);

  // Calculate dynamic Go Market distance on the server so old cart items can
  // fall back to seller/market coordinates instead of showing a static distance.
  useEffect(() => {
    
    if (!hasGoMarketItems) {
      setDistanceKm(0);
      setDistanceCalculated(false);
      return;
    }
    
    const userLocation = (userData as any)?.goMarketLocation || null;
    if (!userLocation?.coordinates?.length) {
      setDistanceKm(0);
      setDistanceCalculated(false);
      return;
    }
    
    let cancelled = false;
    postData("/api/order/go-market-distance", {
      userId: userData?._id,
      products: goMarketItems,
      userLocation,
    }).then((res: any) => {
      if (cancelled) return;
      const nextDistance = Number(res?.data?.distanceKm || 0);
      setDistanceKm(Number.isFinite(nextDistance) ? nextDistance : 0);
      setDistanceCalculated(Boolean(nextDistance > 0));
    }).catch(() => {
      if (!cancelled) setDistanceCalculated(false);
    });

    return () => { cancelled = true; };
  }, [hasGoMarketItems, goMarketItems, (userData as any)?.goMarketLocation, userData?._id]);

  const removeCoupon = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDiscount(0);
    setCoupon("");
  };

  const buildOrderPayload = (
    paymentStatus: "COMPLETED" | "CASH ON DELIVERY",
  ) => ({
    userId: userData?._id,
    products: checkoutItems,
    paymentId: "",
    payment_status: paymentStatus,
    delivery_address: selectedAddrId,
    couponCode: coupon,
    discountAmount: discount,
    discount_amount: discount,
    shippingFee: totalShipping,
    deliveryFee: totalDelivery,
    // Separate fee tracking for mixed carts
    goMarketShippingFee: goMarketShipping,
    goMarketDeliveryFee: goMarketDelivery,
    normalShippingFee: normalShipping,
    normalDeliveryFee: normalDelivery,
    subtotal: baseAfterDiscount,
    goMarketSubtotal: goMarketSubtotal,
    normalSubtotal: nonGoMarketSubtotal,
    distanceKm: hasGoMarketItems ? distanceKm : 0,
    userLocation: hasGoMarketItems ? (userData as any)?.goMarketLocation : null,
    cartType: isMixedCart ? "mixed" : (hasGoMarketItems ? "gomarket" : "normal"),
    totalAmt: total,
    date: new Date().toISOString(),
    customerName: userData?.name,
    customerEmail: userData?.email,
    customerMobile: userData?.mobile,
    checkoutType: isBuyNowCheckout ? "buy_now" : "cart",
  });

  const clearCartAfterOrder = async () => {
    if (isBuyNowCheckout || !userData?._id) return;
    try {
      await Promise.allSettled([
        deleteData(`/api/cart/emptyCart/${userData._id}`),
        deleteData(`/api/cart/clear/${userData._id}`),
        deleteData("/api/cart/emptyCart"),
        deleteData("/api/cart/clear"),
      ]);
      await dispatch(fetchCartItems());
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const initiateRazorpayPayment = async () => {
    if (!selectedAddrId) {
      showToast("error", "Please select a delivery address");
      return;
    }
    if (!checkoutItems?.length) {
      showToast("error", "No items in checkout");
      return;
    }
    if (total <= 0) {
      showToast("error", "Invalid order amount");
      return;
    }

    setPlacing(true);
    try {
      const description =
        checkoutItems.length === 1
          ? checkoutItems[0]?.productTitle || "Order"
          : `Order with ${checkoutItems.length} items`;

      const paymentResponse = await createOrderAndPay({
        amount: total,
        currency: "INR",
        description,
        productNames: checkoutItems
          .map((item) => item?.productTitle)
          .filter(Boolean)
          .join(", "),
        userId: userData?._id,
        customerName: userData?.name,
        customerEmail: userData?.email,
        customerContact: userData?.mobile,
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
          contact: userData?.mobile || "",
        },
        themeColor: "#ff6b00",
      });

      await handleRazorpaySuccess(paymentResponse);
    } catch (error) {
      if (
        error instanceof RazorpayPaymentError &&
        error.reason === "cancelled"
      ) {
        showToast("info", "Payment cancelled. You can retry when ready.");
      }
      setPlacing(false);
    }
  };

  const handleRazorpaySuccess = async (paymentResponse: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const paymentId = paymentResponse.razorpay_payment_id;
      if (!paymentId) {
        showToast("error", "Payment verification failed");
        setPlacing(false);
        router.replace("/order-failed" as never);
        return;
      }

      const res = await postData("/api/order/create", {
        ...buildOrderPayload("COMPLETED"),
        paymentId,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      if (res?.error === false) {
        showToast("success", res?.message || "Order placed successfully!");
        await clearCartAfterOrder();
        setPlacing(false);
        router.replace("/order-success" as never);
      } else {
        showToast("error", res?.message || "Failed to create order");
        setPlacing(false);
        router.replace("/order-failed" as never);
      }
    } catch (error: any) {
      showToast("error", error?.message || "Error processing payment");
      setPlacing(false);
      router.replace("/order-failed" as never);
    }
  };

  const cashOnDelivery = async () => {
    if (!selectedAddrId) {
      showToast("error", "Please select a delivery address");
      return;
    }
    if (!checkoutItems?.length) {
      showToast("error", "No items in checkout");
      return;
    }

    setPlacing(true);
    try {
      const res = await postData(
        "/api/order/create",
        buildOrderPayload("CASH ON DELIVERY"),
      );
      if (res?.error === false) {
        showToast("success", res?.message || "Order placed successfully!");
        await clearCartAfterOrder();
        setPlacing(false);
        router.replace("/order-success" as never);
      } else {
        showToast("error", res?.message || "Failed to place order");
        setPlacing(false);
        router.replace("/order-failed" as never);
      }
    } catch (error: any) {
      showToast("error", error?.message || "Error creating order");
      setPlacing(false);
      router.replace("/order-failed" as never);
    }
  };

  // ── KEY CHANGE: guard — payment method must be selected first ──
  const handlePlaceOrder = () => {
    if (!paymentMode) {
      showToast("error", "Please select a payment method to continue");
      shakePaymentSection();
      return;
    }
    if (paymentMode === "COD") cashOnDelivery();
    else initiateRazorpayPayment();
  };

  const isReadyToOrder = !!selectedAddrId && !!paymentMode && !placing && !isPaymentProcessing;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        onScroll={handleScroll}
        contentContainerStyle={[
          mainStyles.scrollContent,
          { paddingBottom: footerBottomPadding + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <CheckoutHeader itemCount={checkoutItems.length} />

        {/* Step Progress */}
        <StepIndicator current={1} />

        {/* ── Delivery Address ── */}
        <AnimatedSection
          title="Delivery Address"
          icon={<Feather name="map-pin" size={16} color={colors.primary} />}
          delay={0}
        >
          {addresses.length === 0 ? (
            <Pressable
              onPress={() => router.push("/add-address" as never)}
              style={[
                mainStyles.addAddrBtn,
                { borderColor: colors.primary, backgroundColor: colors.accent },
              ]}
            >
              <Feather name="plus-circle" size={16} color={colors.primary} />
              <Text style={[mainStyles.addAddrText, { color: colors.primary }]}>
                Add a delivery address
              </Text>
            </Pressable>
          ) : (
            <>
              {addresses.map((a: UserAddress) => (
                <AddressCard
                  key={a._id}
                  address={a}
                  selected={a._id === selectedAddrId}
                  onPress={() => setSelectedAddrId(a._id)}
                />
              ))}
              <Pressable
                onPress={() => router.push("/add-address" as never)}
                style={mainStyles.addMoreBtn}
              >
                <Feather name="plus" size={13} color={colors.primary} />
                <Text
                  style={[mainStyles.addMoreText, { color: colors.primary }]}
                >
                  Add new address
                </Text>
              </Pressable>
            </>
          )}
        </AnimatedSection>

        {/* ── Order Items ── */}
        <AnimatedSection
          title="Order Items"
          icon={
            <Feather name="shopping-bag" size={16} color={colors.primary} />
          }
          badge={`${checkoutItems.length} item${checkoutItems.length !== 1 ? "s" : ""}`}
          delay={80}
        >
          <View
            style={[mainStyles.itemsContainer, { borderColor: colors.border }]}
          >
            {checkoutItems.map((c, idx) => {
              const attrs = getProductAttributes(c);
              return (
                <View
                  key={c._id || idx}
                  style={[
                    mainStyles.itemRow,
                    idx < checkoutItems.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  {c.image && (
                    <Image
                      source={{ uri: c.image }}
                      style={mainStyles.itemImage}
                      contentFit="cover"
                    />
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      numberOfLines={2}
                      style={[
                        mainStyles.itemTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      {c.productTitle}
                    </Text>
                    {attrs.length > 0 && (
                      <View style={mainStyles.attributesRow}>
                        {attrs.map((attr, i) => (
                          <Text
                            key={i}
                            numberOfLines={1}
                            style={[
                              mainStyles.attributeTag,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {attr}
                          </Text>
                        ))}
                      </View>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={[
                          mainStyles.qtyBadge,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            mainStyles.itemQty,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          ×{c.quantity || 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          mainStyles.itemPrice,
                          { color: colors.foreground },
                        ]}
                      >
                        ₹
                        {((c.price || 0) * (c.quantity || 1)).toLocaleString(
                          "en-IN",
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </AnimatedSection>

        {/* ── Coupon (Dynamic) ── */}
        <AnimatedSection
          title="Promo Code"
          icon={<Feather name="tag" size={16} color={colors.primary} />}
          delay={160}
        >
          <CouponSection
            coupon={coupon}
            setCoupon={setCoupon}
            discount={discount}
            setDiscount={setDiscount}
            subTotal={subTotal}
            onRemove={removeCoupon}
            checkoutItems={checkoutItems}
          />
        </AnimatedSection>

        {/* ── Payment Method ── */}
        {/* ── KEY CHANGE: shake wrapper + "required" indicator when not selected ── */}
        <Animated.View style={{ transform: [{ translateX: paymentShakeAnim }] }}>
          <AnimatedSection
            title="Payment Method"
            icon={
              <Ionicons name="card-outline" size={16} color={paymentMode ? colors.primary : colors.destructive} />
            }
            badge={paymentMode ? undefined : "Required"}
            delay={240}
          >
            {/* Prompt banner shown when no method selected */}
            {!paymentMode && (
              <View
                style={[
                  mainStyles.paymentPromptBanner,
                  {
                    backgroundColor: colors.destructive + "10",
                    borderColor: colors.destructive + "30",
                  },
                ]}
              >
                <Feather name="alert-circle" size={13} color={colors.destructive} />
                <Text style={[mainStyles.paymentPromptText, { color: colors.destructive }]}>
                  Select a payment method to place your order
                </Text>
              </View>
            )}

            <PaymentOption
              mode="COD"
              icon={
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={
                    paymentMode === "COD"
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
              }
              title="Cash on Delivery"
              subtitle="Pay when your order arrives"
              tags={["Safe", "No extra charges"]}
              selected={paymentMode === "COD"}
              onPress={() => setPaymentMode("COD")}
            />
            <PaymentOption
              mode="RAZORPAY"
              icon={
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={20}
                  color={
                    paymentMode === "RAZORPAY"
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
              }
              title="Pay on Online"
              subtitle="Secure instant payment"
              tags={["UPI", "Cards", "Wallet", "Net Banking"]}
              selected={paymentMode === "RAZORPAY"}
              onPress={() => setPaymentMode("RAZORPAY")}
            />
          </AnimatedSection>
        </Animated.View>

        {/* ── Price Summary ── */}
        <AnimatedSection
          title="Price Summary"
          icon={<Feather name="file-text" size={16} color={colors.primary} />}
          delay={320}
        >
          <View style={{ gap: 10 }}>
            <PriceRow
              label="Subtotal"
              value={`₹${subTotal.toLocaleString("en-IN")}`}
            />
            {discount > 0 && (
              <PriceRow
                label={`Coupon (${coupon})`}
                value={`-₹${discount.toLocaleString("en-IN")}`}
                color={colors.success}
              />
            )}
            {isFirstOrder && (
              <View
                style={{
                  backgroundColor: "#f0fdf4",
                  borderColor: "#86efac",
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#15803d",
                  }}
                >
                  🎉 First Order - FREE Shipping & Delivery!
                </Text>
              </View>
            )}
            
            {/* Go Market Fees */}
            {hasGoMarketItems && (
              <>
                <PriceRow
                  label="Go Market Shipping"
                  value={goMarketShipping === 0 ? "FREE" : `₹${goMarketShipping.toFixed(2)}`}
                  color={goMarketShipping === 0 ? colors.success : undefined}
                />
                <PriceRow 
                  label={`Go Market Delivery (${distanceKm.toFixed(1)} km)`} 
                  value={goMarketDelivery === 0 ? "FREE" : `₹${goMarketDelivery}`} 
                  color={goMarketDelivery === 0 ? colors.success : undefined} 
                />
                {/* Always show distance-based fee breakdown for Go Market items */}
                {distanceKm > 0 && (
                  <View
                    style={{
                      backgroundColor: "#eff6ff",
                      borderColor: "#bfdbfe",
                      borderWidth: 1,
                      borderRadius: 6,
                      padding: 8,
                      marginTop: 4,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#1e40af",
                      }}
                    >
                      ℹ️ Distance-based delivery:{'\n'}
                      Rate: ₹{(commerceSettings.goMarketDeliveryFeePerKm || 0)}/km × {distanceKm.toFixed(1)} km = ₹{goMarketDelivery}
                      {isFirstOrder && '\n(FREE - First Order)'}
                      {freeByRule && '\n(FREE - Order above threshold)'}
                    </Text>
                  </View>
                )}
                {distanceKm === 0 && (
                  <View
                    style={{
                      backgroundColor: "#fef3c7",
                      borderColor: "#fde047",
                      borderWidth: 1,
                      borderRadius: 6,
                      padding: 8,
                      marginTop: 4,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#92400e",
                      }}
                    >
                      ⚠️ Distance not calculated. Enable location for accurate delivery fees.
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {/* Normal E-commerce Fees */}
            {hasNonGoMarketItems && (
              <>
                <PriceRow
                  label="Shipping"
                  value={normalShipping === 0 ? "FREE" : `₹${normalShipping}`}
                  color={normalShipping === 0 ? colors.success : undefined}
                />
                <PriceRow 
                  label="Delivery fee" 
                  value={normalDelivery === 0 ? "FREE" : `₹${normalDelivery}`} 
                  color={normalDelivery === 0 ? colors.success : undefined} 
                />
              </>
            )}
            
            {/* Mixed Cart Info */}
            {isMixedCart && !isFirstOrder && !freeByRule && (
              <View
                style={{
                  backgroundColor: "#fef3c7",
                  borderColor: "#fde047",
                  borderWidth: 1,
                  borderRadius: 6,
                  padding: 8,
                  marginTop: 4,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#92400e",
                  }}
                >
                  📦 Mixed Cart: Go Market + Regular items
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#92400e",
                    marginTop: 2,
                  }}
                >
                  {goMarketItems.length} Go Market item(s) · {nonGoMarketItems.length} Regular item(s)
                </Text>
              </View>
            )}
            {/* {shipping > 0 && (
              <View
                style={[
                  mainStyles.freeShipHint,
                  {
                    backgroundColor: colors.primary + "10",
                    borderColor: colors.primary + "30",
                  },
                ]}
              >
                <Feather name="info" size={11} color={colors.primary} />
                <Text
                  style={[mainStyles.freeShipText, { color: colors.primary }]}
                >
                  Add ₹{(500 - subTotal).toLocaleString("en-IN")} more for FREE
                  shipping
                </Text>
              </View>
            )} */}
            <View
              style={[mainStyles.divider, { backgroundColor: colors.border }]}
            />
            <PriceRow
              label="Total Amount"
              value={`₹${total.toLocaleString("en-IN")}`}
              bold
            />
            {discount > 0 && (
              <View
                style={[
                  mainStyles.savingChip,
                  {
                    backgroundColor: colors.success + "15",
                    borderColor: colors.success + "30",
                  },
                ]}
              >
                <Feather
                  name="trending-down"
                  size={12}
                  color={colors.success}
                />
                <Text
                  style={[mainStyles.savingText, { color: colors.success }]}
                >
                  Total savings: ₹{discount.toLocaleString("en-IN")}
                </Text>
              </View>
            )}
          </View>
        </AnimatedSection>

        {/* ── Trust badges ── */}
        <AnimatedSection
          title="Why shop with us?"
          icon={<Feather name="shield" size={16} color={colors.primary} />}
          delay={400}
        >
          <View style={mainStyles.trustGrid}>
            {[
              { icon: "shield", label: "Secure\nPayments" },
              { icon: "refresh-cw", label: "Easy\nReturns" },
              { icon: "truck", label: "Fast\nDelivery" },
              { icon: "award", label: "Quality\nGuaranteed" },
            ].map(({ icon, label }) => (
              <View key={icon} style={mainStyles.trustItem}>
                <View
                  style={[
                    mainStyles.trustIcon,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Feather
                    name={icon as any}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text
                  style={[
                    mainStyles.trustLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </AnimatedSection>
      </ScrollView>

      {/* ── Fixed Footer ── */}
      <SafeAreaView
        edges={["bottom"]}
        style={[
          mainStyles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: footerBottomPadding },
        ]}
      >
        {/* ── KEY CHANGE: show "select payment" hint in footer when not selected ── */}
        {!paymentMode && (
          <View
            style={[
              mainStyles.footerPaymentHint,
              {
                backgroundColor: colors.destructive + "12",
                borderColor: colors.destructive + "25",
              },
            ]}
          >
            <Feather name="credit-card" size={12} color={colors.destructive} />
            <Text style={[mainStyles.footerPaymentHintText, { color: colors.destructive }]}>
              Choose COD or Online above to proceed
            </Text>
          </View>
        )}

        <View style={mainStyles.footerContent}>
          <View>
            <Text
              style={[
                mainStyles.footerLabel,
                { color: colors.mutedForeground },
              ]}
            >
              Total payable
            </Text>
            <Text
              style={[mainStyles.footerTotal, { color: colors.foreground }]}
            >
              ₹{total.toLocaleString("en-IN")}
            </Text>
          </View>
          <Animated.View
            style={{ flex: 1, transform: [{ scale: footerAnim }] }}
          >
            <Pressable
              onPress={handlePlaceOrder}
              disabled={placing || isPaymentProcessing}
              style={{
                backgroundColor: placing || isPaymentProcessing
                  ? colors.muted
                  : !paymentMode
                    ? colors.border   // greyed-out until payment selected
                    : colors.primary,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                opacity: placing || isPaymentProcessing ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: !paymentMode ? colors.mutedForeground : "#fff",
                  fontSize: 15,
                  fontFamily: "Inter_700Bold",
                }}
              >
                {placing || isPaymentProcessing
                  ? "Processing..."
                  : !paymentMode
                    ? "Select Payment Method"
                    : paymentMode === "COD"
                      ? "Place Order"
                      : "Pay Now"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* ── Loading overlay ── */}
      {!userData && (
        <View
          style={[mainStyles.overlay, { backgroundColor: colors.background }]}
        >
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
    </View>
  );
}

// ─── Checkout Header ─────────────────────────────────────────────────────────
const CheckoutHeader = ({ itemCount }: { itemCount?: number }) => {
  const colors = useColors();

  return (
    <View
      style={[
        checkoutHeaderStyles.header,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
    >
      <Text
        style={[checkoutHeaderStyles.headerTitle, { color: colors.foreground }]}
      >
        Checkout{itemCount ? ` (${itemCount})` : ""}
      </Text>
    </View>
  );
};

const checkoutHeaderStyles = StyleSheet.create({
  header: {
    paddingHorizontal: IS_SMALL ? 12 : 14,
    paddingVertical: IS_SMALL ? 10 : 12,
    paddingTop: IS_SMALL ? 12 : 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -(IS_SMALL ? 12 : 14),
    marginTop: 0,
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
});

const mainStyles = StyleSheet.create({
  scrollContent: { padding: IS_SMALL ? 10 : 14, paddingTop: 4 },
  addAddrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    borderStyle: "dashed",
  },
  addAddrText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingVertical: 4,
    marginTop: 2,
  },
  addMoreText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  itemsContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  itemTitle: { fontSize: IS_SMALL ? 11 : 12, fontFamily: "Inter_500Medium" },
  attributesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  attributeTag: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    maxWidth: "50%",
  },
  qtyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemQty: { fontSize: IS_SMALL ? 10 : 11, fontFamily: "Inter_500Medium" },
  itemPrice: { fontSize: IS_SMALL ? 12 : 13, fontFamily: "Inter_700Bold" },
  freeShipHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  freeShipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  divider: { height: 1, borderRadius: 1 },
  savingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  savingText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  trustGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trustItem: { alignItems: "center", gap: 6, flex: 1 },
  trustIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  // Payment prompt banner inside payment section
  paymentPromptBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  paymentPromptText: {
    fontSize: IS_SMALL ? 11 : 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  // Footer hint strip
  footerPaymentHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  footerPaymentHintText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: IS_SMALL ? 12 : 16,
    paddingTop: 10,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  footerTotal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});