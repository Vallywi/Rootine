import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import Plant, { PLANTS } from '../components/Plant.jsx';
import { FormError, formatDate } from '../components/ui.jsx';
import { YARD_LIMIT } from '../../../shared/plants.js';
import { DecorArt, FenceArt, HouseArt } from '../components/YardArt.jsx';
import YardPets from '../components/YardPets.jsx';

// Big decorations get a bigger spot, like trees do.
const BIG_DECOR = new Set(['pond', 'bench', 'swing', 'windmill', 'greenhouse', 'fountain', 'picnic', 'haystack', 'well']);

// Plants stand on the grass only (below the fence). Positions are percentages of the yard.
const X_RANGE = [5, 95];
const Y_RANGE = [36, 97];
const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const round1 = (v) => Math.round(v * 10) / 10;

// A random spot on the grass that is not right on top of another plant.
function freeSpot(taken) {
  for (let i = 0; i < 30; i += 1) {
    const x = 8 + Math.random() * 84;
    const y = 48 + Math.random() * 46;
    if (taken.every((o) => Math.hypot((o.x - x) * 1.25, o.y - y) > 11)) return { x: round1(x), y: round1(y) };
  }
  return { x: round1(10 + Math.random() * 80), y: round1(50 + Math.random() * 44) };
}

// A tidy grid for "Place all".
const gridSpot = (i) => ({ x: round1(12 + (i % 6) * 15.5 + (Math.floor(i / 6) % 2) * 7), y: round1(50 + (Math.floor(i / 6) % 6) * 9) });

