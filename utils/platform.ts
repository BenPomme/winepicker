/**
 * Platform detection utilities for supporting both web and native platforms
 */

export const isPlatformWeb = () => {
  // Check if window is defined (web) or not (React Native)
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
};

export const isPlatformNative = () => {
  return !isPlatformWeb();
};

export const isPlatformIOS = () => {
  if (!isPlatformNative()) return false;
  // In React Native, we can check the Platform API
  try {
    const Platform = require('react-native').Platform;
    return Platform.OS === 'ios';
  } catch (e) {
    return false;
  }
};

export const isPlatformAndroid = () => {
  if (!isPlatformNative()) return false;
  try {
    const Platform = require('react-native').Platform;
    return Platform.OS === 'android';
  } catch (e) {
    return false;
  }
};

/**
 * Helper for conditionally using platform-specific components
 */
export const platformSelect = <T extends Record<string, any>>(options: {
  web?: T,
  native?: T,
  ios?: T,
  android?: T,
  default: T
}): T => {
  if (isPlatformIOS() && options.ios) return options.ios;
  if (isPlatformAndroid() && options.android) return options.android;
  if (isPlatformNative() && options.native) return options.native;
  if (isPlatformWeb() && options.web) return options.web;
  return options.default;
};
