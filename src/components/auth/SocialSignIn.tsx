import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button } from '../ui';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.61z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.19l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.69A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.69V4.98H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.02z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.98l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 17 20" fill="currentColor" aria-hidden="true">
      <path d="M14.1 10.6c0-2.03 1.66-3 1.73-3.05-.95-1.38-2.42-1.57-2.95-1.6-1.25-.12-2.45.74-3.08.74-.64 0-1.62-.72-2.66-.7-1.37.02-2.63.8-3.34 2.02-1.42 2.47-.36 6.13 1.03 8.14.67.97 1.47 2.07 2.53 2.03 1.01-.04 1.4-.66 2.63-.66 1.22 0 1.57.66 2.65.64 1.1-.02 1.79-1 2.46-1.98.77-1.14 1.09-2.24 1.1-2.3-.02-.01-2.1-.82-2.1-3.28z" />
      <path d="M12.08 4.24c.56-.68.94-1.62.83-2.56-.81.03-1.78.54-2.36 1.21-.52.6-.97 1.56-.85 2.48.9.07 1.82-.46 2.38-1.13z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.2 9.6H4.4V19h2.8V9.6zM5.8 8.4c.95 0 1.55-.63 1.55-1.42C7.33 6.18 6.75 5.6 5.8 5.6c-.94 0-1.55.58-1.55 1.38 0 .79.6 1.42 1.53 1.42h.02zM19.6 19v-5.36c0-2.87-1.53-4.2-3.58-4.2-1.65 0-2.39.91-2.8 1.55V9.6H10.4c.04.78 0 9.4 0 9.4h2.82v-5.25c0-.28.02-.56.1-.76.23-.56.75-1.15 1.63-1.15 1.15 0 1.61.88 1.61 2.16V19h2.83z"
      />
    </svg>
  );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_AUTH_BRIDGE_URL = import.meta.env.VITE_GOOGLE_AUTH_BRIDGE_URL as string | undefined;
const MESSAGE_SOURCE = 'univo-google-bridge';

interface SocialSignInProps {
  /** Google sign-in still needs a workspace to log into, same as password sign-in - disabled
   * until the visitor has typed one. */
  tenantCode: string;
  /** Called with the tenant code as it was at the moment the visitor clicked the button, not
   * whatever it was when this component first mounted (see tenantCodeRef below). */
  onGoogleCredential: (idToken: string, tenantCode: string) => void;
}

/** Never talks to Google directly - Google's OAuth console has no wildcard support for
 * "Authorized JavaScript origins", so a tenant subdomain calling google.accounts.id.initialize()
 * itself would need registering with Google by hand, per tenant. Instead this opens
 * GoogleAuthBridgePage in a popup on the one fixed, permanently-registered bridge origin
 * (VITE_GOOGLE_AUTH_BRIDGE_URL); the bridge does the actual Google sign-in and relays the
 * resulting ID token back here via postMessage. Google is fully wired once both
 * VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_AUTH_BRIDGE_URL are set. Apple and LinkedIn are shown so
 * people know they're coming, but stay disabled until their own backend flows exist - a button
 * that looks clickable but silently fails is worse than one that's honestly off. */
export function SocialSignIn({ tenantCode, onGoogleCredential }: SocialSignInProps) {
  const [opening, setOpening] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const pollTimerRef = useRef<number | undefined>(undefined);
  // The message handler and popup-close poller close over stale props/state from the render
  // they were set up in - these refs are how they read the *current* values instead.
  const tenantCodeRef = useRef(tenantCode);
  tenantCodeRef.current = tenantCode;
  const onGoogleCredentialRef = useRef(onGoogleCredential);
  onGoogleCredentialRef.current = onGoogleCredential;

  useEffect(() => {
    if (!GOOGLE_AUTH_BRIDGE_URL) return;
    const bridgeOrigin = new URL(GOOGLE_AUTH_BRIDGE_URL).origin;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== bridgeOrigin) return;
      const data = event.data as { source?: string; idToken?: string } | null;
      if (!data || data.source !== MESSAGE_SOURCE || typeof data.idToken !== 'string') return;
      window.clearInterval(pollTimerRef.current);
      setOpening(false);
      onGoogleCredentialRef.current(data.idToken, tenantCodeRef.current);
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.clearInterval(pollTimerRef.current);
    };
  }, []);

  const openGoogleBridge = () => {
    if (!GOOGLE_AUTH_BRIDGE_URL) return;
    setPopupBlocked(false);
    const url = `${GOOGLE_AUTH_BRIDGE_URL}?returnOrigin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(url, 'univo-google-auth', 'width=480,height=600');
    if (!popup) {
      setPopupBlocked(true);
      return;
    }
    setOpening(true);
    // The bridge popup posts a message and closes itself on success; this only needs to notice
    // when the visitor closes it themselves without completing sign-in, so the button re-enables.
    pollTimerRef.current = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(pollTimerRef.current);
        setOpening(false);
      }
    }, 500);
  };

  const tenantMissing = tenantCode.trim().length === 0;
  const iconButtonStyle: CSSProperties = {
    width: 44,
    height: 44,
    padding: 0,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const googleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_AUTH_BRIDGE_URL);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        {googleConfigured ? (
          <span title={tenantMissing ? 'Enter a tenant code first' : 'Continue with Google'}>
            <Button
              type="button"
              variant="secondary"
              disabled={tenantMissing || opening}
              onClick={openGoogleBridge}
              aria-label="Continue with Google"
              style={iconButtonStyle}
            >
              <GoogleIcon />
            </Button>
          </span>
        ) : (
          <span title="Google sign-in is not configured yet">
            <Button type="button" variant="secondary" disabled aria-label="Continue with Google" style={iconButtonStyle}>
              <GoogleIcon />
            </Button>
          </span>
        )}
        <span title="Continue with Apple · Coming soon">
          <Button type="button" variant="secondary" disabled aria-label="Continue with Apple" style={iconButtonStyle}>
            <AppleIcon />
          </Button>
        </span>
        <span title="Continue with LinkedIn · Coming soon">
          <Button type="button" variant="secondary" disabled aria-label="Continue with LinkedIn" style={iconButtonStyle}>
            <LinkedInIcon />
          </Button>
        </span>
      </div>
      {popupBlocked && (
        <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>
          Your browser blocked the sign-in popup. Allow popups for this site and try again.
        </div>
      )}
    </div>
  );
}
