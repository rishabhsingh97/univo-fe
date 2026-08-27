import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth/authApi';
import { meApi } from '../api/auth/meApi';
import { domainApi } from '../api/public/domainApi';
import type { GoogleLoginRequest, LoginRequest, LoginResponse } from '../types/auth';

interface Session {
  tenantCode: string;
  email: string;
  roles: string[];
  roleLabels: string[];
  permissions: string[];
  timezone: string | null;
  disabledModules: string[];
  mustChangePassword: boolean;
}

interface AuthContextValue {
  session: Session | null;
  login: (request: LoginRequest) => Promise<void>;
  loginWithGoogle: (request: GoogleLoginRequest) => Promise<void>;
  /** Starts a session from a LoginResponse the caller already has in hand (e.g. the signup
   * wizard's step 3, which gets one back directly from POST .../step3) instead of making a
   * second round trip through login(). */
  setSessionFromLoginResponse: (tenantCode: string, response: LoginResponse) => void;
  logout: () => void;
  updateTimezone: (timezone: string | null) => Promise<void>;
  hasPermission: (name: string) => boolean;
  hasAnyPermission: (names: string[]) => boolean;
  /** Call after a successful self-service password change to clear the forced-change gate. */
  markPasswordChanged: () => void;
}

const SESSION_STORAGE_KEY = 'erp.session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): Session | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<Session>;
  if (
    !Array.isArray(parsed.roles) ||
    !Array.isArray(parsed.roleLabels) ||
    !Array.isArray(parsed.permissions) ||
    !Array.isArray(parsed.disabledModules)
  ) {
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
    applySession(request.tenantCode, response);
  };

  const loginWithGoogle = async (request: GoogleLoginRequest) => {
    const response = await authApi.loginWithGoogle(request);
    applySession(request.tenantCode, response);
  };

  const applySession = (tenantCode: string, response: LoginResponse) => {
    const nextSession: Session = {
      tenantCode,
      email: response.email,
      roles: response.roles,
      roleLabels: response.roleLabels,
      permissions: response.permissions,
      timezone: response.timezone,
      disabledModules: response.disabledModules,
      mustChangePassword: response.mustChangePassword,
    };
    persist(nextSession);
    setSession(nextSession);
  };

  // Fire-and-forget: the server-side revoke matters for the refresh token that's about to be
  // cleared, but the local session must disappear immediately either way (e.g. the network
  // being down shouldn't trap the user in a "logged in" UI they can't get out of).
  const logout = () => {
    authApi.logout().catch(() => undefined);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  };

  // Guards against a stored session whose tenant doesn't match the tenant this hostname
  // actually belongs to (e.g. a subdomain got reassigned to a different tenant since this
  // session was stored) - the backend trusts the JWT's tenant claim regardless of which domain
  // the request arrives on (see JwtAuthenticationFilter), so nothing else catches this. Only
  // acts when the hostname resolves to a *specific* tenant; the generic/bare domain (or
  // localhost) has no such expectation, so a session there is never considered mismatched.
  // Runs once at mount - the hostname can't change without a full page reload anyway.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    domainApi.resolveTenantByDomain(window.location.hostname).then((resolved) => {
      if (!cancelled && resolved && resolved !== session.tenantCode) {
        logout();
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const markPasswordChanged = () => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, mustChangePassword: false };
      persist(next);
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        loginWithGoogle,
        setSessionFromLoginResponse: applySession,
        logout,
        updateTimezone,
        hasPermission,
        hasAnyPermission,
        markPasswordChanged,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
