import { delay, nextMockId, paginate, resolveEmployeeName } from '../mock/mockUtils';
import type { PageResponse } from '../../types/common';
import type { AppraisalRequest, AppraisalResponse, GoalRequest, GoalResponse } from '../../types/performance';

/**
 * MOCK - Performance has no backend yet (see the HR Lifecycle Ledger): zero controller, page,
 * or data model existed for this stage before this UI pass. Swap the bodies below for real
 * `apiClient` calls once a Performance controller exists; signatures already match.
 */

let goals: GoalResponse[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeName: 'Ananya Rao',
    title: 'Ship the new reporting dashboard',
    description: 'Lead the Q3 analytics dashboard from design through launch.',
    dueDate: '2026-09-30',
    status: 'IN_PROGRESS',
    progressPercent: 60,
  },
  {
    id: 2,
    employeeId: 1056,
    employeeName: 'Arjun Kapoor',
    title: 'Reduce customer support response time',
    description: 'Bring first-response time under 4 hours across all channels.',
    dueDate: '2026-08-31',
    status: 'IN_PROGRESS',
    progressPercent: 35,
  },
  {
    id: 3,
    employeeId: 1123,
    employeeName: 'Fatima Sheikh',
    title: 'Complete AWS Solutions Architect certification',
    description: null,
    dueDate: '2026-07-31',
    status: 'COMPLETED',
    progressPercent: 100,
  },
];

let appraisals: AppraisalResponse[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeName: 'Ananya Rao',
    reviewCycle: 'H1 2026',
    rating: 4,
    reviewerComments: 'Strong technical leadership on the dashboard rollout.',
    status: 'ACKNOWLEDGED',
  },
  {
    id: 2,
    employeeId: 1056,
    employeeName: 'Arjun Kapoor',
    reviewCycle: 'H1 2026',
    rating: 3,
    reviewerComments: 'Meets expectations; response-time goal still in progress.',
    status: 'SUBMITTED',
  },
];

export const goalApi = {
  list: (page = 0, size = 20, sort?: string): Promise<PageResponse<GoalResponse>> => delay(paginate(goals, page, size, sort)),

  create: async (request: GoalRequest): Promise<GoalResponse> => {
    const created: GoalResponse = {
      id: nextMockId(),
      employeeId: request.employeeId,
      employeeName: await resolveEmployeeName(request.employeeId),
      title: request.title,
      description: request.description ?? null,
      dueDate: request.dueDate,
      status: request.status,
      progressPercent: request.progressPercent,
    };
    goals = [created, ...goals];
    return delay(created);
  },

  update: (id: number, request: GoalRequest): Promise<GoalResponse> => {
    goals = goals.map((g) =>
      g.id === id
        ? { ...g, title: request.title, description: request.description ?? null, dueDate: request.dueDate, status: request.status, progressPercent: request.progressPercent }
        : g,
    );
    return delay(goals.find((g) => g.id === id)!);
  },

  delete: (id: number): Promise<void> => {
    goals = goals.filter((g) => g.id !== id);
    return delay(undefined);
  },
};

export const appraisalApi = {
  list: (page = 0, size = 20, sort?: string): Promise<PageResponse<AppraisalResponse>> =>
    delay(paginate(appraisals, page, size, sort)),

  create: async (request: AppraisalRequest): Promise<AppraisalResponse> => {
    const created: AppraisalResponse = {
      id: nextMockId(),
      employeeId: request.employeeId,
      employeeName: await resolveEmployeeName(request.employeeId),
      reviewCycle: request.reviewCycle,
      rating: request.rating,
      reviewerComments: request.reviewerComments ?? null,
      status: request.status,
    };
    appraisals = [created, ...appraisals];
    return delay(created);
  },

  update: (id: number, request: AppraisalRequest): Promise<AppraisalResponse> => {
    appraisals = appraisals.map((a) =>
      a.id === id
        ? { ...a, reviewCycle: request.reviewCycle, rating: request.rating, reviewerComments: request.reviewerComments ?? null, status: request.status }
        : a,
    );
    return delay(appraisals.find((a) => a.id === id)!);
  },

  delete: (id: number): Promise<void> => {
    appraisals = appraisals.filter((a) => a.id !== id);
    return delay(undefined);
  },
};
