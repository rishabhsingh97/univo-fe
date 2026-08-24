import { apiClient } from '../client';
import type { ChangePasswordRequest, UpdateProfileRequest, UpdateTimezoneRequest, UserResponse } from '../../types/auth';
import type { EmployeeLinkRequest, EmployeeLinkResponse } from '../../types/hr';

export const meApi = {
  get: () => apiClient.get<UserResponse>('/api/me').then((res) => res.data),

  updateTimezone: (request: UpdateTimezoneRequest) =>
    apiClient.put<UserResponse>('/api/me/timezone', request).then((res) => res.data),

  updateProfile: (request: UpdateProfileRequest) =>
    apiClient.put<UserResponse>('/api/me/profile', request).then((res) => res.data),

  changePassword: (request: ChangePasswordRequest) =>
    apiClient.post<void>('/api/me/change-password', request).then(() => undefined),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<UserResponse>('/api/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data);
  },

  deleteAvatar: () => apiClient.delete<void>('/api/me/avatar').then(() => undefined),

  // Same reasoning as employeeDocumentApi.download(): no cookie auth, so a plain <img src>
  // can't carry the Bearer token - fetch the bytes through apiClient and hand the browser a
  // blob URL instead. Caller is responsible for URL.revokeObjectURL() when done with it.
  getAvatarBlobUrl: async () => {
    const response = await apiClient.get<Blob>('/api/me/avatar', { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },

  listEmployeeLinks: () => apiClient.get<EmployeeLinkResponse[]>('/api/me/employee-links').then((res) => res.data),

  createEmployeeLink: (request: EmployeeLinkRequest) =>
    apiClient.post<EmployeeLinkResponse>('/api/me/employee-links', request).then((res) => res.data),

  updateEmployeeLink: (id: number, request: EmployeeLinkRequest) =>
    apiClient.put<EmployeeLinkResponse>(`/api/me/employee-links/${id}`, request).then((res) => res.data),

  deleteEmployeeLink: (id: number) => apiClient.delete<void>(`/api/me/employee-links/${id}`).then(() => undefined),
};
