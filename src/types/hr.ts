import type { RequestStatus } from './finance';

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

export interface DesignationRequest {
  title: string;
  code: string;
  description?: string | null;
  gradeId: number;
  departmentId?: number | null;
  jobCategoryId?: number | null;
  active: boolean;
}

export interface DesignationResponse {
  id: number;
  title: string;
  code: string;
  description: string | null;
  gradeId: number | null;
  gradeName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  jobCategoryId: number | null;
  jobCategoryName: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GradeRequest {
  name: string;
  code: string;
  description?: string | null;
  level: number;
  experienceMinYears?: number | null;
  experienceMaxYears?: number | null;
  compensationMin?: number | null;
  compensationMax?: number | null;
  variablePayPercent?: number | null;
  promotionCycleMonths?: number | null;
  nextGradeId?: number | null;
  active: boolean;
}

export interface GradeResponse {
  id: number;
  name: string;
  code: string;
  description: string | null;
  level: number;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  compensationMin: number | null;
  compensationMax: number | null;
  variablePayPercent: number | null;
  promotionCycleMonths: number | null;
  nextGradeId: number | null;
  nextGradeName: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LocationType = 'HEAD_OFFICE' | 'BRANCH_OFFICE' | 'WAREHOUSE' | 'REMOTE' | 'CLIENT_SITE';

export interface LocationRequest {
  name: string;
  code: string;
  description?: string | null;
  locationType?: LocationType | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  active: boolean;
}

export interface LocationResponse {
  id: number;
  name: string;
  code: string;
  description: string | null;
  locationType: LocationType | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  active: boolean;
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
  designationId: number | null;
  designationTitle: string | null;
  gradeId: number | null;
  gradeName: string | null;
  departmentName: string | null;
  locationId: number | null;
  locationName: string | null;
  managerId: number | null;
  managerName: string | null;
  managerEmail: string | null;
  hasUserAccount: boolean;
  userId: number | null;
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
}

export interface EmployeeFilterOptionsResponse {
  statuses: string[];
}
