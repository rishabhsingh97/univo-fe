export type CareerActionType = 'PROMOTION' | 'INCREMENT' | 'TRANSFER';
export type CareerActionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CareerActionRequest {
  employeeId: number;
  actionType: CareerActionType;
  effectiveDate: string;
  previousValue?: string;
  newValue: string;
  reason?: string;
}

export interface CareerActionResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  actionType: CareerActionType;
  effectiveDate: string;
  previousValue: string | null;
  newValue: string;
  reason: string | null;
  status: CareerActionStatus;
}

export interface CareerActionStatusUpdateRequest {
  status: CareerActionStatus;
}
