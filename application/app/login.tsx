import { Feather } from "@expo/vector-icons";
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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppDispatch } from "@/src/store";
import {
  fetchCartItems,
  fetchMyListData,
  fetchUserDetails,
  setIsLogin,
} from "@/src/store/appSlice";
import { postData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const { width, height } = Dimensions.get("window");
const IS_SMALL = width < 375;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Theme Colors ─────────────────────────────────────────────────
const THEME = {
  gradientStart: "#667eea",
  gradientMid: "#764ba2",
  gradientEnd: "#f093fb",
  accent: "#ff6b6b",
  accentAlt: "#feca57",
  cardBg: "rgba(255,255,255,0.12)",
  cardBorder: "rgba(255,255,255,0.2)",
  inputBg: "rgba(255,255,255,0.1)",
  inputBorder: "rgba(255,255,255,0.25)",
  inputFocusBorder: "#feca57",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.75)",
  textMuted: "rgba(255,255,255,0.5)",
  btnGradientStart: "#ff6b6b",
  btnGradientEnd: "#ee5a24",
};

// ─── Animated Input Field ─────────────────────────────────────────
interface AnimatedFieldProps extends React.ComponentProps<typeof TextInput> {
  icon: keyof typeof Feather.glyphMap;
  onFocus?: (e?: any) => void;
  delay?: number;
}

