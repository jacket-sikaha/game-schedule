import { RouterType } from 'itty-router';
import { router } from './router';
import customParseFormat from 'dayjs/plugin/customParseFormat'; // ES 2015
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Shanghai');

export interface Env2 extends Env {
	router?: RouterType;
}

// export default {
// async fetch(request: Request, env: Env2): Promise<Response> {
// 	// return new Response('Hello World!');
// 	// const pool = createClientPool(
// 	// 	{
// 	// 		username: 'default',
// 	// 		password: 'R6vfkTj5x2renwQokct1hTgQ6zPzxKut',
// 	// 		socket: {
// 	// 			host: 'redis-13213.c62.us-east-1-4.ec2.redns.redis-cloud.com',
// 	// 			port: 13213,
// 	// 		},
// 	// 	},
// 	// 	{ minimum: 3, maximum: 10 }
// 	// );

// 	// const GET = await pool?.GET('test');
// 	// const res = await pool?.set('test', Math.random().toString(), {
// 	// 	EX: 60,
// 	// });
// 	// console.log('pool:', { pool, res, GET });
// 	console.log('game-events-calendar-backend is running...');
// 	const pool = getRedisPool();
// 	if (env.router === undefined) {
// 		env.router = buildRouter(env);
// 	}

// 	return env.router.fetch(request, pool);
// },
// } satisfies ExportedHandler<Env>;
console.log('game-events-calendar-backend is running...');

export default router satisfies ExportedHandler<Env>;
