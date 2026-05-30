import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchUserDetails } from "@/src/store/appSlice";
import { editData, uploadImage } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

interface FormState {
  name: string;
  email: string;
  mobile: string;
  avatar: string;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const withOpacity = (color: string, opacity: number) => {
  if (!color) return color;

  if (color.startsWith("rgba(")) {
    const parts = color
      .replace("rgba(", "")
      .replace(")", "")
      .split(",")
      .map((part) => part.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${opacity})`;
    }
    return color;
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  }

  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex.slice(0, 6);
    const int = Number.parseInt(normalized, 16);
    if (Number.isNaN(int)) return color;
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
};

export default function MyProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((s) => s.app.userData);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [formState, setFormState] = useState<FormState>({
    name: userData?.name || "",
    email: userData?.email || "",
    mobile: String(userData?.mobile || ""),
    avatar: userData?.avatar || "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const primaryForeground = colors.primaryForeground || "#ffffff";

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    let completed = 0;
    if (formState.name) completed++;
    if (formState.email) completed++;
    if (formState.mobile) completed++;
    if (formState.avatar) completed++;
    return Math.round((completed / 4) * 100);
  };

  const profileCompletion = getProfileCompletion();

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const nameStr = String(formState.name || "").trim();
    const mobileStr = String(formState.mobile || "").trim();

    if (!nameStr) {
      newErrors.name = "Name is required";
    }
    if (!mobileStr) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(mobileStr.replace(/\D/g, ""))) {
      newErrors.mobile = "Mobile must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      showToast("error", "Failed to pick image");
    }
  };

  // Upload image
  const uploadProfileImage = async (uri: string) => {
    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("avatar", {
        uri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);

      const res = await uploadImage("/api/user/user-avatar", formData);

      if (res?.data?.avtar) {
        setFormState((prev) => ({
          ...prev,
          avatar: res.data.avtar,
        }));
        showToast("success", "Profile picture updated!");
        await dispatch(fetchUserDetails());
      } else {
        showToast("error", "Failed to upload image");
      }
    } catch (error) {
      showToast("error", "Error uploading image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save changes
  const saveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        name: formState.name,
        mobile: formState.mobile,
      };

      const res = await editData(`/api/user/${userData?._id}`, updateData);

      if (res?.error === false || res?.success === true) {
        showToast("success", res?.message || "Profile updated successfully!");
        await dispatch(fetchUserDetails());
        setIsEditing(false);
      } else {
        showToast("error", res?.message || "Failed to update profile");
      }
    } catch (error: any) {
      showToast("error", error?.message || "Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Change password
  const changePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await editData(`/api/user/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res?.error === false || res?.success === true) {
        showToast("success", res?.message || "Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
      } else {
        showToast("error", res?.message || "Failed to change password");
      }
    } catch (error: any) {
      showToast("error", error?.message || "Error changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setFormState({
      name: userData?.name || "",
      email: userData?.email || "",
      mobile: String(userData?.mobile || ""),
      avatar: userData?.avatar || "",
    });
    setErrors({});
    setIsEditing(false);
  };

