import React from "react";
import {
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
  Animated,
  ImageSourcePropType,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

interface BannerItem {
  subCatId?: string | null;
  catId?: string;
  bannerTitle?: string;
  price?: number | string;
}

interface BannerBoxV2Props {
  image: ImageSourcePropType | string;
  item: BannerItem | null | undefined;
}

const BannerBoxV2: React.FC<BannerBoxV2Props> = ({ image, item }) => {
  const navigation = useNavigation<any>();
  const translateY = React.useRef(new Animated.Value(0)).current;
  const shadowOpacity = React.useRef(new Animated.Value(0.08)).current;

  if (!item) return null;

  const destination =
    item?.subCatId !== undefined &&
    item?.subCatId !== null &&
    item?.subCatId !== ""
      ? { screen: "Products", params: { subCatId: item.subCatId } }
      : { screen: "Products", params: { catId: item?.catId } };

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: -4,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.18,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.08,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePress = () => {
    navigation.navigate(destination.screen, destination.params);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateY }],
            shadowOpacity,
          },
        ]}
      >
        {/* Image Section */}
        <View style={styles.mediaContainer}>
          <Image
            source={typeof image === "string" ? { uri: image } : image}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={item?.bannerTitle || "Promotional banner"}
          />
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <Text style={styles.label}>Limited offer</Text>
          <Text style={styles.title} numberOfLines={2}>
            {item?.bannerTitle}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.price}>₹{item?.price}</Text>
            <View style={styles.ctaContainer}>
              <Text style={styles.cta}>Shop now</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4, // Android shadow
  },
  mediaContainer: {
    width: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#f59e0b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 23,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  ctaContainer: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
});

export default BannerBoxV2;