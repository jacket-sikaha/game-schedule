/**
 * 原型驱动：用**线上真实返回**的数据跑一遍 ICS 生成 + 校验
 * 数据来源：2026-10-05 用 web_fetch 抓取的 https://gebc.lee-sikaha.cloudns.ch/*
 */

import { writeFileSync } from 'node:fs';
import { buildCalendar, makeUid } from './ics.mjs';

/* ── 真实样本（直接复制线上响应，未加工）──────────────────────── */

const ak = {
	code: 200,
	data: [
		{ id: '56900', title: '二、“资源收集”关卡限时全天开放', start_time: '2026-09-29 16:00', end_time: '2026-10-20 03:59', banner: 'https://web.hycdn.cn/announce/images/20260923/265179c2651b934cd7d4c952c93c4c49.JPG', linkUrl: '' },
		{ id: '67751', title: '三、锦枫映月签到活动开启', start_time: '2026-09-23 04:00', end_time: '2026-09-30 03:59', banner: 'https://web.hycdn.cn/announce/images/20260911/1382a24d40432b71eba0f17bc571aab4.jpg', linkUrl: '' }
	],
};

// /ba 正常形状
const ba = {
	code: 200,
	data: [
		{ id: 1962, title: '【预告】限时活动：夏日天空的约定', start_time: '2026-09-24 04:00', end_time: '2026-10-08 13:59', banner: 'https://webcnstatic.yostar.net/ba_cn_web/prod/upload/news/Ic1M6quR.png', linkUrl: 'https://bluearchive-cn.com/news/1962' },
		{ id: 1943, title: '【预告】3★自选招募即将开启！', start_time: '2026-09-24 04:00', end_time: '2027-06-10 13:59', banner: 'https://webcnstatic.yostar.net/ba_cn_web/prod/upload/news/tNYKZEKc.png', linkUrl: 'https://bluearchive-cn.com/news/1943' }
	],
};

// /mc 真实重复 id（1554479052247040000 出现两次）
const mc = {
	code: 200,
	data: [
		{ id: '1554479052247040000', title: '回音盈域', start_time: '2026-10-15 04:00', end_time: '2026-10-22 03:59', banner: 'https://prod-alicdn-community.kurobbs.com/forum/4a0da9e2c8134304980f2403d33c083320260929.jpg' },
		{ id: '1554479052247040000', title: '声弦涤荡', start_time: '2026-11-04 04:00', end_time: '2026-11-11 03:59', banner: 'https://prod-alicdn-community.kurobbs.com/forum/c1670ca1bd43479f8c3cb60da1c51ca720260929.jpg' },
		{ id: '1554468927538642944', title: '团团勇者大乱斗', start_time: '2026-09-30 11:00', end_time: '2026-11-11 11:59', linkUrl: 'https://www.kurobbs.com/mc/post/1498788444415365120' }
	],
};

// /fgo 真实形状：banner 是协议相对 URL
const fgo = {
	code: 200,
	data: [
		{ id: 18406, title: '【限时】「唠唠叨叨新选组 THE END 近藤勇推荐召唤」！', start_time: '2026-09-30 19:00', end_time: '2026-10-15 13:59', banner: '//i0.hdslb.com/bfs/game/ff278b95ddb085a9ff4e2f54f1f0de1272effd31.png', linkUrl: 'https://game.bilibili.com/fgo/news.html#!news/1/1/18406' }
	],
};

// /genshin 真实形状：裸对象 { list: [...] }，不套 code/data
const genshin = {
	list: [
		{ ann_id: 21886, title: '「银翎溯月，玄鸟结璘」活动：参与获取活动专属武器「单手剑·银釭」', start_time: '2026-09-22 12:00:00', end_time: '2026-10-12 03:59:59', banner: 'https://sdk-webstatic.mihoyo.com/upload/ann/2026/09/11/6788dbf108de54a3c269127dbd14cef1_3820972780871244293_transformed.jpg' },
		{ ann_id: 21812, title: '「狩猎开始！」活动：推进魔神任务「无神怜爱的雪国」，邀请「疾掠弋缇·阿罗夏(雷)」', start_time: '2026-08-10 12:00:00', end_time: '2027-07-14 07:00:00', banner: '' }
	],
};

