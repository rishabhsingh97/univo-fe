export type SalaryComponentType = 'EARNING' | 'DEDUCTION';
export type CalculationType = 'FLAT' | 'PERCENTAGE_OF_BASIC';

export interface SalaryComponentRequest {
  name: string;
  code: string;
  type: SalaryComponentType;
  calculationType: CalculationType;
  isBasic: boolean;
  taxable: boolean;
  active: boolean;
}

export interface SalaryComponentResponse {
  id: number;
  name: string;
  code: string;
  type: SalaryComponentType;
  calculationType: CalculationType;
  isBasic: boolean;
  taxable: boolean;
  active: boolean;
}

export interface SalaryStructureComponentRequest {
  componentId: number;
  value: number;
}

export interface SalaryStructureComponentResponse {
  componentId: number;
  componentName: string;
  componentType: SalaryComponentType;
  calculationType: CalculationType;
  value: number;
  resolvedAmount: number;
}

export interface SalaryStructureRequest {
  employeeId: number;
  effectiveFrom: string;
  components: SalaryStructureComponentRequest[];
}

export interface SalaryStructureResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  effectiveFrom: string;
  components: SalaryStructureComponentResponse[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
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

export interface PayslipComponentResponse {
  componentName: string;
  componentType: SalaryComponentType;
  amount: number;
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
  components: PayslipComponentResponse[];
}
