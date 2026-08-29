import { apiClient } from '../client';
import type { LoginResponse, SetPasswordRequest } from '../../types/auth';

export const passwordSetupApi = {
  redeem: (request: SetPasswordRequest) =>
    apiClient.post<LoginResponse>('/api/public/password-setup', request).then((res) => res.data),
};
