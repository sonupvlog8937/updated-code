import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

interface QuickMenuProps {
  onClose: () => void;
  notifCount: number;
}

interface QuickMenuItem {
  key: string;
  label: string;
  desc: string;
  icon: string;
  ic: keyof typeof ICON_BG_COLORS;
  action?: () => void;
  href?: string;
  download?: boolean;
  badge?: number | null;
}

const ICON_BG_COLORS = {
  "ic-seller": ["#f093fb", "#f5576c"],
  "ic-app": ["#667eea", "#764ba2"],
  "ic-offers": ["#4facfe", "#00f2fe"],
  "ic-notif": ["#43e97b", "#38f9d7"],
  "ic-settings": ["#fa709a", "#fee140"],
} as const;

const QuickMenu: React.FC<QuickMenuProps> = ({ onClose, notifCount }) => {
  const navigation = useNavigation<any>();

  const go = (path: string) => {
    navigation.navigate(path);
    onClose();
  };

  const items: QuickMenuItem[] = [
    {
      key: "seller",
      label: "Become a Seller",
      desc: "List & sell your products",
      icon: "🏪",
      ic: "ic-seller",
      action: () => go("BecomeSeller"),
    },
    {
      key: "app",
      label: "Download App",
      desc: "Faster mobile experience",
      icon: "📲",
      ic: "ic-app",
      href: "/699b044d39ee2939e558446e.apk",
      download: true,
    },
    {
      key: "offers",
      label: "View Offers",
      desc: "Deals, coupons & flash sales",
      icon: "🎁",
      ic: "ic-offers",
      action: () => go("Offers"),
    },
    {
      key: "notif",
      label: "Notifications",
      desc: notifCount > 0 ? "new messages" : "Stay updated",
      icon: "🔔",
      ic: "ic-notif",
      badge: notifCount > 0 ? notifCount : null,
      action: () => go("Notifications"),
    },
    {
      key: "settings",
      label: "Settings",
      desc: "Account & preferences",
      icon: "⚙️",
      ic: "ic-settings",
      action: () => go("Settings"),
    },
  ];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Panel */}
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.head}>
          <Text style={styles.headLabel}>Quick Actions</Text>
          <TouchableOpacity style={styles.headClose} onPress={onClose}>
            <Text style={styles.headCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <ScrollView bounces={false}>
          {items.map((item) => {
            const [colorA, colorB] = ICON_BG_COLORS[item.ic];

            const handlePress = () => {
              if (item.href) {
                Linking.openURL(item.href).catch(() => {});
                onClose();
              } else {
                item.action?.();
              }
            };

            return (
              <React.Fragment key={item.key}>
                {item.key === "settings" && <View style={styles.sep} />}

                <TouchableOpacity
                  style={styles.row}
                  onPress={handlePress}
                  activeOpacity={0.7}
                >
                  {/* Icon box */}
                  <View
                    style={[styles.iconBox, { backgroundColor: colorA }]}
                  >
                    <Text style={styles.iconEmoji}>{item.icon}</Text>
                  </View>

                  <View style={styles.textBox}>
                    <Text style={styles.itemName}>{item.label}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                  </View>

                  {item.badge != null && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}

                  <Text style={styles.chev}>›</Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.foot}>
          <Text style={styles.footVer}>Zeedaddy v2.0 · © 2026</Text>
          <TouchableOpacity
            style={styles.dlChip}
            onPress={() =>
              Linking.openURL("/699b044d39ee2939e558446e.apk")
            }
          >
            <Text style={styles.dlChipText}>📲 Get App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.04)",
    zIndex: 1200,
  },
  panel: {
    position: "absolute",
    top: Platform.OS === "ios" ? 74 : 66,
    right: 16,
    left: Dimensions.get("window").width < 600 ? 8 : undefined,
    width: Dimensions.get("window").width < 600 ? undefined : 296,
    backgroundColor: "#fff",
    borderRadius: 20,
    zIndex: 1201,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 12,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  headLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(0,0,0,0.32)",
  },
  headClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  headCloseText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 19,
  },
  textBox: {
    flex: 1,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#111",
    lineHeight: 18,
  },
  itemDesc: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    marginTop: 1,
    lineHeight: 15,
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  chev: {
    color: "rgba(0,0,0,0.18)",
    fontSize: 20,
  },
  sep: {
    height: 1,
    backgroundColor: "#f1f3f5",
    marginVertical: 5,
  },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 13,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    gap: 8,
  },
  footVer: {
    fontSize: 10.5,
    color: "rgba(0,0,0,0.28)",
    flex: 1,
  },
  dlChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: "#f3f4f6",
    gap: 5,
  },
  dlChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
  },
});

export default QuickMenu;
