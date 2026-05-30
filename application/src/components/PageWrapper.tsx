import React from 'react';
import { View, StyleSheet } from 'react-native';
import Footer from './Footer';

interface PageWrapperProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

/**
 * PageWrapper Component
 * Wraps page content with optional Footer
 * Place this around your ScrollablePage content
 * 
 * Usage:
 * <PageWrapper showFooter={true}>
 *   <ScrollablePage>
 *     Your page content
 *   </ScrollablePage>
 * </PageWrapper>
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  showFooter = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      {showFooter && <Footer />}
    </View>
  );
};

export default PageWrapper;
