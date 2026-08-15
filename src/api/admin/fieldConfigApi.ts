import { apiClient } from '../client';
import type { UiFieldConfigRequest, UiFieldConfigResponse } from '../../types/admin';

export const fieldConfigApi = {
  /** Admin CRUD - gated behind admin.fieldconfig.manage on the backend, used by the Settings >
   * Fields & Labels page. */
  listByEntity: (entityName: string) =>
    apiClient
      .get<UiFieldConfigResponse[]>('/api/admin/field-config', { params: { entityName } })
      .then((res) => res.data),

  /** Read-only, open to any authenticated user (not admin.fieldconfig.manage-gated) - what
   * entity pages call to resolve their own field labels/required/readOnly/enabled. Hits a
   * separate backend route (FieldConfigController), not /api/admin/field-config. */
  listForEntity: (entityName: string) =>
    apiClient
      .get<UiFieldConfigResponse[]>('/api/field-config', { params: { entityName } })
      .then((res) => res.data),

  create: (request: UiFieldConfigRequest) =>
    apiClient.post<UiFieldConfigResponse>('/api/admin/field-config', request).then((res) => res.data),

  update: (id: number, request: UiFieldConfigRequest) =>
    apiClient.put<UiFieldConfigResponse>(`/api/admin/field-config/${id}`, request).then((res) => res.data),

  delete: (id: number) => apiClient.delete<void>(`/api/admin/field-config/${id}`).then(() => undefined),
};
