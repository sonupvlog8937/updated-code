import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingBreakdown {
  rating: number;
  count: number;
  percentage: number;
}

interface RatingComponentProps {
  averageRating: number;
  totalRatings: number;
  ratingBreakdown?: RatingBreakdown[];
  onSeeReviews?: () => void;
}

/**
 * Rating Component - Shows product rating with breakdown
 * Like on Flipkart/Amazon product details page
 */
export const RatingComponent: React.FC<RatingComponentProps> = ({
  averageRating,
  totalRatings,
  ratingBreakdown = [],
  onSeeReviews,
}) => {
  // Calculate breakdown if not provided
  const breakdown = useMemo(() => {
    if (ratingBreakdown.length > 0) {
      return ratingBreakdown;
    }

    // Default breakdown (can be customized based on actual data)
    return [
      { rating: 5, count: Math.floor(totalRatings * 0.4), percentage: 40 },
      { rating: 4, count: Math.floor(totalRatings * 0.2), percentage: 20 },
      { rating: 3, count: Math.floor(totalRatings * 0.15), percentage: 15 },
      { rating: 2, count: Math.floor(totalRatings * 0.1), percentage: 10 },
      { rating: 1, count: Math.floor(totalRatings * 0.15), percentage: 15 },
    ];
  }, [ratingBreakdown, totalRatings]);

  const starRating = (value: number) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          style={{
            fontSize: 14,
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
      {/* Main Rating Box */}
      <View style={styles.mainRatingBox}>
        <View style={styles.ratingHeader}>
          <Text style={styles.ratingScore}>{averageRating.toFixed(1)}</Text>
          <View style={{ gap: 6 }}>
            {starRating(averageRating)}
            <Text style={styles.ratingCount}>
              {totalRatings > 0 ? `${totalRatings.toLocaleString()} ratings` : 'No ratings yet'}
            </Text>
          </View>
        </View>
      </View>

      {/* Rating Breakdown */}
      {totalRatings > 0 && (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Rating Distribution</Text>

          {breakdown
            .sort((a, b) => b.rating - a.rating)
            .map((item) => (
              <View key={item.rating} style={styles.breakdownRow}>
                {/* Stars */}
                <View style={styles.starsColumn}>
                  {starRating(item.rating)}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressColumn}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* Count */}
                <Text style={styles.countText}>{item.count}</Text>
              </View>
            ))}
        </View>
      )}

      {/* See Reviews Button */}
      {totalRatings > 0 && onSeeReviews && (
        <TouchableOpacity
          style={styles.seeReviewsBtn}
          onPress={onSeeReviews}
        >
          <Text style={styles.seeReviewsBtnText}>See all reviews</Text>
          <Ionicons name="chevron-forward" size={16} color="#2563eb" />
        </TouchableOpacity>
      )}

      {/* No Ratings */}
      {totalRatings === 0 && (
        <View style={styles.noRatingsContainer}>
          <Ionicons name="star-outline" size={40} color="#d1d5db" />
          <Text style={styles.noRatingsText}>No ratings yet</Text>
          <Text style={styles.noRatingsSubText}>
            Be the first to rate this product
          </Text>
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
    padding: 16,
    marginBottom: 12,
  },
  mainRatingBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingScore: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  ratingCount: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  breakdownContainer: {
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  starsColumn: {
    width: 60,
  },
  progressColumn: {
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
    minWidth: 40,
    textAlign: 'right',
  },
  seeReviewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    marginTop: 8,
  },
  seeReviewsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  noRatingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
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
});
