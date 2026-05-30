import { useRef } from 'react';
import { Animated } from 'react-native';

export const HEADER_HEIGHT = 60;

/**
 * Hook for managing scroll events (not used for header animation on cart)
 */
export const useScrollHeader = () => {
  const handleScroll = (event: any) => {
    // Just a pass-through for scroll event throttling
    // No header animation needed
  };

  return {
    headerHeight: HEADER_HEIGHT,
    handleScroll,
  };
};
