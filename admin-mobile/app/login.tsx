import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = email.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    setIsLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.message ?? 'Login failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    // On success, _layout.tsx auth redirect handles navigation
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <LinearGradient
      colors={['#0c0e13', '#111827', '#0f172a']}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 32, paddingBottom: botPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Feather name="grid" size={28} color="#ffffff" />
          </View>
          <Text style={styles.logoTitle}>Admin Panel</Text>
          <Text style={styles.logoSubtitle}>Sign in to your account</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#991b1b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={16} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@example.com"
                placeholderTextColor="#6b7280"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#9ca3af" />
              </Pressable>
            </View>
          </View>

          {/* Forgot */}
          <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          {/* Submit */}
          <Pressable
            onPress={handleLogin}
            disabled={!isValid || isLoading}
            style={[styles.loginBtn, (!isValid || isLoading) && styles.loginBtnDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Feather name="arrow-right" size={16} color="#ffffff" />
              </>
            )}
          </Pressable>

          {/* Sign up link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupGray}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={styles.signupLink}>Create one</Text>
            </Pressable>
          </View>
        </View>

        {/* Security note */}
        <View style={styles.secNote}>
          <Feather name="shield" size={12} color="#4b5563" />
          <Text style={styles.secText}>Secured with SSL encryption</Text>
        </View>

        {/* API URL hint for dev */}
        {__DEV__ && (
          <Text style={styles.devHint}>
            API: {process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'}
            {'\n'}Set EXPO_PUBLIC_API_URL for your backend
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1d26',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a3148',
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontFamily: 'Inter_500Medium',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#d1d5db',
    fontFamily: 'Inter_600SemiBold',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1218',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputIcon: {},
  input: {
    flex: 1,
    fontSize: 15,
    color: '#f9fafb',
    fontFamily: 'Inter_400Regular',
    padding: 0,
    margin: 0,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 13,
    color: '#818cf8',
    fontFamily: 'Inter_500Medium',
  },
  loginBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupGray: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Inter_400Regular',
  },
  signupLink: {
    fontSize: 13,
    color: '#818cf8',
    fontFamily: 'Inter_600SemiBold',
  },
  secNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  secText: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Inter_400Regular',
  },
  devHint: {
    marginTop: 16,
    fontSize: 10,
    color: '#4b5563',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
});
