import { stableId } from '@/common';
import { CatalogueData, KuroWikiGameData } from './DataType';

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
	const imgMap = new Map<number, string>();
	if (catalogueId) {
		const { data } = (await fetch(`${env.VITE_KURO_WIKI_CATALOGUE_API}?catalogueId=${catalogueId}&page=1&limit=1000`, {
			method: 'POST',
			headers: { Wiki_type: MC_Wiki_type, 'Content-Type': 'application/x-www-form-urlencoded' },
		}).then((res) => res.json())) as CatalogueData;
		data.results.records.forEach((item) => {
			imgMap.set(item.entryId, item.content.contentUrl);
		});
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
			// entryId 缺失时不再用当前时间戳兜底（会导致订阅刷新后 id 全变）；
			// 标题参与 hash，同时打散上游同 entryId 的重复条目（实测存在）
			return { id: stableId('mc', entryId, title), title, start_time, end_time, banner: imgMap.get(+(entryId ?? 0)) ?? banner, linkUrl };
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
		.map((item) => {
			const {
				countDown,
				title,
				linkConfig: { entryId },
				contentUrl: banner,
			} = item;
			const [start_time, end_time] = countDown!.dateRange;
			// entryId 缺失时不再用数组下标兜底（上游调整条目顺序会导致 id 漂移）
			return { id: stableId('pns', entryId, title), title, start_time, end_time, banner };
		});
};
