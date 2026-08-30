import { apiClient } from '../client';
import type { CompanyRequest, CompanyResponse } from '../../types/orgStructure';

const BASE = '/api/v1/hr/companies/current';

// Company is a single implicit record per tenant - see CompanyController.
export const companyApi = {
  getCurrent: () => apiClient.get<CompanyResponse>(BASE).then((res) => res.data),

  updateCurrent: (request: CompanyRequest) => apiClient.put<CompanyResponse>(BASE, request).then((res) => res.data),
};
