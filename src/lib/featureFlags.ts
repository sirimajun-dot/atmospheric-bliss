/**
 * Feature Flags for the application.
 * Set BYPASS_GEOLOCATION to true to skip the browser's geolocation prompt.
 */
export const BYPASS_GEOLOCATION = true;

/**
 * Default coordinates to use when geolocation is bypassed or fails.
 * Default: Bangkok, Thailand
 */
export const DEFAULT_COORDS = {
  lat: 13.7563,
  lon: 100.5018
};
