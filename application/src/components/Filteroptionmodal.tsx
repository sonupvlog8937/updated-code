import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Pressable,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface FilterOptionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options?: any[];
  selectedValues?: any[];
  onApplySelection: (values: any[]) => void;
  getOptionKey: (item: any) => any;
  getOptionLabel: (item: any) => string;
}

const FilterOptionModal: React.FC<FilterOptionModalProps> = ({
  visible,
  onClose,
  title,
  options = [],
  selectedValues = [],
  onApplySelection,
  getOptionKey,
  getOptionLabel,
}) => {
  const [query,      setQuery]      = useState<string>('');
  const [selections, setSelections] = useState<any[]>([]);

  useEffect(() => {
    if (visible) { setSelections(selectedValues || []); setQuery(''); }
  }, [visible, selectedValues]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((opt) => {
      const key = getOptionKey(opt);
      return String(key ?? '').toLowerCase().includes(q);
    });
  }, [query, options, getOptionKey]);

  const toggle = (key: any) =>
    setSelections((p) => p.includes(key) ? p.filter((x) => x !== key) : [...p, key]);

  const handleApply = () => { onApplySelection(selections); onClose(); };

  const selCount = selections.length;
  const totCount = options.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.hIcon}>
            <MaterialIcons name="filter-list" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hTitle}>{title}</Text>
            <Text style={styles.hSub}>{totCount} option{totCount !== 1 ? 's' : ''} available</Text>
          </View>
          <View style={styles.hRight}>
            {selCount > 0 && (
              <TouchableOpacity style={styles.clearAll} onPress={() => setSelections([])}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={15} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${title.toLowerCase()}…`}
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.searchClear}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Live count */}
        {query ? (
          <Text style={styles.resultCount}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
          </Text>
        ) : null}

        {/* Selected chips (when no search active) */}
        {selCount > 0 && !query && (
          <View style={styles.chips}>
            {selections.map((sel) => {
              const opt = options.find((o) => getOptionKey(o) === sel);
              if (!opt) return null;
              return (
                <TouchableOpacity
                  key={sel}
                  style={styles.chip}
                  onPress={() => toggle(sel)}
                >
                  <Text style={styles.chipText}>{String(getOptionKey(opt))}</Text>
                  <Ionicons name="close" size={10} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Options list */}
        <FlatList
          data={filtered}
          keyExtractor={(opt, i) => String(getOptionKey(opt) ?? i)}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No options match "{query}"</Text>
            </View>
          }
          renderItem={({ item: opt }) => {
            const key     = getOptionKey(opt);
            const checked = selections.includes(key);
            return (
              <TouchableOpacity
                style={[styles.optRow, checked && styles.optRowChecked]}
                onPress={() => toggle(key)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Ionicons name="checkmark" size={11} color="#fff" />}
                </View>
                <Text style={[styles.optLabel, checked && styles.optLabelChecked]}>
                  {String(getOptionKey(opt))}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Ionicons name="checkmark" size={15} color="#fff" />
            <Text style={styles.applyText}>Apply</Text>
            {selCount > 0 && (
              <View style={styles.selBadge}>
                <Text style={styles.selBadgeText}>{selCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#e0e0e8', alignSelf: 'center', marginBottom: 12,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f5',
  },
  hIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#0d0d12',
    alignItems: 'center', justifyContent: 'center',
  },
  hTitle: { fontSize: 15, fontWeight: '800', color: '#0d0d12' },
  hSub:   { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  hRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearAll: {
    backgroundColor: 'rgba(232,54,42,0.08)',
    borderWidth: 1, borderColor: 'rgba(232,54,42,0.2)',
    borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4,
  },
  clearAllText: { fontSize: 11, fontWeight: '600', color: '#E8362A' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: '#f9f9fc',
    borderWidth: 1.5, borderColor: '#e8e8f2', borderRadius: 11,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1, height: 40, fontSize: 13, color: '#1a1a2e',
  },
  searchClear: { padding: 4 },

  resultCount: {
    fontSize: 11, color: '#9ca3af',
    marginHorizontal: 16, marginBottom: 4,
  },

  chips: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingTop: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#0d0d12', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: '#fff' },

  list: { flex: 1, paddingHorizontal: 12, paddingTop: 6, marginBottom: 4 },

  optRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 11, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'transparent',
    marginBottom: 3,
  },
  optRowChecked: { backgroundColor: '#f0f0fa', borderColor: '#c7c7ef' },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    borderWidth: 2, borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#0d0d12', borderColor: '#0d0d12' },
  optLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: '#374151' },
  optLabelChecked: { color: '#0d0d12', fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  footer: {
    flexDirection: 'row', gap: 8,
    padding: 16, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: '#f0f0f5',
  },
  cancelBtn: {
    height: 44, paddingHorizontal: 18, borderRadius: 11,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  applyBtn: {
    flex: 1, height: 44, borderRadius: 11,
    backgroundColor: '#0d0d12',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  applyText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  selBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  selBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});

export default FilterOptionModal;