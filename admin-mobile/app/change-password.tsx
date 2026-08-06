import React, { useState } from 'react';
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
import { postData } from '@/utils/api';

export default function ChangePasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userData } = useAuth();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const canSubmit = oldPwd.length > 0 && newPwd.length >= 6 && newPwd === confirmPwd;

  const handleChange = async () => {
    if (!canSubmit || isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaving(true);
    const res = await postData('/api/user/change-password', {
      email: userData?.email,
      oldPassword: oldPwd,
      newPassword: newPwd,
      confirmPassword: confirmPwd,
    });
    setIsSaving(false);
    if (res?.error === false) {
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
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
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.pageTitle}>Change Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.card}>
        {[
          { label: 'Current Password', value: oldPwd, setter: setOldPwd, show: showOld, toggleShow: () => setShowOld(v => !v) },
          { label: 'New Password', value: newPwd, setter: setNewPwd, show: showNew, toggleShow: () => setShowNew(v => !v), hint: 'Minimum 6 characters' },
          { label: 'Confirm New Password', value: confirmPwd, setter: setConfirmPwd, show: showNew, toggleShow: () => setShowNew(v => !v) },
        ].map((f, i) => (
          <View key={f.label} style={s.field}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <View style={s.inputWrap}>
              <Feather name="lock" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[s.input, { color: colors.foreground, flex: 1 }]}
                value={f.value}
                onChangeText={f.setter}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!f.show}
                autoComplete="off"
              />
              <Pressable onPress={f.toggleShow} hitSlop={8}>
                <Feather name={f.show ? 'eye-off' : 'eye'} size={15} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {f.hint && <Text style={s.hint}>{f.hint}</Text>}
            {i === 2 && confirmPwd.length > 0 && newPwd !== confirmPwd && (
              <Text style={[s.hint, { color: colors.destructive }]}>Passwords do not match</Text>
            )}
          </View>
        ))}

        <Pressable
          onPress={handleChange}
          disabled={!canSubmit || isSaving}
          style={[s.btn, (!canSubmit || isSaving) && { opacity: 0.5 }]}
        >
          {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.btnText}>Update Password</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, gap: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    backBtn: { padding: 4 },
    pageTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 },
    field: { gap: 6 },
    fieldLabel: { fontSize: 12, fontWeight: '600' as const, color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.muted,
    },
    input: { fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0, margin: 0 },
    hint: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    btn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
    btnText: { fontSize: 14, fontWeight: '700' as const, color: '#fff', fontFamily: 'Inter_700Bold' },
  });
