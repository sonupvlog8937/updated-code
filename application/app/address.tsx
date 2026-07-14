import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/src/components/EmptyState";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchUserDetails, UserAddress } from "@/src/store/appSlice";
import { deleteData, editData } from "@/src/utils/api";
import { showToast } from "@/src/utils/toast";

const ADDRESS_TYPES = ["Home", "Office", "Work", "Other"];

export default function AddressScreen() {
  const colors = useColors();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const userData = useAppSelector((s) => s.app.userData);
  const isLogin = useAppSelector((s) => s.app.isLogin);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isLogin) dispatch(fetchUserDetails());
    }, [dispatch, isLogin]),
  );

  if (!isLogin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="map-pin"
          title="Sign in to manage addresses"
          ctaTitle="Sign In"
          onCta={() => router.push("/login" as never)}
        />
      </View>
    );
  }

  const addresses = userData?.address_details || [];

  const onDelete = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              const res = await deleteData(`/api/address/${id}`);
              if (res?.error === false || res?.success === true || res?.data) {
                showToast("success", "Address deleted successfully");
                await dispatch(fetchUserDetails());
              } else {
                showToast("error", res?.message || "Failed to delete");
              }
            } catch (error: any) {
              showToast("error", error?.message || "Error deleting address");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const onEdit = (id: string) => {
    router.push({
      pathname: "/add-address",
      params: { addressId: id, mode: "edit" },
    } as never);
  };

  const onSetDefault = (id: string) => {
    setSettingDefaultId(id);
    editData(`/api/address/${id}`, { status: true })
      .then((res) => {
        if (res?.error === false || res?.success === true) {
          showToast("success", "Default address updated");
          dispatch(fetchUserDetails());
        } else {
          showToast("error", res?.message || "Failed");
        }
      })
      .catch((error) => {
        showToast("error", error?.message || "Error");
      })
      .finally(() => setSettingDefaultId(null));
  };

  const getAddressTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      Home: colors.primary,
      Office: "#3b82f6",
      Work: "#8b5cf6",
      Other: "#6b7280",
    };
    return typeColors[type] || colors.primary;
  };

  const getAddressTypeIcon = (type: string) => {
    const typeIcons: Record<string, keyof typeof Feather.glyphMap> = {
      Home: "home",
      Office: "briefcase",
      Work: "briefcase",
      Other: "map-pin",
    };
    return typeIcons[type] || "map-pin";
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {addresses.length === 0 ? (
          <View style={{ paddingTop: 60 }}>
            <EmptyState
              icon="map-pin"
              title="No saved addresses"
              description="Add your first address for quick checkout"
            />
          </View>
        ) : (
          <View>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                marginBottom: 14,
              }}
            >
              Your Addresses ({addresses.length})
            </Text>

            {addresses.map((a: UserAddress) => {
              const typeColor = getAddressTypeColor(a.addressType || "Home");
              const typeIcon = getAddressTypeIcon(a.addressType || "Home");

              return (
                <View
                  key={a._id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: a.status ? typeColor : colors.border,
                      borderWidth: a.status ? 2 : 1,
                      opacity: deletingId === a._id ? 0.5 : 1,
                    },
                  ]}
                >
                  {/* Header with Type Badge */}
                  <View style={styles.cardHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      <View
                        style={[
                          styles.typeIcon,
                          { backgroundColor: typeColor + "20" },
                        ]}
                      >
                        <Feather name={typeIcon} size={16} color={typeColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Text
                            style={{
                              color: colors.foreground,
                              fontSize: 14,
                              fontFamily: "Inter_700Bold",
                            }}
                          >
                            {a.addressType || "Home"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Address Details */}
                  <View style={styles.addressDetails}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 13,
                        fontFamily: "Inter_500Medium",
                        lineHeight: 18,
                        marginBottom: 6,
                      }}
                    >
                      {a.address_line1}
                      {a.landmark ? `, ${a.landmark}` : ""}
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        marginBottom: 2,
                      }}
                    >
                      {a.city}, {a.state} - {a.pincode}
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        fontFamily: "Inter_400Regular",
                        marginBottom: 6,
                      }}
                    >
                      {a.country}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Feather name="phone" size={12} color={colors.primary} />
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: 12,
                          fontFamily: "Inter_600SemiBold",
                        }}
                      >
                        {a.mobile}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => onEdit(a._id)}
                        disabled={deletingId === a._id}
                        style={[
                          styles.actionBtn,
                          {
                            flex: 1,
                            backgroundColor: colors.accent,
                            borderColor: colors.primary,
                            opacity:
                              deletingId === a._id || settingDefaultId === a._id
                                ? 0.5
                                : 1,
                          },
                        ]}
                      >
                        <Feather name="edit-2" size={14} color={colors.primary} />
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 12,
                            fontFamily: "Inter_600SemiBold",
                          }}
                        >
                          Edit
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => onDelete(a._id)}
                        disabled={deletingId === a._id}
                        style={[
                          styles.actionBtn,
                          {
                            flex: 1,
                            borderColor: colors.destructive,
                            opacity: deletingId === a._id ? 0.5 : 1,
                          },
                        ]}
                      >
                        {deletingId === a._id ? (
                          <ActivityIndicator size={12} color={colors.destructive} />
                        ) : (
                          <Feather
                            name="trash-2"
                            size={14}
                            color={colors.destructive}
                          />
                        )}
                        <Text
                          style={{
                            color: colors.destructive,
                            fontSize: 12,
                            fontFamily: "Inter_600SemiBold",
                          }}
                        >
                          {deletingId === a._id ? "..." : "Delete"}
                        </Text>
                      </Pressable>
                    </View>

                    {!a.status && (
                      <Pressable
                        onPress={() => onSetDefault(a._id)}
                        disabled={settingDefaultId === a._id}
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor: typeColor,
                            borderColor: typeColor,
                            opacity:
                              settingDefaultId === a._id || deletingId === a._id
                                ? 0.5
                                : 1,
                          },
                        ]}
                      >
                        {settingDefaultId === a._id ? (
                          <ActivityIndicator size={14} color="#fff" />
                        ) : (
                          <Feather name="check-circle" size={14} color="#fff" />
                        )}
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontFamily: "Inter_600SemiBold",
                          }}
                        >
                          Set as Default
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/add-address",
              params: { mode: "add" },
            } as never)
          }
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" }}>
            Add new address
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addressDetails: {
    marginBottom: 10,
  },
  divider: { height: 1, marginVertical: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
