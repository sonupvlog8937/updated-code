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
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
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
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ─── Vibrant Theme Colors ─────────────────────────────────────────
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
  socialGoogle: "#ffffff",
  socialApple: "#000000",
};

// ─── Animated Input Field ─────────────────────────────────────────
interface AnimatedFieldProps extends React.ComponentProps<typeof TextInput> {
  icon: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
  onFocus?: (e?: any) => void;
  delay?: number;
}

export const Field: React.FC<AnimatedFieldProps> = ({
  icon,
  rightIcon,
  onRightPress,
  onFocus,
  delay = 0,
  ...rest
}) => {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const iconAnim = useSharedValue(0);

  useEffect(() => {
    iconAnim.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 120 }));
  }, []);

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
      {/* Glow effect behind input */}
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
        {rightIcon ? (
          <Pressable onPress={onRightPress} hitSlop={8}>
            <Feather name={rightIcon} size={18} color={THEME.textSecondary} />
          </Pressable>
        ) : null}
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
        {/* Shimmer overlay */}
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

// ─── Social Button ────────────────────────────────────────────────
function SocialButton({
  icon,
  iconColor,
  label,
  bgColor,
  textColor,
  onPress,
  delay = 0,
}: {
  icon: string;
  iconColor: string;
  label: string;
  bgColor: string;
  textColor: string;
  onPress: () => void;
  delay?: number;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[styles.socialBtn, { backgroundColor: bgColor }, animStyle]}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <Text style={[styles.socialBtnText, { color: textColor }]}>{label}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─── Floating Orb Decoration ──────────────────────────────────────
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

// ─── Main Screen ──────────────────────────────────────────────────
export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
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

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const onLogin = async () => {
    if (!email.trim() || !password) {
      showToast("error", "Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await postData("/api/user/login", { email, password });
      if (res?.error === false) {
        await AsyncStorage.setItem("accessToken", res?.data?.accesstoken || "");
        await AsyncStorage.setItem(
          "refreshToken",
          res?.data?.refreshToken || "",
        );
        await AsyncStorage.setItem("userEmail", email);
        dispatch(setIsLogin(true));
        dispatch(fetchUserDetails());
        dispatch(fetchCartItems());
        dispatch(fetchMyListData());
        showToast("success", "Welcome back!");

        setTimeout(() => {
          router.replace("/" as never);
        }, 800);
      } else {
        // Better error messages based on API response
        const errorMsg = res?.message || "Login failed";
        if (errorMsg.toLowerCase().includes("not found") || errorMsg.toLowerCase().includes("user")) {
          showToast("error", "❌ User not found. Please check your email.");
        } else if (errorMsg.toLowerCase().includes("password") || errorMsg.toLowerCase().includes("incorrect")) {
          showToast("error", "❌ Incorrect password. Please try again.");
        } else if (errorMsg.toLowerCase().includes("invalid")) {
          showToast("error", "❌ Invalid email format. Please check.");
        } else {
          showToast("error", `❌ ${errorMsg}`);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      showToast("error", "❌ Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 300);
  };

  const handlePasswordFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 50, animated: true });
    }, 300);
  };

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
            {/* Header */}
            <Animated.View style={[styles.headerSection, headerStyle]}>
              {/* App Logo / Brand */}
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
              <Text style={styles.heading}>Welcome back ✨</Text>
              <Text style={styles.sub}>
                Sign in to continue your shopping journey
              </Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View style={[styles.formCard, formStyle]}>
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
                  onFocus={handleEmailFocus}
                  delay={500}
                />

                <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
                <Field
                  icon="lock"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  rightIcon={showPwd ? "eye-off" : "eye"}
                  onRightPress={() => setShowPwd((v) => !v)}
                  editable={!loading}
                  onFocus={handlePasswordFocus}
                  delay={600}
                />

                <Pressable
                  onPress={() => router.push("/forgot-password" as never)}
                  style={styles.forgotRow}
                >
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
              </View>

              {/* Sign In Button */}
              <Animated.View
                entering={FadeInDown.delay(700).duration(500).springify()}
              >
                <AnimatedButton
                  onPress={onLogin}
                  loading={loading}
                  label="Sign In"
                  loadingLabel="Signing In..."
                />
              </Animated.View>

              {/* Divider */}
              <Animated.View
                entering={FadeInDown.delay(800).duration(400)}
                style={styles.divider}
              >
                <View style={styles.line} />
                <Text style={styles.orText}>or continue with</Text>
                <View style={styles.line} />
              </Animated.View>

              {/* Social Buttons */}
              {/* <View style={styles.socialRow}>
                <SocialButton
                  icon="logo-google"
                  iconColor="#EA4335"
                  label="Google"
                  bgColor={THEME.socialGoogle}
                  textColor="#333"
                  onPress={() => showToast("info", "Google login coming soon")}
                  delay={900}
                />
                <SocialButton
                  icon="logo-apple"
                  iconColor="#fff"
                  label="Apple"
                  bgColor={THEME.socialApple}
                  textColor="#fff"
                  onPress={() => showToast("info", "Apple login coming soon")}
                  delay={1000}
                />
              </View> */}

              {/* Phone login */}
              <Animated.View
                entering={FadeInDown.delay(1100).duration(400).springify()}
              >
                <Pressable
                  onPress={() =>
                    showToast("info", "Phone OTP login coming soon")
                  }
                  style={styles.phoneBtn}
                >
                  <Feather name="phone" size={16} color={THEME.textSecondary} />
                  <Text style={styles.phoneBtnText}>Continue with Phone</Text>
                </Pressable>
              </Animated.View>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View
              entering={FadeInUp.delay(1200).duration(500)}
              style={styles.signupLink}
            >
              <Pressable onPress={() => router.push("/register" as never)}>
                <Text style={styles.signupText}>
                  Don't have an account?{" "}
                  <Text style={styles.signupBold}>Sign up free</Text>
                </Text>
              </Pressable>
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
    paddingTop: IS_SMALL ? 16 : 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: "center",
  },

  // Header
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

  // Form Card (glassmorphism)
  formCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    padding: IS_SMALL ? 18 : 24,
    // Subtle shadow for depth
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

  // Input Field
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

  // Forgot
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotLink: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: THEME.accentAlt,
  },

  // Button
  signInBtn: {
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  orText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: THEME.textMuted,
    textTransform: "lowercase",
  },

  // Social Buttons
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
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

  // Phone button
  phoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: IS_SMALL ? 12 : 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    marginTop: 12,
  },
  phoneBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: THEME.textSecondary,
  },

  // Sign Up
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
