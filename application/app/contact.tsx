import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { showToast } from "@/src/utils/toast";

const { width } = Dimensions.get("window");
const IS_SMALL = width < 375;

// ─── Theme ────────────────────────────────────────────────────────
const THEME = {
  gradientStart: "#667eea",
  gradientMid: "#764ba2",
  gradientEnd: "#f093fb",
  cardBg: "rgba(255,255,255,0.12)",
  cardBorder: "rgba(255,255,255,0.2)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.75)",
  accent: "#feca57",
};

// ─── Contact Info ─────────────────────────────────────────────────
const CONTACT_INFO = {
  email: "sonupvlog8937@gmail.com",
  phone: "+91 8969737537",
  whatsapp: "+91 8969737537",
  address: "Paibigha, Makhdumpur, Jehnabad, Bihar 804424, India",
  website: "https://zeedaddy.in",
  businessHours: "Mon - Sat: 9:00 AM - 6:00 PM",
};

// ─── Social Links ─────────────────────────────────────────────────
const SOCIAL_LINKS = [
  {
    icon: "instagram" as keyof typeof Feather.glyphMap,
    label: "Instagram",
    url: "https://www.instagram.com/zeedaddy15?utm_source=qr&igsh=MXFvZnRyemk2bXJxNA==",
    colors: ["#f953c6", "#b91d73"] as [string, string],
  },
  {
    icon: "facebook" as keyof typeof Feather.glyphMap,
    label: "Facebook",
    url: "https://www.facebook.com/share/18omUEzwUR/",
    colors: ["#2193b0", "#1565c0"] as [string, string],
  },
  {
    icon: "youtube" as keyof typeof Feather.glyphMap,
    label: "YouTube",
    url: "https://www.youtube.com/@zeedaddy",
    colors: ["#ff416c", "#c0392b"] as [string, string],
  },
  {
    icon: "x" as keyof typeof Feather.glyphMap,   // ← "twitter" hata ke "x" (Feather v0.27+ mein available hai)
    label: "X",
    url: "https://x.com/zeedaddy15",
    colors: ["#000000", "#333333"] as [string, string],
  },
  {
    icon: "linkedin" as keyof typeof Feather.glyphMap,
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/zee-daddy-046732392?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    colors: ["#0077b5", "#004c7f"] as [string, string],
  },
  {
    icon: "message-circle" as keyof typeof Feather.glyphMap,  // ← WhatsApp Channel
    label: "WA Channel",
    url: "https://whatsapp.com/channel/0029Vb8db7hIXnlpJPX3hf43",  // ← apna link daal do
    colors: ["#25d366", "#128c7e"] as [string, string],
  },
];

// ─── Contact Card ─────────────────────────────────────────────────
interface ContactCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay?: number;
  gradientColors?: [string, string];
}

const ContactCard: React.FC<ContactCardProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  delay = 0,
  gradientColors = ["#ff6b6b", "#feca57"],
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.contactCard,
          pressed && styles.contactCardPressed,
        ]}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Feather name={icon} size={20} color="#fff" />
          </LinearGradient>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={THEME.textSecondary} />
      </Pressable>
    </Animated.View>
  );
};

// ─── Social Button ────────────────────────────────────────────────
interface SocialButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  colors: [string, string];
  onPress: () => void;
  delay?: number;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  label,
  colors,
  onPress,
  delay = 0,
}) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.socialButtonWrapper}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.socialButton,
          pressed && styles.socialButtonPressed,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.socialGradient}
        >
          <Feather name={icon} size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.socialLabel} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────
