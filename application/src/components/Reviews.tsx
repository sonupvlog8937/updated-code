import React, { useEffect, useState, useCallback } from 'react';
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
  SafeAreaView,
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

interface ReviewsProps {
  productId: string;
  onReviewsCountChange?: (count: number) => void;
}

export const Reviews: React.FC<ReviewsProps> = ({
  productId,
  onReviewsCountChange,
}) => {
  const { userData } = useSelector((state: RootState) => state.app);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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

  // Load more
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, false);
  }, [page, fetchReviews]);

  // Star component
  const StarRating: React.FC<{ value: number; onChange?: (val: number) => void; readonly?: boolean }> = ({
    value,
    onChange,
    readonly = false,
  }) => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
          style={{ opacity: readonly ? 0.7 : 1 }}
        >
          <Text style={{ fontSize: 20, color: star <= value ? '#facc15' : '#d1d5db' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Customer Reviews</Text>
      <Text style={styles.subtitle}>{totalReviews} reviews</Text>

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubText}>Be the first to review this product</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          renderItem={({ item: review }) => (
            <View style={styles.reviewItem}>
              {/* User Info */}
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  <Image
                    source={{
                      uri: review.image || review.userImage || 'https://via.placeholder.com/50',
                    }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{review.userName}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <StarRating value={review.rating} readonly />
              </View>

              {/* Review Text */}
              <Text style={styles.reviewText}>{review.review}</Text>
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
                  <>
                    <Text style={styles.loadMoreText}>
                      Load More ({totalReviews - reviews.length} remaining)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Add Review Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Add a Review</Text>

        {/* Rating */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Rating</Text>
          <StarRating value={newRating} onChange={setNewRating} />
        </View>

        {/* Review Text */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Your Review</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Write your review here..."
            placeholderTextColor="rgba(0,0,0,0.4)"
            multiline
            numberOfLines={5}
            maxLength={500}
            value={newReview}
            onChangeText={setNewReview}
            editable={!submitting}
          />
          <Text style={styles.charCount}>
            {newReview.length}/500
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { opacity: submitting ? 0.6 : 1 },
          ]}
          onPress={handleAddReview}
          disabled={submitting || !userData?._id}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Review</Text>
          )}
        </TouchableOpacity>

        {!userData?._id && (
          <Text style={styles.loginPrompt}>Please login to submit a review</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 12,
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
    marginBottom: 16,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  reviewItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  userDetails: {
    flex: 1,
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
  reviewText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    marginLeft: 58,
  },
  loadMoreBtn: {
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  formContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  formSection: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewInput: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'right',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  loginPrompt: {
    fontSize: 11,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 8,
  },
});
