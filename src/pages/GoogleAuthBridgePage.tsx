import { useEffect, useRef, useState } from 'react';
import { domainApi } from '../api/public/domainApi';

declare global {
  interface Window {
    // Google Identity Services' own global - no @types package for it, and the surface used here
    // (initialize/renderButton) is tiny enough that a full type dependency isn't worth it.
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
/** postMessage's own signature so SocialSignIn's listener can't be fooled by some other message
 * arriving on the same channel (e.g. a browser extension, or an unrelated postMessage from
 * another script sharing the tab). */
const MESSAGE_SOURCE = 'univo-google-bridge';

type Status = 'validating' | 'ready' | 'no-opener' | 'invalid-origin' | 'not-configured';

/**
 * The ONLY page in univo-fe that ever calls google.accounts.id.initialize() - Google's
 * "Authorized JavaScript origins" has no wildcard support, so every one of Univo's tenant
 * subdomains calling this directly would need registering with Google by hand. Instead this page
 * runs on one fixed, permanently-registered origin (auth.univoapps.com), opened as a popup by a
 * tenant's own login page (see SocialSignIn.tsx). Once the visitor completes Google sign-in here,
 * the resulting ID token is relayed back via postMessage to exactly the origin that opened this
 * popup - and only after confirming, via the same public lookup LoginPage itself uses, that the
 * origin is a real, currently-active Univo tenant domain (not an arbitrary URL) - see
 * SocialSignIn.tsx and AuthService.loginWithGoogle for the rest of the trust chain.
 */
export function GoogleAuthBridgePage() {
  const [status, setStatus] = useState<Status>('validating');
  const returnOriginRef = useRef<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const returnOrigin = new URLSearchParams(window.location.search).get('returnOrigin');
    if (!window.opener || !returnOrigin) {
      setStatus('no-opener');
      return;
    }
    let hostname: string;
    try {
      hostname = new URL(returnOrigin).hostname;
    } catch {
      setStatus('invalid-origin');
      return;
    }
    if (!GOOGLE_CLIENT_ID) {
      setStatus('not-configured');
      return;
    }
    let cancelled = false;
    domainApi
      .resolveTenantByDomain(hostname)
      .then((resolved) => {
        if (cancelled) return;
        if (!resolved) {
          setStatus('invalid-origin');
          return;
        }
        returnOriginRef.current = returnOrigin;
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('invalid-origin');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    let cancelled = false;
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (cancelled || !window.google || !returnOriginRef.current) return;
      const targetOrigin = returnOriginRef.current;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID as string,
        callback: (response) => {
          window.opener?.postMessage({ source: MESSAGE_SOURCE, idToken: response.credential }, targetOrigin);
          window.close();
        },
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, { type: 'standard', theme: 'outline', size: 'large' });
      }
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [status]);

  const messages: Record<Exclude<Status, 'validating' | 'ready'>, string> = {
    'no-opener': 'This page only works when opened from a Univo sign-in page.',
    'invalid-origin': "We couldn't verify where this sign-in request came from.",
    'not-configured': 'Google sign-in is not configured.',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        textAlign: 'center',
        padding: 24,
      }}
    >
      {status === 'ready' ? (
        <div ref={buttonRef} />
      ) : status === 'validating' ? (
        <p style={{ color: 'var(--color-text-muted, #6b7280)' }}>Loading...</p>
      ) : (
        <p style={{ color: 'var(--color-danger, #cc2318)', maxWidth: 320 }}>{messages[status]}</p>
      )}
    </div>
  );
}
