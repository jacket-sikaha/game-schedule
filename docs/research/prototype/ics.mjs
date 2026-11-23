/**
 * 订阅型 iCalendar(RFC 5545) 生成器 —— 可行性原型
 *
 * 目标：验证「把本项目 13 个游戏接口的数据，在 Cloudflare Worker 里拼成一份可供
 * 客户端订阅的 .ics」在协议层面是否可行，并把踩坑点固化成代码。
 *
 * 约束：零依赖（Workers 上体积/启动时间敏感，手写比引 ical-generator 更可控）
 *
 * 关键实现点：
 *  1. 换行必须 CRLF (RFC 5545 §3.1)
 *  2. 内容行 >75 octets 必须折叠，且折叠不能切断 UTF-8 多字节字符
 *  3. TEXT 值需转义 \ ; , 和换行
 *  4. UID 必须稳定（同一活动每次生成必须同 UID），否则客户端每次刷新都会重
 *  5. 时间统一转 UTC(Z) 输出，规避各客户端对 TZID/VTIMEZONE 支持不一致
 */

const CRLF = '\r\n';
const PRODID = '-//game-events-calendar//iCal Feasibility Prototype//CN';
const CAL_NAME = '游戏活动日历';

/* ------------------------------------------------------------------ *
 * 1. TEXT 值转义 (RFC 5545 §3.3.11)
 * ------------------------------------------------------------------ */
export function escapeText(value) {
	return String(value ?? '')
		.replace(/\\/g, '\\\\') // 反斜杠要最先处理
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r\n|\r|\n/g, '\\n');
}

/* ------------------------------------------------------------------ *
 * 2. 按 75 octets 折行 (RFC 5545 §3.1)
 *    注意：必须按 UTF-8 字节数算，且不能在多字节字符中间切开
 * ------------------------------------------------------------------ */
export function foldLine(line, limit = 75) {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(line);
	if (bytes.length <= limit) return line;

	const parts = [];
	let current = '';
	let currentBytes = 0;
	// 首行 75 octets，续行要留 1 octet 给前导空格
	let budget = limit;

	// 用 for...of 按「码点」迭代，天然不会切开代理对/多字节字符
	for (const ch of line) {
		const chBytes = encoder.encode(ch).length;
		if (currentBytes + chBytes > budget) {
			parts.push(current);
			current = ch;
			currentBytes = chBytes;
			budget = limit - 1; // 续行：内容 + 1 空格 <= 75
		} else {
			current += ch;
			currentBytes += chBytes;
		}
	}
	parts.push(current);

	// 续行前加一个空格
	return parts.map((p, i) => (i === 0 ? p : ' ' + p)).join(CRLF);
}

/* ------------------------------------------------------------------ *
 * 3. 时间处理
 *    项目里所有时间都是 Asia/Shanghai 本地时间字符串 "YYYY-MM-DD HH:mm"
 *    Asia/Shanghai 现代无夏令时，固定 UTC+8，所以可以直接减 8 小时得到 UTC
 * ------------------------------------------------------------------ */
