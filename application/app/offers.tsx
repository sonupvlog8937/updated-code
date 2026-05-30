import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/src/components/EmptyState";
import { fetchDataFromApi } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType?: "PERCENTAGE" | "FLAT";
  discountValue?: number;
  minOrderAmount?: number;
  expiryDate?: string;
}

const DEMO: Coupon[] = [
  {
    _id: "1",
    code: "WELCOME10",
    description: "10% off your first order",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 499,
  },
  {
    _id: "2",
    code: "FLAT100",
    description: "Flat ₹100 off on orders above ₹999",
    discountType: "FLAT",
    discountValue: 100,
    minOrderAmount: 999,
  },
  {
    _id: "3",
    code: "FREESHIP",
    description: "Free shipping on all orders",
    discountType: "FLAT",
    discountValue: 49,
  },
];

export default function OffersScreen() {
  const colors = useColors();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataFromApi("/api/coupon/active")
      .then((res) => {
        const list = res?.data || res?.coupons || [];
        setCoupons(list.length ? list : DEMO);
      })
      .catch(() => setCoupons(DEMO))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!coupons.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="tag"
          title="No offers available"
          description="Check back soon for new deals"
        />
      </View>
    );
  }

  const copy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    showToast("success", `Copied ${code}`);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      {coupons.map((c) => (
        <View
          key={c._id}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.tagIcon, { backgroundColor: colors.accent }]}>
            <Feather name="tag" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.codeRow}>
              <View
                style={[
                  styles.codePill,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    letterSpacing: 0.5,
                  }}
                >
                  {c.code}
                </Text>
              </View>
              {c.discountType && c.discountValue ? (
                <Text
                  style={{
                    color: colors.success,
                    fontSize: 12,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  {c.discountType === "PERCENTAGE"
                    ? `${c.discountValue}% OFF`
                    : `₹${c.discountValue} OFF`}
                </Text>
              ) : null}
            </View>
            {c.description ? (
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 13,
                  marginTop: 6,
                  lineHeight: 18,
                }}
              >
                {c.description}
              </Text>
            ) : null}
            {c.minOrderAmount ? (
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                Min order ₹{c.minOrderAmount}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => copy(c.code)}
            style={[styles.copyBtn, { borderColor: colors.primary }]}
          >
            <Feather name="copy" size={14} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontFamily: "Inter_700Bold",
              }}
            >
              Copy
            </Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  tagIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  codePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});
