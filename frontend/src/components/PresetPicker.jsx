import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { presetFor, presetList } from '../lib/presets.js';

// Choose a focus rhythm. Picking one saves it to the account, so it is used for the timer and for the breaks.
export default function PresetPicker() {
  const { settings, limits, saveSettings, sessionEnded, demo } = useAuth();
  const PRESETS = presetList(demo);
  const saved = presetFor(settings, demo);
  const [mode, setMode] = useState(saved);
  const [custom, setCustom] = useState({ focus: String(settings.focusMinutes), rest: String(settings.shortBreakMinutes) });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Follow the saved settings (for example after they change in Settings).
  useEffect(() => { setMode(presetFor(settings, demo)); }, [settings.focusMinutes, settings.shortBreakMinutes, demo]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusRange = limits?.focus ?? [15, 90];
  const restRange = limits?.shortBreak ?? [3, 20];

  const save = async (focusMinutes, shortBreakMinutes) => {
    setError(''); setSaving(true);
    try { await saveSettings({ focusMinutes, shortBreakMinutes }); }
    catch (err) {
      if (err.status === 401) sessionEnded();
      setError(err.message);
      setMode(saved);
    } finally { setSaving(false); }
  };

  const choose = (p) => { setMode(p.id); save(p.focus, p.rest); };

  const applyCustom = (e) => {
    e.preventDefault();
    const f = Number(custom.focus), r = Number(custom.rest);
    if (!Number.isInteger(f) || f < focusRange[0] || f > focusRange[1]) { setError(`Focus must be a whole number from ${focusRange[0]} to ${focusRange[1]} minutes.`); return; }
    if (!Number.isInteger(r) || r < restRange[0] || r > restRange[1]) { setError(`Break must be a whole number from ${restRange[0]} to ${restRange[1]} minutes.`); return; }
    save(f, r);
  };

  const active = PRESETS.find((p) => p.id === mode);

  return (
    <fieldset className="presets" data-tour="presets" aria-busy={saving}>
      <legend>How long do you want to focus?</legend>
      <div className="presets__grid">
        {PRESETS.map((p) => (
          <label key={p.id} className={`preset ${mode === p.id ? 'is-selected' : ''}`}>
            <input type="radio" name="preset" value={p.id} checked={mode === p.id} onChange={() => choose(p)} />
            <span className="preset__emoji" aria-hidden="true">{p.emoji}</span>
            <strong className="preset__time">{p.focus}<span aria-hidden="true"> / </span><span className="visually-hidden"> minutes focus, </span>{p.rest}<span className="visually-hidden"> minutes break</span></strong>
            <span className="preset__name">{p.name}</span>
            {p.tag && <span className="preset__tag">{p.tag}</span>}
          </label>
        ))}
        <label className={`preset ${mode === 'custom' ? 'is-selected' : ''}`}>
          <input type="radio" name="preset" value="custom" checked={mode === 'custom'} onChange={() => setMode('custom')} />
          <span className="preset__emoji" aria-hidden="true">✏️</span>
          <strong className="preset__time">Custom</strong>
          <span className="preset__name">Your own</span>
        </label>
      </div>

      <p className="preset__best" key={mode} aria-live="polite">
        {active
          ? <><strong>{active.emoji} {active.name}:</strong> {active.focus} minute{active.focus === 1 ? '' : 's'} of work, then a {active.rest} minute break. Best for {active.best}.</>
          : <><strong>✏️ Custom:</strong> choose your own lengths.</>}
      </p>

      {mode === 'custom' && (
        <form className="preset__custom" onSubmit={applyCustom} noValidate>
          <label>Focus (minutes)
            <input type="number" inputMode="numeric" min={focusRange[0]} max={focusRange[1]} value={custom.focus} onChange={(e) => setCustom({ ...custom, focus: e.target.value })} />
          </label>
          <label>Break (minutes)
            <input type="number" inputMode="numeric" min={restRange[0]} max={restRange[1]} value={custom.rest} onChange={(e) => setCustom({ ...custom, rest: e.target.value })} />
          </label>
          <button className="btn btn--small" disabled={saving}>Use these</button>
        </form>
      )}
      {error && <p className="error" role="alert"><span aria-hidden="true">⚠ </span>{error}</p>}
    </fieldset>
  );
}
