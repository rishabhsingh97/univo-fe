export interface TenantDnsRecord {
  type: string;
  host: string;
  value: string;
}

export interface TenantDomain {
  /** null for the subdomain slot (it isn't a row in tenant_domains, so there's nothing to
   * verify/remove) - only a custom domain has an id. */
  id: number | null;
  /** null only for an UNCLAIMED subdomain slot - nobody's picked one yet. */
  domain: string | null;
  type: 'SUBDOMAIN' | 'CUSTOM';
  status: 'ACTIVE' | 'PENDING' | 'UNCLAIMED';
  dnsRecords: TenantDnsRecord[];
}

export interface SubdomainAvailability {
  available: boolean;
}

export interface TenantByDomain {
  tenantCode: string;
}
