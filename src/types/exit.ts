export type ExitType = 'RESIGNATION' | 'TERMINATION';
export type ExitStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'COMPLETED';

export interface ClearanceItem {
  id: number;
  label: string;
  cleared: boolean;
  remarks: string | null;
}

export interface ExitRequest {
  employeeId: number;
  exitType: ExitType;
  resignationDate: string;
  lastWorkingDate: string;
  noticePeriodDays: number;
  reason?: string;
}

export interface ExitResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  exitType: ExitType;
  resignationDate: string;
  lastWorkingDate: string;
  noticePeriodDays: number;
  reason: string | null;
  status: ExitStatus;
  clearanceItems: ClearanceItem[];
}

export interface ExitStatusUpdateRequest {
  status: ExitStatus;
}

export interface ClearanceItemUpdateRequest {
  cleared: boolean;
  remarks?: string;
}
