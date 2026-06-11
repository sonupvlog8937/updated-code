import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
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

interface ProductReviewsSectionProps {
  productId: string;
  onReviewsCountChange?: (count: number) => void;
  registerInfiniteScrollLoader?: (loader: (() => void) | null) => void;
}

/**
 * Complete Reviews Section for Product Details Page
 * Shows all reviews with pagination + add review form
 */
export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  onReviewsCountChange,
  registerInfiniteScrollLoader,
}) => {
  const { userData } = useSelector((state: RootState) => state.app);
  const isFetchInFlightRef = useRef(false);

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
      if (!productId || isFetchInFlightRef.current) return;
      isFetchInFlightRef.current = true;
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
          const pagination = res?.pagination || {};
          const resolvedPage = Math.max(
            Number(pagination?.page ?? pageNum) || pageNum,
            1
          );
          const resolvedLimit = Math.max(
            Number(pagination?.limit ?? REVIEWS_PER_PAGE) || REVIEWS_PER_PAGE,
            1
          );
          const rawTotal = pagination?.total ?? res?.total;
          const parsedTotal =
            rawTotal !== undefined && rawTotal !== null
              ? Number(rawTotal)
              : null;
          const hasValidTotal =
            parsedTotal !== null &&
            Number.isFinite(parsedTotal) &&
            parsedTotal >= 0;
          const resolvedTotal = hasValidTotal ? parsedTotal : null;
          setReviews((prev) => (reset ? newReviews : [...prev, ...newReviews]));
          setPage(resolvedPage);
          setHasMore(
            resolvedTotal !== null
              ? resolvedPage * resolvedLimit < resolvedTotal
              : newReviews.length === resolvedLimit
          );
          setTotalReviews((prev) => {
            if (resolvedTotal !== null) return resolvedTotal;
            if (resolvedPage === 1) return newReviews.length;
            return Math.max(prev, resolvedPage * resolvedLimit);
          });
          if (resolvedTotal !== null) {
            onReviewsCountChange?.(resolvedTotal);
          } else if (resolvedPage === 1) {
            onReviewsCountChange?.(newReviews.length);
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        isFetchInFlightRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId, onReviewsCountChange]
  );

  // Initial load
  useEffect(() => {
    if (productId) {
      setPage(1);
      setHasMore(false);
      setTotalReviews(0);
      fetchReviews(1, true);
    }
  }, [productId, fetchReviews]);

  // Submit review
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
  const loadMoreReviews = useCallback(() => {
    if (loading || loadingMore || !hasMore || isFetchInFlightRef.current) return;
    fetchReviews(page + 1, false);
  }, [fetchReviews, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    registerInfiniteScrollLoader?.(loadMoreReviews);
    return () => registerInfiniteScrollLoader?.(null);
  }, [loadMoreReviews, registerInfiniteScrollLoader]);

  // Star rating component
  const StarRating = ({
    value,
    onChange,
    readonly = false,
    size = 20,
  }: {
    value: number;
    onChange?: (val: number) => void;
    readonly?: boolean;
    size?: number;
  }) => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
        >
          <Text
            style={{
              fontSize: size,
              color: star <= value ? '#facc15' : '#d1d5db',
            }}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customer Reviews</Text>
        <Text style={styles.subtitle}>{totalReviews} reviews</Text>
      </View>
      {/* Add Review Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Add Your Review</Text>

        {/* User Preview */}
        {userData?._id && (
          <View style={styles.userPreview}>
            {userData?.avatar ? (
              <Image
                source={{ uri: userData.avatar }}
                style={styles.previewAvatar}
              />
            ) : (
              <View style={[styles.previewAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
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
            numberOfLines={5}
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
          <View style={styles.loginPrompt}>
            <Ionicons name="log-in" size={18} color={PRIMARY} />
            <Text style={styles.loginPromptText}>Login to add a review</Text>
          </View>
        )}

        {/* Submit Button */}
        {userData?._id && (
          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                opacity: submitting || !newReview.trim() ? 0.6 : 1,
                backgroundColor: submitting || !newReview.trim() ? '#cbd5e1' : PRIMARY,
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

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubText}>Be the first to review this product</Text>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {reviews.map((review) => (
            <View key={review._id} style={styles.reviewCard}>
              {/* User Info */}
              <View style={styles.reviewHeader}>
                {review.image ? (
                  <Image
                    source={{ uri: review.image }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>
                      {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
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
            </View>
          ))}
        </View>
      )}

      {/* Infinite scroll status */}
      {loadingMore && (
        <View style={styles.infiniteLoaderRow}>
          <ActivityIndicator size="small" color={PRIMARY} />
          <Text style={styles.infiniteLoaderText}>Loading more reviews...</Text>
        </View>
      )}

      {!hasMore && reviews.length > 0 && (
        <View style={styles.endOfReviewsRow}>
          <Text style={styles.endOfReviewsText}>You've reached the end of reviews</Text>
        </View>
      )}

      
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
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  header: { marginBottom: 14 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: '#64748b' },
  centerLoader: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    gap: 8,
    paddingVertical: 20,
  },
  emptyText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  emptySubText: { fontSize: 12, color: '#94a3b8' },
  reviewsList: { marginBottom: 14 },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  reviewDate: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  reviewRating: { marginBottom: 8 },
  reviewText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#475569',
  },
  infiniteLoaderRow: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  infiniteLoaderText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  endOfReviewsRow: {
    marginTop: 6,
    marginBottom: 4,
    alignItems: 'center',
  },
  endOfReviewsText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  formCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  userPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  previewName: { fontSize: 11, fontWeight: '600', color: '#0f172a' },
  previewEmail: { fontSize: 9, color: '#94a3b8' },
  formSection: { marginBottom: 10 },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  ratingSelector: { marginBottom: 4 },
  ratingLabel: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '500' },
  reviewInput: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 11,
    color: '#0f172a',
    minHeight: 90,
    fontFamily: 'System',
  },
  charCountRow: { alignItems: 'flex-end' },
  charCount: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    marginBottom: 10,
  },
  loginPromptText: { fontSize: 12, fontWeight: '600', color: PRIMARY },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  tipsBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 10,
  },
  tipsTitle: { fontSize: 11, fontWeight: '700', color: '#166534', marginBottom: 6 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 4 },
  tipBullet: { fontSize: 10, color: '#166534', fontWeight: '700' },
  tipText: { fontSize: 10, color: '#166534', flex: 1 },
});
