import { Env } from '@/worker';
import { KuroWikiGameData } from './DataType';

// wuthering-waves
const MC_TARGET_TITLE = '版本活动';
const MC_Wiki_type = '9';
const PNS_TARGET_TITLE = '热门活动';
const PNS_Wiki_type = '2';

export const getWutheringWavesEvent = async (env: Env) => {
	const res = (await (
		await fetch(env.VITE_KURO_WIKI_GAME_API, {
			method: 'POST',
			headers: {
				Wiki_type: MC_Wiki_type,
			},
		})
	).json()) as KuroWikiGameData;
	const target = res.data.contentJson.sideModules.find(({ title }) => title === MC_TARGET_TITLE);
	if (!target) {
		return [];
	}
	const catalogueId = target.more.linkConfig.catalogueId;
	if (catalogueId) {
		const res = await fetch(`${env.VITE_KURO_WIKI_CATALOGUE_API}?catalogueId=${catalogueId}`, {
			method: 'POST',
			body: JSON.stringify({
				catalogueId,
				page: 1,
				limit: 100,
			}),
		});
		console.log('res:', res);
	}
	return target?.content
		.filter(({ countDown }) => !!countDown)
		.map((item) => {
			const {
				countDown,
				title,
				linkConfig: { entryId, linkUrl },
				contentUrl: banner,
			} = item;
			const [start_time, end_time] = countDown!.dateRange;
			return { id: entryId, title, start_time, end_time, banner, linkUrl };
		});
};

// 战双帕弥什
export const getPunishingEvent = async (url: string) => {
	const res = (await (
		await fetch(url, {
			method: 'POST',
			headers: {
				Wiki_type: PNS_Wiki_type,
			},
		})
	).json()) as KuroWikiGameData;
	const target = res.data.contentJson.sideModules.find(({ title }) => title === PNS_TARGET_TITLE);
	if (!target) {
		return [];
	}
	return target?.content
		.filter(({ countDown }) => !!countDown)
		.map((item, i) => {
			const {
				countDown,
				title,
				linkConfig: { entryId },
				contentUrl: banner,
			} = item;
			const [start_time, end_time] = countDown!.dateRange;
			return { id: entryId ?? i, title, start_time, end_time, banner };
		});
};
