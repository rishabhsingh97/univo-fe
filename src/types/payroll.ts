export interface SalaryStructureRequest {
  employeeId: number;
  basic: number;
  hra?: number;
  allowances?: number;
  effectiveFrom: string;
}

export interface SalaryStructureResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  basic: number;
  hra: number;
  allowances: number;
  grossPay: number;
  effectiveFrom: string;
}

export type PayrollRunStatus = 'DRAFT' | 'COMPLETED';

export interface PayrollRunRequest {
  periodMonth: number;
  periodYear: number;
}

export interface PayrollRunResponse {
  id: number;
  periodMonth: number;
  periodYear: number;
  status: PayrollRunStatus;
  runDate: string | null;
}

export interface PayslipResponse {
  id: number;
  payrollRunId: number;
  employeeId: number;
  employeeName: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  generatedAt: string;
}