  if (!userData) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView edges={["left", "right"]}>
          <View style={{ padding: 16, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView edges={["left", "right"]}>
            <View
              style={[
                styles.header,
                {
                  backgroundColor: colors.card,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={{ width: 40 }} />
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                My Profile
              </Text>
              <Pressable
                onPress={() => (isEditing ? cancelEdit() : setIsEditing(true))}
                style={styles.editHeaderBtn}
              >
                <Feather
                  name={isEditing ? "x" : "edit-3"}
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </SafeAreaView>

          <View style={{ padding: 16 }}>
            {/* Profile Overview Card */}
            <View
              style={[
                styles.overviewCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View style={{ position: "relative" }}>
                  <View
                    style={[
                      styles.avatarContainer,
                      {
                        backgroundColor: colors.accent,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {formState.avatar ? (
                      <Image
                        source={{ uri: formState.avatar }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text
                        style={[styles.avatarPlaceholder, { color: colors.primary }]}
                      >
                        {(formState.name || "?").charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {isEditing && (
                    <Pressable
                      onPress={pickImage}
                      disabled={isUploadingImage}
                      style={[
                        styles.avatarEditBtn,
                        { backgroundColor: colors.primary, borderColor: colors.card },
                      ]}
                    >
                      {isUploadingImage ? (
                        <ActivityIndicator color={primaryForeground} size={14} />
                      ) : (
                        <Feather name="camera" size={14} color={primaryForeground} />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                    marginBottom: 2,
                  }}
                >
                  {formState.name}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.success,
                    }}
                  />
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 12,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    Verified Member
                  </Text>
                </View>
              </View>

              {/* Profile Completion */}
              <View style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 12,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    Profile Completion
                  </Text>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 12,
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    {profileCompletion}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${profileCompletion}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 11,
                      fontFamily: "Inter_500Medium",
                      marginBottom: 4,
                    }}
                  >
                    Email
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 13,
                      fontFamily: "Inter_600SemiBold",
                    }}
                    numberOfLines={1}
                  >
                    {formState.email}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 11,
                      fontFamily: "Inter_500Medium",
                      marginBottom: 4,
                    }}
                  >
                    Phone
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 13,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    {formState.mobile}
                  </Text>
                </View>
              </View>
            </View>

            {/* Edit Profile Section */}
            {isEditing && (
              <View style={{ gap: 16, marginTop: 16 }}>
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_700Bold",
                      fontSize: 14,
                      marginBottom: 16,
                    }}
                  >
                    Edit Profile Information
                  </Text>

                  <FormField
                    label="Full Name"
                    icon="user"
                    value={formState.name}
                    editable={true}
                    onChangeText={(text) => {
                      setFormState((prev) => ({ ...prev, name: text }));
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    error={errors.name}
                    colors={colors}
                  />

                  <FormField
                    label="Email"
                    icon="mail"
                    value={formState.email}
                    editable={false}
                    onChangeText={() => {}}
                    error={undefined}
                    colors={colors}
                    disabled={true}
                    readOnly={true}
                  />

                  <FormField
                    label="Mobile Number"
                    icon="phone"
                    value={formState.mobile}
                    editable={true}
                    keyboardType="phone-pad"
                    onChangeText={(text) => {
                      setFormState((prev) => ({ ...prev, mobile: text }));
                      if (errors.mobile)
                        setErrors((prev) => ({ ...prev, mobile: "" }));
                    }}
                    error={errors.mobile}
                    colors={colors}
                  />

                  <View style={{ gap: 10, marginTop: 20 }}>
                    <PrimaryButton
                      title={isSaving ? "Saving..." : "Save Changes"}
                      onPress={saveChanges}
                      loading={isSaving}
                      fullWidth
                      size="lg"
                    />
                    <Pressable
                      onPress={cancelEdit}
                      disabled={isSaving}
                      style={[
                        styles.cancelBtn,
                        {
                          borderColor: colors.border,
                          opacity: isSaving ? 0.5 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 14,
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Info Sections */}
            {!isEditing && (
              <>
                {/* Change Password Button */}
                <Pressable
                  onPress={() => setShowPasswordModal(true)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 16,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="lock" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Change Password
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      Update your account security
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>

                {/* Manage Addresses */}
                <Pressable
                  onPress={() => router.push("/address" as never)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginTop: 10,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="map-pin" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Manage Addresses
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      View and edit your saved addresses
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>

                {/* Info Box */}
                <View
                  style={[
                    styles.infoSection,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.primary,
                      marginTop: 16,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather
                      name="alert-circle"
                      size={18}
                      color={primaryForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 13,
                      }}
                    >
                      Update your information
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      Keep your profile up-to-date for better service
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <View style={styles.modalOverlay}>
          <Pressable
            style={[
              styles.modalBackdrop,
              { backgroundColor: withOpacity(colors.foreground, 0.5) },
            ]}
            onPress={() => {
              setShowPasswordModal(false);
              setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setPasswordErrors({});
            }}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.foreground,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Change Password
              </Text>
              <Pressable
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordErrors({});
                }}
              >
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={{ gap: 16, marginTop: 20 }}>
              <PasswordField
                label="Current Password"
                value={passwordForm.currentPassword}
                onChangeText={(text) => {
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: text,
                  }));
                  if (passwordErrors.currentPassword)
                    setPasswordErrors((prev) => ({
                      ...prev,
                      currentPassword: "",
                    }));
                }}
                error={passwordErrors.currentPassword}
                colors={colors}
              />

              <PasswordField
                label="New Password"
                value={passwordForm.newPassword}
                onChangeText={(text) => {
                  setPasswordForm((prev) => ({ ...prev, newPassword: text }));
                  if (passwordErrors.newPassword)
                    setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
                }}
                error={passwordErrors.newPassword}
                colors={colors}
              />

              <PasswordField
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => {
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: text,
                  }));
                  if (passwordErrors.confirmPassword)
                    setPasswordErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                }}
                error={passwordErrors.confirmPassword}
                colors={colors}
              />
            </View>

            <View style={{ gap: 10, marginTop: 24 }}>
              <PrimaryButton
                title={isChangingPassword ? "Changing..." : "Change Password"}
                onPress={changePassword}
                loading={isChangingPassword}
                fullWidth
                size="lg"
              />
              <Pressable
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordErrors({});
                }}
                disabled={isChangingPassword}
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: colors.border,
                    opacity: isChangingPassword ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const PasswordField = ({
  label,
  value,
  onChangeText,
  error,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  colors: any;
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.field,
          {
            borderColor: error
              ? colors.destructive
              : isFocused
                ? colors.primary
                : colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <Feather
          name="lock"
          size={16}
          color={isFocused ? colors.primary : colors.mutedForeground}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={!showPassword}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Feather
            name={showPassword ? "eye-off" : "eye"}
            size={16}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>
      {error && (
        <Text
          style={{
            color: colors.destructive,
            fontSize: 12,
            marginTop: 4,
            fontFamily: "Inter_500Medium",
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const FormField = ({
  label,
  icon,
  value,
  editable,
  onChangeText,
  error,
  colors,
  disabled,
  keyboardType = "default",
  readOnly = false,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: string;
  editable: boolean;
  onChangeText: (text: string) => void;
  error?: string;
  colors: any;
  disabled?: boolean;
  keyboardType?: any;
  readOnly?: boolean;
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
          }}
        >
          {label}
        </Text>
        {readOnly && (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 10,
              fontFamily: "Inter_400Regular",
            }}
          >
            (Read-only)
          </Text>
        )}
      </View>
      <View
        style={[
          styles.field,
          {
            borderColor: error
              ? colors.destructive
              : isFocused
                ? colors.primary
                : colors.border,
            backgroundColor: readOnly
              ? colors.surfaceAlt
              : editable
                ? colors.card
                : colors.surfaceAlt,
            opacity: disabled || readOnly ? 0.6 : 1,
          },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={isFocused ? colors.primary : colors.mutedForeground}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable && !readOnly}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
        />
        {!editable ||
          (readOnly && (
            <Feather name="lock" size={14} color={colors.mutedForeground} />
          ))}
      </View>
      {error && (
        <Text
          style={{
            color: colors.destructive,
            fontSize: 12,
            marginTop: 4,
            fontFamily: "Inter_500Medium",
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  editHeaderBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  overviewCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholder: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
  },
  avatarEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    paddingVertical: 0,
  },
  cancelBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
