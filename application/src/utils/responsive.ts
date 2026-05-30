import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Breakpoints
export const IS_SMALL_PHONE = width < 375; // iPhone SE, 6, 7, 8
export const IS_MEDIUM_PHONE = width >= 375 && width < 414; // iPhone 6+, 7+, 8+
export const IS_LARGE_PHONE = width >= 414; // iPhone 11, 12, 13
export const IS_TABLET = width >= 768;

// Responsive spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Responsive padding/margin
export const getHorizontalPadding = () => {
  if (IS_SMALL_PHONE) return 12;
  if (IS_MEDIUM_PHONE) return 14;
  return 16;
};

// Responsive font sizes
export const FONT_SIZES = {
  xs: IS_SMALL_PHONE ? 10 : 11,
  sm: IS_SMALL_PHONE ? 11 : 12,
  base: IS_SMALL_PHONE ? 13 : 14,
  lg: IS_SMALL_PHONE ? 15 : 16,
  xl: IS_SMALL_PHONE ? 17 : 18,
  xxl: IS_SMALL_PHONE ? 20 : 22,
  xxxl: IS_SMALL_PHONE ? 24 : 28,
};

// Grid calculations
export const getProductGridWidth = (columns = 2) => {
  const padding = getHorizontalPadding();
  const gap = 10;
  const totalPadding = padding * 2 + gap * (columns - 1);
  return (SCREEN_WIDTH - totalPadding) / columns;
};

// Product grid columns
export const PRODUCT_GRID_COLUMNS = IS_SMALL_PHONE ? 2 : IS_MEDIUM_PHONE ? 2 : 2;

// Banner heights
export const getBannerHeight = () => {
  if (IS_SMALL_PHONE) return 140;
  if (IS_MEDIUM_PHONE) return 160;
  return 200;
};

// Modal max width
export const MODAL_MAX_WIDTH = Math.min(SCREEN_WIDTH - 32, 500);

// Button sizes for small screens
export const getButtonHeight = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const heights = { sm: 36, md: 48, lg: 56 };
  return IS_SMALL_PHONE ? heights[size] - 4 : heights[size];
};
