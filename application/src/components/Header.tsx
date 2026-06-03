import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Modal,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useAppSelector } from "@/src/store";
import { useColors } from "@/hooks/useColors";
import { SearchModal } from "@/src/components/SearchModal";
import { fetchDataFromApi } from "@/src/utils/api";

interface HeaderProps {
  showBreadcrumb?: boolean;
  title?: string;
}

const withOpacity = (color: string, opacity: number) => {
  if (!color) return color;

  if (color.startsWith("rgba(")) {
    const parts = color
      .replace("rgba(", "")
      .replace(")", "")
      .split(",")
      .map((part) => part.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${opacity})`;
    }
    return color;
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  }

  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const normalized =
      hex.length === 3
        ? hex
          .split("")
          .map((c) => c + c)
          .join("")
        : hex.slice(0, 6);
    const int = Number.parseInt(normalized, 16);
    if (Number.isNaN(int)) return color;
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
};

export const Header: React.FC<HeaderProps> = ({ showBreadcrumb = false, title }) => {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();

  const cartData = useAppSelector((s) => s.app.cartData);
  const myListData = useAppSelector((s) => s.app.myListData);
  const isLogin = useAppSelector((s) => s.app.isLogin);

  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const isHomePage =
    pathname === "/" ||
    pathname === "/(tabs)" ||
    pathname === "/(tabs)/index";

  useEffect(() => {
    let cancelled = false;

    const loadLogo = async () => {
      try {
        const res = (await fetchDataFromApi("/api/logo")) as {
          logo?: { logo?: string }[];
        };
        const logo = res?.logo?.[0]?.logo;
        if (!cancelled && logo) {
          setLogoUri(logo);
          await AsyncStorage.setItem("logo", logo);
          return;
        }
      } catch {
        // fall through to cache
      }

      if (!cancelled) {
        const cached = await AsyncStorage.getItem("logo");
        if (cached) setLogoUri(cached);
      }
    };

    loadLogo();
    return () => {
      cancelled = true;
    };
  }, []);
  const quickMenuItems = useMemo(() => {
    const destructive = colors.destructive || colors.primary;
    const info = colors.info || colors.primary;
    const success = colors.success || colors.primary;
    const warning = colors.warning || colors.primary;

    return [
      {
        id: "wishlist",
        label: "My Wishlist",
        desc: "Saved items",
        icon: "heart",
        badge: myListData?.length || 0,
        color: destructive,
        bg: withOpacity(destructive, 0.14),
        route: "/wishlist",
      },
      {
        id: "my-orders",
        label: "My Orders",
        desc: "Track purchases",
        icon: "package",
        color: info,
        bg: withOpacity(info, 0.14),
        route: "/my-orders",
      },
      {
        id: "offers",
        label: "View Offers",
        desc: "Deals & flash sales",
        icon: "tag",
        color: success,
        bg: withOpacity(success, 0.14),
        route: "/offers",
      },
      {
        id: "become-seller",
        label: "Become a Seller",
        desc: "Start selling",
        icon: "briefcase",
        color: warning,
        bg: withOpacity(warning, 0.14),
        route: "/become-seller",
      },
      {
        id: "settings",
        label: "Settings",
        desc: "Account & preferences",
        icon: "settings",
        color: colors.primary,
        bg: withOpacity(colors.primary, 0.14),
        route: "/settings",
      },
    ];
  }, [colors, myListData?.length]);
  const primaryForeground = colors.primaryForeground || "#ffffff";

  const handleMenuItemPress = (route: string) => {
    setQuickMenuOpen(false);
    router.push(route as never);
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.card}
        translucent={false}
      />

      {/* Main Header */}
      <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.card }]}>
        <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {/* Left: Menu or Back Button */}
          {/* <Pressable
            onPress={() => {
              if (isHomePage) {
                setCategoryMenuOpen(true);
              } else {
                router.back();
              }
            }}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Feather
              name={isHomePage ? "menu" : "chevron-left"}
              size={24}
              color={colors.foreground}
            />
          </Pressable> */}

          <View style={styles.leftSection}>
            {/* Back Button - Only show when not on home page */}
            {!isHomePage && (
              <Pressable
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: colors.accent }]}
                hitSlop={8}
              >
                <Feather name="arrow-left" size={18} color={colors.foreground} />
              </Pressable>
            )}

            {/* Logo from database */}
            <Pressable
              onPress={() => router.push("/" as never)}
              style={({ pressed }) => [
                styles.logoPress,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              hitSlop={6}
            >
              {logoUri ? (
                <Image
                  source={{ uri: logoUri }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <View style={styles.wordmarkRow}>
                    <Text style={[styles.wordmarkZee, { color: colors.foreground }]}>Zee</Text>
                    <Text style={[styles.wordmarkDaddy, { color: "#E5333A" }]}>Daddy</Text>
                    <Text style={[styles.starAccent, { color: "#E5333A" }]}>★</Text>
                  </View>
                  <Text style={[styles.logoSubtitle, { color: colors.mutedForeground }]}>
                    ONLINE SHOPPING APP
                  </Text>
                </>
              )}
            </Pressable>
            {/* <Pressable
              onPress={() => router.push("/go-market" as never)}
              style={({ pressed }) => [
                styles.marketButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              hitSlop={6}
            >
              <View style={styles.wordmarkRow}>
                <Text style={[styles.wordmarkZee, { color: "#111827" }]}>
                  Go
                </Text>
                <Text style={[styles.wordmarkDaddy, { color: "#E5333A" }]}>
                  Market
                </Text>
              </View>

              <Text style={styles.marketSubtitle}>
                ⚡ Quick Delivery
              </Text>
            </Pressable> */}
            <Pressable
                onPress={() => router.push("/go-market" as never)}
                style={styles.loginBtn1}
                hitSlop={8}
              >
                <View style={styles.wordmarkRow}>
                    <Text style={[styles.wordmarkZee, { color: colors.background }]}>Go</Text>
                    <Text style={[styles.wordmarkDaddy, { color: "#ff0000ff" }]}>Market</Text>
                    {/* <Text style={[styles.starAccent, { color: "#E5333A" }]}>★</Text> */}
                  </View>
                  <Text style={[styles.logoSubtitle, { color: colors.mutedForeground }]}>
                    ⚡ quick delivery
                  </Text>
              </Pressable>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Go Market */}
            {/* <Pressable
              onPress={() => router.push("/go-market" as never)}
              style={({ pressed }) => [styles.goMarketPill, { opacity: pressed ? 0.82 : 1, backgroundColor: colors.text }]}
              hitSlop={6}
            >
              <View style={[styles.goMarketIconBox, { backgroundColor: colors.mutedForeground, borderColor: colors.mutedForeground}]}>
                <Feather name="shopping-bag" size={12} color={colors.card} />
              </View>
              <View style={styles.goMarketTextStack}>
                <View style={styles.goMarketTitleRow}>
                  <Text style={[styles.goMarketTitle, {color: colors.card}]}>Go Market</Text>
                  <View style={[styles.liveDot, {backgroundColor: colors.success}]} />
                </View>
                <Text style={[styles.goMarketSub, { color: colors.mutedForeground}]}>⚡ quick delivery</Text>
              </View>
            </Pressable> */}
            {/* <Pressable
                  onPress={() => router.push("/go-market" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 0,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="shopping-bag" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.menuTextFlex}>
                    <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Go Market
                    </Text>
                  </View>
                  <Text style={[styles.goMarketSub, { color: colors.mutedForeground}]}>⚡ quick delivery</Text>
                  </View>
                  
                </Pressable> */}

          </View>

          {/* RIGHT: Search + more-vertical / login */}
          <View style={styles.rightSection}>

            <Pressable
              onPress={() => setSearchModalOpen(true)}
              style={[styles.iconBtn, { backgroundColor: colors.accent }]}
              hitSlop={8}
            >
              <Feather name="search" size={17} color={colors.foreground} />
            </Pressable>

            {isLogin ? (
              <Pressable
                onPress={() => setQuickMenuOpen(true)}
                style={[styles.iconBtn, { backgroundColor: colors.accent }]}
                hitSlop={8}
              >
                <Feather name="more-vertical" size={17} color={colors.foreground} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push("/login" as never)}
                style={styles.loginBtn}
                hitSlop={8}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </Pressable>
            )}

          </View>
        </View>
      </SafeAreaView>

      {/* Search Modal */}
      <SearchModal visible={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Quick Menu Modal */}
      <Modal
        visible={quickMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickMenuOpen(false)}
      >
        <Pressable
          style={[
            styles.modalBackdrop,
            { backgroundColor: withOpacity(colors.foreground, 0.4) },
          ]}
          onPress={() => setQuickMenuOpen(false)}
        >
          <Pressable
            style={[
              styles.quickMenuPanel,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.foreground,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <View
              style={[
                styles.menuHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.menuHeaderLabel, { color: colors.foreground }]}>
                MORE OPTIONS
              </Text>
              <Pressable
                onPress={() => setQuickMenuOpen(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Menu Items */}
            <ScrollView
              style={styles.menuList}
              showsVerticalScrollIndicator={false}
            >
              {/* {quickMenuItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleMenuItemPress(item.route)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    {
                      backgroundColor: pressed
                        ? colors.surfaceAlt
                        : colors.card,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.menuIconBox,
                      { backgroundColor: item.bg },
                    ]}
                  >
                    <Feather name={item.icon as any} size={18} color={item.color} />
                  </View>

                  <View style={styles.menuTextBox}>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.menuItemDesc,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.desc}
                    </Text>
                  </View>

                  {item.badge && item.badge > 0 && (
                    <View
                      style={[styles.redBadge, { backgroundColor: colors.destructive }]}
                    >
                      <Text
                        style={[styles.badgeSmallText, { color: primaryForeground }]}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Text>
                    </View>
                  )}

                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              ))} */}

              {/* Cart Section */}
              {/* {(cartData?.length || 0) > 0 && (
                <>
                  <View
                    style={[
                      styles.menuDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <Pressable
                    onPress={() => {
                      setQuickMenuOpen(false);
                      router.push("/(tabs)/cart" as never);
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      {
                        backgroundColor: pressed
                          ? colors.surfaceAlt
                          : colors.card,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.menuIconBox,
                        {
                          backgroundColor: withOpacity(
                            colors.warning || colors.primary,
                            0.16,
                          ),
                        },
                      ]}
                    >
                      <Feather
                        name="shopping-bag"
                        size={18}
                        color={colors.warning || colors.primary}
                      />
                    </View>
                    <View style={styles.menuTextBox}>
                      <Text
                        style={[
                          styles.menuItemLabel,
                          { color: colors.foreground },
                        ]}
                      >
                        Your Cart
                      </Text>
                      <Text
                        style={[
                          styles.menuItemDesc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {cartData?.length} items
                      </Text>
                    </View>
                    <View
                      style={[styles.yellowBadge, { backgroundColor: colors.warning }]}
                    >
                      <Text
                        style={[styles.badgeSmallText, { color: primaryForeground }]}
                      >
                        {cartData?.length}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </>
              )} */}

              {/* Auth Section */}
              {/* {!isLogin && (
                <>
                  <View
                    style={[
                      styles.menuDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <Pressable
                    onPress={() => {
                      setQuickMenuOpen(false);
                      router.push("/login" as never);
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      {
                        backgroundColor: pressed
                          ? colors.surfaceAlt
                          : colors.card,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.menuIconBox,
                        {
                          backgroundColor: withOpacity(
                            colors.success || colors.primary,
                            0.16,
                          ),
                        },
                      ]}
                    >
                      <Feather
                        name="log-in"
                        size={18}
                        color={colors.success || colors.primary}
                      />
                    </View>
                    <View style={styles.menuTextBox}>
                      <Text
                        style={[
                          styles.menuItemLabel,
                          { color: colors.foreground },
                        ]}
                      >
                        Login / Register
                      </Text>
                      <Text
                        style={[
                          styles.menuItemDesc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Sign in to your account
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </>
              )} */}
              <View style={{ marginTop: 16, marginLeft: 16, marginRight: 16 }}>

                <Pressable
                  onPress={() => router.push("/my-account" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="user" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      My Profile
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/my-orders" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="package" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      My Orders
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/cart" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="shopping-cart" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      My Carts
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/wishlist" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="heart" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      My Wishlist
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/categories" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="database" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Categories
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/address" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="map-pin" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Saved Addresses
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/notifications" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="bell" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Notifications
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/notification-settings" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="settings" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Notification & Setting
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/become-seller" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="shopping-bag" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Become a Seller
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/blog" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="book-open" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Blog & Tips
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/offers" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="tag" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Offers & coupons
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/privacy-policy" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="shield" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Privacy & Policy
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>

            </ScrollView>

            {/* Menu Footer */}
            <View
              style={[
                styles.menuFooter,
                { borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                Zeedaddy v2.0 • © 2026
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category Menu Modal */}
      <Modal
        visible={categoryMenuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryMenuOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
          <View
            style={[
              styles.categoryHeader,
              { backgroundColor: colors.card, borderBottomColor: colors.border },
            ]}
          >
            <Pressable
              onPress={() => setCategoryMenuOpen(false)}
              hitSlop={8}
            >
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
              Menu
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.categoryScrollView}
            contentContainerStyle={styles.categoryScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ marginTop: 16, marginLeft: 16, marginRight: 16 }}>
              <Pressable
                onPress={() => router.push("/" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="home" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Home
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/my-account" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="user" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    My Profile
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/my-orders" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="package" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    My Orders
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/cart" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="shopping-cart" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    My Carts
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/wishlist" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="heart" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    My Wishlist
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/categories" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="database" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Categories
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/address" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="map-pin" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Saved Addresses
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/notifications" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="bell" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Notifications
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/notification-settings" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="settings" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Notification & Setting
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/become-seller" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="shopping-bag" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Become a Seller
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/blog" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="book-open" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Blog & Tips
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/offers" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="tag" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Offers & coupons
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/privacy-policy" as never)}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="shield" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Privacy & Policy
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const FONT_SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });


const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
  },
  // headerContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  //   paddingHorizontal: 12,
  //   paddingVertical: 8,
  //   borderBottomWidth: 0.5,
  // },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoWrapper: {
    alignItems: "center",
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  logoBold: {
    fontWeight: "bold",
  },
  logoBoldAccent: {
    fontWeight: "bold",
  },
  // logoSubtitle: {
  //   fontSize: 7,
  //   fontWeight: "600",
  //   letterSpacing: 0.8,
  //   marginTop: -2,
  // },
  // rightSection: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 8,
  //   flex: 1,
  //   justifyContent: "flex-end",
  // },
  accentBar: {
    width: 3,
    height: 24,
    borderRadius: 1.5,
    marginLeft: 4,
  },
  redBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 4,
  },
  yellowBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 4,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 70,
  },
  quickMenuPanel: {
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: "75%",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    overflow: "hidden",
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuHeaderLabel: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  menuList: {
    maxHeight: 300,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextBox: {
    flex: 1,
    justifyContent: "center",
  },
  menuItemLabel: {
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 18,
  },
  menuItemDesc: {
    fontSize: 11,
    fontWeight: "normal",
    marginTop: 2,
    lineHeight: 15,
  },
  menuBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  badgeSmallText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  menuDivider: {
    height: 1,
    marginVertical: 6,
  },
  menuFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10.5,
    fontWeight: "normal",
  },

  // Category Menu
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  categoryScrollView: {
    flex: 1,
  },
  categoryScrollContent: {
    flexGrow: 1,
  },
  categoryList: {
    flex: 1,
    paddingVertical: 0,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    minHeight: 56,
  },
  categoryItemLabel: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoPress: {
    gap: 2,
    maxWidth: 130,
    flexShrink: 1,     // logo can shrink if needed
    minWidth: 0,       // allows flex to work properly
  },
  logoImage: {
    height: 32,        // slightly smaller to fit better
    width: 100,        // reduced from 120
    maxWidth: 110,     // reduced from 130
  },
  // wordmarkRow: {
  //   flexDirection: "row",
  //   alignItems: "flex-start",
  //   position: "relative",
  // },
  // wordmarkZee: {
  //   fontFamily: FONT_SERIF,
  //   fontSize: 21,
  //   fontWeight: "800",
  //   letterSpacing: -0.6,
  //   lineHeight: 24,
  // },
  // wordmarkDaddy: {
  //   fontFamily: FONT_SERIF,
  //   fontSize: 21,
  //   fontWeight: "800",
  //   letterSpacing: -0.6,
  //   lineHeight: 24,
  // },
  // starAccent: {
  //   fontSize: 8,
  //   color: "#E5333A",
  //   fontWeight: "700",
  //   marginTop: 3,
  //   marginLeft: 2,
  //   lineHeight: 10,
  // },
  // logoSubtitle: {
  //   fontSize: 7,
  //   fontWeight: "700",
  //   letterSpacing: 1.2,
  //   textTransform: "uppercase",
  //   marginTop: 1,
  // },

  /* ── Divider ── */
  // divider: {
  //   width: 1,
  //   height: 32,
  //   opacity: 0.35,
  // },

  /* ── Go Market pill ── */
  // goMarketPill: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 8,
  //   backgroundColor: "#111111",
  //   borderRadius: 12,
  //   paddingVertical: 7,
  //   paddingHorizontal: 11,
  //   paddingLeft: 8,
  // },
  // goMarketIconBox: {
  //   width: 30,
  //   height: 30,
  //   borderRadius: 8,
  //   backgroundColor: "rgba(255,255,255,0.10)",
  //   borderWidth: 0.5,
  //   borderColor: "rgba(255,255,255,0.13)",
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
  // goMarketTextStack: {
  //   gap: 1,
  // },
  // goMarketTitleRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 5,
  // },
  // goMarketTitle: {
  //   color: "#FFFFFF",
  //   fontSize: 13,
  //   fontWeight: "700",
  //   letterSpacing: -0.15,
  //   lineHeight: 16,
  // },
  // liveDot: {
  //   width: 6,
  //   height: 6,
  //   borderRadius: 3,
  //   backgroundColor: "#22C55E",
  // },
  // goMarketSub: {
  //   color: "rgba(255,255,255,0.45)",
  //   fontSize: 9,
  //   fontWeight: "500",
  //   letterSpacing: 0.2,
  //   lineHeight: 12,
  // },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },

  // LEFT
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,             // reduced from 8 for tighter spacing
    flex: 1,
    minWidth: 0,       // allows inner items to shrink on small screens
  },
  backButton: {
    width: 34,          // slightly smaller from 36
    height: 34,         // slightly smaller from 36
    borderRadius: 9,    // adjusted for smaller size
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,     // reduced from 4
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  wordmarkZee: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 15,       // slightly smaller from 17
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 18,     // reduced from 20
  },
  wordmarkDaddy: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 15,       // slightly smaller from 17
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 18,     // reduced from 20
  },
  starAccent: {
    fontSize: 6,        // slightly smaller from 7
    fontWeight: "700",
    marginTop: 2,
    marginLeft: 1,
    lineHeight: 8,      // reduced from 9
  },
  logoSubtitle: {
    fontSize: 5.5,      // slightly smaller from 6
    fontWeight: "700",
    letterSpacing: 0.8, // slightly reduced from 0.9
    textTransform: "uppercase",
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 24,         // reduced from 26 for better proportion
    opacity: 0.3,
    flexShrink: 0,
  },

  // Go Market pill
  goMarketPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,             // increased for better spacing
    // backgroundColor: "#111111",
    borderRadius: 10,   // slightly larger radius
    paddingVertical: 6, // increased padding
    paddingRight: 10,   // increased padding
    paddingLeft: 6,     // increased padding
    flexShrink: 1,     // pill shrinks before icons disappear on narrow screens
    minWidth: 0,
  },
  goMarketIconBox: {
    width: 24,          // increased size
    height: 24,         // increased size
    borderRadius: 6,    // adjusted for larger size
    // backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 0.5,
    // borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  goMarketTextStack: {
    gap: 0,
    minWidth: 0,
  },
  goMarketTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goMarketTitle: {
    // color: "#FFFFFF",
    fontSize: 11.5,     // slightly increased for better readability
    fontWeight: "700",
    letterSpacing: -0.1,
    lineHeight: 14,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    // backgroundColor: "#22C55E",
    flexShrink: 0,
  },
  goMarketSub: {
    // color: "rgba(255,255,255,0.45)",
    fontSize: 8.5,      // slightly increased
    fontWeight: "500",
    letterSpacing: 0.1,
    lineHeight: 11,
  },

  // RIGHT
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,    // icons never shrink — always visible
    marginLeft: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
    backgroundColor: "#111111",
  },
  loginBtn1: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#111111",
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  menuTextFlex: {
    flex: 1,
  },
  marketButton: {
  paddingHorizontal: 24,
  paddingVertical: 4,
  borderRadius: 14,
  borderWidth: 1.5,
  borderColor: "#E5333A",
  backgroundColor: "#FFF5F5",

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,

  elevation: 3,
},

marketSubtitle: {
  fontSize: 9,
  fontWeight: "600",
  color: "#6B7280",
  marginTop: 0,
},
});
