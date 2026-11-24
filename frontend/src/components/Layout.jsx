import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import * as api from '../lib/api.js';
import Avatar from './Avatar.jsx';
import AccountDrawer from './AccountDrawer.jsx';
import ChatDrawer from './ChatDrawer.jsx';
import CountdownOverlay from './CountdownOverlay.jsx';
import { useAuth } from '../lib/AuthContext.jsx';
import Tour from './Tour.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import TimerOverlay from './TimerOverlay.jsx';
import PopOutTimer from './PopOutTimer.jsx';

// Settings is not here. It lives in the side drawer that opens from the name at the top right.
const links = [
  { to: '/', label: 'Focus', icon: '⏱', end: true },
  { to: '/tasks', label: 'Tasks', icon: '✓' },
  { to: '/garden', label: 'Garden', icon: '🌱' },
  { to: '/friends', label: 'Friends', icon: '\uD83D\uDC6B', badge: true },
  { to: '/yard', label: 'Yard', icon: '🏡' },
];

// Top bar on wide screens, bottom bar on phones.
export default function Layout() {
  const { user, demo } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [chat, setChat] = useState(false);
  const [requests, setRequests] = useState(0);
  const [coins, setCoins] = useState(null);

  // The coin counter in the top bar.
  const loadCoins = useCallback(async () => {
    try { setCoins((await api.get('/shop/balance')).coins.balance); } catch { /* the counter is optional */ }
  }, []);
  useEffect(() => {
    loadCoins();
    const onVisible = () => { if (document.visibilityState === 'visible') loadCoins(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('rootine:coins', loadCoins);
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('rootine:coins', loadCoins); };
  }, [loadCoins]);

  // The number of friend requests waiting for an answer, shown on the Friends tab.
  const loadRequests = useCallback(async () => {
    try { setRequests((await api.get('/friends')).incoming.length); } catch { /* the badge is optional */ }
  }, []);
  useEffect(() => {
    loadRequests();
    const id = setInterval(loadRequests, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') loadRequests(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('rootine:friends', loadRequests);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('rootine:friends', loadRequests); };
  }, [loadRequests]);
  // The tour is started from inside the drawer too, so close the drawer first.
  useEffect(() => {
    const close = () => setDrawer(false);
    window.addEventListener('rootine:tour', close);
    return () => window.removeEventListener('rootine:tour', close);
  }, []);
  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <span className="row topbar__left">
          <span className="brand"><span aria-hidden="true">🌿</span> <span className="brand__text">Rootine</span></span>
          {demo && <span className="demo-badge" title="Demo mode is on (development only): sessions can be 1 minute and trees are unlocked.">DEMO</span>}
        </span>
        <nav aria-label="Main" className="nav nav--top" data-tour="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav__link">{l.label}{l.badge && requests > 0 && <span className="count-badge" aria-label={`${requests} new friend requests`}>{requests}</span>}</NavLink>
          ))}
        </nav>
        <span className="row topbar__right" data-tour="tools">
          {coins !== null && <NavLink to="/shop" className="coin-pill coin-pill--nav" title="Your coins. Open the shop." aria-label={`${coins} coins. Open the shop.`}><span aria-hidden="true">{'\uD83E\uDE99'}</span> {coins}</NavLink>}
          <ThemeToggle />
          <button type="button" className="icon-btn" aria-label="Show the beginner tour" title="How Rootine works" onClick={() => window.dispatchEvent(new Event('rootine:tour'))}>?</button>
          <button type="button" className="profile-btn" data-tour="profile" onClick={() => setDrawer(true)} aria-haspopup="dialog" aria-label={`Open your profile and settings, ${user.displayName}`} title="Profile and settings">
            <Avatar name={user.displayName} url={user.avatarUrl} size={32} />
            <span className="profile-btn__name">{user.displayName}</span>
          </button>
        </span>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        <Outlet />
      </main>
      <AccountDrawer open={drawer} onClose={() => setDrawer(false)} />
      <button type="button" className="chat-fab" aria-haspopup="dialog" aria-label="Ask Rootie about your progress" title="Ask Rootie" onClick={() => setChat(true)}><span aria-hidden="true">{'\uD83D\uDCAC'}</span></button>
      <ChatDrawer open={chat} onClose={() => setChat(false)} />
      <CountdownOverlay />
      <Tour />
      <TimerOverlay />
      <PopOutTimer />
      <nav aria-label="Main (mobile)" className="nav nav--bottom" data-tour="nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="nav__link">
            <span aria-hidden="true" className="nav__icon">{l.icon}{l.badge && requests > 0 && <span className="count-badge">{requests}</span>}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
