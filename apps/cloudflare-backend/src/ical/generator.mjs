export const ICS_GAME_KEYS = [
	'pcr',
	'genshin',
	'starrail',
	'zzz',
	'fgo',
	'ak',
	'mc',
	'pns',
	'ba',
	'ba-jp',
	'nikke',
	'cbjq',
	'endfield',
	'nte',
	'umamusume',
];

export const ICS_NAMESPACE = 'ics:v1';
export const ICS_CLIENT_MAX_AGE_SECONDS = 1_800;
export const ICS_KV_TTL_SECONDS = 21_600;
export const ICS_REFRESH_HOURS = 3;

const CRLF = '\r\n';
const PRODID = '-//game-events-calendar//iCal//CN';
const UID_DOMAIN = 'game-events-calendar';

const GAME_LABELS = {
	pcr: '公主连结',
	genshin: '原神',
	starrail: '星穹铁道',
	zzz: '绝区零',
	fgo: 'FGO',
	ak: '明日方舟',
	mc: '鸣潮',
	pns: '战双帕弥什',
	ba: '蔚蓝档案（国服）',
	'ba-jp': '蔚蓝档案（日服）',
	nikke: 'NIKKE: 胜利女神',
	cbjq: '尘白禁区',
	endfield: '明日方舟：终末地',
	nte: '异环',
	umamusume: '闪耀！优俊少女',
};

const normalizeUrl = (value) => {
	if (typeof value !== 'string' || !value) return undefined;
	return value.startsWith('//') ? `https:${value}` : value;
};

const stableId = (gameKey, upstreamId, title) => {
	const normalizeTitle = (value) =>
		value.replace(/\s+/g, ' ').replace(/\u3000/g, ' ').trim().toLowerCase();
	const raw = `${gameKey}:${upstreamId ?? ''}:${normalizeTitle(String(title ?? ''))}`;
	let hash = 0x811c9dc5;
	for (let index = 0; index < raw.length; index += 1) {
		hash ^= raw.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return `${gameKey}_${hash.toString(16).padStart(8, '0')}`;
};

/**
 * 各游戏接口的返回形状并不完全一致：有的是数组，有的是 { data }，
 * 有的是 { list }。这里只在生成 iCal 时做一次收敛，不改变现有 JSON API。
 */
export const normalizeIcsActivities = (gameKey, payload) => {
	const rows = Array.isArray(payload)
		? payload
		: Array.isArray(payload?.data)
			? payload.data
			: Array.isArray(payload?.list)
				? payload.list
				: Array.isArray(payload?.data?.list)
					? payload.data.list
					: [];

	return rows
		.map((row) => {
			const title = String(row?.title ?? row?.subtitle ?? row?.name ?? '').trim();
			const start = row?.start_time ?? row?.startTime;
			if (!title || !start) return null;

			const rawId = row?.id ?? row?.ann_id ?? row?.activityId;
			const id = rawId === undefined || rawId === null
				? stableId(gameKey, undefined, title)
				: rawId;

			return {
				id,
				title,
				start_time: String(start),
				end_time: row?.end_time ?? row?.endTime
					? String(row.end_time ?? row.endTime)
					: undefined,
				banner: normalizeUrl(row?.banner),
				linkUrl: normalizeUrl(row?.linkUrl ?? row?.url),
			};
		})
		.filter((item) => item !== null);
};

export const escapeIcsText = (value) =>
	String(value ?? '')
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r\n|\r|\n/g, '\\n');

/**
 * RFC 5545 按 75 octets 折行。for...of 按码点迭代，避免切断 UTF-8 字符。
 */
export const foldIcsLine = (line, limit = 75) => {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(line);
	if (bytes.length <= limit) return line;

	const parts = [];
	let current = '';
	let currentBytes = 0;
	let budget = limit;

	for (const char of line) {
		const charBytes = encoder.encode(char).length;
		if (currentBytes + charBytes > budget) {
			parts.push(current);
			current = char;
			currentBytes = charBytes;
			budget = limit - 1;
		} else {
			current += char;
			currentBytes += charBytes;
		}
	}
	parts.push(current);

	return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join(CRLF);
};

