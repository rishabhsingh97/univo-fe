import { delay, nextMockId, paginate, resolveEmployeeName } from '../mock/mockUtils';
import type { PageResponse } from '../../types/common';
import type { CareerActionRequest, CareerActionResponse, CareerActionStatusUpdateRequest } from '../../types/career';

/**
 * MOCK - Career (promotion/increment/transfer) has no backend yet (see the HR Lifecycle
 * Ledger) - today only a raw designation/grade/manager edit exists, with no dedicated workflow
 * or history record. Swap the bodies below for real `apiClient` calls once a Career controller
 * exists; signatures already match.
 */

let actions: CareerActionResponse[] = [
  {
    id: 1,
    employeeId: 1017,
    employeeName: 'Vikram Shah',
    actionType: 'PROMOTION',
    effectiveDate: '2026-04-01',
    previousValue: 'Senior Engineer',
    newValue: 'Lead Engineer',
    reason: 'Consistently exceeded expectations across two review cycles.',
    status: 'APPROVED',
  },
  {
    id: 2,
    employeeId: 1005,
    employeeName: 'Rahul Mehta',
    actionType: 'INCREMENT',
    effectiveDate: '2026-04-01',
    previousValue: '₹85,000 / month',
    newValue: '₹98,000 / month',
    reason: 'Annual increment cycle.',
    status: 'APPROVED',
  },
  {
    id: 3,
    employeeId: 1123,
    employeeName: 'Fatima Sheikh',
    actionType: 'TRANSFER',
    effectiveDate: '2026-09-01',
    previousValue: 'Bengaluru — Engineering',
    newValue: 'Pune — Engineering',
    reason: 'Relocation request.',
    status: 'PENDING',
  },
];

export const careerApi = {
  list: (page = 0, size = 20, sort?: string): Promise<PageResponse<CareerActionResponse>> =>
    delay(paginate(actions, page, size, sort)),

  create: async (request: CareerActionRequest): Promise<CareerActionResponse> => {
    const created: CareerActionResponse = {
      id: nextMockId(),
      employeeId: request.employeeId,
      employeeName: await resolveEmployeeName(request.employeeId),
      actionType: request.actionType,
      effectiveDate: request.effectiveDate,
      previousValue: request.previousValue ?? null,
      newValue: request.newValue,
      reason: request.reason ?? null,
      status: 'PENDING',
    };
    actions = [created, ...actions];
    return delay(created);
  },

  updateStatus: (id: number, request: CareerActionStatusUpdateRequest): Promise<CareerActionResponse> => {
    actions = actions.map((a) => (a.id === id ? { ...a, status: request.status } : a));
    return delay(actions.find((a) => a.id === id)!);
  },
};
