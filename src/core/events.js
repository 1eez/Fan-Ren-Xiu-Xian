// Source: public game.js, retrieved 2026-10-10. Preserve original rules and evaluation order.
export function createEvents(random = Math.random) {
var EVENTS = [
{
id: 'erjue',
weight: 0.65,
maxCount: 2,
name: '灵根进化',
tier: 4,
desc: '沉寂多年的灵根突然进化',
minAge: 12,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(50, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U, log) {
var lf = U.lifeGain(g, 80, 120);
g.lifespan += lf;
U.printlog('灵根成功进化，行动点+' + lf + ',修为也有很大精进');
U.gainLevels(g, U.irand(1, 3), log);
},
fail:
function (g, U) {
var lf = U.irand(15, 35);
g.lifespan -= lf;
U.printlog('修为不足，灵根失控，灵力逆流，重伤，行动点 -' + lf);
}
},
{
id: 'yibian',
weight: 0.05,
maxCount: 1,
name: '灵根异变',
tier: 4,
desc: '你那平凡的灵根意外发生异变，发生巨大蜕变',
minAge: 6,
maxAge: 12,
cond:
function (g) {
return g.innate <= 6;
},
ok:
function (g, U, log) {
var n = U.drawHighTalent(g);
var lf = U.lifeGain(g, 80, 120);
g.lifespan += lf;
U.printlog('灵根异变为『' + n.talent + '』！先天灵根提升至 ' + n.innate + ' 级，行动点+' + lf + '，修为也有很大精进');
U.gainLevels(g, U.irand(1, 3), log);
},
fail: null
},
{
id: 'xuejin',
weight: 0.3,
maxCount: 1,
name: '仙界残境',
tier: 4,
desc: '闯入机缘与凶险并存的仙界残境，寻找机缘',
minAge: 30,
maxAge: 1000000,
cond:
function (g, U) {
return g.cult > U.testCult(8, g.age, 20, 15) || g.lvl > U.testLv(8, g.age, 20, 15);
},
ok:
function (g, U, log) {
var c = U.evCult(g, 0.1, 0.2, 2000);
g.cult += c;
U.printlog('在仙界残境杀出重围，夺得大量宝物，修为额外+' + c + ',修为也大幅提升');
U.gainLevels(g, U.irand(1, 3), log);
},
fail:
function (g, U) {
g.dead = true;
U.printlog('实力不足，惨死于仙界残境');
}
},
{
id: 'lingcao',
weight: 0.3,
maxCount: 1,
name: '获得仙草',
tier: 4,
desc: '意外寻得一株源自仙界的仙草，可脱胎换骨',
minAge: 0,
maxAge: 1000000,
cond: null,
ok:
function (g, U, log) {
var lf = U.lifeGain(g, 80, 120);
g.lifespan += lf;
var up = null;
if (g.aptitude < 10) {
up = g.aptitude + U.irand(1, 3);
if(up < 6){
up = 6;
}
if (up > 10) up = 10;
g.aptitude = up;
}
U.printlog('服下仙草，脱胎换骨，行动点+' + lf + (up ? '，灵根提升至' + U.DATA.talentOf(up) + '！' : ''));
U.gainLevels(g, U.irand(1, 3), log);
},
fail: null
},
{
id: 'binghuo',
weight: 0.7,
maxCount: 2,
name: '上古宗门遗迹',
tier: 4,
desc: '偶遇上古宗门遗迹，包含大量资源',
minAge: 0,
maxAge: 1000000,
cond: null,
ok:
function (g, U, log) {
var lf = U.lifeGain(g, 60, 100);
g.lifespan += lf;
var up = null;
if (g.aptitude < 10) {
up = g.aptitude + U.irand(1, 2);
if(up < 5){
up = 5;
}
if (up > 10) up = 10;
g.aptitude = up;
}
U.printlog('炼化大量资粮，行动点+' + lf + (up ? '，灵根提升至' + U.DATA.talentOf(up) + '！' : '') + '修为也有所精进');
U.gainLevels(g, U.irand(2, 3), log);
},
fail: null
},
{
id: 'dabi',
weight: 2,
maxCount: 2,
name: '宗门大比',
tier: 3,
desc: '参加宗门举办的大比',
minAge: 15,
maxAge: 30,
cond:
function (g, U) {
return g.lvl >= Math.min(40, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U, log) {
var c = U.evCult(g, 0.075, 0.15, 1500);
g.cult += c;
U.printlog('宗门大比夺魁，修为+' + c + ',修为也有所精进');
U.gainLevels(g, U.irand(1, 2), log);
},
fail:
function (g, U) {
var lf = U.irand(10, 20);
g.lifespan -= lf;
U.printlog('大比受挫重伤，行动点 -' + lf);
}
},
{
id: 'shenhai',
weight: 2,
maxCount: 3,
name: '藏宝之地',
tier: 3,
desc: '执行宗门任务时，偶遇一处藏宝之地',
minAge: 0,
maxAge: 1000000,
cond: null,
ok:
function (g, U, log) {
var c = U.evCult(g, 0.05, 0.1, 1250);
g.cult += c;
var lf = U.irand(20, 40);
g.lifespan += lf;
U.printlog('探索藏宝之地，大有收获，修为+' + c + '，行动点+' + lf);
U.gainLevels(g, U.irand(1, 2), log);
},
fail: null
},
{
id: 'linggu',
weight: 1,
maxCount: 3,
name: '获得妖丹',
tier: 3,
desc: '猎杀妖兽后意外获得一颗妖丹',
minAge: 0,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(35, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U, log) {
var c = U.evCult(g, 0.05, 0.125, 1500);
g.cult += c;
U.printlog('炼化珍贵妖丹，修为+' + c);
U.gainLevels(g, U.irand(1, 2), log);
},
fail:
function (g, U) {
var lf = U.irand(10, 25);
g.lifespan -= lf;
U.printlog('妖丹被魔道修士抢走，还把你打成重伤，行动点 -' + lf);
}
},
{
id: 'xingkong',
weight: 1,
maxCount: 5,
name: '顿悟玄机',
tier: 3,
desc: '夜观天象，顿悟天地玄机',
minAge: 0,
maxAge: 1000000,
cond: null,
ok:
function (g, U, log) {
var c = U.evCult(g, 0.05, 0.1, 1000);
g.cult += c;
var lf = U.irand(20, 40);
g.lifespan += lf;
U.printlog('观星顿悟，修为+' + c + '，行动点+' + lf);
U.gainLevels(g, 1, log);
},
fail: null
},
{
id: 'lingdan',
weight: 1,
maxCount: 3,
name: '上古灵丹',
tier: 3,
desc: '寻得一颗可提升资质的上古灵丹',
minAge: 0,
maxAge: 1000000,
cond: null,
ok:
function (g, U, log) {
if (g.aptitude <= 6) {
var up = g.aptitude + U.irand(1, 2);
if (up > 10) up = 10;
g.aptitude = up;
U.printlog('服下上古灵丹，脱胎换骨，灵根提升至' + U.DATA.talentOf(up) + '！');
return;
}
U.printlog('服下上古灵丹，可惜资质深厚无益，只感灵力有所提升');
U.gainLevels(g, 1, log);
},
fail: null
},
{
id: 'gongfa',
weight: 1,
maxCount: 3,
name: '太古功法',
tier: 3,
desc: '寻得一份可提升资质的太古功法',
minAge: 0,
maxAge: 1000000,
cond: null,
ok:
function (g, U, log) {
if (g.aptitude <= 8) {
var up = g.aptitude + 1;
if (up > 10) up = 10;
g.aptitude = up;
U.printlog('修炼太古功法，茅塞顿开，灵根提升至' + U.DATA.talentOf(up) + '！');
return;
}
U.printlog('修炼太古功法，可惜收获甚微，只感修为有所精进');
U.gainLevels(g, 1, log);
},
fail: null
},
{
id: 'chuancheng',
weight: 5,
maxCount: 3,
name: '前辈传承',
tier: 2,
desc: '一位前辈的残魂指引你传承衣钵',
minAge: 0,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U, log) {
if (g.lvl < 100) {
U.printlog('继承前辈衣钵，获益良多');
U.gainLevels(g, 1, log);
return;
}
var c2 = U.evCult(g, 0.04, 0.08, 750);
g.cult += c2;
U.printlog('继承前辈衣钵，修为+' + c2);
},
fail:
function (g, U) {
var lf = U.irand(8, 18);
g.lifespan -= lf;
U.printlog('修为不足，未通过考核，传承失败，还受了重伤，行动点 -' + lf);
}
},
{
id: 'yaodan',
weight: 5,
maxCount: 10,
name: '残次品丹药',
tier: 2,
desc: '拍卖会上，购买到一颗残次品丹药，思量片刻，终是服用',
minAge: 12,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(40, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U) {
var c = U.evCult(g, 0.03, 0.06, 500);
g.cult += c;
U.printlog('顺利炼化丹药，修为+' + c);
},
fail:
function (g, U) {
var lf = U.irand(5, 12);
g.lifespan -= lf;
U.printlog('丹药有毒，伤害到了你的本源，行动点 -' + lf);
}
},
{
id: 'zongmen',
weight: 5,
maxCount: 5,
name: '魔道冲突',
tier: 2,
desc: '魔道修士飞扬跋扈，与你发生冲突，你惨遭追杀',
minAge: 12,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U) {
var c = U.evCult(g, 0.025, 0.05, 500);
g.cult += c;
U.printlog('反杀魔道追兵，夺得大量宝物和典籍，修为+' + c);
},
fail:
function (g, U) {
var lf = U.irand(8, 20);
g.lifespan -= lf;
U.printlog('被魔道修士重创，行动点 -' + lf);
}
},
{
id: 'shouchao',
weight: 5,
maxCount: 10,
name: '妖兽潮',
tier: 2,
desc: '不幸遭遇妖兽大潮，无数妖兽席卷而来',
minAge: 0,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U) {
var c = U.evCult(g, 0.02, 0.045, 350);
g.cult += c;
U.printlog('奋力战斗，侥幸击退妖兽潮，战斗中有所领悟，修为+' + c);
},
fail:
function (g, U) {
var lf = U.irand(8, 20);
g.lifespan -= lf;
U.printlog('被妖兽潮吞没，重伤，行动点 -' + lf);
}
},
{
id: 'shentong',
weight: 5,
maxCount: 50,
name: '领悟神通',
tier: 2,
desc: '苦思多年，一朝领悟强大神通',
minAge: 0,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U) {
var c = U.evCult(g, 0.015, 0.03, 250);
g.cult += c;
U.printlog('领悟神通，修为+' + c);
},
fail:
function (g, U) {
var lf = U.irand(5, 15);
g.lifespan -= lf;
U.printlog('修炼神通时，不幸走火入魔，行动点 -' + lf);
}
},
{
id: 'zhaomu',
weight: 5,
maxCount: 5,
name: '名门招募',
tier: 2,
desc: '名门大派向你抛出橄榄枝',
minAge: 0,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(30, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U, log) {
var c = U.evCult(g, 0.01, 0.02, 200);
g.cult += c;
U.printlog('加入宗门，获得大量交流的机会与资源，修为+' + c);
if (g.lvl < 50 && random() < 0.5) {
U.printlog('加入宗门后，你加倍苦修，有所成就');
U.gainLevels(g, 1, log);
}
},
fail:
function (g, U) {
var c = U.evCult(g, 0.003, 0.005, 50);
g.cult += c;
U.printlog('宗门没有看上你，但念你诚心，好心指点几句，修为+' + c);
}
},
{
id: 'lieyao',
weight: 20,
maxCount: 100,
name: '猎妖遇险',
tier: 1,
desc: '猎杀妖兽',
minAge: 30,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(25, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U) {
var c = U.evCult(g, 0.005, 0.01, 150);
g.cult += c;
U.printlog('搏杀妖兽，修为+' + c);
},
fail:
function (g, U) {
var lf = U.irand(3, 8);
g.lifespan -= lf;
U.printlog('险些被妖兽撕碎，行动点 -' + lf);
}
},
{
id: 'caiyao',
weight: 10,
maxCount: 20,
name: '采药遇险',
tier: 1,
desc: '深山采药，偶遇凶猛妖兽',
minAge: 20,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(15, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U) {
var c = U.evCult(g, 0.003, 0.006, 50);
g.cult += c;
var lf = U.irand(5, 10);
g.lifespan += lf;
U.printlog('采得灵药，行动点+' + lf + '，修为+' + c);
},
fail:
function (g, U) {
var lf = U.irand(2, 6);
g.lifespan -= lf;
U.printlog('被妖兽所伤，仓皇而逃，行动点 -' + lf);
}
},
{
id: 'bishi',
weight: 20,
maxCount: 100,
name: '同辈切磋',
tier: 1,
desc: '与同龄修士切磋较量',
minAge: 12,
maxAge: 1000000,
cond:
function (g, U) {
return g.lvl >= Math.min(10, Math.floor(g.age * 0.75)) + U.irand(0, 10);
},
ok:
function (g, U) {
var c = U.evCult(g, 0.004, 0.007, 75);
g.cult += c;
U.printlog('切磋获胜，修为+' + c);
},
fail:
function (g, U) {
var lf = U.irand(2, 5);
g.lifespan -= lf;
U.printlog('切磋落败受创，行动点 -' + lf);
}
},
{
id: 'ganwu',
weight: 20,
maxCount: 100,
name: '略有感悟',
tier: 1,
desc: '修炼中，略有感悟',
minAge: 0,
maxAge: 1000000,
cond: null,
ok:
function (g, U) {
var c = U.evCult(g, 0.003, 0.005, 50);
g.cult += c;
U.printlog('修为+' + c);
},
fail: null
}
];

return EVENTS;
}
