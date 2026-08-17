import { apiClient } from '../client';
import type { ChangePasswordRequest, UpdateTimezoneRequest, UserResponse } from '../../types/auth';

export const meApi = {
  updateTimezone: (request: UpdateTimezoneRequest) =>
    apiClient.put<UserResponse>('/api/me/timezone', request).then((res) => res.data),

  changePassword: (request: ChangePasswordRequest) =>
    apiClient.post<void>('/api/me/change-password', request).then(() => undefined),
};
