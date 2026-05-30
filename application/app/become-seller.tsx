import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Field } from "@/app/login";
import { useColors } from "@/hooks/useColors";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { showToast } from "@/src/utils/toast";

const PERKS = [
  { icon: "trending-up", title: "Reach more buyers", desc: "Tap into thousands of daily shoppers" },
  { icon: "package", title: "Easy logistics", desc: "We handle pickup, packing & delivery" },
  { icon: "credit-card", title: "Fast payouts", desc: "Get paid every 7 days, hassle-free" },
  { icon: "headphones", title: "24x7 support", desc: "Dedicated seller support team" },
];

export default function BecomeSellerScreen() {
  const colors = useColors();
  const [businessName, setBusinessName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!businessName || !contact) {
      showToast("error", "Please fill required fields");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast("success", "Application submitted! We'll be in touch.");
      setBusinessName("");
      setContact("");
      setCity("");
      setLoading(false);
    }, 800);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <LinearGradient
          colors={[colors.primary, "#ff7676"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Sell on Hope Shop</Text>
          <Text style={styles.heroSub}>
            Grow your business with India's friendliest marketplace
          </Text>
        </LinearGradient>

        <View style={{ padding: 16 }}>
          <Text style={[styles.section, { color: colors.foreground }]}>
            Why sellers love us
          </Text>
          <View style={{ gap: 10 }}>
            {PERKS.map((p) => (
              <View
                key={p.title}
                style={[
                  styles.perk,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[styles.perkIcon, { backgroundColor: colors.accent }]}
                >
                  <Feather
                    name={p.icon as never}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_700Bold",
                      fontSize: 14,
                    }}
                  >
                    {p.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {p.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={[styles.section, { color: colors.foreground, marginTop: 24 }]}>
            Get started
          </Text>
          <View style={{ gap: 12 }}>
            <Field
              icon="briefcase"
              placeholder="Business name"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <Field
              icon="phone"
              placeholder="Contact number"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />
            <Field
              icon="map-pin"
              placeholder="City"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <PrimaryButton
            title="Apply Now"
            onPress={onSubmit}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 16 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 24, paddingVertical: 36 },
  heroTitle: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold" },
  heroSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 6,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  section: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 10 },
  perk: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
