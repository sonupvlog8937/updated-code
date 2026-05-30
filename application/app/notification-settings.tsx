import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { fetchDataFromApi, putData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

interface Settings {
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  priceAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const DEFAULTS: Settings = {
  orderUpdates: true,
  promotions: true,
  newProducts: false,
  priceAlerts: true,
  emailNotifications: true,
  smsNotifications: false,
};

const ITEMS: { key: keyof Settings; label: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "orderUpdates", label: "Order Updates", desc: "Status of your orders", icon: "package" },
  { key: "promotions", label: "Promotions & Offers", desc: "Deals & coupons", icon: "tag" },
  { key: "newProducts", label: "New Products", desc: "Latest arrivals", icon: "box" },
  { key: "priceAlerts", label: "Price Alerts", desc: "Wishlist price drops", icon: "trending-down" },
  { key: "emailNotifications", label: "Email", desc: "Updates via email", icon: "mail" },
  { key: "smsNotifications", label: "SMS", desc: "Text messages", icon: "message-square" },
];

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataFromApi("/api/notification-settings")
      .then((res) => {
        if (res?.data) setS({ ...DEFAULTS, ...res.data });
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (k: keyof Settings) => {
    const next = { ...s, [k]: !s[k] };
    setS(next);
    const res = await putData("/api/notification-settings", next);
    if (res?.error !== false) {
      showToast("info", "Settings saved locally");
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {ITEMS.map((it, i) => (
          <View
            key={it.key}
            style={[
              styles.row,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: i === ITEMS.length - 1 ? 0 : 1,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.accent }]}>
              <Feather name={it.icon} size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                {it.label}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                {it.desc}
              </Text>
            </View>
            <Switch
              value={s[it.key]}
              onValueChange={() => toggle(it.key)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
