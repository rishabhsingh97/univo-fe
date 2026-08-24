import { apiClient } from '../client';
import type { PageResponse } from '../../types/common';
import type { IncomeTaxSlabRequest, IncomeTaxSlabResponse, ProfessionalTaxSlabRequest, ProfessionalTaxSlabResponse } from '../../types/finance';

const BASE = '/api/v1/finance/tax-slabs';

export const taxSlabApi = {
  listProfessionalTax: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<ProfessionalTaxSlabResponse>>(`${BASE}/professional-tax`, { params: { page, size, sort } })
      .then((res) => res.data),

  createProfessionalTax: (request: ProfessionalTaxSlabRequest) =>
    apiClient.post<ProfessionalTaxSlabResponse>(`${BASE}/professional-tax`, request).then((res) => res.data),

  updateProfessionalTax: (id: number, request: ProfessionalTaxSlabRequest) =>
    apiClient.put<ProfessionalTaxSlabResponse>(`${BASE}/professional-tax/${id}`, request).then((res) => res.data),

  deleteProfessionalTax: (id: number) =>
    apiClient.delete<void>(`${BASE}/professional-tax/${id}`).then(() => undefined),

  listIncomeTax: (page = 0, size = 20, sort?: string) =>
    apiClient.get<PageResponse<IncomeTaxSlabResponse>>(`${BASE}/income-tax`, { params: { page, size, sort } })
      .then((res) => res.data),

  createIncomeTax: (request: IncomeTaxSlabRequest) =>
    apiClient.post<IncomeTaxSlabResponse>(`${BASE}/income-tax`, request).then((res) => res.data),

  updateIncomeTax: (id: number, request: IncomeTaxSlabRequest) =>
    apiClient.put<IncomeTaxSlabResponse>(`${BASE}/income-tax/${id}`, request).then((res) => res.data),

  deleteIncomeTax: (id: number) =>
    apiClient.delete<void>(`${BASE}/income-tax/${id}`).then(() => undefined),
};
