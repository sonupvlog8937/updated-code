import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";

import { useColors } from "@/hooks/useColors";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchUserDetails } from "@/src/store/appSlice";
import { postData, editData, fetchDataFromApi } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type AddressType = "Home" | "Work" | "Office" | "Other";

const ADDRESS_TYPES: {
  label: AddressType;
  icon: keyof typeof Feather.glyphMap;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    label: "Home",
    icon: "home",
    activeColor: "#1D4ED8",
    activeBg: "#EFF6FF",
    activeBorder: "#3B82F6",
  },
  {
    label: "Work",
    icon: "briefcase",
    activeColor: "#6D28D9",
    activeBg: "#F5F3FF",
    activeBorder: "#8B5CF6",
  },
  {
    label: "Office",
    icon: "monitor",
    activeColor: "#15803D",
    activeBg: "#F0FDF4",
    activeBorder: "#22C55E",
  },
  {
    label: "Other",
    icon: "map-pin",
    activeColor: "#C2410C",
    activeBg: "#FFF7ED",
    activeBorder: "#F97316",
  },
];

// ─── Reusable Input Field ─────────────────────────────────────────────────────

interface StyledInputProps {
  label: string;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  keyboardType?: "default" | "number-pad" | "phone-pad" | "email-address";
  onFocus?: () => void;
  optional?: boolean;
  maxLength?: number;
}

