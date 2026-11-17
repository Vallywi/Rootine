import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import PhotoEditor from './PhotoEditor.jsx';
import { AccountSettings, AlertSettings, HelpCard, InstallCard, LookSettings, TimerSettings } from '../pages/SettingsPage.jsx';

// The side panel that opens from the name at the top right. Native <dialog>, so focus stays inside and Esc closes it.
export default function AccountDrawer({ open, onClose }) {
  const { user, logout } = useAuth();
  const ref = useRef(null);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const tabs = [['profile', 'Profile'], ['settings', 'Settings']];
  const onKey = (e) => {
    const i = tabs.findIndex(([k]) => k === tab);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length][0];
      setTab(next);
      document.getElementById(`drawer-tab-${next}`)?.focus();
    }
  };

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }} // a click on the dimmed area
    >
      <div className="drawer__panel">
        <header className="drawer__head">
          <Avatar name={user.displayName} url={user.avatarUrl} size={48} />
          <div className="drawer__who">
            <h2 id="drawer-title">{user.displayName}</h2>
            <p className="muted small">{user.email}</p>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" title="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" /></svg>
          </button>
        </header>

        <div className="drawer__tabs" role="tablist" aria-label="Account" onKeyDown={onKey}>
          {tabs.map(([key, label]) => (
            <button key={key} id={`drawer-tab-${key}`} type="button" role="tab" aria-selected={tab === key} aria-controls={`drawer-panel-${key}`}
              tabIndex={tab === key ? 0 : -1} className={`drawer__tab ${tab === key ? 'is-active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        <div className="drawer__body" role="tabpanel" id={`drawer-panel-${tab}`} aria-labelledby={`drawer-tab-${tab}`}>
          {open && tab === 'profile' && (
            <div className="stack">
              <PhotoEditor />
              <AccountSettings compact />
            </div>
          )}
          {open && tab === 'settings' && (
            <div className="stack">
              <TimerSettings />
              <AlertSettings />
              <LookSettings />
              <InstallCard />
              <HelpCard />
            </div>
          )}
        </div>

        <footer className="drawer__foot">
          <button type="button" className="btn btn--ghost btn--block" onClick={async () => { onClose(); await logout(); }}>Sign out</button>
        </footer>
      </div>
    </dialog>
  );
}
