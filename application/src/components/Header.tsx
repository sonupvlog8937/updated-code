import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useAppSelector } from "@/src/store";
import { useColors } from "@/hooks/useColors";
import { SearchModal } from "@/src/components/SearchModal";

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

  // Check if on home page
  const isHomePage = pathname === "/" || pathname === "/" || pathname === "/";
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
          <Pressable
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
          </Pressable>

          {/* Center: Logo */}
          <View style={styles.logoContainer}>
            <Pressable onPress={() => router.push("/" as never)}>
              <View style={styles.logoWrapper}>
                <Text style={[styles.logo, { color: colors.foreground }]}>
                  <Text style={[styles.logoBold, { color: colors.foreground }]}>zee</Text>
                  <Text style={[styles.logoBoldAccent, { color: colors.primary }]}>
                    daddy
                  </Text>
                </Text>
                <Text style={[styles.logoSubtitle, { color: colors.mutedForeground }]}>
                  ONLINE SHOPPING APP
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Right: Search + Login/Menu Icon */}
          <View style={styles.rightSection}>
            <Pressable
              onPress={() => setSearchModalOpen(true)}
              style={styles.iconButton}
              hitSlop={8}
            >
              <Feather name="search" size={20} color={colors.foreground} />
            </Pressable>

            {isLogin ? (
              <Pressable
                onPress={() => setQuickMenuOpen(true)}
                style={styles.iconButton}
                hitSlop={8}
              >
                <Feather name="more-vertical" size={22} color={colors.foreground} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push("/login" as never)}
                style={styles.iconButton}
                hitSlop={8}
              >
                <Feather name="log-in" size={20} color={colors.foreground} />
              </Pressable>
            )}

            {/* Red Accent Bar */}
            <View
              style={[styles.accentBar, { backgroundColor: colors.primary }]}
            />
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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
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
  logoSubtitle: {
    fontSize: 7,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: -2,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
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
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
