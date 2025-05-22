import { RouterType } from 'itty-router';
import { buildRouter } from './router';
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

export default {
	async fetch(request: Request, env: Env2): Promise<Response> {
		// return new Response('Hello World!');
		console.log('game-events-calendar-backend is running...');
		if (env.router === undefined) {
			env.router = buildRouter(env);
		}

		return env.router.fetch(request);
	},
} satisfies ExportedHandler<Env>;
