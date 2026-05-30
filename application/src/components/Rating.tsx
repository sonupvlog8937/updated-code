import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface RatingProps {
  value: number;
  maxStars?: number;
  size?: number;
  showScore?: boolean;
  showCount?: boolean;
  reviewCount?: number;
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  editable?: boolean;
  onChange?: (rating: number) => void;
}

export const Rating: React.FC<RatingProps> = ({
  value = 0,
  maxStars = 5,
  size = 16,
  showScore = false,
  showCount = false,
  reviewCount = 0,
  onPress,
  variant = 'default',
  editable = false,
  onChange,
}) => {
  const rating = Math.max(0, Math.min(maxStars, value));
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  const handleStarPress = (starIndex: number) => {
    if (editable && onChange) {
      onChange(starIndex + 1);
    }
  };

  const renderStars = () => {
    const stars = [];

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <TouchableOpacity
          key={`full-${i}`}
          disabled={!editable}
          onPress={() => handleStarPress(i)}
          hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
        >
          <Text style={[styles.star, { fontSize: size, color: '#facc15' }]}>★</Text>
        </TouchableOpacity>
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <TouchableOpacity
          key="half"
          disabled={!editable}
          onPress={() => handleStarPress(fullStars)}
          hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
        >
          <Text style={[styles.star, { fontSize: size, color: '#facc15' }]}>★</Text>
        </TouchableOpacity>
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <TouchableOpacity
          key={`empty-${i}`}
          disabled={!editable}
          onPress={() => handleStarPress(fullStars + (hasHalfStar ? 1 : 0) + i)}
          hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
        >
          <Text style={[styles.star, { fontSize: size, color: '#d1d5db' }]}>★</Text>
        </TouchableOpacity>
      );
    }

    return stars;
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.starsRow}>{renderStars()}</View>
        {showScore && (
          <Text style={[styles.scoreText, { fontSize: size * 0.875 }]}>
            {rating.toFixed(1)}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'detailed') {
    return (
      <TouchableOpacity
        style={styles.detailedContainer}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.detailedContent}>
          <View style={styles.starsRow}>{renderStars()}</View>
          <View style={styles.detailedInfo}>
            {showScore && (
              <Text style={styles.detailedScore}>{rating.toFixed(1)}</Text>
            )}
            {showCount && reviewCount > 0 && (
              <Text style={styles.reviewCount}>
                ({reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'})
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      style={styles.defaultContainer}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.starsRow}>{renderStars()}</View>
      {showScore && (
        <Text style={[styles.scoreText, { fontSize: size * 0.875, marginLeft: 6 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
      {showCount && reviewCount > 0 && (
        <Text style={[styles.countText, { fontSize: size * 0.75, marginLeft: 6 }]}>
          ({reviewCount})
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailedContainer: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    lineHeight: undefined,
  },
  scoreText: {
    fontWeight: '700',
    color: '#92400e',
  },
  detailedScore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400e',
  },
  countText: {
    fontWeight: '600',
    color: '#64748b',
  },
  reviewCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
});
