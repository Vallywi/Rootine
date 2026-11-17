import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

const links = [
  { to: '/', label: 'Focus', icon: '⏱', end: true },
  { to: '/tasks', label: 'Tasks', icon: '✓' },
  { to: '/garden', label: 'Garden', icon: '🌱' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

// Top bar on wide screens, bottom bar on phones.
export default function Layout() {
  const { user } = useAuth();
  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <span className="brand"><span aria-hidden="true">🌿</span> Rootine</span>
        <nav aria-label="Main" className="nav nav--top">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav__link">{l.label}</NavLink>
          ))}
        </nav>
        <span className="topbar__user" title={user.email}>{user.displayName}</span>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        <Outlet />
      </main>
      <nav aria-label="Main (mobile)" className="nav nav--bottom">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="nav__link">
            <span aria-hidden="true" className="nav__icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
