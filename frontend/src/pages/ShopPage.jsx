import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { ItemArt } from '../components/YardArt.jsx';
import { FormError } from '../components/ui.jsx';
import { COIN_TIERS, coinsForMinutes } from '../../../shared/shop.js';

const TABS = [['house', 'Houses'], ['fence', 'Fences'], ['decor', 'Decorations']];
const COIN = '\uD83E\uDE99';

export default function ShopPage() {
  const { sessionEnded } = useAuth();
  const [shop, setShop] = useState(null);
  const [tab, setTab] = useState('house');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try { setShop(await api.get('/shop')); }
    catch (err) { if (err.status === 401) sessionEnded(); else setError(err.message); }
  }, [sessionEnded]);
  useEffect(() => { load(); }, [load]);

  const act = async (key, fn, done) => {
    setError(''); setMsg(''); setBusy(key);
    try { await fn(); setMsg(done); await load(); window.dispatchEvent(new Event('rootine:coins')); }
    catch (err) { if (err.status === 401) sessionEnded(); else setError(err.message); }
    finally { setBusy(''); }
  };

  if (!shop) return error ? <FormError>{error}</FormError> : <p role="status" className="muted">Loading the shop...</p>;
  const balance = shop.coins.balance;
  const items = shop.items.filter((i) => i.category === tab);

  return (
    <section className="stack shop">
      <div className="row row--between row--wrap">
        <h1>Shop</h1>
        <p className="coin-pill coin-pill--big" role="status" aria-label={`You have ${balance} coins`}><span aria-hidden="true">{COIN}</span> <strong>{balance}</strong> coins</p>
      </div>

      <div className="card stack stack--tight">
        <h2>How coins work</h2>
        <p className="muted">Every plant you collect earns coins. The longer you focus, the more each minute is worth.</p>
        <ul className="coin-tiers">
          {[...COIN_TIERS].reverse().map((t, i, arr) => {
            const next = arr[i + 1];
            const from = t.fromSeconds / 60;
            const label = next ? `${from === 0 ? '15' : from} to ${next.fromSeconds / 60 - 1} min` : `${from} min or more`;
            return <li key={t.fromSeconds}><strong>{label}</strong><span>{t.percent / 100} coin{t.percent === 100 ? '' : 's'} per minute</span></li>;
          })}
        </ul>
        <p className="muted small">Examples: 25 minutes = {coinsForMinutes(25)} coins, 50 minutes = {coinsForMinutes(50)}, 90 minutes = {coinsForMinutes(90)}.</p>
        <p className="muted small">You have earned {shop.coins.earned} coins in total and spent {shop.coins.spent}.</p>
      </div>

      <div className="chips" role="tablist" aria-label="Shop sections">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`chip-btn ${tab === k ? 'is-on' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      <FormError>{error}</FormError>
      {msg && <p className="success" role="status">{msg}</p>}

      <ul className="shop__grid">
        {tab === 'fence' && (
          <li className="card shop__item">
            <div className="shop__art shop__art--none" aria-hidden="true">{'\u2205'}</div>
            <strong>No fence</strong>
            <span className="muted small">An open yard.</span>
            {shop.fence === null
              ? <span className="tag tag--status-done">In use</span>
              : <button type="button" className="btn btn--small btn--ghost" disabled={!!busy} onClick={() => act('none', () => api.post('/shop/equip', { category: 'fence', itemId: null }), 'The fence is taken down.')}>Use this</button>}
          </li>
        )}
        {items.map((item) => {
          const short = item.price - balance;
          return (
            <li key={item.id} className={`card shop__item ${item.equipped ? 'is-equipped' : ''}`}>
              <div className="shop__art"><ItemArt item={item} /></div>
              <strong>{item.name}</strong>
              <span className="muted small">{item.text}</span>
              {item.price > 0 && !item.owned && <span className="shop__price"><span aria-hidden="true">{COIN}</span> {item.price}</span>}
              {!item.owned && (
                <button type="button" className="btn btn--small" disabled={!!busy || short > 0}
                  onClick={() => act(item.id, () => api.post('/shop/buy', { itemId: item.id }), item.category === 'decor' ? `${item.name} bought! Place it from your yard.` : `${item.name} bought and put up in your yard!`)}>
                  {short > 0 ? `Need ${short} more` : 'Buy'}
                </button>
              )}
              {item.owned && (item.category === 'house' || item.category === 'fence') && (item.equipped
                ? <span className="tag tag--status-done">In use</span>
                : <button type="button" className="btn btn--small btn--ghost" disabled={!!busy} onClick={() => act(item.id, () => api.post('/shop/equip', { category: item.category, itemId: item.id }), `${item.name} is now in your yard.`)}>Use this</button>)}
              {item.owned && item.category === 'decor' && <Link to="/yard" className="btn btn--small btn--ghost">{item.x != null ? 'Move it in the yard' : 'Place it in the yard'}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
