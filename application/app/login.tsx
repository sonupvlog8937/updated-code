import { Feather } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
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
import { auth } from "@/src/utils/firebase";
import { showToast } from "@/src/utils/toast";

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");
const IS_SMALL = width < 375;

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
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

  const completeGoogleLogin = async (firebaseUser: any) => {
    const idToken = await firebaseUser.getIdToken();
    const providerProfile = firebaseUser.providerData?.[0] || {};
    const fields = {
      name: providerProfile.displayName || firebaseUser.displayName || "Google User",
      email: providerProfile.email || firebaseUser.email,
      password: null,
      avatar: providerProfile.photoURL || firebaseUser.photoURL,
      mobile: providerProfile.phoneNumber || firebaseUser.phoneNumber,
      role: "USER",
      firebaseUid: firebaseUser.uid,
      idToken,
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
  };

  const onGoogleLogin = async () => {
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

      await completeGoogleLogin(firebaseResult.user);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      showToast("error", error?.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };


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
        showToast(res?.message || "Login failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }, 300);
  };

  const handlePasswordFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 50,
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
            Welcome back
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Sign in to continue shopping
          </Text>

          <View style={styles.formGroup}>
            <Text
              style={[
                styles.altBtnText,
                { color: colors.foreground },
              ]}
            >
              Enter your email
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
              Enter your password
            </Text>
            <Field
              icon="lock"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              rightIcon={showPwd ? "eye-off" : "eye"}
              onRightPress={() => setShowPwd((v) => !v)}
              editable={!loading}
              onFocus={handlePasswordFocus}
            />
            <Pressable onPress={() => router.push("/forgot-password" as never)}>
              <Text
                style={[
                  styles.forgotLink,
                  { color: colors.primary },
                ]}
              >
                Forgot password?
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onLogin}
            disabled={loading}
            style={[
              styles.signInBtn,
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
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View
              style={[styles.line, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>
              OR
            </Text>
            <View
              style={[styles.line, { backgroundColor: colors.border }]}
            />
          </View>

          <Pressable
            onPress={onGoogleLogin}
            disabled={loading || googleLoading}
            style={[
              styles.altBtn,
               { borderColor: colors.border, backgroundColor: colors.card, opacity: googleLoading ? 0.6 : 1 },
            ]}
          >
             <Feather name="chrome" size={16} color={colors.foreground} />
            <Text
              style={[
                styles.altBtnText,
                { color: colors.foreground },
              ]}
            >
               {googleLoading ? "Connecting Google..." : "Continue with Google"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/register" as never)}
            style={styles.signupLink}
          >
            <Text
              style={[
                styles.signupText,
                { color: colors.primary },
              ]}
            >
              Don't have an account?{" "}
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: "Inter_700Bold",
                }}
              >
                Sign up
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  icon: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
  onFocus?: (e?: any) => void;
}

export const Field: React.FC<FieldProps> = ({
  icon,
  rightIcon,
  onRightPress,
  onFocus,
  ...rest
}) => {
  const colors = useColors();
  return (
    <View
      style={[
        styles.field,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        {...rest}
        onFocus={onFocus}
        style={[
          styles.input,
          { color: colors.foreground },
          rest.style,
        ]}
      />
      {rightIcon ? (
        <Pressable onPress={onRightPress} hitSlop={8}>
          <Feather name={rightIcon} size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
};

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
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    height: IS_SMALL ? 42 : 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: IS_SMALL ? 12 : 13,
    fontFamily: "Inter_500Medium",
    paddingVertical: 0,
  },
  forgotLink: {
    textAlign: "right",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginTop: 0,
  },
  signInBtn: {
    marginTop: IS_SMALL ? 4 : 6,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: IS_SMALL ? 4 : 6,
  },
  line: { flex: 1, height: 0.8 },
  orText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  altBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: IS_SMALL ? 8 : 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  altBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: IS_SMALL ? 12 : 13,
  },
  signupLink: {
    marginTop: IS_SMALL ? 2 : 4,
    marginBottom: IS_SMALL ? 260 : 264,
    alignItems: "center",
  },
  signupText: {
    fontSize: IS_SMALL ? 11 : 12,
    fontFamily: "Inter_400Regular",
  },
});
