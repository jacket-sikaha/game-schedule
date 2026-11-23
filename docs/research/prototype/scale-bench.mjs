/**
 * 规模与性能测试：模拟「13 个游戏 × 全年活动」的完整日历
 * 回答两个问题：
 *   1. 生成的 .ics 有多大？（关系到客户端/缓存的体积上限）
 *   2. 生成一次要烧多少 CPU？（关系到 Workers Free 的 10ms CPU 红线）
 */
import { buildCalendar } from './ics.mjs';

function makeGame(key, n) {
	const data = [];
	for (let i = 0; i < n; i++) {
		const start = new Date(Date.UTC(2026, 0, 1) + i * 36 * 3600 * 1000);
		const end = new Date(start.getTime() + 14 * 24 * 3600 * 1000);
		const p = (d) =>
			`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:00`;
		data.push({
			id: `${key}-${i}`,
			title: `【${key}】第 ${i + 1} 期活动：限时玩法与推荐召唤开启，详情请见游戏内公告`,
			start_time: p(start),
			end_time: p(end),
			banner: `https://cdn.example.com/${key}/${i}.jpg`,
			linkUrl: `https://example.com/${key}/${i}`
		});
	}
	return { code: 200, data };
}

const scenarios = [
	{ label: '当前实况（约 130 事件）', per: 10 },
	{ label: '一年全量（约 500 事件）', per: 40 },
	{ label: '极端压力（约 2000 事件）', per: 154 }
];

console.log('══════════ 规模 / 性能测试 ══════════');
console.log('');
console.log('场景                       输入事件  生成事件  输出字节   avg/事件  生成耗时');

for (const sc of scenarios) {
	const groups = {};
	for (let g = 0; g < 13; g++) groups[`游戏${g}`] = makeGame(`g${g}`, sc.per);

	// 预热
	buildCalendar(groups, { now: new Date() });

	const t0 = process.hrtime.bigint();
	const N = 30;
	let out;
	for (let i = 0; i < N; i++) out = buildCalendar(groups, { now: new Date() });
	const t1 = process.hrtime.bigint();

	const bytes = new TextEncoder().encode(out.text).length;
	const ms = Number(t1 - t0) / 1e6 / N;
	console.log(
		`${sc.label.padEnd(26)} ${String(13 * sc.per).padStart(6)}  ${String(out.eventCount).padStart(8)}  ${String(bytes).padStart(8)}  ${String(Math.round(bytes / out.eventCount)).padStart(8)}  ${ms.toFixed(2)} ms`
	);
}

console.log('');
console.log('参考值：');
console.log('  Workers Free 单次请求 CPU 上限 : 10 ms');
console.log('  Workers Paid 单次请求 CPU 上限 : 30 s (默认)');
console.log('  KV 单 value 上限               : 25 MiB');
console.log('  上述耗时含 ICS 生成，不含抓取与解析上游数据');
