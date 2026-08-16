import { apiClient } from '../client';
import type { PlatformLoginRequest, PlatformLoginResponse } from '../../types/platform';

export const platformAuthApi = {
  login: (request: PlatformLoginRequest) =>
    apiClient.post<PlatformLoginResponse>('/api/platform/auth/login', request).then((res) => res.data),
};
