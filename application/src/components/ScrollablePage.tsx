import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import { useTabsVisibility } from '@/src/context/ScrollVisibilityContext';

interface ScrollablePageProps extends ScrollViewProps {
  children: React.ReactNode;
}

export const ScrollablePage: React.FC<ScrollablePageProps> = ({
  children,
  onScroll,
  ...props
}) => {
  const { setIsTabsVisible } = useTabsVisibility();
  const lastOffsetY = React.useRef(0);

  const handleScroll = (event: any) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;

    // Show tabs when scrolling up
    if (currentOffsetY < lastOffsetY.current - 20) {
      runOnJS(setIsTabsVisible)(true);
    }
    // Hide tabs when scrolling down (only if scrolled more than 20px)
    else if (currentOffsetY > lastOffsetY.current + 20) {
      runOnJS(setIsTabsVisible)(false);
    }

    lastOffsetY.current = currentOffsetY;

    // Call original onScroll if provided
    if (onScroll) {
      onScroll(event);
    }
  };

  return (
    <ScrollView
      scrollEventThrottle={16}
      onScroll={handleScroll}
      {...props}
    >
      {children}
    </ScrollView>
  );
};
