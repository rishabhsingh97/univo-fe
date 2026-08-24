import { useQuery } from '@tanstack/react-query';
import { platformStatusApi } from '../api/platform/platformStatusApi';
import { Badge, Button, Card, PageHeader, Spinner } from '../components/ui';
import type { BadgeTone } from '../components/ui';
import type { ServiceStatusLevel } from '../types/platform';

const STATUS_TONE: Record<ServiceStatusLevel, BadgeTone> = {
  UP: 'success',
  CONFIGURED: 'success',
  NOT_CONFIGURED: 'neutral',
  WARNING: 'warning',
  DOWN: 'danger',
};

const STATUS_LABEL: Record<ServiceStatusLevel, string> = {
  UP: 'Up',
  CONFIGURED: 'Configured',
  NOT_CONFIGURED: 'Not configured',
  WARNING: 'Warning',
  DOWN: 'Down',
};

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds % 60}s`;
}

export function PlatformStatusPage() {
  // Live-ish view of the running backend - re-polled every 15s rather than left to go stale
  // while an admin has the page open, but not so often it looks like a busy dashboard.
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['platform', 'system-status'],
    queryFn: platformStatusApi.get,
    refetchInterval: 15000,
  });

  return (
    <div>
      <PageHeader
        title="System Status"
        description="Live connectivity for the services this backend depends on, plus JVM resource usage"
        actions={
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      {isLoading || !data ? (
        <Card><Spinner /></Card>
      ) : (
        <>
          <Card>
            <h3 style={{ marginTop: 0 }}>Services</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.services.map((service) => (
                <div
                  key={service.name}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{service.name}</div>
                    {service.detail && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{service.detail}</div>}
                  </div>
                  <Badge tone={STATUS_TONE[service.status]}>{STATUS_LABEL[service.status]}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ height: 20 }} />

          <Card>
            <h3 style={{ marginTop: 0 }}>JVM / Resource Usage</h3>
            <dl className="detail-grid">
              <div className="detail-row">
                <dt>Heap used</dt>
                <dd>{data.system.heapUsedMb.toLocaleString()} MB / {data.system.heapMaxMb.toLocaleString()} MB ({data.system.heapUsagePercent}%)</dd>
              </div>
              <div className="detail-row">
                <dt>Available processors</dt>
                <dd>{data.system.availableProcessors}</dd>
              </div>
              <div className="detail-row">
                <dt>Live threads</dt>
                <dd>{data.system.threadCount}</dd>
              </div>
              <div className="detail-row">
                <dt>Uptime</dt>
                <dd>{formatUptime(data.system.uptimeSeconds)}</dd>
              </div>
            </dl>
          </Card>
        </>
      )}
    </div>
  );
}
