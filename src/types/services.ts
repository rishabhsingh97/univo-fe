export type ServiceCategory = 'IT' | 'HR' | 'FACILITIES' | 'PAYROLL' | 'OTHER';
export type ServicePriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ServiceRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ServiceRequestNoteResponse {
  id: number;
  authorName: string | null;
  note: string;
  createdAt: string;
}

export interface ServiceRequestRequest {
  subject: string;
  category: ServiceCategory;
  description?: string;
  priority: ServicePriority;
}

export interface ServiceRequestResponse {
  id: number;
  subject: string;
  category: ServiceCategory;
  description: string | null;
  priority: ServicePriority;
  status: ServiceRequestStatus;
  raisedByEmployeeId: number;
  raisedByName: string;
  raisedOn: string;
  notes: ServiceRequestNoteResponse[];
}

export interface ServiceRequestStatusUpdateRequest {
  status: ServiceRequestStatus;
}

export interface ServiceRequestNoteRequest {
  note: string;
}
