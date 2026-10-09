// Source: public game.js, retrieved 2026-10-10. Preserve original rules and evaluation order.
import DATA from './data.js';
import { createEvents } from './events.js';
export function createSimulator(random = Math.random) {
const D = DATA, E = createEvents(random);
function rand(a, b) { return a + random() * (b - a); }
function irand(a, b) { return Math.floor(rand(a, b + 1)); }
function round(x) { return Math.round(x); }
var _followBonus = 0;
function setFollowBonus(pct) { _followBonus = pct || 0; }
var _achBonus = 0;
function setAchBonus(pct) { _achBonus = pct || 0; }
function drawTalent(playerLv) {
var lv = Math.max(0, playerLv || 0);
var base = D.INNATE_WEIGHTS;
var s15 = 0, s610 = 0, i;
for (i = 1; i <= 5; i++) s15 += base[i];
for (i = 6; i <= 10; i++) s610 += base[i];
var pOld = s610 / (s15 + s610);
var pNew = pOld + lv * 0.001 + _followBonus / 100 + _achBonus / 100;
var x610 = (s15 * pNew) / (1 - pNew);
var w = base.slice();
for (i = 6; i <= 10; i++) w[i] = base[i] * (x610 / s610);
var total = 0; for (i = 1; i <= 10; i++) total += w[i];
var r = random() * total, acc = 0, innate = 1;
for (i = 1; i <= 10; i++) { acc += w[i]; if (r < acc) { innate = i; break; } }
return { innate: innate, talent: D.talentOf(innate) };
}
function breakChance(aptitude, lvl) {
var seg;
if (lvl >= 99) seg = 11;
else if (lvl >= 96) seg = 10;
else if (lvl >= 91) seg = 9;
else if (lvl >= 81) seg = 8;
else if (lvl >= 71) seg = 7;
else if (lvl >= 61) seg = 6;
else if (lvl >= 51) seg = 5;
else if (lvl >= 41) seg = 4;
else if (lvl >= 31) seg = 3;
else if (lvl >= 21) seg = 2;
else if (lvl >= 11) seg = 1;
else seg = 0;
var years = D.BREAK_CHANCE[aptitude - 1][seg];
return 1 / years;
}
function breakAgeCoef(g) {
if (g.age <= 12) return 1.2;
if (g.age <= 18) return 1.1;
if (g.age > g.lifespan * 0.8) return 0.9;
return 1.0;
}
function attemptBreak(g) {
if (g.lvl >= 100) return 0;
var coef = breakAgeCoef(g);
var base = breakChance(g.aptitude, g.lvl) * coef;
if (base <= 0.25 + 1e-9) {
return random() < base ? 1 : 0;
}
var gained = 0, step = 0;
while (true) {
var lvl = g.lvl + gained;
if (lvl >= 100) break;
var b = breakChance(g.aptitude, lvl) * coef;
if (b <= 0.25 + 1e-9) break;
var p = b * Math.pow(0.6, step);
if (p <= 0.25 + 1e-9) break;
if (random() < p) { gained++; step++; }
else break;
}
return gained;
}
function cultGain(aptitude, newLvl) {
var c = D.CULT_COEF[aptitude];
if (newLvl >= 100) return round(c * (newLvl * 1.2 + rand(-200, 200) + 200));
if (newLvl >= 91 && newLvl <= 99) return round(c * (newLvl * 0.6 + rand(-newLvl * 0.4, newLvl * 0.4) + 20));
return round(c * (newLvl * 0.6 + rand(-newLvl * 0.4, newLvl * 0.4) + 6));
}
function lifespanGain(newLvl) {
var realmIdx = Math.floor((newLvl - 1) / 10);
var g = D.LIFESPAN_GAIN[realmIdx];
if (!g) return 0;
var v = irand(g[0], g[1]);
if (newLvl > 1 && newLvl % 10 === 1) return v;
return round(v * 0.01);
}
function evCult(g, minPct, maxPct, floor) {
var v = g.cult * rand(minPct, maxPct);
if (v < (floor || 0)) v = floor || 0;
return round(v);
}
function lifeGain(g, baseMin, baseMax) {
var extra = Math.round((g.lifespan - 80) * 0.02);
return irand(baseMin, baseMax) + extra;
}
function levelUp(g) {
if (g.lvl >= 100) {
g.cult += 10000;
return { text: '渡劫十层圆满，参悟天道，修为+10000！', cult: 10000, life: 0, peak: true };
}
var nl = g.lvl + 1;
var cg = cultGain(g.aptitude, nl);
var lg = lifespanGain(nl);
g.lvl = nl; g.cult += cg; g.lifespan += lg;
return { text: '突破至' + D.titleOf(nl) + '！修为+' + cg + (lg ? '，行动点+' + lg : '') + '！', cult: cg, life: lg };
}
function gainLevels(g, n, log) {
var up = 0, ct = 0, life = 0;
for (var k = 0; k < n; k++) {
var r = levelUp(g);
up++; ct += r.cult; life += r.life;
if (log) log.push({ cls: 'brk', text: r.text });
}
return { up: up, cult: ct, life: life };
}
var _curEv = null;
function printlog(text) {
if (!_curEv) return;
_curEv.printed = true;
if (_curEv.log) _curEv.log.push({ cls: 'ev' + _curEv.ev.tier, text: '第' + _curEv.g.age + '岁，遇到' + _curEv.ev.name + '，结果' + text });
}
function drawHighTalent(g) {
var wsum = 0, i;
for (i = 7; i <= 10; i++) wsum += D.INNATE_WEIGHTS[i];
var r = random() * wsum, acc = 0, ni = 7;
for (i = 7; i <= 10; i++) { acc += D.INNATE_WEIGHTS[i]; if (r < acc) { ni = i; break; } }
g.innate = ni; g.aptitude = ni;
g.gotYibian = true;
return { innate: ni, talent: D.talentOf(ni) };
}
var U = {
rand: rand, irand: irand, round: round,
cultGain: cultGain, lifespanGain: lifespanGain,
gainLevels: gainLevels, levelUp: levelUp, evCult: evCult, lifeGain: lifeGain, breakChance: breakChance,
drawHighTalent: drawHighTalent,
printlog: printlog,
testLv: testLv, testCult: testCult,
DATA: D
};
var _testMode = false;
function rollEvent(g, log) {
var pool = [], i, mc = g.maxCount || (g.maxCount = {});
for (i = 0; i < E.length; i++) {
var evi = E[i];
if (_testMode && evi.id === 'xuejin') continue;
var maxN = evi.maxCount != null ? evi.maxCount : 100;
var left = mc[evi.id] != null ? mc[evi.id] : maxN;
if (left <= 0) continue;
var minA = evi.minAge != null ? evi.minAge : 0;
var maxA = evi.maxAge != null ? evi.maxAge : 10000;
if (g.age >= minA && g.age <= maxA) pool.push(evi);
}
if (!pool.length) return;
var total = 0;
for (i = 0; i < pool.length; i++) total += (pool[i].weight != null ? pool[i].weight : 1);
var r = random() * total, acc = 0, ev = pool[0];
for (i = 0; i < pool.length; i++) { acc += (pool[i].weight != null ? pool[i].weight : 1); if (r < acc) { ev = pool[i]; break; } }
var maxN2 = ev.maxCount != null ? ev.maxCount : 100;
mc[ev.id] = (mc[ev.id] != null ? mc[ev.id] : maxN2) - 1;
var text = null;
var prevCur = _curEv;
_curEv = { ev: ev, g: g, log: log, printed: false };
if (!ev.cond || ev.cond(g, U)) {
if (ev.ok) text = ev.ok(g, U, log);
} else {
if (ev.fail) text = ev.fail(g, U, log);
}
if (text && !_curEv.printed) printlog(text);
_curEv = prevCur;
}
function testPercentile(innate, age, n, X, key) {
var vals = [];
_testMode = true;
for (var i = 0; i < n; i++) {
var g = createGame(0);
g.innate = innate; g.aptitude = innate;
var g0 = 0;
while (!g.dead && !g.ascended && g.age < age && g0 < 10000) { g0++; rollYear(g); }
vals.push(g[key]);
}
_testMode = false;
vals.sort(function (a, b) { return a - b; });
var p = 1 - X / 100;
var idx = Math.min(vals.length - 1, Math.max(0, Math.floor(vals.length * p)));
return vals[idx];
}
function testLv(innate, age, n, X) { return testPercentile(innate, age, n, X, 'lvl'); }
function testCult(innate, age, n, X) { return testPercentile(innate, age, n, X, 'cult'); }
function feishengChance(cult) {
if (cult >= 500000) return 1.0;
if (cult >= 250000) {
var t = (cult - 250000) / 249999;
return 0.01 + t * (0.10 - 0.01);
}
if (cult >= 100000) {
var t2 = (cult - 100000) / 150000;
return 0.001 + t2 * (0.01 - 0.001);
}
return 1e-4;
}
function xianCult(cult, rate) {
if (rate == null) rate = 1;
return round((1000000 + cult) * rate);
}
function tryFeisheng(g, log) {
var xw = g.xinwu.length > 0 ? g.xinwu[0] : null;
var rate = xw ? xw.rate : 1;
if (xw) {
if (g.cult >= xw.needCult) {
g.ascendMode = 'xianyuan';
log.push({ cls: 'god', text: '第' + g.age + '岁，行动点将尽，仙缘已至，飞升成仙！' });
g.ascended = true; g.lvl = 101;
g.cult = xianCult(g.cult, rate); g.lifespan = 999999;
return true;
}
log.push({ cls: 'ev3', text: '第' + g.age + '岁，可惜修为不足，未能最终获得仙人青睐，只能转而渡劫' });
}
if (random() < feishengChance(g.cult)) {
g.ascendMode = 'feisheng';
log.push({ cls: 'god', text: '第' + g.age + '岁，行动点将尽，渡过成仙劫，羽化登仙！' });
g.ascended = true; g.lvl = 101;
var dRate = D.FEISHENG_BONUS_MIN + random() * (D.FEISHENG_BONUS_MAX - D.FEISHENG_BONUS_MIN);
g.cult = xianCult(g.cult, dRate); g.lifespan = 999999;
return true;
}
g.dead = true;
g.ascendMode = 'fail';
log.push({ cls: 'dead', text: '第' + g.age + '岁，成仙劫失败，身陨天劫之下' });
return true;
}
function createGame(playerLv) {
var t = drawTalent(playerLv);
return {
innate: t.innate,
aptitude: t.innate,
lvl: 1,
cult: irand(t.innate, t.innate * 10),
lifespan: irand(D.LIFE_MIN, D.LIFE_MAX),
age: 6,
year: 0,
xinwu: [],
maxCount: {},
ascended: false,
dead: false
};
}
function rollYear(g) {
var log = [];
g.year++;
g.age++;
if (random() < D.XIANDI_CHANCE) {
log.push({ cls: 'rainbow', text: '第' + g.age + '岁，仙帝降临，获得仙帝传承，直接飞升成仙！' });
g.ascendMode = 'xiandi';
g.ascended = true; g.lvl = 101;
g.cult = xianCult(g.cult, D.XIANDI_BONUS);
g.lifespan = 999999;
return log;
}
if (random() < D.XITONG_CHANCE) {
g.aptitude = 10;
g.lifespan += 50;
g.gotXitong = true;
log.push({ cls: 'red', text: '第' + g.age + '岁，获得神秘系统！脱胎换骨，灵根提升至仙体，行动点+50' });
}
if (g.lvl >= 91 && g.xinwu.length < 1 && random() < D.XINWU_CHANCE) {
var got = D.XINWU[Math.floor(random() * D.XINWU.length)];
g.xinwu.push(got);
log.push({ cls: 'red', text: '第' + g.age + '岁，获得仙人信物『' + got.name + '』' });
}
if (g.lvl < 100) {
var gained = attemptBreak(g);
if (gained > 0) {
log.push({ cls: 'brk', text: '第' + g.age + '岁，修炼，成功突破！' });
for (var k = 0; k < gained; k++) {
var r = levelUp(g);
log.push({ cls: 'brk', text: r.text });
if (k + 1 < gained && g.lvl < 100) log.push({ cls: 'brk', text: '第' + g.age + '岁，修炼，连破！' });
if (g.lvl >= 100) break;
}
}
}
if (random() < (D.STEADY_TARGET / g.lifespan)) {
var sInc = evCult(g, 0.001, 0.0015, rand(5, 10));
g.cult += sInc;
log.push({ cls: 'gain', text: '第' + g.age + '岁，修行中水到渠成，修为有所提升，+' + sInc + '！' });
}
if (g.lvl >= 100 && !g.ascended && (g.lifespan - g.age) <= 10) {
if (tryFeisheng(g, log)) return log;
}
if (g.age > g.lifespan) {
g.dead = true;
g.deadCause = 'age';
log.push({ cls: 'dead', text: '第' + g.age + '岁，行动点耗尽，坐化' });
return log;
}
if (!g.ascended && random() < (D.EVENT_TARGET / g.lifespan)) rollEvent(g, log);
if (g.age > g.lifespan) {
g.dead = true;
g.deadCause = 'accident';
log.push({ cls: 'dead', text: '第' + g.age + '岁，遭遇不测，不幸暴毙' });
}
return log;
}
return {
drawTalent: drawTalent,
setFollowBonus: setFollowBonus,
setAchBonus: setAchBonus,
breakChance: breakChance,
attemptBreak: attemptBreak,
cultGain: cultGain,
lifespanGain: lifespanGain,
feishengChance: feishengChance,
xianCult: xianCult,
gainLevels: gainLevels,
testLv: testLv, testCult: testCult,
createGame: createGame,
rollYear: rollYear,
tryFeisheng: tryFeisheng,
EVENTS: E
};
}
