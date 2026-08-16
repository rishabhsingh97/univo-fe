import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { EmployeeDocumentResponse } from '../../types/hr';

export const employeeDocumentApi = {
  list: (employeeId: number, page = 0, size = 20, sort?: string) =>
    apiClient
      .get<PageResponse<EmployeeDocumentResponse>>(`/api/v1/hr/employees/${employeeId}/documents`, {
        params: { page, size, sort },
      })
      .then((res) => res.data),

  upload: (employeeId: number, documentType: string, file: File) => {
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('file', file);
    return apiClient
      .post<EmployeeDocumentResponse>(`/api/v1/hr/employees/${employeeId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  // The download endpoint requires the same Bearer token as every other request (no cookie
  // auth), so a plain <a href> to it would 401 - fetch the bytes through apiClient (which
  // attaches the token) and hand the browser a blob to save instead.
  download: async (id: number, fileName: string) => {
    const response = await apiClient.get<Blob>(`/api/v1/hr/documents/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },

  delete: (id: number) => apiClient.delete<void>(`/api/v1/hr/documents/${id}`).then(() => undefined),
};
