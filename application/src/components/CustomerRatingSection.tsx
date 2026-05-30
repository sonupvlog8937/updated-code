import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RatingBreakdown {
  stars: number;
  count: number;
  percentage: number;
}

interface CustomerRatingSectionProps {
  averageRating: number;
  totalRatings: number;
  onViewAllReviews?: () => void;
}

/**
 * Customer Rating Section - Shows rating stats and distribution
 * Like the website's ProductDetails rating display
 */
export const CustomerRatingSection: React.FC<CustomerRatingSectionProps> = ({
  averageRating = 0,
  totalRatings = 0,
  onViewAllReviews,
}) => {
  // Calculate breakdown
  const ratingBreakdown = useMemo<RatingBreakdown[]>(() => {
    if (totalRatings === 0) {
      return [
        { stars: 5, count: 0, percentage: 0 },
        { stars: 4, count: 0, percentage: 0 },
        { stars: 3, count: 0, percentage: 0 },
        { stars: 2, count: 0, percentage: 0 },
        { stars: 1, count: 0, percentage: 0 },
      ];
    }

    // Default distribution (can be customized with API data)
    return [
      { stars: 5, count: Math.floor(totalRatings * 0.4), percentage: 40 },
      { stars: 4, count: Math.floor(totalRatings * 0.2), percentage: 20 },
      { stars: 3, count: Math.floor(totalRatings * 0.15), percentage: 15 },
      { stars: 2, count: Math.floor(totalRatings * 0.1), percentage: 10 },
      { stars: 1, count: Math.floor(totalRatings * 0.15), percentage: 15 },
    ];
  }, [totalRatings]);

  // Star component
  const StarRating = ({ value, size = 16 }: { value: number; size?: number }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          style={{
            fontSize: size,
            color: star <= Math.round(value) ? '#facc15' : '#d1d5db',
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customer Reviews</Text>
      </View>

      {totalRatings === 0 ? (
        // No ratings state
        <View style={styles.noRatingsContainer}>
          <Ionicons name="star-outline" size={48} color="#d1d5db" />
          <Text style={styles.noRatingsText}>No ratings yet</Text>
          <Text style={styles.noRatingsSubText}>
            Be the first to rate this product
          </Text>
        </View>
      ) : (
        <>
          {/* Main Rating Box */}
          <View style={styles.mainRatingBox}>
            <View style={styles.ratingScoreSection}>
              <Text style={styles.ratingScore}>
                {averageRating.toFixed(1)}
              </Text>
              <View>
                <StarRating value={averageRating} size={20} />
                <Text style={styles.ratingCountText}>
                  Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating Distribution */}
          <View style={styles.distributionContainer}>
            <Text style={styles.distributionTitle}>Rating Distribution</Text>

            {ratingBreakdown.map((breakdown) => (
              <View key={breakdown.stars} style={styles.distributionRow}>
                {/* Stars */}
                <View style={styles.starsColumn}>
                  <StarRating value={breakdown.stars} size={14} />
                </View>

                {/* Progress Bar */}
                <View style={styles.barColumn}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${breakdown.percentage}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* Count */}
                <Text style={styles.countText}>{breakdown.count}</Text>
              </View>
            ))}
          </View>

          {/* View All Reviews Button */}
          {onViewAllReviews && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={onViewAllReviews}
            >
              <Text style={styles.viewAllBtnText}>View All Reviews</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563eb" />
            </TouchableOpacity>
          )}
        </>
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
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  noRatingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noRatingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  noRatingsSubText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  mainRatingBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  ratingScoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ratingScore: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0f172a',
  },
  ratingCountText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  distributionContainer: {
    marginBottom: 14,
  },
  distributionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  starsColumn: {
    width: 70,
  },
  barColumn: {
    flex: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#facc15',
    borderRadius: 3,
  },
  countText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    marginTop: 6,
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
});
