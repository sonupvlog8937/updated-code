import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  value?: number;
  size?: number;
  count?: number | null;
  style?: ViewStyle;
}

const StarRating: React.FC<StarRatingProps> = ({ value = 0, size = 12, count = null, style }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={[styles.row, style]}>
      {stars.map((star) => {
        const filled = value >= star;
        const half   = !filled && value >= star - 0.5;
        return (
          <Ionicons
            key={star}
            name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
            size={size}
            color={filled || half ? '#f59e0b' : '#d1d5db'}
            style={{ marginRight: 1 }}
          />
        );
      })}
      {count != null && count > 0 && (
        <Text style={styles.count}>({count})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center' },
  count: { fontSize: 11, color: '#9ca3af', fontWeight: '500', marginLeft: 4 },
});

export default StarRating;