import { delay, nextMockId, paginate, resolveEmployeeName } from '../mock/mockUtils';
import type { PageResponse } from '../../types/common';
import type { FullFinalRequest, FullFinalResponse, FullFinalStatusUpdateRequest } from '../../types/fullFinal';

/**
 * MOCK - Full & Final has no backend yet (see the HR Lifecycle Ledger). Swap the bodies below
 * for real `apiClient` calls against `FullFinalSettlementController` once it exists; the
 * function signatures already match what that controller will expose.
 */

function netOf(r: { pendingSalary: number; leaveEncashment: number; otherDues: number; deductions: number }): number {
  return r.pendingSalary + r.leaveEncashment + r.otherDues - r.deductions;
}

let settlements: FullFinalResponse[] = [
  {
    id: 1,
    exitId: 3,
    employeeId: 1088,
    employeeName: 'Priya Nair',
    pendingSalary: 48000,
    leaveEncashment: 12500,
    otherDues: 5000,
    deductions: 3200,
    netSettlement: netOf({ pendingSalary: 48000, leaveEncashment: 12500, otherDues: 5000, deductions: 3200 }),
    remarks: 'Includes pending June salary and 8 encashed leave days.',
    status: 'PAID',
    paidOn: '2026-07-15',
  },
];

export const fullFinalApi = {
  list: (page = 0, size = 20, sort?: string): Promise<PageResponse<FullFinalResponse>> =>
    delay(paginate(settlements, page, size, sort)),

  getById: (id: number): Promise<FullFinalResponse> => {
    const found = settlements.find((s) => s.id === id);
    if (!found) return Promise.reject(new Error(`Settlement not found: ${id}`));
    return delay(found);
  },

  create: async (request: FullFinalRequest): Promise<FullFinalResponse> => {
    const created: FullFinalResponse = {
      id: nextMockId(),
      exitId: request.exitId ?? null,
      employeeId: request.employeeId,
      employeeName: await resolveEmployeeName(request.employeeId),
      pendingSalary: request.pendingSalary,
      leaveEncashment: request.leaveEncashment,
      otherDues: request.otherDues,
      deductions: request.deductions,
      netSettlement: netOf(request),
      remarks: request.remarks ?? null,
      status: 'DRAFT',
      paidOn: null,
    };
    settlements = [created, ...settlements];
    return delay(created);
  },

  update: (id: number, request: FullFinalRequest): Promise<FullFinalResponse> => {
    settlements = settlements.map((s) =>
      s.id === id
        ? {
            ...s,
            pendingSalary: request.pendingSalary,
            leaveEncashment: request.leaveEncashment,
            otherDues: request.otherDues,
            deductions: request.deductions,
            remarks: request.remarks ?? null,
            netSettlement: netOf(request),
          }
        : s,
    );
    return delay(settlements.find((s) => s.id === id)!);
  },

  updateStatus: (id: number, request: FullFinalStatusUpdateRequest): Promise<FullFinalResponse> => {
    settlements = settlements.map((s) =>
      s.id === id ? { ...s, status: request.status, paidOn: request.paidOn ?? s.paidOn } : s,
    );
    return delay(settlements.find((s) => s.id === id)!);
  },
};
