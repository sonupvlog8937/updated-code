import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/src/components/EmptyState";
import { useAppSelector } from "@/src/store";
import { fetchDataFromApi, putData } from "@/src/utils/api";

interface Notif {
  _id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

export default function NotificationsScreen() {
  const colors = useColors();
  const isLogin = useAppSelector((s) => s.app.isLogin);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchDataFromApi("/api/notifications");
      setItems(res?.data || res?.notifications || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLogin) load();
    else setLoading(false);
  }, [isLogin, load]);

  const markAll = async () => {
    await putData("/api/notifications/read-all", {});
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (!isLogin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="bell"
          title="Sign in to view notifications"
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="bell"
          title="No notifications"
          description="When you have updates, they'll appear here"
        />
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 }}>
        <Pressable onPress={markAll}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
            Mark all read
          </Text>
        </Pressable>
      </View>
      {items.map((n) => (
        <View
          key={n._id}
          style={[
            styles.row,
            {
              backgroundColor: n.isRead ? colors.card : colors.accent,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: colors.primary }]}>
            <Feather name="bell" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: n.isRead ? "Inter_500Medium" : "Inter_700Bold",
                fontSize: 14,
              }}
              numberOfLines={2}
            >
              {n.title || "Notification"}
            </Text>
            {n.message ? (
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 12,
                  marginTop: 4,
                  lineHeight: 17,
                }}
              >
                {n.message}
              </Text>
            ) : null}
            {n.createdAt ? (
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 11,
                  marginTop: 6,
                }}
              >
                {new Date(n.createdAt).toLocaleString()}
              </Text>
            ) : null}
          </View>
          {!n.isRead && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
