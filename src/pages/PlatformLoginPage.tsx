import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Button, Card, TextField } from '../components/ui';

export function PlatformLoginPage() {
  const { login } = usePlatformAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ username, password });
      navigate('/platform/clients');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <Card className="login-card">
        <h1>Platform Admin</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: -8 }}>Manage clients and their modules</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <Link to="/login" style={{ display: 'block', marginTop: 16, fontSize: 12.5, textAlign: 'center' }}>
          Back to tenant sign in
        </Link>
      </Card>
    </div>
  );
}
