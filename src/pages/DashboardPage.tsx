import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { Card, PageHeader } from '../components/ui';

export function DashboardPage() {
  const { session } = useAuth();
  const { t } = useLocale();
  return (
    <div>
      <PageHeader title={t('pages.dashboard.title')} description={`Signed in as ${session?.username}`} />
      <Card>
        <p style={{ margin: 0 }}>Roles: {session?.roles.join(', ')}</p>
      </Card>
    </div>
  );
}
