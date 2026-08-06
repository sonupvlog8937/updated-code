import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchDataFromApi, postData, deleteData } from '../utils/api';
import Colors from '../constants/colors';

interface BlogPost {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  createdAt?: string;
  author?: { name?: string };
  tags?: string[];
}

export default function BlogScreen() {
  const scheme = useColorScheme();
  const C = Colors[scheme ?? 'dark'];

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    tags: '',
  });

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchDataFromApi('/api/blog');
      if (data?.postList) setPosts(data.postList);
      else if (Array.isArray(data)) setPosts(data);
      else if (data?.posts) setPosts(data.posts);
    } catch (e) {
      console.error('Failed to fetch blog posts', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  const handleCreate = async () => {
    if (!newPost.title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: newPost.title.trim(),
        description: newPost.description.trim(),
        tags: newPost.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await postData('/api/blog', payload);
      setShowCreateModal(false);
      setNewPost({ title: '', description: '', tags: '' });
      fetchPosts(true);
    } catch {
      Alert.alert('Error', 'Failed to create blog post.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (post: BlogPost) => {
    Alert.alert('Delete Post', `Delete "${post.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteData(`/api/blog/${post._id}`);
            setPosts((prev) => prev.filter((p) => p._id !== post._id));
          } catch {
            Alert.alert('Error', 'Failed to delete post.');
          }
        },
      },
    ]);
  };

  const filtered = posts.filter((p) =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const styles = makeStyles(C);

  const renderPost = ({ item }: { item: BlogPost }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.statusDot(item.status)} />
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={C.error} />
        </TouchableOpacity>
      </View>

      {!!item.description && (
        <Text style={styles.postDesc} numberOfLines={3}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        {!!item.author?.name && (
          <View style={styles.metaChip}>
            <Ionicons name="person-outline" size={12} color={C.textMuted} />
            <Text style={styles.metaText}>{item.author.name}</Text>
          </View>
        )}
        {!!item.createdAt && (
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
            <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        {item.status && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'published'
                    ? C.success + '22'
                    : C.warning + '22',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === 'published' ? C.success : C.warning,
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        )}
      </View>

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 4).map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Blog Posts',
          headerStyle: { backgroundColor: C.headerBg },
          headerTintColor: C.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={{ marginRight: 4 }}
            >
              <Ionicons name="add-circle-outline" size={26} color={C.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: C.background }]}>
        {/* Search */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Ionicons name="search-outline" size={16} color={C.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: C.text }]}
              placeholder="Search posts…"
              placeholderTextColor={C.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={renderPost}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchPosts(true)}
                tintColor={C.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="newspaper-outline" size={48} color={C.textMuted} />
                <Text style={[styles.emptyText, { color: C.textMuted }]}>
                  {searchQuery ? 'No posts match your search' : 'No blog posts yet'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={[styles.modal, { backgroundColor: C.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: C.text }]}>New Blog Post</Text>
            <TouchableOpacity onPress={handleCreate} disabled={creating}>
              {creating ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : (
                <Text style={[styles.saveBtn, { color: C.primary }]}>Publish</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: C.textSecondary }]}>Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
              placeholder="Enter post title"
              placeholderTextColor={C.textMuted}
              value={newPost.title}
              onChangeText={(v) => setNewPost((p) => ({ ...p, title: v }))}
            />

            <Text style={[styles.label, { color: C.textSecondary }]}>Content</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: C.surface, color: C.text, borderColor: C.border },
              ]}
              placeholder="Write your post content…"
              placeholderTextColor={C.textMuted}
              value={newPost.description}
              onChangeText={(v) => setNewPost((p) => ({ ...p, description: v }))}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <Text style={[styles.label, { color: C.textSecondary }]}>Tags (comma-separated)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
              placeholder="e.g. tech, news, update"
              placeholderTextColor={C.textMuted}
              value={newPost.tags}
              onChangeText={(v) => setNewPost((p) => ({ ...p, tags: v }))}
            />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (C: typeof Colors.dark) =>
  StyleSheet.create({
    container: { flex: 1 },
    searchRow: { padding: 16, paddingBottom: 8 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15 },
    list: { padding: 16, paddingTop: 8, gap: 12 },
    card: {
      backgroundColor: C.surface,
      borderRadius: 14,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    statusDot: (status?: string) => ({
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        status === 'published' ? C.success : C.warning,
      marginTop: 5,
    }),
    postTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: C.text,
    },
    postDesc: {
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 19,
    },
    cardFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: C.textMuted,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tag: {
      backgroundColor: C.primary + '22',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    tagText: {
      fontSize: 11,
      color: C.primary,
      fontWeight: '500',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
    },
    modal: { flex: 1 },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '600',
    },
    saveBtn: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalBody: {
      padding: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 6,
      marginTop: 14,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
    },
    textArea: {
      height: 160,
      paddingTop: 10,
    },
  } as any);
