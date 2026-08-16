export interface PlatformLoginRequest {
  username: string;
  password: string;
}

export interface PlatformLoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  username: string;
}

export interface TenantSummaryResponse {
  id: number;
  tenantCode: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  disabledModules: string[];
  createdAt: string;
}

export interface CreateTenantRequest {
  tenantCode: string;
  name: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
}

export interface UpdateTenantStatusRequest {
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateTenantModulesRequest {
  modules: Record<string, boolean>;
}
