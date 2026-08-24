import { useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { Button } from '../components/ui';

/** Standalone (no AppLayout/AuthShell) since it's reached before we know whether the visitor is
 * signed in - the catch-all route in AppRoutes sits outside both ProtectedRoute and
 * PlatformProtectedRoute. "Go back" prefers browser history (a stale/typo'd link) and falls back
 * to the dashboard/login redirect at "/" only when there's nowhere to go back to. */
export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useLocale();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
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
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-primary)',
        }}
      >
        404
      </div>
      <h1 style={{ margin: 0 }}>{t('notFound.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 380, margin: 0 }}>{t('notFound.body')}</p>
      <Button onClick={goBack}>{t('notFound.back')}</Button>
    </div>
  );
}
