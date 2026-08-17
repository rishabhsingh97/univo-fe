import { delay, nextMockId, paginate, resolveEmployeeName } from '../mock/mockUtils';
import type { PageResponse } from '../../types/common';
import type {
  ClearanceItemUpdateRequest,
  ExitRequest,
  ExitResponse,
  ExitStatusUpdateRequest,
} from '../../types/exit';

/**
 * MOCK - the Exit stage has no backend yet (see the HR Lifecycle Ledger). Every function here
 * matches the signature its real axios-backed counterpart will have once
 * `com.rishierp.erp.module.hr.controller.ExitController` exists, so switching this file's
 * bodies for real `apiClient` calls is the only change needed - no page touches this shape.
 */

function defaultClearanceItems(): ExitResponse['clearanceItems'] {
  return [
    { id: nextMockId(), label: 'IT assets returned (laptop, ID card, access card)', cleared: false, remarks: null },
    { id: nextMockId(), label: 'System & email access revoked', cleared: false, remarks: null },
    { id: nextMockId(), label: 'Knowledge transfer completed', cleared: false, remarks: null },
    { id: nextMockId(), label: 'Dues cleared with Finance', cleared: false, remarks: null },
    { id: nextMockId(), label: 'Exit interview conducted', cleared: false, remarks: null },
  ];
}

let exits: ExitResponse[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeName: 'Ananya Rao',
    exitType: 'RESIGNATION',
    resignationDate: '2026-07-20',
    lastWorkingDate: '2026-08-19',
    noticePeriodDays: 30,
    reason: 'Relocating to another city',
    status: 'APPROVED',
    clearanceItems: [
      { id: nextMockId(), label: 'IT assets returned (laptop, ID card, access card)', cleared: true, remarks: null },
      { id: nextMockId(), label: 'System & email access revoked', cleared: true, remarks: null },
      { id: nextMockId(), label: 'Knowledge transfer completed', cleared: false, remarks: 'In progress with team lead' },
      { id: nextMockId(), label: 'Dues cleared with Finance', cleared: false, remarks: null },
      { id: nextMockId(), label: 'Exit interview conducted', cleared: false, remarks: null },
    ],
  },
  {
    id: 2,
    employeeId: 1017,
    employeeName: 'Vikram Shah',
    exitType: 'RESIGNATION',
    resignationDate: '2026-08-10',
    lastWorkingDate: '2026-09-09',
    noticePeriodDays: 30,
    reason: 'Higher studies',
    status: 'PENDING',
    clearanceItems: defaultClearanceItems(),
  },
  {
    id: 3,
    employeeId: 1088,
    employeeName: 'Priya Nair',
    exitType: 'RESIGNATION',
    resignationDate: '2026-06-01',
    lastWorkingDate: '2026-06-30',
    noticePeriodDays: 30,
    reason: 'Better opportunity',
    status: 'COMPLETED',
    clearanceItems: [
      { id: nextMockId(), label: 'IT assets returned (laptop, ID card, access card)', cleared: true, remarks: null },
      { id: nextMockId(), label: 'System & email access revoked', cleared: true, remarks: null },
      { id: nextMockId(), label: 'Knowledge transfer completed', cleared: true, remarks: null },
      { id: nextMockId(), label: 'Dues cleared with Finance', cleared: true, remarks: null },
      { id: nextMockId(), label: 'Exit interview conducted', cleared: true, remarks: null },
    ],
  },
];

export const exitApi = {
  list: (page = 0, size = 20, sort?: string): Promise<PageResponse<ExitResponse>> => delay(paginate(exits, page, size, sort)),

  getById: (id: number): Promise<ExitResponse> => {
    const found = exits.find((e) => e.id === id);
    if (!found) return Promise.reject(new Error(`Exit not found: ${id}`));
    return delay(found);
  },

  create: async (request: ExitRequest): Promise<ExitResponse> => {
    const created: ExitResponse = {
      id: nextMockId(),
      employeeId: request.employeeId,
      employeeName: await resolveEmployeeName(request.employeeId),
      exitType: request.exitType,
      resignationDate: request.resignationDate,
      lastWorkingDate: request.lastWorkingDate,
      noticePeriodDays: request.noticePeriodDays,
      reason: request.reason ?? null,
      status: 'PENDING',
      clearanceItems: defaultClearanceItems(),
    };
    exits = [created, ...exits];
    return delay(created);
  },

  updateStatus: (id: number, request: ExitStatusUpdateRequest): Promise<ExitResponse> => {
    exits = exits.map((e) => (e.id === id ? { ...e, status: request.status } : e));
    return delay(exits.find((e) => e.id === id)!);
  },

  updateClearanceItem: (exitId: number, itemId: number, request: ClearanceItemUpdateRequest): Promise<ExitResponse> => {
    exits = exits.map((e) =>
      e.id === exitId
        ? {
            ...e,
            clearanceItems: e.clearanceItems.map((item) =>
              item.id === itemId ? { ...item, cleared: request.cleared, remarks: request.remarks ?? item.remarks } : item,
            ),
          }
        : e,
    );
    return delay(exits.find((e) => e.id === exitId)!);
  },

  /** All clearance items must be cleared - mirrors the rule the real service will enforce. */
  complete: (id: number): Promise<ExitResponse> => {
    const exit = exits.find((e) => e.id === id);
    if (!exit) return Promise.reject(new Error(`Exit not found: ${id}`));
    if (exit.clearanceItems.some((item) => !item.cleared)) {
      return Promise.reject(new Error('All clearance items must be cleared before completing this exit.'));
    }
    exits = exits.map((e) => (e.id === id ? { ...e, status: 'COMPLETED' } : e));
    return delay(exits.find((e) => e.id === id)!);
  },
};
