export interface TenantBrandingResponse {
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  faviconUrl: string | null;
  companyName: string | null;
  fontFamily: string | null;
  /** IANA zone id, e.g. "Asia/Kolkata" - tenant-wide display default. */
  defaultTimezone: string | null;
  /**
   * Escape hatch for any other design token, e.g. { "--radius-md": "4px", "--color-success":
   * "#1a8a5a" }. Every value in theme.css is a CSS custom property, so a tenant can override
   * any of them here without the frontend needing a new named field + deploy per token. Keys
   * must be custom-property names (start with "--"); anything else is ignored client-side.
   */
  themeVars?: Record<string, string> | null;
  /** Master switch for the whole workspace - gates both the Google button on the login page and
   * My Details' "Connect Google Account" action. */
  googleSignInEnabled?: boolean | null;
}

export interface TenantBrandingRequest {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
  companyName?: string;
  fontFamily?: string;
  defaultTimezone?: string;
  themeVars?: Record<string, string>;
  googleSignInEnabled?: boolean;
}
