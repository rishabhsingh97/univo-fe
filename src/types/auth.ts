export interface LoginRequest {
  tenantCode: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  username: string;
  roles: string[];
  permissions: string[];
  /** This user's own timezone override, or null to fall back to the tenant's default. */
  timezone: string | null;
}

export interface PermissionResponse {
  id: number;
  name: string;
  description: string | null;
}

export interface RoleResponse {
  id: number;
  name: string;
  label: string;
  description: string | null;
  permissions: PermissionResponse[];
}

export interface RoleRequest {
  name: string;
  label?: string;
  description?: string;
  permissionIds: number[];
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  timezone: string | null;
  roles: RoleResponse[];
}

export interface AssignRolesRequest {
  roleIds: number[];
}

export interface UpdateTimezoneRequest {
  timezone: string | null;
}
