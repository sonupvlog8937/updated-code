import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Footer from './Footer';

interface ScreenWrapperProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flexGrow: 1,
  },
});

/**
 * ScreenWrapper Component
 * Wraps page content with Footer at the bottom
 * Use this component in all your screens
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  showFooter = true,
}) => {
  return (
    <ScrollView style={styles.container} scrollEnabled={true} bounces={false}>
      <View style={styles.content}>{children}</View>
      {showFooter && <Footer />}
    </ScrollView>
  );
};

export default ScreenWrapper;
