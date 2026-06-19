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

// ─── Contact Card ─────────────────────────────────────────────────
interface ContactCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay?: number;
}

const ContactCard: React.FC<ContactCardProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  delay = 0,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.contactCard,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={["#ff6b6b", "#feca57"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Feather name={icon} size={22} color="#fff" />
          </LinearGradient>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={THEME.textSecondary} />
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
    const url = Platform.select({
      ios: `maps:0,0?q=${addressEncoded}`,
      android: `geo:0,0?q=${addressEncoded}`,
    }) || `https://www.google.com/maps/search/${addressEncoded}`;
    
    Linking.openURL(url).catch(() =>
      showToast("error", "❌ Could not open maps"),
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
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
          <View style={styles.section}>
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
            />

            <ContactCard
              icon="globe"
              title="Visit Website"
              subtitle={CONTACT_INFO.website}
              onPress={handleWebsite}
              delay={500}
            />

            <ContactCard
              icon="map-pin"
              title="Office Address"
              subtitle={CONTACT_INFO.address}
              onPress={handleAddress}
              delay={600}
            />
          </View>

          {/* Business Hours */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather name="clock" size={20} color={THEME.accent} />
              <Text style={styles.infoTitle}>Business Hours</Text>
            </View>
            <Text style={styles.infoText}>{CONTACT_INFO.businessHours}</Text>
            <Text style={styles.infoSubtext}>Sunday: Closed</Text>
          </Animated.View>

          {/* Additional Info */}
          <Animated.View
            entering={FadeInDown.delay(800).duration(400)}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Feather name="info" size={20} color={THEME.accent} />
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
const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  heroSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 8,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  heroTitle: {
    fontSize: IS_SMALL ? 26 : 28,
    fontFamily: "Inter_700Bold",
    color: THEME.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: IS_SMALL ? 14 : 15,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    textAlign: "center",
  },

  section: {
    gap: 12,
    marginBottom: 24,
  },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    padding: 16,
    gap: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: THEME.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
  },

  infoCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    padding: 18,
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: THEME.textPrimary,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    marginTop: 4,
  },
});
