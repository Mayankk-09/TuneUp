// api.ts - Unified API and WebSocket URL configuration for TuneUp

const getBackendUrl = (): string => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // Use local backend during local development, otherwise the production Render URL
  return isLocal ? 'http://localhost:5000' : 'https://tuneup-fb4s.onrender.com';
};

/**
 * Returns the full API URL for a given endpoint.
 * Handles duplicate/missing slashes safely.
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getBackendUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Returns the base socket server URL.
 */
export const getSocketUrl = (): string => {
  return getBackendUrl();
};