export function toUtcStamp(localStr) {
	const m = String(localStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
	if (!m) return null;
	const [, y, mo, d, h, mi, s] = m;
	const utcMs = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0)) - 8 * 3600 * 1000;
	const t = new Date(utcMs);
	if (Number.isNaN(t.getTime())) return null;
	const p = (n) => String(n).padStart(2, '0');
	return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}T${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}Z`;
}

/* ------------------------------------------------------------------ *
 * 4. UID 稳定性 —— 订阅型日历的生死线
 *    用「游戏 + 上游 id」确定性生成，绝不使用随机数
 * ------------------------------------------------------------------ */
export function makeUid(gameKey, activityId, domain = 'game-events-calendar') {
	const raw = `${gameKey}:${activityId}`;
	// 简单确定性 hash（FNV-1a），避免 UID 里出现中文/非法字符
	let h = 0x811c9dc5;
	for (let i = 0; i < raw.length; i++) {
		h ^= raw.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return `${h.toString(16).padStart(8, '0')}-${raw.length}@${domain}`;
}

/* ------------------------------------------------------------------ *
 * 5. 规范化：把项目里 5 种不一致的接口形状收敛成统一结构
 * ------------------------------------------------------------------ */
export function normalizeActivities(gameKey, payload) {
	// /genshin /starrail 返回裸对象 { list: [...] }；其余返回 { code, data: [...] }
	let rows = [];
	if (Array.isArray(payload)) rows = payload;
	else if (Array.isArray(payload?.data)) rows = payload.data;
	else if (Array.isArray(payload?.list)) rows = payload.list;
	else if (Array.isArray(payload?.data?.list)) rows = payload.data.list;

	return rows
		.map((row) => ({
			id: row.id ?? row.ann_id ?? row.activityId,
			title: String(row.title ?? row.subtitle ?? '').trim(),
			start: row.start_time,
			end: row.end_time,
			// 协议相对 URL 必须补协议，否则日历客户端不会去取图
			banner: normalizeUrl(row.banner),
			link: normalizeUrl(row.linkUrl),
			game: gameKey
		}))
		.filter((a) => a.id !== undefined && a.title && a.start);
}

function normalizeUrl(url) {
	if (!url) return '';
	if (url.startsWith('//')) return 'https:' + url;
	return url;
}

/* ------------------------------------------------------------------ *
 * 6. 生成 VCALENDAR
 * ------------------------------------------------------------------ */
export function buildCalendar(groups, opts = {}) {
	const now = opts.now ?? new Date();
	const dtstamp = formatStamp(now);
	const ttlHours = opts.ttlHours ?? 6;

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${PRODID}`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(CAL_NAME)}`,
		'X-WR-TIMEZONE:Asia/Shanghai',
		// 部分客户端（Apple / Outlook）认这两个；Google 忽略
		`REFRESH-INTERVAL;VALUE=DURATION:PT${ttlHours}H`,
		`X-PUBLISHED-TTL:PT${ttlHours}H`
	];

	const seen = new Set();
	let skipped = 0;

	for (const [gameKey, payload] of Object.entries(groups)) {
		for (const act of normalizeActivities(gameKey, payload)) {
			const start = toUtcStamp(act.start);
			const end = toUtcStamp(act.end);
			if (!start) {
				skipped++;
				continue;
			}
			const uid = makeUid(gameKey, act.id);
			if (seen.has(uid)) {
				// 同一游戏内 id 重复（/mc 实测存在）——必须去重，否则客户端出现重复事件
				skipped++;
				continue;
			}
			seen.add(uid);

			const summary = `[${gameKey}] ${act.title}`;
			const descParts = [];
			if (act.link) descParts.push(`详情：${act.link}`);

			lines.push('BEGIN:VEVENT');
			lines.push(`UID:${uid}`);
			lines.push(`DTSTAMP:${dtstamp}`);
			lines.push(`DTSTART:${start}`);
			// 没有结束时间的活动给一个 1 小时兜底，绝不允许 DURATION 为负
			lines.push(`DTEND:${end && end > start ? end : addHourStamp(start)}`);
			lines.push(`SUMMARY:${escapeText(summary)}`);
			if (descParts.length) lines.push(`DESCRIPTION:${escapeText(descParts.join('\n'))}`);
			if (act.link) lines.push(`URL:${act.link}`);
			if (act.banner) {
				// Apple 会把它当事件图片；Google 忽略但不会报错
				lines.push(`ATTACH;FMTTYPE=${guessMime(act.banner)}:${act.banner}`);
				lines.push(`IMAGE;VALUE=URI;DISPLAY=BADGE:${act.banner}`);
			}
			lines.push(`CATEGORIES:${escapeText(gameKey)}`);
			// 游戏活动是「全天/长期进行」语义，标记为透明，避免占用用户的忙碌时间
			lines.push('TRANSP:TRANSPARENT');
			lines.push('END:VEVENT');
		}
	}

	lines.push('END:VCALENDAR');

	return {
		// 每行单独折叠，再用 CRLF join，最后以 CRLF 收尾
		text: lines.map((l) => foldLine(l)).join(CRLF) + CRLF,
		eventCount: seen.size,
		skipped
	};
}

function guessMime(url) {
	if (/\.jpe?g($|\?)/i.test(url)) return 'image/jpeg';
	if (/\.png($|\?)/i.test(url)) return 'image/png';
	if (/\.webp($|\?)/i.test(url)) return 'image/webp';
	return 'image/jpeg';
}

function addHourStamp(stamp) {
	const ms = Date.parse(
		`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:${stamp.slice(13, 15)}Z`
	);
	return formatStamp(new Date(ms + 3600 * 1000));
}

function formatStamp(date) {
	const p = (n) => String(n).padStart(2, '0');
	return `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`;
}
