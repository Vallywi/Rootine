import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';
import { coinsForMinutes, coinsForSeconds, SHOP_ITEMS } from '../../shared/shop.js';

let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

async function grow(c, minutes, { collect = true, name } = {}) {
  const r = await c.post('/sessions', { kind: 'focus', plantType: 'rose', minutes });
  s.clock.t += minutes * 60_000;
  await c.post(`/sessions/${r.body.session.id}/complete`);
  if (collect) await c.post(`/sessions/${r.body.session.id}/collect`, name ? { name } : {});
  return r.body.session.id;
}
const coins = async (c) => (await c.get('/shop/balance')).body.coins;
let n = 0;
const user = () => s.register(`shop${++n}@example.com`);

test('coin rule: longer sessions pay more per minute', () => {
  assert.equal(coinsForMinutes(15), 15);
  assert.equal(coinsForMinutes(25), 30);
  assert.equal(coinsForMinutes(40), 48);
  assert.equal(coinsForMinutes(50), 75);
  assert.equal(coinsForMinutes(51), 77);
  assert.equal(coinsForMinutes(75), 150);
  assert.equal(coinsForMinutes(90), 180);
  assert.equal(coinsForSeconds(60), 1);
  // the higher the minutes, the higher the coins per minute
  assert.ok(coinsForMinutes(90) / 90 > coinsForMinutes(50) / 50);
  assert.ok(coinsForMinutes(50) / 50 > coinsForMinutes(25) / 25);
  assert.ok(coinsForMinutes(25) / 25 > coinsForMinutes(15) / 15);
});

test('the catalog is sane: unique ids, free starter hut, prices for the rest', () => {
  assert.equal(new Set(SHOP_ITEMS.map((i) => i.id)).size, SHOP_ITEMS.length);
  assert.deepEqual(SHOP_ITEMS.filter((i) => i.price === 0).map((i) => i.id), ['hut']);
  for (const cat of ['house', 'fence', 'decor', 'pet']) assert.ok(SHOP_ITEMS.some((i) => i.category === cat), cat);
  assert.ok(SHOP_ITEMS.filter((i) => i.category === 'house').length >= 8);
  assert.ok(SHOP_ITEMS.filter((i) => i.category === 'fence').length >= 7);
  assert.ok(SHOP_ITEMS.filter((i) => i.category === 'decor').length >= 15);
  assert.ok(SHOP_ITEMS.filter((i) => i.category === 'pet').length >= 8);
  // affordable: a first plant of 25 minutes (30 coins) or two buys a small item, and nothing costs more than about 17 of those
  assert.ok(SHOP_ITEMS.every((i) => i.price <= 500));
  assert.ok(SHOP_ITEMS.filter((i) => i.price > 0).some((i) => i.price <= 30));
});

test('coins come from collected plants, and the server agrees with the rule', async () => {
  const c = await user();
  assert.equal((await coins(c)).balance, 0);
  await grow(c, 25);
  await grow(c, 50);
  await grow(c, 15, { collect: false }); // not collected yet, no coins yet
  assert.deepEqual(await coins(c), { earned: 105, spent: 0, balance: 105 });
  await c.post('/sessions/collect-all');
  assert.equal((await coins(c)).earned, 120);
});

test('a new account starts with the tiny hut and no fence', async () => {
  const c = await user();
  const shop = (await c.get('/shop')).body;
  assert.equal(shop.house, 'hut');
  assert.equal(shop.fence, null);
  const hut = shop.items.find((i) => i.id === 'hut');
  assert.deepEqual([hut.owned, hut.equipped], [true, true]);
  assert.equal(shop.items.find((i) => i.id === 'cottage').owned, false);
});