/* ── 对抗性边界样本（模拟本项目已知的数据缺陷）───────────────── */
const adversarial = {
	code: 200,
	data: [
		// 1. 标题含逗号/分号/反斜杠/换行 —— 转义测试
		{ id: 'adv-1', title: '活动A, 第一弹; 第二弹\\ 和\n换行', start_time: '2026-10-01 12:00', end_time: '2026-10-08 12:00' },
		// 2. 超长中文标题 —— 折行 + 多字节不切断测试
		{ id: 'adv-2', title: '【超长标题压力测试】' + '此为用于验证 UTF-8 折行是否会在多字节字符中间切断的填充文本。'.repeat(5), start_time: '2026-10-01 12:00', end_time: '2026-10-08 12:00' },
		// 3. end_time 缺失 —— 兜底
		{ id: 'adv-3', title: '没有结束时间的活动', start_time: '2026-10-01 12:00', end_time: '' },
		// 4. end_time 非法
		{ id: 'adv-4', title: '结束时间格式非法', start_time: '2026-10-01 12:00', end_time: 'TBD' }
	]
};

/* ── 组装 & 生成 ─────────────────────────────────────────────── */
const groups = { 明日方舟: ak, 蔚蓝档案: ba, 鸣潮: mc, FGO: fgo, 原神: genshin, 对抗样本: adversarial };

const t0 = process.hrtime.bigint();
const { text, eventCount, skipped } = buildCalendar(groups, {
	now: new Date('2026-10-05T02:00:00Z'),
	ttlHours: 6
});
const t1 = process.hrtime.bigint();

writeFileSync(new URL('./out.ics', import.meta.url), text, 'utf8');

console.log('══════════ 生成结果 ══════════');
console.log(`输入游戏组     : ${Object.keys(groups).length}`);
console.log(`生成 VEVENT    : ${eventCount}`);
console.log(`跳过(非法/重复): ${skipped}`);
console.log(`输出字节       : ${new TextEncoder().encode(text).length}`);
console.log(`生成耗时       : ${Number(t1 - t0) / 1e6} ms`);
console.log(`事件平均字节   : ${Math.round(new TextEncoder().encode(text).length / Math.max(eventCount, 1))}`);

/* ── UID 稳定性测试：同输入连跑两次，UID 必须完全一致 ── */
const run1 = buildCalendar(groups, { now: new Date('2026-10-05T02:00:00Z') }).text;
const run2 = buildCalendar(groups, { now: new Date('2026-10-20T09:00:00Z') }).text; // 不同时刻
const uids = (t) => [...t.matchAll(/^UID:(.+)$/gm)].map((m) => m[1]);
const a = uids(run1), b = uids(run2);
const stable = a.length === b.length && a.every((u, i) => u === b[i]);
console.log('');
console.log('══════════ UID 稳定性测试 ══════════');
console.log(`两次生成的 UID 序列是否一致: ${stable ? '✅ 一致（订阅不会产生重复事件）' : '❌ 不一致（客户端每次刷新都会重复）'}`);

/* ── 对照：若沿用 endfield 的 Math.random() 生成 id 会怎样 ── */
const randA = uids(buildCalendar({ x: { data: [{ id: Math.random().toString(36), title: '随机ID活动', start_time: '2026-10-01 12:00', end_time: '2026-10-02 12:00' }] } }).text);
const randB = uids(buildCalendar({ x: { data: [{ id: Math.random().toString(36), title: '随机ID活动', start_time: '2026-10-01 12:00', end_time: '2026-10-02 12:00' }] } }).text);
console.log(`对照(随机 id): ${randA[0] === randB[0] ? '一致' : '❌ 两次不同 → ' + randA[0] + ' vs ' + randB[0]}`);
