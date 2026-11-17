import { useState } from 'react';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';

// A plant's name with a small pencil to change it. Without a name it shows the kind of plant.
export default function PlantName({ plant, typeName, onSaved }) {
  const { sessionEnded } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const shown = plant.name || typeName;

  const start = () => { setValue(plant.name || ''); setError(''); setEditing(true); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api.patch(`/garden/plants/${plant.id}`, { name: value.trim() || null });
      setEditing(false);
      await onSaved?.();
    } catch (err) {
      if (err.status === 401) sessionEnded();
      else setError(err.fields?.name || err.message);
    } finally { setBusy(false); }
  };

  if (editing) {
    return (
      <form className="plant-name plant-name--edit" onSubmit={save} noValidate>
        <label className="visually-hidden" htmlFor={`pn-${plant.id}`}>Name for this {typeName.toLowerCase()}</label>
        <input id={`pn-${plant.id}`} value={value} maxLength={30} placeholder={typeName} autoFocus autoComplete="off" onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditing(false); } }} />
        <span className="row row--center">
          <button className="btn btn--small" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          <button type="button" className="btn btn--small btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
        </span>
        {error && <span className="error" role="alert">{error}</span>}
      </form>
    );
  }
  return (
    <span className="plant-name">
      <span className="plant-name__row">
        <strong>{shown}</strong>
        <button type="button" className="icon-btn icon-btn--tiny" onClick={start} aria-label={`Rename ${shown}`} title="Rename">{'\u270F\uFE0F'}</button>
      </span>
      {plant.name && <span className="small muted">{typeName}</span>}
    </span>
  );
}
