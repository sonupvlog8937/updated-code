import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
} from 'react-native';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const FlashSaleBanner: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [couponMessage, setCouponMessage] = useState('');

  useEffect(() => {
    const nextMidnight = new Date();
    nextMidnight.setHours(23, 59, 59, 999);

    const timer = setInterval(() => {
      const diff = nextMidnight.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const copyCoupon = useCallback(() => {
    Clipboard.setString('SAVE20');
    setCouponMessage('✓ Copied: SAVE20');
    setTimeout(() => setCouponMessage(''), 2500);
  }, []);

  const timerUnits = [
    { val: timeLeft.hours, label: 'HRS' },
    { val: timeLeft.minutes, label: 'MIN' },
    { val: timeLeft.seconds, label: 'SEC' },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        {/* Top: badge + title */}
        <View style={styles.top}>
          <View style={styles.flashBadge}>
            <Text style={styles.bolt}>⚡</Text>
            <Text style={styles.flashLabel}>Flash Sale</Text>
          </View>
          <Text style={styles.title}>Ends Tonight! 🔥</Text>
          <Text style={styles.subtitle}>Hurry up — prices reset at midnight!</Text>
        </View>

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

        {/* CTA */}
        <TouchableOpacity style={styles.cta} onPress={copyCoupon}>
          <Text style={styles.copyIcon}>📋 </Text>
          <Text style={styles.ctaText}>Copy SAVE20</Text>
        </TouchableOpacity>

        {couponMessage !== '' && (
          <Text style={styles.couponMsg}>{couponMessage}</Text>
        )}
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
    padding: 22,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.2)',
  },
  top: {
    alignItems: 'center',
    gap: 6,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,107,43,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  bolt: { fontSize: 13 },
  flashLabel: {
    color: '#FF6B2B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerBox: {
    backgroundColor: 'rgba(255,107,43,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.3)',
    borderRadius: 12,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerVal: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  timerLabel: {
    color: 'rgba(255,107,43,0.7)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  colon: {
    color: 'rgba(255,107,43,0.4)',
    fontSize: 22,
    fontWeight: '300',
    marginBottom: 14,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B2B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#FF6B2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  copyIcon: { fontSize: 14 },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  couponMsg: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -8,
  },
});

export default FlashSaleBanner;
