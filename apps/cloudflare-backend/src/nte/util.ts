import { TIME_FORMAT } from '@/common';
import dayjs from 'dayjs';
import { TajiduoPost, TajiduoResponse } from './DataType';

// 帖子链接（web 端 hash 路由）
const postLink = (postId: number) => `https://www.tajiduo.com/bbs/index.html#/post?postId=${postId}`;

// 只认「活动时间」行，避免误匹配剧情文本
const TIME_KEYWORD = /活动时间/;

/**
 * 规范化时间行：～/—/~ → -；点号日期 → 斜杠（H 格式：2025.12.23 9:00 - 2026.1.23 11:00）
 */
const normalizeLine = (line: string) => line.replace(/[～—~]/g, '-').replace(/(\d{4})\.(\d{1,2})\.(\d{1,2})/g, '$1/$2/$3');

const TIME = '\\d{1,2}:\\d{2}(?::\\d{2})?';
const FULL_DATE = '\\d{4}/\\d{1,2}/\\d{1,2}';
// A（带秒）/ B（无秒）/ H（点号，规范化后同构）：两端完整日期时间
const FULL_REG = new RegExp(`(${FULL_DATE})\\s+(${TIME})\\s*-\\s*(${FULL_DATE})\\s+(${TIME})`);
// A变体：2026/07/23 版本更新后 - 2026/08/13 05:59:59（起点有日期无时刻）
const VERSION_UPDATE_REG = new RegExp(`(${FULL_DATE})\\s*版本更新后\\s*-\\s*(${FULL_DATE})\\s+(${TIME})`);

const d = (s: string) => dayjs(s);

/**
 * 从帖子正文提取活动时间区间。
 * 只处理两端自带完整年份的写法（跨年由日期本身表达，无需推断）：
 * - A：2026/09/04 5:00:00 - 2026/09/18 4:59:59
 * - B：2026/08/03 05:00 - 2026/08/10 04:59
 * - A变体：2026/07/23 版本更新后 - 2026/08/13 05:59:59（起点默认 05:00）
 * - H：2025.12.23 9:00 - 2026.1.23 11:00（规范化后同 A/B）
 * @returns [start, end]，未匹配返回 null
 */
export const matchEventTime = (content: string): [dayjs.Dayjs, dayjs.Dayjs] | null => {
	const lines = content.split('\n');
	for (const rawLine of lines) {
		if (!TIME_KEYWORD.test(rawLine)) continue;
		const line = normalizeLine(rawLine);

		let m = line.match(VERSION_UPDATE_REG);
		if (m) {
			// 「版本更新后」无具体时刻，取当天 05:00（游戏日常刷新时间）
			const start = d(`${m[1]} 05:00`);
			const end = d(`${m[2]} ${m[3]}`);
			if (start.isValid() && end.isValid()) return [start, end];
		}

		m = line.match(FULL_REG);
		if (m) {
			const start = d(`${m[1]} ${m[2]}`);
			const end = d(`${m[3]} ${m[4]}`);
			if (start.isValid() && end.isValid()) return [start, end];
		}
	}
	return null;
};

const getBanner = (post: TajiduoPost): string => {
	if (post.images?.length) return post.images[0].url;
	if (post.vods?.length) return post.vods[0].cover;
	return '';
};

/**
 * 处理塔吉多官方资讯列表，筛出含活动时间的帖子转为日历活动
 */
export const handleNtePosts = (posts: TajiduoPost[]) => {
	return posts
		.filter((post) => !post.isDelete)
		.map((post) => {
			const times = matchEventTime(post.content);
			if (!times) return null;
			const [start, end] = times;
			return {
				id: post.postId,
				title: post.subject.trim(),
				start_time: start.format(TIME_FORMAT),
				end_time: end.format(TIME_FORMAT),
				banner: getBanner(post),
				content: post.content,
				publishTime: dayjs(post.sendTime || post.createTime).format(TIME_FORMAT),
				linkUrl: postLink(post.postId),
			};
		})
		.filter((item) => !!item);
};

const fetchPage = async (apiUrl: string, version: number): Promise<TajiduoResponse> => {
	const url = new URL(apiUrl);
	url.searchParams.set('version', String(version));
	const res = await fetch(url);
	if (!res.ok) throw new Error(`NTE api request failed: ${res.status}`);
	const json = (await res.json()) as TajiduoResponse;
	if (!json.ok || json.code !== 0) throw new Error(`NTE api error: ${json.msg}`);
	return json;
};

/**
 * 拉取塔吉多官方资讯并解析活动。
 * 分页为游标式：响应 data.version 即下一页的 version 参数（= 本页最后一帖的 sendTime）
 */
export const getNteEventData = async (apiUrl: string, pages = 3) => {
	const allPosts: TajiduoPost[] = [];
	let version = 0;
	for (let i = 0; i < pages; i++) {
		const json = await fetchPage(apiUrl, version);
		allPosts.push(...json.data.posts);
		if (!json.data.hasMore || !json.data.version) break;
		version = json.data.version;
	}
	return handleNtePosts(allPosts);
};
