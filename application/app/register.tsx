import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
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
import { useAppDispatch } from "@/src/store";
import { fetchCartItems, fetchMyListData, fetchUserDetails, setIsLogin } from "@/src/store/appSlice";
import { Field } from "@/app/login";
import { postData } from "@/src/utils/api";
import { auth } from "@/src/utils/firebase";
import { showToast } from "@/src/utils/toast";

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");
const IS_SMALL = width < 375;

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [, , promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  const scrollViewRef = useRef<ScrollView>(null);

  const onGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const result = await promptGoogleAsync();

      console.log("Google Result:", JSON.stringify(result, null, 2));

      if (result.type !== "success") {
        return;
      }

      const idToken = result.authentication?.idToken;
      const accessToken = result.authentication?.accessToken;

      console.log("ID TOKEN:", idToken);
      console.log("ACCESS TOKEN:", accessToken);

      if (!idToken) {
        throw new Error(
          "Google ID Token not received. Check OAuth Client IDs configuration."
        );
      }

      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const firebaseResult = await signInWithCredential(auth, credential);
      const firebaseUser: any = firebaseResult.user;
      const providerProfile = firebaseUser.providerData?.[0] || {};
      const fields = {
        name: providerProfile.displayName || firebaseUser.displayName || "Google User",
        email: providerProfile.email || firebaseUser.email,
        password: null,
        avatar: providerProfile.photoURL || firebaseUser.photoURL,
        mobile: providerProfile.phoneNumber || firebaseUser.phoneNumber,
        role: "USER",
        firebaseUid: firebaseUser.uid,
        idToken: await firebaseUser.getIdToken(),
      };
      const res = await postData("/api/user/authWithGoogle", fields);
      if (res?.error === false) {
        await AsyncStorage.setItem("accessToken", res?.data?.accesstoken || "");
        await AsyncStorage.setItem("refreshToken", res?.data?.refreshToken || "");
        await AsyncStorage.setItem("userEmail", fields.email || "");
        dispatch(setIsLogin(true));
        dispatch(fetchUserDetails());
        dispatch(fetchCartItems());
        dispatch(fetchMyListData());
        showToast("success", res?.message || "Signed in with Google");
        router.replace("/" as never);
      } else {
        showToast(res?.message || "Google sign-in failed", "error");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      showToast("error", error?.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showToast("error", "All fields are required");
      return;
    }
    if (password.length < 6) {
      showToast("error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await postData("/api/user/register", { name, email, password });
      if (res?.error === false) {
        await AsyncStorage.setItem("userEmail", email);
        showToast(res?.message || "Account created. Verify email.", "success");
        router.replace("/verify" as never);
      } else {
        showToast(res?.message || "Registration failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNameFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }, 300);
  };

  const handleEmailFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 40,
        animated: true,
      });
    }, 300);
  };

  const handlePasswordFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 80,
        animated: true,
      });
    }, 300);
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
          ref={scrollViewRef}
          contentContainerStyle={[styles.scroll, { minHeight: height - 50 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Create your account
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Join Zee Daddy and start exploring great deals
          </Text>
          <View style={styles.formGroup}>
            <Text
              style={[
                styles.altBtnText,
                { color: colors.foreground },
              ]}
            >
              Full name
            </Text>
            <Field
              icon="user"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              editable={!loading}
              onFocus={handleNameFocus}
            />
            <Text
              style={[
                styles.altBtnText,
                { color: colors.foreground },
              ]}
            >
              Email
            </Text>
            <Field
              icon="mail"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              onFocus={handleEmailFocus}
            />
            <Text
              style={[
                styles.altBtnText,
                { color: colors.foreground },
              ]}
            >
              Password (min 6 characters)
            </Text>
            <Field
              icon="lock"
              placeholder="Password (min 6 chars)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              rightIcon={showPwd ? "eye-off" : "eye"}
              onRightPress={() => setShowPwd((v) => !v)}
              editable={!loading}
              onFocus={handlePasswordFocus}
            />
          </View>
          <Pressable
            onPress={onRegister}
            disabled={loading}
            style={[
              styles.createBtn,
              {
                backgroundColor: loading ? colors.muted : colors.primary,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                opacity: loading ? 0.6 : 1,
              },
            ]}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" }}>
              {loading ? "Creating..." : "Create Account"}
            </Text>
          </Pressable>
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>OR</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>
          <Pressable
            onPress={onGoogleRegister}
            disabled={loading || googleLoading}
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: googleLoading ? 0.6 : 1 }]}
          >
            <Feather name="chrome" size={16} color={colors.foreground} />
            <Text style={[styles.altBtnText, { color: colors.foreground }]}>
              {googleLoading ? "Connecting Google..." : "Continue with Google"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={styles.signinLink}
          >
            <Text
              style={[
                styles.signinText,
                { color: colors.primary },
              ]}
            >
              Already have an account?{" "}
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: "Inter_700Bold",
                }}
              >
                Sign in
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: IS_SMALL ? 10 : 12,
    paddingTop: IS_SMALL ? 8 : 10,
    paddingBottom: IS_SMALL ? 8 : 10,
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: IS_SMALL ? 20 : 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 0,
  },
  sub: {
    fontSize: IS_SMALL ? 11 : 12,
    marginTop: 0,
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
  },
  formGroup: {
    marginTop: IS_SMALL ? 6 : 8,
    gap: 8,
  },
  createBtn: {
    marginTop: IS_SMALL ? 4 : 6,
  },
  signinLink: {
    marginTop: IS_SMALL ? 2 : 4,
    alignItems: "center",
    marginBottom: IS_SMALL ? 260 : 264,
  },
  signinText: {
    fontSize: IS_SMALL ? 11 : 12,
    fontFamily: "Inter_400Regular",
  },
  altBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: IS_SMALL ? 12 : 13,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: IS_SMALL ? 2 : 4,
  },
  line: { flex: 1, height: 1 },
  orText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 11,
  },
});
