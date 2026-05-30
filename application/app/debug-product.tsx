import { fetchDataFromApi } from "@/src/utils/api";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text
} from "react-native";

export default function DebugScreen() {
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Test with first product or replace with actual ID
        const res = await fetchDataFromApi("/api/product/123");
        console.log("🔍 Full API Response:", JSON.stringify(res, null, 2));
        console.log("🖼️ Images Array:", res?.product?.images);
        setProductData(res);
      } catch (err: any) {
        setError(err.message);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          Product API Debug
        </Text>

        {error && (
          <Text style={{ color: "red", marginBottom: 12 }}>Error: {error}</Text>
        )}

        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
          Full Response:
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#666",
            marginBottom: 16,
            fontFamily: "monospace",
          }}
        >
          {JSON.stringify(productData, null, 2)}
        </Text>

        {productData?.product?.images && (
          <>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Images Array ({productData.product.images.length} images):
            </Text>
            {productData.product.images.map((img: string, idx: number) => (
              <Text
                key={idx}
                style={{
                  fontSize: 11,
                  color: "#666",
                  marginBottom: 8,
                  fontFamily: "monospace",
                  backgroundColor: "#f0f0f0",
                  padding: 8,
                  borderRadius: 4,
                }}
              >
                [{idx}] {img}
              </Text>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
