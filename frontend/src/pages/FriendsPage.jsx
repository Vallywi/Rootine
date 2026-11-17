import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { ConfirmDialog, Field, FormError } from '../components/ui.jsx';

const tell = () => window.dispatchEvent(new Event('rootine:friends')); // refreshes the badge in the top bar

const hoursText = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

export default function FriendsPage() {
  const { sessionEnded, saveSettings } = useAuth();
  const [data, setData] = useState(null);
  const [board, setBoard] = useState(null);
  const [period, setPeriod] = useState('week');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handle = useCallback((err) => {
    if (err.status === 401) sessionEnded();
    else setError(err.message);
  }, [sessionEnded]);

  const loadAll = useCallback(async () => {
    try {
      const [d, b] = await Promise.all([
        api.get('/friends'),
        api.get(`/friends/leaderboard?period=${period}&tzOffset=${new Date().getTimezoneOffset()}`),
      ]);
      setData(d); setBoard(b); setError('');
      tell();
    } catch (err) { handle(err); }
  }, [period, handle]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const act = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); await loadAll(); }
    catch (err) { handle(err); }
    finally { setBusy(false); }
  };

  if (!data && !error) return <p role="status" className="muted">Loading your friends...</p>;
  if (!data) return <div className="card stack"><FormError>{error}</FormError><button className="btn" onClick={loadAll}>Try again</button></div>;

  return (
    <section className="stack friends">
      <h1>Friends</h1>
      <FormError>{error}</FormError>

      <div className="friends__top">
        <CodeCard code={data.code} />
        <AddFriend onDone={loadAll} />
      </div>

      {data.incoming.length > 0 && (
        <div className="card stack stack--tight" aria-labelledby="req-in">
          <h2 id="req-in">Friend requests</h2>
          <ul className="people">
            {data.incoming.map((r) => (
              <li key={r.requestId} className="person">
                <Avatar name={r.user.displayName} url={r.user.avatarUrl} size={44} />
                <span className="person__name">{r.user.displayName}<span className="muted small"> wants to be your friend</span></span>
                <span className="row">
                  <button className="btn btn--small" disabled={busy} onClick={() => act(() => api.post(`/friends/requests/${r.requestId}/accept`))}>Accept</button>
                  <button className="btn btn--ghost btn--small" disabled={busy} onClick={() => act(() => api.post(`/friends/requests/${r.requestId}/decline`))}>Decline</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card stack stack--tight">
        <div className="row row--between">
          <h2>Leaderboard</h2>
          <fieldset className="seg seg--tight">
            <legend className="visually-hidden">Period</legend>
            {[['week', 'This week'], ['all', 'All time']].map(([k, label]) => (
              <label key={k} className={period === k ? 'is-selected' : ''}>
                <input type="radio" name="period" checked={period === k} onChange={() => setPeriod(k)} />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
        <p className="muted small">Score = minutes of focus you finished. Only friends who share their progress are listed.</p>
        <Board board={board} />
      </div>

      <div className="card stack stack--tight">
        <h2>Your friends{data.friends.length ? ` (${data.friends.length})` : ''}</h2>
        {data.friends.length === 0 && <p className="muted">No friends yet. Share your code, or type a friend's code above.</p>}
        <FriendList friends={data.friends} onRemove={(id) => act(() => api.del(`/friends/${id}`))} busy={busy} />
        {data.outgoing.length > 0 && (
          <>
            <h3>Waiting for an answer</h3>
            <ul className="people">
              {data.outgoing.map((r) => (
                <li key={r.requestId} className="person">
                  <Avatar name={r.user.displayName} url={r.user.avatarUrl} size={44} />
                  <span className="person__name">{r.user.displayName}</span>
                  <button className="btn btn--ghost btn--small" disabled={busy} onClick={() => act(() => api.del(`/friends/requests/${r.requestId}`))}>Cancel</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="card stack stack--tight">
        <h2>Privacy</h2>
        <label className="check">
          <input type="checkbox" checked={data.shareProgress} disabled={busy}
            onChange={(e) => act(() => saveSettings({ shareProgress: e.target.checked }))} />
          Show my score to my friends on the leaderboard
        </label>
        <p className="muted small">Friends only ever see your nickname, your photo, and your score. Never your email or personal details.</p>
      </div>
    </section>
  );
}

function CodeCard({ code }) {
  const [msg, setMsg] = useState('');
  const text = `Add me on Rootine! My friend code is ${code}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setMsg('Copied!'); }
    catch { setMsg('Could not copy. Select the code and copy it by hand.'); }
  };
  const share = async () => {
    try { await navigator.share({ title: 'Rootine', text }); }
    catch (err) { if (err?.name !== 'AbortError') copy(); }
  };
  return (
    <div className="card stack stack--tight code-card">
      <h2>Your friend code</h2>
      <p className="code-card__code" aria-label={`Your friend code is ${code.replace('-', ' dash ')}`}>{code}</p>
      <div className="row">
        <button type="button" className="btn btn--small" onClick={copy}>Copy code</button>
        {typeof navigator !== 'undefined' && navigator.share && <button type="button" className="btn btn--ghost btn--small" onClick={share}>Share</button>}
      </div>
      <p className="muted small" role="status">{msg || 'Give this code to a friend so they can add you.'}</p>
    </div>
  );
}

function AddFriend({ onDone }) {
  const { sessionEnded } = useAuth();
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setFieldError(''); setMsg(''); setBusy(true);
    try {
      const r = await api.post('/friends/requests', { code });
      setMsg(r.status === 'accepted' ? `You and ${r.user.displayName} are now friends!` : `Request sent to ${r.user.displayName}. They need to accept it.`);
      setCode('');
      await onDone();
    } catch (err) {
      if (err.status === 401) sessionEnded();
      else setFieldError(err.fields?.code || err.message);
    } finally { setBusy(false); }
  };

  return (
    <form className="card stack stack--tight" onSubmit={submit} noValidate>
      <h2>Add a friend</h2>
      <Field label="Their friend code" hint="Like K7M2-9QXA" error={fieldError}>
        {(p) => <input {...p} value={code} maxLength={20} autoCapitalize="characters" autoComplete="off" spellCheck="false" onChange={(e) => setCode(e.target.value)} />}
      </Field>
      {msg && <p className="success" role="status">{msg}</p>}
      <button className="btn btn--small" disabled={busy || !code.trim()}>{busy ? 'Sending...' : 'Send request'}</button>
    </form>
  );
}

function Board({ board }) {
  if (!board) return <p className="muted" role="status">Loading...</p>;
  const top = Math.max(1, ...board.rows.map((r) => r.minutes));
  const onlyMe = board.rows.length === 1;
  return (
    <>
      <ol className="board">
        {board.rows.map((r) => (
          <li key={r.id} className={`board__row ${r.isMe ? 'is-me' : ''}`}>
            <span className="board__rank" aria-label={`Rank ${r.rank}`}>{r.rank === 1 && r.minutes > 0 ? '\uD83D\uDC51' : r.rank}</span>
            <Avatar name={r.displayName} url={r.avatarUrl} size={40} />
            <span className="board__main">
              <span className="board__name">{r.displayName}{r.isMe && <span className="muted small"> (you)</span>}</span>
              <span className="board__bar" aria-hidden="true"><span style={{ width: `${Math.round((r.minutes / top) * 100)}%` }} /></span>
            </span>
            <span className="board__score"><strong>{hoursText(r.minutes)}</strong><span className="muted small">{r.plants} {r.plants === 1 ? 'plant' : 'plants'}</span></span>
          </li>
        ))}
      </ol>
      {onlyMe && <p className="muted">Add a friend to start a friendly race.</p>}
      {board.hidden > 0 && <p className="muted small">{board.hidden} {board.hidden === 1 ? 'friend is' : 'friends are'} not sharing their score.</p>}
    </>
  );
}

function FriendList({ friends, onRemove, busy }) {
  const [target, setTarget] = useState(null);
  useEffect(() => { if (!friends.some((f) => f.id === target?.id)) setTarget(null); }, [friends, target]);
  if (!friends.length) return null;
  return (
    <>
      <ul className="people">
        {friends.map((f) => (
          <li key={f.id} className="person">
            <Avatar name={f.displayName} url={f.avatarUrl} size={44} />
            <span className="person__name">{f.displayName}{!f.sharing && <span className="muted small"> (score hidden)</span>}</span>
            <button type="button" className="btn btn--ghost btn--small btn--danger-text" onClick={() => setTarget(f)}>Remove</button>
          </li>
        ))}
      </ul>
      <ConfirmDialog open={!!target} danger title={`Remove ${target?.displayName ?? 'friend'}?`} confirmLabel="Remove" busy={busy}
        onCancel={() => setTarget(null)} onConfirm={() => { const id = target.id; setTarget(null); onRemove(id); }}>
        <p>You will stop seeing each other on the leaderboard. You can add each other again later.</p>
      </ConfirmDialog>
    </>
  );
}
