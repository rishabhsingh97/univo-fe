import { createContext, useContext, useState, type ReactNode } from 'react';
import { platformAuthApi } from '../api/platform/platformAuthApi';
import type { PlatformLoginRequest } from '../types/platform';

interface PlatformSession {
  email: string;
}

interface PlatformAuthContextValue {
  session: PlatformSession | null;
  login: (request: PlatformLoginRequest) => Promise<void>;
  logout: () => void;
}

// Deliberately its own storage key, distinct from the tenant app's 'erp.session' - the two
// sessions now also live in entirely separate cookies (erp_platform_at/_rt vs erp_at/_rt, see
// AuthCookieService), so unlike the old shared-token-slot design, a tenant session and a
// platform-admin session really can coexist in the same browser without either clobbering the
// other; this key just keeps their non-secret session metadata separate too.
const SESSION_STORAGE_KEY = 'erp.platform.session';
const PlatformAuthContext = createContext<PlatformAuthContextValue | undefined>(undefined);

function readStoredSession(): PlatformSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformSession;
  } catch {
    return null;
  }
}

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlatformSession | null>(readStoredSession);

  const login = async (request: PlatformLoginRequest) => {
    const response = await platformAuthApi.login(request);
    const nextSession: PlatformSession = { email: response.email };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const logout = () => {
    platformAuthApi.logout().catch(() => undefined);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  };

  return <PlatformAuthContext.Provider value={{ session, login, logout }}>{children}</PlatformAuthContext.Provider>;
}

export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used within a PlatformAuthProvider');
  return ctx;
}
