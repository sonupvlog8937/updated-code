import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { Field } from "@/app/login";
import { postData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const { width, height } = Dimensions.get("window");
const IS_SMALL = width < 375;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Vibrant Theme Colors (matches login) ─────────────────────────
const THEME = {
  gradientStart: "#0f0c29",
  gradientMid: "#302b63",
  gradientEnd: "#24243e",
  accent: "#ff6b6b",
  accentAlt: "#feca57",
  cardBg: "rgba(255,255,255,0.08)",
  cardBorder: "rgba(255,255,255,0.15)",
  inputBg: "rgba(255,255,255,0.1)",
  inputBorder: "rgba(255,255,255,0.25)",
  inputFocusBorder: "#feca57",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.75)",
  textMuted: "rgba(255,255,255,0.5)",
  btnGradientStart: "#667eea",
  btnGradientEnd: "#764ba2",
  socialGoogle: "#ffffff",
  socialApple: "#000000",
  strengthWeak: "#ff4757",
  strengthMedium: "#ffa502",
  strengthStrong: "#2ed573",
};

// ─── Password Strength Indicator ──────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: "", color: "transparent" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: 1, label: "Weak", color: THEME.strengthWeak };
    if (score <= 3) return { level: 2, label: "Medium", color: THEME.strengthMedium };
    return { level: 3, label: "Strong", color: THEME.strengthStrong };
  };

  const strength = getStrength(password);

  const bar1Anim = useSharedValue(0);
  const bar2Anim = useSharedValue(0);
  const bar3Anim = useSharedValue(0);

  useEffect(() => {
    bar1Anim.value = withSpring(strength.level >= 1 ? 1 : 0, { damping: 15 });
    bar2Anim.value = withSpring(strength.level >= 2 ? 1 : 0, { damping: 15 });
    bar3Anim.value = withSpring(strength.level >= 3 ? 1 : 0, { damping: 15 });
  }, [strength.level]);

  const bar1Style = useAnimatedStyle(() => ({
    backgroundColor:
      bar1Anim.value > 0.5 ? strength.color : "rgba(255,255,255,0.15)",
    transform: [{ scaleX: interpolate(bar1Anim.value, [0, 1], [0.6, 1]) }],
  }));
  const bar2Style = useAnimatedStyle(() => ({
    backgroundColor:
      bar2Anim.value > 0.5 ? strength.color : "rgba(255,255,255,0.15)",
    transform: [{ scaleX: interpolate(bar2Anim.value, [0, 1], [0.6, 1]) }],
  }));
  const bar3Style = useAnimatedStyle(() => ({
    backgroundColor:
      bar3Anim.value > 0.5 ? strength.color : "rgba(255,255,255,0.15)",
    transform: [{ scaleX: interpolate(bar3Anim.value, [0, 1], [0.6, 1]) }],
  }));

  if (!password) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={styles.strengthContainer}
    >
      <View style={styles.strengthBars}>
        <Animated.View style={[styles.strengthBar, bar1Style]} />
        <Animated.View style={[styles.strengthBar, bar2Style]} />
        <Animated.View style={[styles.strengthBar, bar3Style]} />
      </View>
      <Text style={[styles.strengthLabel, { color: strength.color }]}>
        {strength.label}
      </Text>
    </Animated.View>
  );
}

// ─── Animated Button ──────────────────────────────────────────────
function AnimatedButton({
  onPress,
  loading,
  label,
  loadingLabel,
}: {
  onPress: () => void;
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.15, 0]),
    transform: [
      {
        translateX: interpolate(shimmer.value, [0, 1], [-width, width]),
      },
    ],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={loading}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[styles.createBtn, buttonStyle, { opacity: loading ? 0.7 : 1 }]}
    >
      <LinearGradient
        colors={
          loading
            ? ["#999", "#777"]
            : [THEME.btnGradientStart, THEME.btnGradientEnd]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btnGradient}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 80,
              backgroundColor: "#fff",
              borderRadius: 14,
            },
            shimmerStyle,
          ]}
        />
        {loading ? (
          <Text style={styles.btnText}>{loadingLabel}</Text>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.btnText}>{label}</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

// ─── Floating Orb ─────────────────────────────────────────────────
function FloatingOrb({
  size,
  color,
  top,
  left,
  delay = 0,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  delay?: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.25, { duration: 800 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(12, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        style,
      ]}
    />
  );
}

// ─── Animated Checkbox ────────────────────────────────────────────
function AnimatedCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(checked ? 1 : 0);
  const boxScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, { damping: 12, stiffness: 200 });
    if (checked) {
      boxScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 300 }),
      );
    }
  }, [checked]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  return (
    <AnimatedPressable onPress={onToggle} style={containerStyle}>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked
              ? THEME.btnGradientStart
              : "rgba(255,255,255,0.1)",
            borderColor: checked ? THEME.btnGradientStart : THEME.inputBorder,
          },
        ]}
      >
        <Animated.View style={checkStyle}>
          <Feather name="check" size={12} color="#fff" />
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

