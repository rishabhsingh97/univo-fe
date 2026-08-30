import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { CompanyFileCategory, CompanyFileResponse } from '../../types/companyFiles';

const BASE = '/api/company-files';

export const companyFileApi = {
  list: (page = 0, size = 20) =>
    apiClient.get<PageResponse<CompanyFileResponse>>(BASE, { params: { page, size } }).then((res) => res.data),

  upload: (name: string, category: CompanyFileCategory, description: string, file: File) => {
    const form = new FormData();
    form.append('name', name);
    form.append('category', category);
    if (description) form.append('description', description);
    form.append('file', file);
    return apiClient
      .post<CompanyFileResponse>(BASE, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data);
  },

  // Same "fetch as blob, hand the browser an object URL" approach as employeeDocumentApi.download
  // - the download endpoint needs the same auth as every other request, so a plain <a href> would
  // fail.
  download: async (id: number, fileName: string) => {
    const response = await apiClient.get<Blob>(`${BASE}/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },

  delete: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then(() => undefined),
};
