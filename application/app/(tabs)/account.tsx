import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { ScrollablePage } from "@/src/components/ScrollablePage";
import { useScrollHeader } from "@/src/hooks/useScrollHeader";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { logoutUser } from "@/src/store/appSlice";
import { showToast } from "@/src/utils/toast";

const { width } = Dimensions.get("window");
const IS_SMALL = width < 375;

interface MenuItem {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  iconColor: string;
  iconBg: string;
  badge?: string;
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

const createMenuSections = (colors: any) => {
  const info = colors.info || colors.primary;
  const success = colors.success || colors.primary;
  const warning = colors.warning || colors.primary;
  const destructive = colors.destructive || colors.primary;
  const muted = colors.mutedForeground || colors.foreground;

  return {
    account: [
      {
        label: "My Profile",
        icon: "user",
        route: "/my-account",
        iconColor: colors.primary,
        iconBg: withOpacity(colors.primary, 0.14),
      },
      {
        label: "My Orders",
        icon: "package",
        route: "/my-orders",
        iconColor: info,
        iconBg: withOpacity(info, 0.14),
      },
      {
        label: "My Wishlist",
        icon: "heart",
        route: "/wishlist",
        iconColor: destructive,
        iconBg: withOpacity(destructive, 0.14),
        badge: "wishlist",
      },
      {
        label: "Saved Addresses",
        icon: "map-pin",
        route: "/address",
        iconColor: success,
        iconBg: withOpacity(success, 0.14),
      },
    ] as MenuItem[],
    notifications: [
      {
        label: "Notifications",
        icon: "bell",
        route: "/notifications",
        iconColor: warning,
        iconBg: withOpacity(warning, 0.14),
      },
      {
        label: "Notification Settings",
        icon: "settings",
        route: "/notification-settings",
        iconColor: info,
        iconBg: withOpacity(info, 0.14),
      },
    ] as MenuItem[],
    more: [
      {
        label: "Offers & Coupons",
        icon: "tag",
        route: "/offers",
        iconColor: colors.primary,
        iconBg: withOpacity(colors.primary, 0.14),
      },
      {
        label: "Become a Seller",
        icon: "shopping-bag",
        route: "/become-seller",
        iconColor: info,
        iconBg: withOpacity(info, 0.14),
      },
      {
        label: "Blog & Tips",
        icon: "book-open",
        route: "/blog",
        iconColor: warning,
        iconBg: withOpacity(warning, 0.14),
      },
      {
        label: "Privacy & Policy",
        icon: "shield",
        route: "/privacy-policy",
        iconColor: muted,
        iconBg: withOpacity(muted, 0.12),
      },
    ] as MenuItem[],
  };
};

export default function AccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { handleScroll } = useScrollHeader();
  const userData = useAppSelector((s) => s.app.userData);
  const isLogin = useAppSelector((s) => s.app.isLogin);
  const cartCount = useAppSelector((s) => s.app.cartData?.length || 0);
  const wishCount = useAppSelector((s) => s.app.myListData?.length || 0);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const menuSections = useMemo(() => createMenuSections(colors), [colors]);
  const pageBackground = colors.surfaceAlt || colors.muted || colors.background;
  const destructiveColor = colors.destructive || colors.primary;
  const primaryForeground = colors.primaryForeground || "#ffffff";

