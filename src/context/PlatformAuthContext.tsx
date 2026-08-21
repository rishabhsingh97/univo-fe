import { createContext, useContext, useState, type ReactNode } from 'react';
import { platformAuthApi } from '../api/platform/platformAuthApi';
import { TOKEN_STORAGE_KEY } from '../api/client';
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
// contexts share the axios client's token slot (see api/client.ts) but never need to coexist,
// since a browser tab is either a tenant user or a platform admin at a given time.
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
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    const nextSession: PlatformSession = { email: response.email };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
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
