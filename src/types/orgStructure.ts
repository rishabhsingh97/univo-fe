// Company is a single implicit record per tenant - see the Organization Settings section
// (companyApi.getCurrent/updateCurrent), not a user-managed list.
export interface CompanyRequest {
  name: string;
  code: string;
}

export interface CompanyResponse {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchRequest {
  name: string;
  code: string;
  locationId: number | null;
  headquarters: boolean;
}

export interface BranchResponse {
  id: number;
  name: string;
  code: string;
  locationId: number;
  locationName: string;
  headquarters: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRequest {
  name: string;
  code: string;
  branchIds?: number[];
}

export interface DepartmentResponse {
  id: number;
  name: string;
  code: string;
  branchIds: number[];
  branchNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobCategoryRequest {
  name: string;
  code: string;
  departmentIds?: number[];
}

export interface JobCategoryResponse {
  id: number;
  name: string;
  code: string;
  departmentIds: number[];
  departmentNames: string[];
  createdAt: string;
  updatedAt: string;
}
