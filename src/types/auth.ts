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
  /** Display names for `roles`, same order - render these, not `roles` itself. */
  roleLabels: string[];
  permissions: string[];
  /** This user's own timezone override, or null to fall back to the tenant's default. */
  timezone: string | null;
  /** Module keys ("hr" | "payroll" | "finance") a platform admin has turned off for this
   * tenant - hide the corresponding sidebar module. The backend enforces this regardless. */
  disabledModules: string[];
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
