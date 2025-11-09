/**
 * Infrastructure Services Exports
 * Centralizes exports for easier imports
 */

import { httpClient } from './services/http.service';
import { useAuthStore } from '../presentation/stores/authStore';

export { httpClient } from './services/http.service';
export { storageService } from './services/storage.service';
export { API_CONFIG, STORAGE_KEYS } from './config/api.config';

/**
 * Initialize infrastructure services
 * Call this once at app startup
 */
export const initializeInfrastructure = () => {
  // Connect http client to auth store for automatic logout on 401/403
  httpClient.setAuthStore(useAuthStore);
};
