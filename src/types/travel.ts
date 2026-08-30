export type TravelMode = 'FLIGHT' | 'TRAIN' | 'CAR' | 'BUS';
export type TravelStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface TravelRequest {
  employeeId: number;
  destination: string;
  purpose?: string;
  fromDate: string;
  toDate: string;
  modeOfTravel: TravelMode;
  estimatedCost?: number | null;
}

export interface TravelResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  destination: string;
  purpose: string | null;
  fromDate: string;
  toDate: string;
  modeOfTravel: TravelMode;
  estimatedCost: number | null;
  status: TravelStatus;
}

export interface TravelStatusUpdateRequest {
  status: TravelStatus;
}
