import { describe, it, expect, vi } from 'vitest';
import { getZzzEventData, handleZzzData, stripHtml } from '../zzz/util';
import { ZzzAnnItem, ZzzAnnListResponse, ZzzAnnPicItem } from '../zzz/DataType';

const makeAnnItem = (overrides: Partial<ZzzAnnItem>): ZzzAnnItem => ({
	ann_id: 1300,
	title: '<p style="white-space: pre-wrap;">「全新放送」活动说明</p>',
	subtitle: '「全新放送」活动说明',
	banner: 'https://sdk-webstatic.mihoyo.com/upload/ann/x/banner.jpg',
	tag_label: '福利活动',
	type_label: '游戏公告',
	start_time: '2026-09-08 13:15:00',
	end_time: '2026-10-20 03:59:59',
	...overrides,
});

const makePicItem = (overrides: Partial<ZzzAnnPicItem>): ZzzAnnPicItem => ({
	...makeAnnItem({
		ann_id: 241,
		title: '<p style="white-space: pre-wrap;">「『弹球勇者』哐哐当！」活动说明</p>',
		subtitle: '「『弹球勇者』哐哐当！」活动说明',
		banner: '',
		type_label: '丽都资讯',
		start_time: '2026-09-08 13:30:00',
		end_time: '2026-10-19 03:59:59',
	}),
	pic_type: 2,
	img: 'https://sdk-webstatic.mihoyo.com/upload/ann/x/card.jpg',
	...overrides,
});

const makeResponse = (textItems: ZzzAnnItem[], picItems: ZzzAnnPicItem[]): ZzzAnnListResponse => ({
	retcode: 0,
	message: 'OK',
	data: {
		list: [{ list: textItems, type_id: 3, type_label: '游戏公告' }],
		pic_list: [{ type_list: [{ list: picItems, pic_type: 2 }], type_id: 1, type_label: '丽都资讯' }],
		timezone: 8,
	},
});

describe('zzz', () => {
	describe('stripHtml', () => {
		it('去除 p 标签与样式，保留文本', () => {
			expect(stripHtml('<p style="white-space: pre-wrap;">「全新放送」活动说明</p>')).toBe('「全新放送」活动说明');
		});

		it('转换 &amp; 实体', () => {
			expect(stripHtml('<p>A &amp; B</p>')).toBe('A & B');
		});
	});

	describe('handleZzzData', () => {
		it('合并文字公告与丽都资讯卡片为日历活动', () => {
			const result = handleZzzData(makeResponse([makeAnnItem({})], [makePicItem({})]));
			expect(result).toHaveLength(2);
			const activity = result.find((item) => item.id === 1300)!;
			expect(activity.title).toBe('「全新放送」活动说明');
			expect(activity.start_time).toBe('2026-09-08 13:15');
			expect(activity.end_time).toBe('2026-10-20 03:59');
			expect(activity.banner).toBe('https://sdk-webstatic.mihoyo.com/upload/ann/x/banner.jpg');
			expect(activity.tag).toBe('福利活动');
		});

		it('丽都资讯卡片无 banner 时回退使用 img 字段', () => {
			const result = handleZzzData(makeResponse([], [makePicItem({})]));
			expect(result[0].banner).toBe('https://sdk-webstatic.mihoyo.com/upload/ann/x/card.jpg');
		});

		it('过滤常驻公告（展示窗口超过 90 天）', () => {
			const permanent = makeAnnItem({
				ann_id: 242,
				title: '<p>防沉迷系统公告</p>',
				start_time: '2024-07-03 00:00:00',
				end_time: '2035-07-03 00:00:00',
			});
			const result = handleZzzData(makeResponse([makeAnnItem({}), permanent], []));
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(1300);
		});

		it('过滤无标题条目（如轮播大图）', () => {
			const carousel = makePicItem({ ann_id: 247, title: '', subtitle: '' });
			expect(handleZzzData(makeResponse([], [carousel]))).toHaveLength(0);
		});

		it('文字区与图文区 ann_id 重复时去重', () => {
			const dup = makePicItem({ ann_id: 1300 });
			const result = handleZzzData(makeResponse([makeAnnItem({})], [dup]));
			expect(result).toHaveLength(1);
		});

		it('按开始时间倒序排列', () => {
			const old = makeAnnItem({ ann_id: 1, start_time: '2026-08-26 12:00:00', end_time: '2026-09-14 03:59:00' });
			const result = handleZzzData(makeResponse([old, makeAnnItem({})], []));
			expect(result[0].id).toBe(1300);
			expect(result[1].id).toBe(1);
		});
	});

	describe('getZzzEventData', () => {
		it('mock fetch 正常响应时返回解析结果', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => ({ ok: true, json: async () => makeResponse([makeAnnItem({})], [makePicItem({})]) }) as Response)
			);
			const result = await getZzzEventData('https://announcement-api.mihoyo.com/common/nap_cn/announcement/api/getAnnList');
			expect(result).toHaveLength(2);
			expect(fetch).toHaveBeenCalledTimes(1);
			vi.unstubAllGlobals();
		});

		it('HTTP 错误时抛出异常', async () => {
			vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as Response));
			await expect(getZzzEventData('https://example.com')).rejects.toThrow('500');
			vi.unstubAllGlobals();
		});

		it('retcode 非 0 时抛出异常', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => ({ ok: true, json: async () => ({ retcode: -1, message: 'error', data: null }) }) as Response)
			);
			await expect(getZzzEventData('https://example.com')).rejects.toThrow('error');
			vi.unstubAllGlobals();
		});
	});
});
