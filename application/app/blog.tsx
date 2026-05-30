import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { EmptyState } from "@/src/components/EmptyState";
import { fetchDataFromApi } from "@/src/utils/api";

interface BlogPost {
  _id: string;
  title: string;
  description?: string;
  images?: string[];
  createdAt?: string;
}

export default function BlogScreen() {
  const colors = useColors();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataFromApi("/api/blog")
      .then((res) => setPosts(res?.data || res?.blogs || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!posts.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="book-open"
          title="No blog posts yet"
          description="Check back soon for shopping tips & guides"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 12 }}
    >
      {posts.map((p) => (
        <Pressable
          key={p._id}
          onPress={() => router.push(`/blog/${p._id}` as never)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          {p.images?.[0] ? (
            <Image
              source={{ uri: p.images[0] }}
              style={styles.img}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.img, { backgroundColor: colors.muted }]} />
          )}
          <View style={{ padding: 12 }}>
            <Text
              numberOfLines={2}
              style={{
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 15,
                lineHeight: 20,
              }}
            >
              {p.title}
            </Text>
            {p.description ? (
              <Text
                numberOfLines={2}
                style={{
                  color: colors.mutedForeground,
                  fontSize: 12,
                  marginTop: 6,
                  lineHeight: 17,
                }}
              >
                {p.description.replace(/<[^>]*>/g, "")}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  img: { width: "100%", height: 160 },
});
