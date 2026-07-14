import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloatingCardProps {
  icon: string;
  value: string;
  label: string;
  delay: number;
  style?: object;
}

interface ChipProps {
  icon: string;
  label: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Chip: React.FC<ChipProps> = ({ icon, label }) => (
  <View style={styles.chip}>
    <Text style={styles.chipIcon}>{icon}</Text>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const FloatingCard: React.FC<FloatingCardProps> = ({
  icon,
  value,
  label,
  delay,
  style,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.floatingCard,
        style,
        { transform: [{ translateY: floatAnim }] },
      ]}
    >
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface GoMarketHeroSectionProps {
  onExplorePress?: () => void;
}

const GoMarketHeroSection: React.FC<GoMarketHeroSectionProps> = ({
  onExplorePress,
}) => {
  const router = useRouter();
  // Entry animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideLeft = useRef(new Animated.Value(-40)).current;
  const slideRight = useRef(new Animated.Value(40)).current;

  // Badge
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeSlide = useRef(new Animated.Value(-30)).current;

  // CTA pulse ring
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Main fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    // Left slide-in
    Animated.timing(slideLeft, {
      toValue: 0,
      duration: 800,
      delay: 100,
      useNativeDriver: true,
    }).start();

    // Right slide-in
    Animated.timing(slideRight, {
      toValue: 0,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Badge entry
    Animated.parallel([
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 700,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(badgeSlide, {
        toValue: 0,
        duration: 700,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse ring animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.6,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(400),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
        {/* ── Left / Top Content ── */}
        <Animated.View
          style={[
            styles.contentWrapper,
            { opacity: fadeAnim, transform: [{ translateX: slideLeft }] },
          ]}
        >
          {/* Badge */}
          <Animated.View
            style={[
              styles.badge,
              {
                opacity: badgeOpacity,
                transform: [{ translateX: badgeSlide }],
              },
            ]}
          >
            <Text style={styles.badgeIcon}>📍</Text>
            <Text style={styles.badgeText}>Nearby Markets</Text>
          </Animated.View>

          {/* Title */}
          <Text style={styles.heroEmoji}>🏪 Go Market</Text>

          <Text style={styles.heroTitle}>
            Shop From Your Nearby Local Market
          </Text>

          <Text style={styles.heroSubtitle}>
            Everything your local market offers is now available online. Shop
            from nearby Grocery, Fashion, Electronics, Pharmacy, Restaurants,
            Gift Shops and more with quick delivery.
          </Text>

          {/* Feature Chips */}
          <View style={styles.chipRow}>
            <Chip icon="⚡" label="15–30 Min Delivery" />
            <Chip icon="🏪" label="Local Shops" />
          </View>
          <View style={styles.chipRow}>
            <Chip icon="⭐" label="Trusted Sellers" />
            <Chip icon="📍" label="Nearby Markets" />
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.ctaButton}
            onPress={() => {
              if (onExplorePress) {
                onExplorePress();
              } else {
                router.push("/go-market" as never);
              }
            }}
          >
            <Text style={styles.ctaText}>Explore Nearby Market</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>

          {/* <Text style={styles.secondaryText}>
            Choose Market → Select Shop → Order → Fast Delivery
          </Text> */}
        </Animated.View>
        {/* ── Right / Bottom Illustration ── */}
      </Animated.View>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const ORANGE = "#FF6B35";
const ORANGE_DARK = "#FF8A00";
const CARD_BG = "rgba(255, 255, 255, 0.85)";

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#FFF9F5",
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: "transparent",
  },

  // ── Content ──
  contentWrapper: {
    marginBottom: 40,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.25)",
    borderRadius: 50,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  badgeIcon: {
    fontSize: 13,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: ORANGE,
    marginLeft: 4,
  },
  heroEmoji: {
    fontSize: 26,
    fontWeight: "800",
    color: ORANGE,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: SCREEN_WIDTH < 380 ? 22 : 26,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 34,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "#6B7280",
    marginBottom: 24,
  },

  // ── Chips ──
  chipRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.15)",
    borderRadius: 24,
    gap: 6,
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },

  // ── CTA ──
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: ORANGE,
    borderRadius: 16,
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  ctaArrow: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 14,
    letterSpacing: 0.3,
  },

  // ── Illustration ──
  illustrationWrapper: {
    height: 300,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: ORANGE,
  },
  illustrationCenter: {
    width: 180,
    height: 180,
    borderRadius: 36,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationEmoji: {
    fontSize: 90,
  },

  // ── Floating Cards ──
  floatingCard: {
    position: "absolute",
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 18,
    alignItems: "flex-start",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  card1: {
    bottom: 10,
    left: 10,
  },
  card2: {
    top: 10,
    right: 10,
  },
  card3: {
    bottom: 80,
    right: 20,
  },
  cardIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: "700",
    color: ORANGE,
  },
  cardLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
});

export default GoMarketHeroSection;