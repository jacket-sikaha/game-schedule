import { AutoRouter, cors, error, IRequest, json, StatusError } from 'itty-router';
import { getAKEventWithDetailTime } from './Arknights/util';
import { BAData } from './ba/DataType';
import { handleBAData } from './ba/util';
import { CalendarActivityResult, checkCacheResults, destroyRedisClient, setCacheResults, test } from './common';
import { getFGOEventWithDetailTime, getImgBanner } from './fgo/util';
import { GamekeeData } from './gamekee/DataType';
import { handleGamekeeEvent } from './gamekee/util';
import { getPunishingEvent, getWutheringWavesEvent } from './kuro-game/util';
import { getSnowBreakEventData } from './snowbreak/util';

// create the CORS pair
const { preflight, corsify } = cors({
	allowMethods: ['GET', 'PATCH', 'POST', 'OPTION'],
	origin: [
		'https://gameevent-frontend.pages.dev',
		'http://localhost:5173',
		'https://d7b65e5b.gameevent-frontend.pages.dev',
		'https://gameevent.sikara.asia',
		'https://ge.lee-sikaha.cloudns.ch',
	],
	// headers: {
	//   'my-funky-header': 'is pretty funky indeed',
	// },
});
export type CFArgs = [Env, ExecutionContext];

const router = AutoRouter<IRequest, CFArgs>({
	before: [preflight], // <-- put preflight upstream
	finally: [corsify, destroyRedisClient], // <-- put corsify downstream
});

router
	.all('*', checkCacheResults)
	// GET todos - just return some data!
	.get('/todos', (_, env, ctx) => env.VITE_PCR_API)

	.get('/pcr', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const response = await fetch(env.VITE_PCR_API);
			const data: any = await response.json();
			return data;
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/genshin', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const response = await fetch(env.VITE_GENSHIN_API);
			const genshin: any = await response.json();
			const data = genshin.data?.list.find((item: { type_id: number }) => item.type_id === 1);
			return data;
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/starrail', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const response = await fetch(env.VITE_STARRAIL_API);
			const starrail: any = await response.json();
			const data = starrail.data?.list.find((item: { type_id: number }) => item.type_id === 4);
			return data;
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/fgo', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const data = await getFGOEventWithDetailTime(env.VITE_FGOEventList_API);
			return { code: 200, data };
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/ak', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const data = await getAKEventWithDetailTime(env.VITE_AKEventList_API, env.VITE_AKEventDetail_API);
			return { code: 200, data };
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/mc', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const data = await getWutheringWavesEvent(env);
			console.log('_._cashed:', _._cashed);
			return { code: 200, data };
		} catch (error: any) {
			console.log('error:', error);
			throw new StatusError(500, error.message);
		}
	})

	.get('/pns', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const data = await getPunishingEvent(env.VITE_KURO_WIKI_GAME_API);
			return { code: 200, data };
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/ba', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			// const tmp = await fetch('https://bluearchive-cn.com/api/news/list?pageIndex=1&pageNum=350&type=1');
			const tmp = await fetch(env.VITE_BA_API);
			const res: BAData = await tmp.json();
			let data = {
				code: 200,
				data: handleBAData(res),
			};
			return data;
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/ba-jp', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const tmp = await fetch(env.VITE_BA_JP_API, {
				headers: {
					'game-alias': 'ba',
				},
			});
			const res: GamekeeData = await tmp.json();
			let data = {
				code: 200,
				data: handleGamekeeEvent(res.data),
			};
			return data;
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/nikke', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const tmp = await fetch(env.VITE_NIKKE_API, {
				headers: {
					'game-alias': 'nikke',
				},
			});
			const res: GamekeeData = await tmp.json();
			let data = {
				code: 200,
				data: handleGamekeeEvent(res.data),
			};
			return data;
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/cbjq', async (_, env, ctx): Promise<CalendarActivityResult> => {
		try {
			const data = await getSnowBreakEventData(env.VITE_SNOWBREAK_API);

			return {
				code: 200,
				data,
			};
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	.get('/imgfromhtml', async (_) => {
		try {
			const data = getImgBanner(`<p class="p">
			<img src="//i0.hdslb.com/bfs/game/e0dece0d867b9dd83e9030d289a6ddae1a9590f7.png" alt="" />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/4eda66d6f82b88c2903ff8a660cecac077c0821a.png" alt="" />
		</p>
		<p class="p">
			<span style="color:#003399;">◆</span>活动时间<span style="color:#003399;">◆</span>
		</p>
		<p class="p">
			2024年7月25日（周四）维护后~8月11日（周日）13:59为止
		</p>
		<p class="p">
			<br />
		</p>
		<p class="p">
			<img src="//i0.hdslb.com/bfs/game/646d58b443193dd98e95b9452749b893a3335a93.png" alt="" />
		</p>
		`);
			return { code: 200, data };
		} catch (error: any) {
			throw new StatusError(500, error.message);
		}
	})

	// *any* HTTP method works, even ones you make up
	.puppy('/secret', () => 'Because why not?')

	// return a 404 for anything else
	.all('*', () => error(404));

export { router };