// ─── Feature Pill ─────────────────────────────────────────────────
function FeaturePill({
  icon,
  text,
  delay = 0,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.featurePill}
    >
      <Feather name={icon} size={13} color={THEME.accentAlt} />
      <Text style={styles.featurePillText}>{text}</Text>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(30);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 14, stiffness: 100 }),
    );
    formOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const onRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showToast("error", "All fields are required");
      return;
    }
    if (password.length < 6) {
      showToast("error", "Password must be at least 6 characters");
      return;
    }
    if (!agreedTerms) {
      showToast("error", "Please agree to the Terms & Conditions");
      return;
    }
    setLoading(true);
    try {
      const res = await postData("/api/user/register", {
        name,
        email,
        password,
      });
      if (res?.error === false) {
        await AsyncStorage.setItem("userEmail", email);
        showToast(
          "success",
          res?.message || "✅ Account created. Verify email."
        );
        router.replace("/verify" as never);
      } else {
        // Better error messages based on API response
        const errorMsg = res?.message || "Registration failed";
        if (errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("exist")) {
          showToast("error", "❌ Email already registered. Try logging in instead.");
        } else if (errorMsg.toLowerCase().includes("invalid") && errorMsg.toLowerCase().includes("email")) {
          showToast("error", "❌ Invalid email format. Please check.");
        } else if (errorMsg.toLowerCase().includes("weak") || errorMsg.toLowerCase().includes("password")) {
          showToast("error", "❌ Password is too weak. Use 6+ characters.");
        } else {
          showToast("error", `❌ ${errorMsg}`);
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      showToast("error", "❌ Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleNameFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 300);
  };

  const handleEmailFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 40, animated: true });
    }, 300);
  };

  const handlePasswordFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 300);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Deep Gradient Background */}
      <LinearGradient
        colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Orbs */}
      <FloatingOrb size={100} color="#667eea" top={40} left={width - 70} delay={0} />
      <FloatingOrb size={70} color="#f093fb" top={height * 0.3} left={-20} delay={400} />
      <FloatingOrb size={50} color="#feca57" top={height * 0.65} left={width - 40} delay={800} />
      <FloatingOrb size={90} color="#48dbfb" top={height * 0.8} left={30} delay={600} />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View style={[styles.headerSection, headerStyle]}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Feather name="user-plus" size={26} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.heading}>Join Zee Daddy 🚀</Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View style={[styles.formCard, formStyle]}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <Field
                  icon="user"
                  placeholder="Sonu Kumar"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                  onFocus={handleNameFocus}
                  delay={500}
                />

                <Text style={[styles.label, { marginTop: 14 }]}>
                  Email Address
                </Text>
                <Field
                  icon="mail"
                  placeholder="sonupvlog8937@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  onFocus={handleEmailFocus}
                  delay={600}
                />

                <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
                <Field
                  icon="lock"
                  placeholder="Min 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  rightIcon={showPwd ? "eye-off" : "eye"}
                  onRightPress={() => setShowPwd((v) => !v)}
                  editable={!loading}
                  onFocus={handlePasswordFocus}
                  delay={700}
                />

                {/* Password Strength */}
                <PasswordStrength password={password} />
              </View>

              {/* Terms Checkbox */}
              <Animated.View
                entering={FadeInDown.delay(800).duration(400)}
                style={styles.termsRow}
              >
                <AnimatedCheckbox
                  checked={agreedTerms}
                  onToggle={() => setAgreedTerms((v) => !v)}
                />
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text style={styles.termsLink}>Terms & Conditions</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </Animated.View>

              {/* Create Account Button */}
              <Animated.View
                entering={FadeInDown.delay(900).duration(500).springify()}
              >
                <AnimatedButton
                  onPress={onRegister}
                  loading={loading}
                  label="Create Account"
                  loadingLabel="Creating..."
                />
              </Animated.View>

              {/* Divider */}
              <Animated.View
                entering={FadeInDown.delay(1000).duration(400)}
                style={styles.divider}
              >
                <View style={styles.line} />
                <Text style={styles.orText}>or sign up with</Text>
                <View style={styles.line} />
              </Animated.View>
              <Animated.View
              entering={FadeInUp.delay(1300).duration(500)}
              style={styles.signinLink}
            >
              <Pressable onPress={() => router.back()}>
                <Text style={styles.signinText}>
                  Already have an account?{" "}
                  <Text style={styles.signinBold}>Sign in</Text>
                </Text>
              </Pressable>
            </Animated.View>

              {/* Social Buttons */}
              {/* <View style={styles.socialRow}>
                <Animated.View
                  entering={FadeInDown.delay(1100).duration(400).springify()}
                  style={{ flex: 1 }}
                >
                  <SocialButton
                    icon="logo-google"
                    iconColor="#EA4335"
                    label="Google"
                    bgColor={THEME.socialGoogle}
                    textColor="#333"
                    onPress={() =>
                      showToast("info", "Google signup coming soon")
                    }
                  />
                </Animated.View>
                <Animated.View
                  entering={FadeInDown.delay(1200).duration(400).springify()}
                  style={{ flex: 1 }}
                >
                  <SocialButton
                    icon="logo-apple"
                    iconColor="#fff"
                    label="Apple"
                    bgColor={THEME.socialApple}
                    textColor="#fff"
                    onPress={() =>
                      showToast("info", "Apple signup coming soon")
                    }
                  />
                </Animated.View>
              </View> */}
            </Animated.View>

            {/* Sign In Link */}
            {/* <Animated.View
              entering={FadeInUp.delay(1300).duration(500)}
              style={styles.signinLink}
            >
              <Pressable onPress={() => router.back()}>
                <Text style={styles.signinText}>
                  Already have an account?{" "}
                  <Text style={styles.signinBold}>Sign in</Text>
                </Text>
              </Pressable>
            </Animated.View> */}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Social Button (local) ────────────────────────────────────────
