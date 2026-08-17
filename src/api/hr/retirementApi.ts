import { delay, nextMockId, paginate, resolveEmployeeName } from '../mock/mockUtils';
import type { PageResponse } from '../../types/common';
import type { RetirementRequest, RetirementResponse, RetirementStatusUpdateRequest } from '../../types/retirement';

/**
 * MOCK - Retirement has no backend yet (see the HR Lifecycle Ledger). Swap the bodies below for
 * real `apiClient` calls once a Retirement controller exists; signatures already match. This
 * stage will likely reuse Exit + Full & Final's plumbing once those are real, rather than
 * duplicate a second clearance/settlement flow.
 */

let retirements: RetirementResponse[] = [
  {
    id: 1,
    employeeId: 1005,
    employeeName: 'Rahul Mehta',
    retirementDate: '2027-03-31',
    eligibleForGratuity: true,
    pensionScheme: 'EPS (Employees’ Pension Scheme)',
    remarks: 'Standard retirement at 60; HR to initiate Full & Final 30 days prior.',
    status: 'PLANNED',
  },
];

export const retirementApi = {
  list: (page = 0, size = 20, sort?: string): Promise<PageResponse<RetirementResponse>> =>
    delay(paginate(retirements, page, size, sort)),

  create: async (request: RetirementRequest): Promise<RetirementResponse> => {
    const created: RetirementResponse = {
      id: nextMockId(),
      employeeId: request.employeeId,
      employeeName: await resolveEmployeeName(request.employeeId),
      retirementDate: request.retirementDate,
      eligibleForGratuity: request.eligibleForGratuity,
      pensionScheme: request.pensionScheme ?? null,
      remarks: request.remarks ?? null,
      status: 'PLANNED',
    };
    retirements = [created, ...retirements];
    return delay(created);
  },

  updateStatus: (id: number, request: RetirementStatusUpdateRequest): Promise<RetirementResponse> => {
    retirements = retirements.map((r) => (r.id === id ? { ...r, status: request.status } : r));
    return delay(retirements.find((r) => r.id === id)!);
  },
};
