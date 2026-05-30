import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useTabsVisibility } from "@/src/context/ScrollVisibilityContext";
import { useAppSelector } from "@/src/store";

function CartIcon({ color, size }: { color: string; size: number }) {
  const colors = useColors();
  const cartCount = useAppSelector((s) => s.app.cartData?.length || 0);
  return (
    <View>
      <Feather name="shopping-bag" size={size} color={color} />
      {cartCount > 0 ? (
        <View
          style={[styles.badge, { backgroundColor: "#ef4444" }]}
          pointerEvents="none"
        >
          <Text style={styles.badgeText}>
            {cartCount > 9 ? "9+" : cartCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function OrdersIcon({ color, size }: { color: string; size: number }) {
  return (
    <Feather name="list" size={size} color={color} />
  );
}

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { isTabsVisible } = useTabsVisibility();

  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(isTabsVisible ? 0 : 100, { duration: 300 });
  }, [isTabsVisible, translateY]);

  const animatedTabBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ff6b2b",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: "Inter_700Bold",
          fontSize: 9,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: [
          {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.background,
            borderTopWidth: 1,
            borderTopColor: "#f0f0f0",
            elevation: 0,
            height: isWeb ? 70 : 65,
            paddingBottom: isIOS ? 18 : 6,
            paddingTop: 6,
            paddingHorizontal: 0,
            overflow: "hidden",
          },
          animatedTabBarStyle,
        ] as any,
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <OrdersIcon color={color} size={18} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <CartIcon color={color} size={18} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "Inter_700Bold",
  },
});
