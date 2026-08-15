import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LocaleContext';
import { Button } from '../ui';
import './layout.css';

export function Topbar() {
  const { session, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();

  return (
    <header className="topbar">
      <div>{session?.username}</div>
      <div className="topbar-actions">
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === 'light' ? t('topbar.darkMode') : t('topbar.lightMode')}
        </Button>
        <Button variant="secondary" onClick={logout}>
          {t('topbar.logout')}
        </Button>
      </div>
    </header>
  );
}
