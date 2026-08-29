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
  /** This tenant's own googleSignInEnabled branding switch - defaults to true so any other
   * caller that doesn't pass it keeps today's behavior. AuthService.loginWithGoogle enforces
   * this server-side regardless; gating it here too avoids showing a button that would always
   * fail for a tenant that hasn't turned Google sign-in on. */
  googleEnabled?: boolean;
}

/** Never talks to Google directly - Google's OAuth console has no wildcard support for
 * "Authorized JavaScript origins", so a tenant subdomain calling google.accounts.id.initialize()
 * itself would need registering with Google by hand, per tenant. Instead this opens
 * GoogleAuthBridgePage in a popup on the one fixed, permanently-registered bridge origin
 * (VITE_GOOGLE_AUTH_BRIDGE_URL); the bridge does the actual Google sign-in and relays the
 * resulting ID token back here via postMessage. Google is fully wired once both
 * VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_AUTH_BRIDGE_URL are set. */
export function SocialSignIn({ tenantCode, onGoogleCredential, googleEnabled = true }: SocialSignInProps) {
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
  const googleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_AUTH_BRIDGE_URL) && googleEnabled;

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
      </div>
      {popupBlocked && (
        <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>
          Your browser blocked the sign-in popup. Allow popups for this site and try again.
        </div>
      )}
    </div>
  );
}
