export type OrgUnitType = 'COMPANY' | 'BRANCH' | 'DEPARTMENT';

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
}

export interface DesignationResponse {
  id: number;
  title: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeRequest {
  name: string;
  code: string;
  rank: number;
}

export interface GradeResponse {
  id: number;
  name: string;
  code: string;
  rank: number;
  createdAt: string;
  updatedAt: string;
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
  gradeId?: number | null;
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
  managerId: number | null;
  managerName: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface ReassignManagerRequest {
  managerId: number | null;
}
