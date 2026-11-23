import { describe, expect, it, vi } from 'vitest';
import {
	getUmamusumeEventData,
	handleUmamusumeNews,
	isUmamusumeEventTitleCandidate,
	matchEventTime,
} from '../umamusume/util';
import { UmamusumeNewsItem } from '../umamusume/DataType';

const makeItem = (overrides: Partial<UmamusumeNewsItem>): UmamusumeNewsItem => ({
	id: 18613,
	title: '闪耀精选 优俊少女招募开放！',
	content: '',
	typeId: 1,
	createTime: '2026-11-18 17:35:18',
	modifyTime: '2026-11-20 12:00:00',
	displayTime: '2026-11-20 12:00:00',
	...overrides,
});

describe('umamusume', () => {
	describe('matchEventTime', () => {
		it('解析完整年月日和起止时间', () => {
			const result = matchEventTime(
				'活动时间：2026/11/20 12:00 - 2026/12/1 11:59',
				'2026-11-20 12:00:00',
			);
			expect(result?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-11-20 12:00');
			expect(result?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-12-01 11:59');
		});

		it('解析无年份时间并继承发布年份', () => {
			const result = matchEventTime(
				'活动时间：11/20 12:00 - 12/1 11:59',
				'2026-11-20 12:00:00',
			);
			expect(result?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-11-20 12:00');
			expect(result?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-12-01 11:59');
		});

		it('兼容中文日期和波浪分隔符', () => {
			const result = matchEventTime(
				'活动时间：2026年11月20日 12:00～2026年12月1日 11:59',
				'2026-11-20 12:00:00',
			);
			expect(result?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-11-20 12:00');
			expect(result?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-12-01 11:59');
		});

		it('维护后默认 05:00', () => {
			const result = matchEventTime(
				'活动时间：2026年11月20日维护后 - 2026年12月1日 11:59',
				'2026-11-20 12:00:00',
			);
			expect(result?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-11-20 05:00');
		});

		it('无活动时间返回 null', () => {
			expect(matchEventTime('亲爱的训练员', '2026-11-20 12:00:00')).toBeNull();
		});

		it('发放时间不再解析为活动区间', () => {
			expect(
				matchEventTime(
				'<p>发放时间：2026年3月3日 12:00 - 2026年4月2日 23:59</p>',
				'2026-03-01 12:00:00',
				),
			).toBeNull();
		});

		it('领取时间解析为活动区间', () => {
			const result = matchEventTime(
				'<p>领取时间：2026年3月3日 12:00 - 2026年4月2日 23:59</p>',
				'2026-03-01 12:00:00',
			);
			expect(result?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-03-03 12:00');
			expect(result?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-04-02 23:59');
		});

		it('仅含维护时间时不当作活动', () => {
			expect(
				matchEventTime(
					'<p>维护时间：2026年11月20日 12:00 - 2026年11月20日 18:00</p>',
					'2026-11-20 10:00:00',
				),
			).toBeNull();
		});

		it('活动期间使用维护后作为起点', () => {
			const result = matchEventTime(
				'<p>活动期间 4/10 维护后 - 4/20 11:59</p>',
				'2026-04-10 12:00:00',
			);
			expect(result?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-04-10 05:00');
			expect(result?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 11:59');
		});
	});

	describe('isUmamusumeEventTitleCandidate', () => {
		it.each([
			'元宵赠礼',
			'“樱花前线北上中！花绽胜利俱乐部”举办！',
			'限定任务“特雷森学园特设 金牌训练员之路！”登场！',
			'养成剧本“青春杯～团队默契绽光芒～”更新！',
			'“The Game Awards 2025”最佳移动游戏 获奖！',
			'2025年5月22日更新维护公告',
			'《闪耀！优俊少女》全平台公测！',
		])('高召回预筛接受：%s', (title) => {
			expect(isUmamusumeEventTitleCandidate(title)).toBe(true);
		});

		it.each([
			'因PHP安全性漏洞的维护公告',
			'公测常见问题FAQ',
			'概率公示活动说明',
			'公平运营活动声明',
			'适龄提示活动说明',
			'《闪耀！优俊少女》手游随机抽取类玩法概率公示',
			'Ver1.20.6版本平衡性调整公告',
			'《闪耀！优俊少女》游戏公平运营声明',
		])('明显非活动标题被预筛排除：%s', (title) => {
			expect(isUmamusumeEventTitleCandidate(title)).toBe(false);
		});
	});

	describe('handleUmamusumeNews', () => {
		it('解析含活动时间的公告', () => {
			const item = makeItem({
				content: '<p>活动时间：2026年11月20日 12:00 - 2026年12月1日 11:59</p>',
			});
			const result = handleUmamusumeNews([item]);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(18613);
			expect(result[0].start_time).toBe('2026-11-20 12:00');
			expect(result[0].end_time).toBe('2026-12-01 11:59');
			expect(result[0].linkUrl).toContain('18613');
		});

		it('最终响应不包含完整正文 content', () => {
			const item = makeItem({
				content: '<p>活动时间：2026年11月20日 12:00 - 2026年12月1日 11:59</p>',
			});
			const [result] = handleUmamusumeNews([item]);
			expect(result).not.toHaveProperty('content');
			expect(result).toHaveProperty('range');
			expect(result).toHaveProperty('start_time');
			expect(result).toHaveProperty('end_time');
			expect(result).toHaveProperty('linkUrl');
		});

		it('过滤无活动时间的公告', () => {
			const item = makeItem({ content: '<p>感谢各位训练员的支持</p>' });
			expect(handleUmamusumeNews([item])).toHaveLength(0);
		});

		it('正文规则接受标题不含旧关键词的赠礼活动', () => {
			const item = makeItem({
				title: '元宵赠礼',
				content: '<p>领取时间：2026年3月3日 12:00 - 2026年4月2日 23:59</p>',
			});
			expect(handleUmamusumeNews([item])).toHaveLength(1);
		});
	});

	describe('getUmamusumeEventData', () => {
		it('使用正确参数且只拉取一页', async () => {
			const urls: string[] = [];
			let listCount = 0;
			vi.stubGlobal(
				'fetch',
				vi.fn(async (input: any, init?: RequestInit) => {
					const url = new URL(String(input));
					urls.push(url.toString());
					if (init?.method === 'POST') {
						const body = JSON.parse(String(init.body)) as { activityId: number };
						return {
							ok: true,
							json: async () => ({
								code: 0,
								data: makeItem({
									id: body.activityId,
									content: '<p>活动时间：2026/11/20 12:00 - 2026/12/1 11:59</p>',
								}),
							}),
						} as Response;
					}
					const isFirst = url.searchParams.get('pageNum') === '1';
					listCount = isFirst ? 20 : 40;
					return {
						ok: true,
						json: async () => ({
							code: 0,
							totalNum: 2,
							pageNo: Number(url.searchParams.get('pageNum')),
							data: Array.from({ length: 20 }, (_, index) =>
								makeItem({
									id: isFirst ? index + 1 : 100 + index,
									content: '<p>活动时间：2026/11/20 12:00 - 2026/12/1 11:59</p>',
								}),
							),
						}),
					} as Response;
				}),
			);

			const result = await getUmamusumeEventData('https://api.example.com/api/umamusume');
			expect(result).toHaveLength(listCount);
			expect(urls[0]).toContain('isNew=1');
			expect(urls[0]).toContain('pageSize=20');
			expect(urls[0]).toContain('pageNum=1');
			expect(urls.filter((url) => url.includes('pageSize=20') && url.includes('isNew=1'))).toHaveLength(1);
			const detailCount = urls.filter((url) => url === 'https://api.example.com/api/umamusume').length;
			expect(detailCount).toBeLessThanOrEqual(20);
			expect(detailCount).toBeGreaterThan(0);
			vi.unstubAllGlobals();
		});
	});
});
