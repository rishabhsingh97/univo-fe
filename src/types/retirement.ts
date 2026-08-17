export type RetirementStatus = 'PLANNED' | 'IN_PROCESS' | 'COMPLETED';

export interface RetirementRequest {
  employeeId: number;
  retirementDate: string;
  eligibleForGratuity: boolean;
  pensionScheme?: string;
  remarks?: string;
}

export interface RetirementResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  retirementDate: string;
  eligibleForGratuity: boolean;
  pensionScheme: string | null;
  remarks: string | null;
  status: RetirementStatus;
}

export interface RetirementStatusUpdateRequest {
  status: RetirementStatus;
}
