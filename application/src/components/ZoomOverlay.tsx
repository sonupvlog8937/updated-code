import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STAGE_H = SCREEN_W; // 1:1 aspect ratio for mobile

// ── Types ──
interface ZoomOverlayProps {
  src: string;
  onClose: () => void;
}

interface ProductZoomProps {
  images?: string[];
}

// ── Zoom Overlay Modal ──────────────────────────────────────────────────────
const ZoomOverlay: React.FC<ZoomOverlayProps> = ({ src, onClose }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const baseScale = useRef(1);
  const lastScale = useRef(1);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastDist = useRef(0);
  const lastTap = useRef(0);

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.hypot(dx, dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const { touches } = e.nativeEvent;
        if (touches.length === 2) {
          lastDist.current = getDistance(touches);
        } else {
          // Double tap detection
          const now = Date.now();
          if (now - lastTap.current < 280) {
            const cv = lastScale.current;
            if (cv > 1) {
              Animated.parallel([
                Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
              ]).start();
              lastScale.current = 1;
              lastX.current = 0;
              lastY.current = 0;
            } else {
              Animated.spring(scale, { toValue: 2.5, useNativeDriver: true }).start();
              lastScale.current = 2.5;
            }
          }
          lastTap.current = now;
        }
      },

      onPanResponderMove: (e, gestureState) => {
        const { touches } = e.nativeEvent;
        if (touches.length === 2) {
          const dist = getDistance(touches);
          if (lastDist.current > 0) {
            const newScale = Math.min(Math.max(lastScale.current * (dist / lastDist.current), 1), 5);
            scale.setValue(newScale);
            baseScale.current = newScale;
          }
          lastDist.current = dist;
        } else if (lastScale.current > 1) {
          translateX.setValue(lastX.current + gestureState.dx);
          translateY.setValue(lastY.current + gestureState.dy);
        }
      },

      onPanResponderRelease: (e, gestureState) => {
        lastScale.current = baseScale.current;
        if (lastScale.current > 1) {
          lastX.current = lastX.current + gestureState.dx;
          lastY.current = lastY.current + gestureState.dy;
        }
        lastDist.current = 0;
      },
    })
  ).current;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={styles.zoomOverlay}>
        {/* Close Button */}
        <TouchableOpacity style={styles.zoomClose} onPress={onClose}>
          <Text style={styles.zoomCloseText}>✕</Text>
        </TouchableOpacity>

        {/* Hint */}
        <Text style={styles.zoomHint}>Double-tap or pinch to zoom</Text>

        {/* Zoomable Image */}
        <Animated.View
          style={[
            styles.zoomImgWrap,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: src }}
            style={styles.zoomImg}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// ── ProductZoom ─────────────────────────────────────────────────────────────
export const ProductZoom: React.FC<ProductZoomProps> = ({ images = [] }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);
  const total = images.length;

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems?.[0]) {
      setSlideIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const goTo = useCallback((index: number) => {
    flatRef.current?.scrollToIndex({ index, animated: true });
    setSlideIndex(index);
  }, []);

  const dotWidth = (i: number) => {
    const d = Math.abs(i - slideIndex);
    if (d === 0) return 22;
    if (d === 1) return 8;
    return 5;
  };

  return (
    <View style={styles.wrapper}>
      {zoomSrc && <ZoomOverlay src={zoomSrc} onClose={() => setZoomSrc(null)} />}

      {/* Stage */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => images[slideIndex] && setZoomSrc(images[slideIndex])}
        style={styles.stage}
      >
        {/* Counter */}
        {total > 1 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{slideIndex + 1} / {total}</Text>
          </View>
        )}

        {/* Zoom icon */}
        <View style={styles.zoomIcon}>
          <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>🔍</Text>
        </View>

        {/* Nav arrows */}
        {total > 1 && slideIndex > 0 && (
          <TouchableOpacity style={[styles.arrow, styles.arrowLeft]} onPress={() => goTo(slideIndex - 1)}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
        )}
        {total > 1 && slideIndex < total - 1 && (
          <TouchableOpacity style={[styles.arrow, styles.arrowRight]} onPress={() => goTo(slideIndex + 1)}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        )}

        <FlatList
          ref={flatRef}
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={styles.mainImg}
              resizeMode="cover"
            />
          )}
        />
      </TouchableOpacity>

      {/* Dot indicators */}
      {total > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goTo(i)}
              style={[
                styles.dot,
                { width: dotWidth(i), backgroundColor: i === slideIndex ? '#111' : 'rgba(0,0,0,0.15)' },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    width: '100%',
  },
  stage: {
    width: SCREEN_W,
    height: STAGE_H,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    position: 'relative',
  },
  mainImg: {
    width: SCREEN_W,
    height: STAGE_H,
  },
  counter: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  counterText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  zoomIcon: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 17,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  arrowLeft: { left: 14 },
  arrowRight: { right: 14 },
  arrowText: { fontSize: 24, color: 'rgba(0,0,0,0.65)', marginTop: -2 },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  dot: {
    height: 3,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  // Zoom overlay
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 30,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  zoomCloseText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  zoomHint: {
    position: 'absolute',
    bottom: 30,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  zoomImgWrap: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImg: {
    width: SCREEN_W * 0.92,
    height: SCREEN_H * 0.75,
  },
});