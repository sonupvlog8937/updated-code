import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Field } from "@/app/login";
import { useColors } from "@/hooks/useColors";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchUserDetails } from "@/src/store/appSlice";
import { postData, editData, fetchDataFromApi } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const TYPES = ["Home", "Work", "Office", "Other"] as const;

export default function AddAddressScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((s) => s.app.userData);
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const mode = (params?.mode as string) || "add";
  const addressId = params?.addressId as string;

  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [mobile, setMobile] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressType, setAddressType] = useState<typeof TYPES[number]>("Home");
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load address data in edit mode
  useEffect(() => {
    if (mode === "edit" && addressId) {
      loadAddressData(addressId);
    }
  }, [mode, addressId]);

  const loadAddressData = async (id: string) => {
    try {
      const res = await fetchDataFromApi(`/api/address/${id}`);
      if (res?.address) {
        const addr = res.address;
        setLine1(addr.address_line1 || "");
        setCity(addr.city || "");
        setState(addr.state || "");
        setPincode(String(addr.pincode) || "");
        setCountry(addr.country || "India");
        setMobile(String(addr.mobile) || "");
        setLandmark(addr.landmark || "");
        setAddressType(addr.addressType || "Home");
      }
    } catch (error) {
      showToast("error", "Failed to load address");
      router.back();
    } finally {
      setLoadingForm(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const line1Str = String(line1 || "").trim();
    const cityStr = String(city || "").trim();
    const stateStr = String(state || "").trim();
    const pincodeStr = String(pincode || "").trim();
    const mobileStr = String(mobile || "").trim();

    if (!line1Str) {
      newErrors.line1 = "Address line is required";
    }
    if (!cityStr) {
      newErrors.city = "City is required";
    }
    if (!stateStr) {
      newErrors.state = "State is required";
    }
    if (!pincodeStr) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(pincodeStr.replace(/\D/g, ""))) {
      newErrors.pincode = "Pincode must be 6 digits";
    }
    if (!mobileStr) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(mobileStr.replace(/\D/g, ""))) {
      newErrors.mobile = "Mobile must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSave = async () => {
    if (!validateForm()) {
      showToast("error", "Please fill all required fields correctly");
      return;
    }

    setLoading(true);
    try {
      const addressData = {
        address_line1: line1,
        city,
        state,
        pincode,
        country,
        mobile,
        landmark,
        addressType,
        userId: userData?._id,
      };

      if (mode === "add") {
        const res = await postData("/api/address/add", addressData);
        if (res?.error === false || res?.success === true) {
          showToast("success", "Address added successfully");
          await dispatch(fetchUserDetails());
          router.back();
        } else {
          showToast("error", res?.message || "Failed to add address");
        }
      } else if (mode === "edit") {
        const res = await editData(`/api/address/${addressId}`, addressData);
        if (res?.error === false || res?.success === true) {
          showToast("success", "Address updated successfully");
          await dispatch(fetchUserDetails());
          router.back();
        } else {
          showToast("error", res?.message || "Failed to update address");
        }
      }
    } catch (error: any) {
      showToast("error", error?.message || "Error saving address");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldFocus = (scrollOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: scrollOffset,
        animated: true,
      });
    }, 300);
  };

  if (loadingForm) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.foreground }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      Home: colors.primary,
      Work: "#8b5cf6",
      Office: "#3b82f6",
      Other: "#6b7280",
    };
    return typeColors[type] || colors.primary;
  };

  const getTypeIcon = (type: string) => {
    const typeIcons: Record<string, keyof typeof Feather.glyphMap> = {
      Home: "home",
      Work: "briefcase",
      Office: "briefcase",
      Other: "map-pin",
    };
    return typeIcons[type] || "map-pin";
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 18,
                marginBottom: 4,
              }}
            >
              {mode === "add" ? "Add New Address" : "Edit Address"}
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
              }}
            >
              {mode === "add"
                ? "Add a new delivery address"
                : "Update your address details"}
            </Text>
          </View>

          {/* Address Type Selection */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              Address Type *
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {TYPES.map((type) => {
                const isSelected = type === addressType;
                const typeColor = getTypeColor(type);
                const typeIcon = getTypeIcon(type);

                return (
                  <Pressable
                    key={type}
                    onPress={() => setAddressType(type)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected
                          ? typeColor
                          : colors.muted,
                        borderColor: isSelected ? typeColor : colors.border,
                        borderWidth: isSelected ? 0 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={typeIcon}
                      size={14}
                      color={isSelected ? "#fff" : colors.foreground}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: isSelected ? "#fff" : colors.foreground,
                        fontSize: 12,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Form Fields */}
          <View style={{ gap: 14 }}>
            {/* Address Line 1 */}
            <FormFieldWithError
              label="Address Line *"
              placeholder="Street address"
              icon="map-pin"
              value={line1}
              onChangeText={(text) => {
                setLine1(text);
                if (errors.line1) setErrors((prev) => ({ ...prev, line1: "" }));
              }}
              error={errors.line1}
              colors={colors}
              onFocus={() => handleFieldFocus(0)}
            />

            {/* Landmark */}
            <FormFieldWithError
              label="Landmark (Optional)"
              placeholder="Nearby landmark"
              icon="navigation"
              value={landmark}
              onChangeText={setLandmark}
              error={errors.landmark}
              colors={colors}
              onFocus={() => handleFieldFocus(70)}
            />

            {/* City and State */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FormFieldWithError
                  label="City *"
                  placeholder="City"
                  icon="map"
                  value={city}
                  onChangeText={(text) => {
                    setCity(text);
                    if (errors.city) setErrors((prev) => ({ ...prev, city: "" }));
                  }}
                  error={errors.city}
                  colors={colors}
                  onFocus={() => handleFieldFocus(140)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormFieldWithError
                  label="State *"
                  placeholder="State"
                  icon="map"
                  value={state}
                  onChangeText={(text) => {
                    setState(text);
                    if (errors.state) setErrors((prev) => ({ ...prev, state: "" }));
                  }}
                  error={errors.state}
                  colors={colors}
                  onFocus={() => handleFieldFocus(140)}
                />
              </View>
            </View>

            {/* Pincode and Country */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FormFieldWithError
                  label="Pincode *"
                  placeholder="Postal code"
                  icon="hash"
                  value={pincode}
                  onChangeText={(text) => {
                    setPincode(text);
                    if (errors.pincode)
                      setErrors((prev) => ({ ...prev, pincode: "" }));
                  }}
                  error={errors.pincode}
                  colors={colors}
                  keyboardType="number-pad"
                  onFocus={() => handleFieldFocus(210)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormFieldWithError
                  label="Country"
                  placeholder="Country"
                  icon="globe"
                  value={country}
                  onChangeText={setCountry}
                  error={errors.country}
                  colors={colors}
                  onFocus={() => handleFieldFocus(210)}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <FormFieldWithError
              label="Mobile Number *"
              placeholder="10-digit phone number"
              icon="phone"
              value={mobile}
              onChangeText={(text) => {
                setMobile(text);
                if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: "" }));
              }}
              error={errors.mobile}
              colors={colors}
              keyboardType="phone-pad"
              onFocus={() => handleFieldFocus(280)}
            />
          </View>

          {/* Info Box */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: colors.accent,
                borderColor: colors.primary,
                marginTop: 24,
              },
            ]}
          >
            <Feather name="info" size={16} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                flex: 1,
                marginLeft: 8,
              }}
            >
              Ensure your address is correct for accurate delivery
            </Text>
          </View>

          {/* Save Button */}
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
    </SafeAreaView>
  );
}

const FormFieldWithError = ({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
  error,
  colors,
  keyboardType = "default",
  onFocus,
}: {
  label: string;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  colors: any;
  keyboardType?: any;
  onFocus?: () => void;
}) => {
  return (
    <View>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Field
        icon={icon}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onFocus={onFocus}
      />
      {error && (
        <Text
          style={{
            color: colors.destructive,
            fontSize: 11,
            marginTop: 4,
            fontFamily: "Inter_500Medium",
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
});
