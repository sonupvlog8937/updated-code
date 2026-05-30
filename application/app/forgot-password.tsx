import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { Field } from "@/app/login";
import { postData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const { width } = Dimensions.get("window");
const IS_SMALL = width < 375;

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

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
        showToast("success", res?.message || "Check your email for OTP");
        setStep(2);
      } else {
        showToast("error", res?.message || "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!otp || !password || password !== confirm) {
      showToast("error", "Check OTP and passwords");
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
        showToast("success", "Password updated. Please sign in.");
        router.replace("/login" as never);
      } else {
        showToast("error", res?.message || "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Reset password
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {step === 1
              ? "Enter your email to receive a 6-digit code"
              : "Enter the OTP and your new password"}
          </Text>

          {step === 1 ? (
            <View style={styles.formBlock}>
              <Field
                icon="mail"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {/* <Pressable
                onPress={sendOtp}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: loading ? colors.muted : colors.primary,
                    opacity: loading ? 0.6 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? "Sending..." : "Send OTP"}
                </Text>
              </Pressable> */}
              <Pressable onPress={sendOtp} disabled={loading}>
                <Text style={[styles.backLink, { color: colors.primary }]}>
                  {loading ? "Sending..." : "Send OTP"}
                </Text>
              </Pressable>

              {/* <Pressable onPress={() => router.back()}>
                <Text style={[styles.backLink, { color: colors.primary }]}>
                  ← Back to login
                </Text>
              </Pressable> */}
            </View>
          ) : (
            <View style={styles.formBlock}>
              <Field
                icon="hash"
                placeholder="6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              <Field
                icon="lock"
                placeholder="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              <Field
                icon="lock"
                placeholder="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                editable={!loading}
              />
              {/* <Pressable
                onPress={reset}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: "#FF6B35",
                    opacity: loading ? 0.6 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? "Updating..." : "Update Password"}
                </Text>
              </Pressable> */}

              <Pressable onPress={reset} disabled={loading}>
                <Text style={[styles.backLink, { color: colors.primary }]}>
                  {loading ? "Updating..." : "Update Password"}
                </Text>
              </Pressable>

              {/* <Pressable onPress={() => setStep(1)}>
                <Text style={[styles.backLink, { color: colors.primary }]}>
                  ← Change email
                </Text>
              </Pressable> */}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: IS_SMALL ? 12 : 16,
    paddingTop: IS_SMALL ? 12 : 16,
    paddingBottom: 16,
  },
  heading: {
    fontSize: IS_SMALL ? 20 : 24,
    fontWeight: "bold",
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: IS_SMALL ? 11 : 12,
    marginTop: 6,
    fontWeight: "400",
    lineHeight: 16,
  },
  formBlock: {
    marginTop: 16,
    gap: 10,
  },
  primaryBtn: {
    paddingVertical: IS_SMALL ? 14 : 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: IS_SMALL ? 14 : 15,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  backLink: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
});
