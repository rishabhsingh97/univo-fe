export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LoanAdvanceRequest {
  employeeId: number;
  amount: number;
  reason?: string;
  requestedDate: string;
}

export interface LoanAdvanceResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  amount: number;
  reason: string | null;
  status: RequestStatus;
  requestedDate: string;
}

export interface ReimbursementRequest {
  employeeId: number;
  amount: number;
  category?: string;
  description?: string;
  submittedDate: string;
}

export interface ReimbursementResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  amount: number;
  category: string | null;
  description: string | null;
  status: RequestStatus;
  submittedDate: string;
}

export interface RequestStatusUpdateRequest {
  status: RequestStatus;
}

export interface TaxConfigRequest {
  financialYear: string;
  flatTaxRatePercent: number;
  standardDeduction?: number;
}

export interface TaxConfigResponse {
  id: number;
  financialYear: string;
  flatTaxRatePercent: number;
  standardDeduction: number;
}
