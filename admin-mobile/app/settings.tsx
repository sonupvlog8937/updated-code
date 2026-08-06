import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: topPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.pageTitle}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>API Configuration</Text>
        <View style={s.infoRow}>
          <Feather name="server" size={15} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={s.infoLabel}>API Base URL</Text>
            <Text style={s.infoValue} numberOfLines={2}>
              {process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'}
            </Text>
            <Text style={s.infoHint}>Set via EXPO_PUBLIC_API_URL environment variable</Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.infoRow}>
          <Feather name="info" size={15} color={colors.mutedForeground} />
          <View>
            <Text style={s.infoLabel}>Version</Text>
            <Text style={s.infoValue}>1.0.0</Text>
          </View>
        </View>
        <View style={[s.infoRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }]}>
          <Feather name="code" size={15} color={colors.mutedForeground} />
          <View>
            <Text style={s.infoLabel}>Platform</Text>
            <Text style={s.infoValue}>React Native (Expo)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, gap: 16, paddingBottom: 32 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    backBtn: { padding: 4 },
    pageTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold' },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.foreground, fontFamily: 'Inter_700Bold', marginBottom: 4 },
    infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    infoLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    infoValue: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_500Medium', marginTop: 2 },
    infoHint: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2, fontStyle: 'italic' },
  });
