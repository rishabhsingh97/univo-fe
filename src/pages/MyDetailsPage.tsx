import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meApi } from '../api/auth/meApi';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { Button, Card, Modal, PageHeader, PillList, TextField } from '../components/ui';
import type { UpdateProfileRequest } from '../types/auth';
import type { EmployeeLinkRequest, EmployeeLinkResponse } from '../types/hr';

/**
 * Now backed by GET /api/me instead of just the session - this page's own comment used to say
 * it was "expected to grow ... once GET /api/me exists". Employee-links section is hidden
 * entirely for a User with no linked Employee record (that endpoint 404s in that case - not an
 * error, just nothing to show).
 */
export function MyDetailsPage() {
  const { t } = useLocale();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: meApi.get });
  const { data: links, isError: noLinks } = useQuery({
    queryKey: ['me', 'employee-links'],
    queryFn: meApi.listEmployeeLinks,
    retry: false,
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!me?.hasAvatar) {
      setAvatarUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    meApi.getAvatarBlobUrl().then((url) => {
      objectUrl = url;
      setAvatarUrl(url);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [me?.hasAvatar]);

  const invalidateMe = () => queryClient.invalidateQueries({ queryKey: ['me'] });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => meApi.uploadAvatar(file),
    onSuccess: invalidateMe,
  });
  const deleteAvatarMutation = useMutation({
    mutationFn: () => meApi.deleteAvatar(),
    onSuccess: invalidateMe,
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({});
  const updateProfileMutation = useMutation({
    mutationFn: (request: UpdateProfileRequest) => meApi.updateProfile(request),
    onSuccess: () => { invalidateMe(); setEditingProfile(false); },
  });

  const invalidateLinks = () => queryClient.invalidateQueries({ queryKey: ['me', 'employee-links'] });
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkForm, setLinkForm] = useState<EmployeeLinkRequest>({ label: '', url: '' });
  const [editingLink, setEditingLink] = useState<EmployeeLinkResponse | null>(null);

  const createLinkMutation = useMutation({
    mutationFn: (request: EmployeeLinkRequest) => meApi.createEmployeeLink(request),
    onSuccess: () => { invalidateLinks(); setLinkForm({ label: '', url: '' }); setShowAddLink(false); },
  });
  const updateLinkMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: EmployeeLinkRequest }) => meApi.updateEmployeeLink(id, request),
    onSuccess: () => { invalidateLinks(); setEditingLink(null); },
  });
  const deleteLinkMutation = useMutation({
    mutationFn: (id: number) => meApi.deleteEmployeeLink(id),
    onSuccess: invalidateLinks,
  });

  const openEditProfile = () => {
    setProfileForm({
      address: me?.address ?? '',
      bloodGroup: me?.bloodGroup ?? '',
      phoneNumber: me?.phoneNumber ?? '',
      bio: me?.bio ?? '',
    });
    setEditingProfile(true);
  };

  return (
    <div>
      <PageHeader
        title={t('pages.myDetails.title')}
        description={t('pages.myDetails.description')}
        actions={<Button variant="secondary" onClick={openEditProfile}>{t('pages.myDetails.editProfile')}</Button>}
      />

      <Card>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 24, color: 'var(--color-text-muted)' }}>{(session?.email ?? '?').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', width: 'fit-content' }}>
              {t('pages.myDetails.uploadAvatar')}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatarMutation.mutate(file);
                }}
              />
            </label>
            {me?.hasAvatar && (
              <Button type="button" variant="secondary" onClick={() => deleteAvatarMutation.mutate()}>
                {t('pages.myDetails.removeAvatar')}
              </Button>
            )}
          </div>
        </div>

        <dl className="detail-grid">
          <div className="detail-row">
            <dt>{t('fields.email')}</dt>
            <dd>{session?.email ?? '-'}</dd>
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
          <div className="detail-row">
            <dt>{t('fields.phoneNumber')}</dt>
            <dd>{me?.phoneNumber ?? '-'}</dd>
          </div>
          <div className="detail-row">
            <dt>{t('fields.bloodGroup')}</dt>
            <dd>{me?.bloodGroup ?? '-'}</dd>
          </div>
          <div className="detail-row">
            <dt>{t('fields.address')}</dt>
            <dd>{me?.address ?? '-'}</dd>
          </div>
          <div className="detail-row">
            <dt>{t('fields.bio')}</dt>
            <dd>{me?.bio ?? '-'}</dd>
          </div>
        </dl>
      </Card>

      {!noLinks && (
        <>
          <div style={{ height: 20 }} />
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{t('pages.myDetails.linksTitle')}</h3>
              <Button variant="secondary" onClick={() => setShowAddLink(true)}>{t('pages.myDetails.addLink')}</Button>
            </div>
            {links && links.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {links.map((link) => (
                  <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{link.label}</div>
                      <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>{link.url}</a>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => { setEditingLink(link); setLinkForm({ label: link.label, url: link.url }); }}>{t('common.edit')}</Button>
                      <Button variant="danger" onClick={() => window.confirm(t('common.confirmDelete')) && deleteLinkMutation.mutate(link.id)}>{t('common.delete')}</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{t('pages.myDetails.noLinks')}</p>
            )}
          </Card>
        </>
      )}

      {editingProfile && (
        <Modal title={t('pages.myDetails.editProfileTitle')} onClose={() => setEditingProfile(false)}>
          <form
            onSubmit={(event: FormEvent) => { event.preventDefault(); updateProfileMutation.mutate(profileForm); }}
            className="form-grid"
          >
            <TextField label={t('fields.phoneNumber')} value={profileForm.phoneNumber ?? ''} onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} />
            <TextField label={t('fields.bloodGroup')} value={profileForm.bloodGroup ?? ''} onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })} placeholder="O+" />
            <TextField label={t('fields.address')} value={profileForm.address ?? ''} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
            <TextField label={t('fields.bio')} value={profileForm.bio ?? ''} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
            <div className="form-actions">
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditingProfile(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {showAddLink && (
        <Modal title={t('pages.myDetails.addLink')} onClose={() => setShowAddLink(false)}>
          <form onSubmit={(event: FormEvent) => { event.preventDefault(); createLinkMutation.mutate(linkForm); }} className="form-grid">
            <TextField label={t('fields.linkLabel')} value={linkForm.label} onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })} required />
            <TextField label={t('fields.linkUrl')} type="url" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} required />
            <div className="form-actions">
              <Button type="submit" disabled={createLinkMutation.isPending}>
                {createLinkMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddLink(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {editingLink && (
        <Modal title={t('pages.myDetails.editLink')} onClose={() => setEditingLink(null)}>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              updateLinkMutation.mutate({ id: editingLink.id, request: linkForm });
            }}
            className="form-grid"
          >
            <TextField label={t('fields.linkLabel')} value={linkForm.label} onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })} required />
            <TextField label={t('fields.linkUrl')} type="url" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} required />
            <div className="form-actions">
              <Button type="submit" disabled={updateLinkMutation.isPending}>
                {updateLinkMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditingLink(null)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
