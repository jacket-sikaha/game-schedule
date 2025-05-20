import { RouterType } from 'itty-router';
import { buildRouter } from './router';

export interface Env {
	VITE_PCR_API: string;
	VITE_GENSHIN_API: string;
	VITE_STARRAIL_API: string;
	VITE_FGOEventList_API: string;
	VITE_AKEventList_API: string;
	VITE_AKEventDetail_API: string;
	VITE_KURO_WIKI_GAME_API: string;
	VITE_KURO_WIKI_CATALOGUE_API: string;
	router?: RouterType;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// return new Response('Hello World!');
		console.log('game-events-calendar-backend is running...');
		if (env.router === undefined) {
			env.router = buildRouter(env);
		}

		return env.router.fetch(request);
	},
} satisfies ExportedHandler<Env>;
