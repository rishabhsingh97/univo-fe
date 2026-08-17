import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { meApi } from '../api/auth/meApi';
import { Button, Card, PageHeader, TextField } from '../components/ui';

export function ChangePasswordPage() {
  const { t } = useLocale();
  const { session, markPasswordChanged } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const forced = session?.mustChangePassword ?? false;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t('pages.changePassword.mismatch'));
      return;
    }
    setSubmitting(true);
    try {
      await meApi.changePassword({ currentPassword, newPassword });
      markPasswordChanged();
      navigate('/');
    } catch (err) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined;
      setError(message ?? t('pages.changePassword.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('pages.changePassword.title')}
        description={forced ? t('pages.changePassword.forcedDescription') : t('pages.changePassword.description')}
      />
      <Card style={{ maxWidth: 420 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField
            label={t('fields.currentPassword')}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <TextField
            label={t('fields.newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <TextField
            label={t('fields.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}
          <div className="form-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? t('pages.changePassword.saving') : t('pages.changePassword.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
