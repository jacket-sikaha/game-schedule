import {
	createClient,
	createClientPool,
	RedisClientPoolType,
	RedisClientType,
	RedisFunctions,
	RedisModules,
	RedisScripts,
	RespVersions,
} from 'redis';

// redis-pool.js
let poolInstance: RedisClientType | null = null;

// export const getRedisPool = () => {
// 	console.log('poolInstance:', !!poolInstance);
// 	if (!poolInstance) {
// 		// cf worker貌似是无状态执行的，因此不适用数据库连接池
// 		poolInstance = createClientPool(
// 			{
// 				username: 'default',
// 				password: 'R6vfkTj5x2renwQokct1hTgQ6zPzxKut',
// 				socket: {
// 					host: 'redis-13213.c62.us-east-1-4.ec2.redns.redis-cloud.com',
// 					port: 13213,
// 				},
// 			},
// 			{ minimum: 3, maximum: 10 }
// 		);
// 	}
// 	return poolInstance;
// };

export const getRedisPool = async () => {
	console.log('poolInstance:', !!poolInstance);
	if (!poolInstance) {
		// cf worker貌似是无状态执行的，因此不适用数据库连接池
		poolInstance = await createClient({
			username: 'default',
			password: 'R6vfkTj5x2renwQokct1hTgQ6zPzxKut',
			socket: {
				host: 'redis-13213.c62.us-east-1-4.ec2.redns.redis-cloud.com',
				port: 13213,
			},
		}).connect();
	}
	return poolInstance!;
};

export const ddd = () => {
	poolInstance?.close();
	poolInstance = null;
};
