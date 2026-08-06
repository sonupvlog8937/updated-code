import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bgColor, trend, trendUp }) => {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.card}>
      <View style={[s.iconWrap, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <Text style={s.value} numberOfLines={1}>{value}</Text>
      <Text style={s.label} numberOfLines={1}>{label}</Text>
      {trend ? (
        <Text style={[s.trend, { color: trendUp ? colors.success : colors.destructive }]}>
          {trendUp ? '+' : ''}{trend}
        </Text>
      ) : null}
    </View>
  );
};

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 140,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    value: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.foreground,
      fontFamily: 'Inter_700Bold',
      marginBottom: 2,
    },
    label: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter_500Medium',
    },
    trend: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      marginTop: 4,
    },
  });