const StyledInput: React.FC<StyledInputProps> = ({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  onFocus,
  optional = false,
  maxLength,
}) => {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "#EF4444"
    : focused
    ? "#3B82F6"
    : colors.border;

  const bgColor = error
    ? "#FFF5F5"
    : focused
    ? colors.background
    : colors.muted;

  return (
    <View>
      {/* Label row */}
      <View style={styles.labelRow}>
        <View
          style={[
            styles.labelIconWrap,
            { backgroundColor: error ? "#FEE2E2" : "#DBEAFE" },
          ]}
        >
          <Feather
            name={icon}
            size={11}
            color={error ? "#EF4444" : "#3B82F6"}
          />
        </View>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {optional && (
          <Text style={[styles.optionalTag, { color: colors.mutedForeground }]}>
            optional
          </Text>
        )}
        {!optional && (
          <Text style={{ color: "#EF4444", fontSize: 12, marginLeft: 2 }}>*</Text>
        )}
      </View>

      {/* Input wrapper */}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: bgColor,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        <Feather
          name={icon}
          size={15}
          color={focused ? "#3B82F6" : colors.mutedForeground}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.textInput, { color: colors.foreground }]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => setFocused(false)}
        />
        {value.length > 0 && !error && (
          <Feather name="check" size={14} color="#22C55E" style={styles.checkIcon} />
        )}
      </View>

      {/* Error message */}
      {error ? (
        <View style={styles.errorBadge}>
          <Feather name="alert-circle" size={11} color="#991B1B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

// ─── Section Divider ──────────────────────────────────────────────────────────

const SectionDivider = ({
  label,
  colors,
}: {
  label: string;
  colors: any;
}) => (
  <></>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddAddressScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const userData = useAppSelector((s) => s.app.userData);
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const mode = (params?.mode as string) || "add";
  const addressId = params?.addressId as string;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [addressType, setAddressType] = useState<AddressType>("Home");
  const [line1, setLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [mobile, setMobile] = useState("");

  // ── Location state ──────────────────────────────────────────────────────────
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // ── Load existing address (edit mode) ───────────────────────────────────────
  useEffect(() => {
    if (mode === "edit" && addressId) {
      loadAddressData(addressId);
    }
  }, [mode, addressId]);

  const loadAddressData = async (id: string) => {
    try {
      const res = await fetchDataFromApi(`/api/address/${id}`);
      if (res?.address) {
        const a = res.address;
        setLine1(a.address_line1 || "");
        setCity(a.city || "");
        setState(a.state || "");
        setPincode(String(a.pincode || ""));
        setCountry(a.country || "India");
        setMobile(String(a.mobile || ""));
        setLandmark(a.landmark || "");
        setAddressType(a.addressType || "Home");
        setLatitude(a.latitude ?? null);
        setLongitude(a.longitude ?? null);
      }
    } catch {
      showToast("error", "Failed to load address");
      router.back();
    } finally {
      setLoadingForm(false);
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!line1.trim()) e.line1 = "Please enter your address";
    if (!city.trim()) e.city = "Please enter your city";
    if (!state.trim()) e.state = "Please enter your state";
    if (!pincode.trim()) e.pincode = "Please enter pincode";
    else if (!/^\d{6}$/.test(pincode.replace(/\D/g, "")))
      e.pincode = "Pincode must be exactly 6 digits";
    if (!mobile.trim()) e.mobile = "Please enter mobile number";
    else if (!/^\d{10}$/.test(mobile.replace(/\D/g, "")))
      e.mobile = "Mobile number must be 10 digits";
    if (!latitude || !longitude) e.location = "Please capture your location first";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const onSave = async () => {
    if (!validate()) {
      showToast("error", "Please enter your all fields");
      return;
    }
    setLoading(true);
    try {
      const body = {
        address_line1: line1,
        city,
        state,
        pincode,
        country,
        mobile,
        landmark,
        addressType,
        userId: userData?._id,
        latitude,
        longitude,
      };
      const endpoint =
        mode === "edit" ? `/api/address/${addressId}` : "/api/address/add";
      const res =
        mode === "edit"
          ? await editData(endpoint, body)
          : await postData(endpoint, body);

      if (res?.error === false || res?.success === true) {
        showToast(
          "success",
          mode === "edit" ? "Address updated" : "Address added"
        );
        await dispatch(fetchUserDetails());
        router.back();
      } else {
        showToast("error", res?.message || "Failed to save address");
      }
    } catch (err: any) {
      showToast("error", err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Location capture ─────────────────────────────────────────────────────────
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        showToast("error", "Please enable location services on your device");
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setShowPermissionModal(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setErrors((prev) => ({ ...prev, location: "" }));
      showToast("success", "Location captured");
    } catch (err: any) {
      showToast("error", err?.message || "Unable to get location");
    } finally {
      setLocationLoading(false);
    }
  };

  // ── Scroll helper ────────────────────────────────────────────────────────────
  const scrollTo = (y: number) => {
    setTimeout(() => scrollViewRef.current?.scrollTo({ y, animated: true }), 300);
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loadingForm) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading address…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Active type config ───────────────────────────────────────────────────────
  const activeType = ADDRESS_TYPES.find((t) => t.label === addressType)!;

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Page Header ──────────────────────────────────────────────────── */}
          <View style={styles.pageHeader}>
            <View
              style={[styles.pageHeaderIconWrap, { backgroundColor: colors.accent }]}
            >
              <Feather name="map-pin" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>
                {mode === "add" ? "Add new address" : "Edit address"}
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
                {mode === "add"
                  ? "Where should we deliver?"
                  : "Update your delivery details"}
              </Text>
            </View>
          </View>

          {/* ── Address Type ─────────────────────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Address type
            </Text>
            <View style={styles.typeRow}>
              {ADDRESS_TYPES.map((t) => {
                const selected = t.label === addressType;
                return (
                  <Pressable
                    key={t.label}
                    onPress={() => setAddressType(t.label)}
                    style={[
                      styles.typeChip,
                      selected
                        ? {
                            backgroundColor: t.activeBg,
                            borderColor: t.activeBorder,
                            borderWidth: 1.5,
                          }
                        : {
                            backgroundColor: colors.muted,
                            borderColor: colors.border,
                            borderWidth: 1,
                          },
                    ]}
                  >
                    <Feather
                      name={t.icon}
                      size={13}
                      color={selected ? t.activeColor : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: selected ? t.activeColor : colors.foreground },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Address Details ───────────────────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Address details
            </Text>

            <View style={styles.fieldStack}>
              <StyledInput
                label="Address line"
                placeholder="House / flat no., street name"
                icon="map-pin"
                value={line1}
                onChangeText={(v) => {
                  setLine1(v);
                  if (errors.line1) setErrors((p) => ({ ...p, line1: "" }));
                }}
                error={errors.line1}
                onFocus={() => scrollTo(0)}
              />

              <StyledInput
                label="Landmark"
                placeholder="Nearby school, temple, market…"
                icon="navigation"
                value={landmark}
                onChangeText={setLandmark}
                optional
                onFocus={() => scrollTo(80)}
              />

              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <StyledInput
                    label="City"
                    placeholder="City"
                    icon="map"
                    value={city}
                    onChangeText={(v) => {
                      setCity(v);
                      if (errors.city) setErrors((p) => ({ ...p, city: "" }));
                    }}
                    error={errors.city}
                    onFocus={() => scrollTo(160)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledInput
                    label="State"
                    placeholder="State"
                    icon="map"
                    value={state}
                    onChangeText={(v) => {
                      setState(v);
                      if (errors.state) setErrors((p) => ({ ...p, state: "" }));
                    }}
                    error={errors.state}
                    onFocus={() => scrollTo(160)}
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <StyledInput
                    label="Pincode"
                    placeholder="6-digit code"
                    icon="hash"
                    value={pincode}
                    onChangeText={(v) => {
                      setPincode(v);
                      if (errors.pincode) setErrors((p) => ({ ...p, pincode: "" }));
                    }}
                    error={errors.pincode}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => scrollTo(240)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <StyledInput
                    label="Country"
                    placeholder="Country"
                    icon="globe"
                    value={country}
                    onChangeText={setCountry}
                    optional
                    onFocus={() => scrollTo(240)}
                  />
                </View>
              </View>

              <StyledInput
                label="Mobile number"
                placeholder="10-digit number"
                icon="phone"
                value={mobile}
                onChangeText={(v) => {
                  setMobile(v);
                  if (errors.mobile) setErrors((p) => ({ ...p, mobile: "" }));
                }}
                error={errors.mobile}
                keyboardType="phone-pad"
                maxLength={10}
                onFocus={() => scrollTo(320)}
              />
            </View>
          </View>

          {/* ── Current Location ──────────────────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Current location <Text style={{ color: "#EF4444" }}>*</Text>
            </Text>

            {latitude && longitude ? (
              /* Captured state */
              <View style={styles.locCapturedBox}>
                <View style={styles.locCapturedLeft}>
                  <View style={styles.locSuccessIconWrap}>
                    <Feather name="check-circle" size={20} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={[styles.locCapturedTitle, { color: "#166534" }]}>
                      Location captured
                    </Text>
                    <Text style={[styles.locCapturedCoords, { color: "#4ADE80" }]}>
                      {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={getCurrentLocation}
                  disabled={locationLoading}
                  style={styles.locRefreshBtn}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : (
                    <Feather name="refresh-cw" size={15} color="#16A34A" />
                  )}
                </Pressable>
              </View>
            ) : (
              /* Empty state */
              <Pressable
                onPress={getCurrentLocation}
                disabled={locationLoading}
                style={[
                  styles.locEmptyBox,
                  {
                    borderColor: errors.location ? "#EF4444" : colors.border,
                    backgroundColor: errors.location ? "#FFF5F5" : colors.muted,
                  },
                ]}
              >
                <View
                  style={[
                    styles.locEmptyIconWrap,
                    {
                      backgroundColor: errors.location ? "#FEE2E2" : colors.background,
                      borderColor: errors.location ? "#FCA5A5" : colors.border,
                    },
                  ]}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Feather
                      name="crosshair"
                      size={18}
                      color={errors.location ? "#EF4444" : colors.primary}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locEmptyTitle, { color: colors.foreground }]}>
                    {locationLoading ? "Getting your location…" : "Use my current location"}
                  </Text>
                  <Text style={[styles.locEmptySubtitle, { color: colors.mutedForeground }]}>
                    Required for accurate delivery
                  </Text>
                </View>
                {!locationLoading && (
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                )}
              </Pressable>
            )}

            {errors.location ? (
              <View style={styles.errorBadge}>
                <Feather name="alert-circle" size={11} color="#991B1B" />
                <Text style={styles.errorText}>{errors.location}</Text>
              </View>
            ) : null}
          </View>

          {/* ── Info strip ────────────────────────────────────────────────────── */}
          <View
            style={[
              styles.infoStrip,
              {
                backgroundColor: colors.accent,
                borderColor: colors.primary + "33",
              },
            ]}
          >
            <Feather name="shield" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Your location is only used for delivery and is kept secure.
            </Text>
          </View>

          {/* ── Save Button ───────────────────────────────────────────────────── */}
          {/* <Pressable
            onPress={onSave}
            disabled={loading}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: loading ? colors.muted : activeType.activeBorder,
                opacity: loading || pressed ? 0.7 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="check" size={16} color="#fff" />
            )}
            <Text style={styles.saveBtnText}>
              {loading
                ? mode === "add"
                  ? "Saving…"
                  : "Updating…"
                : mode === "add"
                ? "Save address"
                : "Update address"}
            </Text>
          </Pressable> */}
          <Pressable
            onPress={onSave}
            disabled={loading}
            style={{
              backgroundColor: loading ? colors.muted : colors.primary,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 24,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" }}>
              {loading
                ? mode === "add"
                  ? "Adding..."
                  : "Updating..."
                : mode === "add"
                  ? "Add Address"
                  : "Update Address"}
            </Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Permission Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPermissionModal(false)}
        >
          <Pressable
            style={[styles.modalBox, { backgroundColor: colors.background }]}
            onPress={() => {}}
          >
            {/* Icon */}
            <View style={styles.modalIconWrap}>
              <Feather name="map-pin" size={28} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Location access needed
            </Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              You've denied location permission. To add an address, please
              allow location access from your device settings.
            </Text>

            {/* Steps */}
            <View
              style={[
                styles.modalStepsBox,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.modalStepsTitle, { color: colors.primary }]}>
                How to enable:
              </Text>
              {[
                "Open your device Settings",
                'Go to Apps → Permissions',
                "Find this app and allow Location",
                "Come back and try again",
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepNumber,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text
                    style={[styles.stepText, { color: colors.foreground }]}
                  >
                    {step}
                  </Text>
                </View>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => setShowPermissionModal(false)}
                style={[
                  styles.modalBtnSecondary,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.modalBtnSecondaryText, { color: colors.foreground }]}
                >
                  Close
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowPermissionModal(false);
                  setTimeout(getCurrentLocation, 400);
                }}
                style={[styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
              >
                <Feather name="refresh-cw" size={14} color="#fff" />
                <Text style={styles.modalBtnPrimaryText}>Try again</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout ─────────────────────────────────────────────────────────────────
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  // ── Page Header ────────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 2,
  },
  pageHeaderIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.6,
  },

  // ── Address Type Chips ─────────────────────────────────────────────────────
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  typeChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  // ── Field Stack / Row ──────────────────────────────────────────────────────
  fieldStack: {
    gap: 14,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 10,
  },

  // ── Input Component Internals ──────────────────────────────────────────────
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  labelIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  optionalTag: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 11,
    minHeight: 46,
  },
  inputIcon: {
    marginRight: 9,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 10,
  },
  checkIcon: {
    marginLeft: 6,
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    color: "#991B1B",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  // ── Location ───────────────────────────────────────────────────────────────
  locCapturedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#86EFAC",
    padding: 12,
    gap: 10,
  },
  locCapturedLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locSuccessIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  locCapturedTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  locCapturedCoords: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  locRefreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#86EFAC",
    alignItems: "center",
    justifyContent: "center",
  },
  locEmptyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 12,
    gap: 12,
  },
  locEmptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  locEmptyTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  locEmptySubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // ── Info Strip ─────────────────────────────────────────────────────────────
  infoStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 18,
  },

  // ── Save Button ────────────────────────────────────────────────────────────
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },

  // ── Permission Modal ───────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    gap: 14,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  modalBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  modalStepsBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  modalStepsTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  stepText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalBtnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnSecondaryText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modalBtnPrimary: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  modalBtnPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});