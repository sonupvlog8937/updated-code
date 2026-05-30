import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { fetchDataFromApi, postData } from '@/src/utils/api';

const REVIEWS_PER_PAGE = 5;
const PRIMARY = '#2563eb';

interface Review {
  _id: string;
  userId: string;
  userName: string;
  image?: string;
  review: string;
  rating: number;
  createdAt: string;
}

export default function ReviewsScreen() {
  const { productId, productName } = useLocalSearchParams<{
    productId: string;
    productName: string;
  }>();
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.app);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Form state
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  // Fetch reviews
  const fetchReviews = useCallback(
    async (pageNum = 1, reset = true) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res: any = await fetchDataFromApi(
          `/api/user/getReviews?productId=${productId}&page=${pageNum}&limit=${REVIEWS_PER_PAGE}`
        );

        if (res?.error === false) {
          const newReviews = res?.reviews || [];
          setReviews((prev) => (reset ? newReviews : [...prev, ...newReviews]));
          setHasMore(newReviews.length === REVIEWS_PER_PAGE);
          setTotalReviews(res?.total || newReviews.length);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId]
  );

  // Initial load
  useEffect(() => {
    if (productId) {
      fetchReviews(1, true);
    }
  }, [productId, fetchReviews]);

  // Submit review
  const handleAddReview = useCallback(async () => {
    if (!userData?._id) {
      alert('Please login to add a review');
      router.push('/login' as never);
      return;
    }

    if (!newReview.trim()) {
      alert('Please write a review');
      return;
    }

    setSubmitting(true);

    try {
      const reviewData = {
        productId,
        userId: userData._id,
        userName: userData.name || 'Anonymous',
        image: userData.avatar,
        review: newReview,
        rating: newRating,
      };

      const res: any = await postData('/api/user/addReview', reviewData);

      if (res?.error === false) {
        alert('Review submitted successfully');
        setNewReview('');
        setNewRating(5);
        setPage(1);
        await fetchReviews(1, true);
      } else {
        alert(res?.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  }, [userData, newReview, newRating, productId, fetchReviews]);

  // Load more
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, false);
  }, [page, fetchReviews]);

  // Star rating
  const StarRating = ({ value, onChange, readonly = false, size = 20 }: any) => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
        >
          <Text style={{ fontSize: size, color: star <= value ? '#facc15' : '#d1d5db' }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Screen
        options={{
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="chevron-back" size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Customer Reviews</Text>
            <Text style={styles.subtitle}>{totalReviews} reviews</Text>
          </View>

          {/* Reviews List */}
          {loading && reviews.length === 0 ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubText}>
                Be the first to review this product
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  {/* User Info */}
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{
                        uri: review.image || 'https://via.placeholder.com/50',
                      }}
                      style={styles.avatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{review.userName}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Rating */}
                  <View style={styles.reviewRating}>
                    <StarRating value={review.rating} readonly size={16} />
                  </View>

                  {/* Review Text */}
                  <Text style={styles.reviewText}>{review.review}</Text>

                  {/* Divider */}
                  <View style={styles.divider} />
                </View>
              ))}
            </View>
          )}

          {/* Load More Button */}
          {hasMore && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={PRIMARY} />
              ) : (
                <Text style={styles.loadMoreText}>
                  Load More ({totalReviews - reviews.length} remaining)
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Add Review Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add Your Review</Text>

            {/* User Preview */}
            {userData?._id && (
              <View style={styles.userPreview}>
                <Image
                  source={{
                    uri: userData?.avatar || 'https://via.placeholder.com/50',
                  }}
                  style={styles.previewAvatar}
                />
                <View>
                  <Text style={styles.previewName}>{userData?.name || 'Anonymous'}</Text>
                  <Text style={styles.previewEmail}>{userData?.email}</Text>
                </View>
              </View>
            )}

            {/* Rating Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Your Rating</Text>
              <View style={styles.ratingSelector}>
                <StarRating value={newRating} onChange={setNewRating} size={28} />
              </View>
              <Text style={styles.ratingLabel}>
                {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][newRating - 1]}
              </Text>
            </View>

            {/* Review Text */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Your Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with this product..."
                placeholderTextColor="rgba(0,0,0,0.4)"
                multiline
                numberOfLines={6}
                maxLength={500}
                value={newReview}
                onChangeText={setNewReview}
                editable={!submitting}
                textAlignVertical="top"
              />
              <View style={styles.charCountRow}>
                <Text style={styles.charCount}>{newReview.length}/500</Text>
              </View>
            </View>

            {/* Login Prompt */}
            {!userData?._id && (
              <TouchableOpacity
                style={styles.loginPrompt}
                onPress={() => router.push('/login' as never)}
              >
                <Ionicons name="log-in" size={18} color={PRIMARY} />
                <Text style={styles.loginPromptText}>Login to add a review</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            {userData?._id && (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    opacity: submitting || !newReview.trim() ? 0.6 : 1,
                    backgroundColor:
                      submitting || !newReview.trim() ? '#cbd5e1' : PRIMARY,
                  },
                ]}
                onPress={handleAddReview}
                disabled={submitting || !newReview.trim()}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitBtnText}>Submitting...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Review</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Tips */}
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>Tips for a helpful review:</Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Share your honest experience</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Mention specific features or quality</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Be respectful and constructive</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: '#64748b' },
  centerLoader: { alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    gap: 8,
    paddingVertical: 32,
  },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  emptySubText: { fontSize: 12, color: '#94a3b8' },
  reviewsList: { marginBottom: 20 },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  reviewDate: { fontSize: 11, color: '#94a3b8' },
  reviewRating: { marginBottom: 8 },
  reviewText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 10,
  },
  loadMoreBtn: {
    marginVertical: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  loadMoreText: { fontSize: 12, fontWeight: '600', color: PRIMARY },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  userPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  previewName: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  previewEmail: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  formSection: { marginBottom: 14 },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ratingSelector: { marginBottom: 6 },
  ratingLabel: { fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: '500' },
  reviewInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    color: '#0f172a',
    minHeight: 110,
    fontFamily: 'System',
  },
  charCountRow: { alignItems: 'flex-end' },
  charCount: { fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: '500' },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    marginBottom: 12,
  },
  loginPromptText: { fontSize: 13, fontWeight: '600', color: PRIMARY },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tipsBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 12,
  },
  tipsTitle: { fontSize: 12, fontWeight: '700', color: '#166534', marginBottom: 8 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  tipBullet: { fontSize: 11, color: '#166534', fontWeight: '700' },
  tipText: { fontSize: 11, color: '#166534', flex: 1 },
});
