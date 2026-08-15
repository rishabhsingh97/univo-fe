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

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface EmployeeRequest {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  orgUnitId?: number | null;
  designation?: string;
  dateOfJoining: string;
  status?: EmployeeStatus;
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
  designation: string | null;
  dateOfJoining: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}
