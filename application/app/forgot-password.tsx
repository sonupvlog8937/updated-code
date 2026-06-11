import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  Layout,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { Field } from "@/app/login";
import { postData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const { width, height } = Dimensions.get("window");
const IS_SMALL = width < 375;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Theme (warm amber / teal gradient) ───────────────────────────
const THEME = {
  gradientStart: "#0f2027",
  gradientMid: "#203a43",
  gradientEnd: "#2c5364",
  accent: "#f7971e",
  accentAlt: "#ffd32a",
  cardBg: "rgba(255,255,255,0.08)",
  cardBorder: "rgba(255,255,255,0.15)",
  inputBorder: "rgba(255,255,255,0.25)",
  inputFocusBorder: "#f7971e",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.75)",
  textMuted: "rgba(255,255,255,0.5)",
  btnGradientStart: "#f7971e",
  btnGradientEnd: "#ffd200",
  btnText: "#1a1a2e",
  successGreen: "#2ed573",
};

// ─── Step Indicator ───────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  const step1Width = useSharedValue(currentStep >= 1 ? 1 : 0);
  const step2Width = useSharedValue(currentStep >= 2 ? 1 : 0);

  useEffect(() => {
    step1Width.value = withSpring(1, { damping: 14 });
    step2Width.value = withSpring(currentStep >= 2 ? 1 : 0, { damping: 14 });
  }, [currentStep]);

  const bar1Style = useAnimatedStyle(() => ({
    flex: step1Width.value,
    backgroundColor:
      step1Width.value > 0.5 ? THEME.accent : "rgba(255,255,255,0.15)",
  }));

  const bar2Style = useAnimatedStyle(() => ({
    flex: step2Width.value > 0.1 ? step2Width.value : 0.001,
    backgroundColor:
      step2Width.value > 0.5 ? THEME.accent : "rgba(255,255,255,0.15)",
  }));

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepRow}>
        {/* Step 1 circle */}
        <View
          style={[
            styles.stepCircle,
            {
              backgroundColor: THEME.accent,
              borderColor: THEME.accent,
            },
          ]}
        >
          {currentStep > 1 ? (
            <Feather name="check" size={12} color="#fff" />
          ) : (
            <Text style={styles.stepNumber}>1</Text>
          )}
        </View>

        {/* Line */}
        <View style={styles.stepLine}>
          <Animated.View style={[styles.stepLineFill, bar2Style]} />
        </View>

        {/* Step 2 circle */}
        <View
          style={[
            styles.stepCircle,
            {
              backgroundColor:
                currentStep >= 2 ? THEME.accent : "rgba(255,255,255,0.1)",
              borderColor:
                currentStep >= 2 ? THEME.accent : "rgba(255,255,255,0.3)",
            },
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              { color: currentStep >= 2 ? "#fff" : THEME.textMuted },
            ]}
          >
            2
          </Text>
        </View>
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, { color: THEME.textSecondary }]}>
          Verify Email
        </Text>
        <Text
          style={[
            styles.stepLabel,
            {
              color:
                currentStep >= 2 ? THEME.textSecondary : THEME.textMuted,
            },
          ]}
        >
          Reset Password
        </Text>
      </View>
    </View>
  );
}

