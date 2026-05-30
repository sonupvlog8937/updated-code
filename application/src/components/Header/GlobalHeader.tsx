import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useWindowDimensions } from 'react-native';
import Header from './HeaderMain';
import MobileNav from './MobileNav';
import Navigation from './Navigation';
import { GlobalHeaderProvider } from './GlobalHeaderContext';

/**
 * GlobalHeader - Main entry point for the entire header system
 * This component combines Header, MobileNav, Navigation, and CategoryPanel
 */
const GlobalHeaderContent: React.FC = () => {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth > 992;

  return (
    <View style={styles.container}>
      {/* Main Header */}
      <Header />

      {/* Navigation & Category Panel */}
      <Navigation />

      {/* Mobile Bottom Navigation - Only on mobile */}
      {!isDesktop && <MobileNav />}
    </View>
  );
};

const GlobalHeader: React.FC = () => {
  return (
    <GlobalHeaderProvider>
      <GlobalHeaderContent />
    </GlobalHeaderProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GlobalHeader;
