import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={[styles.h1, { color: colors.foreground }]}>
        Privacy Policy
      </Text>
      <Text style={[styles.updated, { color: colors.mutedForeground }]}>
        Last updated: April 2026
      </Text>
      {SECTIONS.map((s) => (
        <View key={s.title} style={{ marginTop: 22 }}>
          <Text style={[styles.h2, { color: colors.foreground }]}>{s.title}</Text>
          <Text style={[styles.p, { color: colors.mutedForeground }]}>
            {s.body}
          </Text>
        </View>
      ))}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const SECTIONS = [
  {
    title: "1. Information we collect",
    body: "We collect personal information you provide while creating an account or placing an order, including your name, email address, phone number, shipping address, and payment details. We also collect device information and app usage data to improve your experience.",
  },
  {
    title: "2. How we use your information",
    body: "Your information is used to process orders, deliver products, send notifications about your purchases, personalize recommendations, and provide customer support. We may also use it for security and fraud prevention.",
  },
  {
    title: "3. Sharing of information",
    body: "We share information with delivery partners and payment processors to fulfill your orders. We do not sell your personal data to third parties. We may disclose information when required by law.",
  },
  {
    title: "4. Data security",
    body: "We use industry-standard security measures including encryption in transit and at rest. While we strive to protect your information, no method of transmission over the internet is 100% secure.",
  },
  {
    title: "5. Your rights",
    body: "You can access, update, or delete your account information at any time from the Settings screen. To request a complete data export or full account deletion, contact our support team.",
  },
  {
    title: "6. Cookies & tracking",
    body: "Our app may use analytics tools to understand how users interact with the platform. You can opt out of personalized recommendations from the notification settings screen.",
  },
  {
    title: "7. Contact us",
    body: "For privacy-related questions, write to support@hopeshop.example. We aim to respond within 48 hours.",
  },
];

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontFamily: "Inter_700Bold" },
  updated: { fontSize: 12, marginTop: 4, fontFamily: "Inter_500Medium" },
  h2: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6 },
  p: { fontSize: 13, lineHeight: 21, fontFamily: "Inter_400Regular" },
});
