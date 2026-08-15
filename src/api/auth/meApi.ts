import { apiClient } from '../client';
import type { UpdateTimezoneRequest, UserResponse } from '../../types/auth';

export const meApi = {
  updateTimezone: (request: UpdateTimezoneRequest) =>
    apiClient.put<UserResponse>('/api/me/timezone', request).then((res) => res.data),
};
