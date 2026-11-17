import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_CHOICES, hoursText, nextPlant, planFor, planMinutes, roundsFor } from '../../shared/plan.js';
import { PLANT_CATALOG } from '../../shared/plants.js';

test('rounds fit inside the time: focus times plus the rests between them', () => {
  assert.equal(roundsFor(120, 25, 5), 4); // 4 x 25 + 3 x 5 = 115 minutes
  assert.equal(roundsFor(60, 25, 5), 2); // 2 x 25 + 5 = 55
  assert.equal(roundsFor(60, 50, 10), 1);
  assert.equal(roundsFor(240, 50, 10), 4); // 4 x 50 + 3 x 10 = 230
  assert.equal(roundsFor(10, 25, 5), 1); // always at least one round
  for (const [total, f, b] of [[120, 25, 5], [180, 40, 10], [90, 15, 3], [240, 90, 20], [30, 25, 5]]) {
    const n = roundsFor(total, f, b);
    assert.ok(n === 1 || planMinutes(n, f, b) <= total, `${n} rounds fit in ${total}`);
    if (n > 1) assert.ok(planMinutes(n + 1, f, b) > total, `${n + 1} rounds would not fit in ${total}`);
  }
  assert.equal(planMinutes(4, 25, 5), 115);
});

test('plan choices: one session means no plan, open means no limit, hours give rounds', () => {
  assert.equal(planFor('one', '', 25, 5), null);
  assert.deepEqual(planFor('open', '', 25, 5), { rounds: null });
  assert.deepEqual(planFor('h2', '', 25, 5), { rounds: 4 });
  assert.deepEqual(planFor('custom', '1.5', 25, 5), { rounds: 3 }); // 90 minutes: 3 x 25 + 2 x 5 = 85
  assert.equal(planFor('custom', '', 25, 5), undefined);
  assert.equal(planFor('custom', '0.1', 25, 5), undefined);
  assert.equal(planFor('custom', '13', 25, 5), undefined);
  assert.equal(planFor('custom', 'abc', 25, 5), undefined);
  assert.ok(PLAN_CHOICES.every((c) => c.id && c.label));
});

test('the next plant is a different one, and trees only appear for long enough sessions', () => {
  for (let i = 0; i < 200; i += 1) {
    const p = nextPlant('rose', 25);
    assert.notEqual(p, 'rose');
    assert.equal(PLANT_CATALOG.find((x) => x.id === p).kind, 'plant'); // 25 minutes: no trees
  }
  const longOnes = new Set(Array.from({ length: 400 }, () => nextPlant('rose', 90)));
  assert.ok([...longOnes].some((id) => PLANT_CATALOG.find((x) => x.id === id).kind === 'tree'), 'a 90 minute rhythm can grow trees');
  const seen = new Set(Array.from({ length: 300 }, () => nextPlant('rose', 25)));
  assert.ok(seen.size >= 6, 'it varies a lot');
  assert.ok(Array.from({ length: 300 }, () => nextPlant('pine', 15, { unlockAll: true })).some((p) => p === 'ginkgo' || p === 'apple' || p === 'cherry'), 'demo mode can use any plant');
  assert.equal(nextPlant('x', 25, { random: () => 0 }), PLANT_CATALOG[0].id);
});

test('across a plan every plant gets a turn before any repeats', () => {
  const fits = PLANT_CATALOG.filter((p) => p.minMinutes <= 25).length; // 9 plants and flowers for a 25 minute rhythm
  let used = ['rose'];
  let prev = 'rose';
  for (let round = 1; round < fits; round += 1) {
    const p = nextPlant(prev, 25, { used });
    assert.ok(!used.includes(p), `round ${round + 1} is new`);
    used = [...used, p];
    prev = p;
  }
  assert.equal(new Set(used).size, fits);
  const again = nextPlant(prev, 25, { used }); // everything used: start over, but not the same one twice in a row
  assert.notEqual(again, prev);
});

test('time text', () => {
  assert.equal(hoursText(115), '1 h 55 min');
  assert.equal(hoursText(120), '2 h');
  assert.equal(hoursText(45), '45 min');
});
