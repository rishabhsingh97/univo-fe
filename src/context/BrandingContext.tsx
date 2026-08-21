import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { brandingApi } from '../api/public/brandingApi';
import type { TenantBrandingResponse } from '../types/branding';
import { useAuth } from './AuthContext';

interface BrandingContextValue {
  branding: TenantBrandingResponse | null;
  loadBranding: (tenantCode: string) => Promise<void>;
}

const EMPTY: TenantBrandingResponse = {
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  faviconUrl: null,
  companyName: null,
  fontFamily: null,
  defaultTimezone: null,
  themeVars: null,
};

// Cached per tenant (not per session) so a browser used for multiple tenants keeps each one's
// last-known-good branding separately, and so it survives logout/login.
const BRANDING_CACHE_PREFIX = 'erp.branding.';

function readCachedBranding(tenantCode: string): TenantBrandingResponse | null {
  const raw = localStorage.getItem(BRANDING_CACHE_PREFIX + tenantCode);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TenantBrandingResponse;
  } catch {
    // Corrupted cache entry - drop it rather than let a bad JSON.parse crash the app on load.
    localStorage.removeItem(BRANDING_CACHE_PREFIX + tenantCode);
    return null;
  }
}

function writeCachedBranding(tenantCode: string, branding: TenantBrandingResponse) {
  localStorage.setItem(BRANDING_CACHE_PREFIX + tenantCode, JSON.stringify(branding));
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

function setOrRemoveCssVar(name: string, value: string | null) {
  const root = document.documentElement;
  if (value) {
    root.style.setProperty(name, value);
  } else {
    root.style.removeProperty(name);
  }
}

// Tracks custom-property keys applied by the *previous* themeVars payload, so switching to a
// tenant whose config omits a key that an earlier tenant set doesn't leave it stuck.
let appliedThemeVarKeys: string[] = [];

function applyThemeVars(themeVars: Record<string, string> | null | undefined) {
  const root = document.documentElement;
  appliedThemeVarKeys.forEach((key) => root.style.removeProperty(key));
  appliedThemeVarKeys = [];
  if (!themeVars) return;
  for (const [key, value] of Object.entries(themeVars)) {
    if (!key.startsWith('--') || !value) continue;
    root.style.setProperty(key, value);
    appliedThemeVarKeys.push(key);
  }
}

function applyFavicon(faviconUrl: string | null) {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  // No branded favicon configured - leave whatever the app shipped with (index.html's
  // default) rather than pointing at a blank/broken icon.
  if (faviconUrl) {
    link.href = faviconUrl;
  }
}

/** Layers tenant branding on top of the light/dark theme (CSS vars only override what's set;
 * unset ones fall through to the theme's own values) - this is the one place all of it gets
 * applied, so no page needs to know branding exists. */
function applyBranding(branding: TenantBrandingResponse) {
  setOrRemoveCssVar('--color-primary', branding.primaryColor);
  setOrRemoveCssVar('--color-primary-hover', branding.secondaryColor);
  setOrRemoveCssVar('--font-sans', branding.fontFamily);
  applyThemeVars(branding.themeVars);
  applyFavicon(branding.faviconUrl);
  document.title = branding.companyName ? `${branding.companyName} - Univo` : 'Univo';
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  // Seed from localStorage synchronously (session is already resolved by this point - see
  // AuthProvider) so a page refresh renders the tenant's branding on the very first frame
  // instead of a flash of the default theme while the network request is in flight.
  const [branding, setBranding] = useState<TenantBrandingResponse | null>(() =>
    session?.tenantCode ? readCachedBranding(session.tenantCode) : null,
  );

  // Applies whenever `branding` changes - covers both the cached seed above and every later
  // network refresh through one path. useLayoutEffect (not useEffect) so it runs before the
  // browser paints, avoiding a flash even on the very first render.
  useLayoutEffect(() => {
    applyBranding(branding ?? EMPTY);
  }, [branding]);

  const loadBranding = async (tenantCode: string) => {
    const cached = readCachedBranding(tenantCode);
    if (cached) setBranding(cached);
    try {
      const result = await brandingApi.getForTenant(tenantCode);
      setBranding(result);
      writeCachedBranding(tenantCode, result);
    } catch {
      // Network/API hiccup - keep showing the cached value rather than reverting to the
      // unbranded default; only fall back to EMPTY if we never had anything cached.
      if (!cached) setBranding(EMPTY);
    }
  };

  // Re-fetch the signed-in tenant's branding on every load (e.g. page refresh), not just at
  // the moment of login, so the cache stays fresh against admin-side branding changes.
  useEffect(() => {
    if (session?.tenantCode) {
      void loadBranding(session.tenantCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.tenantCode]);

  return <BrandingContext.Provider value={{ branding, loadBranding }}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within a BrandingProvider');
  return ctx;
}
