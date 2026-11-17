import { useAuth } from '../lib/AuthContext.jsx';

// One tap switches between light and dark. Signed in, the choice is saved to the account.
// Signed out (landing and login pages), it is remembered in this browser only.
export default function ThemeToggle({ className = '' }) {
  const { settings, toggleTheme } = useAuth();
  const dark = settings.theme === 'dark';
  return (
    <button
      type="button"
      className={`icon-btn theme-btn ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      onClick={toggleTheme}
    >
      <span key={dark ? 'sun' : 'moon'} className="theme-btn__icon" aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
