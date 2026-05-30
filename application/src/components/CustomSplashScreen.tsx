import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after 2 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Z Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.zIcon}>Z</Text>
        </View>

        {/* App Name */}
        <View style={styles.nameContainer}>
          <Text style={styles.appName}>
            <Text style={styles.zee}>zee</Text>
            <Text style={styles.daddy}>daddy</Text>
          </Text>
          <Text style={styles.tagline}>ONLINE SHOPPING APP</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff6b2b",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  zIcon: {
    fontSize: 72,
    fontFamily: "Inter_700Bold",
    color: "#ff6b2b",
    fontWeight: "900",
  },
  nameContainer: {
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  zee: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  daddy: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  tagline: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 2,
    opacity: 0.9,
  },
});
