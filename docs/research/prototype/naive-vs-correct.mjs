/**
 * 反面对照：如果「随手拼字符串」会怎样？
 * 用同一批数据，分别用「朴素实现」和「正确实现」生成，再用 node-ical 解析，对比结果
 */
import ical from 'node-ical';
import { buildCalendar, escapeText, foldLine } from './ics.mjs';

const sample = {
	天: {
		data: [
			{ id: 'a', title: '活动A, 第一弹; 第二弹', start_time: '2026-10-01 12:00', end_time: '2026-10-08 12:00' },
			{ id: 'b', title: '【超长标题】' + '中文填充'.repeat(20), start_time: '2026-10-01 12:00', end_time: '2026-10-08 12:00' },
			{ id: 'a', title: '重复ID的活动', start_time: '2026-10-02 12:00', end_time: '2026-10-03 12:00' }
		]
	}
};

/* ── 朴素实现：LF 换行 / 不折行 / 不转义 / 随机 UID / 本地时间直出 ── */
function naive() {
	const L = [];
	L.push('BEGIN:VCALENDAR');
	L.push('VERSION:2.0');
	L.push('PRODID:-//naive//CN');
	for (const act of sample.天.data) {
		L.push('BEGIN:VEVENT');
		L.push(`UID:${Math.random()}@naive`); // ← 随机 UID
		L.push(`DTSTART:${act.start_time.replace(/[-: ]/g, '')}`); // ← 本地时间无 Z、无 TZID
		L.push(`DTEND:${act.end_time.replace(/[-: ]/g, '')}`);
		L.push(`SUMMARY:${act.title}`); // ← 不转义、不折行
		L.push('END:VEVENT');
	}
	L.push('END:VCALENDAR');
	return L.join('\n'); // ← 裸 LF
}

async function tryParse(label, text) {
	// node-ical 的 parseICS 是同步的
	try {
		const data = ical.parseICS(text);
		const evs = Object.values(data).filter((v) => v.type === 'VEVENT');
		console.log(`\n【${label}】`);
		console.log(`  解析        : ✅ 未抛异常`);
		console.log(`  解出事件数  : ${evs.length}（输入 3 条）`);
		// 正确性判定：转义后的 TEXT 里，未转义的裸 , 或 ; 会被解析器当成分隔符而截断标题
		const summaries = evs.map((e) => e.summary || '');
		const expectedHead = '活动A, 第一弹; 第二弹';
		const intact = summaries.filter((s) => s.endsWith(expectedHead));
		console.log(`  转义正确    : ${intact.length}/${summaries.length} 条标题完整保留逗号与分号`);
		summaries.forEach((s) => console.log(`      → ${JSON.stringify(s.slice(0, 46))}`));
		const badTime = evs.filter((e) => !e.start || Number.isNaN(new Date(e.start).getTime()));
		console.log(`  时间解析失败: ${badTime.length} 条`);
		if (evs[0]?.start) console.log(`  首个事件开始: ${new Date(evs[0].start).toISOString()}  ← 注意是否被当成 UTC 而偏移 8 小时`);
		const uids = evs.map((e) => e.uid);
		console.log(`  UID 稳定    : ${new Set(uids).size === uids.length ? '本份内唯一' : '本份内重复'}`);
		return { count: evs.length, intact: intact.length, badTime: badTime.length };
	} catch (err) {
		console.log(`\n【${label}】`);
		console.log(`  解析        : ❌ 抛异常 → ${err.message}`);
		return { count: 0, intact: 0, badTime: 0, failed: true };
	}
}

await tryParse('朴素实现（LF/不折行/不转义/随机UID/本地时间）', naive());

const good = buildCalendar(sample, { now: new Date('2026-10-05T02:00:00Z') });
await tryParse('正确实现（本原型）', good.text);
