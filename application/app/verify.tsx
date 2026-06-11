import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { postData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

export default function VerifyScreen() {
  const colors = useColors();
  const router = useRouter();
  const inputs = useRef<(TextInput | null)[]>([]);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("userEmail").then(setEmail);
  }, []);

  const onChange = (i: number, v: string) => {
    const ch = v.replace(/[^0-9]/g, "").slice(0, 1);
    const next = [...code];
    next[i] = ch;
    setCode(next);
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const onVerify = async () => {
    const otp = code.join("");
    if (otp.length !== 6) {
      showToast("error", "Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await postData("/api/user/verify-email", { email, otp });
      if (res?.error === false) {
        showToast("success", res?.message || "✅ Email verified successfully");
        router.replace("/login" as never);
      } else {
        const errorMsg = res?.message || "Invalid code";
        if (errorMsg.toLowerCase().includes("expired")) {
          showToast("error", "❌ Code expired. Request a new one.");
        } else if (errorMsg.toLowerCase().includes("invalid")) {
          showToast("error", "❌ Invalid code. Please check and try again.");
        } else {
          showToast("error", `❌ ${errorMsg}`);
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      showToast("error", "❌ Network error. Please try again.");
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Verify your email
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            We sent a 6-digit code to {email || "your email"}
          </Text>
          <View style={styles.row}>
            {code.map((c, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                value={c}
                onChangeText={(v) => onChange(i, v)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace" && !c && i > 0) {
                    inputs.current[i - 1]?.focus();
                  }
                }}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  styles.box,
                  {
                    borderColor: c ? colors.primary : colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.card,
                  },
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={onVerify}
            disabled={loading}
            style={{
              backgroundColor: loading ? colors.muted : colors.primary,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 24,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" }}>
              {loading ? "Verifying..." : "Verify"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => showToast("info", "Resend coming soon")}
            style={{ marginTop: 18, alignItems: "center" }}
          >
            <Text style={{ color: colors.primary, fontSize: 13 }}>
              Resend code
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24 },
  heading: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, marginTop: 6, fontFamily: "Inter_400Regular" },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
    justifyContent: "center",
  },
  box: {
    width: 44,
    height: 54,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 20,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
});