export default function YardPage() {
  const { sessionEnded } = useAuth();
  const [data, setData] = useState(null); // { plants, pending }
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [local, setLocal] = useState({}); // positions while dragging or using the keyboard
  const [dropped, setDropped] = useState([]); // ids just placed, for the drop animation
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const yardRef = useRef(null);
  const drag = useRef(null);
  const localRef = useRef({});
  const timers = useRef({});
  localRef.current = local;

  const fail = useCallback((err) => {
    if (err.status === 401) sessionEnded();
    setError(err.message);
  }, [sessionEnded]);

  const load = useCallback(async () => {
    try {
      const [g, shop] = await Promise.all([api.get(`/garden?tzOffset=${new Date().getTimezoneOffset()}`), api.get('/shop')]);
      setData({ plants: g.plants, pending: g.pending.length, shop });
    } catch (err) { fail(err); }
  }, [fail]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const posOf = (p) => local[p.id] ?? (p.x != null ? { x: p.x, y: p.y } : null);
  const nameOf = (p) => (p.decor ? p.label : (p.name || PLANTS[p.plantType].name));
  // Decorations bought in the shop behave like plants: place, drag, put back.
  const decor = (data?.shop?.items ?? []).filter((i) => i.category === 'decor' && i.owned)
    .map((i) => ({ id: `d:${i.id}`, decor: true, itemId: i.id, label: i.name, x: i.x, y: i.y }));
  const everything = [...(data?.plants ?? []), ...decor];
  const pets = (data?.shop?.items ?? []).filter((i) => i.category === 'pet' && i.owned);

  const applyServer = (plant) => {
    if (typeof plant.id === 'string') {
      setData((d) => ({ ...d, shop: { ...d.shop, items: d.shop.items.map((i) => (`d:${i.id}` === plant.id ? { ...i, x: plant.x, y: plant.y } : i)) } }));
    } else {
      setData((d) => ({ ...d, plants: d.plants.map((p) => (p.id === plant.id ? { ...p, x: plant.x, y: plant.y } : p)) }));
    }
    setLocal((l) => { const { [plant.id]: _gone, ...rest } = l; return rest; });
  };

  const save = useCallback(async (id, pos) => {
    setError('');
    try {
      if (typeof id === 'string') { const r = await api.put(`/shop/items/${id.slice(2)}/position`, pos); applyServer({ id, x: r.item.x, y: r.item.y }); }
      else applyServer((await api.put(`/garden/plants/${id}/position`, pos)).plant);
    }
    catch (err) { fail(err); setLocal({}); await load(); }
  }, [fail, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const takeBack = useCallback(async (id) => {
    setError('');
    clearTimeout(timers.current[id]);
    try {
      if (typeof id === 'string') { await api.del(`/shop/items/${id.slice(2)}/position`); applyServer({ id, x: null, y: null }); }
      else applyServer((await api.del(`/garden/plants/${id}/position`)).plant);
      setSelected((s) => (s === id ? null : s));
    } catch (err) { fail(err); await load(); }
  }, [fail, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const placed = everything.filter((p) => posOf(p));
  const tray = [...everything].sort((a, b) => Number(!!posOf(a)) - Number(!!posOf(b)));

  const place = async (p) => {
    const pos = freeSpot(placed.map(posOf));
    setLocal((l) => ({ ...l, [p.id]: pos }));
    setDropped((d) => [...d, p.id]);
    setSelected(p.id);
    setAnnounce(`${nameOf(p)} placed in your yard.`);
    await save(p.id, pos);
  };

  const placeAll = async () => {
    const room = Math.max(0, YARD_LIMIT - placed.length);
    const waiting = tray.filter((p) => !posOf(p)).slice(0, room);
    if (!waiting.length) return;
    setBusy(true);
    const spots = Object.fromEntries(waiting.map((p, i) => [p.id, gridSpot(placed.length + i)]));
    setLocal((l) => ({ ...l, ...spots }));
    setDropped((d) => [...d, ...waiting.map((p) => p.id)]);
    await Promise.all(waiting.map((p) => save(p.id, spots[p.id])));
    setAnnounce(`${waiting.length} plants placed in your yard.`);
    setBusy(false);
  };

  const clearAll = async () => {
    setBusy(true);
    await Promise.all(placed.map((p) => takeBack(p.id)));
    setAnnounce('All plants are back in the tray.');
    setBusy(false);
  };

  // ----- dragging (mouse, pen, or finger)
  const pointToPercent = (e, d) => {
    const rect = yardRef.current.getBoundingClientRect();
    return {
      x: round1(clamp(((e.clientX - d.dx - rect.left) / rect.width) * 100, X_RANGE)),
      y: round1(clamp(((e.clientY - d.dy - rect.top) / rect.height) * 100, Y_RANGE)),
    };
  };
  const onPointerDown = (e, p) => {
    if (e.button !== undefined && e.button !== 0) return;
    const rect = yardRef.current.getBoundingClientRect();
    const cur = posOf(p);
    drag.current = {
      id: p.id, moved: false,
      dx: e.clientX - (rect.left + (cur.x / 100) * rect.width),
      dy: e.clientY - (rect.top + (cur.y / 100) * rect.height),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelected(p.id);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    d.moved = true;
    const pos = pointToPercent(e, d);
    localRef.current = { ...localRef.current, [d.id]: pos };
    setLocal(localRef.current);
  };
  const onPointerUp = (p) => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved && localRef.current[p.id]) save(p.id, localRef.current[p.id]);
  };

  // ----- keyboard: arrows move, Delete puts the plant back
  const onKeyDown = (e, p) => {
    const step = e.shiftKey ? 6 : 2;
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (move) {
      e.preventDefault();
      const cur = posOf(p);
      const pos = { x: round1(clamp(cur.x + move[0], X_RANGE)), y: round1(clamp(cur.y + move[1], Y_RANGE)) };
      setLocal((l) => ({ ...l, [p.id]: pos }));
      clearTimeout(timers.current[p.id]);
      timers.current[p.id] = setTimeout(() => save(p.id, pos), 400);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      takeBack(p.id);
      setAnnounce(`${nameOf(p)} is back in the tray.`);
    } else if (e.key === 'Escape') {
      setSelected(null);
    }
  };

  if (error && !data) return <FormError>{error}</FormError>;
  if (!data) return <p role="status">Loading…</p>;
  const selectedPlant = everything.find((p) => p.id === selected && posOf(p));

  return (
    <section className="stack">
      <div className="row row--between row--wrap">
        <h1>Your yard</h1>
        <p className="muted small">{placed.length} of {everything.length} things outside</p>
      </div>
      <div className="card yard__shopbar">
        <span className="coin-pill" title="Your coins"><span aria-hidden="true">{'\uD83E\uDE99'}</span> <strong>{data.shop.coins.balance}</strong> coins</span>
        <span className="muted small grow">{pets.length ? `${pets.length} ${pets.length === 1 ? 'pet lives' : 'pets live'} in your yard. Tap one to say hello. ` : ''}Earn more coins by finishing focus sessions. Longer sessions pay more.</span>
        <Link to="/shop" className="btn btn--small">Open the shop</Link>
      </div>
      <p className="muted">Put your collected plants outside and arrange them however you like. Drag a plant to move it, or select it and use the arrow keys.</p>
      <p className="visually-hidden" role="status" aria-live="polite">{announce}</p>

      <div className="yard" ref={yardRef} role="group" aria-label="Your yard" onPointerDown={(e) => { if (!e.target.closest('.yard__plant')) setSelected(null); }}>
        <div className="yard__scene" aria-hidden="true">
          <div className="yard__sun" />
          <span className="yard__cloud yard__cloud--1" /><span className="yard__cloud yard__cloud--2" />
          <div className="yard__stars">{Array.from({ length: 12 }).map((_, i) => <i key={i} style={{ '--x': `${(i * 41 + 9) % 100}%`, '--y': `${(i * 17 + 5) % 26}%`, '--d': `${2 + (i % 4)}s` }} />)}</div>
          <div className="yard__hills" />
          <HouseArt id={data.shop.house} className="yard__house" />
          {data.shop.fence && <FenceArt id={data.shop.fence} />}
          <div className="yard__grass" />
          <svg className="yard__stones" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[[50, 40, 7], [46, 50, 7.4], [52, 60, 8], [58, 70, 8.6], [62, 81, 9.2], [60, 92, 9.8]].map(([cx, cy, rx], i) => (
              <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={rx * 0.34} fill="#efe3c8" stroke="#d9c9a4" strokeWidth=".5" />
            ))}
          </svg>
          <span className="yard__butterfly">🦋</span>
          <div className="yard__fireflies">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ '--x': `${15 + i * 18}%`, '--y': `${55 + (i % 3) * 14}%`, '--d': `${3 + i}s` }} />)}</div>
        </div>

        {placed.map((p) => {
          const pos = posOf(p);
          const tree = p.decor ? BIG_DECOR.has(p.itemId) : PLANTS[p.plantType].kind === 'tree';
          const isSel = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`yard__plant ${tree ? 'yard__plant--tree' : ''} ${isSel ? 'is-selected' : ''} ${dropped.includes(p.id) ? 'just-placed' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: Math.round(pos.y * 10) + (isSel ? 5000 : 0) }}
              aria-label={`${nameOf(p)} in your yard. Use the arrow keys to move it. Press Delete to put it back in the tray.`}
              onPointerDown={(e) => onPointerDown(e, p)}
              onPointerMove={onPointerMove}
              onPointerUp={() => onPointerUp(p)}
              onPointerCancel={() => onPointerUp(p)}
              onKeyDown={(e) => onKeyDown(e, p)}
              onFocus={() => setSelected(p.id)}
            >
              {p.decor ? <DecorArt id={p.itemId} /> : <Plant type={p.plantType} stage="full" size={100} ground title="" />}
              {isSel && <span className="yard__label">{nameOf(p)}</span>}
            </button>
          );
        })}
        <YardPets pets={pets} />
        {placed.length === 0 && <p className="yard__empty">{everything.length ? 'Your yard is empty. Place a plant from the tray below.' : 'Collect a plant to start decorating your yard.'}</p>}
      </div>

      <FormError>{error}</FormError>

      {selectedPlant && (
        <div className="card yard__bar" role="status">
          <span><strong>{nameOf(selectedPlant)}</strong> is selected.</span>
          <button type="button" className="btn btn--small btn--ghost" onClick={() => { takeBack(selectedPlant.id); setAnnounce(`${nameOf(selectedPlant)} is back in the tray.`); }}>Put back in tray</button>
          <button type="button" className="btn btn--small" onClick={() => setSelected(null)}>Done</button>
        </div>
      )}

      {data.pending > 0 && (
        <div className="card collect-banner">
          <span className="collect-banner__icon" aria-hidden="true">🧺</span>
          <div className="grow"><strong>{data.pending === 1 ? '1 plant is' : `${data.pending} plants are`} waiting to be collected.</strong><p className="muted small">Collect them in your Garden, then they can come outside.</p></div>
          <Link to="/garden" className="btn btn--small">Open garden</Link>
        </div>
      )}

      <div className="row row--between row--wrap">
        <h2>Your plants and decorations ({everything.length})</h2>
        <div className="row">
          <button type="button" className="btn btn--small" disabled={busy || placed.length >= YARD_LIMIT || placed.length === data.plants.length} onClick={placeAll}>Place all</button>
          <button type="button" className="btn btn--small btn--ghost" disabled={busy || !placed.length} onClick={clearAll}>Put all back</button>
        </div>
      </div>

      {everything.length === 0 ? (
        <div className="card center">
          <Plant type="sunflower" stage="seed" size={120} title="" />
          <p>No collected plants yet. Finish a focus session and tap Collect plant.</p>
          <Link to="/" className="btn">Start focusing</Link>
        </div>
      ) : (
        <ul className="grid tray">
          {tray.map((p, i) => {
            const out = !!posOf(p);
            return (
              <li key={p.id} style={{ '--i': i }} className={`card plant-card ${out ? 'is-out' : ''}`}>
                {p.decor ? <DecorArt id={p.itemId} className="tray__decor" /> : <Plant type={p.plantType} stage="full" size={84} title="" />}
                <strong>{nameOf(p)}</strong>
                {p.decor ? <span className="small muted">Decoration</span> : <span className="small muted">{formatDate(p.endedAt)} · {p.minutes} min</span>}
                {out
                  ? <button type="button" className="btn btn--small btn--ghost" onClick={() => { takeBack(p.id); setAnnounce(`${nameOf(p)} is back in the tray.`); }}>Put back</button>
                  : <button type="button" className="btn btn--small" disabled={placed.length >= YARD_LIMIT} onClick={() => place(p)}>Place in yard</button>}
                {out && <span className="small tray__tag">🌳 In your yard</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
