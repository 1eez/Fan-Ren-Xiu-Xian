// Source: public game.js, retrieved 2026-10-10. Preserve original rules and evaluation order.
var TALENTS = ['', '伪灵根', '杂灵根', '四灵根', '三灵根', '双灵根', '异灵根', '地灵根', '天灵根', '灵体', '仙体'];
function talentOf(lv) { return TALENTS[lv] || '伪灵根'; }
var REALMS = ['', '炼体', '练气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
function realmOf(lvl) {
if (lvl >= 101) return '仙人';
var r = Math.floor((lvl - 1) / 10) + 1;
if (r < 1) r = 1; if (r > 10) r = 10;
return REALMS[r];
}
function layerOf(lvl) {
if (lvl >= 101) return '';
return ((lvl - 1) % 10) + 1;
}
var CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function titleOf(lvl) {
if (lvl >= 101) return '仙人';
return realmOf(lvl) + CN_NUM[layerOf(lvl)] + '层';
}
var INNATE_WEIGHTS = [
0, 33.0, 25.0, 11.0, 9.0, 7.0, 5.0, 4.0, 3.0, 2.0, 1.0
];
var CULT_COEF = [0, 1.0, 1.5, 2.2, 3.2, 4.5, 6.3, 8.8, 12, 16, 22];
var BREAK_CHANCE = [
[4, 20, 50, 120, 300, 800, 2000, 4000, 10000, 16000, 24000, 30000],
[2, 10, 25, 60, 150, 400, 1000, 2000, 5000, 8000, 12000, 15000],
[1.3, 6.7, 17, 40, 100, 267, 667, 1333, 3333, 5333, 8000, 10000],
[0.95, 4.8, 12, 29, 71, 190, 476, 952, 2381, 3810, 5714, 7143],
[0.8, 4, 10, 24, 60, 160, 400, 800, 2000, 3200, 4800, 6000],
[0.65, 3.2, 8.1, 19, 48, 129, 323, 645, 1613, 2581, 3871, 4839],
[0.51, 2.6, 6.4, 15, 38, 103, 256, 513, 1282, 2051, 3077, 3846],
[0.41, 2, 5.1, 12, 31, 82, 204, 408, 1020, 1633, 2449, 3061],
[0.32, 1.6, 4, 9.5, 24, 63, 159, 317, 794, 1270, 1905, 2381],
[0.2, 1, 2.5, 6, 15, 40, 100, 200, 500, 800, 1200, 1500]
];
var LIFESPAN_GAIN = [
null,
[20, 30],
[80, 100],
[200, 240],
[400, 500],
[800, 1000],
[1000, 1200],
[1500, 1800],
[2400, 3600],
[4000, 6000]
];
var XINWU = [
{ id: 'hszx',   name: '火德仙君信物——三昧真火', needCult: 180000, rate: 1.29 },
{ id: 'syqlx',  name: '木灵仙尊信物——青帝木髓',   needCult: 190000, rate: 1.38 },
{ id: 'bhsyz',  name: '水元仙尊信物——太一真水', needCult: 200000, rate: 1.47 },
{ id: 'qsxh',   name: '金精仙尊信物——庚金之精',   needCult: 210000, rate: 1.56 },
{ id: 'tsjys',  name: '土德仙君信物——戊土之精',   needCult: 220000, rate: 1.65 },
{ id: 'tqlgx',  name: '雷部天君信物——九霄神雷', needCult: 230000, rate: 1.74 },
{ id: 'lcmw',   name: '剑仙信物——诛仙剑胎',   needCult: 240000, rate: 1.83 },
{ id: 'hsxg',   name: '丹仙信物——九转金丹',     needCult: 250000, rate: 1.92 },
{ id: 'smgjs',  name: '阵仙信物——周天星斗图', needCult: 260000, rate: 2.01 },
{ id: 'xlzt',   name: '龙仙信物——真龙之珠',   needCult: 270000, rate: 2.1 }
];
var ACHIEVEMENTS = [
{ id: 'innate10', name: '天生仙体',   bonus: 0.1 },
{ id: 'yibian',   name: '灵根异变',   bonus: 0.1 },
{ id: 'hunsheng', name: '成就合体',   bonus: 0.1 },
{ id: 'hundou',   name: '成就大乘', bonus: 0.1 },
{ id: 'feng91',   name: '成就渡劫',   bonus: 0.1 },
{ id: 'chaoji',   name: '渡劫后期',   bonus: 0.1 },
{ id: 'lim99',    name: '渡劫巅峰',   bonus: 0.2 },
{ id: 'shiwan',   name: '十万修为',   bonus: 0.1 },
{ id: 'sanshiwan', name: '三十万修为', bonus: 0.2 },
{ id: 'million',  name: '百万修为',   bonus: 0.3 },
{ id: 'xinwu',    name: '仙人信物',   bonus: 0.1 },
{ id: 'god',      name: '飞升成仙',   bonus: 0.2 },
{ id: 'dujie',    name: '渡过成仙劫',   bonus: 0.3 },
{ id: 'god3',     name: '三次飞升',   bonus: 0.3 },
{ id: 'god10',    name: '十次飞升',   bonus: 0.4 },
{ id: 'god30',    name: '三十次飞升', bonus: 0.5 },
{ id: 'god50',    name: '五十次飞升', bonus: 0.8 },
{ id: 'god100',   name: '百次飞升',   bonus: 1 },
{ id: 'xitong',   name: '系统傍身',   bonus: 1 },
{ id: 'xiandi',   name: '仙帝传承',   bonus: 1.5 }
];
var DATA = {
TALENTS: TALENTS, talentOf: talentOf,
REALMS: REALMS, realmOf: realmOf, layerOf: layerOf, titleOf: titleOf,
INNATE_WEIGHTS: INNATE_WEIGHTS,
CULT_COEF: CULT_COEF,
BREAK_CHANCE: BREAK_CHANCE,
LIFESPAN_GAIN: LIFESPAN_GAIN,
XINWU: XINWU,
ACHIEVEMENTS: ACHIEVEMENTS,
LIFE_MIN: 60, LIFE_MAX: 100,
EVENT_TARGET: 30,
STEADY_TARGET: 50,
XINWU_CHANCE: 0.00003,
FEISHENG_CHANCE: 1 / 1000,
FEISHENG_BONUS_MIN: 1.15,
FEISHENG_BONUS_MAX: 1.45,
XITONG_CHANCE: 5e-9,
XIANDI_CHANCE: 5e-10,
XIANDI_BONUS: 2,
PLAYER_LV_BASE: 50,
FEISHENG_EXP: 1000,
EXP_PER_LVL: 0.5,
EXP_PER_LVL_EARLY: 0.1
};

export default DATA;
