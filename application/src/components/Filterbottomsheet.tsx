import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Pressable, Animated, Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import FilterOptionModal from './Filteroptionmodal';

/* ── Price presets ── */
const PRICE_RANGES = [
  { label: 'Under ₹99',        min: 0,    max: 99    },
  { label: '₹99 – ₹199',      min: 99,   max: 199   },
  { label: '₹199 – ₹299',     min: 199,  max: 299   },
  { label: '₹299 – ₹499',     min: 299,  max: 499   },
  { label: '₹499 – ₹699',     min: 499,  max: 699   },
  { label: '₹699 – ₹999',     min: 699,  max: 999   },
  { label: '₹999 – ₹1,499',   min: 999,  max: 1499  },
  { label: '₹1,499 – ₹1,999', min: 1499, max: 1999  },
  { label: '₹1,999 – ₹2,999', min: 1999, max: 2999  },
  { label: '₹2,999 – ₹4,999', min: 2999, max: 4999  },
  { label: '₹4,999 – ₹9,999', min: 4999, max: 9999  },
  { label: 'Above ₹9,999',    min: 9999,  max: 60000 },
];

const DISCOUNT_BANDS = [
  { label: '10% & above', min: 10 },
  { label: '25% & above', min: 25 },
  { label: '40% & above', min: 40 },
  { label: '60% & above', min: 60 },
];

const RATING_STARS = [5, 4, 3, 2, 1];

/* ── Collapsible Section ── */
interface SectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, isOpen, onToggle, children }) => {
  const anim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: isOpen ? 1 : 0, duration: 220, useNativeDriver: false }).start();
  }, [isOpen]);

  return (
    <View style={sec.wrap}>
      <TouchableOpacity style={sec.head} onPress={onToggle} activeOpacity={0.7}>
        <Text style={sec.title}>{title}</Text>
        <View style={sec.arrow}>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={13} color="#9ca3af" />
        </View>
      </TouchableOpacity>
      <Animated.View style={{ overflow: 'hidden', maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }), opacity: anim }}>
        <View style={{ paddingTop: 8 }}>{children}</View>
      </Animated.View>
    </View>
  );
};

const sec = StyleSheet.create({
  wrap:  { borderBottomWidth: 1, borderBottomColor: '#f0f0f5', paddingVertical: 12 },
  head:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 },
  title: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: '#374151' },
  arrow: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8fb' },
});

/* ── Checkbox Row ── */
interface CheckRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  colorSwatch?: string | null;
}

const CheckRow: React.FC<CheckRowProps> = ({ label, checked, onToggle, colorSwatch }) => (
  <TouchableOpacity style={cr.row} onPress={onToggle} activeOpacity={0.7}>
    <View style={[cr.box, checked && cr.boxChecked]}>
      {checked && <Ionicons name="checkmark" size={11} color="#fff" />}
    </View>
    {colorSwatch ? <View style={[cr.swatch, { backgroundColor: colorSwatch }]} /> : null}
    <Text style={[cr.label, checked && cr.labelChecked]}>{label}</Text>
  </TouchableOpacity>
);
const cr = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 },
  box:          { width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: '#d1d5db', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  boxChecked:   { backgroundColor: '#0d0d12', borderColor: '#0d0d12' },
  label:        { fontSize: 13, fontWeight: '500', color: '#374151', flex: 1 },
  labelChecked: { color: '#0d0d12', fontWeight: '600' },
  swatch:       { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
});

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedBrands: string[];
  setSelectedBrands: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSizes: string[];
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedProductTypes: string[];
  setSelectedProductTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPriceRanges?: any[];
  setSelectedPriceRanges?: React.Dispatch<React.SetStateAction<any[]>>;
  selectedSaleOnly: boolean;
  setSelectedSaleOnly: React.Dispatch<React.SetStateAction<boolean>>;
  selectedStockStatus: string;
  setSelectedStockStatus: React.Dispatch<React.SetStateAction<string>>;
  selectedDiscountRanges: number[];
  setSelectedDiscountRanges: React.Dispatch<React.SetStateAction<number[]>>;
  selectedWeights: string[];
  setSelectedWeights: React.Dispatch<React.SetStateAction<string[]>>;
  selectedRamOptions: string[];
  setSelectedRamOptions: React.Dispatch<React.SetStateAction<string[]>>;
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  selectedRatingBands?: number[];
  setSelectedRatingBands?: React.Dispatch<React.SetStateAction<number[]>>;
  activeFiltersCount: number;
  onResetAllFilters: () => void;
  productsData: any;
  catData?: any[];
}

