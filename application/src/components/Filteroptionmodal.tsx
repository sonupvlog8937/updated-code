import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_HEIGHT = Dimensions.get('window').height;

/* ── Types ── */
interface FilterOptionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: any[];
  selectedValues: any[];
  onApplySelection: (values: any[]) => void;
  getOptionKey: (item: any) => any;
  getOptionLabel: (item: any) => string;
}

/* ── Checkbox Row (internal) ── */
interface CheckRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  colorCode?: string | null;
}

const CheckRow: React.FC<CheckRowProps> = ({ label, checked, onToggle, colorCode }) => (
  <TouchableOpacity style={cr.row} onPress={onToggle} activeOpacity={0.65}>
    <View style={[cr.box, checked && cr.boxChecked]}>
      {checked && <Ionicons name="checkmark" size={11} color="#fff" />}
    </View>
    {colorCode ? <View style={[cr.swatch, { backgroundColor: colorCode }]} /> : null}
    <Text style={[cr.label, checked && cr.labelChecked]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const cr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 10,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  boxChecked: { backgroundColor: '#0d0d12', borderColor: '#0d0d12' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', flex: 1 },
  labelChecked: { color: '#0d0d12', fontWeight: '700' },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    flexShrink: 0,
  },
});

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const FilterOptionModal: React.FC<FilterOptionModalProps> = ({
  visible,
  onClose,
  title,
  options,
  selectedValues,
  onApplySelection,
  getOptionKey,
  getOptionLabel,
}) => {
  const [localSelected, setLocalSelected] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');

  // Always sync fresh from parent when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSelected([...(selectedValues || [])]);
      setSearchText('');
    }
  }, [visible]); // intentionally NOT depending on selectedValues to avoid stale closure

  const filteredOptions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) =>
      getOptionLabel(opt).toLowerCase().includes(q)
    );
  }, [searchText, options, getOptionLabel]);

  const toggleItem = (key: any) => {
    setLocalSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const handleApply = () => {
    onApplySelection(localSelected);
    onClose();
  };

  const handleClear = () => setLocalSelected([]);

  const selectedCount = localSelected.length;
  const hasSearch = options.length > 6;

  // Fixed heights so FlatList always gets explicit space in production
  const HEADER_H  = 56;
  const SEARCH_H  = hasSearch ? 58 : 0;
  const RESULTS_H = 32;
  const FOOTER_H  = Platform.OS === 'ios' ? 100 : 80;
  const HANDLE_H  = 20;
  const SHEET_MAX = SCREEN_HEIGHT * 0.82;
  const LIST_H    = SHEET_MAX - HEADER_H - SEARCH_H - RESULTS_H - FOOTER_H - HANDLE_H;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sheet — fixed height, never flex-grow */}
      <View style={[s.sheet, { height: SHEET_MAX }]}>

        {/* Handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={[s.header, { height: HEADER_H }]}>
          <View style={s.headerLeft}>
            <Text style={s.title} numberOfLines={1}>{title}</Text>
            {selectedCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{selectedCount}</Text>
              </View>
            )}
          </View>
          <View style={s.headerRight}>
            {selectedCount > 0 && (
              <TouchableOpacity style={s.clearBtn} onPress={handleClear}>
                <Text style={s.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        {hasSearch && (
          <View style={[s.searchWrap, { height: SEARCH_H }]}>
            <View style={s.searchInner}>
              <Ionicons name="search" size={15} color="#9ca3af" style={s.searchIcon} />
              <TextInput
                style={s.searchInput}
                placeholder={`Search ${title.toLowerCase()}…`}
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchText.length > 0 && Platform.OS === 'android' && (
                <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Results count */}
        <View style={[s.resultsRow, { height: RESULTS_H }]}>
          <Text style={s.resultsText}>
            {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''}
            {searchText ? ` for "${searchText}"` : ''}
          </Text>
        </View>

        {/* ── FlatList: explicit pixel height, never relies on flex ── */}
        {filteredOptions.length === 0 ? (
          <View style={[s.emptyWrap, { height: LIST_H }]}>
            <Ionicons name="search-outline" size={32} color="#d1d5db" />
            <Text style={s.emptyText}>No results found</Text>
            <Text style={s.emptySubText}>Try a different search term</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOptions}
            style={{ height: LIST_H }}       // ← explicit px height
            keyExtractor={(item, idx) => String(getOptionKey(item)) + idx}
            renderItem={({ item }) => {
              const key = getOptionKey(item);
              return (
                <CheckRow
                  label={getOptionLabel(item)}
                  checked={localSelected.includes(key)}
                  onToggle={() => toggleItem(key)}
                  colorCode={item?.code || null}
                />
              );
            }}
            ItemSeparatorComponent={() => <View style={s.separator} />}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}    // ← keeps all rows mounted
            initialNumToRender={20}
            maxToRenderPerBatch={30}
            windowSize={10}
          />
        )}

        {/* Footer */}
        <View style={[s.footer, { height: FOOTER_H }]}>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.applyBtn} onPress={handleApply}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={s.applyText}>
              Apply{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 28,
    overflow: 'hidden',   // clip rounded corners on Android
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e8',
    alignSelf: 'center',
    marginBottom: 10,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0d0d12',
    letterSpacing: 0.2,
  },
  badge: {
    backgroundColor: '#0d0d12',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(232,54,42,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,54,42,0.2)',
  },
  clearText: { fontSize: 12, fontWeight: '600', color: '#E8362A' },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Search */
  searchWrap: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8fb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e8e8f0',
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0d0d12',
    fontWeight: '500',
    paddingVertical: 0,
    height: 40,
  },

  /* Results */
  resultsRow: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8fb',
  },
  resultsText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  /* List */
  listContent: { paddingVertical: 4 },
  separator: {
    height: 1,
    backgroundColor: '#f8f8fb',
    marginHorizontal: 16,
  },

  /* Empty */
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 8 },
  emptySubText: { fontSize: 13, color: '#9ca3af' },

  /* Footer */
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f5',
    alignItems: 'flex-start',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f8f8fb',
    borderWidth: 1.5,
    borderColor: '#e8e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  applyBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0d0d12',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default FilterOptionModal;