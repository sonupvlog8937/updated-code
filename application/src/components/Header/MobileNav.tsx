import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAppContext } from "../../hooks/useAppContext";
import { useGlobalHeader } from "./GlobalHeaderContext";

const SCROLL_DELTA = 8;
const TOP_SAFE_ZONE = 80;

const MobileNav: React.FC = () => {
  const context = useAppContext();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const headerState = useGlobalHeader();

  const [isNavVisible, setIsNavVisible] = React.useState<boolean>(true);
  const lastScrollY = useRef<number>(0);
  const translateY = useRef(new Animated.Value(0)).current;

  const activeRoute = route?.name ?? "";
  const isFilterPage = activeRoute === "ProductList";

  React.useEffect(() => {
    context?.setisFilterBtnShow?.(isFilterPage);
  }, [context, isFilterPage]);

  React.useEffect(() => {
    setIsNavVisible(true);
    lastScrollY.current = 0;
  }, [activeRoute]);

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: isNavVisible ? 0 : 100,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isNavVisible, translateY]);

  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;

      if (currentY <= TOP_SAFE_ZONE) {
        setIsNavVisible(true);
        lastScrollY.current = currentY;
        return;
      }

      if (Math.abs(diff) >= SCROLL_DELTA) {
        setIsNavVisible(diff < 0);
        lastScrollY.current = currentY;
      }
    },
    []
  );

  const openFilters = () => {
    context?.setOpenFilter?.(true);
    context?.setOpenSearchPanel?.(false);
  };

  const navTo = (screen: string) => {
    context?.setOpenSearchPanel?.(false);
    navigation.navigate(screen);
  };

  const tabs = [
    { label: "Home", route: "Home", icon: "🏠" },
    {
      label: "Cart",
      route: "Cart",
      icon: "🛒",
      badge: context?.cartData?.length || 0,
    },
    { label: "Wishlist", route: "MyList", icon: "♡" },
    { label: "Orders", route: "MyOrders", icon: "🛍️" },
    { label: "Account", route: "MyAccount", icon: "👤" },
  ];

  return (
    <>
      {isFilterPage && (
        <Animated.View
          style={[
            styles.filterFabWrap,
            {
              opacity: isNavVisible ? 1 : 0,
              bottom: isNavVisible ? 72 : 48,
            },
          ]}
          pointerEvents={isNavVisible ? "auto" : "none"}
        >
          <TouchableOpacity
            style={styles.filterFab}
            onPress={openFilters}
            activeOpacity={0.85}
          >
            <Text style={styles.filterFabText}>⚙  Filter</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Animated.View
        style={[styles.mobileNav, { transform: [{ translateY }] }]}
      >
        {tabs.map((tab) => {
          const isActive = activeRoute === tab.route;
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tabItem}
              onPress={() => navTo(tab.route)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Text
                  style={[
                    styles.tabIcon,
                    isActive && styles.tabIconActive,
                  ]}
                >
                  {tab.icon}
                </Text>
                {tab.badge != null && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </>
  );
};

export default MobileNav;

const styles = StyleSheet.create({
  mobileNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 4,
    paddingBottom: Platform.OS === "ios" ? 8 : 2,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    zIndex: 51,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    minWidth: 44,
  },
  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    fontSize: 20,
    color: "#374151",
  },
  tabIconActive: {
    color: "#f97316",
  },
  tabLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "400",
  },
  tabLabelActive: {
    color: "#f97316",
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  filterFabWrap: {
    position: "absolute",
    alignSelf: "center",
    left: "50%",
    zIndex: 52,
  },
  filterFab: {
    backgroundColor: "#111",
    borderRadius: 99,
    paddingHorizontal: 20,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  filterFabText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
