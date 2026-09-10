import { describe, it, expect, vi } from 'vitest';
import { getNteEventData, handleNtePosts, matchEventTime } from '../nte/util';
import { TajiduoPost } from '../nte/DataType';

const makePost = (overrides: Partial<TajiduoPost>): TajiduoPost => ({
	postId: 477554,
	uid: 10100006,
	type: 1,
	subject: '轨外之境「幽语环线」特别路线即将开启',
	content: '',
	createTime: 1788404542841,
	sendTime: 1788408000069,
	images: [],
	vods: [],
	isDelete: false,
	...overrides,
});

const eventContent = `[图片]
亲爱的乘客，欢迎乘坐海特洛市异象列车「幽灵号」。
▸活动时间：2026/09/04 5:00:00 - 2026/09/18 4:59:59
▸活动奖励：完成挑战即有机会获得[环石]等奖励！`;

describe('nte', () => {
	describe('matchEventTime', () => {
		it('从「活动时间」行提取完整时间区间', () => {
			const times = matchEventTime(eventContent);
			expect(times).not.toBeNull();
			expect(times![0].format('YYYY-MM-DD HH:mm')).toBe('2026-09-04 05:00');
			expect(times![1].format('YYYY-MM-DD HH:mm')).toBe('2026-09-18 04:59');
		});

		it('兼容 ~ 分隔符与无秒格式', () => {
			const times = matchEventTime('活动时间：2026/9/4 05:00 ~ 2026/9/18 04:59');
			expect(times).not.toBeNull();
		});

		it('正文无活动时间时返回 null', () => {
			expect(matchEventTime('「宇宙像一个电台……」')).toBeNull();
		});

		// 以下均为塔吉多官方资讯帖中的真实写法（遍历 300 帖统计得出），
		// 仅支持自带完整年份的格式（跨年由日期本身表达）
		it('格式A：带秒、小时不补零', () => {
			const t = matchEventTime('▸活动时间：2026/09/04 5:00:00 - 2026/09/18 4:59:59');
			expect(t?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-09-04 05:00');
			expect(t?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-09-18 04:59');
		});

		it('格式B：无秒、日不补零', () => {
			const t = matchEventTime('▸活动时间：2026/07/27 05:00 - 2026/08/3 05:59');
			expect(t?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-08-03 05:59');
		});

		it('格式A变体：起点为「版本更新后」，取当天 05:00', () => {
			const t = matchEventTime('▸活动时间：2026/07/23 版本更新后 - 2026/08/13 05:59:59');
			expect(t?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-07-23 05:00');
			expect(t?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-08-13 05:59');
		});

		it('格式H：点号分隔日期、跨年', () => {
			const t = matchEventTime('活动时间：2025.12.23 9:00 - 2026.1.23 11:00');
			expect(t?.[0].format('YYYY-MM-DD HH:mm')).toBe('2025-12-23 09:00');
			expect(t?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-01-23 11:00');
		});

		it('简写无年份格式（C/D/E/F/G）不处理，返回 null', () => {
			expect(matchEventTime('▸活动时间：8月13日版本更新后 - 9月24日05:59')).toBeNull();
			expect(matchEventTime('活动时间：即日起至 2026 年 4 月 22 日 23:59')).toBeNull();
			expect(matchEventTime('活动时间：2026年4月8日~4月20日')).toBeNull();
			expect(matchEventTime('活动时间：4 月 23 日～4 月 29 日 每日10:30-18:00')).toBeNull();
		});

		it('仅识别「活动时间」关键词，其他关键词不命中', () => {
			expect(matchEventTime('▸测试时间：2月4日10:00-2月18日23:59')).toBeNull();
			expect(matchEventTime('✦展会时间：2025年8月1日-8月4日')).toBeNull();
		});
	});

	describe('getNteEventData', () => {
		const mockResponse = (posts: TajiduoPost[], hasMore: boolean, version: number) => ({
			code: 0,
			msg: 'ok',
			ok: true,
			data: { column: { id: 4, columnName: '官方资讯', communityId: 2 }, hasMore, page: 0, posts, version },
		});

		it('hasMore 时按 version 游标拉取第二页', async () => {
			const p1 = makePost({ postId: 1, content: eventContent });
			const p2 = makePost({ postId: 2, content: eventContent });
			const urls: string[] = [];
			vi.stubGlobal(
				'fetch',
				vi.fn(async (input: any) => {
					const url = String(input);
					urls.push(url);
					const isFirst = url.includes('version=0');
					return { ok: true, json: async () => mockResponse(isFirst ? [p1] : [p2], !isFirst ? false : true, isFirst ? 111 : 0) } as Response;
				})
			);
			const result = await getNteEventData('https://bbs-api.tajiduo.com/bbs/wapi/getOfficialPostList?columnId=4&count=20&version=0&officialType=1');
			expect(result).toHaveLength(2);
			expect(urls).toHaveLength(2);
			expect(urls[1]).toContain('version=111');
			vi.unstubAllGlobals();
		});

		it('hasMore=false 时不拉第二页', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => ({ ok: true, json: async () => mockResponse([makePost({ content: eventContent })], false, 0) }) as Response)
			);
			const result = await getNteEventData('https://example.com/api?version=0');
			expect(result).toHaveLength(1);
			expect(fetch).toHaveBeenCalledTimes(1);
			vi.unstubAllGlobals();
		});
	});

	describe('handleNtePosts', () => {
		it('含活动时间的帖子被转换为日历活动', () => {
			const post = makePost({
				content: eventContent,
				images: [{ height: 1080, width: 1920, url: 'https://bbs-upload.tajiduo.com/x/banner.jpeg' }],
			});
			const result = handleNtePosts([post]);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(477554);
			expect(result[0].title).toBe('轨外之境「幽语环线」特别路线即将开启');
			expect(result[0].start_time).toBe('2026-09-04 05:00');
			expect(result[0].end_time).toBe('2026-09-18 04:59');
			expect(result[0].banner).toBe('https://bbs-upload.tajiduo.com/x/banner.jpeg');
			expect(result[0].linkUrl).toContain('postId=477554');
		});

		it('资讯类帖子（无活动时间）被过滤', () => {
			const post = makePost({ subject: '海特洛影像丨灵可', content: '「哔~啵啵啵啵~」\n[图片]' });
			expect(handleNtePosts([post])).toHaveLength(0);
		});

		it('已删除帖子被过滤', () => {
			const post = makePost({ content: eventContent, isDelete: true });
			expect(handleNtePosts([post])).toHaveLength(0);
		});

		it('视频帖无图时回退使用视频封面作 banner', () => {
			const post = makePost({
				content: eventContent,
				type: 3,
				vods: [{ cover: 'https://bbs-upload.tajiduo.com/x/cover.jpg', duration: 85, url: 'v.mp4' }],
			});
			const result = handleNtePosts([post]);
			expect(result[0].banner).toBe('https://bbs-upload.tajiduo.com/x/cover.jpg');
		});
	});
});
