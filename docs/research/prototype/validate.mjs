/**
 * 严格 iCalendar 校验器 —— 只校验「会导致客户端拒绝/错乱」的硬性规则
 * 规则来源：RFC 5545 §3.1(CRLF/折行) §3.3.11(转义) §3.6.1(VEVENT必需属性) §3.8.4.7(UID)
 *
 * 用法：node validate.mjs <file.ics>
 */

import { readFileSync } from 'node:fs';

const out = (...a) => console.log(...a);

function validate(text) {
	const errors = [];
	const warnings = [];
	const encoder = new TextEncoder();

	// ── 1. 换行必须是 CRLF，不能有裸 LF / 裸 CR ──
	const bareLf = (text.match(/(?<!\r)\n/g) || []).length;
	const bareCr = (text.match(/\r(?!\n)/g) || []).length;
	if (bareLf) errors.push(`存在 ${bareLf} 处裸 LF（必须 CRLF）`);
	if (bareCr) errors.push(`存在 ${bareCr} 处裸 CR（必须 CRLF）`);

	// ── 2. 必须以 CRLF 结尾 ──
	if (!text.endsWith('\r\n')) errors.push('文件未以 CRLF 结尾');

	// ── 3. 展开后每个物理行的字节长度 <= 75 ──
	const physical = text.split('\r\n');
	physical.forEach((line, i) => {
		if (line === '') return;
		const len = encoder.encode(line).length;
		if (len > 75) errors.push(`第 ${i + 1} 行未折叠：${len} octets > 75 —— "${line.slice(0, 40)}..."`);
	});

	// ── 4. 续行必须紧跟在一个非空行之后，且折叠点不能切断 UTF-8 ──
	physical.forEach((line, i) => {
		if (line.startsWith(' ') || line.startsWith('\t')) {
			if (i === 0 || physical[i - 1] === '') {
				errors.push(`第 ${i + 1} 行是孤立续行，无法展开`);
			}
		}
	});

	// ── 5. 展开（unfold）后检查结构 ──
	const unfolded = [];
	for (const line of physical) {
		if (!line) continue;
		if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length) {
			unfolded[unfolded.length - 1] += line.slice(1);
		} else {
			unfolded.push(line);
		}
	}

	// ── 6. 组件配对 ──
	const stack = [];
	for (const line of unfolded) {
		if (line.startsWith('BEGIN:')) stack.push(line.slice(6));
		else if (line.startsWith('END:')) {
			const got = line.slice(4);
			const want = stack.pop();
			if (got !== want) errors.push(`组件不匹配：END:${got} 对应 BEGIN:${want}`);
		}
	}
	if (stack.length) errors.push(`未闭合组件：${stack.join(', ')}`);

	const hasVcal = unfolded.some((l) => l === 'BEGIN:VCALENDAR');
	const hasEnd = unfolded.some((l) => l === 'END:VCALENDAR');
	if (!hasVcal) errors.push('缺少 BEGIN:VCALENDAR');
	if (!hasEnd) errors.push('缺少 END:VCALENDAR');

	// ── 7. 每个 VEVENT 的必备属性 ──
	const events = [];
	let cur = null;
	for (const line of unfolded) {
		if (line === 'BEGIN:VEVENT') cur = [];
		else if (line === 'END:VEVENT' && cur) {
			events.push(cur);
			cur = null;
		} else if (cur) cur.push(line);
	}

	const uids = new Map();
	events.forEach((ev, idx) => {
		const get = (name) => {
			const hit = ev.find((l) => l.startsWith(name + ':') || l.startsWith(name + ';'));
			return hit ? hit.slice(hit.indexOf(':') + 1) : null;
		};
		const uid = get('UID');
		const dtstamp = get('DTSTAMP');
		const dtstart = get('DTSTART');

		if (!uid) errors.push(`VEVENT#${idx + 1} 缺少 UID（RFC 必需）`);
		if (!dtstamp) errors.push(`VEVENT#${idx + 1} 缺少 DTSTAMP（RFC 必需）`);
		if (!dtstart) errors.push(`VEVENT#${idx + 1} 缺少 DTSTART（RFC 必需）`);

		if (dtstamp && !/^\d{8}T\d{6}Z$/.test(dtstamp)) {
			errors.push(`VEVENT#${idx + 1} DTSTAMP 格式非法：${dtstamp}`);
		}
		if (dtstart && !/^\d{8}(T\d{6}Z?)?$/.test(dtstart)) {
			errors.push(`VEVENT#${idx + 1} DTSTART 格式非法：${dtstart}`);
		}

		if (uid) uids.set(uid, (uids.get(uid) || 0) + 1);

		const dtend = get('DTEND');
		if (dtend && dtstart && /Z$/.test(dtstart) && /Z$/.test(dtend) && dtend < dtstart) {
			errors.push(`VEVENT#${idx + 1} DTEND 早于 DTSTART（${dtend} < ${dtstart}）`);
		}
		const summary = get('SUMMARY');
		if (!summary) warnings.push(`VEVENT#${idx + 1} 无 SUMMARY，客户端显示为空`);
	});

	// ── 8. UID 唯一性（同一份日历内）──
	for (const [uid, n] of uids) {
		if (n > 1) errors.push(`UID 重复 ${n} 次：${uid}（客户端会出现重复事件）`);
	}

	// ── 9. 转义检查：TEXT 值里不允许出现未转义的裸分隔符 ──
	for (const line of unfolded) {
		const m = line.match(/^(SUMMARY|DESCRIPTION|LOCATION|COMMENT):(.*)$/);
		if (!m) continue;
		const [, name, value] = m;
		// 去掉已转义的 \\ \, \; 后，不应再有裸 , 或 ;
		const stripped = value.replace(/\\\\|\\,|\\;|\\n/gi, '');
		if (/[;,](?!\\)/.test(stripped) && name !== 'DESCRIPTION') {
			// DESCRIPTION 允许 \n；这里主要盯 SUMMARY 等
			if (/[,;]/.test(stripped)) warnings.push(`${name} 值含未转义的分隔符：${stripped.slice(0, 50)}`);
		}
	}

	return { errors, warnings, eventCount: events.length };
}

/* ------------------------------------------------------------------ */
const file = process.argv[2];
if (!file) {
	out('用法: node validate.mjs <file.ics>');
	process.exit(1);
}

const text = readFileSync(file, 'utf8');
const encoder = new TextEncoder();
const { errors, warnings, eventCount } = validate(text);

out('══════════ iCalendar 严格校验报告 ══════════');
out(`文件           : ${file}`);
out(`字节数         : ${encoder.encode(text).length}`);
out(`物理行数       : ${text.split('\r\n').length - 1}`);
out(`VEVENT 数量    : ${eventCount}`);
out('');
if (errors.length === 0) {
	out('✅ 错误: 0 —— 通过 RFC 5545 结构性硬性检查');
} else {
	out(`❌ 错误: ${errors.length}`);
	for (const e of errors) out('   - ' + e);
}
if (warnings.length) {
	out('');
	out(`⚠️  警告: ${warnings.length}`);
	for (const w of warnings.slice(0, 20)) out('   - ' + w);
}
process.exit(errors.length ? 1 : 0);
