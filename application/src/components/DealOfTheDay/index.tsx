import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DealData, RootStackParamList } from '../../types';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface Props {
  deal: DealData;
}

const DealOfTheDay: React.FC<Props> = ({ deal }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endTime = deal?.endTime ? new Date(deal.endTime) : new Date();
      if (!deal?.endTime) endTime.setHours(23, 59, 59, 999);
      const diff = endTime.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [deal?.endTime]);

  if (!deal) return null;

  const timerUnits = [
    { val: timeLeft.hours, label: 'HRS' },
    { val: timeLeft.minutes, label: 'MIN' },
    { val: timeLeft.seconds, label: 'SEC' },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        {/* Background dots pattern */}
        <View style={styles.bgPattern} />

        {/* Content: left + right */}
        <View style={styles.row}>
          {/* Left: text */}
          <View style={styles.left}>
            <View style={styles.badgeRow}>
              <Text style={styles.bolt}>⚡</Text>
              <Text style={styles.badgeLabel}>{deal?.badge || 'Deal of the Day'}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>{deal?.title || 'Special Deal'}</Text>
            {deal?.subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>{deal.subtitle}</Text>
            )}
            {deal?.discount && (
              <View style={styles.discountRow}>
                <Text style={styles.discountNum}>{deal.discount}%</Text>
                <Text style={styles.off}> OFF</Text>
              </View>
            )}

            {/* Timer */}
            <View style={styles.timer}>
              {timerUnits.map((t, i) => (
                <React.Fragment key={i}>
                  {i !== 0 && <Text style={styles.colon}>:</Text>}
                  <View style={styles.timerBox}>
                    <Text style={styles.timerVal}>{String(t.val).padStart(2, '0')}</Text>
                    <Text style={styles.timerLabel}>{t.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('products' as any, {})}>
              <Text style={styles.ctaText}>{deal?.ctaText || 'Grab Deal Now'} →</Text>
            </TouchableOpacity>
          </View>

          {/* Right: image */}
          <View style={styles.right}>
            <Image
              source={{ uri: deal.image }}
              style={styles.img}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    padding: 20,
    minHeight: 260,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,107,43,0.05)',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  left: {
    flex: 1,
    justifyContent: 'center',
  },
  right: {
    width: 130,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#2d2d2d',
  },
  img: {
    width: '100%',
    height: '100%',
    minHeight: 200,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  bolt: { fontSize: 14 },
  badgeLabel: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  discountNum: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF6B2B',
    lineHeight: 40,
  },
  off: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  timerBox: {
    backgroundColor: 'rgba(255,107,43,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.3)',
    borderRadius: 10,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerVal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  timerLabel: {
    color: 'rgba(255,107,43,0.7)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  colon: {
    color: 'rgba(255,107,43,0.4)',
    fontSize: 18,
    fontWeight: '300',
    marginBottom: 12,
  },
  cta: {
    backgroundColor: '#FF6B2B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default DealOfTheDay;
