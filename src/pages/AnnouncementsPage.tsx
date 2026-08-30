import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementApi } from '../api/common/announcementApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, Card, Modal, PageHeader, Spinner, TextField } from '../components/ui';
import type { AnnouncementRequest } from '../types/engagement';

interface AnnouncementForm {
  title: string;
  body: string;
  pinned: boolean;
}

function emptyAnnouncementForm(): AnnouncementForm {
  return { title: '', body: '', pinned: false };
}

export function AnnouncementsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { format } = useTimezone();
  const queryClient = useQueryClient();

  const canManage = hasPermission('admin.announcement.manage');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AnnouncementForm>(emptyAnnouncementForm());

  const announcementsQuery = useQuery({ queryKey: ['announcements'], queryFn: () => announcementApi.list(0, 20) });
  const announcements = announcementsQuery.data?.content ?? [];

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyAnnouncementForm());
  };

  const createAnnouncement = useMutation({
    mutationFn: (request: AnnouncementRequest) => announcementApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      closeForm();
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: number) => announcementApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createAnnouncement.mutate(form);
  };

  return (
    <div>
      <PageHeader
        title={t('pages.announcements.title')}
        description={t('pages.announcements.description')}
        actions={canManage ? <Button onClick={() => setShowForm(true)}>{t('pages.announcements.newAnnouncement')}</Button> : undefined}
      />

      {announcementsQuery.isLoading ? (
        <Spinner />
      ) : (
        <div style={{ maxWidth: 640 }}>
          {announcements.map((a) => (
            <Card key={a.id} style={{ marginBottom: 12 }}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <div className="field-hint">{a.authorName ?? '-'} - {format(a.createdAt)}</div>
                {a.pinned && <Badge tone="warning">{t('common.pinned')}</Badge>}
              </div>
              <h3 style={{ margin: '4px 0' }}>{a.title}</h3>
              <p style={{ margin: 0 }}>{a.body}</p>
              {canManage && (
                <div className="form-actions" style={{ marginTop: 8 }}>
                  <Button
                    variant="danger"
                    onClick={() => window.confirm(t('common.confirmDelete')) && deleteAnnouncement.mutate(a.id)}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={t('pages.announcements.newAnnouncement')} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="form-grid">
            <TextField label={t('fields.title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('fields.description')}</label>
              <textarea className="input" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            </div>
            <label className="checkbox-option">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
              {t('common.pinned')}
            </label>
            <div className="form-actions">
              <Button type="submit" disabled={createAnnouncement.isPending}>
                {createAnnouncement.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
