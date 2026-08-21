import { apiClient } from '../client';
import type { GoogleLoginRequest, LoginRequest, LoginResponse } from '../../types/auth';

export const authApi = {
  login: (request: LoginRequest) =>
    apiClient.post<LoginResponse>('/api/auth/login', request).then((res) => res.data),
  loginWithGoogle: (request: GoogleLoginRequest) =>
    apiClient.post<LoginResponse>('/api/auth/google', request).then((res) => res.data),
};
