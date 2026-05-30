import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Field } from "@/app/login";
import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/src/components/EmptyState";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { logoutUser } from "@/src/store/appSlice";
import { deleteData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((s) => s.app.userData);
  const isLogin = useAppSelector((s) => s.app.isLogin);
  const [name, setName] = useState(userData?.name || "");
  const [mobile, setMobile] = useState(userData?.mobile || "");

  if (!isLogin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="settings"
          title="Sign in to manage your account"
          ctaTitle="Sign In"
          onCta={() => router.push("/login" as never)}
        />
      </View>
    );
  }

  const onDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently removes your account and all associated data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteData(`/api/user/delete-account`);
            if (res?.error === false) {
              showToast("success", "Account deleted");
              dispatch(logoutUser());
            } else {
              showToast("error", res?.message || "Failed");
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={[styles.section, { color: colors.foreground }]}>
          Profile
        </Text>
        <View style={{ gap: 12 }}>
          <Field icon="user" value={name} onChangeText={setName} placeholder="Full name" />
          <Field
            icon="mail"
            value={userData?.email || ""}
            placeholder="Email"
            editable={false}
          />
          <Field
            icon="phone"
            value={mobile}
            onChangeText={setMobile}
            placeholder="Mobile"
            keyboardType="phone-pad"
          />
        </View>
        <PrimaryButton
          title="Save Changes"
          onPress={() => showToast("success", "Profile saved")}
          fullWidth
          size="md"
          style={{ marginTop: 14 }}
        />

        <Text style={[styles.section, { color: colors.foreground, marginTop: 28 }]}>
          Preferences
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <RowLink
            icon="bell"
            label="Notification Preferences"
            onPress={() => router.push("/notification-settings" as never)}
          />
          <RowLink
            icon="shield"
            label="Privacy Policy"
            onPress={() => router.push("/privacy-policy" as never)}
          />
        </View>

        <Pressable
          onPress={onDeleteAccount}
          style={[styles.dangerBtn, { borderColor: colors.destructive }]}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
          <Text
            style={{
              color: colors.destructive,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Delete account
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const RowLink = ({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        { borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Feather name={icon} size={18} color={colors.foreground} />
      <Text style={{ flex: 1, color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }}>
        {label}
      </Text>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  section: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
