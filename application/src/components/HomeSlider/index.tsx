import React, { useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SlideItem, RootStackParamList } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  data: SlideItem[];
}

const HomeSlider: React.FC<Props> = ({ data }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = data?.length ? [...data].reverse() : [];

  // Auto-scroll
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      flatListRef.current?.scrollToIndex({ 
        index: next, 
        animated: true,
        viewPosition: 0.5 
      });
      setActiveIndex(next);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeIndex, slides.length]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  );

  const onScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({ 
        index: info.index, 
        animated: true,
        viewPosition: 0.5 
      });
    });
  };

  const handleSlidePress = (item: SlideItem) => {
    const url = item?.link || item?.url || item?.redirectUrl || item?.href;
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) return; // open external
    navigation.navigate('Products', {});
  };

  if (!slides.length) {
    return <View style={styles.skeleton} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        onScrollToIndexFailed={onScrollToIndexFailed}
        getItemLayout={(data, index) => ({
          length: SCREEN_W - 24,
          offset: (SCREEN_W - 24) * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => handleSlidePress(item)}
            style={styles.slide}
          >
            <Image
              source={{ uri: item?.images?.[0] }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Gradient overlay */}
            <View style={styles.gradientOverlay} />

            {/* Text overlay */}
            {(item?.title || item?.subtitle || item?.badge) && (
              <View style={styles.textOverlay}>
                {item?.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                {item?.title && (
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                )}
                {item?.subtitle && (
                  <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
                )}
              </View>
            )}

            {/* Slide counter */}
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {index + 1} / {slides.length}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ 
                index: i, 
                animated: true,
                viewPosition: 0.5 
              });
              setActiveIndex(i);
            }}
          >
            <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  skeleton: {
    marginHorizontal: 12,
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
  },
  slide: {
    width: SCREEN_W - 24,
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 26,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  counter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  counterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,107,43,0.3)',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: '#FF6B2B',
  },
});

export default HomeSlider;
