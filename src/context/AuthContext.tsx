import { createContext, useContext, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth/authApi';
import { meApi } from '../api/auth/meApi';
import { TOKEN_STORAGE_KEY } from '../api/client';
import type { LoginRequest } from '../types/auth';

interface Session {
  tenantCode: string;
  username: string;
  roles: string[];
  permissions: string[];
  timezone: string | null;
}

interface AuthContextValue {
  session: Session | null;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
  updateTimezone: (timezone: string | null) => Promise<void>;
  hasPermission: (name: string) => boolean;
  hasAnyPermission: (names: string[]) => boolean;
}

const SESSION_STORAGE_KEY = 'erp.session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): Session | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<Session>;
  if (!Array.isArray(parsed.roles) || !Array.isArray(parsed.permissions)) {
    // Stale session shape from before these fields existed (or corrupted storage) - drop it
    // rather than crash downstream permission checks, forcing a clean re-login.
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
  return parsed as Session;
}

function persist(session: Session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);

  const login = async (request: LoginRequest) => {
    const response = await authApi.login(request);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    const nextSession: Session = {
      tenantCode: request.tenantCode,
      username: response.username,
      roles: response.roles,
      permissions: response.permissions,
      timezone: response.timezone,
    };
    persist(nextSession);
    setSession(nextSession);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  };

  const updateTimezone = async (timezone: string | null) => {
    await meApi.updateTimezone({ timezone });
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, timezone };
      persist(next);
      return next;
    });
  };

  // Mirrors the backend's own gate (@PreAuthorize("hasAuthority(...)")) so the UI never shows
  // a link/button for something the API would 403 on anyway.
  const hasPermission = (name: string) => session?.permissions?.includes(name) ?? false;
  const hasAnyPermission = (names: string[]) => names.some(hasPermission);

  return (
    <AuthContext.Provider value={{ session, login, logout, updateTimezone, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
