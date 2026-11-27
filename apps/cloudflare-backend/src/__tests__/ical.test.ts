import { describe, expect, it, vi } from 'vitest';
import {
	buildGameCalendar,
	foldIcsLine,
	getIcsResponse,
	IcsEnv,
	normalizeIcsActivities,
	toIcsUtcStamp,
} from '../ical';

const samplePayload = {
	data: [
		{
			id: 10001,
			title: '限时活动, 测试; 标题',
			start_time: '2026-11-27 12:00',
			end_time: '2026-11-28 03:59',
			banner: '//example.com/banner.png',
			linkUrl: 'https://example.com/activity/10001',
		},
		{
			id: 10002,
			title: '缺少开始时间',
			end_time: '2026-11-28 03:59',
		},
		{
			id: 10003,
			title: '非法开始时间',
			start_time: 'invalid-date',
			end_time: '2026-11-28 03:59',
		},
	],
};

describe('iCal', () => {
	it('将项目本地时间转换为 UTC iCalendar 时间', () => {
		expect(toIcsUtcStamp('2026-11-27 12:00')).toBe('20261127T040000Z');
		expect(toIcsUtcStamp('2026-11-28 03:59:30')).toBe('20261127T195930Z');
		expect(toIcsUtcStamp('not-a-date')).toBeNull();
	});

	it('按 RFC 5545 对长行做 75 octets 折行', () => {
		const folded = foldIcsLine(`SUMMARY:${'长'.repeat(50)}`);
		for (const line of folded.split('\r\n')) {
			expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
		}
	});

	it('规范化多种上游返回结构并保留供时间校验的条目', () => {
		const normalized = normalizeIcsActivities('fgo', samplePayload);
		expect(normalized).toHaveLength(2);
		expect(normalized[0]).toMatchObject({
			id: 10001,
			title: '限时活动, 测试; 标题',
			start_time: '2026-11-27 12:00',
		});
		expect(normalized[1]).toMatchObject({
			id: 10003,
			title: '非法开始时间',
			start_time: 'invalid-date',
		});
	});

	it('生成合法且可稳定订阅的单游戏 VCALENDAR', () => {
		const result = buildGameCalendar('fgo', samplePayload, new Date('2026-11-27T00:00:00Z'));

		expect(result.eventCount).toBe(1);
		expect(result.skipped).toBe(1);
		expect(result.text.endsWith('\r\n')).toBe(true);
		expect(result.text).toContain('BEGIN:VCALENDAR');
		expect(result.text).toContain('BEGIN:VEVENT');
		expect(result.text).toContain('SUMMARY:[FGO] 限时活动\\, 测试\\; 标题');
		expect(result.text).toContain('DTSTART:20261127T040000Z');
		expect(result.text).toContain('DTEND:20261127T195900Z');
		expect(result.text).toContain('ATTACH;FMTTYPE=image/png:https://example.com/banner.png');

		const uids = [...result.text.matchAll(/^UID:(.+)$/gm)].map((match) => match[1]);
		expect(uids).toHaveLength(1);
		expect(buildGameCalendar('fgo', samplePayload).text).toContain(`UID:${uids[0]}`);

		for (const line of result.text.split('\r\n')) {
			if (line) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
		}
	});

	it('从 KV 返回 .ics，并生成 Workers Cache 所需的响应头', async () => {
		const text = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'END:VCALENDAR',
			'',
		].join('\r\n');
		const kv = {
			getWithMetadata: vi.fn().mockResolvedValue({
				value: text,
				metadata: {
					generatedAt: '2026-11-27T00:00:00.000Z',
					eventCount: 0,
				},
			}),
			put: vi.fn(),
		};
		const env = { ICS_KV: kv } as unknown as IcsEnv;
		const response = await getIcsResponse(
			'fgo',
			new Request('https://example.com/ics/fgo'),
			env,
		);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('text/calendar');
		expect(response.headers.get('Cache-Control')).toContain('max-age=1800');
		expect(response.headers.get('Cache-Tag')).toBe('ics:fgo');
		expect(response.headers.get('ETag')).toMatch(/^W\/"[0-9a-f]{8}"$/);
		expect(response.headers.get('Last-Modified')).toBe('Fri, 27 Nov 2026 00:00:00 GMT');
		expect(await response.text()).toBe(text);

		const notModified = await getIcsResponse(
			'fgo',
			new Request('https://example.com/ics/fgo', {
				headers: { 'If-None-Match': response.headers.get('ETag') ?? '' },
			}),
			env,
		);
		expect(notModified.status).toBe(304);
	});
});
