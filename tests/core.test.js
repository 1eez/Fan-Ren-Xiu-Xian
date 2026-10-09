import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import DATA from '../src/core/data.js';
import { createSimulator } from '../src/core/simulator.js';

const original = readFileSync(new URL('./fixtures/original-core.txt', import.meta.url), 'utf8');
function rng(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function legacy(seed) {
  const math = Object.create(Math);
  math.random = rng(seed);
  const ctx = vm.createContext({ Math: math });
  vm.runInContext(original, ctx);
  return ctx;
}
const plain = value => JSON.parse(JSON.stringify(value));

test('all data tables and 21 event definitions match the original', () => {
  const old = legacy(1);
  const tables = Object.fromEntries(Object.entries(DATA).filter(([, value]) => typeof value !== 'function'));
  const originalTables = Object.fromEntries(Object.entries(old.DATA).filter(([, value]) => typeof value !== 'function'));
  assert.deepEqual(tables, plain(originalTables));
  const events = createSimulator().EVENTS;
  assert.equal(events.length, 21);
  assert.deepEqual(events.map(({ id, name, tier, weight, minAge, maxAge, maxCount }) => ({ id, name, tier, weight, minAge, maxAge, maxCount })), plain(old.EVENTS.map(({ id, name, tier, weight, minAge, maxAge, maxCount }) => ({ id, name, tier, weight, minAge, maxAge, maxCount }))));
});

test('seeded full lifetimes match original states and logs for all 10 talents', () => {
  for (let talent = 1; talent <= 10; talent++) {
    for (const seed of [1, 29, 2026, 80017]) {
      const old = legacy(seed), current = createSimulator(rng(seed));
      old.Sim.setAchBonus(1.7); current.setAchBonus(1.7);
      const a = old.Sim.createGame(14), b = current.createGame(14);
      a.innate = a.aptitude = b.innate = b.aptitude = talent;
      assert.deepEqual(b, plain(a));
      let steps = 0;
      while (!a.dead && !a.ascended && steps < 100000) {
        assert.deepEqual(current.rollYear(b), plain(old.Sim.rollYear(a)), `logs talent=${talent} seed=${seed} year=${steps}`);
        assert.deepEqual(b, plain(a), `state talent=${talent} seed=${seed} year=${steps}`);
        steps++;
      }
      assert.ok(a.dead || a.ascended, 'lifetime must finish');
    }
  }
});

test('breakthrough tables and age modifiers match across every level', () => {
  const old = legacy(15), current = createSimulator(rng(15));
  for (let aptitude = 1; aptitude <= 10; aptitude++) {
    for (let lvl = 1; lvl <= 100; lvl++) {
      assert.equal(current.breakChance(aptitude, lvl), old.Sim.breakChance(aptitude, lvl));
      for (const age of [8, 15, 30, 90]) {
        const g = { aptitude, lvl, age, lifespan: 100 };
        assert.equal(current.attemptBreak(g), old.Sim.attemptBreak(g));
      }
    }
  }
});

test('ascension boundaries preserve discontinuities and exact original interpolation', () => {
  const old = legacy(1), current = createSimulator();
  for (const cult of [0, 99999, 100000, 100001, 249999, 250000, 499999, 500000, 1000000]) assert.equal(current.feishengChance(cult), old.Sim.feishengChance(cult));
  assert.equal(current.feishengChance(99999), 0.0001);
  assert.equal(current.feishengChance(100000), 0.001);
  assert.equal(current.feishengChance(499999), 0.1);
  assert.equal(current.feishengChance(500000), 1);
});

test('each eligible event matches original with low and high strength characters', () => {
  for (let i = 0; i < 21; i++) {
    const old = legacy(73 + i), current = createSimulator(rng(73 + i));
    const ev = current.EVENTS[i];
    let seen = 0;
    for (const lvl of [1, 100]) {
      for (let trial = 0; trial < 20; trial++) {
        const age = Math.min(ev.maxAge - 1, Math.max(ev.minAge, 8));
        const a = old.Sim.createGame(0), b = current.createGame(0);
        const overrides = { lvl, age, cult: lvl === 100 ? 1000000 : 1, lifespan: age + 15, aptitude: 5, innate: 5 };
        Object.assign(a, overrides); Object.assign(b, overrides);
        for (const e of current.EVENTS) { a.maxCount[e.id] = b.maxCount[e.id] = e.id === ev.id ? 1 : 0; }
        const oldLogs = plain(old.Sim.rollYear(a)), newLogs = current.rollYear(b);
        if (newLogs.some(entry => entry.text.includes('遇到' + ev.name))) seen++;
        assert.deepEqual(newLogs, oldLogs, ev.id);
        assert.deepEqual(b, plain(a), ev.id);
      }
    }
    assert.ok(seen > 0, 'event actually exercised: ' + ev.id);
  }
});

test('rare inheritance, system and token branches match with controlled random sequences', () => {
  for (const prefix of [[0], [0.5, 0], [0.5, 0.5, 0, 0.2]]) {
    const make = () => { const values = prefix.slice(); return () => values.length ? values.shift() : 0.5; };
    const math = Object.create(Math); math.random = () => 0.5;
    const ctx = vm.createContext({ Math: math }); vm.runInContext(original, ctx);
    const current = createSimulator(() => 0.5);
    const a = ctx.Sim.createGame(0), b = current.createGame(0);
    a.lvl = b.lvl = 91; a.age = b.age = 100; a.lifespan = b.lifespan = 1000;
    math.random = make();
    const newer = createSimulator(make());
    assert.deepEqual(newer.rollYear(b), plain(ctx.Sim.rollYear(a)));
    assert.deepEqual(b, plain(a));
  }
});

test('cultivation and lifespan increments match on all talent and level combinations', () => {
  const old = legacy(501), current = createSimulator(rng(501));
  for (let aptitude = 1; aptitude <= 10; aptitude++) for (let level = 2; level <= 100; level++) {
    assert.equal(current.cultGain(aptitude, level), old.Sim.cultGain(aptitude, level));
    assert.equal(current.lifespanGain(level), old.Sim.lifespanGain(level));
  }
});

test('all ten token thresholds and ordinary ascension endings match original', () => {
  for (const token of [null, ...DATA.XINWU]) for (const passed of [false, true]) {
    const old = legacy(912), current = createSimulator(rng(912));
    const a = old.Sim.createGame(0), b = current.createGame(0);
    const overrides = { lvl: 100, age: 1995, lifespan: 2000, cult: token ? token.needCult - (passed ? 0 : 1) : (passed ? 500000 : 1), xinwu: token ? [token] : [] };
    Object.assign(a, overrides); Object.assign(b, overrides);
    const oldLogs = [], newLogs = [];
    assert.equal(current.tryFeisheng(b, newLogs), old.Sim.tryFeisheng(a, oldLogs));
    assert.deepEqual(newLogs, plain(oldLogs));
    assert.deepEqual(b, plain(a));
    if (passed) assert.equal(b.ascended, true);
    if (token && passed) assert.equal(b.ascendMode, 'xianyuan');
  }
});
