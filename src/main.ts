import './style.css';
import DATA from './core/data.js';
import { createSimulator } from './core/simulator.js';
import { keys, read, write, remove } from './storage';
import type { Game, LogEntry, Player, Stats, HistoryEntry, RankEntry, FinishReason } from './types';

const sim = createSimulator();
const app = document.querySelector<HTMLElement>('#app')!;
const modal = document.querySelector<HTMLDialogElement>('#modal')!;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let player = read<Player>(keys.player, { lv: 0, exp: 0 });
const achievements = read<Record<string, boolean>>(keys.achievements, {});
let game: Game | null = null;
let logs: LogEntry[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
let talentTimer: ReturnType<typeof setInterval> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let paused = false;
let tickMs = 400;
let view: 'home' | 'talent' | 'game' | 'settle' = 'home';
let lastReason: FinishReason = 'dead';
let rankSubmitted = false;
const descriptions = [
  '', '杂而不纯，资质下下。仙途渺茫，然大道五十，天衍四九，未必没有一线生机。',
  '五行驳杂，修行缓慢。勤能补拙，亦有出头之日。',
  '四象俱全，资质平平。或可于宗门中谋一席之地。',
  '三才兼备，中人之姿。努力修行，结丹有望。',
  '双脉并流，资质上佳。同辈之中，已算翘楚。',
  '变异灵根，常有异象。战力超凡，化神可期。',
  '地脉之气所钟，修行一日千里。炼虚有望。',
  '天生道体，修行神速。宗门争抢的天才，合体可期。',
  '先天灵体，与道亲和。万中无一，大乘有望。',
  '仙人之姿，与生俱来。注定飞升，百年难遇。',
];
function esc(value: unknown): string {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
function fmt(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}
function now(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const needExp = () => DATA.PLAYER_LV_BASE * (player.lv + 1);
const bonus = () => Math.round(DATA.ACHIEVEMENTS.reduce((sum: number, a: { id: string; bonus: number }) => sum + (achievements[a.id] ? a.bonus : 0), 0) * 100) / 100;
function applyBonus(): void { sim.setAchBonus(bonus()); }
function toast(message: string): void {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('show');
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
}
function stop(): void { clearTimeout(timer); timer = undefined; }
function savedGame(): Game | null {
  const g = read<Game | null>(keys.save, null);
  return g && !g.dead && !g.ascended ? g : null;
}
function bind(id: string, action: () => void): void { $(id)?.addEventListener('click', action); }
function openModal(title: string, content: string, kicker = '修行手记'): void {
  $('modal-title').textContent = title;
  $('modal-kicker').textContent = kicker;
  $('modal-body').innerHTML = content;
  modal.showModal();
}
function home(): void {
  stop();
  view = 'home';
  const stats = read<Stats>(keys.stats, { total: 0, ascend: 0 });
  const saved = savedGame();
  app.innerHTML = `<section class="home-page">
    <div class="hero-copy"><p class="eyebrow"><span class="gold-line"></span> 一念入仙途 · 一生问长生</p>
    <h1>凡人<span>修仙</span></h1><p class="hero-subtitle">浮生如梦，仙路漫漫。<br>以一介凡身，赴一场长生之约。</p>
    <div class="hero-actions"><button class="primary" id="start">开启修仙人生 <span>↗</span></button>${saved ? `<button class="secondary" id="continue">继续修炼 <small>${esc(DATA.titleOf(saved.lvl))} · ${saved.age}岁</small></button>` : ''}</div>
    <div class="home-navigation"><button id="achievements">成就道册 <span>↗</span></button><button id="history">修仙史记 <span>↗</span></button><button id="rank">本机飞升榜 <span>↗</span></button></div>
    </div><div class="hero-art" aria-hidden="true"><div class="orbit outer"></div><div class="orbit inner"></div><div class="sigil">道</div><span class="art-caption">命由天定 · 道在人为</span><span class="vertical-poem">仙路尽头谁为峰<br>一念长生万古同</span></div>
    <div class="journey-strip"><div><span class="stat-label">历世修行</span><strong>${stats.total}<small>局</small></strong></div><div><span class="stat-label">羽化登仙</span><strong>${stats.ascend}<small>次</small></strong></div><div class="player-stat"><span class="stat-label">道心等级</span><strong>Lv.${player.lv}</strong><div class="progress"><i style="width:${Math.min(100, player.exp / needExp() * 100)}%"></i></div><small>经验 ${player.exp} / ${needExp()}</small></div><div><span class="stat-label">高阶灵根加成</span><strong>+${(player.lv * 0.1).toFixed(1)}<small>%</small></strong><small>成就另加 +${bonus()}%</small></div></div>
    <div class="world-notes"><span>十类灵根</span><b>·</b><span>十境百层</span><b>·</b><span>二十一种机缘</span><b>·</b><button id="rules">修行须知 ↗</button></div>
  </section>`;
  bind('start', talent);
  bind('continue', resume);
  bind('achievements', showAchievements);
  bind('history', showHistory);
  bind('rank', showRank);
  bind('rules', showRules);
}
function talent(): void {
  stop();
  clearInterval(talentTimer);
  game = sim.createGame(player.lv) as Game;
  view = 'talent';
  app.innerHTML = `<section class="talent-page"><p class="eyebrow">仙途初启 · 六岁测灵</p><h2>叩问天命</h2><p class="muted">一缕灵光，照见此生仙缘。</p><div class="talent-orb"><div class="orbit outer"></div><div class="orbit inner"></div><span id="talent-name">?</span></div><p id="talent-desc" class="talent-description">静心凝神，感应天地灵气……</p><p id="talent-result" class="gold"></p><button id="begin" class="primary" hidden>踏入仙途 <span>↗</span></button></section>`;
  let frame = 0;
  talentTimer = setInterval(() => {
    frame++;
    // Presentation randomness is independent of simulation draw order.
    const shown = frame >= 14 ? game!.innate : (frame % 10) + 1;
    $('talent-name').textContent = DATA.talentOf(shown);
    $('talent-desc').textContent = descriptions[shown];
    if (frame >= 14) {
      clearInterval(talentTimer);
      $('talent-result').textContent = `测得 ${DATA.talentOf(shown)} · 先天灵根 ${shown} 级`;
      $('begin').hidden = false;
      document.querySelector('.talent-orb')?.classList.add('revealed');
    }
  }, 120);
  bind('begin', () => {
    logs = [];
    if (game!.innate >= 8) logs.push({ cls: 'rare', text: `第6岁，天生奇才！先天灵根 ${DATA.talentOf(game!.innate)}` });
    logs.push({ cls: 'brk', text: `第6岁，测灵根，为『${DATA.talentOf(game!.innate)}』！先天灵根 ${game!.innate} 级，修为 ${game!.cult}` });
    renderGame();
  });
}
function logMarkup(entry: LogEntry): string {
  return `<div class="log-line ${esc(entry.cls)}"><span class="log-dot"></span><span>${esc(entry.text.replace(/行动点/g, '寿命'))}</span></div>`;
}
function renderGame(): void {
  view = 'game'; paused = false;
  app.innerHTML = `<section class="game-page"><div class="section-heading"><div><p class="eyebrow">仙途纪事</p><h2>此生，问道</h2></div><div class="game-heading-right"><span id="innate-label">${esc(DATA.talentOf(game!.innate))} · 先天 ${game!.innate} 级</span><button class="secondary compact" id="pause">暂停修炼</button></div></div>
    <div class="attributes"><div class="attribute age"><span>春秋 · 年岁</span><strong id="g-age"></strong><small>岁</small></div><div class="attribute"><span>境界 · 问道</span><strong id="g-realm"></strong></div><div class="attribute"><span>灵根 · 资质</span><strong id="g-apt"></strong></div><div class="attribute"><span>寿命 · 天年</span><strong id="g-life"></strong></div><div class="attribute"><span>修为 · 道行</span><strong id="g-cult"></strong></div></div>
    <div class="chronicle"><div class="chronicle-head"><span>人 生 纪 事</span><span id="journey-state">灵气流转 · 修行中</span></div><div id="log-box" class="log-box" role="log" aria-label="修仙人生纪事"></div></div>
    <div class="controls"><div class="speed-control"><span>光阴流速</span><button id="slow" class="${tickMs === 800 ? 'selected' : ''}">慢</button><button id="normal" class="${tickMs === 400 ? 'selected' : ''}">正常</button></div><div class="control-actions"><button class="secondary compact" id="save">存档</button><button class="text-button" id="settle">提前结算 ↗</button></div></div></section>`;
  $('log-box').innerHTML = logs.slice(-300).map(logMarkup).join('');
  updateAttributes(); scrollLogs();
  bind('pause', () => {
    paused = !paused;
    $('pause').textContent = paused ? '继续修炼' : '暂停修炼';
    $('journey-state').textContent = paused ? '静心凝神 · 已暂停' : '灵气流转 · 修行中';
    if (!paused) schedule();
  });
  bind('save', save);
  bind('settle', () => { if (game && !game.dead && !game.ascended) finish('pause'); });
  const speed = (ms: number) => {
    tickMs = ms;
    $('slow').classList.toggle('selected', ms === 800);
    $('normal').classList.toggle('selected', ms === 400);
    if (!paused) schedule();
  };
  bind('slow', () => speed(800)); bind('normal', () => speed(400));
  schedule();
}
function updateAttributes(): void {
  const g = game!;
  $('g-age').textContent = String(g.age);
  $('g-realm').textContent = DATA.titleOf(g.lvl);
  $('g-apt').textContent = DATA.talentOf(g.aptitude) + (g.aptitude > g.innate ? `(先天${g.innate})` : '');
  $('g-life').textContent = String(g.lifespan);
  $('g-cult').textContent = fmt(g.cult);
}
function scrollLogs(): void { const el = $('log-box'); el.scrollTop = el.scrollHeight; }
function schedule(): void {
  stop();
  timer = setTimeout(() => {
    if (paused || !game) return;
    let entries: LogEntry[] = [], guard = 0;
    while (!entries.length && !game.dead && !game.ascended && guard < 200000) {
      guard++; entries = sim.rollYear(game) as LogEntry[];
    }
    logs.push(...entries);
    $('log-box').insertAdjacentHTML('beforeend', entries.map(logMarkup).join(''));
    while ($('log-box').children.length > 300) $('log-box').firstElementChild!.remove();
    updateAttributes(); scrollLogs();
    if (game.dead || game.ascended) finish(game.dead ? 'dead' : 'god');
    else schedule();
  }, tickMs);
}
function save(): void {
  if (!game || game.dead || game.ascended) return;
  const snapshot = { ...game, __time: now(), __log: logs.slice(-80) };
  toast(write(keys.save, snapshot) ? `存档成功 · ${DATA.titleOf(game.lvl)} · 第${game.age}岁` : '存档失败，浏览器存储不可用');
}
function resume(): void {
  const saved = savedGame();
  if (!saved) return;
  game = saved; logs = saved.__log?.slice() ?? [];
  renderGame();
  // Original restore marker is displayed but is not added to fullLog.
  $('log-box').insertAdjacentHTML('beforeend', logMarkup({ cls: 'rare', text: `【读档】第${game.age}岁，继续修行。` }));
  scrollLogs();
}
function mark(id: string, newly: string[]): void {
  if (achievements[id]) return;
  achievements[id] = true;
  const item = DATA.ACHIEVEMENTS.find((a: { id: string }) => a.id === id);
  newly.push(item?.name ?? id);
}
function checkAchievements(newly: string[]): void {
  const g = game!;
  const conditions: [string, boolean][] = [
    ['innate10', g.innate === 10], ['hunsheng', g.lvl >= 71], ['hundou', g.lvl >= 81],
    ['feng91', g.lvl >= 91], ['chaoji', g.lvl >= 95], ['lim99', g.lvl >= 100],
    ['shiwan', g.cult >= 100000], ['sanshiwan', g.cult >= 300000], ['million', g.cult >= 1000000],
    ['xinwu', g.xinwu.length > 0], ['god', g.ascended], ['dujie', g.ascended && g.ascendMode === 'feisheng'],
    ['xiandi', g.ascended && g.ascendMode === 'xiandi'], ['xitong', !!g.gotXitong], ['yibian', !!g.gotYibian],
  ];
  for (const [id, yes] of conditions) if (yes) mark(id, newly);
}
function outcome(reason: FinishReason): string {
  if (reason === 'god') return '飞升成仙';
  if (reason === 'pause') return '提前结算';
  if (game!.ascendMode === 'fail') return '成仙劫失败';
  return game!.deadCause === 'accident' ? '不幸暴毙' : '与世长辞';
}
function finish(reason: FinishReason): void {
  stop(); paused = true; lastReason = reason; view = 'settle'; rankSubmitted = false;
  const g = game!;
  const newly: string[] = [];
  const stats = read<Stats>(keys.stats, { total: 0, ascend: 0 });
  stats.total++;
  if (g.ascended) {
    stats.ascend++;
    const total = read<number>(keys.total, 0) + 1;
    write(keys.total, total);
    for (const [n, id] of [[3, 'god3'], [10, 'god10'], [30, 'god30'], [50, 'god50'], [100, 'god100']] as const) if (total >= n) mark(id, newly);
  }
  write(keys.stats, stats);
  const exp = g.ascended ? DATA.FEISHENG_EXP : Math.round(g.lvl * (reason === 'pause' ? DATA.EXP_PER_LVL_EARLY : DATA.EXP_PER_LVL));
  player.exp += exp;
  while (player.exp >= needExp()) { player.exp -= needExp(); player.lv++; }
  write(keys.player, player); remove(keys.save);
  const hist = read<HistoryEntry[]>(keys.history, []);
  hist.unshift({ time: now(), outcome: outcome(reason), god: g.ascended, talent: DATA.talentOf(g.aptitude) + (g.aptitude > g.innate ? `(先天${g.innate})` : ''), lvl: DATA.titleOf(g.lvl), cult: fmt(g.cult), age: g.ascended ? `${g.age - 6} 年` : `${g.age} 岁`, exp });
  write(keys.history, hist.slice(0, 100));
  checkAchievements(newly); write(keys.achievements, achievements); applyBonus();
  renderSettlement(exp, newly);
}
function renderSettlement(exp: number, newly: string[]): void {
  const g = game!;
  app.innerHTML = `<section class="settlement"><p class="eyebrow">此生落卷 · 仙途有记</p><div class="settlement-symbol">${g.ascended ? '仙' : '缘'}</div><h1>${outcome(lastReason)}</h1><p class="muted">${g.ascended ? '你已证得仙位，寿与天齐。' : lastReason === 'pause' ? '暂别此生，来日再赴仙途。' : '一世修行归尘土，来生再问长生。'}</p><div class="settle-stats"><div><span>最终境界</span><strong>${esc(DATA.titleOf(g.lvl))}</strong></div><div><span>最终灵根</span><strong>${esc(DATA.talentOf(g.aptitude))}</strong><small>先天 ${g.innate} 级</small></div><div><span>修为</span><strong>${fmt(g.cult)}</strong></div><div><span>${g.ascended ? '飞升用时' : '享年'}</span><strong>${g.ascended ? g.age - 6 : g.age}<small>${g.ascended ? '年' : '岁'}</small></strong></div></div>
    ${g.xinwu.length ? `<p class="xinwu">仙人信物 · ${esc(g.xinwu.map(x => x.name).join('、'))}</p>` : ''}
    <div class="exp-line">本局经验 <b>+${exp}</b><span>道心 Lv.${player.lv} · ${player.exp}/${needExp()}</span></div>
    ${newly.length ? `<div class="new-achievements"><span>新成就</span>${newly.map(n => `<b>${esc(n)}</b>`).join('')}</div>` : ''}
    ${g.ascended ? '<form id="rank-form" class="rank-form"><label for="rank-name">飞升成仙，留名本机道册</label><div><input id="rank-name" maxlength="8" placeholder="输入道号（最多 8 字）" required autocomplete="off"><button class="secondary compact" type="submit">上榜</button></div><small>仅保存在当前浏览器</small></form>' : ''}
    <div class="settle-actions"><button class="primary" id="again">再入轮回 <span>↗</span></button><button class="secondary" id="review">回顾一生</button><button class="text-button" id="home">返回山门</button></div><button class="subtle-link" id="rules">查看飞升概率说明 ↗</button></section>`;
  bind('again', talent); bind('home', home); bind('rules', showRules);
  bind('review', () => openModal('回顾一生', `<div class="review-logs">${logs.map(logMarkup).join('') || '<p class="empty">这一生平淡如水。</p>'}</div>`, '浮生一卷'));
  $('rank-form')?.addEventListener('submit', event => { event.preventDefault(); submitRank(); });
}
function submitRank(): void {
  if (!game?.ascended || rankSubmitted) return;
  const name = $<HTMLInputElement>('rank-name').value.trim().slice(0, 8);
  if (!name) { toast('请输入道号'); return; }
  const rec: RankEntry = { name, cultNum: game.cult, cult: fmt(game.cult), age: `${game.age - 6} 年`, talent: DATA.talentOf(game.aptitude), innate: game.innate, time: now() };
  const rank = read<RankEntry[]>(keys.rank, []);
  rank.push(rec); rank.sort((a, b) => (b.cultNum || 0) - (a.cultNum || 0));
  const top = rank.slice(0, 100);
  if (!write(keys.rank, top)) { toast('保存失败，浏览器存储不可用'); return; }
  rankSubmitted = true; $('rank-form').hidden = true;
  const index = top.indexOf(rec);
  toast(index < 0 ? '本次修为未进入本机前 100 名' : `已上榜（本机）· 第 ${index + 1} 名`);
}
function showAchievements(): void {
  const count = DATA.ACHIEVEMENTS.filter((a: { id: string }) => achievements[a.id]).length;
  openModal('成就道册', `<p class="modal-summary">已达成 ${count} / ${DATA.ACHIEVEMENTS.length}<span>高阶灵根概率 +${bonus()}%</span></p><div class="achievement-grid">${DATA.ACHIEVEMENTS.map((a: { id: string; name: string; bonus: number }) => `<div class="achievement ${achievements[a.id] ? 'done' : ''}"><span class="achievement-icon">${achievements[a.id] ? '◆' : '◇'}</span><div><strong>${esc(a.name)}</strong><small>${achievements[a.id] ? '已达成' : '未达成'}</small></div><b>+${a.bonus}%</b></div>`).join('')}</div>`, '道心不灭 · 福缘相随');
}
function showHistory(): void {
  const history = read<HistoryEntry[]>(keys.history, []);
  openModal('修仙史记', `<p class="modal-summary">最近 ${history.length} 局<span>最多保留 100 条</span></p>${history.length ? history.map(h => `<article class="history-item"><div><strong class="${h.god ? 'gold' : ''}">${esc(h.outcome)}</strong><time>${esc(h.time)}</time></div><p>${esc(h.talent)} · ${esc(h.lvl)} · 修为 ${esc(h.cult)}</p><small>${esc(h.age)} <span>经验 +${h.exp}</span></small></article>`).join('') : '<div class="empty"><span>卷</span><p>史记尚未落笔，先去修炼一局吧。</p></div>'}`, '前尘往事 · 皆为修行');
}
function showRank(): void {
  const rank = read<RankEntry[]>(keys.rank, []);
  openModal('本机飞升榜', `<p class="modal-summary">${rank.length} 位飞升者<span>按成仙修为排序 · 本机前 100 名</span></p><div class="rank-unlock"><span>${rank.length >= 100 ? '仙界模拟器已开放！飞升者满百，恭候道友入仙门。' : '满 100 名飞升者开放仙界模拟器'}</span><b>${rank.length} / 100</b><div class="progress"><i style="width:${Math.min(100, rank.length)}%"></i></div></div>${rank.length ? rank.map((r, i) => `<article class="rank-row"><span class="rank-number">${String(i + 1).padStart(2, '0')}</span><div><strong>${esc(r.name)}</strong><small>${esc(r.talent)} · 用时 ${esc(r.age)} · ${esc(r.time)}</small></div><b>${esc(r.cult)}</b></article>`).join('') : '<div class="empty"><span>仙</span><p>尚无飞升者，等你留名。</p></div>'}`, '羽化登仙 · 留名道册');
}
function showRules(): void {
  openModal('修行须知', `<div class="rules"><h3>修仙之路</h3><p>6 岁测灵根，炼体一层起步，历经十境百层。渡劫十层后，剩余寿命不超过 10 年时尝试飞升。修炼自动推进；速度控制纪事展示间隔，无事发生的年份自动跳过。</p><h3>成仙劫成功率</h3><table><thead><tr><th>修为</th><th>成功率</th></tr></thead><tbody><tr><td>低于 10 万</td><td>0.01%</td></tr><tr><td>10 万～25 万</td><td>0.1%～1%（线性）</td></tr><tr><td>25 万～不足 50 万</td><td>1%～约 10%（线性）</td></tr><tr><td>达到 50 万</td><td>100%</td></tr></tbody></table><h3>仙人信物</h3><p>渡劫期（≥91 层）每年 0.003% 概率获得，最多一个。10 种信物的修为门槛为 18 万～27 万。持有信物且达标，可仙缘飞升，成仙修为倍率为 1.29～2.1。</p><h3>隐藏机缘</h3><p>神秘系统每年约二亿分之一概率，当前资质直升仙体、寿命 +50；仙帝传承每年约二十亿分之一概率，直接飞升。</p><h3>道心与成就</h3><p>飞升经验 +1000；普通结算经验为境界层级 ×0.5，提前结算为 ×0.1，四舍五入。升级需求为 50×(Lv+1)。每级高阶灵根合计概率 +0.1 个百分点，20 项成就另有加成。</p><h3>存档与排行榜</h3><p>手动存档可继续本局；结算后清除当前存档。历史保留最近 100 局，存档保留最近 80 条日志。榜单与修行记录仅保存在当前浏览器，清除网站数据会丢失。</p></div>`, '知天命 · 尽人事');
}
bind('close-modal', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) { const r = modal.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) modal.close(); } });
$('brand').addEventListener('click', event => { event.preventDefault(); if (view === 'home' || view === 'settle') home(); });
applyBonus(); home();
