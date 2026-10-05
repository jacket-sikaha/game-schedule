import { CFArgs } from '@/router';
import dayjs from 'dayjs';
import { IRequest, json, RequestHandler, ResponseHandler } from 'itty-router';
import { RedisInstance, RequestCashedStatus } from './redis';

export declare interface CalendarActivityResult {
	code: number;
	msg?: string;
	data: {
		id: number | string;
		title?: string;
		start_time: string;
		end_time: string;
		banner?: string;
		content?: string;
		range?: string;
		isEnd?: boolean;
		linkUrl?: string;
		[key: string]: any;
	}[];
}

export const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

/**
 * 确定性活动 ID —— iCal 订阅 UID 稳定性的前置条件。
 *
 * 同一活动（gameKey + 上游 id + 标题）必须始终生成相同 id，
 * 绝不使用随机数 / 当前时间戳 / 数组下标兜底（见 docs/research/ical-feasibility.md §5.2：
 * 随机/时间戳 id 会导致订阅客户端每次刷新复制出一整套新事件）。
 *
 * 设计要点：
 * - 标题参与 hash：上游存在同 entryId 的多条活动（鸣潮实测 id 重复）、
 *   以及缺失 entryId 的条目（战双实测），标题能把它们区分开。
 * - 标题做空白符归一化（含全角空格），避免上游微调排版导致 id 漂移。
 * - 用同步 FNV-1a 而非 crypto.subtle：后者是异步 API，无法在同步 map 回调中使用；
 *   该实现与 docs/research/prototype/ics.mjs 中已验证的 makeUid 保持一致。
 */
export const stableId = (
	gameKey: string,
	upstreamId: number | string | null | undefined,
	title: string,
): string => {
	const normalizeTitle = (s: string) =>
		s.replace(/\s+/g, ' ').replace(/\u3000/g, ' ').trim().toLowerCase();
	const raw = `${gameKey}:${upstreamId ?? ''}:${normalizeTitle(String(title ?? ''))}`;
	let h = 0x811c9dc5;
	for (let i = 0; i < raw.length; i++) {
		h ^= raw.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return `${gameKey}_${h.toString(16).padStart(8, '0')}`;
};

export const getShanghaiDate = (date?: dayjs.ConfigType) => dayjs(date).tz('Asia/Shanghai');

export const checkCacheResults: RequestHandler<IRequest, CFArgs> = async (request: IRequest, env, ctx) => {
	const path = new URL(request.url).pathname.slice(1);
	try {
		// 添加Redis操作超时
		const res = await Promise.race([
			RedisInstance.getInstance().get(path),
			new Promise((_, reject) => setTimeout(() => reject(new Error('Redis get timeout')), 2000)),
		]);
		let data = res ? JSON.parse(res as string) : null;
		if (data) {
			request._cashed = RequestCashedStatus.CASHED;
			return json(data, { status: 200, headers: { 'Cache-Redis': 'sikara' } });
		}
		// 缓存未命中 ，标记用于后续缓存
		request._cashed = RequestCashedStatus.NOT_CASHED;
	} catch (error) {
		console.error('Redis get error:', error);
	}
};

export const test = async (request: IRequest): Promise<any> => {
	const path = new URL(request.url).pathname.slice(1);
	try {
		// 添加Redis操作超时
		const res = await Promise.race([
			RedisInstance.getInstance().get(path),
			new Promise((_, reject) => setTimeout(() => reject(new Error('Redis get timeout')), 2000)),
		]);
		return res ? JSON.parse(res as string) : null;
	} catch (error) {
		console.error('Redis get error:', error);
		return null;
	}
};
export const setCacheResults = async (key: string, data: CalendarActivityResult, ex = 300) => {
	try {
		// 添加Redis操作超时
		const res = await Promise.race([
			RedisInstance.getInstance().set(key, JSON.stringify(data), 'EX', ex),
			new Promise((_, reject) => setTimeout(() => reject(new Error('Redis set timeout')), 2000)),
		]);
	} catch (error) {
		console.error('Redis set error:', error);
	}
};

export const logger: ResponseHandler = (response, request) => {
	console.log(response.body, request.url, 'at', new Date().toLocaleString());
};

export const destroyRedisClient: ResponseHandler<Response, IRequest> = async (res, req) => {
	const path = new URL(req.url).pathname.slice(1);
	const data = (await res.clone().json()) as CalendarActivityResult;
	console.log('req._cashed:', req._cashed);
	// 缓存未命中且接口返回正常，直接设置缓存
	if (!req._cashed && res.status < 300 && res.status >= 200) {
		await setCacheResults(path, data);
	}
	RedisInstance.destroyed();
};
