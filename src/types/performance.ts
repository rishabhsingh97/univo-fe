export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';

export interface GoalRequest {
  employeeId: number;
  title: string;
  description?: string;
  dueDate: string;
  status: GoalStatus;
  progressPercent: number;
}

export interface GoalResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: GoalStatus;
  progressPercent: number;
}

export type AppraisalStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';

export interface AppraisalRequest {
  employeeId: number;
  reviewCycle: string;
  rating: number;
  reviewerComments?: string;
  status: AppraisalStatus;
}

export interface AppraisalResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  reviewCycle: string;
  rating: number;
  reviewerComments: string | null;
  status: AppraisalStatus;
}
