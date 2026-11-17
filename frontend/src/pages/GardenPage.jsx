import { useEffect, useState } from 'react';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import Plant, { PLANTS } from '../components/Plant.jsx';
import { FormError, GoalRing, formatDate } from '../components/ui.jsx';

const hoursMinutes = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`);

export default function GardenPage() {
  const { settings, sessionEnded } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/garden?tzOffset=${new Date().getTimezoneOffset()}`)
      .then(setData)
      .catch((err) => { if (err.status === 401) sessionEnded(); setError(err.message); });
  }, [sessionEnded]);

  if (error) return <FormError>{error}</FormError>;
  if (!data) return <p role="status">Loading…</p>;
  const { stats, plants, withered, badges } = data;

  return (
    <section className="stack">
      <h1>Your garden</h1>
      <div className="tiles">
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

      <h2>Badges</h2>
      <ul className="badges">
        {badges.map((b) => (
          <li key={b.id} className={`badge ${b.earned ? 'is-earned' : ''}`}>
            <span className="badge__icon" aria-hidden="true">{b.earned ? '🏅' : '🔒'}</span>
            <strong>{b.name}</strong>
            <span className="small">{b.earned ? 'Earned' : `${b.progress} of ${b.target}`}</span>
          </li>
        ))}
      </ul>

      <h2>Plants ({stats.totalPlants})</h2>
      {plants.length === 0 ? (
        <div className="card center">
          <Plant type="sunflower" stage="seed" size={120} title="" />
          <p>Your garden is empty. Finish a focus session to grow your first plant.</p>
        </div>
      ) : (
        <ul className="grid">
          {plants.map((p) => (
            <li key={p.id} className="card plant-card">
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
