import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { fetchDataFromApi } from "@/src/utils/api";

interface BlogPost {
  _id: string;
  title: string;
  description?: string;
  images?: string[];
  createdAt?: string;
}

export default function BlogPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchDataFromApi(`/api/blog/${id}`)
      .then((res) => setPost(res?.data || res?.blog || null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Post not found</Text>
      </View>
    );
  }

  const w = Dimensions.get("window").width;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {post.images?.[0] ? (
        <Image
          source={{ uri: post.images[0] }}
          style={{ width: w, height: 220, backgroundColor: colors.muted }}
          contentFit="cover"
        />
      ) : null}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_700Bold",
            fontSize: 22,
            lineHeight: 28,
          }}
        >
          {post.title}
        </Text>
        {post.createdAt ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              marginTop: 6,
            }}
          >
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        ) : null}
        <Text
          style={{
            color: colors.foreground,
            fontSize: 14,
            lineHeight: 22,
            marginTop: 16,
            fontFamily: "Inter_400Regular",
          }}
        >
          {post.description?.replace(/<[^>]*>/g, "") || ""}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
