export interface PlatformLoginRequest {
  email: string;
  password: string;
}

export interface PlatformLoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  email: string;
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
  adminEmail: string;
  adminPassword: string;
  subdomain: string;
}

export interface UpdateTenantStatusRequest {
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateTenantModulesRequest {
  modules: Record<string, boolean>;
}

export interface ModuleResponse {
  moduleKey: string;
  label: string;
}

export interface CreateModuleRequest {
  moduleKey: string;
  label: string;
}

export type ServiceStatusLevel = 'UP' | 'DOWN' | 'CONFIGURED' | 'NOT_CONFIGURED' | 'WARNING';

export interface ServiceStatusResponse {
  name: string;
  status: ServiceStatusLevel;
  detail: string | null;
}

export interface SystemMetricsResponse {
  heapUsedMb: number;
  heapMaxMb: number;
  heapUsagePercent: number;
  availableProcessors: number;
  threadCount: number;
  uptimeSeconds: number;
}

export interface SystemStatusResponse {
  services: ServiceStatusResponse[];
  system: SystemMetricsResponse;
}
