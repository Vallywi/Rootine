import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import Plant, { PLANTS } from '../components/Plant.jsx';
import Badges from '../components/Badges.jsx';
import { FormError, GoalRing, formatDate } from '../components/ui.jsx';

const hoursMinutes = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`);

export default function GardenPage() {
  const { settings, sessionEnded } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState([]); // ids collected during this visit, for the little hop animation

  const load = useCallback(() =>
    api.get(`/garden?tzOffset=${new Date().getTimezoneOffset()}`)
      .then(setData)
      .catch((err) => { if (err.status === 401) sessionEnded(); setError(err.message); }), [sessionEnded]);
  useEffect(() => { load(); }, [load]);

  const collect = async (ids) => {
    setBusy(true); setError('');
    try {
      if (ids.length === 1) await api.post(`/sessions/${ids[0]}/collect`);
      else await api.post('/sessions/collect-all');
      setFresh((f) => [...f, ...ids]);
      await load();
    } catch (err) { if (err.status === 401) sessionEnded(); setError(err.message); }
    finally { setBusy(false); }
  };
  if (error) return <FormError>{error}</FormError>;
  if (!data) return <p role="status">Loading…</p>;
  const { stats, plants, pending, withered, badges } = data;

  return (
    <section className="stack">
      <h1>Your garden</h1>
      {pending.length > 0 && (
        <div className="card collect-panel">
          <div className="row row--wrap collect-panel__head">
            <h2>🧺 Ready to collect ({pending.length})</h2>
            <button className="btn btn--small" disabled={busy} onClick={() => collect(pending.map((p) => p.id))}>Collect all</button>
          </div>
          <ul className="grid">
            {pending.map((p) => (
              <li key={p.id} className="plant-card plant-card--pending">
                <Plant type={p.plantType} stage="full" size={96} />
                <strong>{PLANTS[p.plantType].name}</strong>
                <span className="small muted">{formatDate(p.endedAt)} · {p.minutes} min</span>
                <button className="btn btn--small" disabled={busy} onClick={() => collect([p.id])}>Collect</button>
              </li>
            ))}
          </ul>
        </div>
      )}      <div className="tiles">
        <Tile label="Today" value={hoursMinutes(stats.todayMinutes)} />
        <Tile label="This week" value={hoursMinutes(stats.weekMinutes)} />
        <Tile label="This month" value={hoursMinutes(stats.monthMinutes)} />
        <Tile label="Streak" value={`${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`} note={`Best: ${stats.longestStreak}`} />
      </div>

      <div className="card row row--center">
        <GoalRing done={stats.todaySessions} goal={settings.dailyGoal} />
        <p className="muted">
          {stats.todaySessions >= settings.dailyGoal ? 'Daily goal reached. Lovely work!' : `${settings.dailyGoal - stats.todaySessions} more to reach today’s goal.`}
        </p>
      </div>

      <Badges badges={badges} />

      <div className="row row--between row--wrap">
        <h2>Plants ({stats.totalPlants})</h2>
        {stats.totalPlants > 0 && <Link to="/yard" className="btn btn--small">🏡 Decorate your yard</Link>}
      </div>
      {plants.length === 0 ? (
        <div className="card center">
          <Plant type="sunflower" stage="seed" size={120} title="" />
          <p>{pending.length ? 'Collect your plants above to fill your garden.' : 'Your garden is empty. Finish a focus session to grow your first plant.'}</p>
        </div>
      ) : (
        <ul className="grid">
          {plants.map((p, idx) => (
            <li key={p.id} style={{ '--i': idx }} className={`card plant-card ${fresh.includes(p.id) ? 'just-collected' : ''}`}>
              <Plant type={p.plantType} stage="full" size={110} />
              <strong>{PLANTS[p.plantType].name}</strong>
              <span className="small muted">{formatDate(p.endedAt)} · {p.minutes} min</span>
              {p.taskTitle && <span className="small plant-card__task">{p.taskTitle}</span>}
            </li>
          ))}
        </ul>
      )}

      {withered.length > 0 && (
        <details className="card">
          <summary>Withered plants ({withered.length})</summary>
          <p className="muted small">These do not count toward your stats.</p>
          <ul className="grid">
            {withered.map((p) => (
              <li key={p.id} className="plant-card">
                <Plant type={p.plantType} stage="withered" size={90} />
                <span className="small muted">{formatDate(p.endedAt)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Tile({ label, value, note }) {
  return (
    <div className="card tile">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
      {note && <span className="small muted">{note}</span>}
    </div>
  );
}
