import { apiClient } from '../client';
import type { CreateModuleRequest, ModuleResponse } from '../../types/platform';

const BASE = '/api/platform/modules';

export const platformModuleApi = {
  list: () => apiClient.get<ModuleResponse[]>(BASE).then((res) => res.data),

  create: (request: CreateModuleRequest) => apiClient.post<ModuleResponse>(BASE, request).then((res) => res.data),

  delete: (moduleKey: string) => apiClient.delete<void>(`${BASE}/${moduleKey}`).then(() => undefined),
};
