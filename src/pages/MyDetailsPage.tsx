import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { Card, PageHeader, PillList } from '../components/ui';

/**
 * Read-only, personal to the signed-in user - not tenant configuration (see Settings in the
 * sidebar for that). Sourced entirely from the session today; expected to grow (email, full
 * name, etc.) once `GET /api/me` exists.
 */
export function MyDetailsPage() {
  const { t } = useLocale();
  const { session } = useAuth();

  return (
    <div>
      <PageHeader title={t('pages.myDetails.title')} description={t('pages.myDetails.description')} />
      <Card>
        <dl className="detail-grid">
          <div className="detail-row">
            <dt>{t('fields.username')}</dt>
            <dd>{session?.username ?? '-'}</dd>
          </div>
          <div className="detail-row">
            <dt>{t('topbar.tenant')}</dt>
            <dd>{session?.tenantCode ?? '-'}</dd>
          </div>
          <div className="detail-row">
            <dt>{t('topbar.role')}</dt>
            <dd><PillList items={session?.roleLabels ?? []} /></dd>
          </div>
          <div className="detail-row">
            <dt>{t('topbar.timezone')}</dt>
            <dd>{session?.timezone ?? t('pages.config.tenantDefault')}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