  // Redirect to login if not logged in
  React.useEffect(() => {
    if (!isLogin && !userData) {
      const timer = setTimeout(() => {
        router.replace("/login" as never);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLogin, userData, router]);

  const profileCompletion = useMemo(() => {
    if (!userData) return 0;
    let completed = 0;
    const total = 5;
    if (userData.name) completed++;
    if (userData.email) completed++;
    if (userData.mobile) completed++;
    if (userData.avatar) completed++;
    if (userData.address_details?.length) completed++;
    return Math.round((completed / total) * 100);
  }, [userData]);

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
      showToast("success", "Signed out successfully");
      setTimeout(() => {
        router.replace("/login" as never);
      }, 500);
    } catch (error) {
      showToast("error", "Failed to sign out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  // Show loading while checking auth
  if (!isLogin || !userData) {
    return (
      <View style={{ flex: 1, backgroundColor: pageBackground }}>
        <SafeAreaView
          edges={["left", "right"]}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: pageBackground }}>
      <SafeAreaView edges={["left", "right"]} style={{ flex: 1 }}>
        <ScrollablePage
          onScroll={handleScroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View
            style={[
              styles.accountHeader,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.accountHeaderTitle, { color: colors.foreground }]}>
              My Account
            </Text>
          </View>

          {/* Profile Card */}
          <View style={{ padding: IS_SMALL ? 10 : 12, paddingTop: IS_SMALL ? 12 : 14 }}>
            <View
              style={[
                styles.profileCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.profileRow}>
                <View
                  style={[
                    styles.avatar,
                    {
                      width: IS_SMALL ? 56 : 64,
                      height: IS_SMALL ? 56 : 64,
                      borderRadius: IS_SMALL ? 28 : 32,
                      backgroundColor: colors.accent,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {userData?.avatar ? (
                    <Image
                      source={{ uri: userData.avatar }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.avatarLetter,
                        { fontSize: IS_SMALL ? 20 : 24, color: colors.primary },
                      ]}
                    >
                      {(userData?.name || userData?.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.name,
                      { fontSize: IS_SMALL ? 14 : 16, color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {userData?.name || "User"}
                  </Text>
                  <Text
                    style={[
                      styles.email,
                      {
                        fontSize: IS_SMALL ? 11 : 12,
                        color: colors.mutedForeground,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {userData?.email}
                  </Text>
                  {/* <Text
                    style={[
                      styles.memberSince,
                      {
                        fontSize: IS_SMALL ? 10 : 11,
                        color: colors.mutedForeground,
                      },
                    ]}
                  >
                    Member since 2024
                  </Text> */}
                </View>
                <Pressable
                  onPress={() => router.push("/my-account" as never)}
                  style={[
                    styles.editBtn,
                    {
                      width: IS_SMALL ? 32 : 36,
                      height: IS_SMALL ? 32 : 36,
                      borderRadius: IS_SMALL ? 16 : 18,
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Feather
                    name="edit-2"
                    size={IS_SMALL ? 14 : 16}
                    color={primaryForeground}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Profile Completion Card */}
          <View style={{ padding: IS_SMALL ? 10 : 12, paddingBottom: 4 }}>
            <View
              style={[
                styles.completionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.menuTextFlex}>
                <Text
                  style={[
                    styles.completionTitle,
                    { color: colors.foreground, fontSize: IS_SMALL ? 12 : 13 },
                  ]}
                >
                  Profile Completion
                </Text>
                <Text
                  style={[
                    styles.completionSub,
                    {
                      color: colors.mutedForeground,
                      fontSize: IS_SMALL ? 10 : 11,
                    },
                  ]}
                >
                  {profileCompletion}% complete
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarContainer,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${profileCompletion}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={{ paddingHorizontal: IS_SMALL ? 10 : 12, paddingTop: 4 }}>
            <View style={styles.statsRow}>
              <StatCard
                icon="package"
                label="Orders"
                value="—"
                color={colors.info || colors.primary}
                bgColor={colors.card}
                borderColor={colors.border}
                isSmall={IS_SMALL}
              />
              <StatCard
                icon="heart"
                label="Wishlist"
                value={String(wishCount)}
                color={colors.destructive || colors.primary}
                bgColor={colors.card}
                borderColor={colors.border}
                isSmall={IS_SMALL}
              />
              <StatCard
                icon="shopping-bag"
                label="Cart"
                value={String(cartCount)}
                color={colors.warning || colors.primary}
                bgColor={colors.card}
                borderColor={colors.border}
                isSmall={IS_SMALL}
              />
            </View>
          </View>

          {/* Account Section */}
          {/* <SectionContainer title="Account" colors={colors} isSmall={IS_SMALL}>
            <MenuGrid
              items={menuSections.account}
              colors={colors}
              router={router}
              isSmall={IS_SMALL}
              wishCount={wishCount}
            />
          </SectionContainer> */}
          <View style={{ marginTop: 16, marginLeft: 16, marginRight: 16 }}>
          <Text
            style={[
              styles.name,
              { fontSize: IS_SMALL ? 14 : 16, color: colors.foreground },
            ]}
            numberOfLines={1}
          >
            Account
            
          </Text>
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
          </View>


          {/* Notifications Section */}
          {/* <SectionContainer
            title="Notifications & Settings"
            colors={colors}
            isSmall={IS_SMALL}
          >
            <MenuGrid
              items={menuSections.notifications}
              colors={colors}
              router={router}
              isSmall={IS_SMALL}
              wishCount={wishCount}
            />
          </SectionContainer> */}
          <View style={{ marginTop: 16, marginLeft: 16, marginRight: 16 }}>
          <Text
            style={[
              styles.name,
              { fontSize: IS_SMALL ? 14 : 16, color: colors.foreground },
            ]}
            numberOfLines={1}
          >
            Notification & Setting
            
          </Text>
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
          </View>

          {/* More Section */}
          {/* <SectionContainer title="More" colors={colors} isSmall={IS_SMALL}>
            <MenuGrid
              items={menuSections.more}
              colors={colors}
              router={router}
              isSmall={IS_SMALL}
              wishCount={wishCount}
            />
          </SectionContainer> */}
          <View style={{ marginTop: 16, marginLeft: 16, marginRight: 16 }}>
          <Text
            style={[
              styles.name,
              { fontSize: IS_SMALL ? 14 : 16, color: colors.foreground },
            ]}
            numberOfLines={1}
          >
            More
            
          </Text>
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

          {/* Support Section */}
          <View
            style={{
              paddingHorizontal: IS_SMALL ? 10 : 12,
              paddingVertical: IS_SMALL ? 8 : 10,
            }}
          >
            <View
              style={[
                styles.supportCard,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.primary,
                },
              ]}
            >
              <View
                style={[
                  styles.supportIconWrapper,
                  {
                    width: IS_SMALL ? 36 : 40,
                    height: IS_SMALL ? 36 : 40,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Feather
                  name="help-circle"
                  size={IS_SMALL ? 18 : 20}
                  color={primaryForeground}
                />
              </View>
              <View style={styles.menuTextFlex}>
                <Text
                  style={[
                    styles.supportTitle,
                    { color: colors.foreground, fontSize: IS_SMALL ? 12 : 13 },
                  ]}
                >
                  Need Help?
                </Text>
                <Text
                  style={[
                    styles.supportSub,
                    {
                      color: colors.mutedForeground,
                      fontSize: IS_SMALL ? 10 : 11,
                    },
                  ]}
                >
                  Contact our support team
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={IS_SMALL ? 16 : 18}
                color={colors.primary}
              />
            </View>
          </View>

          {/* Sign Out Button */}
          {/* <View
            style={{
              paddingHorizontal: IS_SMALL ? 10 : 12,
              paddingVertical: IS_SMALL ? 8 : 10,
            }}
          >
            <Pressable
              onPress={onLogout}
              disabled={isLoggingOut}
              style={({ pressed }) => [
                styles.logoutBtn,
                {
                  borderColor: destructiveColor,
                  opacity: isLoggingOut ? 0.6 : pressed ? 0.7 : 1,
                  paddingVertical: IS_SMALL ? 11 : 13,
                },
              ]}
            >
              {isLoggingOut ? (
                <ActivityIndicator color={destructiveColor} size="small" />
              ) : (
                <Feather
                  name="log-out"
                  size={IS_SMALL ? 14 : 16}
                  color={destructiveColor}
                />
              )}
              <Text
                style={[
                  styles.logoutText,
                  { color: destructiveColor, fontSize: IS_SMALL ? 13 : 14 },
                ]}
              >
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </Text>
            </Pressable>
          </View> */}
          <View style={{ marginTop: 16, marginLeft: 16, marginRight: 16 }}>
          <Pressable
            onPress={onLogout}
              disabled={isLoggingOut}
            style={[
              styles.actionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                marginTop: 10,
              },
            ]}
          >
            {isLoggingOut ? (
                <ActivityIndicator color={colors.primary} size={18} />
              ) : (
                <Feather
                  name="log-out"
                  size={18}
                  color={colors.primary}
                />
              )}
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                }}
              >
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </Text>
          </Pressable>
          </View>

          {/* Footer */}
          <View
            style={{ paddingHorizontal: IS_SMALL ? 10 : 12, paddingBottom: 10 }}
          >
            <Text
              style={[
                styles.footerVersion,
                { color: colors.mutedForeground, fontSize: IS_SMALL ? 10 : 11 },
              ]}
            >
              Zee Daddy v1.0.0
            </Text>
            <Text
              style={[
                styles.footerCopyright,
                { color: colors.mutedForeground, fontSize: IS_SMALL ? 9 : 10 },
              ]}
            >
              © 2024 Zee Daddy. All rights reserved.
            </Text>
          </View>
        </ScrollablePage>
      </SafeAreaView>
    </View>
  );
}

const SectionContainer = ({
  title,
  children,
  colors,
  isSmall,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
  isSmall: boolean;
}) => (
  <View style={{ marginTop: isSmall ? 12 : 14 }}>
    <Text
      style={[
        styles.sectionTitle,
        {
          paddingHorizontal: isSmall ? 10 : 12,
          marginBottom: 8,
          color: colors.foreground,
          fontSize: isSmall ? 12 : 13,
        },
      ]}
    >
      {title}
    </Text>
    {children}
  </View>
);

const MenuGrid = ({
  items,
  colors,
  router,
  isSmall,
  wishCount,
}: {
  items: MenuItem[];
  colors: any;
  router: any;
  isSmall: boolean;
  wishCount: number;
}) => (
  <View
    style={{
      marginHorizontal: isSmall ? 10 : 12,
      gap: 7,
    }}
  >
    {items.map((item) => (
      <Pressable
        key={item.label}
        onPress={() => router.push(item.route as never)}
        style={({ pressed }) => [
          styles.menuItem,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
            paddingVertical: isSmall ? 10 : 12,
            paddingHorizontal: isSmall ? 11 : 14,
          },
        ]}
      >
        <View
          style={[
            styles.menuIcon,
            {
              backgroundColor: item.iconBg,
              width: isSmall ? 36 : 40,
              height: isSmall ? 36 : 40,
              borderRadius: isSmall ? 8 : 10,
            },
          ]}
        >
          <Feather
            name={item.icon}
            size={isSmall ? 16 : 18}
            color={item.iconColor}
          />
        </View>
        <Text
          style={{
            flex: 1,
            color: colors.foreground,
            fontSize: isSmall ? 12 : 14,
            fontWeight: "500",
          }}
        >
          {item.label}
        </Text>
        {item.badge === "wishlist" && wishCount > 0 && (
          <View
            style={[
              styles.wishlistBadge,
              { backgroundColor: item.iconColor },
            ]}
          >
            <Text
              style={[styles.wishlistBadgeText, { color: colors.primaryForeground }]}
            >
              {wishCount}
            </Text>
          </View>
        )}
        <Feather
          name="chevron-right"
          size={isSmall ? 16 : 18}
          color={colors.mutedForeground}
        />
      </Pressable>
    ))}
  </View>
);

const StatCard = ({
  icon,
  label,
  value,
  color,
  bgColor,
  borderColor,
  isSmall,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  borderColor: string;
  isSmall: boolean;
}) => (
  <View
    style={[
      styles.statCard,
      {
        backgroundColor: bgColor,
        borderColor: borderColor,
        padding: isSmall ? 10 : 12,
      },
    ]}
  >
    <View
      style={[
        styles.statIconWrapper,
        {
          width: isSmall ? 28 : 32,
          height: isSmall ? 28 : 32,
          borderRadius: 6,
          backgroundColor: withOpacity(color, 0.12),
        },
      ]}
    >
      <Feather name={icon} size={isSmall ? 14 : 16} color={color} />
    </View>
    <Text
      style={[
        styles.statValue,
        {
          color: color,
          fontSize: isSmall ? 14 : 16,
          fontWeight: "700",
        },
      ]}
    >
      {value}
    </Text>
    <Text
      style={[
        styles.statLabel,
        {
          fontSize: isSmall ? 10 : 11,
          color: withOpacity(color, 0.55),
          fontWeight: "500",
        },
      ]}
    >
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  accountHeader: {
    paddingHorizontal: IS_SMALL ? 12 : 14,
    paddingVertical: IS_SMALL ? 14 : 16,
    paddingTop: IS_SMALL ? 16 : 18,
    paddingBottom: IS_SMALL ? 14 : 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -(IS_SMALL ? 12 : 14),
    marginTop: 0,
    paddingLeft: IS_SMALL ? 12 : 14,
    paddingRight: IS_SMALL ? 12 : 14,
    marginBottom: 0,
  },
  accountHeaderTitle: {
    fontSize: IS_SMALL ? 16 : 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  profileCard: {
    padding: IS_SMALL ? 12 : 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
  },
  avatarLetter: {
    fontWeight: "700",
  },
  name: {
    fontWeight: "700",
  },
  email: {
    marginTop: 2,
    fontWeight: "400",
  },
  memberSince: {
    marginTop: 2,
    fontWeight: "400",
  },
  editBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  completionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  completionTitle: {
    fontWeight: "600",
  },
  completionSub: {
    marginTop: 3,
    fontWeight: "400",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  menuIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  supportTitle: {
    fontWeight: "600",
  },
  supportSub: {
    marginTop: 2,
    fontWeight: "400",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  logoutText: {
    fontWeight: "600",
  },
  footerVersion: {
    textAlign: "center",
    fontWeight: "400",
  },
  footerCopyright: {
    textAlign: "center",
    marginTop: 3,
    fontWeight: "400",
  },
  heading: {
    fontWeight: "700",
  },
  description: {
    fontWeight: "400",
    lineHeight: 18,
  },
  guestContainer: {
    alignItems: "center",
    gap: 16,
  },
  guestIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  guestDescription: {
    textAlign: "center",
  },
  progressBarContainer: {
    flex: 2,
    height: 5,
    borderRadius: 2.5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  statIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  statValue: {
    fontWeight: "700",
  },
  statLabel: {
    marginTop: 2,
  },
  supportIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextFlex: {
    flex: 1,
  },
  wishlistBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  wishlistBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  sectionTitle: {
    fontWeight: "700",
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
