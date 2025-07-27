import { env } from 'cloudflare:workers';
import Redis from 'ioredis';

export enum RequestCashedStatus {
	NOT_CASHED = 0,
	CASHED = 1,
}
export const getRedis = () =>
	new Redis({
		username: 'default',
		password: env.REDIS_PASSWD,
		host: 'redis-19292.crce178.ap-east-1-1.ec2.redns.redis-cloud.com',
		port: 19292,
		retryStrategy(times) {
			const delay = Math.min(times * 50, 2000);
			return delay;
		},
		autoResendUnfulfilledCommands: false,
		reconnectOnError: (err) => {
			const targetError = 'READONLY';
			if (err.message.includes(targetError)) {
				// Only reconnect when the error contains "READONLY"
				return true; // or `return 1;`
			}
			return false;
		},
	});

export class RedisInstance {
	private static instance: Redis | null = null;

	static getInstance() {
		if (!this.instance) {
			this.instance = getRedis();
		}
		return this.instance;
	}

	static destroyed() {
		this.instance?.disconnect();
		this.instance = null;
	}
}
