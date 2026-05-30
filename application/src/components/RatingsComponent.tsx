import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Image,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { fetchDataFromApi, postData } from '@/src/utils/api';

const REVIEWS_PER_PAGE = 5;

interface Review {
  _id: string;
  userId: string;
  userName: string;
  userImage?: string;
  image?: string;
  review: string;
  rating: number;
  createdAt: string;
}

interface RatingsComponentProps {
  productId: string;
  onReviewsCountChange?: (count: number) => void;
}

/**
 * Comprehensive Ratings Component
 * - View all customer reviews with ratings and comments
 * - Submit your own review with star rating
 * - Load more reviews with pagination
 */
export const RatingsComponent: React.FC<RatingsComponentProps> = ({
  productId,
  onReviewsCountChange,
}) => {
  const { userData } = useSelector((state: RootState) => state.app);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Form state
  const [showAddReview, setShowAddReview] = useState(false);
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
          onReviewsCountChange?.(res?.total || newReviews.length);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId, onReviewsCountChange]
  );

  // Initial load
  useEffect(() => {
    fetchReviews(1, true);
  }, [productId, fetchReviews]);

  // Add review
  const handleAddReview = useCallback(async () => {
    if (!userData?._id) {
      alert('Please login to add a review');
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
        setShowAddReview(false);
        // Refresh reviews
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

  // Load more reviews
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, false);
  }, [page, fetchReviews]);

  // Star rating component
  const StarRating: React.FC<{ value: number; onChange?: (val: number) => void; readonly?: boolean; size?: number }> = ({
    value,
    onChange,
    readonly = false,
    size = 18,
  }) => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
          style={{ opacity: readonly ? 0.7 : 1 }}
        >
          <Text style={{ fontSize: size, color: star <= value ? '#facc15' : '#d1d5db' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customer Reviews</Text>
        <Text style={styles.subtitle}>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</Text>
      </View>

      {/* Add Review Button */}
      {userData?._id && (
        <TouchableOpacity
          style={styles.addReviewBtn}
          onPress={() => setShowAddReview(true)}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
          <Text style={styles.addReviewBtnText}>Write a Review</Text>
        </TouchableOpacity>
      )}

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubText}>Be the first to review this product</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          contentContainerStyle={styles.reviewsList}
          renderItem={({ item: review }) => (
            <View style={styles.reviewItem}>
              {/* User Avatar & Info */}
              <View style={styles.reviewHeader}>
                <Image
                  source={{
                    uri: review.image || review.userImage || 'https://via.placeholder.com/50',
                  }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{review.userName}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Stars */}
              <View style={styles.ratingRow}>
                <StarRating value={review.rating} readonly size={16} />
              </View>

              {/* Review Text */}
              <Text style={styles.reviewText}>{review.review}</Text>

              {/* Divider */}
              <View style={styles.divider} />
            </View>
          )}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Load More ({totalReviews - reviews.length} remaining)
                  </Text>
                )}
              </TouchableOpacity>
            ) : reviews.length > 0 ? (
              <View style={styles.endMessage}>
                <Text style={styles.endMessageText}>No more reviews</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Add Review Modal */}
      <Modal
        visible={showAddReview}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddReview(false)}
      >
        <SafeAreaView style={styles.modalRoot}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowAddReview(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add a Review</Text>
                <View style={{ width: 24 }} />
              </View>

              {/* User Info Preview */}
              <View style={styles.userPreview}>
                <Image
                  source={{
                    uri: userData?.avatar || 'https://via.placeholder.com/50',
                  }}
                  style={styles.userPreviewAvatar}
                />
                <View>
                  <Text style={styles.userPreviewName}>{userData?.name || 'Anonymous'}</Text>
                  <Text style={styles.userPreviewEmail}>{userData?.email}</Text>
                </View>
              </View>

              {/* Rating Selection */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Rating</Text>
                <Text style={styles.formHint}>How would you rate this product?</Text>
                <View style={styles.ratingSelector}>
                  <StarRating value={newRating} onChange={setNewRating} size={28} />
                </View>
                <Text style={styles.ratingText}>
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
                  <Text style={styles.charCount}>
                    {newReview.length}/500 characters
                  </Text>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    opacity:
                      submitting || !newReview.trim() ? 0.6 : 1,
                    backgroundColor:
                      submitting || !newReview.trim() ? '#cbd5e1' : '#2563eb',
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

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddReview(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Tips for a helpful review:</Text>
                <View style={styles.tip}>
                  <Text style={styles.tipBullet}>• </Text>
                  <Text style={styles.tipText}>Share your honest experience</Text>
                </View>
                <View style={styles.tip}>
                  <Text style={styles.tipBullet}>• </Text>
                  <Text style={styles.tipText}>Mention specific features or quality</Text>
                </View>
                <View style={styles.tip}>
                  <Text style={styles.tipBullet}>• </Text>
                  <Text style={styles.tipText}>Be respectful and constructive</Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  addReviewBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  addReviewBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    gap: 8,
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  reviewsList: {
    gap: 0,
  },
  reviewItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  ratingRow: {
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 14,
  },
  loadMoreBtn: {
    marginVertical: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  endMessage: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endMessageText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  userPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userPreviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
  },
  userPreviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  userPreviewEmail: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  formSection: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formHint: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
  },
  ratingSelector: {
    alignItems: 'flex-start',
  },
  ratingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '500',
  },
  reviewInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 120,
    fontFamily: 'System',
  },
  charCountRow: {
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  tipsContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 4,
  },
  tipBullet: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '700',
  },
  tipText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
  },
});
