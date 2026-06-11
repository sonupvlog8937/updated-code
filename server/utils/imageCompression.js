/**
 * Image compression and optimization utility for Cloudinary uploads
 * 
 * This provides standardized compression settings for different image types
 */

/**
 * Get Cloudinary upload options for product images
 * Optimized for product galleries with good quality and reasonable file size
 */
export const getProductImageOptions = () => ({
  use_filename: true,
  unique_filename: false,
  overwrite: false,
  quality: 'auto:good',        // Automatic quality optimization
  fetch_format: 'auto',        // Auto format (WebP for supported browsers)
  transformation: [
    {
      width: 1200,               // Max width 1200px
      height: 1200,              // Max height 1200px
      crop: 'limit',             // Only resize if larger
      quality: 85,               // 85% quality (good balance)
      format: 'jpg'              // Convert to JPG
    }
  ]
});

/**
 * Get Cloudinary upload options for banner images
 * Optimized for larger banner/hero images
 */
export const getBannerImageOptions = () => ({
  use_filename: true,
  unique_filename: false,
  overwrite: false,
  quality: 'auto:good',
  fetch_format: 'auto',
  transformation: [
    {
      width: 1920,               // Wider for banners
      height: 1080,              // Standard banner height
      crop: 'limit',
      quality: 85,
      format: 'jpg'
    }
  ]
});

/**
 * Get Cloudinary upload options for logo/icon images
 * Optimized for smaller images that need transparency
 */
export const getLogoImageOptions = () => ({
  use_filename: true,
  unique_filename: false,
  overwrite: false,
  quality: 'auto:best',        // Higher quality for logos
  fetch_format: 'auto',
  transformation: [
    {
      width: 800,                // Smaller for logos
      height: 800,
      crop: 'limit',
      quality: 90,               // Higher quality for logos
      format: 'png'              // PNG for transparency support
    }
  ]
});

/**
 * Get Cloudinary upload options for blog/content images
 * Balanced optimization for content images
 */
export const getBlogImageOptions = () => ({
  use_filename: true,
  unique_filename: false,
  overwrite: false,
  quality: 'auto:good',
  fetch_format: 'auto',
  transformation: [
    {
      width: 1400,               // Slightly larger for blog content
      height: 1000,
      crop: 'limit',
      quality: 82,               // Slightly more compression
      format: 'jpg'
    }
  ]
});

/**
 * Get Cloudinary upload options for category images
 * Optimized for category thumbnails and headers
 */
export const getCategoryImageOptions = () => ({
  use_filename: true,
  unique_filename: false,
  overwrite: false,
  quality: 'auto:good',
  fetch_format: 'auto',
  transformation: [
    {
      width: 800,                // Medium size for categories
      height: 800,
      crop: 'limit',
      quality: 85,
      format: 'jpg'
    }
  ]
});
