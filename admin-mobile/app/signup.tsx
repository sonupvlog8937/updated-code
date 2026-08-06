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

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleSignup = async () => {
    if (!isValid || isLoading) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    setIsLoading(true);

    const res = await postData('/api/user/signup', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      mobile: phone.trim(),
    });

    setIsLoading(false);

    if (res?.error === false) {
      Alert.alert('Account Created', 'Your account has been created. You can now sign in.', [
        { text: 'Sign In', onPress: () => router.replace('/login') },
      ]);
    } else {
      setError(res?.message ?? 'Registration failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <LinearGradient colors={['#0c0e13', '#111827', '#0f172a']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 24, paddingBottom: botPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#9ca3af" />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Feather name="user-plus" size={24} color="#ffffff" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in the details below to register</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#991b1b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {[
            { label: 'Full Name', value: name, onChange: setName, placeholder: 'John Doe', icon: 'user' as const, type: 'default' as const },
            { label: 'Email', value: email, onChange: setEmail, placeholder: 'john@example.com', icon: 'mail' as const, type: 'email-address' as const },
            { label: 'Phone (optional)', value: phone, onChange: setPhone, placeholder: '+1 234 567 8900', icon: 'phone' as const, type: 'phone-pad' as const },
          ].map(field => (
            <View key={field.label} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <View style={styles.inputWrap}>
                <Feather name={field.icon} size={16} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder={field.placeholder}
                  placeholderTextColor="#6b7280"
                  keyboardType={field.type}
                  autoCapitalize={field.type === 'default' ? 'words' : 'none'}
                  autoComplete={field.type === 'email-address' ? 'email' : 'off'}
                />
              </View>
            </View>
          ))}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color="#9ca3af" />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 characters"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
              <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#9ca3af" />
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <View style={[styles.inputWrap, confirmPassword.length > 0 && password !== confirmPassword && { borderColor: '#ef4444' }]}>
              <Feather name="lock" size={16} color="#9ca3af" />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
            </View>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.mismatch}>Passwords do not match</Text>
            )}
          </View>

          <Pressable
            onPress={handleSignup}
            disabled={!isValid || isLoading}
            style={[styles.btn, (!isValid || isLoading) && styles.btnDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.row}>
            <Text style={styles.gray}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/login')}>
              <Text style={styles.link}>Sign In</Text>
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
  subtitle: { fontSize: 13, color: '#6b7280', fontFamily: 'Inter_400Regular', marginTop: 4 },
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
  mismatch: { fontSize: 11, color: '#ef4444', fontFamily: 'Inter_400Regular' },
  btn: {
    backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: '700' as const, color: '#ffffff', fontFamily: 'Inter_700Bold' },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  gray: { fontSize: 13, color: '#6b7280', fontFamily: 'Inter_400Regular' },
  link: { fontSize: 13, color: '#818cf8', fontFamily: 'Inter_600SemiBold' },
});
