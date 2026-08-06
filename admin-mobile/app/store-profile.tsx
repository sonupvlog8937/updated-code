import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { fetchDataFromApi, editData } from '@/utils/api';

export default function StoreProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userData } = useAuth();

  const s = styles(colors);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [moreInfo, setMoreInfo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['store-profile', userData?._id],
    queryFn: () => fetchDataFromApi(`/api/seller/profile/${userData?._id}`),
    enabled: !!userData?._id,
  });

  useEffect(() => {
    if (data?.storeProfile) {
      const p = data.storeProfile;
      setStoreName(p.storeName ?? '');
      setDescription(p.description ?? '');
      setLocation(p.location ?? '');
      setContactNo(p.contactNo ?? '');
      setMoreInfo(p.moreInfo ?? '');
      setStoreId(p._id ?? '');
    }
  }, [data]);

  const handleSave = async () => {
    if (!storeName.trim()) {
      Alert.alert('Validation', 'Store name is required');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaving(true);
    const payload = { storeName: storeName.trim(), description, location, contactNo, moreInfo };
    const res = storeId
      ? await editData(`/api/seller/profile/${storeId}`, payload)
      : await editData('/api/seller/profile', payload);
    setIsSaving(false);
    if (res?.error === false || res?.data || res?.storeProfile) {
      Alert.alert('Success', 'Store profile updated');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Error', res?.message ?? 'Failed to update store profile');
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
        <Text style={s.pageTitle}>Store Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[s.bannerCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
        <Feather name="store" size={24} color={colors.primary} />
        <View>
          <Text style={[s.bannerTitle, { color: colors.foreground }]}>Your Store Details</Text>
          <Text style={[s.bannerSub, { color: colors.mutedForeground }]}>This information is shown to customers</Text>
        </View>
      </View>

      <View style={s.card}>
        {[
          { label: 'Store Name *', value: storeName, setter: setStoreName, placeholder: 'My Awesome Store', icon: 'home' as const, multiline: false },
          { label: 'Contact Number', value: contactNo, setter: setContactNo, placeholder: '+91 98765 43210', icon: 'phone' as const, multiline: false },
          { label: 'Location', value: location, setter: setLocation, placeholder: '123 Main Street, City', icon: 'map-pin' as const, multiline: false },
        ].map((f) => (
          <View key={f.label} style={s.field}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <View style={s.inputWrap}>
              <Feather name={f.icon} size={15} color={colors.mutedForeground} />
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                placeholderTextColor={colors.mutedForeground}
                autoComplete="off"
              />
            </View>
          </View>
        ))}

        <View style={s.field}>
          <Text style={s.fieldLabel}>Description</Text>
          <View style={[s.inputWrap, { alignItems: 'flex-start', paddingTop: 10 }]}>
            <Feather name="file-text" size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            <TextInput
              style={[s.input, { color: colors.foreground, height: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell customers about your store..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.fieldLabel}>Additional Info</Text>
          <View style={[s.inputWrap, { alignItems: 'flex-start', paddingTop: 10 }]}>
            <Feather name="info" size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            <TextInput
              style={[s.input, { color: colors.foreground, height: 60, textAlignVertical: 'top' }]}
              value={moreInfo}
              onChangeText={setMoreInfo}
              placeholder="Opening hours, policies, etc."
              placeholderTextColor={colors.mutedForeground}
              multiline
            />
          </View>
        </View>

        <Pressable onPress={handleSave} disabled={isSaving} style={[s.saveBtn, isSaving && { opacity: 0.6 }]}>
          {isSaving
            ? <ActivityIndicator size="small" color="#fff" />
            : <><Feather name="check" size={16} color="#fff" /><Text style={s.saveBtnText}>Save Store Profile</Text></>}
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
    bannerCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 16, borderRadius: 14, borderWidth: 1,
    },
    bannerTitle: { fontSize: 14, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
    bannerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    card: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14,
    },
    field: { gap: 6 },
    fieldLabel: { fontSize: 12, fontWeight: '600' as const, color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.muted,
    },
    input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0, margin: 0 },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
    },
    saveBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#ffffff', fontFamily: 'Inter_700Bold' },
  });