function SocialButton({
  icon,
  iconColor,
  label,
  bgColor,
  textColor,
  onPress,
}: {
  icon: string;
  iconColor: string;
  label: string;
  bgColor: string;
  textColor: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[styles.socialBtn, { backgroundColor: bgColor }, animStyle]}
    >
      <Ionicons name={icon as any} size={20} color={iconColor} />
      <Text style={[styles.socialBtnText, { color: textColor }]}>{label}</Text>
    </AnimatedPressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: IS_SMALL ? 12 : 20,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Header
  headerSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 14,
  },
  logoGradient: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  heading: {
    fontSize: IS_SMALL ? 24 : 28,
    fontFamily: "Inter_700Bold",
    color: THEME.textPrimary,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sub: {
    fontSize: IS_SMALL ? 13 : 14,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },

  // Feature pills
  featurePillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  featurePillText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: THEME.textSecondary,
  },

  // Form Card
  formCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    padding: IS_SMALL ? 18 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  formGroup: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: THEME.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },

  // Password Strength
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    minWidth: 50,
    textAlign: "right",
  },

  // Terms
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    color: THEME.accentAlt,
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },

  // Button
  createBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: THEME.btnGradientStart,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGradient: {
    paddingVertical: IS_SMALL ? 14 : 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    overflow: "hidden",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  orText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: THEME.textMuted,
  },

  // Social Buttons
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: IS_SMALL ? 12 : 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  socialBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },

  // Sign In
  signinLink: {
    marginTop: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  signinText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
  },
  signinBold: {
    fontFamily: "Inter_700Bold",
    color: THEME.accentAlt,
    textDecorationLine: "underline",
  },
});
