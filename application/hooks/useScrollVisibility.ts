import { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export const useScrollVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  const lastOffsetY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    
    // Show tabs when scrolling up
    if (currentOffsetY < lastOffsetY.current && !isVisible) {
      setIsVisible(true);
    }
    // Hide tabs when scrolling down (only if scrolled more than 50px)
    else if (currentOffsetY > lastOffsetY.current + 50 && isVisible) {
      setIsVisible(false);
    }
    
    lastOffsetY.current = currentOffsetY;
  };

  return { isVisible, handleScroll };
};