test('buying: not enough coins is refused, enough coins works once, and the balance drops', async () => {
  const c = await user();
  const poor = await c.post('/shop/buy', { itemId: 'signpost' });
  assert.equal(poor.status, 409);
  assert.match(poor.body.error, /Not enough coins/);
  await grow(c, 50); // 75 coins
  const ok = await c.post('/shop/buy', { itemId: 'mailbox' }); // 40
  assert.equal(ok.status, 201);
  assert.equal(ok.body.coins.balance, 55);
  assert.equal((await c.post('/shop/buy', { itemId: 'mailbox' })).status, 409); // already own it
  assert.equal((await coins(c)).balance, 55);
  assert.equal((await c.post('/shop/buy', { itemId: 'castle' })).status, 409);
  assert.equal((await c.post('/shop/buy', { itemId: 'nope' })).status, 404);
  assert.equal((await c.post('/shop/buy', { itemId: 'hut' })).status, 409);
  assert.equal((await c.post('/shop/buy', {})).status, 400);
});

test('a new house or fence is put up right away, and can be switched back', async () => {
  const c = await user();
  for (let i = 0; i < 5; i += 1) await grow(c, 50); // 375 coins
  assert.equal((await c.post('/shop/buy', { itemId: 'cottage' })).status, 201); // 80
  assert.equal((await c.post('/shop/buy', { itemId: 'picket' })).status, 201); // 45
  let shop = (await c.get('/shop')).body;
  assert.deepEqual([shop.house, shop.fence, shop.coins.balance], ['cottage', 'picket', 250]);
  assert.equal((await c.post('/shop/equip', { category: 'house', itemId: 'hut' })).status, 200);
  assert.equal((await c.post('/shop/equip', { category: 'fence', itemId: null })).status, 200);
  shop = (await c.get('/shop')).body;
  assert.deepEqual([shop.house, shop.fence], ['hut', null]);
  assert.equal((await c.post('/shop/equip', { category: 'house', itemId: 'castle' })).status, 409); // not owned
  assert.equal((await c.post('/shop/equip', { category: 'house', itemId: 'picket' })).status, 404); // wrong category
  assert.equal((await c.post('/shop/equip', { category: 'house', itemId: null })).status, 400);
});

test('decorations: place, move, and put away, only if owned', async () => {
  const c = await user();
  assert.equal((await c.put('/shop/items/bench/position', { x: 30, y: 60 })).status, 409);
  await grow(c, 50);
  await c.post('/shop/buy', { itemId: 'bench' });
  assert.equal((await c.put('/shop/items/bench/position', { x: 30.44, y: 60 })).body.item.x, 30.4);
  assert.equal((await c.put('/shop/items/bench/position', { x: 130, y: 60 })).status, 400);
  assert.equal((await c.put('/shop/items/cottage/position', { x: 30, y: 60 })).status, 404); // not decor
  let item = (await c.get('/shop')).body.items.find((i) => i.id === 'bench');
  assert.deepEqual([item.owned, item.x, item.y], [true, 30.4, 60]);
  await c.del('/shop/items/bench/position');
  item = (await c.get('/shop')).body.items.find((i) => i.id === 'bench');
  assert.deepEqual([item.x, item.y], [null, null]);
});

test('coins and purchases are private to each account', async () => {
  const a = await user(); const b = await user();
  await grow(a, 50);
  await a.post('/shop/buy', { itemId: 'lamp' });
  assert.equal((await coins(b)).balance, 0);
  assert.equal((await b.get('/shop')).body.items.find((i) => i.id === 'lamp').owned, false);
  assert.equal((await b.put('/shop/items/lamp/position', { x: 10, y: 50 })).status, 409);
  const signedOut = s.newClient();
  assert.equal((await signedOut.get('/shop')).status, 401);
});

test('two purchases at the same moment cannot spend the same coins twice', async () => {
  const c = await user();
  await grow(c, 25); // 30 coins
  const results = await Promise.all([c.post('/shop/buy', { itemId: 'bench' }), c.post('/shop/buy', { itemId: 'lamp' }), c.post('/shop/buy', { itemId: 'mailbox' })]); // 30, 25, 20
  const bought = results.filter((r) => r.status === 201).length;
  const balance = (await coins(c)).balance;
  assert.ok(balance >= 0, `balance never goes below zero (${balance})`);
  assert.ok(bought >= 1);
});