/**
 * 项目内时间均为 Asia/Shanghai 的本地时间。日历输出统一转成 UTC，
 * 避免不同客户端对 TZID/VTIMEZONE 的支持差异。
 */
export const toIcsUtcStamp = (localDate) => {
	const match = String(localDate).match(
		/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/,
	);
	if (!match) return null;

	const [, year, month, day, hour, minute, second] = match;
	const utcMs =
		Date.UTC(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour),
			Number(minute),
			Number(second ?? 0),
		) - 8 * 60 * 60 * 1000;
	const date = new Date(utcMs);
	return Number.isNaN(date.getTime()) ? null : formatUtcStamp(date);
};

const formatUtcStamp = (date) => {
	const pad = (value) => String(value).padStart(2, '0');
	return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
		date.getUTCDate(),
	)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
		date.getUTCSeconds(),
	)}Z`;
};

const addHourToStamp = (stamp) => {
	const date = new Date(
		Date.UTC(
			Number(stamp.slice(0, 4)),
			Number(stamp.slice(4, 6)) - 1,
			Number(stamp.slice(6, 8)),
			Number(stamp.slice(9, 11)),
			Number(stamp.slice(11, 13)),
			Number(stamp.slice(13, 15)),
		),
	);
	return formatUtcStamp(new Date(date.getTime() + 60 * 60 * 1000));
};

const guessMimeType = (url) => {
	if (/\.jpe?g($|\?)/i.test(url)) return 'image/jpeg';
	if (/\.png($|\?)/i.test(url)) return 'image/png';
	if (/\.webp($|\?)/i.test(url)) return 'image/webp';
	return 'image/jpeg';
};

export const buildGameCalendar = (gameKey, payload, now = new Date()) => {
	const activities = normalizeIcsActivities(gameKey, payload);
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${PRODID}`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeIcsText(`Game Events Calendar - ${GAME_LABELS[gameKey]}`)}`,
		'X-WR-TIMEZONE:Asia/Shanghai',
		`REFRESH-INTERVAL;VALUE=DURATION:PT${ICS_REFRESH_HOURS}H`,
		`X-PUBLISHED-TTL:PT${ICS_REFRESH_HOURS}H`,
	];

	const seen = new Set();
	const dtstamp = formatUtcStamp(now);
	let skipped = 0;

	for (const activity of activities) {
		const start = toIcsUtcStamp(activity.start_time);
		if (!start) {
			skipped += 1;
			continue;
		}

		const uid = `${stableId(gameKey, activity.id, activity.title)}@${UID_DOMAIN}`;
		if (seen.has(uid)) {
			skipped += 1;
			continue;
		}
		seen.add(uid);

		const end = activity.end_time ? toIcsUtcStamp(activity.end_time) : null;
		const dtend = end && end > start ? end : addHourToStamp(start);
		const summary = `[${GAME_LABELS[gameKey]}] ${activity.title}`;
		const description = activity.linkUrl ? `详情：${activity.linkUrl}` : '';

		lines.push('BEGIN:VEVENT');
		lines.push(`UID:${uid}`);
		lines.push(`DTSTAMP:${dtstamp}`);
		lines.push(`DTSTART:${start}`);
		lines.push(`DTEND:${dtend}`);
		lines.push(`SUMMARY:${escapeIcsText(summary)}`);
		if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
		if (activity.linkUrl) lines.push(`URL:${activity.linkUrl}`);
		if (activity.banner) {
			lines.push(`ATTACH;FMTTYPE=${guessMimeType(activity.banner)}:${activity.banner}`);
			lines.push(`IMAGE;VALUE=URI;DISPLAY=BADGE:${activity.banner}`);
		}
		lines.push(`CATEGORIES:${escapeIcsText(gameKey)}`);
		lines.push('TRANSP:TRANSPARENT');
		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');

	return {
		text: lines.map((line) => foldIcsLine(line)).join(CRLF) + CRLF,
		eventCount: seen.size,
		skipped,
	};
};
