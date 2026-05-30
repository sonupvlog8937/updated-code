/**
 * Refactored Header.tsx → HeaderMain.tsx
 * Updated to use GlobalHeaderContext for state management
 */

import React, {
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useAppContext } from "../../hooks/useAppContext";
import { useGlobalHeader } from "./GlobalHeaderContext";
import { fetchDataFromApi } from "../../utils/api";
import QuickMenu from "./QuickMenu";
import { useAppDispatch } from "@/src/store";
import { logoutUser } from "@/src/store/appSlice";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HeaderMain: React.FC = () => {
  const [anchorVisible, setAnchorVisible] = useState<boolean>(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const context = useAppContext();
  const navigation = useNavigation<any>();
  const headerState = useGlobalHeader();
  const dispatch = useAppDispatch();

  const notifCount = 3;
  const isDesktop = (context?.windowWidth ?? SCREEN_WIDTH) > 992;

  // Load logo from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("logo").then((val) => {
      if (val) {
        setLogoUri(val);
        return;
      }
      fetchDataFromApi("/api/logo").then((res: any) => {
        const logo = res?.logo?.[0]?.logo;
        if (logo) {
          AsyncStorage.setItem("logo", logo);
          setLogoUri(logo);
        }
      });
    });
  }, []);

  const logout = useCallback(async () => {
    setAnchorVisible(false);
    try {
      await dispatch(logoutUser()).unwrap();
      navigation.navigate("Home");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [dispatch, navigation]);

  return (
    <>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={headerStyles.header}>
        {/* ── Mobile: Menu button ── */}
        {!isDesktop && (
          <TouchableOpacity
            style={headerStyles.iconBtn}
            onPress={() => headerState.setIsOpenCatPanel(true)}
          >
            <Text style={headerStyles.iconBtnText}>☰</Text>
          </TouchableOpacity>
        )}

        {/* ── Logo ── */}
        {!(headerState.showSearchBar && !isDesktop) && (
          <TouchableOpacity
            style={[
              headerStyles.logoContainer,
              !isDesktop && { flex: 1, paddingHorizontal: 8 },
            ]}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.85}
          >
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={headerStyles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <View style={headerStyles.logoPlaceholderRow}>
                <View style={headerStyles.logoIconBox}>
                  <Text style={headerStyles.logoLetter}>Z</Text>
                </View>
                <Text style={headerStyles.logoText}>Zeedaddy</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ── Mobile: Inline Expandable Search Bar ── */}
        {headerState.showSearchBar && !isDesktop && (
          <View style={headerStyles.searchRow}>
            <View style={{ flex: 1 }}>
              {/* <Search onSearchComplete={() => setShowSearchBar(false)} autoFocus /> */}
              <Text style={{ color: "#aaa" }}>{/* Replace with <Search /> */}</Text>
            </View>
            <TouchableOpacity
              style={headerStyles.closeSearchBtn}
              onPress={() => headerState.setShowSearchBar(false)}
            >
              <Text style={headerStyles.closeSearchText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Desktop: Category Button ── */}
        {isDesktop && (
          <TouchableOpacity
            style={headerStyles.catBtn}
            onPress={() => headerState.setIsOpenCatPanel(true)}
          >
            <Text style={headerStyles.catBtnText}>☰  Shop By Categories  ∨</Text>
          </TouchableOpacity>
        )}

        {/* ── Desktop: Search Bar ── */}
        {isDesktop && (
          <View style={headerStyles.desktopSearchWrap}>
            {/* <Search /> */}
            <Text style={{ color: "#aaa" }}>{/* Replace with <Search /> */}</Text>
          </View>
        )}

        {/* ── Right Side Actions ── */}
        {!(headerState.showSearchBar && !isDesktop) && (
          <View style={headerStyles.rightActions}>
            {/* Auth Links */}
            {!context?.isLogin && isDesktop && (
              <View style={headerStyles.authRow}>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={headerStyles.authLink}>Login</Text>
                </TouchableOpacity>
                <Text style={headerStyles.authDivider}> | </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                  <Text style={headerStyles.authLink}>Register</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Account Dropdown */}
            {context?.isLogin && isDesktop && (
              <View>
                <TouchableOpacity
                  style={headerStyles.accountRow}
                  onPress={() => setAnchorVisible(true)}
                >
                  <View style={headerStyles.avatarBtn}>
                    <Text style={headerStyles.avatarIcon}>👤</Text>
                  </View>
                  <View>
                    <Text style={headerStyles.accountName}>
                      {context?.userData?.name}
                    </Text>
                    <Text style={headerStyles.accountEmail}>
                      {context?.userData?.email}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Account Dropdown Modal */}
                <Modal
                  transparent
                  animationType="fade"
                  visible={anchorVisible}
                  onRequestClose={() => setAnchorVisible(false)}
                >
                  <TouchableOpacity
                    style={headerStyles.menuBackdrop}
                    activeOpacity={1}
                    onPress={() => setAnchorVisible(false)}
                  />
                  <View style={headerStyles.dropdownMenu}>
                    {[
                      { label: "My Account", icon: "👤", route: "MyAccount" },
                      { label: "Address", icon: "📍", route: "Address" },
                      { label: "Orders", icon: "🛍️", route: "MyOrders" },
                      { label: "My List", icon: "❤️", route: "MyList" },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.route}
                        style={headerStyles.menuItem}
                        onPress={() => {
                          setAnchorVisible(false);
                          navigation.navigate(item.route);
                        }}
                      >
                        <Text style={headerStyles.menuIcon}>{item.icon}</Text>
                        <Text style={headerStyles.menuLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={headerStyles.menuItem}
                      onPress={logout}
                    >
                      <Text style={headerStyles.menuIcon}>🚪</Text>
                      <Text style={headerStyles.menuLabel}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                </Modal>
              </View>
            )}

            {/* Wishlist */}
            {isDesktop && (
              <TouchableOpacity
                style={headerStyles.iconBtn}
                onPress={() => navigation.navigate("MyList")}
              >
                <Text style={headerStyles.iconBtnText}>♡</Text>
                {(context?.myListData?.length ?? 0) > 0 && (
                  <View style={headerStyles.badge}>
                    <Text style={headerStyles.badgeText}>
                      {context?.myListData?.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Cart */}
            {isDesktop && (
              <TouchableOpacity
                style={headerStyles.iconBtn}
                onPress={() => navigation.navigate("Cart")}
              >
                <Text style={headerStyles.iconBtnText}>🛒</Text>
                {(context?.cartData?.length ?? 0) > 0 && (
                  <View style={headerStyles.badge}>
                    <Text style={headerStyles.badgeText}>
                      {context?.cartData?.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Search Icon */}
            <TouchableOpacity
              style={headerStyles.searchIconBtn}
              onPress={() => {
                if (isDesktop) {
                  headerState.setShowSearchBar(true);
                } else {
                  headerState.setShowSearchBar(true);
                }
              }}
            >
              <Text style={headerStyles.iconBtnText}>🔍</Text>
            </TouchableOpacity>

            {/* Three-dot Menu */}
            <TouchableOpacity
              style={[
                headerStyles.qmTrigger,
                headerState.quickMenuOpen && headerStyles.qmTriggerOpen,
              ]}
              onPress={() => headerState.setQuickMenuOpen(!headerState.quickMenuOpen)}
              accessibilityLabel="More options"
            >
              <View style={qmStyles.dots}>
                <View
                  style={[
                    qmStyles.dot,
                    headerState.quickMenuOpen && qmStyles.dotWhite,
                  ]}
                />
                <View
                  style={[
                    qmStyles.dot,
                    headerState.quickMenuOpen && qmStyles.dotWhite,
                  ]}
                />
                <View
                  style={[
                    qmStyles.dot,
                    headerState.quickMenuOpen && qmStyles.dotWhite,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Menu Modal */}
      {headerState.quickMenuOpen && (
        <QuickMenu
          onClose={() => headerState.setQuickMenuOpen(false)}
          notifCount={notifCount}
        />
      )}

      {/* After Header Spacer */}
      <View style={headerStyles.afterHeader} />
    </>
  );
};

export default HeaderMain;

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const qmStyles = StyleSheet.create({
  dots: {
    alignItems: "center",
    gap: 3.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#222",
  },
  dotWhite: {
    backgroundColor: "#fff",
  },
});

const headerStyles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 101,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    justifyContent: "center",
  },
  logoImage: {
    height: 40,
    width: 160,
  },
  logoPlaceholderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeSearchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  closeSearchText: {
    fontSize: 16,
    fontWeight: "700",
  },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    marginHorizontal: 8,
  },
  catBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  desktopSearchWrap: {
    flex: 1,
    marginHorizontal: 8,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  authRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authLink: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
  },
  authDivider: {
    fontSize: 15,
    color: "#aaa",
    marginHorizontal: 4,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: {
    fontSize: 17,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(0,0,0,0.6)",
    textTransform: "capitalize",
  },
  accountEmail: {
    fontSize: 13,
    color: "rgba(0,0,0,0.6)",
    textTransform: "capitalize",
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "ios" ? 74 : 66,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
    zIndex: 999,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  menuIcon: {
    fontSize: 16,
  },
  menuLabel: {
    fontSize: 14,
    color: "#111",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    position: "relative",
  },
  iconBtnText: {
    fontSize: 18,
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  qmTrigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.11)",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  qmTriggerOpen: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  afterHeader: {
    height: Platform.OS === "ios" ? 65 : 65,
  },
});
