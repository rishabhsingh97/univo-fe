import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'erp.accessToken';

/**
 * Single axios instance for the whole app - every api/<domain>/*.ts module imports this
 * instead of creating its own client, so base URL, auth header, and 401 handling are defined
 * in exactly one place.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      // Platform-admin pages share this same client/token slot (mutually exclusive with a
      // tenant session in one browser tab) - send an expired platform session back to the
      // platform login, not the tenant one.
      const isPlatform = window.location.pathname.startsWith('/platform');
      const loginPath = isPlatform ? '/platform/login' : '/login';
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  },
);
