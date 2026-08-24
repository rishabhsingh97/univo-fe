export type SettlementStatus = 'DRAFT' | 'APPROVED' | 'PAID';

export interface FullFinalRequest {
  employeeId: number;
  exitId?: number;
  pendingSalary: number;
  leaveEncashment: number;
  otherDues: number;
  deductions: number;
  remarks?: string;
}

export interface FullFinalResponse {
  id: number;
  exitId: number | null;
  employeeId: number;
  employeeName: string;
  pendingSalary: number;
  leaveEncashment: number;
  otherDues: number;
  gratuityAmount: number;
  deductions: number;
  netSettlement: number;
  remarks: string | null;
  status: SettlementStatus;
  paidOn: string | null;
}

export interface FullFinalStatusUpdateRequest {
  status: SettlementStatus;
  paidOn?: string;
}