// ─── Animated Button ──────────────────────────────────────────────
function AnimatedButton({
  onPress,
  loading,
  label,
  loadingLabel,
  icon,
}: {
  onPress: () => void;
  loading: boolean;
  label: string;
  loadingLabel: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.2, 0]),
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
      style={[styles.primaryBtn, buttonStyle, { opacity: loading ? 0.7 : 1 }]}
    >
      <LinearGradient
        colors={
          loading
            ? ["#888", "#666"]
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon && !loading && (
            <Feather name={icon} size={18} color={THEME.btnText} />
          )}
          <Text style={styles.btnText}>
            {loading ? loadingLabel : label}
          </Text>
        </View>
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
    opacity.value = withDelay(delay, withTiming(0.2, { duration: 800 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-14, {
            duration: 3200,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(14, {
            duration: 3200,
            easing: Easing.inOut(Easing.ease),
          }),
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

// ─── Info Tip ─────────────────────────────────────────────────────
function InfoTip({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.infoTip}
    >
      <Feather name="info" size={14} color={THEME.accent} />
      <Text style={styles.infoTipText}>{text}</Text>
    </Animated.View>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────
function ResendTimer({ onResend }: { onResend: () => void }) {
  const [seconds, setSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleResend = () => {
    onResend();
    setSeconds(60);
    setCanResend(false);
  };

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(600).duration(400)}
      style={styles.resendRow}
    >
      {canResend ? (
        <AnimatedPressable
          onPress={handleResend}
          onPressIn={() => {
            scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
          style={animStyle}
        >
          <Text style={styles.resendActive}>
            <Feather name="refresh-cw" size={13} color={THEME.accent} />
            {"  "}Resend OTP
          </Text>
        </AnimatedPressable>
      ) : (
        <Text style={styles.resendTimer}>
          Resend OTP in{" "}
          <Text style={{ color: THEME.accent, fontFamily: "Inter_700Bold" }}>
            {seconds}s
          </Text>
        </Text>
      )}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Re-animate form on step change
  useEffect(() => {
    formOpacity.value = 0;
    formOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
  }, [step]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const sendOtp = async () => {
    if (!email.trim()) {
      showToast("error", "Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await postData("/api/user/forgot-password", { email });
      if (res?.error === false) {
        await AsyncStorage.setItem("userEmail", email);
        showToast("success", res?.message || "✅ Check your email for OTP");
        setStep(2);
      } else {
        const errorMsg = res?.message || "Failed to send OTP";
        if (errorMsg.toLowerCase().includes("not found") || errorMsg.toLowerCase().includes("user")) {
          showToast("error", "❌ Email not registered. Please sign up first.");
        } else {
          showToast("error", `❌ ${errorMsg}`);
        }
      }
    } catch (err) {
      console.error("OTP error:", err);
      showToast("error", "❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!otp || !password || password !== confirm) {
      showToast("error", "Check OTP and passwords match");
      return;
    }
    if (password.length < 6) {
      showToast("error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await postData("/api/user/reset-password", {
        email,
        otp,
        newPass: password,
        confirmPass: confirm,
      });
      if (res?.error === false) {
        showToast("success", "✅ Password updated. Please sign in.");
        router.replace("/login" as never);
      } else {
        const errorMsg = res?.message || "Failed to reset password";
        if (errorMsg.toLowerCase().includes("otp") || errorMsg.toLowerCase().includes("invalid")) {
          showToast("error", "❌ Invalid or expired OTP. Please try again.");
        } else {
          showToast("error", `❌ ${errorMsg}`);
        }
      }
    } catch (err) {
      console.error("Reset error:", err);
      showToast("error", "❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password match indicator
  const passwordsMatch =
    password.length > 0 && confirm.length > 0 && password === confirm;
  const passwordsMismatch =
    password.length > 0 && confirm.length > 0 && password !== confirm;

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Orbs */}
      <FloatingOrb
        size={100}
        color="#f7971e"
        top={50}
        left={-30}
        delay={0}
      />
      <FloatingOrb
        size={70}
        color="#48dbfb"
        top={height * 0.35}
        left={width - 50}
        delay={400}
      />
      <FloatingOrb
        size={55}
        color="#ffd32a"
        top={height * 0.7}
        left={width * 0.3}
        delay={800}
      />
      <FloatingOrb
        size={85}
        color="#2ed573"
        top={height * 0.55}
        left={-20}
        delay={600}
      />

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
                  colors={["#f7971e", "#ffd200"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Feather
                    name={step === 1 ? "key" : "shield"}
                    size={26}
                    color="#fff"
                  />
                </LinearGradient>
              </View>
              <Text style={styles.heading}>
                {step === 1 ? "Forgot Password? 🔑" : "Reset Password 🛡️"}
              </Text>
              <Text style={styles.sub}>
                {step === 1
                  ? "No worries! Enter your email and we'll send you a reset code"
                  : "Enter the OTP sent to your email and set a new password"}
              </Text>
            </Animated.View>

            {/* Step Indicator */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              style={{ marginBottom: 20 }}
            >
              <StepIndicator currentStep={step} />
            </Animated.View>

            {/* Form Card */}
            <Animated.View style={[styles.formCard, formStyle]}>
              {step === 1 ? (
                /* ─── Step 1: Email ─────────────────────── */
                <View key="step1">
                  <InfoTip
                    text="We'll send a 6-digit OTP to your registered email"
                    delay={500}
                  />

                  <Text style={[styles.label, { marginTop: 16 }]}>
                    Email Address
                  </Text>
                  <Field
                    icon="mail"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    delay={600}
                  />

                  <Animated.View
                    entering={FadeInDown.delay(700).duration(500).springify()}
                  >
                    <AnimatedButton
                      onPress={sendOtp}
                      loading={loading}
                      label="Send OTP"
                      loadingLabel="Sending..."
                      icon="send"
                    />
                  </Animated.View>

                  {/* Back to login */}
                  <Animated.View
                    entering={FadeInDown.delay(800).duration(400)}
                    style={styles.backRow}
                  >
                    <Pressable
                      onPress={() => router.back()}
                      style={styles.backBtn}
                    >
                      <Feather
                        name="arrow-left"
                        size={16}
                        color={THEME.textSecondary}
                      />
                      <Text style={styles.backBtnText}>Back to login</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              ) : (
                /* ─── Step 2: OTP + New Password ───────── */
                <View key="step2">
                  {/* Email badge */}
                  <Animated.View
                    entering={FadeInDown.delay(200).duration(400)}
                    style={styles.emailBadge}
                  >
                    <Feather
                      name="mail"
                      size={14}
                      color={THEME.accent}
                    />
                    <Text style={styles.emailBadgeText}>{email}</Text>
                    <Pressable onPress={() => setStep(1)}>
                      <Feather
                        name="edit-2"
                        size={13}
                        color={THEME.textMuted}
                      />
                    </Pressable>
                  </Animated.View>

                  <Text style={[styles.label, { marginTop: 14 }]}>
                    6-Digit OTP
                  </Text>
                  <Field
                    icon="hash"
                    placeholder="Enter OTP code"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                    delay={300}
                  />

                  {/* Resend Timer */}
                  <ResendTimer onResend={sendOtp} />

                  <Text style={[styles.label, { marginTop: 16 }]}>
                    New Password
                  </Text>
                  <Field
                    icon="lock"
                    placeholder="Min 6 characters"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwd}
                    rightIcon={showPwd ? "eye-off" : "eye"}
                    onRightPress={() => setShowPwd((v) => !v)}
                    editable={!loading}
                    delay={400}
                  />

                  <Text style={[styles.label, { marginTop: 14 }]}>
                    Confirm Password
                  </Text>
                  <Field
                    icon="lock"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showConfirm}
                    rightIcon={showConfirm ? "eye-off" : "eye"}
                    onRightPress={() => setShowConfirm((v) => !v)}
                    editable={!loading}
                    delay={500}
                  />

                  {/* Password match indicator */}
                  {(passwordsMatch || passwordsMismatch) && (
                    <Animated.View
                      entering={FadeInDown.duration(300)}
                      style={styles.matchRow}
                    >
                      <Feather
                        name={passwordsMatch ? "check-circle" : "x-circle"}
                        size={14}
                        color={
                          passwordsMatch
                            ? THEME.successGreen
                            : "#ff4757"
                        }
                      />
                      <Text
                        style={[
                          styles.matchText,
                          {
                            color: passwordsMatch
                              ? THEME.successGreen
                              : "#ff4757",
                          },
                        ]}
                      >
                        {passwordsMatch
                          ? "Passwords match"
                          : "Passwords don't match"}
                      </Text>
                    </Animated.View>
                  )}

                  <Animated.View
                    entering={FadeInDown.delay(600).duration(500).springify()}
                  >
                    <AnimatedButton
                      onPress={reset}
                      loading={loading}
                      label="Update Password"
                      loadingLabel="Updating..."
                      icon="shield"
                    />
                  </Animated.View>

                  {/* Change email */}
                  <Animated.View
                    entering={FadeInDown.delay(700).duration(400)}
                    style={styles.backRow}
                  >
                    <Pressable
                      onPress={() => setStep(1)}
                      style={styles.backBtn}
                    >
                      <Feather
                        name="arrow-left"
                        size={16}
                        color={THEME.textSecondary}
                      />
                      <Text style={styles.backBtnText}>Change email</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              )}
            </Animated.View>

            {/* Security Note */}
            <Animated.View
              entering={FadeInUp.delay(900).duration(500)}
              style={styles.securityNote}
            >
              <Feather name="lock" size={14} color={THEME.textMuted} />
              <Text style={styles.securityText}>
                Your data is encrypted and secure
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: IS_SMALL ? 14 : 22,
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
    shadowColor: "#f7971e",
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
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  // Step Indicator
  stepContainer: {
    paddingHorizontal: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  stepLineFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
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
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: THEME.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },

  // Info Tip
  infoTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(247,151,30,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(247,151,30,0.2)",
    padding: 12,
  },
  infoTipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
    lineHeight: 18,
  },

  // Email Badge
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(247,151,30,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(247,151,30,0.15)",
  },
  emailBadgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: THEME.textPrimary,
  },

  // Resend
  resendRow: {
    alignItems: "center",
    marginTop: 10,
  },
  resendTimer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: THEME.textMuted,
  },
  resendActive: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: THEME.accent,
  },

  // Password Match
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  // Button
  primaryBtn: {
    marginTop: 22,
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
    color: THEME.btnText,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },

  // Back button
  backRow: {
    alignItems: "center",
    marginTop: 18,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: THEME.textSecondary,
  },

  // Security note
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: THEME.textMuted,
  },
});
