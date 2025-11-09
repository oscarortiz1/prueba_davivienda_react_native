/**
 * Environment Configuration
 * Handles environment-specific configurations
 */

import { Platform } from 'react-native';

/**
 * Get the appropriate API base URL based on the platform and environment
 * 
 * For development:
 * - Web: Use localhost
 * - iOS Simulator: Use localhost
 * - Android Emulator: Use 10.0.2.2 (Android emulator's special alias for host machine)
 * - Physical Device: Use your computer's IP address in local network
 */
const getApiBaseUrl = (): string => {
  // For production, use your production API URL
  // if (__DEV__ === false) {
  //   return 'https://your-production-api.com/api';
  // }

  // Development URLs
  if (Platform.OS === 'web') {
    return 'http://localhost:8080/api';
  }

  if (Platform.OS === 'android') {
    // For Android Emulator, use 10.0.2.2 which maps to localhost on host machine
    // For physical Android device, use your computer's IP address
    return 'http://10.0.2.2:8080/api'; // Use 'http://192.168.1.7:8080/api' for physical device
  }

  if (Platform.OS === 'ios') {
    // For iOS Simulator, localhost works fine
    return 'http://localhost:8080/api';
  }

  // Fallback
  return 'http://localhost:8080/api';
};

export const ENV = {
  API_BASE_URL: getApiBaseUrl(),
  API_TIMEOUT: 30000,
  IS_DEV: __DEV__,
} as const;
