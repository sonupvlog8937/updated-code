import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Pressable, ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export const SORT_OPTIONS = [
  { value: 'bestseller', label: 'Best Seller',      emoji: '🏆' },
  { value: 'latest',     label: 'Latest',            emoji: '🆕' },
  { value: 'popular',    label: 'Most Popular',      emoji: '⭐' },
  { value: 'featured',   label: 'Featured',          emoji: '🎖️' },
  { value: 'priceAsc',   label: 'Price: Low → High', emoji: '💰' },
  { value: 'priceDesc',  label: 'Price: High → Low', emoji: '💰' },
  { value: 'nameAsc',    label: 'Name: A → Z',       emoji: '🔤' },
  { value: 'nameDesc',   label: 'Name: Z → A',       emoji: '🔤' },
];

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSortType: string;
  onSelect: (value: string, label: string) => void;
}

const SortModal: React.FC<SortModalProps> = ({ visible, onClose, selectedSortType, onSelect }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <Pressable style={styles.backdrop} onPress={onClose} />
    <View style={styles.sheet}>
      {/* Handle bar */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="sort" size={18} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Sort By</Text>
          <Text style={styles.headerSub}>Choose how to sort products</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Options */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {SORT_OPTIONS.map((opt) => {
          const isActive = selectedSortType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, isActive && styles.optionActive]}
              onPress={() => { onSelect(opt.value, opt.label); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={[styles.optLabel, isActive && styles.optLabelActive]}>
                {opt.label}
              </Text>
              {isActive && (
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8,
    maxHeight: '70%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#e0e0e8', alignSelf: 'center', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f5',
  },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#0d0d12',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0d0d12' },
  headerSub:   { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  closeBtn: {
    marginLeft: 'auto', width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },

  list: { paddingHorizontal: 12, paddingTop: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    marginBottom: 4,
  },
  optionActive: { backgroundColor: '#f0f0fa', borderColor: '#c7c7ef' },
  emoji: { fontSize: 18, width: 26, textAlign: 'center' },
  optLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#374151' },
  optLabelActive: { color: '#0d0d12', fontWeight: '700' },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#0d0d12',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default SortModal;