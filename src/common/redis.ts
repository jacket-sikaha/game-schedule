import Redis from 'ioredis';

export enum RequestCashedStatus {
	NOT_CASHED = 0,
	CASHED = 1,
}
export const getRedis = () =>
	new Redis({
		username: 'default',
		password: 'R6vfkTj5x2renwQokct1hTgQ6zPzxKut',
		host: 'redis-13213.c62.us-east-1-4.ec2.redns.redis-cloud.com',
		port: 13213,
		retryStrategy(times) {
			console.log('retryStrategy1111111111111111:');
			const delay = Math.min(times * 50, 2000);
			return delay;
		},
		autoResendUnfulfilledCommands: false,
		reconnectOnError: (err) => {
			console.log('err0000000000000000000000:', err);
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
			console.log('create redis instance:');
			this.instance = getRedis();
		}
		return this.instance;
	}

	static destroyed() {
		console.log('destroyed==================');
		this.instance?.disconnect();
		this.instance = null;
	}
}
