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
