import type { RequestStatus } from './finance';

export type OrgUnitType = 'COMPANY' | 'BRANCH' | 'DEPARTMENT';

export interface ReferralRequest {
  jobPostingId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  notes?: string;
}

export interface ReferralResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  jobPostingId: number;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  notes: string | null;
  status: RequestStatus;
}

export interface ReferralStatusUpdateRequest {
  status: RequestStatus;
}

export interface OrgUnitRequest {
  name: string;
  code: string;
  type: OrgUnitType;
  parentId?: number | null;
}

export interface OrgUnitResponse {
  id: number;
  name: string;
  code: string;
  type: OrgUnitType;
  parentId: number | null;
  parentName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesignationRequest {
  title: string;
  code: string;
  gradeId: number;
}

export interface DesignationResponse {
  id: number;
  title: string;
  code: string;
  gradeId: number | null;
  gradeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GradeRequest {
  name: string;
  code: string;
  level: number;
}

export interface GradeResponse {
  id: number;
  name: string;
  code: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationRequest {
  name: string;
  code: string;
}

export interface LocationResponse {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDocumentResponse {
  id: number;
  employeeId: number;
  documentType: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';

export interface EmployeeRequest {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  orgUnitId?: number | null;
  designationId?: number | null;
  locationId?: number | null;
  managerId?: number | null;
  employmentType?: EmploymentType;
  dateOfJoining: string;
  confirmationDate?: string | null;
  status?: EmployeeStatus;
  pan?: string;
  aadhaarMasked?: string;
  uan?: string;
  esiNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface EmployeeLinkRequest {
  label: string;
  url: string;
}

export interface EmployeeLinkResponse {
  id: number;
  label: string;
  url: string;
  displayOrder: number;
}

export interface EmployeeResponse {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  orgUnitId: number | null;
  orgUnitName: string | null;
  designationId: number | null;
  designationTitle: string | null;
  gradeId: number | null;
  gradeName: string | null;
  locationId: number | null;
  locationName: string | null;
  managerId: number | null;
  managerName: string | null;
  managerEmail: string | null;
  hasUserAccount: boolean;
  employmentType: EmploymentType;
  dateOfJoining: string;
  confirmationDate: string | null;
  status: EmployeeStatus;
  pan: string | null;
  aadhaarMasked: string | null;
  uan: string | null;
  esiNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  links: EmployeeLinkResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ReassignManagerRequest {
  managerId: number | null;
}

export interface GenerateCredentialsResponse {
  email: string;
  temporaryPassword: string;
}

export interface EmployeeFilterOptionsResponse {
  statuses: string[];
}
