import { useEffect, useState } from 'react';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { useTimer } from '../lib/TimerContext.jsx';
import { askNotificationPermission, notificationsSupported } from '../lib/alerts.js';
import { ConfirmDialog, Field, FormError } from '../components/ui.jsx';

const TIMING = [
  ['focusMinutes', 'Focus (minutes)', 'focus'],
  ['shortBreakMinutes', 'Short break (minutes)', 'shortBreak'],
  ['longBreakMinutes', 'Long break (minutes)', 'longBreak'],
  ['longBreakInterval', 'Long break after (focus sessions)', 'interval'],
];

export default function SettingsPage() {
  return (
    <section className="stack">
      <h1>Settings</h1>
      <TimerSettings />
      <AlertSettings />
      <LookSettings />
      <InstallCard />
      <AccountSettings />
    </section>
  );
}

function TimerSettings() {
  const { settings, limits, saveSettings, sessionEnded } = useAuth();
  const { session } = useTimer();
  const locked = !!session && (session.status === 'active' || session.status === 'paused');
  const [form, setForm] = useState(() => Object.fromEntries(TIMING.map(([k]) => [k, String(settings[k])])));
  const [fields, setFields] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setFields({}); setMsg(''); setError('');
    // Send only what changed.
    const changes = {};
    const local = {};
    for (const [k, label] of TIMING) {
      const n = Number(form[k]);
      if (form[k].trim() === '' || !Number.isInteger(n)) local[k] = 'Enter a whole number.';
      else if (n !== settings[k]) changes[k] = n;
    }
    if (Object.keys(local).length) { setFields(local); return; }
    if (!Object.keys(changes).length) { setMsg('Nothing to save.'); return; }
    try { await saveSettings(changes); setMsg('Saved.'); }
    catch (err) {
      if (err.status === 401) sessionEnded();
      setFields(err.fields || {});
      setError(err.message);
    }
  };

  const range = (key) => (limits ? `${limits[key][0]} to ${limits[key][1]}` : '');
  return (
    <form className="card" onSubmit={save} noValidate>
      <h2>Pomodoro timer</h2>
      {locked && <p className="notice" role="status">Timer lengths are locked while a session is running. Finish or give up first.</p>}
      {TIMING.map(([key, label, limitKey]) => (
        <Field key={key} label={label} hint={range(limitKey) && `Allowed: ${range(limitKey)}`} error={fields[key]}>
          {(p) => <input {...p} type="number" inputMode="numeric" disabled={locked} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />}
        </Field>
      ))}
      <FormError>{error}</FormError>
      {msg && <p className="success" role="status">{msg}</p>}
      <button className="btn" disabled={locked}>Save timer</button>
    </form>
  );
}

function AlertSettings() {
  const { settings, saveSettings } = useAuth();
  const [msg, setMsg] = useState('');
  const supported = notificationsSupported();
  const permission = supported ? Notification.permission : 'unsupported';

  const enable = async () => {
    setMsg('');
    const result = await askNotificationPermission();
    if (result === 'granted') { await saveSettings({ notificationsEnabled: true }); setMsg('Notifications are on.'); }
    else if (result === 'denied') setMsg('Notifications are blocked for this site. Allow them in your browser’s site settings. In-app alerts still work.');
    else setMsg('Notifications were not enabled.');
  };

  return (
    <div className="card">
      <h2>Alerts</h2>
      <label className="check">
        <input type="checkbox" checked={settings.soundEnabled} onChange={(e) => saveSettings({ soundEnabled: e.target.checked })} />
        Play a soft sound when a session ends
      </label>
      <div className="stack stack--tight">
        <strong>Browser notifications</strong>
        {!supported && <p className="muted small">This browser does not support notifications. In-app alerts still work.</p>}
        {supported && permission === 'denied' && <p className="muted small">Blocked for this site. Allow them in your browser’s site settings. In-app alerts still work.</p>}
        {supported && permission !== 'denied' && (settings.notificationsEnabled && permission === 'granted'
          ? <button className="btn btn--ghost btn--small" onClick={() => saveSettings({ notificationsEnabled: false })}>Turn off notifications</button>
          : <button className="btn btn--small" onClick={enable}>Enable notifications</button>)}
        <p className="muted small">Notifications only work while Rootine is open in a tab or window.</p>
        {msg && <p role="status" className="small">{msg}</p>}
      </div>
    </div>
  );
}

