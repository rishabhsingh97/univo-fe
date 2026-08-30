import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeLogApi } from '../api/hr/timeLogApi';
import { useLocale } from '../context/LocaleContext';
import { Button, Card, Modal, PageHeader, PagedDataTable, TextField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { TimeLogResponse } from '../types/timeTracker';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

function nowHHMM(): string {
  return new Date().toTimeString().slice(0, 5);
}

interface ManualEntryForm {
  date: string;
  clockIn: string;
  clockOut: string;
  taskTag: string;
}

function emptyManualForm(): ManualEntryForm {
  return { date: new Date().toISOString().slice(0, 10), clockIn: '', clockOut: '', taskTag: '' };
}

export function TimeTrackerPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [isTracking, setIsTracking] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tag, setTag] = useState('');
  const [startClockIn, setStartClockIn] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState<ManualEntryForm>(emptyManualForm());

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['time-logs'] });

  const createMutation = useMutation({
    mutationFn: timeLogApi.create,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => timeLogApi.delete(id),
    onSuccess: invalidate,
  });

  useEffect(() => {
    if (!isTracking || startedAt === null) return;
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isTracking, startedAt]);

  const handleStart = () => {
    setIsTracking(true);
    setStartedAt(Date.now() - elapsedSeconds * 1000);
    setStartClockIn(startClockIn ?? nowHHMM());
  };

  const handlePause = () => setIsTracking(false);

  const handleStop = () => {
    setIsTracking(false);
    if (elapsedSeconds > 0) {
      createMutation.mutate({
        date: new Date().toISOString().slice(0, 10),
        clockIn: startClockIn ?? nowHHMM(),
        clockOut: nowHHMM(),
        taskTag: tag || t('pages.timeTracker.untagged'),
      });
    }
    setStartedAt(null);
    setElapsedSeconds(0);
    setStartClockIn(null);
    setTag('');
  };

  const closeManual = () => {
    setShowManual(false);
    setManualForm(emptyManualForm());
  };

  const handleManualAdd = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(
      {
        date: manualForm.date,
        clockIn: manualForm.clockIn,
        clockOut: manualForm.clockOut,
        taskTag: manualForm.taskTag || t('pages.timeTracker.untagged'),
      },
      { onSuccess: closeManual },
    );
  };

  const columns: DataTableColumn<TimeLogResponse>[] = [
    { key: 'date', header: t('fields.date'), render: (e) => e.date, sortKey: 'date' },
    { key: 'clockIn', header: t('pages.timeTracker.clockIn'), render: (e) => e.clockIn },
    { key: 'clockOut', header: t('pages.timeTracker.clockOut'), render: (e) => e.clockOut },
    { key: 'duration', header: t('fields.duration'), render: (e) => `${Math.floor(e.durationMinutes / 60)}h ${e.durationMinutes % 60}m` },
    { key: 'tag', header: t('pages.timeTracker.taskTag'), render: (e) => e.taskTag ?? '-' },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.timeTracker.title')}
        description={t('pages.timeTracker.description')}
        actions={<Button variant="secondary" onClick={() => setShowManual(true)}>{t('pages.timeTracker.addManualEntry')}</Button>}
      />

      <Card style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>
          {formatDuration(elapsedSeconds)}
        </div>
        <div style={{ maxWidth: 320, margin: '0 auto 16px' }}>
          <TextField label={t('pages.timeTracker.taskTag')} value={tag} onChange={(e) => setTag(e.target.value)} disabled={isTracking} />
        </div>
        <div className="row-actions" style={{ justifyContent: 'center' }}>
          {!isTracking ? (
            <Button onClick={handleStart}>{elapsedSeconds > 0 ? t('pages.timeTracker.resume') : t('pages.timeTracker.start')}</Button>
          ) : (
            <Button variant="secondary" onClick={handlePause}>{t('pages.timeTracker.pause')}</Button>
          )}
          <Button variant="danger" onClick={handleStop} disabled={elapsedSeconds === 0 && !isTracking}>{t('pages.timeTracker.stop')}</Button>
        </div>
      </Card>

      <PagedDataTable
        columns={columns}
        queryKey={['time-logs']}
        fetchPage={timeLogApi.list}
        getRowKey={(e) => e.id}
        onDelete={(e) => deleteMutation.mutate(e.id)}
      />

      {showManual && (
        <Modal title={t('pages.timeTracker.addManualEntry')} onClose={closeManual}>
          <form onSubmit={handleManualAdd} className="form-grid">
            <div className="field">
              <label className="field-label">{t('fields.date')}</label>
              <input type="date" className="input" value={manualForm.date} onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })} required />
            </div>
            <TextField label={t('pages.timeTracker.taskTag')} value={manualForm.taskTag} onChange={(e) => setManualForm({ ...manualForm, taskTag: e.target.value })} />
            <div className="field">
              <label className="field-label">{t('pages.timeTracker.clockIn')}</label>
              <input type="time" className="input" value={manualForm.clockIn} onChange={(e) => setManualForm({ ...manualForm, clockIn: e.target.value })} required />
            </div>
            <div className="field">
              <label className="field-label">{t('pages.timeTracker.clockOut')}</label>
              <input type="time" className="input" value={manualForm.clockOut} onChange={(e) => setManualForm({ ...manualForm, clockOut: e.target.value })} required />
            </div>
            {createMutation.isError && (
              <div style={{ color: 'var(--color-danger)', fontSize: 13, gridColumn: '1 / -1' }}>{t('pages.timeTracker.invalidRange')}</div>
            )}
            <div className="form-actions">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeManual}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