/* ── Dialog type — stores WHICH filter opened, not a selectedValues snapshot ── */
type DialogType = 'brand' | 'size' | 'type' | 'color' | 'weight' | 'ram' | null;

interface DialogMeta {
  type: DialogType;
  title: string;
  options: any[];
  getKey: (item: any) => any;
  getLabel: (item: any) => string;
  onApply: (values: any[]) => void;
}

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  selectedBrands,          setSelectedBrands,
  selectedSizes,           setSelectedSizes,
  selectedProductTypes,    setSelectedProductTypes,
  selectedSaleOnly,        setSelectedSaleOnly,
  selectedStockStatus,     setSelectedStockStatus,
  selectedDiscountRanges,  setSelectedDiscountRanges,
  selectedWeights,         setSelectedWeights,
  selectedRamOptions,      setSelectedRamOptions,
  selectedColors,          setSelectedColors,
  activeFiltersCount,
  onResetAllFilters,
  productsData,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  type SectionKey = 'category' | 'brand' | 'size' | 'type' | 'price' | 'sale' | 'color' | 'stock' | 'discount' | 'weight' | 'ram' | 'rating';
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    category: true, brand: true, size: true, type: true,
    price: true, sale: false, color: true, stock: false,
    discount: false, weight: false, ram: false, rating: true,
  });
  const toggle = (k: SectionKey) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(60000);
  const [activePricePreset, setActivePricePreset] = useState<number | null>(null);
  const [ratings, setRatings] = useState<number[]>([]);

  const filterOptions = productsData?.filterOptions || {};
  const products      = productsData?.products || [];
  const brands  = filterOptions.brands?.length       ? filterOptions.brands       : [...new Set(products.map((p: any) => p?.brand?.trim()).filter(Boolean))] as string[];
  const sizes   = filterOptions.sizes?.length        ? filterOptions.sizes        : [...new Set(products.flatMap((p: any) => p?.size || []).filter(Boolean))] as string[];
  const types   = filterOptions.productTypes?.length ? filterOptions.productTypes : [...new Set(products.map((p: any) => p?.productType || p?.thirdSubCatName || p?.catName).filter(Boolean))] as string[];
  const weights = filterOptions.weights?.length      ? filterOptions.weights      : [...new Set(products.flatMap((p: any) => p?.productWeight || []).filter(Boolean))] as string[];
  const ramOpts = filterOptions.ramOptions?.length   ? filterOptions.ramOptions   : [...new Set(products.flatMap((p: any) => p?.productRam || []).filter(Boolean))] as string[];

  const colorMap = new Map<string, string>();
  if (filterOptions.colors?.length) filterOptions.colors.forEach((n: string) => colorMap.set(n, ''));
  else products.forEach((p: any) => (p?.colorOptions || []).forEach((c: any) => { if (c?.name && !colorMap.has(c.name)) colorMap.set(c.name, c.code || ''); }));
  const colors = Array.from(colorMap, ([name, code]) => ({ name, code }));

  /* ── Dialog state: only stores WHICH filter to open, NOT selectedValues ── */
  const [dialogMeta, setDialogMeta] = useState<DialogMeta | null>(null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 80, friction: 12,
    }).start();
  }, [visible]);

  const totalProducts = productsData?.totalProducts || productsData?.total || 0;

  const multi = <T,>(arr: T[], setFn: React.Dispatch<React.SetStateAction<T[]>>, val: T) =>
    setFn(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  /* ── renderOptions: openDialog stores meta only, selectedValues fetched live ── */
  interface RenderOptionsParams<T> {
    dialogType: DialogType;
    title: string;
    options: T[];
    selectedValues: any[];
    onToggle: (item: T) => void;
    onApply: (values: any[]) => void;
    getKey: (item: T) => any;
    getLabel?: (item: T) => string;
    limit?: number;
  }

  const renderOptions = <T,>({
    dialogType, title, options, selectedValues,
    onToggle, onApply, getKey, getLabel, limit = 6,
  }: RenderOptionsParams<T>) => {
    const preview = options.slice(0, limit);
    const hasMore = options.length > limit;
    return (
      <>
        {preview.map((opt) => {
          const key = getKey(opt);
          return (
            <CheckRow
              key={String(key)}
              label={String(getLabel ? getLabel(opt) : key)}
              checked={selectedValues.includes(key)}
              onToggle={() => onToggle(opt)}
              colorSwatch={(opt as any)?.code || null}
            />
          );
        })}
        {hasMore && (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() =>
              setDialogMeta({
                type: dialogType,
                title,
                options,
                getKey,
                getLabel: (o: any) => String(getLabel ? getLabel(o) : getKey(o)),
                onApply,
              })
            }
          >
            <Text style={styles.moreBtnText}>+{options.length - limit} more</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  /* ── Derive LIVE selectedValues for the open dialog ── */
  const liveSelectedForDialog = (): any[] => {
    if (!dialogMeta) return [];
    switch (dialogMeta.type) {
      case 'brand':  return selectedBrands || [];
      case 'size':   return selectedSizes || [];
      case 'type':   return selectedProductTypes || [];
      case 'color':  return selectedColors || [];
      case 'weight': return selectedWeights || [];
      case 'ram':    return selectedRamOptions || [];
      default:       return [];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] }) }] },
        ]}
      >
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Filters</Text>
            {activeFiltersCount > 0 && (
              <Text style={styles.headerSub}>{activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {activeFiltersCount > 0 && (
              <TouchableOpacity style={styles.resetBtn} onPress={onResetAllFilters}>
                <MaterialIcons name="refresh" size={14} color="#E8362A" />
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total badge */}
        {totalProducts > 0 && (
          <View style={styles.totalBadge}>
            <View>
              <Text style={styles.totalNum}>{totalProducts.toLocaleString('en-IN')}</Text>
              <Text style={styles.totalLabel}>Total Products</Text>
            </View>
            <View style={styles.totalDot} />
          </View>
        )}

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Brand */}
          {brands.length > 0 && (
            <Section title="Brand" isOpen={open.brand} onToggle={() => toggle('brand')}>
              {renderOptions({
                dialogType: 'brand', title: 'Brand', options: brands,
                selectedValues: selectedBrands || [],
                onToggle: (b: string) => multi(selectedBrands, setSelectedBrands, b),
                onApply: (v: string[]) => setSelectedBrands(v),
                getKey: (b: string) => b, getLabel: (b: string) => b,
              })}
            </Section>
          )}

          {/* Size */}
          {sizes.length > 0 && (
            <Section title="Size" isOpen={open.size} onToggle={() => toggle('size')}>
              {renderOptions({
                dialogType: 'size', title: 'Size', options: sizes,
                selectedValues: selectedSizes || [],
                onToggle: (s: string) => multi(selectedSizes, setSelectedSizes, s),
                onApply: (v: string[]) => setSelectedSizes(v),
                getKey: (s: string) => s, getLabel: (s: string) => s,
              })}
            </Section>
          )}

          {/* Type */}
          {types.length > 0 && (
            <Section title="Type" isOpen={open.type} onToggle={() => toggle('type')}>
              {renderOptions({
                dialogType: 'type', title: 'Product Type', options: types,
                selectedValues: selectedProductTypes || [],
                onToggle: (t: string) => multi(selectedProductTypes, setSelectedProductTypes, t),
                onApply: (v: string[]) => setSelectedProductTypes(v),
                getKey: (t: string) => t, getLabel: (t: string) => t,
              })}
            </Section>
          )}

          {/* Price */}
          <Section title="Price" isOpen={open.price} onToggle={() => toggle('price')}>
            {activePricePreset !== null && (
              <View style={styles.activePriceTag}>
                <Text style={styles.activePriceText}>{PRICE_RANGES[activePricePreset]?.label}</Text>
                <TouchableOpacity onPress={() => { setActivePricePreset(null); setPriceMin(0); setPriceMax(60000); }}>
                  <Ionicons name="close" size={13} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {PRICE_RANGES.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.pricePreset, activePricePreset === i && styles.pricePresetActive]}
                  onPress={() => {
                    if (activePricePreset === i) { setActivePricePreset(null); setPriceMin(0); setPriceMax(60000); }
                    else { setActivePricePreset(i); setPriceMin(r.min); setPriceMax(r.max); }
                  }}
                >
                  <Text style={[styles.pricePresetText, activePricePreset === i && styles.pricePresetTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.sliderLabel}>Custom Range</Text>
            <View style={styles.priceVals}>
              <Text style={styles.priceVal}>₹{priceMin.toLocaleString('en-IN')}</Text>
              <Text style={styles.priceDash}>—</Text>
              <Text style={styles.priceVal}>₹{priceMax.toLocaleString('en-IN')}</Text>
            </View>
            <Slider
              minimumValue={0} maximumValue={60000} step={100} value={priceMin}
              onValueChange={(v) => { setPriceMin(Math.min(v, priceMax - 100)); setActivePricePreset(null); }}
              minimumTrackTintColor="#0d0d12" maximumTrackTintColor="#e8e8f0"
              thumbTintColor="#0d0d12" style={{ marginTop: 4 }}
            />
            <Slider
              minimumValue={0} maximumValue={60000} step={100} value={priceMax}
              onValueChange={(v) => { setPriceMax(Math.max(v, priceMin + 100)); setActivePricePreset(null); }}
              minimumTrackTintColor="#e8e8f0" maximumTrackTintColor="#0d0d12"
              thumbTintColor="#0d0d12"
            />
          </Section>

          {/* Color */}
          {colors.length > 0 && (
            <Section title="Colour" isOpen={open.color} onToggle={() => toggle('color')}>
              {renderOptions({
                dialogType: 'color', title: 'Colour', options: colors,
                selectedValues: selectedColors || [],
                onToggle: (c: { name: string; code: string }) => multi(selectedColors, setSelectedColors, c.name),
                onApply: (v: string[]) => setSelectedColors(v),
                getKey: (c: { name: string; code: string }) => c.name,
                getLabel: (c: { name: string; code: string }) => c.name,
              })}
            </Section>
          )}

          {/* Availability */}
          <Section title="Availability" isOpen={open.stock} onToggle={() => toggle('stock')}>
            <CheckRow label="In Stock" checked={selectedStockStatus === 'inStock'}
              onToggle={() => setSelectedStockStatus(selectedStockStatus === 'inStock' ? 'all' : 'inStock')} colorSwatch={null} />
            <CheckRow label="Out of Stock" checked={selectedStockStatus === 'outOfStock'}
              onToggle={() => setSelectedStockStatus(selectedStockStatus === 'outOfStock' ? 'all' : 'outOfStock')} colorSwatch={null} />
          </Section>

          {/* Discount */}
          <Section title="Discount" isOpen={open.discount} onToggle={() => toggle('discount')}>
            {DISCOUNT_BANDS.map((b) => (
              <CheckRow key={b.min} label={b.label}
                checked={(selectedDiscountRanges || []).includes(b.min)}
                onToggle={() => multi(selectedDiscountRanges, setSelectedDiscountRanges, b.min)}
                colorSwatch={null} />
            ))}
          </Section>

          {/* Offers */}
          <Section title="Offers" isOpen={open.sale} onToggle={() => toggle('sale')}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Sale Items Only</Text>
              <Switch value={selectedSaleOnly} onValueChange={setSelectedSaleOnly}
                trackColor={{ false: '#e8e8f0', true: '#0d0d12' }} thumbColor="#fff" />
            </View>
          </Section>

          {/* Weight */}
          {weights.length > 0 && (
            <Section title="Weight" isOpen={open.weight} onToggle={() => toggle('weight')}>
              {renderOptions({
                dialogType: 'weight', title: 'Weight', options: weights,
                selectedValues: selectedWeights || [],
                onToggle: (w: string) => multi(selectedWeights, setSelectedWeights, w),
                onApply: (v: string[]) => setSelectedWeights(v),
                getKey: (w: string) => w, getLabel: (w: string) => w,
              })}
            </Section>
          )}

          {/* RAM */}
          {ramOpts.length > 0 && (
            <Section title="RAM" isOpen={open.ram} onToggle={() => toggle('ram')}>
              {renderOptions({
                dialogType: 'ram', title: 'RAM', options: ramOpts,
                selectedValues: selectedRamOptions || [],
                onToggle: (r: string) => multi(selectedRamOptions, setSelectedRamOptions, r),
                onApply: (v: string[]) => setSelectedRamOptions(v),
                getKey: (r: string) => r, getLabel: (r: string) => r,
              })}
            </Section>
          )}

          {/* Rating */}
          <Section title="Rating" isOpen={open.rating} onToggle={() => toggle('rating')}>
            {RATING_STARS.map((star) => (
              <CheckRow key={star}
                label={`${'★'.repeat(star)}${'☆'.repeat(5 - star)}  & up`}
                checked={ratings.includes(star)}
                onToggle={() => setRatings((p) => p.includes(star) ? p.filter((x) => x !== star) : [...p, star])}
                colorSwatch={null} />
            ))}
          </Section>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.applyText}>Apply{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelFooterBtn} onPress={onClose}>
            <Ionicons name="close" size={14} color="#374151" />
            <Text style={styles.cancelFooterText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* FilterOptionModal — selectedValues fetched LIVE from state, never stale */}
      {dialogMeta && (
        <FilterOptionModal
          visible={Boolean(dialogMeta)}
          onClose={() => setDialogMeta(null)}
          title={dialogMeta.title}
          options={dialogMeta.options}
          selectedValues={liveSelectedForDialog()}   // ← always fresh
          onApplySelection={dialogMeta.onApply}
          getOptionKey={dialogMeta.getKey}
          getOptionLabel={dialogMeta.getLabel}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '88%', paddingTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 24,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0e0e8', alignSelf: 'center', marginBottom: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f5',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0d0d12' },
  headerSub:   { fontSize: 11, color: '#E8362A', fontWeight: '600', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(232,54,42,0.08)', borderWidth: 1, borderColor: 'rgba(232,54,42,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  resetText: { fontSize: 12, fontWeight: '600', color: '#E8362A' },
  closeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  totalBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginVertical: 10, padding: 10, borderRadius: 12, backgroundColor: '#0d0d12',
  },
  totalNum:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  totalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  totalDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8362A' },
  scroll:     { paddingHorizontal: 16 },
  moreBtn:    { paddingVertical: 4 },
  moreBtnText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  activePriceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0d0d12',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8,
  },
  activePriceText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  pricePreset: {
    marginRight: 6, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#e8e8f0', backgroundColor: '#f8f8fb',
  },
  pricePresetActive: { backgroundColor: '#f0f0fa', borderColor: '#c7c7ef' },
  pricePresetText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  pricePresetTextActive: { color: '#0d0d12', fontWeight: '700' },
  sliderLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6, marginBottom: 4 },
  priceVals:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  priceVal:   { backgroundColor: '#f8f8fb', borderWidth: 1, borderColor: '#e8e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '700', color: '#0d0d12' },
  priceDash:  { fontSize: 12, color: '#9ca3af' },
  switchRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchLabel: { fontSize: 13, fontWeight: '500', color: '#374151' },
  footer: {
    flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: '#f0f0f5',
  },
  applyBtn: {
    flex: 1, height: 46, borderRadius: 12, backgroundColor: '#0d0d12',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  applyText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cancelFooterBtn: {
    height: 46, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: '#f8f8fb', borderWidth: 1.5, borderColor: '#e8e8f0',
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  cancelFooterText: { fontSize: 13, fontWeight: '600', color: '#374151' },
});

export default FilterBottomSheet;