const Field: React.FC<AnimatedFieldProps> = ({
  icon,
  onFocus,
  delay = 0,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const iconAnim = useSharedValue(0);

  useEffect(() => {
    iconAnim.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 120 }));
  }, [delay]);

  const handleFocus = useCallback(
    (e?: any) => {
      setIsFocused(true);
      borderAnim.value = withSpring(1, { damping: 15, stiffness: 150 });
      scaleAnim.value = withSpring(1.02, { damping: 15, stiffness: 200 });
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    borderAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: isFocused ? THEME.inputFocusBorder : THEME.inputBorder,
    transform: [{ scale: scaleAnim.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconAnim.value,
    transform: [{ scale: iconAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(borderAnim.value, [0, 1], [0, 0.3]),
    transform: [{ scale: interpolate(borderAnim.value, [0, 1], [0.95, 1.03]) }],
  }));

  return (
    <View style={{ position: "relative" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: 16,
            backgroundColor: THEME.inputFocusBorder,
          },
          glowStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.field,
          {
            backgroundColor: THEME.inputBg,
            borderWidth: 1.5,
          },
          containerStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <Feather
            name={icon}
            size={18}
            color={isFocused ? THEME.inputFocusBorder : THEME.textSecondary}
          />
        </Animated.View>
        <TextInput
          placeholderTextColor={THEME.textMuted}
          {...rest}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, { color: THEME.textPrimary }, rest.style]}
        />
      </Animated.View>
    </View>
  );
};

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
      style={[styles.signInBtn, buttonStyle, { opacity: loading ? 0.7 : 1 }]}
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
        <Text style={styles.btnText}>{loading ? loadingLabel : label}</Text>
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
    opacity.value = withDelay(delay, withTiming(0.3, { duration: 800 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay]);

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

// ─── Main Screen ──────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Step management: "email" | "otp" | "name"
  const [step, setStep] = useState<"email" | "otp" | "name">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

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

  // Step 1: Send OTP to email (works for both new and existing users)
  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      showToast("error", "❌ Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    try {
      // Try existing user login OTP first
      const res = await postData("/api/user/send-login-otp", { email: email.trim() });
      
      if (res?.error === false) {
        // User exists and is active
        setIsNewUser(false);
        setStep("otp");
        showToast("success", "✅ OTP sent to your email!");
      } else if (
        res?.message?.toLowerCase().includes("not found") ||
        res?.message?.toLowerCase().includes("not registered")
      ) {
        // New user - send registration OTP with temporary name
        const registerRes = await postData("/api/user/send-register-otp", {
          email: email.trim(),
          name: "User", // Temporary name, will be updated after OTP verification
        });

        if (registerRes?.error === false) {
          setIsNewUser(true);
          setStep("otp");
          showToast("success", "✅ OTP sent to your email!");
        } else {
          showToast("error", `❌ ${registerRes?.message || "Failed to send OTP"}`);
        }
      } else {
        showToast("error", `❌ ${res?.message || "Failed to send OTP"}`);
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      showToast("error", "❌ Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 4) {
      showToast("error", "❌ Please enter valid OTP");
      return;
    }
    
    setLoading(true);
    try {
      if (isNewUser) {
        // New user - just verify OTP is correct, then ask for name
        setStep("name");
        showToast("success", "✅ OTP verified! Please enter your name");
        setLoading(false);
      } else {
        // Existing user - login directly
        const res = await postData("/api/user/verify-login-otp", {
          email,
          otp: otp.trim(),
        });

        if (res?.error === false) {
          await AsyncStorage.setItem("accessToken", res?.data?.accesstoken || "");
          await AsyncStorage.setItem("refreshToken", res?.data?.refreshToken || "");
          await AsyncStorage.setItem("userEmail", email);
          dispatch(setIsLogin(true));
          dispatch(fetchUserDetails());
          dispatch(fetchCartItems());
          dispatch(fetchMyListData());

          showToast("success", "✅ Welcome back!");

          setTimeout(() => {
            router.replace("/" as never);
          }, 800);
        } else {
          showToast("error", `❌ ${res?.message || "Invalid OTP"}`);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      showToast("error", "❌ Network error. Please check your connection.");
      setLoading(false);
    }
  };

  // Step 3: Complete registration with name (for new users)
  const handleNameSubmit = async () => {
    if (!name.trim() || name.trim().length < 2) {
      showToast("error", "❌ Please enter your name (minimum 2 characters)");
      return;
    }
    
    setLoading(true);
    try {
      // Re-verify with actual name to complete registration
      const res = await postData("/api/user/verify-register-otp", {
        email,
        otp: otp.trim(),
        name: name.trim(),
      });

      if (res?.error === false) {
        await AsyncStorage.setItem("accessToken", res?.data?.accesstoken || "");
        await AsyncStorage.setItem("refreshToken", res?.data?.refreshToken || "");
        await AsyncStorage.setItem("userEmail", email);
        dispatch(setIsLogin(true));
        dispatch(fetchUserDetails());
        dispatch(fetchCartItems());
        dispatch(fetchMyListData());

        showToast("success", `🎉 Welcome ${name.trim()}!`);

        setTimeout(() => {
          router.replace("/" as never);
        }, 800);
      } else {
        showToast("error", `❌ ${res?.message || "Failed to complete registration"}`);
      }
    } catch (err) {
      console.error("Complete registration error:", err);
      showToast("error", "❌ Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("email");
      setOtp("");
    } else if (step === "name") {
      setStep("otp");
      setName("");
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const endpoint = isNewUser ? "/api/user/send-register-otp" : "/api/user/send-login-otp";
      const payload = isNewUser
        ? { email: email.trim(), name: "User" }
        : { email: email.trim() };

      const res = await postData(endpoint, payload);
      if (res?.error === false) {
        showToast("success", "✅ OTP resent to your email!");
      } else {
        showToast("error", `❌ ${res?.message || "Failed to resend OTP"}`);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      showToast("error", "❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Heading based on step
  const getHeaderContent = () => {
    switch (step) {
      case "email":
        return {
          title: "Welcome ✨",
          subtitle: "Enter your email to get started",
        };
      case "otp":
        return {
          title: "Verify OTP 🔐",
          subtitle: `We sent a code to ${email}`,
        };
      case "name":
        return {
          title: "Almost there! 👋",
          subtitle: "Please tell us your name",
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <FloatingOrb size={120} color="#feca57" top={60} left={-30} delay={0} />
      <FloatingOrb size={80} color="#ff6b6b" top={height * 0.35} left={width - 60} delay={400} />
      <FloatingOrb size={60} color="#48dbfb" top={height * 0.7} left={20} delay={800} />
      <FloatingOrb size={100} color="#ff9ff3" top={height * 0.55} left={width * 0.4} delay={600} />

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
            {step !== "email" && (
              <Animated.View
                entering={FadeInUp.duration(400)}
                style={styles.backBtn}
              >
                <Pressable onPress={handleBack} hitSlop={12}>
                  <View style={styles.backBtnInner}>
                    <Feather name="arrow-left" size={20} color={THEME.textPrimary} />
                  </View>
                </Pressable>
              </Animated.View>
            )}

            <Animated.View style={[styles.headerSection, headerStyle]}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={["#ff6b6b", "#feca57"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Feather name="shopping-bag" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.heading}>{headerContent.title}</Text>
              <Text style={styles.sub}>{headerContent.subtitle}</Text>
            </Animated.View>

            <Animated.View style={[styles.formCard, formStyle]}>
              {step === "email" && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <Field
                    icon="mail"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    delay={500}
                  />

                  <Animated.View
                    entering={FadeInDown.delay(700).duration(500).springify()}
                    style={{ marginTop: 20 }}
                  >
                    <AnimatedButton
                      onPress={handleEmailSubmit}
                      loading={loading}
                      label="Continue"
                      loadingLabel="Checking..."
                    />
                  </Animated.View>
                </View>
              )}

              {step === "otp" && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <Field
                    icon="lock"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                    delay={500}
                  />

                  <Animated.View
                    entering={FadeInDown.delay(700).duration(500).springify()}
                    style={{ marginTop: 20 }}
                  >
                    <AnimatedButton
                      onPress={handleVerifyOtp}
                      loading={loading}
                      label="Verify OTP"
                      loadingLabel="Verifying..."
                    />
                  </Animated.View>

                  <Animated.View
                    entering={FadeInDown.delay(800).duration(400)}
                    style={styles.resendRow}
                  >
                    <Text style={styles.resendText}>Didn't receive OTP? </Text>
                    <Pressable onPress={handleResendOtp} disabled={loading}>
                      <Text style={styles.resendLink}>Resend</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              )}

              {step === "name" && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Your Name</Text>
                  <Field
                    icon="user"
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                    delay={500}
                  />

                  <Animated.View
                    entering={FadeInDown.delay(700).duration(500).springify()}
                    style={{ marginTop: 20 }}
                  >
                    <AnimatedButton
                      onPress={handleNameSubmit}
                      loading={loading}
                      label="Complete Registration"
                      loadingLabel="Completing..."
                    />
                  </Animated.View>
                </View>
              )}
            </Animated.View>

            {step === "email" && (
              <Animated.View
                entering={FadeInUp.delay(1200).duration(500)}
                style={styles.signupLink}
              >
                <Pressable onPress={() => router.push("/contact" as never)}>
                  <Text style={styles.signupText}>
                    Need help?{" "}
                    <Text style={styles.signupBold}>Contact Support</Text>
                  </Text>
                </Pressable>
              </Animated.View>
            )}
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
    paddingTop: IS_SMALL ? 16 : 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: "center",
  },

  backBtn: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 10,
  },
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  heading: {
    fontSize: IS_SMALL ? 26 : 30,
    fontFamily: "Inter_700Bold",
    color: THEME.textPrimary,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.15)",
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

  formCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    padding: IS_SMALL ? 18 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
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

  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: IS_SMALL ? 48 : 52,
    borderRadius: 14,
  },
  input: {
    flex: 1,
    fontSize: IS_SMALL ? 14 : 15,
    fontFamily: "Inter_500Medium",
    paddingVertical: 0,
  },

  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  resendText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
  },
  resendLink: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: THEME.accentAlt,
    textDecorationLine: "underline",
  },

  signInBtn: {
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

  signupLink: {
    marginTop: 24,
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: THEME.textSecondary,
  },
  signupBold: {
    fontFamily: "Inter_700Bold",
    color: THEME.accentAlt,
    textDecorationLine: "underline",
  },
});