test('plants can be named when collected, renamed later, and cleared', async () => {
  const c = await user();
  const id = await grow(c, 25, { name: '  Sunny  ' });
  let g = (await c.get('/garden')).body;
  assert.equal(g.plants[0].name, 'Sunny');
  const r = await c.patch(`/garden/plants/${id}`, { name: 'Rosie' });
  assert.equal(r.body.plant.name, 'Rosie');
  g = (await c.get('/garden')).body;
  assert.equal(g.plants[0].name, 'Rosie');
  assert.equal((await c.patch(`/garden/plants/${id}`, { name: 'x'.repeat(31) })).status, 400);
  assert.equal((await c.patch(`/garden/plants/${id}`, { name: '   ' })).body.plant.name, null);
  assert.equal((await c.patch(`/garden/plants/${id}`, { name: 5 })).status, 400);
  assert.equal((await c.patch(`/garden/plants/${id}`, { color: 'red' })).status, 400);
  // a waiting (not yet collected) plant can be named too
  const waiting = await grow(c, 15, { collect: false });
  assert.equal((await c.patch(`/garden/plants/${waiting}`, { name: 'Pip' })).status, 200);
  assert.equal((await c.get('/garden')).body.pending[0].name, 'Pip');
  // another account cannot name my plant
  const other = await user();
  assert.equal((await other.patch(`/garden/plants/${id}`, { name: 'Mine now' })).status, 404);
  // collecting with a bad name is refused
  const again = await grow(c, 15, { collect: false });
  assert.equal((await c.post(`/sessions/${again}/collect`, { name: 'y'.repeat(31) })).status, 400);
});

test('pets: bought in the shop, live in the yard, and are not placed or equipped', async () => {
  const c = await user();
  await grow(c, 50); // 75 coins
  assert.equal((await c.post('/shop/buy', { itemId: 'dog' })).status, 201); // 60
  assert.equal((await c.post('/shop/buy', { itemId: 'dog' })).status, 409); // one of each
  const shop = (await c.get('/shop')).body;
  const dog = shop.items.find((i) => i.id === 'dog');
  assert.deepEqual([dog.category, dog.owned, dog.equipped, dog.x], ['pet', true, false, null]);
  assert.equal(shop.coins.balance, 15);
  assert.equal((await c.post('/shop/buy', { itemId: 'sheep' })).status, 409); // too expensive now
  assert.equal((await c.post('/shop/equip', { category: 'house', itemId: 'dog' })).status, 404);
  assert.equal((await c.put('/shop/items/dog/position', { x: 10, y: 50 })).status, 404);
  assert.equal(shop.items.find((i) => i.id === 'cat').owned, false);
});

test('the new houses, fences, and decorations can be bought and used', async () => {
  const c = await user();
  for (let i = 0; i < 14; i += 1) await grow(c, 50); // 1050 coins
  for (const id of ['tent', 'barn', 'mushroom']) assert.equal((await c.post('/shop/buy', { itemId: id })).status, 201, id);
  assert.equal((await c.get('/shop')).body.house, 'mushroom');
  for (const id of ['bamboo', 'iron', 'candy']) assert.equal((await c.post('/shop/buy', { itemId: id })).status, 201, id);
  assert.equal((await c.get('/shop')).body.fence, 'candy');
  assert.equal((await c.post('/shop/equip', { category: 'fence', itemId: 'bamboo' })).status, 200);
  for (const id of ['gnome', 'fountain', 'campfire', 'greenhouse']) assert.equal((await c.post('/shop/buy', { itemId: id })).status, 201, id);
  assert.equal((await c.put('/shop/items/fountain/position', { x: 40, y: 70 })).status, 200);
});
