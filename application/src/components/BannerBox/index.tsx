import React from "react";
import {
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  ImageSourcePropType,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

interface BannerItem {
  subCatId?: string | null;
  catId?: string;
  bannerTitle?: string;
}

interface BannerBoxProps {
  item: BannerItem;
  img: ImageSourcePropType | { uri: string };
}

const BannerBox: React.FC<BannerBoxProps> = ({ item, img }) => {
  const navigation = useNavigation<any>();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const destination =
    item?.subCatId !== undefined &&
    item?.subCatId !== null &&
    item?.subCatId !== ""
      ? { screen: "Products", params: { subCatId: item.subCatId } }
      : { screen: "Products", params: { catId: item?.catId } };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.03,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    navigation.navigate(destination.screen, destination.params);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View
        style={[styles.inner, { transform: [{ scale: scaleAnim }] }]}
      >
        <Image
          source={typeof img === "string" ? { uri: img } : img}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={item?.bannerTitle || "banner"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  inner: {
    width: "100%",
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
});

export default BannerBox;