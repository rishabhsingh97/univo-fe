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

export type TaxRegime = 'OLD' | 'NEW';

export interface TaxConfigRequest {
  financialYear: string;
  flatTaxRatePercent: number;
  standardDeduction?: number;
  regime?: TaxRegime;
  rebateThreshold87A?: number;
}

export interface TaxConfigResponse {
  id: number;
  financialYear: string;
  flatTaxRatePercent: number;
  standardDeduction: number;
  regime: TaxRegime;
  rebateThreshold87A: number;
}

export interface StatutoryConfigRequest {
  pfEnabled: boolean;
  pfEmployeeRatePercent: number;
  pfEmployerRatePercent: number;
  pfWageCeiling: number;
  esiEnabled: boolean;
  esiEmployeeRatePercent: number;
  esiEmployerRatePercent: number;
  esiWageThreshold: number;
  ptEnabled: boolean;
  ptState?: string | null;
  gratuityEnabled: boolean;
  gratuityDaysPerYear: number;
}

export interface StatutoryConfigResponse extends StatutoryConfigRequest {
  id: number;
}

export interface ProfessionalTaxSlabRequest {
  state: string;
  minGrossMonthly: number;
  maxGrossMonthly?: number | null;
  monthlyAmount: number;
}

export interface ProfessionalTaxSlabResponse extends ProfessionalTaxSlabRequest {
  id: number;
}

export interface IncomeTaxSlabRequest {
  financialYear: string;
  regime: TaxRegime;
  minAnnualIncome: number;
  maxAnnualIncome?: number | null;
  ratePercent: number;
}

export interface IncomeTaxSlabResponse extends IncomeTaxSlabRequest {
  id: number;
}