export default function ContactScreen() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL(`mailto:${CONTACT_INFO.email}`).catch(() =>
      showToast("error", "❌ Could not open email app"),
    );
  };

  const handlePhone = () => {
    Linking.openURL(`tel:${CONTACT_INFO.phone}`).catch(() =>
      showToast("error", "❌ Could not open phone app"),
    );
  };

  const handleWhatsApp = () => {
    const message = "Hi Zeedaddy, I need support with...";
    const whatsappNumber = CONTACT_INFO.whatsapp.replace(/[^0-9]/g, "");
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() =>
      showToast("error", "❌ WhatsApp is not installed"),
    );
  };

  const handleWebsite = () => {
    Linking.openURL(CONTACT_INFO.website).catch(() =>
      showToast("error", "❌ Could not open website"),
    );
  };

  const handleAddress = () => {
    const addressEncoded = encodeURIComponent(CONTACT_INFO.address);
    const url =
      Platform.select({
        ios: `maps:0,0?q=${addressEncoded}`,
        android: `geo:0,0?q=${addressEncoded}`,
      }) || `https://www.google.com/maps/search/${addressEncoded}`;
    Linking.openURL(url).catch(() =>
      showToast("error", "❌ Could not open maps"),
    );
  };

  const handleSocial = (url: string, label: string) => {
    Linking.openURL(url).catch(() =>
      showToast("error", `❌ Could not open ${label}`),
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Hero Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={styles.heroSection}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#ff6b6b", "#feca57"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Feather name="shopping-bag" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Zeedaddy</Text>
            <Text style={styles.heroSubtitle}>
              We're here to help! Get in touch with us
            </Text>
          </Animated.View>

          {/* Contact Methods */}
          {/* <View style={styles.section}>
            <ContactCard
              icon="mail"
              title="Email Us"
              subtitle={CONTACT_INFO.email}
              onPress={handleEmail}
              delay={200}
            />
            <ContactCard
              icon="phone"
              title="Call Us"
              subtitle={CONTACT_INFO.phone}
              onPress={handlePhone}
              delay={300}
            />
            <ContactCard
              icon="message-circle"
              title="WhatsApp"
              subtitle={CONTACT_INFO.whatsapp}
              onPress={handleWhatsApp}
              delay={400}
              gradientColors={["#25d366", "#128c7e"]}
            />
            <ContactCard
              icon="globe"
              title="Visit Website"
              subtitle={CONTACT_INFO.website}
              onPress={handleWebsite}
              delay={500}
              gradientColors={["#667eea", "#764ba2"]}
            />
            <ContactCard
              icon="map-pin"
              title="Office Address"
              subtitle={CONTACT_INFO.address}
              onPress={handleAddress}
              delay={600}
              gradientColors={["#f7971e", "#ffd200"]}
            />
          </View> */}

          {/* Social Media */}
          {/* <Animated.View
            entering={FadeInDown.delay(650).duration(400)}
            style={styles.sectionHeader}
          >
            <Feather
              name="share-2"
              size={16}
              color={THEME.accent}
              style={styles.sectionHeaderIcon}
            />
            <Text style={styles.sectionTitle}>Follow Us</Text>
          </Animated.View> */}

          {/* <View style={styles.socialGrid}>
            {SOCIAL_LINKS.map((social, index) => (
              <SocialButton
                key={social.label}
                icon={social.icon}
                label={social.label}
                colors={social.colors}
                onPress={() => handleSocial(social.url, social.label)}
                delay={700 + index * 80}
              />
            ))}
          </View> */}

          {/* Business Hours */}
          <Animated.View
            entering={FadeInDown.delay(1100).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather
                name="mail"
                size={20}
                color={THEME.accent}
                style={styles.infoHeaderIcon}
              />
              <Text onPress={handleEmail} style={styles.infoTitle}>Email Us</Text>
            </View>
            <Text onPress={handleEmail} style={styles.infoText}>{CONTACT_INFO.email}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(1100).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather
                name="phone"
                size={20}
                color={THEME.accent}
                style={styles.infoHeaderIcon}
              />
              <Text onPress={handlePhone} style={styles.infoTitle}>Call Us</Text>
            </View>
            <Text onPress={handlePhone} style={styles.infoText}>{CONTACT_INFO.phone}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(1100).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather
                name="message-circle"
                size={20}
                color={THEME.accent}
                style={styles.infoHeaderIcon}
              />
              <Text onPress={handleWhatsApp} style={styles.infoTitle}>WhatsApp</Text>
            </View>
            <Text onPress={handleWhatsApp} style={styles.infoText}>{CONTACT_INFO.whatsapp}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(1100).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather
                name="globe"
                size={20}
                color={THEME.accent}
                style={styles.infoHeaderIcon}
              />
              <Text onPress={handleWebsite} style={styles.infoTitle}>Visit Website</Text>
            </View>
            <Text onPress={handleWebsite} style={styles.infoText}>{CONTACT_INFO.website}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(1100).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather
                name="map-pin"
                size={20}
                color={THEME.accent}
                style={styles.infoHeaderIcon}
              />
              <Text onPress={handleAddress} style={styles.infoTitle}>Office Address</Text>
            </View>
            <Text onPress={handleAddress} style={styles.infoText}>{CONTACT_INFO.address}</Text>
          </Animated.View>

          {/* <Animated.View
            entering={FadeInDown.delay(650).duration(400)}
            style={styles.sectionHeader}
          >
            <Feather
              name="share-2"
              size={16}
              color={THEME.accent}
              style={styles.sectionHeaderIcon}
            />
            <Text style={styles.sectionTitle}>Follow Us</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(1100).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
            {SOCIAL_LINKS.map((social, index) => (
              <SocialButton
                key={social.label}
                icon={social.icon}
                label={social.label}
                colors={social.colors}
                onPress={() => handleSocial(social.url, social.label)}
                delay={700 + index * 80}
              />
            ))}
          </View>
            <Text onPress={handleAddress} style={styles.infoText}>{CONTACT_INFO.address}</Text>
          </Animated.View> */}

          <Animated.View
            entering={FadeInDown.delay(1100).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather
                name="clock"
                size={20}
                color={THEME.accent}
                style={styles.infoHeaderIcon}
              />
              <Text style={styles.infoTitle}>Business Hours</Text>
            </View>
            <Text style={styles.infoText}>{CONTACT_INFO.businessHours}</Text>
            <Text style={styles.infoSubtext}>Sunday: Closed</Text>
          </Animated.View>

          {/* Quick Support */}
          <Animated.View
            entering={FadeInDown.delay(1200).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather
                name="info"
                size={20}
                color={THEME.accent}
                style={styles.infoHeaderIcon}
              />
              <Text style={styles.infoTitle}>Quick Support</Text>
            </View>
            <Text style={styles.infoText}>
              For urgent queries, WhatsApp us for instant support. We typically
              respond within 30 minutes during business hours.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
// NOTE: `gap` was removed everywhere and replaced with explicit
// margin* props. The `gap` flexbox property is unreliable in
// production/release builds (Hermes) on several React Native /
// Expo versions — it works fine in dev client / Expo Go but
// silently breaks (collapses to 0 or breaks row layout) in the
// signed production APK. Margins are 100% safe across all builds.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // ── Hero ──
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 8,
  },
  logoContainer: {
    marginBottom: 14,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: IS_SMALL ? 26 : 28,
    fontFamily: "Inter_700Bold",
    color: THEME.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: IS_SMALL ? 13 : 14,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
  },

  // ── Contact Cards ──
  section: {
    marginBottom: 24,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 68,
    marginBottom: 10, // replaces section's old `gap: 10`
  },
  contactCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 44,
    height: 44,
    flexShrink: 0,
    marginRight: 12, // replaces contactCard's old `gap: 12`
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    paddingRight: 4,
  },
  cardTitle: {
    fontSize: IS_SMALL ? 13 : 14,
    fontFamily: "Inter_600SemiBold",
    color: THEME.textPrimary,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: IS_SMALL ? 11 : 12,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    lineHeight: 17,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderIcon: {
    marginRight: 8, // replaces old `gap: 8`
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: THEME.textPrimary,
  },

  // ── Social Grid ──
  socialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
    marginHorizontal: -5, // compensates socialButtonWrapper's horizontal margin
  },
  socialButtonWrapper: {
    width: (width - 32 - 20) / 3,
    marginHorizontal: 5,
    marginBottom: 10, // replaces old `gap: 10` (handles both row + column spacing)
  },
  socialButton: {
    alignItems: "center",
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  socialButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  socialGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8, // replaces old `gap: 8` between icon and label
  },
  socialLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: THEME.textPrimary,
    textAlign: "center",
  },

  // ── Info Cards ──
  infoCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    padding: 16,
    marginBottom: 10,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoHeaderIcon: {
    marginRight: 10, // replaces old `gap: 10`
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: THEME.textPrimary,
  },
  infoText: {
    fontSize: IS_SMALL ? 12 : 13,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: IS_SMALL ? 11 : 12,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    marginTop: 4,
  },
});