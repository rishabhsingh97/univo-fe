export interface LoginRequest {
  tenantCode: string;
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  tenantCode: string;
  idToken: string;
}

/** No token fields - the access/refresh tokens travel as httpOnly cookies the backend sets
 * directly on the response (see AuthCookieService), never in this JSON body. */
export interface LoginResponse {
  email: string;
  roles: string[];
  /** Display names for `roles`, same order - render these, not `roles` itself. */
  roleLabels: string[];
  permissions: string[];
  /** This user's own timezone override, or null to fall back to the tenant's default. */
  timezone: string | null;
  /** Module keys ("hr" | "payroll" | "finance") a platform admin has turned off for this
   * tenant - hide the corresponding sidebar module. The backend enforces this regardless. */
  disabledModules: string[];
  /** True if this account was just created/reset by an admin and hasn't set its own password
   * yet - the frontend must route to the change-password screen and block navigation until
   * it's cleared. */
  mustChangePassword: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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
  email: string;
  fullName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  timezone: string | null;
  roles: RoleResponse[];
  hasAvatar: boolean;
  address: string | null;
  bloodGroup: string | null;
  phoneNumber: string | null;
  bio: string | null;
}

export interface AssignRolesRequest {
  roleIds: number[];
}

export interface CreateUserRequest {
  email: string;
  fullName?: string;
  roleIds: number[];
}

export interface UserCreateResponse {
  user: UserResponse;
  temporaryPassword: string;
}

export interface UpdateTimezoneRequest {
  timezone: string | null;
}

export interface UpdateProfileRequest {
  address?: string | null;
  bloodGroup?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
}
