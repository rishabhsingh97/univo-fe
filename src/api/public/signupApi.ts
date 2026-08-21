import { apiClient } from '../client';
import type { LoginResponse } from '../../types/auth';
import type {
  SignupDraftResponse,
  SignupStep1Request,
  SignupStep2Request,
  SignupStep3Request,
} from '../../types/signup';

export const signupApi = {
  step1: (request: SignupStep1Request) =>
    apiClient.post<{ draftId: number }>('/api/public/signup/step1', request).then((res) => res.data),
  step2: (draftId: number, request: SignupStep2Request) =>
    apiClient.put<SignupDraftResponse>(`/api/public/signup/${draftId}/step2`, request).then((res) => res.data),
  getDraft: (draftId: number) =>
    apiClient.get<SignupDraftResponse>(`/api/public/signup/${draftId}`).then((res) => res.data),
  step3: (draftId: number, request: SignupStep3Request) =>
    apiClient.post<LoginResponse>(`/api/public/signup/${draftId}/step3`, request).then((res) => res.data),
};
