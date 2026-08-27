import axios from 'axios';

/**
 * Single axios instance for the whole app - every api/<domain>/*.ts module imports this
 * instead of creating its own client, so base URL, CSRF header, and 401/refresh handling are
 * defined in exactly one place.
 *
 * Auth now travels as httpOnly cookies the backend sets directly on the response
 * (AuthCookieService) - no token is ever read from or written to JS-visible storage.
 * withCredentials is required for the browser to send/accept those cookies (a tenant subdomain
 * and the API can be different origins; CORS already allows credentials, see
 * TenantOriginCorsConfigurationSource).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Double-submit CSRF: Spring's CookieCsrfTokenRepository (withHttpOnlyFalse) sets a
 * JS-readable XSRF-TOKEN cookie; echoing its value back in X-XSRF-TOKEN on every request lets
 * the backend confirm the caller can read cookies from this origin, not just replay them -
 * which is all a cross-site attacker could otherwise do. Harmless to attach on GETs too (the
 * backend only validates it on state-changing methods). */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

apiClient.interceptors.request.use((config) => {
  const csrfToken = readCookie('XSRF-TOKEN');
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }
  return config;
});

// Shared across concurrent 401s so a burst of requests that all expire at once triggers exactly
// one refresh call, not one per request.
let refreshPromise: Promise<unknown> | null = null;

function isPlatformUrl(url: string): boolean {
  return url.startsWith('/api/platform/') || url.startsWith('api/platform/');
}

function redirectToLogin(isPlatform: boolean) {
  const loginPath = isPlatform ? '/platform/login' : '/login';
  if (window.location.pathname !== loginPath) {
    window.location.href = loginPath;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url ?? '';
    // The refresh/login/logout endpoints themselves must never trigger another refresh attempt
    // on a 401 - that 401 there means the refresh token itself is invalid/expired, not that an
    // access token just needs renewing.
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried && !isAuthEndpoint) {
      originalRequest._retried = true;
      const platform = isPlatformUrl(url);
      try {
        refreshPromise ??= apiClient
          .post(platform ? '/api/platform/auth/refresh' : '/api/auth/refresh')
          .finally(() => {
            refreshPromise = null;
          });
        await refreshPromise;
        return apiClient(originalRequest);
      } catch (refreshError) {
        redirectToLogin(platform);
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      redirectToLogin(isPlatformUrl(url) || window.location.pathname.startsWith('/platform'));
    }

    return Promise.reject(error);
  },
);
