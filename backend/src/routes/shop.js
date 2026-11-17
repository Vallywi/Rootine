import { Router } from 'express';
import { z } from 'zod';
import { HttpError, notFound, parse } from '../http.js';
import { requireAuth } from '../auth.js';
import { COIN_TIERS, DEFAULT_HOUSE, SHOP_ITEMS, shopItem } from '../../../shared/shop.js';

// The same rule as shared/shop.js (coinsForSeconds), written in SQL so that buying can check the balance in one statement.
const TIER_SQL = `CASE ${COIN_TIERS.map((t) => `WHEN planned_seconds >= ${t.fromSeconds} THEN ${t.percent}`).join(' ')} END`;
export const EARNED_SQL = `(SELECT COALESCE(SUM(ROUND(planned_seconds * ${TIER_SQL} / 6000.0)), 0)::int FROM timer_sessions
   WHERE user_id = $1 AND kind = 'focus' AND status = 'completed' AND collected_at IS NOT NULL)`;
const SPENT_SQL = '(SELECT COALESCE(SUM(price), 0)::int FROM shop_purchases WHERE user_id = $1)';

const coord = (name) => z.number({ error: `${name} must be a number from 0 to 100.` }).min(0, `${name} must be a number from 0 to 100.`).max(100, `${name} must be a number from 0 to 100.`);
const buySchema = z.object({ itemId: z.string({ error: 'Choose an item.' }) }).strict();
const equipSchema = z.object({ category: z.enum(['house', 'fence'], { error: 'Choose house or fence.' }), itemId: z.string().nullable() }).strict();
const positionSchema = z.object({ x: coord('x'), y: coord('y') }).strict();
const round1 = (v) => Math.round(v * 10) / 10;

export function shopRoutes(ctx) {
  const router = Router();
  const { db } = ctx;
  router.use(requireAuth);

  const balance = async (userId) => {
    const [row] = await db.query(`SELECT ${EARNED_SQL} AS earned, ${SPENT_SQL} AS spent`, [userId]);
    return { earned: row.earned, spent: row.spent, balance: row.earned - row.spent };
  };

  router.get('/balance', async (req, res) => {
    res.json({ coins: await balance(req.user.id) });
  });

  router.get('/', async (req, res) => {
    const userId = req.user.id;
    const coins = await balance(userId);
    const [me] = await db.query('SELECT yard_house, yard_fence FROM users WHERE id = $1', [userId]);
    const bought = await db.query('SELECT item_id, x, y FROM shop_purchases WHERE user_id = $1', [userId]);
    const byId = new Map(bought.map((b) => [b.item_id, b]));
    const items = SHOP_ITEMS.map((i) => {
      const b = byId.get(i.id);
      const owned = i.price === 0 || !!b;
      return {
        ...i,
        owned,
        equipped: i.category === 'house' ? me.yard_house === i.id : i.category === 'fence' ? me.yard_fence === i.id : false,
        x: b?.x ?? null,
        y: b?.y ?? null,
      };
    });
    res.json({ coins, house: me.yard_house, fence: me.yard_fence, items });
  });

  router.post('/buy', async (req, res) => {
    const { itemId } = parse(buySchema, req.body);
    const item = shopItem(itemId);
    if (!item) throw notFound();
    if (item.price === 0) throw new HttpError(409, 'That one is already yours.');
    const userId = req.user.id;
    const inserted = await db.query(
      `INSERT INTO shop_purchases (user_id, item_id, price, bought_at)
         SELECT $1::bigint, $2::text, $3::int, $4::bigint WHERE ${EARNED_SQL} - ${SPENT_SQL} >= $3::int
       ON CONFLICT (user_id, item_id) DO NOTHING RETURNING id`,
      [userId, item.id, item.price, ctx.now()],
    );
    if (!inserted.length) {
      const [owned] = await db.query('SELECT id FROM shop_purchases WHERE user_id = $1 AND item_id = $2', [userId, item.id]);
      if (owned) throw new HttpError(409, 'You already own this.');
      const { balance: have } = await balance(userId);
      throw new HttpError(409, `Not enough coins yet. You need ${item.price - have} more. Finish a focus session to earn them.`);
    }
    // Two purchases at the very same moment could both pass the check above. Look again, and undo this one if the balance went negative.
    const after = await balance(userId);
    if (after.balance < 0) {
      await db.query('DELETE FROM shop_purchases WHERE id = $1', [inserted[0].id]);
      throw new HttpError(409, 'That was too many purchases at once. Please try again.');
    }
    // A new house or fence is put up right away.
    if (item.category === 'house') await db.query('UPDATE users SET yard_house = $2 WHERE id = $1', [userId, item.id]);
    if (item.category === 'fence') await db.query('UPDATE users SET yard_fence = $2 WHERE id = $1', [userId, item.id]);
    res.status(201).json({ ok: true, coins: await balance(userId) });
  });

  router.post('/equip', async (req, res) => {
    const { category, itemId } = parse(equipSchema, req.body);
    const userId = req.user.id;
    if (itemId === null) {
      if (category === 'house') throw new HttpError(400, 'A yard always has a house.');
      await db.query('UPDATE users SET yard_fence = NULL WHERE id = $1', [userId]);
      return res.json({ ok: true });
    }
    const item = shopItem(itemId);
    if (!item || item.category !== category) throw notFound();
    if (item.price > 0) {
      const [owned] = await db.query('SELECT id FROM shop_purchases WHERE user_id = $1 AND item_id = $2', [userId, item.id]);
      if (!owned) throw new HttpError(409, 'Buy it first.');
    }
    await db.query(`UPDATE users SET ${category === 'house' ? 'yard_house' : 'yard_fence'} = $2 WHERE id = $1`, [userId, item.id]);
    res.json({ ok: true });
  });

  const loadDecor = async (req) => {
    const item = shopItem(req.params.itemId);
    if (!item || item.category !== 'decor') throw notFound();
    const [row] = await db.query('SELECT id FROM shop_purchases WHERE user_id = $1 AND item_id = $2', [req.user.id, item.id]);
    if (!row) throw new HttpError(409, 'Buy it first.');
    return item;
  };

  router.put('/items/:itemId/position', async (req, res) => {
    const item = await loadDecor(req);
    const body = parse(positionSchema, req.body);
    const x = round1(body.x), y = round1(body.y);
    await db.query('UPDATE shop_purchases SET x = $3, y = $4 WHERE user_id = $1 AND item_id = $2', [req.user.id, item.id, x, y]);
    res.json({ item: { id: item.id, x, y } });
  });

  router.delete('/items/:itemId/position', async (req, res) => {
    const item = await loadDecor(req);
    await db.query('UPDATE shop_purchases SET x = NULL, y = NULL WHERE user_id = $1 AND item_id = $2', [req.user.id, item.id]);
    res.json({ item: { id: item.id, x: null, y: null } });
  });

  return router;
}

export { DEFAULT_HOUSE };
