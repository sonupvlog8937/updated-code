import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.1;
const THUMBNAIL_SIZE = 80;

interface ZoomModalProps {
  imageUri: string;
  onClose: () => void;
}

const ZoomModal: React.FC<ZoomModalProps> = ({ imageUri, onClose }) => {
  const [loading, setLoading] = useState(true);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.zoomOverlay}>
        <TouchableOpacity style={styles.zoomClose} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {loading && (
          <View style={styles.zoomLoadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        <Image
          source={{ uri: imageUri }}
          style={styles.zoomImage}
          resizeMode="contain"
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
        />

        <View style={styles.zoomHint}>
          <Text style={styles.zoomHintText}>Tap to close</Text>
        </View>
      </View>
    </Modal>
  );
};

interface ProductImageCarouselProps {
  images?: string[] | null;
}

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  images,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const scrollRef = useRef<ScrollView>(null);
  const thumbScrollRef = useRef<ScrollView>(null);

  // Validate and filter images
  const displayImages = useMemo(() => {
    if (!images || !Array.isArray(images)) {
      console.log("🖼️ No images provided");
      return ["https://via.placeholder.com/500x600?text=No+Image"];
    }

    const filtered = images
      .filter((img) => img && typeof img === "string" && img.trim().length > 0)
      .slice(0, 50); // Limit to 50 images max

    console.log("🖼️ Images received:", images.length);
    console.log("🖼️ Valid images:", filtered.length);
    console.log("🖼️ First 3 images:", filtered.slice(0, 3));

    return filtered.length > 0
      ? filtered
      : ["https://via.placeholder.com/500x600?text=No+Image"];
  }, [images]);

  const total = displayImages.length;

  useEffect(() => {
    setActiveIndex(0);
    setImageErrors(new Set());
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    thumbScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [displayImages]);

  const handleScrollEnd = (event: any) => {
    if (!event?.nativeEvent) return;
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < total) {
      setActiveIndex(newIndex);
      // Auto-scroll thumbnails
      const thumbOffset = Math.max(
        0,
        newIndex * (THUMBNAIL_SIZE + 8) - SCREEN_WIDTH / 2 + THUMBNAIL_SIZE / 2,
      );
      thumbScrollRef.current?.scrollTo({ x: thumbOffset, animated: true });
    }
  };

  const goToIndex = (index: number) => {
    if (index < 0 || index >= total) return;
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      y: 0,
      animated: true,
    });
  };

  const handleImageError = (index: number) => {
    console.warn(
      `❌ Image failed to load at index ${index}:`,
      displayImages[index],
    );
    setImageErrors((prev) => new Set([...prev, index]));
  };

  const handleImageLoad = (index: number) => {
    console.log(`✓ Image loaded at index ${index}`);
  };

  const hadError = imageErrors.has(activeIndex);

  return (
    <>
      {zoomImage && (
        <ZoomModal imageUri={zoomImage} onClose={() => setZoomImage(null)} />
      )}

      <View style={styles.container}>
        {/* Main Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={total > 1}
            onMomentumScrollEnd={handleScrollEnd}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={styles.carousel}
            contentContainerStyle={{
              width: SCREEN_WIDTH * total,
            }}
            nestedScrollEnabled={false}
          >
            {displayImages.map((imageUri, index) => (
              <View key={`main-${index}`} style={styles.slideContainer}>
                {imageErrors.has(index) ? (
                  <View style={styles.imageErrorContainer}>
                    <Ionicons name="image-outline" size={48} color="#ccc" />
                    <Text style={styles.errorText}>Unable to load</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => setZoomImage(imageUri)}
                    style={{ flex: 1, width: "100%" }}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.mainImage}
                      resizeMode="contain"
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Counter Badge */}
          {total > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {activeIndex + 1} / {total}
              </Text>
            </View>
          )}

          {/* Zoom Button */}
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => {
              if (!hadError) setZoomImage(displayImages[activeIndex]);
            }}
          >
            <Ionicons name="search" size={18} color="rgba(0,0,0,0.6)" />
          </TouchableOpacity>

          {/* Previous Button */}
          {total > 1 && activeIndex > 0 && (
            <TouchableOpacity
              style={[styles.navBtn, styles.prevBtn]}
              onPress={() => goToIndex(activeIndex - 1)}
            >
              <Ionicons name="chevron-back" size={24} color="rgba(0,0,0,0.7)" />
            </TouchableOpacity>
          )}

          {/* Next Button */}
          {total > 1 && activeIndex < total - 1 && (
            <TouchableOpacity
              style={[styles.navBtn, styles.nextBtn]}
              onPress={() => goToIndex(activeIndex + 1)}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color="rgba(0,0,0,0.7)"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Dot Indicators */}
        {total > 1 && (
          <View style={styles.dotsContainer}>
            {displayImages.map((_, index) => (
              <TouchableOpacity
                key={`dot-${index}`}
                onPress={() => goToIndex(index)}
                style={[
                  styles.dot,
                  index === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Thumbnails */}
        {total > 1 && (
          <View style={styles.thumbContainer}>
            <ScrollView
              ref={thumbScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={styles.thumbContent}
            >
              {displayImages.map((imageUri, index) => (
                <TouchableOpacity
                  key={`thumb-${index}`}
                  onPress={() => goToIndex(index)}
                  style={[
                    styles.thumbnail,
                    index === activeIndex ? styles.thumbActive : {},
                  ]}
                >
                  {imageErrors.has(index) ? (
                    <View style={styles.thumbErrorContainer}>
                      <Ionicons name="image-outline" size={20} color="#ccc" />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                    />
                  )}
                  {index === activeIndex && (
                    <View style={styles.thumbOverlay}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#fff"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  carouselContainer: {
    position: "relative",
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: "#f5f5f7",
    overflow: "hidden",
  },
  carousel: {
    width: "100%",
    height: "100%",
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  imageErrorContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: "#999",
  },
  counter: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  counterText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  zoomBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  prevBtn: {
    left: 12,
  },
  nextBtn: {
    right: 12,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: "#0f172a",
  },
  dotInactive: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  thumbContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8f0",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  thumbContent: {
    gap: 8,
    paddingHorizontal: 8,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  thumbActive: {
    borderColor: "#0f172a",
    borderWidth: 3,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbErrorContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  thumbOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.98)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  zoomImage: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.2,
  },
  zoomLoadingOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  zoomHint: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomHintText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
});