function LookSettings() {
  const { settings, limits, saveSettings, sessionEnded } = useAuth();
  const [goal, setGoal] = useState(String(settings.dailyGoal));
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const saveGoal = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try { await saveSettings({ dailyGoal: Number(goal) }); setMsg('Saved.'); }
    catch (err) { if (err.status === 401) sessionEnded(); setError(err.fields?.dailyGoal || err.message); }
  };
  const [lo, hi] = limits?.dailyGoal ?? [1, 12];
  return (
    <div className="card">
      <h2>Goal and look</h2>
      <form onSubmit={saveGoal} noValidate>
        <Field label="Daily goal (focus sessions per day)" hint={`Allowed: ${lo} to ${hi}`} error={error}>
          {(p) => <input {...p} type="number" inputMode="numeric" value={goal} onChange={(e) => setGoal(e.target.value)} />}
        </Field>
        {msg && <p className="success" role="status">{msg}</p>}
        <button className="btn btn--small">Save goal</button>
      </form>
      <fieldset className="seg">
        <legend>Theme</legend>
        {['light', 'dark'].map((th) => (
          <label key={th} className={settings.theme === th ? 'is-selected' : ''}>
            <input type="radio" name="theme" checked={settings.theme === th} onChange={() => saveSettings({ theme: th })} />
            {th === 'light' ? 'Light' : 'Dark'}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function InstallCard() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(window.matchMedia?.('(display-mode: standalone)').matches);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  if (installed) return null;
  if (!prompt && !ios) return null;
  return (
    <div className="card">
      <h2>Install Rootine</h2>
      {prompt && <>
        <p className="muted">Add Rootine to your device. It opens in its own window, like an app.</p>
        <button className="btn" onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null); }}>Install Rootine</button>
      </>}
      {!prompt && ios && <p className="muted">On iPhone or iPad: tap the Share button, then <strong>Add to Home Screen</strong>.</p>}
    </div>
  );
}

function AccountSettings() {
  const { user, updateUser, logout, sessionEnded } = useAuth();
  const [name, setName] = useState(user.displayName);
  const [nameErr, setNameErr] = useState('');
  const [nameMsg, setNameMsg] = useState('');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwFields, setPwFields] = useState({});
  const [pwMsg, setPwMsg] = useState('');
  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState('');
  const [delErr, setDelErr] = useState('');
  const [busy, setBusy] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    setNameErr(''); setNameMsg('');
    try { const d = await api.patch('/auth/profile', { displayName: name }); updateUser(d.user); setNameMsg('Saved.'); }
    catch (err) { if (err.status === 401) sessionEnded(); setNameErr(err.fields?.displayName || err.message); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    setPwFields({}); setPwMsg('');
    try { await api.post('/auth/change-password', pw); setPw({ currentPassword: '', newPassword: '' }); setPwMsg('Password changed. Other devices were signed out.'); }
    catch (err) { if (err.status === 401) sessionEnded(); setPwFields(err.fields || { _form: err.message }); }
  };

  const deleteAccount = async () => {
    setDelErr(''); setBusy(true);
    try { await api.del('/auth/account', { password: delPw }); await logout(); }
    catch (err) { setDelErr(err.fields?.password || err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="card stack">
      <h2>Account</h2>
      <p className="muted small">Signed in as {user.email}</p>

      <form onSubmit={saveName} noValidate>
        <Field label="Display name" error={nameErr}>
          {(p) => <input {...p} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        {nameMsg && <p className="success" role="status">{nameMsg}</p>}
        <button className="btn btn--small">Save name</button>
      </form>

      <form onSubmit={changePw} noValidate>
        <h3>Change password</h3>
        <Field label="Current password" error={pwFields.currentPassword}>
          {(p) => <input {...p} type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />}
        </Field>
        <Field label="New password" hint="At least 8 characters." error={pwFields.newPassword}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />}
        </Field>
        <FormError>{pwFields._form}</FormError>
        {pwMsg && <p className="success" role="status">{pwMsg}</p>}
        <button className="btn btn--small">Change password</button>
      </form>

      <div className="row">
        <button className="btn btn--ghost" onClick={logout}>Log out</button>
        <button className="btn btn--ghost btn--danger-text" onClick={() => { setDelPw(''); setDelErr(''); setDelOpen(true); }}>Delete account</button>
      </div>

      <ConfirmDialog open={delOpen} danger title="Delete your account?" confirmLabel="Delete everything" busy={busy}
        onCancel={() => setDelOpen(false)} onConfirm={deleteAccount}>
        <p>This permanently deletes your account, tasks, plants, and settings. It cannot be undone.</p>
        <Field label="Enter your password to confirm" error={delErr}>
          {(p) => <input {...p} type="password" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} />}
        </Field>
      </ConfirmDialog>
    </div>
  );
}
