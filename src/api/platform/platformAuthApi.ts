import { apiClient } from '../client';
import type { PlatformLoginRequest, PlatformLoginResponse } from '../../types/platform';

export const platformAuthApi = {
  login: (request: PlatformLoginRequest) =>
    apiClient.post<PlatformLoginResponse>('/api/platform/auth/login', request).then((res) => res.data),
  refresh: () => apiClient.post<PlatformLoginResponse>('/api/platform/auth/refresh').then((res) => res.data),
  logout: () => apiClient.post<void>('/api/platform/auth/logout').then(() => undefined),
};
