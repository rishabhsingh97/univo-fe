import { apiClient } from '../client';
import type { LoginRequest, LoginResponse } from '../../types/auth';

export const authApi = {
  login: (request: LoginRequest) =>
    apiClient.post<LoginResponse>('/api/auth/login', request).then((res) => res.data),
};
