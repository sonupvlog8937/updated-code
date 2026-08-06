import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  confirmed:  { bg: '#d1fae5', color: '#065f46', label: 'Confirmed' },
  shipped:    { bg: '#dbeafe', color: '#1e40af', label: 'Shipped' },
  delivered:  { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  active:     { bg: '#d1fae5', color: '#065f46', label: 'Active' },
  inactive:   { bg: '#f3f4f6', color: '#6b7280', label: 'Inactive' },
  processing: { bg: '#ede9fe', color: '#5b21b6', label: 'Processing' },
  refunded:   { bg: '#fce7f3', color: '#9d174d', label: 'Refunded' },
  open:       { bg: '#fef3c7', color: '#92400e', label: 'Open' },
  paid:       { bg: '#d1fae5', color: '#065f46', label: 'Paid' },
};

interface StatusBadgeProps {
  status: string;
  small?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, small }) => {
  const key = status?.toLowerCase() ?? 'pending';
  const config = STATUS_CONFIG[key] ?? { bg: '#f3f4f6', color: '#374151', label: status ?? 'Unknown' };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: config.color }, small && styles.smallText]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  smallText: {
    fontSize: 10,
  },
});
