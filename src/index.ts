import { RouterType } from 'itty-router';
import { buildRouter } from './router';

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
