import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ── Zoom Overlay Component ── */
interface ZoomOverlayProps {
  imageUri: string;
  onClose: () => void;
}

const ZoomOverlay: React.FC<ZoomOverlayProps> = ({ imageUri, onClose }) => {
  const scale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = e.scale;
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 10, mass: 0.8 });
      offsetX.value = withSpring(0, { damping: 10, mass: 0.8 });
      offsetY.value = withSpring(0, { damping: 10, mass: 0.8 });
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        offsetX.value = e.translationX;
        offsetY.value = e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        offsetX.value = withSpring(0, { damping: 10, mass: 0.8 });
        offsetY.value = withSpring(0, { damping: 10, mass: 0.8 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: offsetX.value },
      { translateY: offsetY.value },
    ],
  }));

  const combined = Gesture.Simultaneous(pinchGesture, panGesture);

  return (
    <Modal visible={true} transparent={true} onRequestClose={onClose}>
      <View style={styles.zoomOverlay}>
        <TouchableOpacity style={styles.zoomClose} onPress={onClose}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>

        <GestureDetector gesture={combined}>
          <Animated.Image
            source={{ uri: imageUri }}
            style={[styles.zoomImage, animatedStyle]}
            resizeMode="contain"
          />
        </GestureDetector>

        <View style={styles.zoomHint}>
          <Text style={styles.zoomHintText}>Pinch to zoom • Drag to pan</Text>
        </View>
      </View>
    </Modal>
  );
};

/* ── Product Image Swiper Component (Flipkart Style) ── */
interface ProductImageSwiperProps {
  images: string[];
}

export const ProductImageSwiper: React.FC<ProductImageSwiperProps> = ({ images = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const total = images?.length || 0;

  const translateX = useSharedValue(0);
  const offsetX = useSharedValue(0);

  // Pan gesture for swiping
  const panGesture = Gesture.Pan()
    .onStart(() => {
      offsetX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = offsetX.value + event.translationX;
    })
    .onEnd((event) => {
      const threshold = SCREEN_WIDTH * 0.2;
      const velocity = event.velocityX;

      let targetIndex = activeIndex;

      // Determine next index based on swipe
      if (event.translationX > threshold || (velocity < -500 && event.translationX > 0)) {
        // Swipe right - previous image
        targetIndex = Math.max(0, activeIndex - 1);
      } else if (event.translationX < -threshold || (velocity > 500 && event.translationX < 0)) {
        // Swipe left - next image
        targetIndex = Math.min(total - 1, activeIndex + 1);
      }

      // Animate to target position
      translateX.value = withSpring(
        -targetIndex * SCREEN_WIDTH,
        { damping: 12, mass: 1, overshootClamping: true },
        () => {
          runOnJS(setActiveIndex)(targetIndex);
        }
      );
    })
    .minDistance(10);

  // Animated style for the image container
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Navigate to specific index
  const goToIndex = useCallback((index: number) => {
    if (index < 0 || index >= total) return;
    setActiveIndex(index);
    translateX.value = withSpring(
      -index * SCREEN_WIDTH,
      { damping: 12, mass: 1, overshootClamping: true }
    );
  }, [total, translateX]);

  // Previous/Next buttons
  const goPrev = () => goToIndex(activeIndex - 1);
  const goNext = () => goToIndex(activeIndex + 1);

  if (!images || images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="image" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No images available</Text>
      </View>
    );
  }

  return (
    <>
      {zoomImage && <ZoomOverlay imageUri={zoomImage} onClose={() => setZoomImage(null)} />}

      <View style={styles.container}>
        {/* Main Swiper */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.mainContainer}>
            <Animated.View style={[styles.imagesContainer, animatedContainerStyle]}>
              {images.map((image, index) => (
                <TouchableOpacity
                  key={`img-${index}`}
                  activeOpacity={0.95}
                  onPress={() => setZoomImage(image)}
                  style={styles.imageWrapper}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.mainImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </Animated.View>

            {/* Counter Badge */}
            {total > 1 && (
              <View style={styles.counter}>
                <Text style={styles.counterText}>
                  {activeIndex + 1} / {total}
                </Text>
              </View>
            )}

            {/* Zoom Icon */}
            <View style={styles.zoomIconContainer}>
              <Ionicons name="search" size={16} color="rgba(0,0,0,0.5)" />
            </View>

            {/* Previous Button */}
            {activeIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={goPrev}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color="rgba(0,0,0,0.7)" />
              </TouchableOpacity>
            )}

            {/* Next Button */}
            {activeIndex < total - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={goNext}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </GestureDetector>

        {/* Thumbnail Strip */}
        {total > 1 && (
          <View style={styles.thumbnailsSection}>
            <View style={styles.thumbnailsScroll}>
              {images.map((image, index) => (
                <TouchableOpacity
                  key={`thumb-${index}`}
                  onPress={() => goToIndex(index)}
                  style={[
                    styles.thumbnail,
                    index === activeIndex && styles.thumbnailActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  {index === activeIndex && (
                    <View style={styles.thumbnailCheckmark}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Dot Indicators */}
        {total > 1 && (
          <View style={styles.dotsSection}>
            {images.map((_, index) => {
              const isActive = index === activeIndex;
              return (
                <TouchableOpacity
                  key={`dot-${index}`}
                  onPress={() => goToIndex(index)}
                  style={[
                    styles.dot,
                    isActive && styles.dotActive,
                  ]}
                  activeOpacity={0.6}
                />
              );
            })}
          </View>
        )}
      </View>
    </>
  );
};

/* ── Styles ── */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  emptyContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  mainContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  imagesContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 100,
    height: SCREEN_WIDTH,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 20,
  },
  counterText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  zoomIconContainer: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: -20,
  },
  prevButton: {
    left: 12,
  },
  nextButton: {
    right: 12,
  },
  thumbnailsSection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  thumbnailsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 8,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  thumbnailActive: {
    borderColor: '#0f172a',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailCheckmark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0f172a',
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  zoomImage: {
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_HEIGHT * 0.92,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  zoomHintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.2,
  },
});
