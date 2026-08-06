import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ScrollView, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { postData } from '@/utils/api';

type Step = 'email' | 'otp' | 'newPassword';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSendOtp = async () => {
    if (!email.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    setIsLoading(true);
    const res = await postData('/api/user/forgot-password', { email: email.trim().toLowerCase() });
    setIsLoading(false);
    if (res?.error === false) {
      setStep('otp');
    } else {
      setError(res?.message ?? 'Failed to send OTP. Check the email and try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4 || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    setIsLoading(true);
    const res = await postData('/api/user/verify-otp', { email: email.trim().toLowerCase(), otp });
    setIsLoading(false);
    if (res?.error === false) {
      setStep('newPassword');
    } else {
      setError(res?.message ?? 'Invalid or expired OTP. Please try again.');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6 || newPassword !== confirmPassword || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    setIsLoading(true);
    const res = await postData('/api/user/reset-password', {
      email: email.trim().toLowerCase(),
      otp,
      password: newPassword,
    });
    setIsLoading(false);
    if (res?.error === false) {
      Alert.alert('Password Reset', 'Your password has been reset successfully.', [
        { text: 'Sign In', onPress: () => router.replace('/login') },
      ]);
    } else {
      setError(res?.message ?? 'Failed to reset password. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#0c0e13', '#111827', '#0f172a']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 24, paddingBottom: botPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => (step === 'email' ? router.back() : setStep(step === 'otp' ? 'email' : 'otp'))} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#9ca3af" />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Feather name={step === 'newPassword' ? 'key' : step === 'otp' ? 'shield' : 'unlock'} size={24} color="#ffffff" />
          </View>
          <Text style={styles.title}>
            {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Enter OTP' : 'New Password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'Enter your email to receive a reset code'
              : step === 'otp'
              ? `We sent a code to ${email}`
              : 'Choose a strong new password'}
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#991b1b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === 'email' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <View style={styles.inputWrap}>
                  <Feather name="mail" size={16} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="admin@example.com"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>
              <Pressable onPress={handleSendOtp} disabled={!email.trim() || isLoading} style={[styles.btn, (!email.trim() || isLoading) && styles.btnDisabled]}>
                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Send Reset Code</Text>}
              </Pressable>
            </>
          )}

          {step === 'otp' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>One-time code</Text>
                <View style={styles.inputWrap}>
                  <Feather name="hash" size={16} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="123456"
                    placeholderTextColor="#6b7280"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>
              <Pressable onPress={handleVerifyOtp} disabled={otp.length < 4 || isLoading} style={[styles.btn, (otp.length < 4 || isLoading) && styles.btnDisabled]}>
                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Verify Code</Text>}
              </Pressable>
              <Pressable onPress={handleSendOtp} style={styles.resend}>
                <Text style={styles.resendText}>Resend code</Text>
              </Pressable>
            </>
          )}

          {step === 'newPassword' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>New password</Text>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={16} color="#9ca3af" />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    autoComplete="new-password"
                  />
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <View style={[styles.inputWrap, newPassword !== confirmPassword && confirmPassword.length > 0 && { borderColor: '#ef4444' }]}>
                  <Feather name="lock" size={16} color="#9ca3af" />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    autoComplete="new-password"
                  />
                </View>
              </View>
              <Pressable
                onPress={handleResetPassword}
                disabled={newPassword.length < 6 || newPassword !== confirmPassword || isLoading}
                style={[styles.btn, (newPassword.length < 6 || newPassword !== confirmPassword || isLoading) && styles.btnDisabled]}
              >
                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Reset Password</Text>}
              </Pressable>
            </>
          )}

          <View style={styles.row}>
            <Pressable onPress={() => router.replace('/login')}>
              <Text style={styles.link}>Back to Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24 },
  backBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 16 },
  header: { alignItems: 'center', marginBottom: 28 },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800' as const, color: '#ffffff', fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#6b7280', fontFamily: 'Inter_400Regular', marginTop: 6, textAlign: 'center', maxWidth: 280 },
  card: {
    width: '100%', maxWidth: 400, backgroundColor: '#1a1d26',
    borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#2a3148', gap: 14,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fee2e2', borderRadius: 10, padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#991b1b', fontFamily: 'Inter_500Medium' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' as const, color: '#d1d5db', fontFamily: 'Inter_600SemiBold' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1218',
    borderRadius: 12, borderWidth: 1, borderColor: '#374151', paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: '#f9fafb', fontFamily: 'Inter_400Regular', padding: 0, margin: 0 },
  btn: {
    backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: '700' as const, color: '#ffffff', fontFamily: 'Inter_700Bold' },
  resend: { alignSelf: 'center' },
  resendText: { fontSize: 13, color: '#818cf8', fontFamily: 'Inter_500Medium' },
  row: { alignItems: 'center' },
  link: { fontSize: 13, color: '#818cf8', fontFamily: 'Inter_600SemiBold' },
});
