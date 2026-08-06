import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { editData, postData } from '@/utils/api';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userData, setUserData } = useAuth();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [name, setName] = useState(userData?.name ?? '');
  const [email, setEmail] = useState(userData?.email ?? '');
  const [mobile, setMobile] = useState(userData?.mobile ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [showPwdSection, setShowPwdSection] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name ?? '');
      setEmail(userData.email ?? '');
      setMobile(userData.mobile ?? '');
    }
  }, [userData]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation', 'Name and email are required');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaving(true);
    const res = await editData(`/api/user/${userData?._id}`, { name: name.trim(), email: email.trim(), mobile: mobile.trim() });
    setIsSaving(false);
    if (res?.error === false || res?.data) {
      setUserData({ ...userData!, name: name.trim(), email: email.trim(), mobile: mobile.trim() });
      Alert.alert('Success', 'Profile updated successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Error', res?.message ?? 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || newPassword !== confirmPassword) {
      Alert.alert('Validation', 'Please fill all fields and make sure passwords match');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsChangingPwd(true);
    const res = await postData('/api/user/change-password', {
      email: userData?.email,
      oldPassword,
      newPassword,
      confirmPassword,
    });
    setIsChangingPwd(false);
    if (res?.error === false) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPwdSection(false);
      Alert.alert('Success', 'Password changed successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Error', res?.message ?? 'Failed to change password');
    }
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: topPad, paddingBottom: botPad + 32 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.pageTitle}>My Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={[s.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[s.avatarInitial, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
            {(userData?.name ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={s.avatarName}>{userData?.name ?? 'User'}</Text>
        <View style={[s.rolePill, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[s.roleText, { color: colors.primary }]}>
            {(userData?.role ?? '').replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Profile Form */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Profile Information</Text>

        {[
          { label: 'Full Name', value: name, setter: setName, icon: 'user' as const, type: 'default' as const, cap: 'words' as const },
          { label: 'Email Address', value: email, setter: setEmail, icon: 'mail' as const, type: 'email-address' as const, cap: 'none' as const },
          { label: 'Phone Number', value: mobile, setter: setMobile, icon: 'phone' as const, type: 'phone-pad' as const, cap: 'none' as const },
        ].map((f) => (
          <View key={f.label} style={s.field}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <View style={s.inputWrap}>
              <Feather name={f.icon} size={15} color={colors.mutedForeground} />
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={f.value}
                onChangeText={f.setter}
                keyboardType={f.type}
                autoCapitalize={f.cap}
                autoComplete="off"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
        ))}

        <Pressable onPress={handleSave} disabled={isSaving} style={[s.saveBtn, isSaving && { opacity: 0.6 }]}>
          {isSaving
            ? <ActivityIndicator size="small" color="#fff" />
            : <><Feather name="check" size={16} color="#fff" /><Text style={s.saveBtnText}>Save Changes</Text></>}
        </Pressable>
      </View>

      {/* Change Password */}
      <View style={s.card}>
        <Pressable style={s.pwdToggleRow} onPress={() => setShowPwdSection((v) => !v)}>
          <View style={s.pwdToggleLeft}>
            <Feather name="lock" size={16} color={colors.primary} />
            <Text style={[s.cardTitle, { marginBottom: 0 }]}>Change Password</Text>
          </View>
          <Feather name={showPwdSection ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
        </Pressable>

        {showPwdSection && (
          <>
            {[
              { label: 'Current Password', value: oldPassword, setter: setOldPassword, placeholder: '••••••••' },
              { label: 'New Password', value: newPassword, setter: setNewPassword, placeholder: 'Min 6 characters' },
              { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Repeat new password' },
            ].map((f) => (
              <View key={f.label} style={s.field}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={s.inputWrap}>
                  <Feather name="lock" size={15} color={colors.mutedForeground} />
                  <TextInput
                    style={[s.input, { color: colors.foreground, flex: 1 }]}
                    value={f.value}
                    onChangeText={f.setter}
                    secureTextEntry
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    autoComplete="off"
                  />
                </View>
                {f.label === 'Confirm New Password' && confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <Text style={s.mismatch}>Passwords do not match</Text>
                )}
              </View>
            ))}

            <Pressable
              onPress={handleChangePassword}
              disabled={isChangingPwd || !oldPassword || !newPassword || newPassword !== confirmPassword}
              style={[s.saveBtn, { backgroundColor: colors.accent }, (isChangingPwd || !oldPassword || !newPassword || newPassword !== confirmPassword) && { opacity: 0.5 }]}
            >
              {isChangingPwd
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveBtnText}>Update Password</Text>}
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, gap: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    backBtn: { padding: 4 },
    pageTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 8 },
    avatar: {
      width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
    },
    avatarInitial: { fontSize: 32 },
    avatarName: { fontSize: 20, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    rolePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    roleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
    card: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14,
    },
    cardTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold', marginBottom: 4 },
    field: { gap: 6 },
    fieldLabel: { fontSize: 12, fontWeight: '600' as const, color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.muted,
    },
    input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0, margin: 0 },
    mismatch: { fontSize: 11, color: colors.destructive, fontFamily: 'Inter_400Regular' },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    saveBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#ffffff', fontFamily: 'Inter_700Bold' },
    pwdToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pwdToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  });
